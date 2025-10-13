#!/bin/bash

# KIRO ERP Deployment Script
# This script handles deployment to different environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="development"
SKIP_BUILD=false
SKIP_TESTS=false
VERBOSE=false

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --environment ENV    Target environment (development|production|performance)"
    echo "  -s, --skip-build        Skip building Docker images"
    echo "  -t, --skip-tests        Skip running tests"
    echo "  -v, --verbose           Enable verbose output"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -e production"
    echo "  $0 --environment development --skip-tests"
    echo "  $0 -e performance --verbose"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -s|--skip-build)
            SKIP_BUILD=true
            shift
            ;;
        -t|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|production|performance)$ ]]; then
    print_error "Invalid environment: $ENVIRONMENT"
    print_error "Valid environments: development, production, performance"
    exit 1
fi

print_status "Starting deployment to $ENVIRONMENT environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if required files exist
COMPOSE_FILE="infrastructure/docker/docker-compose.yml"
if [[ "$ENVIRONMENT" == "production" ]]; then
    COMPOSE_FILE="infrastructure/docker/docker-compose.prod.yml"
elif [[ "$ENVIRONMENT" == "performance" ]]; then
    COMPOSE_FILE="infrastructure/docker/docker-compose.performance.yml"
fi

if [[ ! -f "$COMPOSE_FILE" ]]; then
    print_error "Docker Compose file not found: $COMPOSE_FILE"
    exit 1
fi

# Check environment variables for production
if [[ "$ENVIRONMENT" == "production" || "$ENVIRONMENT" == "performance" ]]; then
    if [[ ! -f ".env.production" ]]; then
        print_warning "Production environment file (.env.production) not found"
        print_warning "Make sure to set required environment variables"
    fi
fi

# Run tests if not skipped
if [[ "$SKIP_TESTS" == false ]]; then
    print_status "Running tests..."
    if [[ "$VERBOSE" == true ]]; then
        npm run test -- --run
    else
        npm run test -- --run > /dev/null 2>&1
    fi
    print_success "Tests passed"
fi

# Build Docker images if not skipped
if [[ "$SKIP_BUILD" == false ]]; then
    print_status "Building Docker images..."
    if [[ "$VERBOSE" == true ]]; then
        docker-compose -f "$COMPOSE_FILE" build
    else
        docker-compose -f "$COMPOSE_FILE" build > /dev/null 2>&1
    fi
    print_success "Docker images built successfully"
fi

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f "$COMPOSE_FILE" down > /dev/null 2>&1 || true

# Start services
print_status "Starting services..."
if [[ "$VERBOSE" == true ]]; then
    docker-compose -f "$COMPOSE_FILE" up -d
else
    docker-compose -f "$COMPOSE_FILE" up -d > /dev/null 2>&1
fi

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 10

# Check service health
FAILED_SERVICES=()
SERVICES=$(docker-compose -f "$COMPOSE_FILE" ps --services)

for service in $SERVICES; do
    if [[ "$VERBOSE" == true ]]; then
        print_status "Checking health of $service..."
    fi
    
    # Check if container is running
    if ! docker-compose -f "$COMPOSE_FILE" ps "$service" | grep -q "Up"; then
        FAILED_SERVICES+=("$service")
        continue
    fi
    
    # Additional health checks for specific services
    case $service in
        postgres|postgres-primary)
            if ! docker-compose -f "$COMPOSE_FILE" exec -T "$service" pg_isready > /dev/null 2>&1; then
                FAILED_SERVICES+=("$service")
            fi
            ;;
        redis|redis-cluster)
            if ! docker-compose -f "$COMPOSE_FILE" exec -T "$service" redis-cli ping > /dev/null 2>&1; then
                FAILED_SERVICES+=("$service")
            fi
            ;;
        app|api-1|api-2|api-3)
            # Check if API is responding
            sleep 5
            if ! curl -f http://localhost:4000/health > /dev/null 2>&1; then
                FAILED_SERVICES+=("$service")
            fi
            ;;
    esac
done

# Report results
if [[ ${#FAILED_SERVICES[@]} -eq 0 ]]; then
    print_success "All services are healthy!"
    print_success "Deployment to $ENVIRONMENT completed successfully"
    
    # Show service URLs
    echo ""
    print_status "Service URLs:"
    case $ENVIRONMENT in
        development)
            echo "  Web App: http://localhost:3000"
            echo "  API: http://localhost:4000"
            echo "  API Health: http://localhost:4000/health"
            echo "  MinIO Console: http://localhost:9001"
            echo "  Elasticsearch: http://localhost:9200"
            ;;
        production|performance)
            echo "  Web App: https://app.kiro-erp.com"
            echo "  API: https://api.kiro-erp.com"
            echo "  API Health: https://api.kiro-erp.com/health"
            if [[ "$ENVIRONMENT" == "performance" ]]; then
                echo "  Grafana: http://localhost:3001"
                echo "  Prometheus: http://localhost:9090"
            fi
            ;;
    esac
else
    print_error "Some services failed to start properly:"
    for service in "${FAILED_SERVICES[@]}"; do
        print_error "  - $service"
    done
    
    print_status "Checking logs for failed services..."
    for service in "${FAILED_SERVICES[@]}"; do
        echo ""
        print_status "Logs for $service:"
        docker-compose -f "$COMPOSE_FILE" logs --tail=20 "$service"
    done
    
    exit 1
fi

# Show resource usage
if [[ "$VERBOSE" == true ]]; then
    echo ""
    print_status "Resource usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
fi

print_success "Deployment completed successfully!"
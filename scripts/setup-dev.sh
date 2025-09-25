#!/bin/bash

# KIRO ERP Development Environment Setup Script
# This script sets up the complete development environment

set -e

echo "🚀 Setting up KIRO ERP Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if required tools are installed
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ and try again."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker and try again."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose and try again."
        exit 1
    fi
    
    print_success "All requirements satisfied"
}

# Create environment file if it doesn't exist
setup_environment() {
    print_status "Setting up environment variables..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        print_success "Created .env file from .env.example"
        print_warning "Please update the .env file with your specific configuration"
    else
        print_warning ".env file already exists, skipping creation"
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm ci
    print_success "Dependencies installed successfully"
}

# Setup Git hooks
setup_git_hooks() {
    print_status "Setting up Git hooks..."
    npm run prepare
    print_success "Git hooks configured successfully"
}

# Start Docker services
start_docker_services() {
    print_status "Starting Docker services..."
    
    # Check if services are already running
    if docker-compose ps | grep -q "Up"; then
        print_warning "Some Docker services are already running"
        docker-compose down
    fi
    
    docker-compose up -d
    
    # Wait for services to be healthy
    print_status "Waiting for services to be ready..."
    
    # Wait for PostgreSQL
    until docker-compose exec postgres pg_isready -U kiro_user -d kiro_erp_dev &> /dev/null; do
        echo -n "."
        sleep 1
    done
    
    # Wait for Redis
    until docker-compose exec redis redis-cli ping &> /dev/null; do
        echo -n "."
        sleep 1
    done
    
    echo ""
    print_success "All Docker services are ready"
}

# Run database migrations
setup_database() {
    print_status "Setting up database..."
    
    # Generate database schema
    npm run db:generate
    
    # Run migrations
    npm run db:migrate
    
    # Seed database with initial data
    npm run db:seed
    
    print_success "Database setup completed"
}

# Verify setup
verify_setup() {
    print_status "Verifying setup..."
    
    # Check if all services are running
    SERVICES=("postgres" "redis" "timescaledb" "elasticsearch" "minio")
    
    for service in "${SERVICES[@]}"; do
        if docker-compose ps "$service" | grep -q "Up"; then
            print_success "$service is running"
        else
            print_error "$service is not running"
            exit 1
        fi
    done
    
    # Run linting
    npm run lint
    
    # Run tests
    npm run test -- --run
    
    print_success "Setup verification completed"
}

# Main execution
main() {
    echo "=================================================="
    echo "🏗️  KIRO ERP Development Environment Setup"
    echo "=================================================="
    
    check_requirements
    setup_environment
    install_dependencies
    setup_git_hooks
    start_docker_services
    setup_database
    verify_setup
    
    echo ""
    echo "=================================================="
    print_success "🎉 Development environment setup completed!"
    echo "=================================================="
    echo ""
    echo "Next steps:"
    echo "1. Update your .env file with appropriate values"
    echo "2. Run 'npm run dev' to start the development servers"
    echo "3. Visit http://localhost:3000 for the frontend"
    echo "4. Visit http://localhost:4000/graphql for the GraphQL playground"
    echo ""
    echo "Available services:"
    echo "- PostgreSQL: localhost:5432"
    echo "- TimescaleDB: localhost:5433"
    echo "- Redis: localhost:6379"
    echo "- Elasticsearch: localhost:9200"
    echo "- MinIO: localhost:9000 (Console: localhost:9001)"
    echo ""
}

# Run main function
main "$@"
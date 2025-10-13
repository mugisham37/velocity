# KIRO ERP Deployment Script for Windows PowerShell
# This script handles deployment to different environments

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("development", "production", "performance")]
    [string]$Environment = "development",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipTests,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose,
    
    [Parameter(Mandatory=$false)]
    [switch]$Help
)

# Function to write colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Show usage information
function Show-Usage {
    Write-Host "Usage: .\deploy.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Environment ENV     Target environment (development|production|performance)"
    Write-Host "  -SkipBuild          Skip building Docker images"
    Write-Host "  -SkipTests          Skip running tests"
    Write-Host "  -Verbose            Enable verbose output"
    Write-Host "  -Help               Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\deploy.ps1 -Environment production"
    Write-Host "  .\deploy.ps1 -Environment development -SkipTests"
    Write-Host "  .\deploy.ps1 -Environment performance -Verbose"
}

# Show help if requested
if ($Help) {
    Show-Usage
    exit 0
}

Write-Status "Starting deployment to $Environment environment..."

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Error "Docker is not running. Please start Docker and try again."
    exit 1
}

# Determine compose file
$ComposeFile = "infrastructure/docker/docker-compose.yml"
switch ($Environment) {
    "production" { $ComposeFile = "infrastructure/docker/docker-compose.prod.yml" }
    "performance" { $ComposeFile = "infrastructure/docker/docker-compose.performance.yml" }
}

# Check if compose file exists
if (-not (Test-Path $ComposeFile)) {
    Write-Error "Docker Compose file not found: $ComposeFile"
    exit 1
}

# Check environment variables for production
if ($Environment -eq "production" -or $Environment -eq "performance") {
    if (-not (Test-Path ".env.production")) {
        Write-Warning "Production environment file (.env.production) not found"
        Write-Warning "Make sure to set required environment variables"
    }
}

# Run tests if not skipped
if (-not $SkipTests) {
    Write-Status "Running tests..."
    try {
        if ($Verbose) {
            pnpm run test -- --run
        } else {
            pnpm run test -- --run 2>&1 | Out-Null
        }
        Write-Success "Tests passed"
    } catch {
        Write-Error "Tests failed"
        exit 1
    }
}

# Build Docker images if not skipped
if (-not $SkipBuild) {
    Write-Status "Building Docker images..."
    try {
        if ($Verbose) {
            docker-compose -f $ComposeFile build
        } else {
            docker-compose -f $ComposeFile build 2>&1 | Out-Null
        }
        Write-Success "Docker images built successfully"
    } catch {
        Write-Error "Failed to build Docker images"
        exit 1
    }
}

# Stop existing containers
Write-Status "Stopping existing containers..."
try {
    docker-compose -f $ComposeFile down 2>&1 | Out-Null
} catch {
    # Ignore errors when stopping containers
}

# Start services
Write-Status "Starting services..."
try {
    if ($Verbose) {
        docker-compose -f $ComposeFile up -d
    } else {
        docker-compose -f $ComposeFile up -d 2>&1 | Out-Null
    }
} catch {
    Write-Error "Failed to start services"
    exit 1
}

# Wait for services to be healthy
Write-Status "Waiting for services to be healthy..."
Start-Sleep -Seconds 10

# Check service health
$FailedServices = @()
$Services = docker-compose -f $ComposeFile ps --services

foreach ($Service in $Services) {
    if ($Verbose) {
        Write-Status "Checking health of $Service..."
    }
    
    # Check if container is running
    $ContainerStatus = docker-compose -f $ComposeFile ps $Service
    if ($ContainerStatus -notmatch "Up") {
        $FailedServices += $Service
        continue
    }
    
    # Additional health checks for specific services
    switch ($Service) {
        { $_ -match "postgres" } {
            try {
                docker-compose -f $ComposeFile exec -T $Service pg_isready 2>&1 | Out-Null
            } catch {
                $FailedServices += $Service
            }
        }
        { $_ -match "redis" } {
            try {
                docker-compose -f $ComposeFile exec -T $Service redis-cli ping 2>&1 | Out-Null
            } catch {
                $FailedServices += $Service
            }
        }
        { $_ -match "app|api-" } {
            Start-Sleep -Seconds 5
            try {
                Invoke-WebRequest -Uri "http://localhost:4000/health" -UseBasicParsing | Out-Null
            } catch {
                $FailedServices += $Service
            }
        }
    }
}

# Report results
if ($FailedServices.Count -eq 0) {
    Write-Success "All services are healthy!"
    Write-Success "Deployment to $Environment completed successfully"
    
    # Show service URLs
    Write-Host ""
    Write-Status "Service URLs:"
    switch ($Environment) {
        "development" {
            Write-Host "  Web App: http://localhost:3000"
            Write-Host "  API: http://localhost:4000"
            Write-Host "  API Health: http://localhost:4000/health"
            Write-Host "  MinIO Console: http://localhost:9001"
            Write-Host "  Elasticsearch: http://localhost:9200"
        }
        { $_ -eq "production" -or $_ -eq "performance" } {
            Write-Host "  Web App: https://app.kiro-erp.com"
            Write-Host "  API: https://api.kiro-erp.com"
            Write-Host "  API Health: https://api.kiro-erp.com/health"
            if ($Environment -eq "performance") {
                Write-Host "  Grafana: http://localhost:3001"
                Write-Host "  Prometheus: http://localhost:9090"
            }
        }
    }
} else {
    Write-Error "Some services failed to start properly:"
    foreach ($Service in $FailedServices) {
        Write-Error "  - $Service"
    }
    
    Write-Status "Checking logs for failed services..."
    foreach ($Service in $FailedServices) {
        Write-Host ""
        Write-Status "Logs for $Service:"
        docker-compose -f $ComposeFile logs --tail=20 $Service
    }
    
    exit 1
}

# Show resource usage
if ($Verbose) {
    Write-Host ""
    Write-Status "Resource usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
}

Write-Success "Deployment completed successfully!"
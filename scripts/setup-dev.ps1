# KIRO ERP Development Environment Setup Script (PowerShell)
# This script sets up the complete development environment

param(
    [switch]$SkipDocker,
    [switch]$SkipDatabase,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    White = "White"
}

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Colors.Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Colors.Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Colors.Red
}

function Test-Requirements {
    Write-Status "Checking system requirements..."
    
    # Check Node.js version
    try {
        $nodeVersion = node --version
        $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
        if ($versionNumber -lt 18) {
            Write-Error "Node.js version 18+ is required. Current version: $nodeVersion"
            exit 1
        }
        Write-Success "Node.js version: $nodeVersion"
    }
    catch {
        Write-Error "Node.js is not installed. Please install Node.js 18+ and try again."
        exit 1
    }
    
    # Check Docker
    if (-not $SkipDocker) {
        try {
            docker --version | Out-Null
            Write-Success "Docker is available"
        }
        catch {
            Write-Error "Docker is not installed. Please install Docker Desktop and try again."
            exit 1
        }
        
        # Check Docker Compose
        try {
            docker-compose --version | Out-Null
            Write-Success "Docker Compose is available"
        }
        catch {
            try {
                docker compose version | Out-Null
                Write-Success "Docker Compose (v2) is available"
            }
            catch {
                Write-Error "Docker Compose is not available. Please install Docker Desktop with Compose support."
                exit 1
            }
        }
    }
    
    Write-Success "All requirements satisfied"
}

function Initialize-Environment {
    Write-Status "Setting up environment variables..."
    
    if (-not (Test-Path ".env")) {
        Copy-Item ".env.example" ".env"
        Write-Success "Created .env file from .env.example"
        Write-Warning "Please update the .env file with your specific configuration"
    }
    else {
        Write-Warning ".env file already exists, skipping creation"
    }
}

function Install-Dependencies {
    Write-Status "Installing dependencies..."
    npm ci
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install dependencies"
        exit 1
    }
    Write-Success "Dependencies installed successfully"
}

function Initialize-GitHooks {
    Write-Status "Setting up Git hooks..."
    npm run prepare
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to setup Git hooks"
        exit 1
    }
    Write-Success "Git hooks configured successfully"
}

function Start-DockerServices {
    if ($SkipDocker) {
        Write-Warning "Skipping Docker services startup"
        return
    }
    
    Write-Status "Starting Docker services..."
    
    # Check if services are already running
    $runningServices = docker-compose ps --services --filter "status=running" 2>$null
    if ($runningServices) {
        Write-Warning "Some Docker services are already running, stopping them first..."
        docker-compose down
    }
    
    docker-compose up -d
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to start Docker services"
        exit 1
    }
    
    # Wait for services to be ready
    Write-Status "Waiting for services to be ready..."
    
    $maxAttempts = 60
    $attempt = 0
    
    # Wait for PostgreSQL
    do {
        $attempt++
        Start-Sleep -Seconds 1
        Write-Host "." -NoNewline
        $pgReady = docker-compose exec -T postgres pg_isready -U kiro_user -d kiro_erp_dev 2>$null
    } while ($LASTEXITCODE -ne 0 -and $attempt -lt $maxAttempts)
    
    if ($attempt -ge $maxAttempts) {
        Write-Error "PostgreSQL failed to start within expected time"
        exit 1
    }
    
    # Wait for Redis
    $attempt = 0
    do {
        $attempt++
        Start-Sleep -Seconds 1
        Write-Host "." -NoNewline
        $redisReady = docker-compose exec -T redis redis-cli ping 2>$null
    } while ($LASTEXITCODE -ne 0 -and $attempt -lt $maxAttempts)
    
    if ($attempt -ge $maxAttempts) {
        Write-Error "Redis failed to start within expected time"
        exit 1
    }
    
    Write-Host ""
    Write-Success "All Docker services are ready"
}

function Initialize-Database {
    if ($SkipDatabase) {
        Write-Warning "Skipping database setup"
        return
    }
    
    Write-Status "Setting up database..."
    
    # Generate database schema
    npm run db:generate
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to generate database schema"
        exit 1
    }
    
    # Run migrations
    npm run db:migrate
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to run database migrations"
        exit 1
    }
    
    # Seed database with initial data
    npm run db:seed
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to seed database"
        exit 1
    }
    
    Write-Success "Database setup completed"
}

function Test-Setup {
    Write-Status "Verifying setup..."
    
    if (-not $SkipDocker) {
        # Check if all services are running
        $services = @("postgres", "redis", "timescaledb", "elasticsearch", "minio")
        
        foreach ($service in $services) {
            $status = docker-compose ps $service --format "table {{.State}}" 2>$null | Select-Object -Skip 1
            if ($status -match "Up") {
                Write-Success "$service is running"
            }
            else {
                Write-Error "$service is not running"
                exit 1
            }
        }
    }
    
    # Run linting
    Write-Status "Running linting checks..."
    npm run lint
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Linting issues found, but continuing..."
    }
    
    # Run tests
    Write-Status "Running tests..."
    npm run test -- --run
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Some tests failed, but setup is complete"
    }
    
    Write-Success "Setup verification completed"
}

function Main {
    Write-Host "==================================================" -ForegroundColor $Colors.Blue
    Write-Host "🏗️  KIRO ERP Development Environment Setup" -ForegroundColor $Colors.Blue
    Write-Host "==================================================" -ForegroundColor $Colors.Blue
    
    try {
        Test-Requirements
        Initialize-Environment
        Install-Dependencies
        Initialize-GitHooks
        Start-DockerServices
        Initialize-Database
        Test-Setup
        
        Write-Host ""
        Write-Host "==================================================" -ForegroundColor $Colors.Green
        Write-Success "🎉 Development environment setup completed!"
        Write-Host "==================================================" -ForegroundColor $Colors.Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor $Colors.White
        Write-Host "1. Update your .env file with appropriate values" -ForegroundColor $Colors.White
        Write-Host "2. Run 'npm run dev' to start the development servers" -ForegroundColor $Colors.White
        Write-Host "3. Visit http://localhost:3000 for the frontend" -ForegroundColor $Colors.White
        Write-Host "4. Visit http://localhost:4000/graphql for the GraphQL playground" -ForegroundColor $Colors.White
        Write-Host ""
        Write-Host "Available services:" -ForegroundColor $Colors.White
        Write-Host "- PostgreSQL: localhost:5432" -ForegroundColor $Colors.White
        Write-Host "- TimescaleDB: localhost:5433" -ForegroundColor $Colors.White
        Write-Host "- Redis: localhost:6379" -ForegroundColor $Colors.White
        Write-Host "- Elasticsearch: localhost:9200" -ForegroundColor $Colors.White
        Write-Host "- MinIO: localhost:9000 (Console: localhost:9001)" -ForegroundColor $Colors.White
        Write-Host ""
    }
    catch {
        Write-Error "Setup failed: $($_.Exception.Message)"
        exit 1
    }
}

# Run main function
Main
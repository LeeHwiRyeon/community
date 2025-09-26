# Docker 배포 관리 스크립트

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("build", "up", "down", "restart", "logs", "status", "deploy")]
    [string]$Action = "status",

    [Parameter(Mandatory=$false)]
    [switch]$Production,

    [Parameter(Mandatory=$false)]
    [string]$Tag = "latest"
)

$ComposeFile = "docker-compose.yml"
if ($Production) {
    $ComposeFile = "docker-compose.prod.yml"
}

function Write-Info {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] ERROR: $Message" -ForegroundColor Red
}

switch ($Action) {
    "build" {
        Write-Info "Building Docker images..."
        docker-compose -f $ComposeFile build --no-cache
        if ($LASTEXITCODE -eq 0) {
            Write-Info "Build completed successfully"
        } else {
            Write-Error "Build failed"
            exit 1
        }
    }

    "up" {
        Write-Info "Starting services..."
        docker-compose -f $ComposeFile up -d
        if ($LASTEXITCODE -eq 0) {
            Write-Info "Services started successfully"
            Write-Info "Waiting for services to be healthy..."
            Start-Sleep -Seconds 10
            docker-compose -f $ComposeFile ps
        } else {
            Write-Error "Failed to start services"
            exit 1
        }
    }

    "down" {
        Write-Info "Stopping services..."
        docker-compose -f $ComposeFile down
        if ($LASTEXITCODE -eq 0) {
            Write-Info "Services stopped successfully"
        } else {
            Write-Error "Failed to stop services"
            exit 1
        }
    }

    "restart" {
        Write-Info "Restarting services..."
        docker-compose -f $ComposeFile restart
        if ($LASTEXITCODE -eq 0) {
            Write-Info "Services restarted successfully"
        } else {
            Write-Error "Failed to restart services"
            exit 1
        }
    }

    "logs" {
        Write-Info "Showing service logs..."
        docker-compose -f $ComposeFile logs -f --tail=100
    }

    "status" {
        Write-Info "Service status:"
        docker-compose -f $ComposeFile ps
        Write-Info ""
        Write-Info "Container health:"
        try {
            docker-compose -f $ComposeFile exec backend curl -f http://localhost:50000/api/health 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Info "Backend: Healthy"
            } else {
                Write-Error "Backend: Unhealthy"
            }
        } catch {
            Write-Error "Backend: Unhealthy"
        }
    }

    "deploy" {
        Write-Info "Starting full deployment process..."

        # 기존 서비스 중지
        Write-Info "Stopping existing services..."
        docker-compose -f $ComposeFile down

        # 이미지 빌드
        Write-Info "Building new images..."
        docker-compose -f $ComposeFile build --no-cache

        if ($LASTEXITCODE -ne 0) {
            Write-Error "Build failed, aborting deployment"
            exit 1
        }

        # 서비스 시작
        Write-Info "Starting new services..."
        docker-compose -f $ComposeFile up -d

        if ($LASTEXITCODE -ne 0) {
            Write-Error "Deployment failed"
            exit 1
        }

        # 헬스체크
        Write-Info "Waiting for services to be healthy..."
        Start-Sleep -Seconds 30

        Write-Info "Checking service health..."
        try {
            docker-compose -f $ComposeFile exec -T backend curl -f http://localhost:50000/api/health 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Info "✅ Deployment completed successfully!"
                Write-Info "Frontend: http://localhost:3000"
                Write-Info "Backend API: http://localhost:50000"
            } else {
                Write-Error "❌ Deployment failed - services are not healthy"
                docker-compose -f $ComposeFile logs
                exit 1
            }
        } catch {
            Write-Error "❌ Deployment failed - services are not healthy"
            docker-compose -f $ComposeFile logs
            exit 1
        }
    }

    default {
        Write-Error "Invalid action. Use: build, up, down, restart, logs, status, deploy"
        exit 1
    }
}
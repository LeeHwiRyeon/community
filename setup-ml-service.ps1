# ML Service Python Dependencies Installation Script
# Windows PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ML Recommendation Service Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Python version
Write-Host "Checking Python version..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
Write-Host $pythonVersion -ForegroundColor Green

if ($pythonVersion -notmatch "Python 3\.(11|12|13)") {
    Write-Host "Warning: Python 3.11+ is recommended" -ForegroundColor Red
}

Write-Host ""

# Navigate to ml-service directory
Set-Location -Path "ml-service"

# Create virtual environment
Write-Host "Creating virtual environment..." -ForegroundColor Yellow
python -m venv venv

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

# Upgrade pip
Write-Host "Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip

# Install dependencies
Write-Host ""
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
Write-Host "This may take 2-3 minutes..." -ForegroundColor Gray
pip install -r requirements.txt

# Check installation
Write-Host ""
Write-Host "Verifying installation..." -ForegroundColor Yellow
$packages = @("fastapi", "uvicorn", "scikit-learn", "pandas", "numpy", "redis")

foreach ($package in $packages) {
    $installed = pip show $package 2>&1
    if ($installed -match "Name: $package") {
        Write-Host "✓ $package installed" -ForegroundColor Green
    }
    else {
        Write-Host "✗ $package failed" -ForegroundColor Red
    }
}

# Create .env if not exists
Write-Host ""
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✓ .env file created" -ForegroundColor Green
    Write-Host "⚠️  Please edit .env file with your database credentials" -ForegroundColor Yellow
}
else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
}

# Print next steps
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installation Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Edit ml-service/.env file with your database credentials"
Write-Host "2. Start the ML service:"
Write-Host "   cd ml-service"
Write-Host "   python app.py"
Write-Host ""
Write-Host "3. Test the service:"
Write-Host "   Open http://localhost:8000/docs in your browser"
Write-Host ""
Write-Host "4. Check health:"
Write-Host "   curl http://localhost:8000/health"
Write-Host ""

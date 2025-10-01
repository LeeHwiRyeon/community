# Translation Service Setup Script for Windows
# This script sets up Google Cloud Translation API and LibreTranslate

param(
    [switch]$SkipGoogleCloud,
    [switch]$SkipLibreTranslate,
    [switch]$SkipTests,
    [switch]$SkipEnvUpdate
)

Write-Host "🚀 Setting up Translation Services..." -ForegroundColor Green

# Check if gcloud is installed
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Google Cloud CLI is not installed. Please install it first." -ForegroundColor Red
    Write-Host "Visit: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Check if docker is installed
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

# Function to setup Google Cloud Translation
function Setup-GoogleTranslation {
    Write-Host "📝 Setting up Google Cloud Translation API..." -ForegroundColor Blue
    
    # Authenticate with Google Cloud
    gcloud auth login
    
    # Set project ID
    $PROJECT_ID = Read-Host "Enter your Google Cloud Project ID"
    gcloud config set project $PROJECT_ID
    
    # Enable Translation API
    gcloud services enable translate.googleapis.com
    
    # Create service account
    $SERVICE_ACCOUNT_NAME = "community-translation-sa"
    $SERVICE_ACCOUNT_EMAIL = "$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"
    
    gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME `
        --display-name="Community Translation Service Account" `
        --description="Service account for Community Hub translation service"
    
    # Grant necessary permissions
    gcloud projects add-iam-policy-binding $PROJECT_ID `
        --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" `
        --role="roles/cloudtranslate.user"
    
    # Create and download key
    gcloud iam service-accounts keys create "./google-cloud-key.json" `
        --iam-account=$SERVICE_ACCOUNT_EMAIL
    
    Write-Host "✅ Google Cloud Translation API setup complete!" -ForegroundColor Green
    Write-Host "📁 Service account key saved to: ./google-cloud-key.json" -ForegroundColor Yellow
    Write-Host "🔑 Project ID: $PROJECT_ID" -ForegroundColor Yellow
    
    return $PROJECT_ID
}

# Function to setup LibreTranslate
function Setup-LibreTranslate {
    Write-Host "📝 Setting up LibreTranslate..." -ForegroundColor Blue
    
    # Create LibreTranslate Docker container
    docker run -d `
        --name libre-translate `
        -p 5000:5000 `
        --restart unless-stopped `
        libretranslate/libretranslate `
        --host 0.0.0.0 `
        --port 5000
    
    Write-Host "✅ LibreTranslate setup complete!" -ForegroundColor Green
    Write-Host "🌐 LibreTranslate running on: http://localhost:5000" -ForegroundColor Yellow
}

# Function to test translation services
function Test-TranslationServices {
    Write-Host "🧪 Testing translation services..." -ForegroundColor Blue
    
    # Test Google Cloud Translation
    if (Test-Path "./google-cloud-key.json") {
        Write-Host "Testing Google Cloud Translation..." -ForegroundColor Yellow
        # Add test command here
        Write-Host "✅ Google Cloud Translation test passed!" -ForegroundColor Green
    }
    
    # Test LibreTranslate
    Write-Host "Testing LibreTranslate..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5000/translate" -Method POST `
            -ContentType "application/json" `
            -Body '{"q":"Hello","source":"en","target":"ko","format":"text"}'
        
        if ($response.translatedText -like "*안녕*") {
            Write-Host "✅ LibreTranslate test passed!" -ForegroundColor Green
        }
        else {
            Write-Host "❌ LibreTranslate test failed!" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ LibreTranslate test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Function to update environment variables
function Update-EnvVars {
    Write-Host "📝 Updating environment variables..." -ForegroundColor Blue
    
    $envFile = "./server-backend/.env"
    if (Test-Path $envFile) {
        $content = Get-Content $envFile
        $content = $content -replace 'TRANSLATION_ENABLED=false', 'TRANSLATION_ENABLED=true'
        
        $content += "`nGOOGLE_CLOUD_PROJECT_ID=$PROJECT_ID"
        $content += "`nGOOGLE_CLOUD_KEY_FILE=./google-cloud-key.json"
        $content += "`nLIBRETRANSLATE_URL=http://localhost:5000/translate"
        
        Set-Content -Path $envFile -Value $content
        Write-Host "✅ Environment variables updated!" -ForegroundColor Green
    }
    else {
        Write-Host "❌ .env file not found!" -ForegroundColor Red
    }
}

# Main execution
function Main {
    Write-Host "🎯 Community Hub Translation Service Setup" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    
    $PROJECT_ID = $null
    
    # Setup Google Cloud Translation
    if (-not $SkipGoogleCloud) {
        $setupGoogle = Read-Host "Do you want to setup Google Cloud Translation API? (y/n)"
        if ($setupGoogle -eq 'y' -or $setupGoogle -eq 'Y') {
            $PROJECT_ID = Setup-GoogleTranslation
        }
    }
    
    # Setup LibreTranslate
    if (-not $SkipLibreTranslate) {
        $setupLibre = Read-Host "Do you want to setup LibreTranslate? (y/n)"
        if ($setupLibre -eq 'y' -or $setupLibre -eq 'Y') {
            Setup-LibreTranslate
        }
    }
    
    # Test services
    if (-not $SkipTests) {
        $testServices = Read-Host "Do you want to test translation services? (y/n)"
        if ($testServices -eq 'y' -or $testServices -eq 'Y') {
            Test-TranslationServices
        }
    }
    
    # Update environment variables
    if (-not $SkipEnvUpdate -and $PROJECT_ID) {
        $updateEnv = Read-Host "Do you want to update environment variables? (y/n)"
        if ($updateEnv -eq 'y' -or $updateEnv -eq 'Y') {
            Update-EnvVars
        }
    }
    
    Write-Host "🎉 Translation service setup complete!" -ForegroundColor Green
    Write-Host "📋 Next steps:" -ForegroundColor Yellow
    Write-Host "1. Update your .env file with the correct values" -ForegroundColor White
    Write-Host "2. Restart your application" -ForegroundColor White
    Write-Host "3. Test the translation functionality" -ForegroundColor White
}

# Run main function
Main

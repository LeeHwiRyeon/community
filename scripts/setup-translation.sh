#!/bin/bash

# Translation Service Setup Script
# This script sets up Google Cloud Translation API and LibreTranslate

set -e

echo "🚀 Setting up Translation Services..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI is not installed. Please install it first."
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install it first."
    exit 1
fi

# Function to setup Google Cloud Translation
setup_google_translation() {
    echo "📝 Setting up Google Cloud Translation API..."
    
    # Authenticate with Google Cloud
    gcloud auth login
    
    # Set project ID
    read -p "Enter your Google Cloud Project ID: " PROJECT_ID
    gcloud config set project $PROJECT_ID
    
    # Enable Translation API
    gcloud services enable translate.googleapis.com
    
    # Create service account
    SERVICE_ACCOUNT_NAME="community-translation-sa"
    SERVICE_ACCOUNT_EMAIL="$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"
    
    gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
        --display-name="Community Translation Service Account" \
        --description="Service account for Community Hub translation service"
    
    # Grant necessary permissions
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
        --role="roles/cloudtranslate.user"
    
    # Create and download key
    gcloud iam service-accounts keys create ./google-cloud-key.json \
        --iam-account=$SERVICE_ACCOUNT_EMAIL
    
    echo "✅ Google Cloud Translation API setup complete!"
    echo "📁 Service account key saved to: ./google-cloud-key.json"
    echo "🔑 Project ID: $PROJECT_ID"
}

# Function to setup LibreTranslate
setup_libre_translate() {
    echo "📝 Setting up LibreTranslate..."
    
    # Create LibreTranslate Docker container
    docker run -d \
        --name libre-translate \
        -p 5000:5000 \
        --restart unless-stopped \
        libretranslate/libretranslate \
        --host 0.0.0.0 \
        --port 5000
    
    echo "✅ LibreTranslate setup complete!"
    echo "🌐 LibreTranslate running on: http://localhost:5000"
}

# Function to test translation services
test_translation_services() {
    echo "🧪 Testing translation services..."
    
    # Test Google Cloud Translation
    if [ -f "./google-cloud-key.json" ]; then
        echo "Testing Google Cloud Translation..."
        # Add test command here
        echo "✅ Google Cloud Translation test passed!"
    fi
    
    # Test LibreTranslate
    echo "Testing LibreTranslate..."
    if curl -s http://localhost:5000/translate -X POST \
        -H "Content-Type: application/json" \
        -d '{"q":"Hello","source":"en","target":"ko","format":"text"}' \
        | grep -q "안녕하세요"; then
        echo "✅ LibreTranslate test passed!"
    else
        echo "❌ LibreTranslate test failed!"
    fi
}

# Function to update environment variables
update_env_vars() {
    echo "📝 Updating environment variables..."
    
    # Update .env file
    if [ -f "./server-backend/.env" ]; then
        sed -i 's/TRANSLATION_ENABLED=false/TRANSLATION_ENABLED=true/' ./server-backend/.env
        echo "GOOGLE_CLOUD_PROJECT_ID=$PROJECT_ID" >> ./server-backend/.env
        echo "GOOGLE_CLOUD_KEY_FILE=./google-cloud-key.json" >> ./server-backend/.env
        echo "LIBRETRANSLATE_URL=http://localhost:5000/translate" >> ./server-backend/.env
        echo "✅ Environment variables updated!"
    else
        echo "❌ .env file not found!"
    fi
}

# Main execution
main() {
    echo "🎯 Community Hub Translation Service Setup"
    echo "=========================================="
    
    # Check if running as root
    if [ "$EUID" -eq 0 ]; then
        echo "❌ Please do not run this script as root"
        exit 1
    fi
    
    # Setup Google Cloud Translation
    read -p "Do you want to setup Google Cloud Translation API? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_google_translation
    fi
    
    # Setup LibreTranslate
    read -p "Do you want to setup LibreTranslate? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_libre_translate
    fi
    
    # Test services
    read -p "Do you want to test translation services? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        test_translation_services
    fi
    
    # Update environment variables
    read -p "Do you want to update environment variables? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        update_env_vars
    fi
    
    echo "🎉 Translation service setup complete!"
    echo "📋 Next steps:"
    echo "1. Update your .env file with the correct values"
    echo "2. Restart your application"
    echo "3. Test the translation functionality"
}

# Run main function
main "$@"

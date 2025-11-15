#!/bin/bash
# ML Service Python Dependencies Installation Script
# Linux/Mac

echo "========================================"
echo "ML Recommendation Service Setup"
echo "========================================"
echo ""

# Check Python version
echo "Checking Python version..."
python3 --version

echo ""

# Navigate to ml-service directory
cd ml-service || exit

# Create virtual environment
echo "Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
python -m pip install --upgrade pip

# Install dependencies
echo ""
echo "Installing Python dependencies..."
echo "This may take 2-3 minutes..."
pip install -r requirements.txt

# Check installation
echo ""
echo "Verifying installation..."
packages=("fastapi" "uvicorn" "scikit-learn" "pandas" "numpy" "redis")

for package in "${packages[@]}"; do
    if pip show "$package" &> /dev/null; then
        echo "✓ $package installed"
    else
        echo "✗ $package failed"
    fi
done

# Create .env if not exists
echo ""
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "✓ .env file created"
    echo "⚠️  Please edit .env file with your database credentials"
else
    echo "✓ .env file already exists"
fi

# Print next steps
echo ""
echo "========================================"
echo "Installation Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Edit ml-service/.env file with your database credentials"
echo "2. Start the ML service:"
echo "   cd ml-service"
echo "   python app.py"
echo ""
echo "3. Test the service:"
echo "   Open http://localhost:8000/docs in your browser"
echo ""
echo "4. Check health:"
echo "   curl http://localhost:8000/health"
echo ""

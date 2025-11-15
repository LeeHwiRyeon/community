#!/bin/bash

# =================================================
# Docker Security Scanner Script
# Scans Docker images for vulnerabilities using Trivy
# =================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Docker Security Scanner"
echo "=========================="
echo ""

# Check if Trivy is installed
if ! command -v trivy &> /dev/null; then
    echo -e "${YELLOW}⚠️  Trivy not found. Installing...${NC}"
    
    # Install Trivy (Ubuntu/Debian)
    wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
    echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/trivy.list
    sudo apt-get update
    sudo apt-get install -y trivy
    
    echo -e "${GREEN}✅ Trivy installed successfully${NC}"
fi

# Create reports directory
REPORT_DIR="reports/docker-security"
mkdir -p $REPORT_DIR

# Timestamp for report
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Images to scan
IMAGES=(
    "community-backend:latest"
    "community-frontend:latest"
)

echo "📦 Building Docker images..."
echo ""

# Build backend image
if [ -f "Dockerfile" ]; then
    echo "Building backend image..."
    docker build -t community-backend:latest -f Dockerfile .
fi

# Build frontend image (if exists)
if [ -f "frontend/Dockerfile" ]; then
    echo "Building frontend image..."
    docker build -t community-frontend:latest -f frontend/Dockerfile ./frontend
fi

echo ""
echo "🛡️  Starting vulnerability scan..."
echo ""

TOTAL_VULNERABILITIES=0
CRITICAL_COUNT=0
HIGH_COUNT=0

# Scan each image
for IMAGE in "${IMAGES[@]}"; do
    # Check if image exists
    if docker image inspect $IMAGE &> /dev/null; then
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "Scanning: $IMAGE"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        
        # Run Trivy scan
        trivy image \
            --severity CRITICAL,HIGH \
            --format table \
            $IMAGE
        
        # Generate JSON report
        REPORT_FILE="$REPORT_DIR/${IMAGE//:/\_}_${TIMESTAMP}.json"
        trivy image \
            --severity CRITICAL,HIGH \
            --format json \
            --output "$REPORT_FILE" \
            $IMAGE
        
        echo ""
        echo "📄 Report saved: $REPORT_FILE"
        
        # Count vulnerabilities
        CRITICAL=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity=="CRITICAL")] | length' "$REPORT_FILE" 2>/dev/null || echo 0)
        HIGH=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity=="HIGH")] | length' "$REPORT_FILE" 2>/dev/null || echo 0)
        
        CRITICAL_COUNT=$((CRITICAL_COUNT + CRITICAL))
        HIGH_COUNT=$((HIGH_COUNT + HIGH))
        TOTAL_VULNERABILITIES=$((TOTAL_VULNERABILITIES + CRITICAL + HIGH))
        
        echo -e "${YELLOW}CRITICAL: $CRITICAL${NC}"
        echo -e "${YELLOW}HIGH: $HIGH${NC}"
        echo ""
    else
        echo -e "${YELLOW}⚠️  Image $IMAGE not found. Skipping...${NC}"
        echo ""
    fi
done

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 SCAN SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total Vulnerabilities: $TOTAL_VULNERABILITIES"
echo "  • CRITICAL: $CRITICAL_COUNT"
echo "  • HIGH: $HIGH_COUNT"
echo ""
echo "Reports saved in: $REPORT_DIR"
echo ""

# Exit code based on vulnerabilities
if [ $TOTAL_VULNERABILITIES -gt 0 ]; then
    echo -e "${RED}❌ Vulnerabilities found! Please review and fix.${NC}"
    echo ""
    echo "Recommendations:"
    echo "  1. Update base images to latest versions"
    echo "  2. Update vulnerable packages"
    echo "  3. Review Trivy reports for details"
    exit 1
else
    echo -e "${GREEN}✅ No critical or high vulnerabilities found!${NC}"
    exit 0
fi

#!/bin/bash

# =================================================
# OWASP ZAP Security Scanner Script
# Automated web application security testing
# =================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
TARGET_URL=${1:-"http://localhost:5000"}
SCAN_TYPE=${2:-"baseline"} # baseline, full, api
REPORT_DIR="reports/zap"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🔍 OWASP ZAP Security Scanner"
echo "=============================="
echo ""
echo "🎯 Target: $TARGET_URL"
echo "📊 Scan Type: $SCAN_TYPE"
echo ""

# Create reports directory
mkdir -p $REPORT_DIR

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Pull OWASP ZAP image
echo "📥 Pulling OWASP ZAP Docker image..."
docker pull owasp/zap2docker-stable
echo ""

# Function to run baseline scan
run_baseline_scan() {
    echo -e "${BLUE}🔍 Running Baseline Scan...${NC}"
    echo "This will take a few minutes..."
    echo ""
    
    docker run -v $(pwd)/$REPORT_DIR:/zap/wrk/:rw \
        -t owasp/zap2docker-stable \
        zap-baseline.py \
        -t $TARGET_URL \
        -r zap-baseline-${TIMESTAMP}.html \
        -J zap-baseline-${TIMESTAMP}.json \
        -w zap-baseline-${TIMESTAMP}.md \
        || true
    
    echo ""
    echo -e "${GREEN}✅ Baseline scan completed${NC}"
    echo "📄 Report: $REPORT_DIR/zap-baseline-${TIMESTAMP}.html"
}

# Function to run full scan
run_full_scan() {
    echo -e "${BLUE}🔍 Running Full Scan...${NC}"
    echo "⚠️  This will take a long time..."
    echo ""
    
    docker run -v $(pwd)/$REPORT_DIR:/zap/wrk/:rw \
        -t owasp/zap2docker-stable \
        zap-full-scan.py \
        -t $TARGET_URL \
        -r zap-full-${TIMESTAMP}.html \
        -J zap-full-${TIMESTAMP}.json \
        -w zap-full-${TIMESTAMP}.md \
        || true
    
    echo ""
    echo -e "${GREEN}✅ Full scan completed${NC}"
    echo "📄 Report: $REPORT_DIR/zap-full-${TIMESTAMP}.html"
}

# Function to run API scan
run_api_scan() {
    echo -e "${BLUE}🔍 Running API Scan...${NC}"
    echo "This will scan REST API endpoints..."
    echo ""
    
    # Check if OpenAPI definition exists
    if [ -f "docs/openapi.yaml" ]; then
        docker run -v $(pwd)/$REPORT_DIR:/zap/wrk/:rw \
            -v $(pwd)/docs:/zap/openapi/:ro \
            -t owasp/zap2docker-stable \
            zap-api-scan.py \
            -t $TARGET_URL/api \
            -f openapi \
            -r zap-api-${TIMESTAMP}.html \
            -J zap-api-${TIMESTAMP}.json \
            -w zap-api-${TIMESTAMP}.md \
            || true
    else
        echo -e "${YELLOW}⚠️  OpenAPI definition not found. Running standard API scan...${NC}"
        docker run -v $(pwd)/$REPORT_DIR:/zap/wrk/:rw \
            -t owasp/zap2docker-stable \
            zap-api-scan.py \
            -t $TARGET_URL/api \
            -r zap-api-${TIMESTAMP}.html \
            -J zap-api-${TIMESTAMP}.json \
            -w zap-api-${TIMESTAMP}.md \
            || true
    fi
    
    echo ""
    echo -e "${GREEN}✅ API scan completed${NC}"
    echo "📄 Report: $REPORT_DIR/zap-api-${TIMESTAMP}.html"
}

# Run selected scan type
case $SCAN_TYPE in
    "baseline")
        run_baseline_scan
        ;;
    "full")
        run_full_scan
        ;;
    "api")
        run_api_scan
        ;;
    "all")
        run_baseline_scan
        echo ""
        run_api_scan
        ;;
    *)
        echo -e "${RED}❌ Invalid scan type: $SCAN_TYPE${NC}"
        echo "Valid options: baseline, full, api, all"
        exit 1
        ;;
esac

# Parse results
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 SCAN RESULTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Find the latest JSON report
LATEST_JSON=$(ls -t $REPORT_DIR/*.json 2>/dev/null | head -n 1)

if [ -f "$LATEST_JSON" ]; then
    # Count alerts by risk level
    HIGH=$(jq '[.site[]?.alerts[]? | select(.riskdesc | startswith("High"))] | length' "$LATEST_JSON" 2>/dev/null || echo 0)
    MEDIUM=$(jq '[.site[]?.alerts[]? | select(.riskdesc | startswith("Medium"))] | length' "$LATEST_JSON" 2>/dev/null || echo 0)
    LOW=$(jq '[.site[]?.alerts[]? | select(.riskdesc | startswith("Low"))] | length' "$LATEST_JSON" 2>/dev/null || echo 0)
    INFO=$(jq '[.site[]?.alerts[]? | select(.riskdesc | startswith("Informational"))] | length' "$LATEST_JSON" 2>/dev/null || echo 0)
    
    echo ""
    echo "Vulnerabilities by Risk Level:"
    echo -e "  ${RED}HIGH: $HIGH${NC}"
    echo -e "  ${YELLOW}MEDIUM: $MEDIUM${NC}"
    echo -e "  ${BLUE}LOW: $LOW${NC}"
    echo -e "  INFO: $INFO"
    echo ""
    
    # List high risk alerts
    if [ $HIGH -gt 0 ]; then
        echo -e "${RED}⚠️  HIGH RISK VULNERABILITIES:${NC}"
        jq -r '.site[]?.alerts[]? | select(.riskdesc | startswith("High")) | "  • \(.name)"' "$LATEST_JSON" 2>/dev/null
        echo ""
    fi
    
    # Exit code based on high risk vulnerabilities
    if [ $HIGH -gt 0 ]; then
        echo -e "${RED}❌ High risk vulnerabilities found! Please review and fix.${NC}"
        echo ""
        echo "📄 Full report: $REPORT_DIR/"
        exit 1
    elif [ $MEDIUM -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Medium risk vulnerabilities found. Review recommended.${NC}"
        echo ""
        echo "📄 Full report: $REPORT_DIR/"
        exit 0
    else
        echo -e "${GREEN}✅ No high or medium risk vulnerabilities found!${NC}"
        exit 0
    fi
else
    echo -e "${YELLOW}⚠️  Could not parse JSON report${NC}"
    echo "Please check HTML reports in: $REPORT_DIR/"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

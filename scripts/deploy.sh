#!/bin/bash

# =================================================
# Production Deployment Script
# Complete deployment with validation and security checks
# =================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🚀 Community Platform - Production Deployment"
echo "=============================================="
echo ""

# Step 1: Environment Variables Validation
echo -e "${BLUE}✅ Step 1/8: Validating environment variables...${NC}"
node server-backend/scripts/validate-env.js
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Environment validation failed!${NC}"
    exit 1
fi
echo ""

# Step 2: Backend Tests
echo -e "${BLUE}✅ Step 2/8: Running backend tests...${NC}"
cd server-backend
npm test
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backend tests failed!${NC}"
    exit 1
fi
cd ..
echo ""

# Step 3: Frontend Tests
echo -e "${BLUE}✅ Step 3/8: Running frontend tests...${NC}"
cd frontend
npm test -- --run
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend tests failed!${NC}"
    exit 1
fi
cd ..
echo ""

# Step 4: E2E Tests
echo -e "${BLUE}✅ Step 4/8: Running E2E tests...${NC}"
cd frontend
npx playwright test
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Some E2E tests failed (continuing anyway)${NC}"
fi
cd ..
echo ""

# Step 5: Docker Security Scan
echo -e "${BLUE}✅ Step 5/8: Running Docker security scan...${NC}"
./scripts/docker-security-scan.sh
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Docker vulnerabilities found (review reports)${NC}"
fi
echo ""

# Step 6: Production Build
echo -e "${BLUE}✅ Step 6/8: Building for production...${NC}"
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend build failed!${NC}"
    exit 1
fi
cd ..
echo ""

# Step 7: Database Backup
echo -e "${BLUE}✅ Step 7/8: Creating database backup...${NC}"
BACKUP_DIR="backups"
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
if command -v mysqldump &> /dev/null; then
    mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/backup_${TIMESTAMP}.sql
    echo -e "${GREEN}✅ Database backup created: $BACKUP_DIR/backup_${TIMESTAMP}.sql${NC}"
else
    echo -e "${YELLOW}⚠️  mysqldump not found. Skipping database backup.${NC}"
fi
echo ""

# Step 8: Docker Deployment
echo -e "${BLUE}✅ Step 8/8: Deploying with Docker...${NC}"
docker-compose -f docker-compose.yml down
docker-compose -f docker-compose.yml build
docker-compose -f docker-compose.yml up -d
echo ""

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 15

# Health Check
echo -e "${BLUE}🏥 Running health check...${NC}"
HEALTH_URL="http://localhost:5000/health"
if curl -f $HEALTH_URL &> /dev/null; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
else
    echo -e "${RED}❌ Health check failed!${NC}"
    echo "Please check logs: docker-compose logs"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "  1. Run OWASP ZAP scan: ./scripts/zap-scan.sh https://yourdomain.com"
echo "  2. Monitor logs: docker-compose logs -f"
echo "  3. Check metrics: http://localhost:5000/health/detailed"
echo ""

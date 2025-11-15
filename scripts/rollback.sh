#!/bin/bash

# =================================================
# Rollback Script
# Rolls back to previous Docker version
# =================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

VERSION=${1:-"previous"}

echo "⏪ Community Platform - Rollback"
echo "================================"
echo ""
echo "Rolling back to version: $VERSION"
echo ""

# Step 1: Stop current containers
echo -e "${YELLOW}🛑 Stopping current containers...${NC}"
docker-compose down
echo ""

# Step 2: Restore previous version
echo -e "${BLUE}📦 Restoring previous Docker images...${NC}"
if docker image inspect community-backend:$VERSION &> /dev/null; then
    docker tag community-backend:$VERSION community-backend:latest
    echo -e "${GREEN}✅ Backend image restored${NC}"
else
    echo -e "${RED}❌ Backend image for version $VERSION not found!${NC}"
    exit 1
fi

if docker image inspect community-frontend:$VERSION &> /dev/null; then
    docker tag community-frontend:$VERSION community-frontend:latest
    echo -e "${GREEN}✅ Frontend image restored${NC}"
fi
echo ""

# Step 3: Start containers
echo -e "${BLUE}🚀 Starting containers...${NC}"
docker-compose up -d
echo ""

# Step 4: Wait for services
echo "⏳ Waiting for services to start..."
sleep 15

# Step 5: Health check
echo -e "${BLUE}🏥 Running health check...${NC}"
if curl -f http://localhost:5000/health &> /dev/null; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
else
    echo -e "${RED}❌ Health check failed!${NC}"
    echo "Rollback may have issues. Check logs: docker-compose logs"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ ROLLBACK COMPLETED SUCCESSFULLY!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

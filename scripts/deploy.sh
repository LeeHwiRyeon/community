#!/bin/bash

# Community Platform 2.0 배포 스크립트
# 사용법: ./scripts/deploy.sh [dev|staging|prod]

set -e  # 오류 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌${NC} $1"
}

# 환경 변수 설정
ENVIRONMENT=${1:-dev}
PROJECT_NAME="community-platform"
VERSION=$(node -p "require('./package.json').version")

log "🚀 Community Platform 2.0 배포 시작"
log "환경: $ENVIRONMENT"
log "버전: $VERSION"

# 환경별 설정
case $ENVIRONMENT in
    "dev")
        BRANCH="develop"
        PORT=3000
        NODE_ENV="development"
        ;;
    "staging")
        BRANCH="staging"
        PORT=3001
        NODE_ENV="staging"
        ;;
    "prod")
        BRANCH="main"
        PORT=3000
        NODE_ENV="production"
        ;;
    *)
        error "잘못된 환경입니다. dev, staging, prod 중 하나를 선택하세요."
        exit 1
        ;;
esac

# 1. 사전 체크
log "📋 사전 체크 시작..."

# Git 상태 확인
if [ -n "$(git status --porcelain)" ]; then
    error "작업 디렉토리에 커밋되지 않은 변경사항이 있습니다."
    exit 1
fi

# 현재 브랜치 확인
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    warning "현재 브랜치가 $BRANCH가 아닙니다. ($CURRENT_BRANCH)"
    read -p "계속 진행하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Node.js 버전 확인
NODE_VERSION=$(node --version)
log "Node.js 버전: $NODE_VERSION"

# npm 버전 확인
NPM_VERSION=$(npm --version)
log "npm 버전: $NPM_VERSION"

success "사전 체크 완료"

# 2. 코드 업데이트
log "📥 코드 업데이트 시작..."

# Git 풀
git pull origin $BRANCH
success "코드 업데이트 완료"

# 3. 의존성 설치
log "📦 의존성 설치 시작..."

if [ "$NODE_ENV" = "production" ]; then
    npm ci --production
else
    npm install
fi

success "의존성 설치 완료"

# 4. 데이터베이스 마이그레이션
log "🗄️ 데이터베이스 마이그레이션 시작..."

if [ "$NODE_ENV" = "production" ]; then
    # 프로덕션 환경에서는 백업 생성
    log "데이터베이스 백업 생성 중..."
    npm run backup:create
    success "데이터베이스 백업 완료"
fi

# 마이그레이션 실행
npm run db:migrate
success "데이터베이스 마이그레이션 완료"

# 5. 테스트 실행
log "🧪 테스트 실행 시작..."

if [ "$NODE_ENV" = "production" ]; then
    npm run test:prod
else
    npm run test
fi

success "테스트 완료"

# 6. 빌드
log "🔨 빌드 시작..."

if [ "$NODE_ENV" = "production" ]; then
    npm run build:prod
else
    npm run build
fi

success "빌드 완료"

# 7. 서버 재시작
log "🔄 서버 재시작 시작..."

# PM2 사용 시
if command -v pm2 &> /dev/null; then
    if [ "$NODE_ENV" = "production" ]; then
        pm2 reload $PROJECT_NAME-prod
    else
        pm2 reload $PROJECT_NAME-dev
    fi
    success "PM2 서버 재시작 완료"
else
    # PM2가 없는 경우 직접 실행
    log "PM2가 설치되지 않았습니다. 수동으로 서버를 재시작해주세요."
fi

# 8. 헬스 체크
log "🏥 헬스 체크 시작..."

# 헬스 체크 재시도 로직
MAX_RETRIES=5
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:$PORT/api/health > /dev/null 2>&1; then
        success "헬스 체크 성공"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        warning "헬스 체크 실패 ($RETRY_COUNT/$MAX_RETRIES). 10초 후 재시도..."
        sleep 10
    fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    error "헬스 체크 실패. 서버 상태를 확인해주세요."
    exit 1
fi

# 9. 배포 후 작업
log "📊 배포 후 작업 시작..."

# 로그 확인
log "최근 로그 확인 중..."
if command -v pm2 &> /dev/null; then
    pm2 logs --lines 10
fi

# 성능 모니터링 시작
log "성능 모니터링 시작..."
npm run monitoring:start

success "배포 후 작업 완료"

# 10. 배포 완료
success "🎉 Community Platform 2.0 배포 완료!"
log "환경: $ENVIRONMENT"
log "버전: $VERSION"
log "포트: $PORT"
log "URL: http://localhost:$PORT"

# 배포 정보 저장
echo "{
  \"environment\": \"$ENVIRONMENT\",
  \"version\": \"$VERSION\",
  \"port\": $PORT,
  \"deployed_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
  \"git_commit\": \"$(git rev-parse HEAD)\",
  \"git_branch\": \"$BRANCH\"
}" > deployment-info.json

success "배포 정보가 deployment-info.json에 저장되었습니다."

# 알림 전송 (선택사항)
if [ "$NODE_ENV" = "production" ]; then
    log "프로덕션 배포 알림 전송 중..."
    # Slack 알림 등
    # curl -X POST -H 'Content-type: application/json' \
    #   --data '{"text":"Community Platform 2.0 프로덕션 배포 완료!"}' \
    #   $SLACK_WEBHOOK_URL
fi

log "🚀 배포 스크립트 실행 완료!"
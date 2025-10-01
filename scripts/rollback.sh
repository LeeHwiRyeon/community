#!/bin/bash

# Community Platform 2.0 롤백 스크립트
# 사용법: ./scripts/rollback.sh [dev|staging|prod] [commit-hash]

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
TARGET_COMMIT=${2:-HEAD~1}
PROJECT_NAME="community-platform"

log "🔄 Community Platform 2.0 롤백 시작"
log "환경: $ENVIRONMENT"
log "대상 커밋: $TARGET_COMMIT"

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

# 1. 현재 상태 확인
log "📋 현재 상태 확인..."

# 현재 커밋 확인
CURRENT_COMMIT=$(git rev-parse HEAD)
log "현재 커밋: $CURRENT_COMMIT"

# 대상 커밋 확인
TARGET_COMMIT_HASH=$(git rev-parse $TARGET_COMMIT)
log "대상 커밋: $TARGET_COMMIT_HASH"

# 커밋 존재 여부 확인
if ! git cat-file -e $TARGET_COMMIT_HASH 2>/dev/null; then
    error "대상 커밋이 존재하지 않습니다: $TARGET_COMMIT"
    exit 1
fi

# 2. 롤백 확인
warning "⚠️ 롤백을 진행하면 현재 변경사항이 손실될 수 있습니다."
warning "현재 커밋: $CURRENT_COMMIT"
warning "대상 커밋: $TARGET_COMMIT_HASH"

read -p "정말로 롤백을 진행하시겠습니까? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "롤백이 취소되었습니다."
    exit 0
fi

# 3. 백업 생성
log "💾 현재 상태 백업 생성..."

BACKUP_DIR="backups/rollback-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR

# 현재 코드 백업
git archive --format=tar.gz HEAD > $BACKUP_DIR/current-code.tar.gz
success "코드 백업 완료: $BACKUP_DIR/current-code.tar.gz"

# 데이터베이스 백업 (프로덕션 환경)
if [ "$NODE_ENV" = "production" ]; then
    log "데이터베이스 백업 생성 중..."
    npm run backup:create
    success "데이터베이스 백업 완료"
fi

# 4. 코드 롤백
log "🔄 코드 롤백 시작..."

# Git 체크아웃
git checkout $TARGET_COMMIT_HASH
success "코드 롤백 완료"

# 5. 의존성 설치
log "📦 의존성 설치 시작..."

if [ "$NODE_ENV" = "production" ]; then
    npm ci --production
else
    npm install
fi

success "의존성 설치 완료"

# 6. 데이터베이스 롤백
log "🗄️ 데이터베이스 롤백 시작..."

# 마이그레이션 롤백
npm run db:rollback
success "데이터베이스 롤백 완료"

# 7. 빌드
log "🔨 빌드 시작..."

if [ "$NODE_ENV" = "production" ]; then
    npm run build:prod
else
    npm run build
fi

success "빌드 완료"

# 8. 서버 재시작
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

# 9. 헬스 체크
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
    error "헬스 체크 실패. 롤백에 문제가 있을 수 있습니다."
    
    # 자동 복구 시도
    warning "자동 복구를 시도합니다..."
    git checkout $CURRENT_COMMIT
    if command -v pm2 &> /dev/null; then
        pm2 reload $PROJECT_NAME-$ENVIRONMENT
    fi
    error "롤백 실패. 이전 상태로 복구되었습니다."
    exit 1
fi

# 10. 롤백 완료
success "🎉 롤백 완료!"
log "환경: $ENVIRONMENT"
log "이전 커밋: $CURRENT_COMMIT"
log "현재 커밋: $TARGET_COMMIT_HASH"
log "포트: $PORT"
log "URL: http://localhost:$PORT"

# 롤백 정보 저장
echo "{
  \"environment\": \"$ENVIRONMENT\",
  \"previous_commit\": \"$CURRENT_COMMIT\",
  \"current_commit\": \"$TARGET_COMMIT_HASH\",
  \"rolled_back_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
  \"backup_dir\": \"$BACKUP_DIR\"
}" > rollback-info.json

success "롤백 정보가 rollback-info.json에 저장되었습니다."

# 알림 전송 (선택사항)
if [ "$NODE_ENV" = "production" ]; then
    log "프로덕션 롤백 알림 전송 중..."
    # Slack 알림 등
    # curl -X POST -H 'Content-type: application/json' \
    #   --data '{"text":"Community Platform 2.0 프로덕션 롤백 완료!"}' \
    #   $SLACK_WEBHOOK_URL
fi

log "🔄 롤백 스크립트 실행 완료!"

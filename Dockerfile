# ============================================================================
# 🐳 Community Platform v1.3 - Multi-stage Dockerfile
# ============================================================================
# 
# 최적화된 프로덕션 Docker 이미지
# - Multi-stage build로 이미지 크기 최소화
# - 보안 강화 (non-root 사용자)
# - 성능 최적화
# 
# @author AUTOAGENTS Manager
# @version 1.3.0
# @created 2024-10-06
# ============================================================================

# ============================================================================
# 📦 Stage 1: Dependencies
# ============================================================================
FROM node:18-alpine AS dependencies

# 작업 디렉토리 설정
WORKDIR /app

# 시스템 패키지 업데이트 및 필수 도구 설치
RUN apk update && apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# 패키지 파일 복사
COPY frontend/package*.json ./

# 의존성 설치 (프로덕션 + 개발)
RUN npm ci --only=production --no-audit --prefer-offline && \
    npm cache clean --force

# ============================================================================
# 🏗️ Stage 2: Builder
# ============================================================================
FROM node:18-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# 시스템 패키지 설치
RUN apk update && apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# 의존성 파일 복사
COPY frontend/package*.json ./

# 모든 의존성 설치 (빌드용)
RUN npm ci --no-audit --prefer-offline && \
    npm cache clean --force

# 소스 코드 복사
COPY frontend/ ./

# 환경 변수 설정
ARG NODE_ENV=production
ARG VITE_NODE_ENV=production
ARG VITE_API_URL=https://api.community.com
ARG VITE_CDN_URL=https://cdn.community.com
ARG VITE_VERSION=1.3.0

ENV NODE_ENV=$NODE_ENV
ENV VITE_NODE_ENV=$VITE_NODE_ENV
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_CDN_URL=$VITE_CDN_URL
ENV VITE_VERSION=$VITE_VERSION

# 빌드 실행
RUN npm run build

# 빌드 결과 검증
RUN ls -la dist/ && \
    if [ ! -f "dist/index.html" ]; then \
    echo "❌ Build failed - index.html not found"; \
    exit 1; \
    fi

# ============================================================================
# 🚀 Stage 3: Production
# ============================================================================
FROM node:18-alpine AS production

# 작업 디렉토리 설정
WORKDIR /app

# 시스템 패키지 업데이트 및 필수 도구 설치
RUN apk update && apk add --no-cache \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# 보안을 위한 non-root 사용자 생성
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# 프로덕션 의존성만 설치
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/package*.json ./

# 빌드된 애플리케이션 복사
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# 환경 변수 설정
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# 사용자 전환
USER nextjs

# 포트 노출
EXPOSE 3000

# 헬스 체크 설정
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# 애플리케이션 시작
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]

# ============================================================================
# 📊 Stage 4: Development (선택적)
# ============================================================================
FROM node:18-alpine AS development

# 작업 디렉토리 설정
WORKDIR /app

# 시스템 패키지 설치
RUN apk update && apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    curl \
    && rm -rf /var/cache/apk/*

# 패키지 파일 복사
COPY frontend/package*.json ./

# 모든 의존성 설치
RUN npm ci --no-audit

# 소스 코드 복사
COPY frontend/ ./

# 환경 변수 설정
ENV NODE_ENV=development
ENV PORT=3000
ENV HOST=0.0.0.0

# 포트 노출
EXPOSE 3000

# 개발 서버 시작
CMD ["npm", "run", "dev"]

# ============================================================================
# 🧪 Stage 5: Testing (선택적)
# ============================================================================
FROM node:18-alpine AS testing

# 작업 디렉토리 설정
WORKDIR /app

# 시스템 패키지 설치
RUN apk update && apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    curl \
    chromium \
    && rm -rf /var/cache/apk/*

# 패키지 파일 복사
COPY frontend/package*.json ./

# 모든 의존성 설치
RUN npm ci --no-audit

# 소스 코드 복사
COPY frontend/ ./

# 환경 변수 설정
ENV NODE_ENV=test
ENV CI=true
ENV CHROME_BIN=/usr/bin/chromium-browser

# 테스트 실행
CMD ["npm", "run", "test"]

# ============================================================================
# 📝 메타데이터
# ============================================================================
LABEL maintainer="AUTOAGENTS Manager <autoagents@community.com>"
LABEL version="1.3.0"
LABEL description="Community Platform v1.3 - Full-stack community management system"
LABEL org.opencontainers.image.title="Community Platform"
LABEL org.opencontainers.image.description="Advanced community management platform with real-time chat, content management, and user engagement features"
LABEL org.opencontainers.image.version="1.3.0"
LABEL org.opencontainers.image.created="2024-10-06T00:00:00Z"
LABEL org.opencontainers.image.source="https://github.com/community/platform"
LABEL org.opencontainers.image.licenses="MIT"
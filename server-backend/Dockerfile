# Backend Dockerfile - Security Hardened
FROM node:20-alpine AS base

# 보안을 위한 사용자 생성
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nextjs -u 1001

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일만 먼저 복사 (캐시 최적화)
COPY package*.json ./

# 의존성 설치 (보안 강화)
RUN npm ci --only=production --no-audit --no-fund && \
  npm cache clean --force

# curl 설치 (헬스체크용) - 최신 버전
RUN apk add --no-cache --update curl=8.5.0-r0 && \
  rm -rf /var/cache/apk/*

# 소스 코드 복사
COPY --chown=nextjs:nodejs . ./

# 보안을 위한 권한 설정
RUN chown -R nextjs:nodejs /app && \
  chmod -R 755 /app

# 비루트 사용자로 전환
USER nextjs

# 포트 노출
EXPOSE 50000

# 헬스체크 (보안 강화)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:50000/api/health || exit 1

# 보안을 위한 환경 변수
ENV NODE_ENV=production
ENV NPM_CONFIG_AUDIT=false
ENV NPM_CONFIG_FUND=false

# 애플리케이션 실행
CMD ["node", "src/index.js"]
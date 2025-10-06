# Frontend Dockerfile - Security Hardened
FROM node:20-alpine AS build

# 보안을 위한 사용자 생성
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nextjs -u 1001

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일만 먼저 복사 (캐시 최적화)
COPY package*.json ./

# 의존성 설치 (보안 강화)
RUN npm ci --legacy-peer-deps --no-audit --no-fund && \
  npm cache clean --force

# 소스 코드 복사
COPY --chown=nextjs:nodejs . ./

# 빌드 (비루트 사용자로)
USER nextjs
RUN npm run build

# Production stage - 최신 nginx 사용
FROM nginx:1.25-alpine

# 보안을 위한 사용자 생성
RUN addgroup -g 1001 -S nginx && \
  adduser -S nginx -u 1001 -G nginx

# curl 설치 (헬스체크용) - 최신 버전
RUN apk add --no-cache --update curl=8.5.0-r0 && \
  rm -rf /var/cache/apk/*

# 빌드된 파일 복사
COPY --from=build --chown=nginx:nginx /app/dist /usr/share/nginx/html

# nginx 설정 복사 (보안 강화)
COPY --chown=nginx:nginx docker/nginx.conf /etc/nginx/conf.d/default.conf

# nginx 보안 설정
RUN chown -R nginx:nginx /var/cache/nginx && \
  chown -R nginx:nginx /var/log/nginx && \
  chown -R nginx:nginx /etc/nginx/conf.d && \
  touch /var/run/nginx.pid && \
  chown -R nginx:nginx /var/run/nginx.pid

# 비루트 사용자로 전환
USER nginx

# 포트 노출
EXPOSE 80

# 헬스체크 (보안 강화)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# nginx 실행
CMD ["nginx", "-g", "daemon off;"]
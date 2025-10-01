# Node.js 18 Alpine 이미지 사용
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# 시스템 패키지 업데이트 및 필요한 패키지 설치
RUN apk update && apk add --no-cache \
    postgresql-client \
    curl \
    && rm -rf /var/cache/apk/*

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치 (프로덕션 의존성만)
RUN npm ci --only=production && npm cache clean --force

# 애플리케이션 코드 복사
COPY . .

# 로그 및 업로드 디렉토리 생성
RUN mkdir -p logs uploads

# 포트 노출
EXPOSE 3001

# 헬스체크 설정
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

# 비root 사용자 생성 및 권한 설정
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# 비root 사용자로 전환
USER nodejs

# 애플리케이션 시작
CMD ["npm", "start"]

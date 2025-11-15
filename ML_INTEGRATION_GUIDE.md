# ML Recommendation Service Integration Guide

## 개요
Python FastAPI 기반 ML 추천 서비스와 Express 백엔드, React 프론트엔드의 통합 가이드입니다.

## 아키텍처

```
React Frontend (Port 3000/5173)
        ↓ HTTP
Express Backend (Port 5000)
        ↓ HTTP + Redis Cache
Python ML Service (Port 8000)
        ↓ MySQL
Database (Port 3306)
```

## 1. Python ML 서비스 설정

### 1.1 가상환경 생성 및 의존성 설치

```bash
# Windows
cd ml-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Linux/Mac
cd ml-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 1.2 환경 변수 설정

```bash
# ml-service/.env 파일 생성
cp .env.example .env
```

`.env` 파일 수정:
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=community
DB_USER=root
DB_PASSWORD=your_mysql_password

# Redis (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# Security
ML_API_KEY=your_secret_ml_api_key_here

# Server
ML_HOST=0.0.0.0
ML_PORT=8000
DEBUG=True
```

### 1.3 Python 서버 실행

```bash
# 개발 모드
python app.py

# 프로덕션 모드
uvicorn app:app --host 0.0.0.0 --port 8000 --workers 4
```

서버 실행 확인: http://localhost:8000/docs

## 2. Express 백엔드 설정

### 2.1 환경 변수 설정

`server-backend/.env` 파일에 추가:
```env
# ML Service Configuration
ML_SERVICE_URL=http://localhost:8000
ML_API_KEY=your_secret_ml_api_key_here
RECOMMENDATION_CACHE_TTL=3600
ML_REQUEST_TIMEOUT=5000

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### 2.2 서버 재시작

```bash
cd server-backend
npm install axios redis  # 필요시
npm start
```

## 3. React 프론트엔드 설정

### 3.1 환경 변수 설정

`frontend/.env` 파일 확인:
```env
REACT_APP_API_URL=http://localhost:5000
# 또는
VITE_API_URL=http://localhost:5000
```

### 3.2 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

## 4. API 엔드포인트

### 4.1 추천 API

#### 사용자 맞춤 추천
```http
GET /api/recommendations/posts?limit=10&type=hybrid
Authorization: Bearer {JWT_TOKEN}

Response:
{
  "success": true,
  "recommendations": [
    {
      "post_id": 1,
      "title": "게시물 제목",
      "score": 0.85,
      "category_id": 1,
      "likes_count": 42,
      "views_count": 156,
      "created_at": "2025-11-09T10:00:00Z"
    }
  ],
  "cached": false,
  "count": 10
}
```

#### 유사 게시물 추천
```http
GET /api/recommendations/similar/123?limit=5

Response:
{
  "success": true,
  "post_id": 123,
  "similar_posts": [
    {
      "post_id": 124,
      "title": "유사 게시물",
      "similarity_score": 0.92,
      ...
    }
  ],
  "count": 5
}
```

#### 트렌딩 게시물
```http
POST /api/recommendations/trending?limit=10&days=7

Response:
{
  "success": true,
  "trending": [...],
  "period_days": 7,
  "count": 10
}
```

#### 헬스 체크
```http
GET /api/recommendations/health

Response:
{
  "express": "healthy",
  "mlService": {
    "healthy": true,
    "data": {
      "status": "healthy",
      "data_loaded": true,
      "cache_enabled": true
    }
  }
}
```

### 4.2 관리자 전용 API

#### 데이터 리프레시
```http
POST /api/recommendations/refresh
Authorization: Bearer {ADMIN_JWT_TOKEN}

Response:
{
  "success": true,
  "message": "ML service data refreshed",
  "timestamp": "2025-11-09T10:00:00Z"
}
```

#### 캐시 클리어
```http
DELETE /api/recommendations/cache?pattern=recommendations:*
Authorization: Bearer {ADMIN_JWT_TOKEN}

Response:
{
  "success": true,
  "message": "Cache cleared",
  "cleared_keys": 42
}
```

## 5. 컴포넌트 사용법

### 5.1 RecommendedPosts (홈페이지)

```tsx
import RecommendedPosts from '../components/recommendations/RecommendedPosts';

// 사용 예시
<RecommendedPosts 
  limit={10} 
  recommendationType="hybrid"  // hybrid, collaborative, content
/>
```

### 5.2 SimilarPosts (게시물 상세)

```tsx
import { SimilarPosts } from '../components/recommendations/SimilarPosts';

// 사용 예시
<SimilarPosts 
  postId={123} 
  limit={5} 
/>
```

## 6. 테스트

### 6.1 Python ML 서비스 테스트

```bash
cd ml-service

# 헬스 체크
curl http://localhost:8000/health

# 유사 게시물 추천 (API 키 필요)
curl -X POST "http://localhost:8000/recommend/similar/1?limit=5" \
  -H "X-API-Key: your_ml_api_key"
```

### 6.2 Express 백엔드 테스트

```bash
# 헬스 체크
curl http://localhost:5000/api/recommendations/health

# 트렌딩 게시물 (인증 불필요)
curl -X POST "http://localhost:5000/api/recommendations/trending?limit=10"

# 사용자 맞춤 추천 (JWT 토큰 필요)
curl http://localhost:5000/api/recommendations/posts?limit=10 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 6.3 통합 테스트 체크리스트

- [ ] Python ML 서비스 실행 확인 (http://localhost:8000/docs)
- [ ] Express 백엔드 실행 확인 (http://localhost:5000/health)
- [ ] React 프론트엔드 실행 확인 (http://localhost:3000 또는 5173)
- [ ] MySQL 데이터베이스 연결 확인
- [ ] Redis 연결 확인 (선택사항)
- [ ] 헬스 체크 API 응답 확인
- [ ] 트렌딩 게시물 API 응답 확인
- [ ] 로그인 후 맞춤 추천 API 응답 확인
- [ ] 게시물 상세 페이지에서 유사 게시물 표시 확인
- [ ] 응답 시간 500ms 이하 확인

## 7. 트러블슈팅

### 7.1 Python 임포트 오류
```bash
# 가상환경 활성화 확인
which python  # Linux/Mac
where python  # Windows

# 패키지 재설치
pip install -r requirements.txt --upgrade
```

### 7.2 ML 서비스 연결 실패
- Express `.env`에서 `ML_SERVICE_URL` 확인
- Python 서버가 실행 중인지 확인
- API 키가 양쪽에서 일치하는지 확인

### 7.3 Redis 연결 오류
```bash
# Redis 서버 시작
redis-server

# 또는 캐싱 비활성화
CACHE_ENABLED=False  # Python
# Redis 관련 에러는 자동으로 fallback
```

### 7.4 데이터베이스 연결 오류
- MySQL 서버 실행 확인
- 데이터베이스 존재 확인
- 사용자 권한 확인
- `.env` 파일의 DB 설정 확인

### 7.5 CORS 오류
```javascript
// server-backend/app.js에서 CORS 설정 확인
cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
})
```

## 8. 성능 최적화

### 8.1 Redis 캐싱
- 추천 결과: 1시간 TTL
- 트렌딩: 10분 TTL
- 캐시 키 패턴: `recommendations:{type}:{params}`

### 8.2 데이터 리프레시
- 자동 리프레시: 1시간마다
- 수동 리프레시: 관리자 API 사용

### 8.3 응답 시간 목표
- ML 서비스: < 300ms
- Express API: < 500ms
- 프론트엔드 렌더링: < 1000ms

## 9. 배포 가이드

### 9.1 Python ML 서비스 (Docker)

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### 9.2 환경 변수 (프로덕션)

```env
# Python
DEBUG=False
LOG_LEVEL=WARNING

# Express
NODE_ENV=production
ML_SERVICE_URL=http://ml-service:8000

# 보안
ML_API_KEY=강력한_무작위_키_사용
JWT_SECRET=강력한_무작위_키_사용
```

## 10. 모니터링

### 10.1 로그 위치
- Python: `ml-service/ml_service.log`
- Express: 콘솔 출력
- React: 브라우저 콘솔

### 10.2 주요 메트릭
- API 응답 시간
- 캐시 히트율
- ML 모델 정확도
- 추천 클릭률 (CTR)

## 11. 추가 리소스

- Python ML 서비스 API 문서: http://localhost:8000/docs
- Express API 엔드포인트: http://localhost:5000/api/recommendations
- 프로젝트 문서: `PHASE3_TASK4_COMPLETION_REPORT.md`

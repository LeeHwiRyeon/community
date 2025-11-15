# ML Recommendation Service

Python 기반의 머신러닝 추천 시스템 서비스입니다.

## 기능

- **협업 필터링 (Collaborative Filtering)**: 사용자 기반 추천
- **콘텐츠 기반 필터링 (Content-Based Filtering)**: 게시물 유사도 기반 추천
- **하이브리드 추천 (Hybrid Recommendation)**: 협업 + 콘텐츠 기반 결합
- **트렌딩 게시물**: 인기 게시물 추천
- **Redis 캐싱**: 추천 결과 캐싱으로 성능 최적화

## 기술 스택

- **FastAPI**: 고성능 비동기 웹 프레임워크
- **scikit-learn**: 머신러닝 알고리즘 (TF-IDF, Cosine Similarity)
- **pandas**: 데이터 처리 및 분석
- **MySQL**: 데이터베이스
- **Redis**: 캐싱

## 설치

### 1. Python 환경 (Python 3.11+ 필요)

```bash
cd ml-service
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 2. 의존성 설치

```bash
pip install -r requirements.txt
```

### 3. 환경 변수 설정

```bash
cp .env.example .env
# .env 파일을 편집하여 데이터베이스 설정 등을 입력
```

필수 설정:
- `DB_PASSWORD`: MySQL 비밀번호
- `ML_API_KEY`: API 보안 키

## 실행

### 개발 모드

```bash
python app.py
```

### 프로덕션 모드

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --workers 4
```

서버 실행 후: http://localhost:8000/docs 에서 API 문서 확인

## API 엔드포인트

### 1. 헬스 체크

```http
GET /health
```

### 2. 사용자 맞춤 추천

```http
POST /recommend/posts
Content-Type: application/json
X-API-Key: your_api_key

{
  "user_id": 1,
  "limit": 10,
  "recommendation_type": "hybrid"
}
```

**recommendation_type**:
- `hybrid`: 협업 + 콘텐츠 기반 (기본값)
- `collaborative`: 사용자 기반 협업 필터링
- `content`: 콘텐츠 기반 필터링

### 3. 유사 게시물 추천

```http
POST /recommend/similar/123?limit=10
X-API-Key: your_api_key
```

### 4. 트렌딩 게시물

```http
POST /recommend/trending?limit=10&days=7
X-API-Key: your_api_key
```

### 5. 캐시 클리어

```http
POST /cache/clear
X-API-Key: your_api_key
```

### 6. 데이터 리프레시

```http
POST /data/refresh
X-API-Key: your_api_key
```

## 추천 알고리즘

### 협업 필터링
- 사용자 간 유사도 계산 (Cosine Similarity)
- 상호작용 가중치: 좋아요(3.0) > 댓글(2.0) > 조회(1.0)
- 시간 감쇠 적용 (30일 half-life)

### 콘텐츠 기반 필터링
- TF-IDF 벡터화 (제목 + 내용)
- Cosine Similarity로 유사도 계산
- 최대 1000개 특징 추출

### 하이브리드 추천
- 협업 필터링 60% + 콘텐츠 기반 40%
- 가중치는 환경 변수로 조정 가능

## 성능 최적화

- **Redis 캐싱**: 1시간 TTL
- **데이터 리프레시**: 1시간마다 자동 갱신
- **커넥션 풀**: MySQL 커넥션 풀 (크기: 5)
- **비동기 처리**: FastAPI의 async/await 활용

## 로깅

로그 파일: `ml_service.log`
- 자동 로테이션: 100MB
- 보관 기간: 30일

## 테스트

```bash
pytest tests/ -v
```

## 프로젝트 구조

```
ml-service/
├── app.py                    # FastAPI 메인 애플리케이션
├── recommendation_engine.py  # 추천 알고리즘 구현
├── database.py              # 데이터베이스 연결 및 쿼리
├── config.py                # 설정 관리
├── utils.py                 # 유틸리티 함수
├── requirements.txt         # Python 의존성
├── .env.example            # 환경 변수 예제
└── README.md               # 이 파일
```

## 문제 해결

### 1. MySQL 연결 실패
- `.env` 파일의 데이터베이스 설정 확인
- MySQL 서버가 실행 중인지 확인

### 2. Redis 연결 실패
- Redis 서버 실행: `redis-server`
- 또는 `CACHE_ENABLED=False`로 캐싱 비활성화

### 3. 임포트 오류
```bash
pip install -r requirements.txt --upgrade
```

### 4. 메모리 부족
- `MAX_POSTS_LOAD`, `MAX_USERS_LOAD` 값을 줄여서 조정

## 라이선스

MIT

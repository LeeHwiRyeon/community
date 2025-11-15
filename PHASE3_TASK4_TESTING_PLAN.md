# Phase 3 Task #4 - 콘텐츠 추천 엔진 테스트 계획

**버전**: 1.0  
**작성일**: 2025년 11월 9일  
**상태**: 계획 수립 완료

---

## 📋 목차

1. [테스트 개요](#테스트-개요)
2. [테스트 환경 설정](#테스트-환경-설정)
3. [단위 테스트 (Unit Tests)](#단위-테스트-unit-tests)
4. [통합 테스트 (Integration Tests)](#통합-테스트-integration-tests)
5. [E2E 테스트 (End-to-End Tests)](#e2e-테스트-end-to-end-tests)
6. [정확도 평가 (Accuracy Evaluation)](#정확도-평가-accuracy-evaluation)
7. [성능 테스트 (Performance Tests)](#성능-테스트-performance-tests)
8. [테스트 일정](#테스트-일정)
9. [성공 기준](#성공-기준)

---

## 테스트 개요

### 테스트 목표
- **기능 검증**: 추천 시스템의 모든 기능이 정상 동작하는지 확인
- **정확도 평가**: 추천 알고리즘의 품질 측정 (Precision, Recall, F1-Score)
- **성능 검증**: 응답 시간, 처리량, 확장성 확인
- **안정성 확인**: 오류 처리, 예외 상황 대응 검증

### 테스트 범위
- ✅ Python 추천 서비스 (recommendation-service/)
- ✅ Express 백엔드 API (server-backend/src/routes/recommendations.js)
- ✅ React 프론트엔드 컴포넌트 (frontend/src/components/recommendations/)
- ✅ 추천 알고리즘 정확도
- ✅ 캐싱 레이어 (Redis)
- ✅ 데이터베이스 연동

### 테스트 제외 사항
- ❌ MySQL 데이터베이스 자체 테스트 (인프라 테스트)
- ❌ Redis 서버 안정성 테스트
- ❌ 네트워크 레이어 테스트

---

## 테스트 환경 설정

### 1. Python 테스트 환경

#### 설치 (recommendation-service/)
```bash
cd recommendation-service
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt
pip install pytest pytest-cov pytest-mock pytest-asyncio faker
```

#### 테스트 데이터베이스 설정
- MySQL 테스트 DB 생성: `community_test`
- 테스트 데이터 시드: 100명 사용자, 500개 게시물, 2000개 인터랙션
- `.env.test` 파일 생성

```env
# .env.test
DB_HOST=localhost
DB_PORT=3306
DB_USER=test_user
DB_PASSWORD=test_password
DB_NAME=community_test

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=1  # 테스트용 DB

ENABLE_CACHE=true
MIN_INTERACTIONS=3
TOP_N_ITEMS=10
SIMILARITY_THRESHOLD=0.1
```

### 2. Express 백엔드 테스트 환경

#### 설치 (server-backend/)
```bash
cd server-backend
npm install --save-dev supertest jest @types/jest
```

#### Jest 설정 (jest.config.js)
```javascript
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js'
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ]
};
```

### 3. 프론트엔드 테스트 환경

#### 설치 (frontend/)
```bash
cd frontend
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest jsdom
```

#### Vitest 설정 (vitest.config.ts)
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    coverage: {
      reporter: ['text', 'json', 'html']
    }
  }
});
```

### 4. E2E 테스트 환경

#### Playwright 설정 확인
```bash
cd frontend
npx playwright install
```

---

## 단위 테스트 (Unit Tests)

### 1. Python 추천 서비스 단위 테스트

#### 파일 구조
```
recommendation-service/tests/
├── __init__.py
├── conftest.py                 # pytest fixtures
├── test_recommender.py         # 추천 알고리즘 테스트
├── test_database_service.py    # DB 서비스 테스트
└── test_cache_service.py       # 캐시 서비스 테스트
```

#### test_recommender.py (추천 알고리즘 테스트)

**테스트 케이스**:
1. **초기화 테스트**
   - `test_initialize_recommender()`: 추천 시스템 초기화 성공
   - `test_initialize_with_no_data()`: 데이터 없을 때 처리
   
2. **협업 필터링 테스트**
   - `test_collaborative_filtering()`: 유사 사용자 기반 추천
   - `test_collaborative_filtering_cold_start()`: 신규 사용자 처리 (인터랙션 < 5)
   - `test_collaborative_filtering_similarity()`: 코사인 유사도 계산

3. **콘텐츠 기반 필터링 테스트**
   - `test_content_based_filtering()`: TF-IDF 기반 추천
   - `test_content_based_similar_posts()`: 유사 게시물 찾기
   - `test_content_based_empty_content()`: 빈 콘텐츠 처리

4. **하이브리드 추천 테스트**
   - `test_hybrid_recommendation()`: 60-40 가중치 결합
   - `test_hybrid_recommendation_weights()`: 가중치 변경 테스트
   - `test_recommend_posts()`: 전체 추천 파이프라인

5. **예외 처리 테스트**
   - `test_invalid_user_id()`: 잘못된 사용자 ID
   - `test_invalid_post_id()`: 잘못된 게시물 ID
   - `test_database_error_handling()`: DB 오류 처리

**예시 코드**:
```python
# recommendation-service/tests/test_recommender.py
import pytest
from models.recommender import HybridRecommender
from services.database_service import DatabaseService
from services.cache_service import CacheService

@pytest.fixture
def recommender(mock_db_service, mock_cache_service):
    """추천 시스템 fixture"""
    recommender = HybridRecommender(
        db_service=mock_db_service,
        cache_service=mock_cache_service
    )
    recommender.initialize()
    return recommender

def test_recommend_posts_success(recommender):
    """게시물 추천 성공 테스트"""
    user_id = 1
    limit = 5
    
    recommendations = recommender.recommend_posts(user_id, limit)
    
    assert len(recommendations) <= limit
    assert all('post_id' in rec for rec in recommendations)
    assert all('score' in rec for rec in recommendations)
    assert all(0 <= rec['score'] <= 1 for rec in recommendations)

def test_recommend_posts_cold_start(recommender):
    """신규 사용자 추천 테스트 (Cold Start)"""
    new_user_id = 9999
    limit = 5
    
    # 인터랙션이 5개 미만인 신규 사용자
    recommendations = recommender.recommend_posts(new_user_id, limit)
    
    # 인기 게시물 추천 확인
    assert len(recommendations) > 0
    assert all('post_id' in rec for rec in recommendations)

def test_collaborative_filtering_similarity(recommender):
    """협업 필터링 유사도 계산 테스트"""
    user_id = 1
    
    # User-Item Matrix 확인
    assert recommender.user_item_matrix is not None
    
    # 코사인 유사도 계산
    similarities = recommender.user_similarity[user_id]
    
    assert similarities is not None
    assert len(similarities) > 0
    assert all(0 <= sim <= 1 for sim in similarities)

def test_content_based_filtering(recommender):
    """콘텐츠 기반 필터링 테스트"""
    post_id = 1
    limit = 5
    
    similar_posts = recommender.recommend_similar_posts(post_id, limit)
    
    assert len(similar_posts) <= limit
    assert all('post_id' in post for post in similar_posts)
    assert all('similarity' in post for post in similar_posts)
    assert post_id not in [p['post_id'] for p in similar_posts]

def test_hybrid_recommendation_weights(recommender):
    """하이브리드 가중치 테스트"""
    user_id = 1
    limit = 10
    
    # 협업 필터링만
    recommender.use_hybrid = False
    collab_recs = recommender.recommend_posts(user_id, limit)
    
    # 하이브리드
    recommender.use_hybrid = True
    hybrid_recs = recommender.recommend_posts(user_id, limit)
    
    # 결과가 다른지 확인
    collab_ids = set(r['post_id'] for r in collab_recs)
    hybrid_ids = set(r['post_id'] for r in hybrid_recs)
    
    assert len(collab_ids.symmetric_difference(hybrid_ids)) > 0
```

#### test_database_service.py (DB 서비스 테스트)

**테스트 케이스**:
1. `test_connect_database()`: DB 연결 성공
2. `test_get_user_interactions()`: 사용자 인터랙션 조회
3. `test_get_all_interactions()`: 전체 인터랙션 조회
4. `test_get_post_features()`: 게시물 특성 조회
5. `test_get_all_posts_features()`: 전체 게시물 특성 조회
6. `test_database_connection_error()`: DB 연결 오류 처리
7. `test_query_error_handling()`: 쿼리 오류 처리

#### test_cache_service.py (캐시 서비스 테스트)

**테스트 케이스**:
1. `test_redis_connection()`: Redis 연결 성공
2. `test_cache_set_get()`: 캐시 저장/조회
3. `test_cache_expiration()`: TTL 만료 테스트
4. `test_cache_invalidation()`: 캐시 무효화
5. `test_fallback_to_memory()`: Redis 장애 시 인메모리 폴백

#### 실행 방법
```bash
cd recommendation-service

# 전체 테스트 실행
pytest

# 커버리지 포함 실행
pytest --cov=. --cov-report=html

# 특정 테스트 실행
pytest tests/test_recommender.py::test_recommend_posts_success -v

# 마크된 테스트만 실행
pytest -m "not slow"
```

### 2. Express 백엔드 단위 테스트

#### 파일 구조
```
server-backend/tests/
├── recommendations.test.js     # 추천 API 테스트
└── setup.js                    # 테스트 설정
```

#### recommendations.test.js

**테스트 케이스**:
1. **인증 테스트**
   - `test_unauthorized_access()`: 인증 없이 접근 시 401
   - `test_invalid_token()`: 잘못된 토큰 403
   
2. **권한 테스트**
   - `test_access_other_user_recommendations()`: 다른 사용자 추천 접근 금지
   - `test_admin_access_all_recommendations()`: 관리자는 모든 추천 접근 가능
   
3. **API 엔드포인트 테스트**
   - `test_get_post_recommendations()`: 게시물 추천 조회
   - `test_get_user_recommendations()`: 사용자 추천 조회
   - `test_get_similar_posts()`: 유사 게시물 조회 (공개)
   - `test_refresh_model()`: 모델 갱신 (관리자만)
   - `test_get_stats()`: 통계 조회 (관리자만)
   - `test_health_check()`: 헬스 체크 (공개)
   
4. **Python 서비스 연동 테스트**
   - `test_python_service_timeout()`: Python 서비스 타임아웃 처리
   - `test_python_service_error()`: Python 서비스 오류 처리
   - `test_python_service_unavailable()`: Python 서비스 미실행 처리

**예시 코드**:
```javascript
// server-backend/tests/recommendations.test.js
const request = require('supertest');
const app = require('../src/server');
const jwt = require('../src/auth/jwt');

describe('Recommendations API', () => {
  let userToken, adminToken;
  
  beforeAll(() => {
    // 테스트용 토큰 생성
    userToken = jwt.generateAccessToken({ user_id: 1, role: 'user' });
    adminToken = jwt.generateAccessToken({ user_id: 2, role: 'admin' });
  });
  
  describe('POST /api/recommendations/posts/:userId', () => {
    it('should return post recommendations for authenticated user', async () => {
      const response = await request(app)
        .get('/api/recommendations/posts/1')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ limit: 5 });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });
    
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/recommendations/posts/1');
      
      expect(response.status).toBe(401);
    });
    
    it('should return 403 when accessing other user recommendations', async () => {
      const response = await request(app)
        .get('/api/recommendations/posts/999')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(403);
    });
  });
  
  describe('GET /api/recommendations/similar/:postId', () => {
    it('should return similar posts without authentication', async () => {
      const response = await request(app)
        .get('/api/recommendations/similar/1')
        .query({ limit: 5 });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
  
  describe('POST /api/recommendations/refresh', () => {
    it('should allow admin to refresh model', async () => {
      const response = await request(app)
        .post('/api/recommendations/refresh')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .post('/api/recommendations/refresh')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(403);
    });
  });
});
```

#### 실행 방법
```bash
cd server-backend

# 전체 테스트 실행
npm test

# 특정 파일 테스트
npm test -- recommendations.test.js

# 커버리지 포함
npm test -- --coverage
```

### 3. 프론트엔드 컴포넌트 단위 테스트

#### 파일 구조
```
frontend/src/tests/
├── setup.ts                                        # 테스트 설정
├── components/
│   ├── RecommendedPosts.test.tsx                  # 추천 게시물 테스트
│   └── SimilarPosts.test.tsx                      # 유사 게시물 테스트
└── services/
    └── recommendationService.test.ts              # API 서비스 테스트
```

#### RecommendedPosts.test.tsx

**테스트 케이스**:
1. `test_render_loading_state()`: 로딩 상태 렌더링
2. `test_render_recommendations()`: 추천 목록 렌더링
3. `test_render_empty_state()`: 추천 없을 때 렌더링
4. `test_render_error_state()`: 오류 상태 렌더링
5. `test_score_badge_colors()`: 점수 배지 색상 확인
6. `test_refresh_button()`: 새로고침 버튼 클릭
7. `test_post_click()`: 게시물 클릭 이벤트

**예시 코드**:
```typescript
// frontend/src/tests/components/RecommendedPosts.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import RecommendedPosts from '../../components/recommendations/RecommendedPosts';
import * as recommendationService from '../../services/recommendationService';

vi.mock('../../services/recommendationService');

describe('RecommendedPosts Component', () => {
  const mockRecommendations = [
    {
      post_id: 1,
      title: 'Test Post 1',
      content: 'Content 1',
      score: 0.95,
      author_username: 'user1',
      category_name: 'Tech',
      created_at: '2025-11-01T10:00:00Z',
      views_count: 100,
      likes_count: 20,
      comments_count: 5
    },
    {
      post_id: 2,
      title: 'Test Post 2',
      content: 'Content 2',
      score: 0.75,
      author_username: 'user2',
      category_name: 'News',
      created_at: '2025-11-02T10:00:00Z',
      views_count: 50,
      likes_count: 10,
      comments_count: 2
    }
  ];
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should render loading state initially', () => {
    vi.spyOn(recommendationService, 'getPostRecommendations').mockImplementation(
      () => new Promise(() => {}) // pending promise
    );
    
    render(<RecommendedPosts userId={1} />);
    
    expect(screen.getByText(/로딩 중/i)).toBeInTheDocument();
  });
  
  it('should render recommendations successfully', async () => {
    vi.spyOn(recommendationService, 'getPostRecommendations').mockResolvedValue(
      mockRecommendations
    );
    
    render(<RecommendedPosts userId={1} limit={5} />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      expect(screen.getByText('Test Post 2')).toBeInTheDocument();
    });
  });
  
  it('should display correct score badges', async () => {
    vi.spyOn(recommendationService, 'getPostRecommendations').mockResolvedValue(
      mockRecommendations
    );
    
    render(<RecommendedPosts userId={1} />);
    
    await waitFor(() => {
      const highBadge = screen.getByText('95%');
      const mediumBadge = screen.getByText('75%');
      
      expect(highBadge).toHaveClass('score-high');
      expect(mediumBadge).toHaveClass('score-medium');
    });
  });
  
  it('should handle refresh button click', async () => {
    const mockGetRecommendations = vi.spyOn(
      recommendationService,
      'getPostRecommendations'
    ).mockResolvedValue(mockRecommendations);
    
    render(<RecommendedPosts userId={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Post 1')).toBeInTheDocument();
    });
    
    const refreshButton = screen.getByRole('button', { name: /새로고침/i });
    await userEvent.click(refreshButton);
    
    expect(mockGetRecommendations).toHaveBeenCalledTimes(2);
  });
  
  it('should render error state', async () => {
    vi.spyOn(recommendationService, 'getPostRecommendations').mockRejectedValue(
      new Error('API Error')
    );
    
    render(<RecommendedPosts userId={1} />);
    
    await waitFor(() => {
      expect(screen.getByText(/오류가 발생했습니다/i)).toBeInTheDocument();
    });
  });
});
```

#### 실행 방법
```bash
cd frontend

# 전체 테스트 실행
npm test

# 특정 파일 테스트
npm test RecommendedPosts.test.tsx

# 커버리지 포함
npm test -- --coverage

# UI 모드 (인터랙티브)
npm test -- --ui
```

---

## 통합 테스트 (Integration Tests)

### 1. Python 서비스 통합 테스트

#### test_integration.py

**테스트 케이스**:
1. **전체 추천 파이프라인**
   - DB에서 데이터 로드 → 모델 학습 → 추천 생성 → 캐시 저장
   
2. **캐시 통합**
   - 첫 요청 시 DB 조회 → 캐시 저장
   - 두 번째 요청 시 캐시에서 조회
   - 캐시 만료 후 DB 재조회
   
3. **실제 데이터베이스 연동**
   - 테스트 DB에 시드 데이터 삽입
   - 추천 생성 및 검증

**예시 코드**:
```python
# recommendation-service/tests/test_integration.py
import pytest
from main import app
from services.database_service import DatabaseService
from services.cache_service import CacheService
from models.recommender import HybridRecommender

@pytest.fixture(scope="module")
def test_db():
    """테스트 DB fixture"""
    db = DatabaseService()
    db.connect()
    
    # 테스트 데이터 삽입
    seed_test_data(db)
    
    yield db
    
    # 테스트 데이터 삭제
    cleanup_test_data(db)
    db.disconnect()

@pytest.fixture(scope="module")
def test_cache():
    """테스트 캐시 fixture"""
    cache = CacheService()
    cache.connect()
    yield cache
    cache.disconnect()

def test_full_recommendation_pipeline(test_db, test_cache):
    """전체 추천 파이프라인 통합 테스트"""
    # 1. 추천 시스템 초기화
    recommender = HybridRecommender(test_db, test_cache)
    recommender.initialize()
    
    # 2. 사용자 추천 생성
    user_id = 1
    recommendations = recommender.recommend_posts(user_id, limit=10)
    
    # 3. 검증
    assert len(recommendations) > 0
    assert all('post_id' in rec for rec in recommendations)
    assert all('score' in rec for rec in recommendations)
    
    # 4. 캐시 확인
    cache_key = test_cache.get_recommendation_cache_key('posts', user_id)
    cached_data = test_cache.get(cache_key)
    assert cached_data is not None

def test_cache_hit_performance(test_db, test_cache):
    """캐시 히트 성능 테스트"""
    import time
    
    recommender = HybridRecommender(test_db, test_cache)
    recommender.initialize()
    
    user_id = 1
    
    # 첫 요청 (캐시 미스)
    start = time.time()
    recs1 = recommender.recommend_posts(user_id, limit=10)
    time_no_cache = time.time() - start
    
    # 두 번째 요청 (캐시 히트)
    start = time.time()
    recs2 = recommender.recommend_posts(user_id, limit=10)
    time_with_cache = time.time() - start
    
    # 캐시가 더 빨라야 함
    assert time_with_cache < time_no_cache
    assert recs1 == recs2
```

### 2. Express + Python 통합 테스트

#### test_express_python_integration.js

**테스트 케이스**:
1. Express → Python 서비스 호출 성공
2. Python 서비스 응답 파싱
3. 타임아웃 처리
4. 재시도 로직

**예시 코드**:
```javascript
// server-backend/tests/test_express_python_integration.js
const request = require('supertest');
const app = require('../src/server');
const axios = require('axios');

jest.mock('axios');

describe('Express-Python Integration', () => {
  it('should successfully call Python service', async () => {
    const mockPythonResponse = {
      data: {
        recommendations: [
          { post_id: 1, score: 0.95 },
          { post_id: 2, score: 0.85 }
        ]
      }
    };
    
    axios.get.mockResolvedValue(mockPythonResponse);
    
    const response = await request(app)
      .get('/api/recommendations/posts/1')
      .set('Authorization', 'Bearer ' + validToken)
      .query({ limit: 5 });
    
    expect(response.status).toBe(200);
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('http://localhost:8000'),
      expect.any(Object)
    );
  });
  
  it('should handle Python service timeout', async () => {
    axios.get.mockRejectedValue({ code: 'ECONNABORTED' });
    
    const response = await request(app)
      .get('/api/recommendations/posts/1')
      .set('Authorization', 'Bearer ' + validToken);
    
    expect(response.status).toBe(504);
    expect(response.body.error).toMatch(/timeout/i);
  });
});
```

---

## E2E 테스트 (End-to-End Tests)

### Playwright E2E 테스트

#### 파일: frontend/tests/e2e/recommendations.spec.ts

**테스트 시나리오**:
1. **추천 게시물 플로우**
   - 사용자 로그인
   - 홈페이지에서 "추천 게시물" 섹션 확인
   - 추천 게시물 클릭
   - 게시물 상세 페이지 이동 확인
   
2. **유사 게시물 플로우**
   - 게시물 상세 페이지 접근
   - "유사한 게시물" 섹션 확인
   - 유사 게시물 클릭
   - 새 게시물 상세 페이지 이동
   
3. **새로고침 플로우**
   - 추천 섹션에서 새로고침 버튼 클릭
   - 로딩 상태 확인
   - 새로운 추천 목록 표시 확인

**예시 코드**:
```typescript
// frontend/tests/e2e/recommendations.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Recommendation System E2E', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('http://localhost:5173/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:5173/home');
  });
  
  test('should display recommended posts on home page', async ({ page }) => {
    // 추천 게시물 섹션 확인
    const recommendedSection = page.locator('.recommended-posts');
    await expect(recommendedSection).toBeVisible();
    
    // 추천 게시물 목록 확인
    const postCards = recommendedSection.locator('.recommendation-card');
    const count = await postCards.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(5);
    
    // 점수 배지 확인
    const firstCard = postCards.first();
    await expect(firstCard.locator('.score-badge')).toBeVisible();
  });
  
  test('should navigate to post detail when clicking recommendation', async ({ page }) => {
    // 첫 번째 추천 게시물 클릭
    await page.click('.recommended-posts .recommendation-card:first-child');
    
    // 게시물 상세 페이지로 이동 확인
    await expect(page).toHaveURL(/\/posts\/\d+/);
    
    // 게시물 제목 확인
    await expect(page.locator('h1.post-title')).toBeVisible();
  });
  
  test('should display similar posts on post detail page', async ({ page }) => {
    // 게시물 상세 페이지로 이동
    await page.goto('http://localhost:5173/posts/1');
    
    // 유사 게시물 섹션 확인
    const similarSection = page.locator('.similar-posts');
    await expect(similarSection).toBeVisible();
    
    // 유사 게시물 목록 확인
    const similarPosts = similarSection.locator('.similar-post-item');
    const count = await similarPosts.count();
    expect(count).toBeGreaterThan(0);
    
    // 유사도 점수 확인
    const firstSimilar = similarPosts.first();
    await expect(firstSimilar.locator('.similarity-score')).toBeVisible();
  });
  
  test('should refresh recommendations on button click', async ({ page }) => {
    // 새로고침 버튼 클릭
    const refreshButton = page.locator('.recommended-posts button:has-text("새로고침")');
    await refreshButton.click();
    
    // 로딩 스피너 확인
    await expect(page.locator('.loading-spinner')).toBeVisible();
    
    // 로딩 완료 대기
    await expect(page.locator('.loading-spinner')).not.toBeVisible({ timeout: 5000 });
    
    // 추천 목록 다시 표시 확인
    const postCards = page.locator('.recommended-posts .recommendation-card');
    const count = await postCards.count();
    expect(count).toBeGreaterThan(0);
  });
  
  test('should handle empty recommendations gracefully', async ({ page }) => {
    // 신규 사용자로 로그인 (인터랙션 없음)
    await page.goto('http://localhost:5173/login');
    await page.fill('input[name="username"]', 'newuser');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 빈 상태 메시지 확인
    const emptyMessage = page.locator('.recommended-posts .empty-message');
    await expect(emptyMessage).toBeVisible();
    await expect(emptyMessage).toContainText(/추천할 게시물이 없습니다/i);
  });
});
```

#### 실행 방법
```bash
cd frontend

# Python 서비스 시작 (별도 터미널)
cd ../recommendation-service
python main.py

# Express 서버 시작 (별도 터미널)
cd ../server-backend
npm start

# Frontend 개발 서버 시작 (별도 터미널)
cd ../frontend
npm run dev

# E2E 테스트 실행
npm run test:e2e

# 헤드리스 모드
npx playwright test

# UI 모드 (디버깅)
npx playwright test --ui

# 특정 브라우저
npx playwright test --project=chromium
```

---

## 정확도 평가 (Accuracy Evaluation)

### 평가 메트릭

#### 1. Precision (정밀도)
- **정의**: 추천한 항목 중 실제로 관련 있는 항목의 비율
- **계산**: `Precision = (관련 있는 추천 수) / (총 추천 수)`
- **목표**: ≥ 0.60 (60%)

#### 2. Recall (재현율)
- **정의**: 관련 있는 항목 중 실제로 추천한 항목의 비율
- **계산**: `Recall = (관련 있는 추천 수) / (총 관련 항목 수)`
- **목표**: ≥ 0.50 (50%)

#### 3. F1-Score
- **정의**: Precision과 Recall의 조화 평균
- **계산**: `F1 = 2 * (Precision * Recall) / (Precision + Recall)`
- **목표**: ≥ 0.55 (55%)

#### 4. NDCG (Normalized Discounted Cumulative Gain)
- **정의**: 추천 순위의 품질 평가
- **계산**: 상위 K개 항목의 관련성을 위치에 따라 가중치 부여
- **목표**: NDCG@10 ≥ 0.65

### 평가 스크립트

#### evaluation.py

```python
# recommendation-service/evaluation.py
import numpy as np
from sklearn.metrics import precision_score, recall_score, f1_score, ndcg_score
from models.recommender import HybridRecommender
from services.database_service import DatabaseService
from services.cache_service import CacheService

class RecommendationEvaluator:
    def __init__(self, recommender, db_service):
        self.recommender = recommender
        self.db_service = db_service
    
    def prepare_test_set(self, test_ratio=0.2):
        """테스트 세트 준비 (20% 홀드아웃)"""
        # 모든 인터랙션 가져오기
        all_interactions = self.db_service.get_all_interactions()
        
        # 사용자별로 분할
        train_set = []
        test_set = []
        
        for user_id in set(i['user_id'] for i in all_interactions):
            user_interactions = [i for i in all_interactions if i['user_id'] == user_id]
            
            # 시간순 정렬 (최신 20%를 테스트용)
            user_interactions.sort(key=lambda x: x['created_at'])
            split_idx = int(len(user_interactions) * (1 - test_ratio))
            
            train_set.extend(user_interactions[:split_idx])
            test_set.extend(user_interactions[split_idx:])
        
        return train_set, test_set
    
    def calculate_precision_recall(self, user_id, recommendations, test_interactions):
        """Precision과 Recall 계산"""
        # 추천된 게시물 ID
        recommended_post_ids = set(rec['post_id'] for rec in recommendations)
        
        # 실제로 상호작용한 게시물 ID (테스트 세트)
        actual_post_ids = set(i['post_id'] for i in test_interactions if i['user_id'] == user_id)
        
        if len(actual_post_ids) == 0:
            return 0, 0, 0
        
        # True Positives
        tp = len(recommended_post_ids & actual_post_ids)
        
        # Precision
        precision = tp / len(recommended_post_ids) if len(recommended_post_ids) > 0 else 0
        
        # Recall
        recall = tp / len(actual_post_ids) if len(actual_post_ids) > 0 else 0
        
        # F1-Score
        f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
        
        return precision, recall, f1
    
    def calculate_ndcg(self, user_id, recommendations, test_interactions, k=10):
        """NDCG@k 계산"""
        # 실제 관련성 (1: 상호작용 있음, 0: 없음)
        actual_post_ids = set(i['post_id'] for i in test_interactions if i['user_id'] == user_id)
        
        # 추천 점수 (0 또는 1)
        relevance_scores = [
            1 if rec['post_id'] in actual_post_ids else 0
            for rec in recommendations[:k]
        ]
        
        if sum(relevance_scores) == 0:
            return 0
        
        # NDCG 계산
        dcg = sum(
            rel / np.log2(idx + 2)  # +2 because log2(1) = 0
            for idx, rel in enumerate(relevance_scores)
        )
        
        # IDCG (Ideal DCG)
        ideal_relevance = sorted(relevance_scores, reverse=True)
        idcg = sum(
            rel / np.log2(idx + 2)
            for idx, rel in enumerate(ideal_relevance)
        )
        
        ndcg = dcg / idcg if idcg > 0 else 0
        return ndcg
    
    def evaluate(self, k=10):
        """전체 평가 수행"""
        print("=" * 60)
        print("추천 시스템 정확도 평가")
        print("=" * 60)
        
        # 1. 테스트 세트 준비
        print("\n1. 테스트 세트 준비 중...")
        train_set, test_set = self.prepare_test_set(test_ratio=0.2)
        print(f"   Train: {len(train_set)} interactions")
        print(f"   Test: {len(test_set)} interactions")
        
        # 2. 훈련 세트로 모델 학습
        print("\n2. 모델 학습 중...")
        self.recommender.initialize()
        
        # 3. 평가 수행
        print(f"\n3. Top-{k} 추천 평가 중...")
        
        user_ids = list(set(i['user_id'] for i in test_set))
        precisions = []
        recalls = []
        f1_scores = []
        ndcgs = []
        
        for user_id in user_ids:
            try:
                # 추천 생성
                recommendations = self.recommender.recommend_posts(user_id, limit=k)
                
                if len(recommendations) == 0:
                    continue
                
                # 메트릭 계산
                precision, recall, f1 = self.calculate_precision_recall(
                    user_id, recommendations, test_set
                )
                ndcg = self.calculate_ndcg(user_id, recommendations, test_set, k)
                
                precisions.append(precision)
                recalls.append(recall)
                f1_scores.append(f1)
                ndcgs.append(ndcg)
                
            except Exception as e:
                print(f"   오류 (User {user_id}): {str(e)}")
                continue
        
        # 4. 결과 출력
        print("\n" + "=" * 60)
        print("평가 결과")
        print("=" * 60)
        print(f"평가 사용자 수: {len(precisions)}")
        print(f"\n평균 Precision@{k}: {np.mean(precisions):.4f} ({'✅ 목표 달성' if np.mean(precisions) >= 0.60 else '❌ 목표 미달'})")
        print(f"평균 Recall@{k}:    {np.mean(recalls):.4f} ({'✅ 목표 달성' if np.mean(recalls) >= 0.50 else '❌ 목표 미달'})")
        print(f"평균 F1-Score@{k}:  {np.mean(f1_scores):.4f} ({'✅ 목표 달성' if np.mean(f1_scores) >= 0.55 else '❌ 목표 미달'})")
        print(f"평균 NDCG@{k}:      {np.mean(ndcgs):.4f} ({'✅ 목표 달성' if np.mean(ndcgs) >= 0.65 else '❌ 목표 미달'})")
        
        # 5. 상세 통계
        print(f"\n상세 통계:")
        print(f"  Precision - Min: {np.min(precisions):.4f}, Max: {np.max(precisions):.4f}, Std: {np.std(precisions):.4f}")
        print(f"  Recall    - Min: {np.min(recalls):.4f}, Max: {np.max(recalls):.4f}, Std: {np.std(recalls):.4f}")
        print(f"  F1-Score  - Min: {np.min(f1_scores):.4f}, Max: {np.max(f1_scores):.4f}, Std: {np.std(f1_scores):.4f}")
        print(f"  NDCG      - Min: {np.min(ndcgs):.4f}, Max: {np.max(ndcgs):.4f}, Std: {np.std(ndcgs):.4f}")
        
        return {
            'precision': np.mean(precisions),
            'recall': np.mean(recalls),
            'f1_score': np.mean(f1_scores),
            'ndcg': np.mean(ndcgs)
        }

if __name__ == '__main__':
    # 평가 실행
    db_service = DatabaseService()
    db_service.connect()
    
    cache_service = CacheService()
    cache_service.connect()
    
    recommender = HybridRecommender(db_service, cache_service)
    
    evaluator = RecommendationEvaluator(recommender, db_service)
    results = evaluator.evaluate(k=10)
    
    db_service.disconnect()
    cache_service.disconnect()
```

#### 실행 방법
```bash
cd recommendation-service

# 평가 실행
python evaluation.py

# 다른 K 값으로 평가
python evaluation.py --k 5
python evaluation.py --k 20
```

---

## 성능 테스트 (Performance Tests)

### 1. 응답 시간 테스트

#### 목표
- **추천 생성 시간**: < 2초 (캐시 미스)
- **캐시 히트 시간**: < 100ms
- **Python API 응답**: < 500ms
- **Express API 응답**: < 200ms

#### 테스트 도구: k6

**설치**:
```bash
# Windows (Chocolatey)
choco install k6

# macOS
brew install k6

# Linux
sudo apt-get install k6
```

#### load-test.js

```javascript
// recommendation-service/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 100 }, // Spike to 100 users
    { duration: '1m', target: 100 },  // Stay at 100 users
    { duration: '30s', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests < 2s
    http_req_failed: ['rate<0.01'],    // Error rate < 1%
  },
};

const BASE_URL = 'http://localhost:3001';
const TOKEN = 'YOUR_JWT_TOKEN_HERE';

export default function () {
  // 1. 게시물 추천 API
  let response = http.get(
    `${BASE_URL}/api/recommendations/posts/1?limit=10`,
    {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
      },
    }
  );
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 2s': (r) => r.timings.duration < 2000,
    'has recommendations': (r) => JSON.parse(r.body).data.length > 0,
  });
  
  sleep(1);
  
  // 2. 유사 게시물 API
  response = http.get(
    `${BASE_URL}/api/recommendations/similar/1?limit=5`
  );
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 1s': (r) => r.timings.duration < 1000,
  });
  
  sleep(1);
}
```

#### 실행 방법
```bash
# 모든 서비스 시작
# 1. Python 서비스
cd recommendation-service
python main.py

# 2. Express 서버
cd server-backend
npm start

# 3. k6 부하 테스트 실행
k6 run load-test.js

# 결과를 JSON으로 저장
k6 run --out json=load-test-results.json load-test.js

# 다양한 시나리오
k6 run --vus 50 --duration 30s load-test.js  # 50 users for 30s
k6 run --vus 100 --duration 1m load-test.js  # 100 users for 1m
```

### 2. 캐시 성능 테스트

#### cache-performance.py

```python
# recommendation-service/cache-performance.py
import time
from services.cache_service import CacheService
from services.database_service import DatabaseService
from models.recommender import HybridRecommender

def test_cache_performance():
    db = DatabaseService()
    db.connect()
    
    cache = CacheService()
    cache.connect()
    
    recommender = HybridRecommender(db, cache)
    recommender.initialize()
    
    user_id = 1
    limit = 10
    iterations = 100
    
    # 1. 캐시 미스 성능 (첫 요청)
    cache.invalidate_user_cache(user_id)
    start = time.time()
    recommender.recommend_posts(user_id, limit)
    cache_miss_time = time.time() - start
    
    # 2. 캐시 히트 성능 (반복 요청)
    cache_hit_times = []
    for _ in range(iterations):
        start = time.time()
        recommender.recommend_posts(user_id, limit)
        cache_hit_times.append(time.time() - start)
    
    avg_cache_hit = sum(cache_hit_times) / len(cache_hit_times)
    
    print("=" * 60)
    print("캐시 성능 테스트 결과")
    print("=" * 60)
    print(f"캐시 미스 시간: {cache_miss_time * 1000:.2f}ms")
    print(f"평균 캐시 히트 시간: {avg_cache_hit * 1000:.2f}ms")
    print(f"성능 향상: {cache_miss_time / avg_cache_hit:.2f}x")
    print(f"\n목표 달성 여부:")
    print(f"  캐시 미스 < 2s: {'✅' if cache_miss_time < 2 else '❌'} ({cache_miss_time:.2f}s)")
    print(f"  캐시 히트 < 100ms: {'✅' if avg_cache_hit * 1000 < 100 else '❌'} ({avg_cache_hit * 1000:.2f}ms)")
    
    db.disconnect()
    cache.disconnect()

if __name__ == '__main__':
    test_cache_performance()
```

#### 실행 방법
```bash
cd recommendation-service
python cache-performance.py
```

---

## 테스트 일정

### Week 1: 단위 테스트 및 통합 테스트 (3일)

#### Day 1: Python 단위 테스트
- [ ] recommender.py 테스트 작성 (10개 테스트)
- [ ] database_service.py 테스트 작성 (7개 테스트)
- [ ] cache_service.py 테스트 작성 (5개 테스트)
- [ ] 커버리지 90% 이상 달성

**예상 소요 시간**: 6시간

#### Day 2: Express 및 프론트엔드 테스트
- [ ] Express API 테스트 작성 (12개 테스트)
- [ ] React 컴포넌트 테스트 작성 (14개 테스트)
- [ ] API 서비스 테스트 작성 (6개 테스트)

**예상 소요 시간**: 6시간

#### Day 3: 통합 테스트
- [ ] Python 통합 테스트 작성 (5개 테스트)
- [ ] Express-Python 통합 테스트 (4개 테스트)
- [ ] 전체 파이프라인 테스트

**예상 소요 시간**: 4시간

### Week 2: E2E, 정확도, 성능 테스트 (3일)

#### Day 4: E2E 테스트
- [ ] Playwright 테스트 시나리오 작성 (6개)
- [ ] 전체 사용자 플로우 테스트
- [ ] 오류 상황 테스트

**예상 소요 시간**: 5시간

#### Day 5: 정확도 평가
- [ ] 테스트 데이터셋 생성 (100 users, 500 posts)
- [ ] evaluation.py 스크립트 작성
- [ ] Precision, Recall, F1, NDCG 측정
- [ ] 결과 분석 및 개선

**예상 소요 시간**: 6시간

#### Day 6: 성능 테스트 및 문서화
- [ ] k6 부하 테스트 작성 및 실행
- [ ] 캐시 성능 측정
- [ ] 병목 지점 분석
- [ ] 테스트 보고서 작성

**예상 소요 시간**: 5시간

---

## 성공 기준

### 1. 기능 테스트
- ✅ 모든 단위 테스트 통과 (90% 이상 커버리지)
- ✅ 모든 통합 테스트 통과
- ✅ E2E 테스트 6개 시나리오 모두 통과

### 2. 정확도
- ✅ Precision@10 ≥ 0.60 (60%)
- ✅ Recall@10 ≥ 0.50 (50%)
- ✅ F1-Score@10 ≥ 0.55 (55%)
- ✅ NDCG@10 ≥ 0.65 (65%)

### 3. 성능
- ✅ 추천 생성 시간 < 2초 (캐시 미스)
- ✅ 캐시 히트 시간 < 100ms
- ✅ Python API 응답 < 500ms
- ✅ Express API 응답 < 200ms
- ✅ 100 동시 사용자 지원
- ✅ 에러율 < 1%

### 4. 안정성
- ✅ Python 서비스 다운 시 적절한 에러 메시지
- ✅ Redis 장애 시 인메모리 폴백 동작
- ✅ DB 연결 오류 처리
- ✅ 타임아웃 처리

---

## 테스트 보고서 템플릿

### PHASE3_TASK4_TESTING_REPORT.md

```markdown
# Phase 3 Task #4 - 콘텐츠 추천 엔진 테스트 보고서

## 테스트 요약
- 테스트 기간: YYYY-MM-DD ~ YYYY-MM-DD
- 총 테스트 케이스: XXX개
- 통과: XXX개
- 실패: XXX개
- 성공률: XX.X%

## 1. 단위 테스트 결과
### Python 서비스
- recommender.py: XX/XX 통과
- database_service.py: XX/XX 통과
- cache_service.py: XX/XX 통과
- 커버리지: XX%

### Express 백엔드
- recommendations.js: XX/XX 통과
- 커버리지: XX%

### React 프론트엔드
- RecommendedPosts.tsx: XX/XX 통과
- SimilarPosts.tsx: XX/XX 통과
- 커버리지: XX%

## 2. E2E 테스트 결과
- 추천 게시물 플로우: ✅ 통과
- 유사 게시물 플로우: ✅ 통과
- 새로고침 플로우: ✅ 통과
...

## 3. 정확도 평가 결과
- Precision@10: 0.XX (목표: ≥0.60)
- Recall@10: 0.XX (목표: ≥0.50)
- F1-Score@10: 0.XX (목표: ≥0.55)
- NDCG@10: 0.XX (목표: ≥0.65)

## 4. 성능 테스트 결과
- 평균 응답 시간: XXXms
- p95 응답 시간: XXXms
- 최대 동시 사용자: XXX명
- 에러율: X.XX%

## 5. 발견된 이슈
1. [이슈 제목] - 심각도: High/Medium/Low
   - 설명: ...
   - 재현 방법: ...
   - 해결 방안: ...

## 6. 개선 사항
...

## 7. 결론
...
```

---

## 참고 자료

### 테스트 프레임워크
- **pytest**: https://docs.pytest.org/
- **Jest**: https://jestjs.io/
- **Vitest**: https://vitest.dev/
- **Playwright**: https://playwright.dev/
- **k6**: https://k6.io/

### 추천 시스템 평가
- **Precision/Recall**: https://en.wikipedia.org/wiki/Precision_and_recall
- **NDCG**: https://en.wikipedia.org/wiki/Discounted_cumulative_gain
- **scikit-learn Metrics**: https://scikit-learn.org/stable/modules/model_evaluation.html

---

**작성자**: AUTOAGENTS  
**최종 업데이트**: 2025년 11월 9일  
**다음 단계**: 테스트 구현 시작

---

© 2025 LeeHwiRyeon. All rights reserved.

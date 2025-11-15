"""
FastAPI Application for Content Recommendation Service
ML 기반 콘텐츠 추천 API 서버
"""

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import uvicorn
from loguru import logger
import sys
from datetime import datetime

from config import Config
from database import db
from recommendation_engine import recommendation_engine
import redis

# 로깅 설정
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
    level=Config.LOG_LEVEL
)
logger.add(
    Config.LOG_FILE,
    rotation="100 MB",
    retention="30 days",
    level=Config.LOG_LEVEL
)

# FastAPI 앱 초기화
app = FastAPI(
    title="Content Recommendation API",
    description="ML-based content recommendation system for community platform",
    version="1.0.0"
)

# CORS 미들웨어
app.add_middleware(
    CORSMiddleware,
    allow_origins=Config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis 클라이언트 (캐싱용)
redis_client = None
if Config.CACHE_ENABLED:
    try:
        redis_client = redis.Redis(
            host=Config.REDIS_HOST,
            port=Config.REDIS_PORT,
            db=Config.REDIS_DB,
            password=Config.REDIS_PASSWORD,
            decode_responses=True
        )
        redis_client.ping()
        logger.info("Redis connection established")
    except Exception as e:
        logger.warning(f"Redis connection failed: {e}. Caching disabled.")
        redis_client = None


# Pydantic 모델
class RecommendationRequest(BaseModel):
    user_id: int = Field(..., gt=0, description="사용자 ID")
    limit: int = Field(10, ge=1, le=50, description="추천 개수")
    recommendation_type: str = Field(
        "hybrid",
        description="추천 타입: hybrid, collaborative, content"
    )


class SimilarPostsRequest(BaseModel):
    post_id: int = Field(..., gt=0, description="게시물 ID")
    limit: int = Field(10, ge=1, le=50, description="유사 게시물 개수")


class RecommendationResponse(BaseModel):
    post_id: int
    title: str
    score: float
    category_id: int
    likes_count: int
    views_count: int
    created_at: str


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    data_loaded: bool
    cache_enabled: bool


# API 키 검증 (선택적)
async def verify_api_key(x_api_key: Optional[str] = Header(None)):
    """API 키 검증"""
    if Config.API_KEY and x_api_key != Config.API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")
    return x_api_key


# 데이터 로드 상태
data_loaded = False
last_load_time = None


async def ensure_data_loaded():
    """데이터 로드 확인"""
    global data_loaded, last_load_time
    
    # 데이터베이스가 연결되지 않은 경우 건너뛰기
    if not db.pool:
        logger.warning("Database not connected. Skipping data load.")
        return
    
    # 데이터가 로드되지 않았거나 리프레시 주기가 지난 경우
    if not data_loaded or (
        last_load_time and 
        (datetime.now() - last_load_time).seconds > Config.DATA_REFRESH_INTERVAL
    ):
        try:
            logger.info("Loading data from database...")
            
            # 데이터 조회
            posts = db.get_posts(limit=Config.MAX_POSTS_LOAD)
            users = db.get_users(limit=Config.MAX_USERS_LOAD)
            interactions = db.get_user_interactions(days=Config.INTERACTION_DAYS)
            
            # 추천 엔진에 데이터 로드
            recommendation_engine.load_data(posts, users, interactions)
            
            data_loaded = True
            last_load_time = datetime.now()
            
            logger.info(f"Data loaded successfully: {len(posts)} posts, "
                       f"{len(users)} users, {len(interactions)} interactions")
            
        except Exception as e:
            logger.error(f"Error loading data: {e}")
            raise HTTPException(status_code=500, detail="Failed to load data")


# 엔드포인트
@app.on_event("startup")
async def startup_event():
    """서버 시작 시 데이터 로드"""
    logger.info("Starting ML Recommendation Service...")
    await ensure_data_loaded()


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """헬스 체크"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        data_loaded=data_loaded,
        cache_enabled=Config.CACHE_ENABLED and redis_client is not None
    )


@app.post("/recommend/posts", response_model=List[RecommendationResponse])
async def recommend_posts(
    request: RecommendationRequest,
    api_key: str = Depends(verify_api_key)
):
    """사용자 맞춤 게시물 추천"""
    try:
        await ensure_data_loaded()
        
        # 캐시 확인
        cache_key = f"recommend:posts:{request.user_id}:{request.limit}:{request.recommendation_type}"
        if redis_client:
            cached = redis_client.get(cache_key)
            if cached:
                logger.info(f"Cache hit for user {request.user_id}")
                import json
                return json.loads(cached)
        
        # 추천 생성
        if request.recommendation_type == "collaborative":
            recommendations = recommendation_engine.get_collaborative_recommendations(
                request.user_id,
                request.limit
            )
        elif request.recommendation_type == "content":
            # 사용자의 최근 게시물 기반
            user_interactions = db.get_user_recent_interactions(request.user_id)
            if user_interactions:
                recent_post_id = user_interactions[0]['post_id']
                recommendations = recommendation_engine.get_content_based_recommendations(
                    recent_post_id,
                    request.limit
                )
            else:
                recommendations = recommendation_engine._get_popular_posts(request.limit)
        else:  # hybrid (default)
            recommendations = recommendation_engine.get_hybrid_recommendations(
                request.user_id,
                request.limit,
                Config.COLLABORATIVE_WEIGHT,
                Config.CONTENT_WEIGHT
            )
        
        # 캐시 저장
        if redis_client and recommendations:
            import json
            redis_client.setex(
                cache_key,
                Config.CACHE_TTL,
                json.dumps(recommendations)
            )
        
        logger.info(f"Generated {len(recommendations)} recommendations for user {request.user_id}")
        return recommendations
        
    except Exception as e:
        logger.error(f"Error in recommend_posts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/recommend/similar/{post_id}", response_model=List[RecommendationResponse])
async def recommend_similar_posts(
    post_id: int,
    limit: int = 10,
    api_key: str = Depends(verify_api_key)
):
    """유사 게시물 추천"""
    try:
        await ensure_data_loaded()
        
        # 캐시 확인
        cache_key = f"recommend:similar:{post_id}:{limit}"
        if redis_client:
            cached = redis_client.get(cache_key)
            if cached:
                logger.info(f"Cache hit for similar posts to {post_id}")
                import json
                return json.loads(cached)
        
        # 유사 게시물 추천
        recommendations = recommendation_engine.get_content_based_recommendations(
            post_id,
            limit
        )
        
        # 캐시 저장
        if redis_client and recommendations:
            import json
            redis_client.setex(
                cache_key,
                Config.CACHE_TTL,
                json.dumps(recommendations)
            )
        
        logger.info(f"Generated {len(recommendations)} similar posts for post {post_id}")
        return recommendations
        
    except Exception as e:
        logger.error(f"Error in recommend_similar_posts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/recommend/trending", response_model=List[RecommendationResponse])
async def recommend_trending_posts(
    limit: int = 10,
    days: int = 7,
    api_key: str = Depends(verify_api_key)
):
    """트렌딩 게시물 추천"""
    try:
        # 캐시 확인
        cache_key = f"recommend:trending:{limit}:{days}"
        if redis_client:
            cached = redis_client.get(cache_key)
            if cached:
                logger.info("Cache hit for trending posts")
                import json
                return json.loads(cached)
        
        # 트렌딩 게시물 조회
        trending = db.get_trending_posts(days=days, limit=limit)
        
        # 응답 형식 변환
        recommendations = [
            {
                'post_id': post['post_id'],
                'title': post['title'],
                'score': float(post['trending_score']),
                'category_id': post['category_id'],
                'likes_count': post['likes_count'],
                'views_count': post['views_count'],
                'created_at': post['created_at'].isoformat()
            }
            for post in trending
        ]
        
        # 캐시 저장 (10분)
        if redis_client and recommendations:
            import json
            redis_client.setex(
                cache_key,
                600,  # 10분
                json.dumps(recommendations)
            )
        
        logger.info(f"Generated {len(recommendations)} trending posts")
        return recommendations
        
    except Exception as e:
        logger.error(f"Error in recommend_trending_posts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/cache/clear")
async def clear_cache(api_key: str = Depends(verify_api_key)):
    """캐시 클리어"""
    if redis_client:
        try:
            redis_client.flushdb()
            logger.info("Cache cleared")
            return {"message": "Cache cleared successfully"}
        except Exception as e:
            logger.error(f"Error clearing cache: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    else:
        return {"message": "Cache not enabled"}


@app.post("/data/refresh")
async def refresh_data(api_key: str = Depends(verify_api_key)):
    """데이터 리프레시"""
    try:
        global data_loaded, last_load_time
        data_loaded = False
        await ensure_data_loaded()
        return {
            "message": "Data refreshed successfully",
            "timestamp": last_load_time.isoformat()
        }
    except Exception as e:
        logger.error(f"Error refreshing data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host=Config.HOST,
        port=Config.PORT,
        reload=Config.DEBUG,
        log_level=Config.LOG_LEVEL.lower()
    )

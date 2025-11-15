"""
Community Platform - Recommendation Service
FastAPI-based recommendation engine using hybrid filtering
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import uvicorn
import os
from dotenv import load_dotenv

from models.recommender import HybridRecommender
from services.cache_service import CacheService
from services.database_service import DatabaseService
from utils.logger import get_logger

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Community Platform Recommendation Service",
    description="ML-based content recommendation engine",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
logger = get_logger(__name__)
db_service = DatabaseService()
cache_service = CacheService()
recommender = HybridRecommender(db_service, cache_service)


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting Recommendation Service...")
    try:
        await db_service.connect()
        await cache_service.connect()
        await recommender.initialize()
        logger.info("Recommendation Service started successfully")
    except Exception as e:
        logger.error(f"Failed to start service: {str(e)}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Recommendation Service...")
    await db_service.disconnect()
    await cache_service.disconnect()
    logger.info("Recommendation Service stopped")


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "Recommendation Engine",
        "version": "1.0.0"
    }


@app.get("/api/recommend/posts")
async def recommend_posts(
    user_id: int,
    limit: int = Query(default=10, ge=1, le=50),
    exclude_viewed: bool = Query(default=True)
):
    """
    Get personalized post recommendations for a user
    
    Args:
        user_id: User ID
        limit: Number of recommendations (1-50)
        exclude_viewed: Exclude posts user has already viewed
    
    Returns:
        List of recommended post IDs with scores
    """
    try:
        logger.info(f"Getting post recommendations for user {user_id}")
        
        recommendations = await recommender.recommend_posts(
            user_id=user_id,
            limit=limit,
            exclude_viewed=exclude_viewed
        )
        
        return {
            "user_id": user_id,
            "recommendations": recommendations,
            "count": len(recommendations)
        }
        
    except Exception as e:
        logger.error(f"Error recommending posts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/recommend/users")
async def recommend_users(
    user_id: int,
    limit: int = Query(default=10, ge=1, le=50)
):
    """
    Get user recommendations (similar users to follow)
    
    Args:
        user_id: User ID
        limit: Number of recommendations (1-50)
    
    Returns:
        List of recommended user IDs with scores
    """
    try:
        logger.info(f"Getting user recommendations for user {user_id}")
        
        recommendations = await recommender.recommend_users(
            user_id=user_id,
            limit=limit
        )
        
        return {
            "user_id": user_id,
            "recommendations": recommendations,
            "count": len(recommendations)
        }
        
    except Exception as e:
        logger.error(f"Error recommending users: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/recommend/similar")
async def recommend_similar_posts(
    post_id: int,
    limit: int = Query(default=10, ge=1, le=50)
):
    """
    Get similar posts based on content
    
    Args:
        post_id: Post ID
        limit: Number of recommendations (1-50)
    
    Returns:
        List of similar post IDs with scores
    """
    try:
        logger.info(f"Getting similar posts for post {post_id}")
        
        recommendations = await recommender.recommend_similar_posts(
            post_id=post_id,
            limit=limit
        )
        
        return {
            "post_id": post_id,
            "recommendations": recommendations,
            "count": len(recommendations)
        }
        
    except Exception as e:
        logger.error(f"Error finding similar posts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/recommend/refresh")
async def refresh_model():
    """
    Manually trigger model refresh
    Requires admin authentication in production
    """
    try:
        logger.info("Manual model refresh triggered")
        await recommender.refresh_model()
        return {"status": "success", "message": "Model refreshed successfully"}
    except Exception as e:
        logger.error(f"Error refreshing model: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/recommend/stats")
async def get_statistics():
    """
    Get recommendation engine statistics
    """
    try:
        stats = await recommender.get_statistics()
        return stats
    except Exception as e:
        logger.error(f"Error getting statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    host = os.getenv("SERVICE_HOST", "127.0.0.1")
    port = int(os.getenv("SERVICE_PORT", "8000"))
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )

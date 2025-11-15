"""
Redis cache service for recommendation caching
"""

import redis
import json
import os
from typing import List, Dict, Optional, Any
from utils.logger import get_logger

logger = get_logger(__name__)


class CacheService:
    """Redis cache service"""
    
    def __init__(self):
        self.client = None
        self.ttl = int(os.getenv('CACHE_TTL', '3600'))
        self.enabled = os.getenv('ENABLE_CACHE', 'true').lower() == 'true'
        self.config = {
            'host': os.getenv('REDIS_HOST', 'localhost'),
            'port': int(os.getenv('REDIS_PORT', '6379')),
            'db': int(os.getenv('REDIS_DB', '0')),
            'password': os.getenv('REDIS_PASSWORD') or None,
            'decode_responses': True
        }
    
    async def connect(self):
        """Establish Redis connection"""
        if not self.enabled:
            logger.info("Cache is disabled")
            return
        
        try:
            self.client = redis.Redis(**self.config)
            self.client.ping()
            logger.info("Connected to Redis cache")
        except Exception as e:
            logger.warning(f"Failed to connect to Redis: {e}. Running without cache.")
            self.enabled = False
    
    async def disconnect(self):
        """Close Redis connection"""
        if self.client:
            self.client.close()
            logger.info("Disconnected from Redis cache")
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache
        
        Args:
            key: Cache key
        
        Returns:
            Cached value or None
        """
        if not self.enabled or not self.client:
            return None
        
        try:
            value = self.client.get(key)
            if value:
                return json.loads(value)
        except Exception as e:
            logger.error(f"Error getting cache key {key}: {e}")
        
        return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """
        Set value in cache
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds (default: self.ttl)
        """
        if not self.enabled or not self.client:
            return
        
        try:
            serialized = json.dumps(value)
            self.client.setex(key, ttl or self.ttl, serialized)
        except Exception as e:
            logger.error(f"Error setting cache key {key}: {e}")
    
    def delete(self, key: str):
        """
        Delete key from cache
        
        Args:
            key: Cache key
        """
        if not self.enabled or not self.client:
            return
        
        try:
            self.client.delete(key)
        except Exception as e:
            logger.error(f"Error deleting cache key {key}: {e}")
    
    def delete_pattern(self, pattern: str):
        """
        Delete all keys matching pattern
        
        Args:
            pattern: Key pattern (e.g., "user:*:recommendations")
        """
        if not self.enabled or not self.client:
            return
        
        try:
            keys = self.client.keys(pattern)
            if keys:
                self.client.delete(*keys)
                logger.info(f"Deleted {len(keys)} keys matching pattern: {pattern}")
        except Exception as e:
            logger.error(f"Error deleting pattern {pattern}: {e}")
    
    def get_recommendation_cache_key(self, user_id: int, rec_type: str) -> str:
        """
        Generate cache key for recommendations
        
        Args:
            user_id: User ID
            rec_type: Recommendation type ('posts', 'users', etc.)
        
        Returns:
            Cache key string
        """
        return f"recommendations:{rec_type}:{user_id}"
    
    def get_similar_cache_key(self, post_id: int) -> str:
        """
        Generate cache key for similar posts
        
        Args:
            post_id: Post ID
        
        Returns:
            Cache key string
        """
        return f"similar:posts:{post_id}"
    
    def invalidate_user_cache(self, user_id: int):
        """
        Invalidate all cache for a user
        
        Args:
            user_id: User ID
        """
        self.delete_pattern(f"recommendations:*:{user_id}")
        logger.info(f"Invalidated cache for user {user_id}")
    
    def invalidate_all_recommendations(self):
        """Invalidate all recommendation caches"""
        self.delete_pattern("recommendations:*")
        self.delete_pattern("similar:*")
        logger.info("Invalidated all recommendation caches")

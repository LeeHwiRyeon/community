"""
Configuration settings for ML Recommendation Service
환경 변수 및 설정 관리
"""

import os
from dotenv import load_dotenv
from typing import Optional

load_dotenv()


class Config:
    """애플리케이션 설정"""
    
    # 서버 설정
    HOST: str = os.getenv('ML_HOST', '0.0.0.0')
    PORT: int = int(os.getenv('ML_PORT', 8000))
    DEBUG: bool = os.getenv('DEBUG', 'False').lower() == 'true'
    
    # 데이터베이스 설정
    DB_HOST: str = os.getenv('DB_HOST', 'localhost')
    DB_PORT: int = int(os.getenv('DB_PORT', 3306))
    DB_NAME: str = os.getenv('DB_NAME', 'community')
    DB_USER: str = os.getenv('DB_USER', 'root')
    DB_PASSWORD: str = os.getenv('DB_PASSWORD', '')
    
    # Redis 설정
    REDIS_HOST: str = os.getenv('REDIS_HOST', 'localhost')
    REDIS_PORT: int = int(os.getenv('REDIS_PORT', 6379))
    REDIS_DB: int = int(os.getenv('REDIS_DB', 0))
    REDIS_PASSWORD: Optional[str] = os.getenv('REDIS_PASSWORD', None)
    
    # 추천 시스템 설정
    DEFAULT_RECOMMENDATIONS: int = 10
    MAX_RECOMMENDATIONS: int = 50
    MIN_RECOMMENDATIONS: int = 1
    
    # 캐시 설정
    CACHE_TTL: int = int(os.getenv('CACHE_TTL', 3600))  # 1시간
    CACHE_ENABLED: bool = os.getenv('CACHE_ENABLED', 'True').lower() == 'true'
    
    # 데이터 로드 설정
    DATA_REFRESH_INTERVAL: int = int(os.getenv('DATA_REFRESH_INTERVAL', 3600))  # 1시간
    MAX_POSTS_LOAD: int = int(os.getenv('MAX_POSTS_LOAD', 5000))
    MAX_USERS_LOAD: int = int(os.getenv('MAX_USERS_LOAD', 10000))
    INTERACTION_DAYS: int = int(os.getenv('INTERACTION_DAYS', 90))  # 최근 90일
    
    # 하이브리드 추천 가중치
    COLLABORATIVE_WEIGHT: float = float(os.getenv('COLLABORATIVE_WEIGHT', 0.6))
    CONTENT_WEIGHT: float = float(os.getenv('CONTENT_WEIGHT', 0.4))
    
    # 로깅 설정
    LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE: str = os.getenv('LOG_FILE', 'ml_service.log')
    
    # CORS 설정
    ALLOWED_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:5173",
        os.getenv('FRONTEND_URL', 'http://localhost:3000')
    ]
    
    # API 키 (Express 백엔드와의 통신용)
    API_KEY: Optional[str] = os.getenv('ML_API_KEY', None)
    
    @classmethod
    def validate(cls) -> bool:
        """설정 유효성 검사"""
        errors = []
        
        if not cls.DB_NAME:
            errors.append("DB_NAME is required")
        
        if not cls.DB_USER:
            errors.append("DB_USER is required")
        
        if cls.COLLABORATIVE_WEIGHT + cls.CONTENT_WEIGHT != 1.0:
            errors.append("COLLABORATIVE_WEIGHT + CONTENT_WEIGHT must equal 1.0")
        
        if errors:
            raise ValueError(f"Configuration errors: {', '.join(errors)}")
        
        return True


# 설정 검증
Config.validate()

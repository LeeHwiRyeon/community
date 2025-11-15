"""
Utility functions for recommendation service
유틸리티 함수 모음
"""

import hashlib
import json
from typing import Any, Optional
from datetime import datetime


def generate_cache_key(*args, **kwargs) -> str:
    """캐시 키 생성"""
    key_parts = [str(arg) for arg in args]
    key_parts.extend(f"{k}:{v}" for k, v in sorted(kwargs.items()))
    key_string = ":".join(key_parts)
    return hashlib.md5(key_string.encode()).hexdigest()


def serialize_datetime(obj: Any) -> str:
    """datetime 객체 직렬화"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")


def safe_divide(numerator: float, denominator: float, default: float = 0.0) -> float:
    """안전한 나눗셈 (0으로 나누기 방지)"""
    try:
        return numerator / denominator if denominator != 0 else default
    except (ZeroDivisionError, TypeError):
        return default


def normalize_score(score: float, min_score: float = 0.0, max_score: float = 1.0) -> float:
    """점수 정규화"""
    if max_score == min_score:
        return 0.5
    return (score - min_score) / (max_score - min_score)


def calculate_time_decay(days_ago: int, half_life: int = 30) -> float:
    """시간 감쇠 계산 (지수 감쇠)"""
    import math
    return math.exp(-days_ago / half_life)


def merge_recommendations(
    recs1: list,
    recs2: list,
    weight1: float = 0.5,
    weight2: float = 0.5,
    key: str = 'post_id'
) -> list:
    """두 추천 리스트를 가중치로 병합"""
    merged = {}
    
    for rec in recs1:
        post_id = rec[key]
        merged[post_id] = {
            **rec,
            'score': rec.get('score', 0) * weight1
        }
    
    for rec in recs2:
        post_id = rec[key]
        if post_id in merged:
            merged[post_id]['score'] += rec.get('score', 0) * weight2
        else:
            merged[post_id] = {
                **rec,
                'score': rec.get('score', 0) * weight2
            }
    
    return sorted(merged.values(), key=lambda x: x['score'], reverse=True)


def validate_request_params(
    user_id: Optional[int] = None,
    post_id: Optional[int] = None,
    limit: Optional[int] = None,
    max_limit: int = 50
) -> dict:
    """요청 파라미터 검증"""
    errors = []
    
    if user_id is not None and user_id <= 0:
        errors.append("user_id must be positive")
    
    if post_id is not None and post_id <= 0:
        errors.append("post_id must be positive")
    
    if limit is not None:
        if limit <= 0:
            errors.append("limit must be positive")
        if limit > max_limit:
            errors.append(f"limit must not exceed {max_limit}")
    
    return {
        'valid': len(errors) == 0,
        'errors': errors
    }

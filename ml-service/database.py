"""
Database connection and query functions
MySQL 데이터베이스 연결 및 추천 시스템용 데이터 조회
"""

import mysql.connector
from mysql.connector import pooling, Error
from typing import List, Dict, Optional
import os
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger(__name__)


class Database:
    """MySQL 데이터베이스 연결 풀 관리"""
    
    def __init__(self):
        self.pool = None
        self._create_pool()
    
    def _create_pool(self):
        """커넥션 풀 생성"""
        try:
            self.pool = pooling.MySQLConnectionPool(
                pool_name="recommendation_pool",
                pool_size=5,
                pool_reset_session=True,
                host=os.getenv('DB_HOST', 'localhost'),
                port=int(os.getenv('DB_PORT', 3306)),
                database=os.getenv('DB_NAME', 'community'),
                user=os.getenv('DB_USER', 'root'),
                password=os.getenv('DB_PASSWORD', ''),
                charset='utf8mb4',
                collation='utf8mb4_unicode_ci'
            )
            logger.info("Database connection pool created")
        except Error as e:
            logger.warning(f"Error creating connection pool: {e}")
            logger.warning("Database connection will be retried later")
            self.pool = None
    
    def get_connection(self):
        """커넥션 풀에서 연결 가져오기"""
        if not self.pool:
            logger.warning("Database pool not initialized")
            raise Error("Database connection not available")
        try:
            return self.pool.get_connection()
        except Error as e:
            logger.error(f"Error getting connection: {e}")
            raise
    
    def execute_query(self, query: str, params: tuple = None) -> List[Dict]:
        """쿼리 실행 및 결과 반환"""
        connection = None
        cursor = None
        try:
            connection = self.get_connection()
            cursor = connection.cursor(dictionary=True)
            
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            
            results = cursor.fetchall()
            return results
            
        except Error as e:
            logger.error(f"Error executing query: {e}")
            return []
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()
    
    def get_posts(self, limit: int = 1000) -> List[Dict]:
        """게시물 데이터 조회"""
        query = """
            SELECT 
                p.post_id,
                p.title,
                p.content,
                p.user_id,
                p.category_id,
                p.created_at,
                p.updated_at,
                COUNT(DISTINCT l.like_id) as likes_count,
                COUNT(DISTINCT c.comment_id) as comments_count,
                p.views_count
            FROM posts p
            LEFT JOIN likes l ON p.post_id = l.post_id
            LEFT JOIN comments c ON p.post_id = c.post_id
            WHERE p.deleted_at IS NULL
            GROUP BY p.post_id
            ORDER BY p.created_at DESC
            LIMIT %s
        """
        return self.execute_query(query, (limit,))
    
    def get_users(self, limit: int = 1000) -> List[Dict]:
        """사용자 데이터 조회"""
        query = """
            SELECT 
                user_id,
                username,
                email,
                created_at
            FROM users
            WHERE deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT %s
        """
        return self.execute_query(query, (limit,))
    
    def get_user_interactions(self, days: int = 90) -> List[Dict]:
        """사용자 상호작용 데이터 조회 (최근 N일)"""
        # 조회 기록
        view_query = """
            SELECT 
                user_id,
                post_id,
                'view' as interaction_type,
                viewed_at as created_at
            FROM user_activity_logs
            WHERE viewed_at >= DATE_SUB(NOW(), INTERVAL %s DAY)
        """
        views = self.execute_query(view_query, (days,))
        
        # 좋아요
        like_query = """
            SELECT 
                l.user_id,
                l.post_id,
                'like' as interaction_type,
                l.created_at
            FROM likes l
            WHERE l.created_at >= DATE_SUB(NOW(), INTERVAL %s DAY)
        """
        likes = self.execute_query(like_query, (days,))
        
        # 댓글
        comment_query = """
            SELECT 
                c.user_id,
                c.post_id,
                'comment' as interaction_type,
                c.created_at
            FROM comments c
            WHERE c.created_at >= DATE_SUB(NOW(), INTERVAL %s DAY)
                AND c.deleted_at IS NULL
        """
        comments = self.execute_query(comment_query, (days,))
        
        # 모든 상호작용 병합
        all_interactions = views + likes + comments
        return all_interactions
    
    def get_post_by_id(self, post_id: int) -> Optional[Dict]:
        """특정 게시물 조회"""
        query = """
            SELECT 
                p.post_id,
                p.title,
                p.content,
                p.user_id,
                p.category_id,
                p.created_at,
                COUNT(DISTINCT l.like_id) as likes_count,
                COUNT(DISTINCT c.comment_id) as comments_count,
                p.views_count
            FROM posts p
            LEFT JOIN likes l ON p.post_id = l.post_id
            LEFT JOIN comments c ON p.post_id = c.post_id
            WHERE p.post_id = %s AND p.deleted_at IS NULL
            GROUP BY p.post_id
        """
        results = self.execute_query(query, (post_id,))
        return results[0] if results else None
    
    def get_user_by_id(self, user_id: int) -> Optional[Dict]:
        """특정 사용자 조회"""
        query = """
            SELECT user_id, username, email, created_at
            FROM users
            WHERE user_id = %s AND deleted_at IS NULL
        """
        results = self.execute_query(query, (user_id,))
        return results[0] if results else None
    
    def get_user_recent_interactions(
        self, 
        user_id: int, 
        days: int = 30
    ) -> List[Dict]:
        """특정 사용자의 최근 상호작용"""
        query = """
            SELECT DISTINCT post_id, created_at
            FROM (
                SELECT post_id, viewed_at as created_at
                FROM user_activity_logs
                WHERE user_id = %s 
                    AND viewed_at >= DATE_SUB(NOW(), INTERVAL %s DAY)
                
                UNION
                
                SELECT post_id, created_at
                FROM likes
                WHERE user_id = %s 
                    AND created_at >= DATE_SUB(NOW(), INTERVAL %s DAY)
                
                UNION
                
                SELECT post_id, created_at
                FROM comments
                WHERE user_id = %s 
                    AND created_at >= DATE_SUB(NOW(), INTERVAL %s DAY)
                    AND deleted_at IS NULL
            ) as interactions
            ORDER BY created_at DESC
        """
        return self.execute_query(
            query, 
            (user_id, days, user_id, days, user_id, days)
        )
    
    def get_trending_posts(self, days: int = 7, limit: int = 20) -> List[Dict]:
        """트렌딩 게시물 조회"""
        query = """
            SELECT 
                p.post_id,
                p.title,
                p.category_id,
                p.created_at,
                COUNT(DISTINCT l.like_id) as likes_count,
                COUNT(DISTINCT c.comment_id) as comments_count,
                p.views_count,
                (COUNT(DISTINCT l.like_id) * 3 + 
                 COUNT(DISTINCT c.comment_id) * 2 + 
                 p.views_count * 0.5) as trending_score
            FROM posts p
            LEFT JOIN likes l ON p.post_id = l.post_id 
                AND l.created_at >= DATE_SUB(NOW(), INTERVAL %s DAY)
            LEFT JOIN comments c ON p.post_id = c.post_id 
                AND c.created_at >= DATE_SUB(NOW(), INTERVAL %s DAY)
            WHERE p.created_at >= DATE_SUB(NOW(), INTERVAL %s DAY)
                AND p.deleted_at IS NULL
            GROUP BY p.post_id
            ORDER BY trending_score DESC
            LIMIT %s
        """
        return self.execute_query(query, (days, days, days, limit))
    
    def get_category_posts(
        self, 
        category_ids: List[int], 
        limit: int = 50
    ) -> List[Dict]:
        """특정 카테고리 게시물 조회"""
        if not category_ids:
            return []
        
        placeholders = ','.join(['%s'] * len(category_ids))
        query = f"""
            SELECT 
                p.post_id,
                p.title,
                p.content,
                p.category_id,
                p.created_at,
                COUNT(DISTINCT l.like_id) as likes_count,
                p.views_count
            FROM posts p
            LEFT JOIN likes l ON p.post_id = l.post_id
            WHERE p.category_id IN ({placeholders})
                AND p.deleted_at IS NULL
            GROUP BY p.post_id
            ORDER BY p.created_at DESC
            LIMIT %s
        """
        params = tuple(category_ids) + (limit,)
        return self.execute_query(query, params)


# 싱글톤 인스턴스
db = Database()

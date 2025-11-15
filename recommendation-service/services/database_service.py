"""
Database service for MySQL interactions
"""

import mysql.connector
from mysql.connector import Error
from typing import List, Dict, Optional, Any
import os
from utils.logger import get_logger

logger = get_logger(__name__)


class DatabaseService:
    """MySQL database service"""
    
    def __init__(self):
        self.connection = None
        self.config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': int(os.getenv('DB_PORT', '3306')),
            'user': os.getenv('DB_USER', 'root'),
            'password': os.getenv('DB_PASSWORD', ''),
            'database': os.getenv('DB_NAME', 'community_platform'),
            'charset': 'utf8mb4',
            'use_unicode': True
        }
    
    async def connect(self):
        """Establish database connection"""
        try:
            self.connection = mysql.connector.connect(**self.config)
            if self.connection.is_connected():
                logger.info("Connected to MySQL database")
        except Error as e:
            logger.error(f"Error connecting to MySQL: {e}")
            raise
    
    async def disconnect(self):
        """Close database connection"""
        if self.connection and self.connection.is_connected():
            self.connection.close()
            logger.info("Disconnected from MySQL database")
    
    def execute_query(self, query: str, params: tuple = None) -> List[Dict[str, Any]]:
        """
        Execute SELECT query and return results
        
        Args:
            query: SQL query
            params: Query parameters
        
        Returns:
            List of dictionaries (rows)
        """
        try:
            cursor = self.connection.cursor(dictionary=True)
            cursor.execute(query, params or ())
            results = cursor.fetchall()
            cursor.close()
            return results
        except Error as e:
            logger.error(f"Error executing query: {e}")
            raise
    
    async def get_user_interactions(self, user_id: int) -> List[Dict[str, Any]]:
        """
        Get all user interactions (posts, likes, views, comments)
        
        Returns:
            List of interaction data
        """
        query = """
        SELECT 
            'post' as type, 
            id as item_id, 
            created_at as timestamp,
            3.0 as weight
        FROM posts 
        WHERE author_id = %s
        
        UNION ALL
        
        SELECT 
            'like' as type,
            post_id as item_id,
            created_at as timestamp,
            2.0 as weight
        FROM likes 
        WHERE user_id = %s
        
        UNION ALL
        
        SELECT 
            'view' as type,
            post_id as item_id,
            viewed_at as timestamp,
            1.0 as weight
        FROM post_views 
        WHERE user_id = %s
        
        UNION ALL
        
        SELECT 
            'comment' as type,
            post_id as item_id,
            created_at as timestamp,
            2.5 as weight
        FROM comments 
        WHERE user_id = %s
        
        ORDER BY timestamp DESC
        """
        return self.execute_query(query, (user_id, user_id, user_id, user_id))
    
    async def get_all_interactions(self) -> List[Dict[str, Any]]:
        """
        Get all user-item interactions for collaborative filtering
        
        Returns:
            List of (user_id, item_id, weight) tuples
        """
        query = """
        SELECT user_id, item_id, SUM(weight) as total_weight
        FROM (
            SELECT author_id as user_id, id as item_id, 3.0 as weight
            FROM posts
            
            UNION ALL
            
            SELECT user_id, post_id as item_id, 2.0 as weight
            FROM likes
            
            UNION ALL
            
            SELECT user_id, post_id as item_id, 1.0 as weight
            FROM post_views
            
            UNION ALL
            
            SELECT user_id, post_id as item_id, 2.5 as weight
            FROM comments
        ) interactions
        GROUP BY user_id, item_id
        """
        return self.execute_query(query)
    
    async def get_post_features(self, post_id: int) -> Optional[Dict[str, Any]]:
        """
        Get post features for content-based filtering
        
        Returns:
            Post features dictionary
        """
        query = """
        SELECT 
            p.id,
            p.title,
            p.content,
            p.category_id,
            p.author_id,
            p.tags,
            COUNT(DISTINCT l.id) as like_count,
            COUNT(DISTINCT c.id) as comment_count,
            COUNT(DISTINCT pv.id) as view_count
        FROM posts p
        LEFT JOIN likes l ON p.id = l.post_id
        LEFT JOIN comments c ON p.id = c.post_id
        LEFT JOIN post_views pv ON p.id = pv.post_id
        WHERE p.id = %s
        GROUP BY p.id
        """
        results = self.execute_query(query, (post_id,))
        return results[0] if results else None
    
    async def get_all_posts_features(self) -> List[Dict[str, Any]]:
        """
        Get features for all posts
        
        Returns:
            List of post features
        """
        query = """
        SELECT 
            p.id,
            p.title,
            p.content,
            p.category_id,
            p.author_id,
            p.tags,
            COUNT(DISTINCT l.id) as like_count,
            COUNT(DISTINCT c.id) as comment_count,
            COUNT(DISTINCT pv.id) as view_count
        FROM posts p
        LEFT JOIN likes l ON p.id = l.post_id
        LEFT JOIN comments c ON p.id = c.post_id
        LEFT JOIN post_views pv ON p.id = pv.post_id
        GROUP BY p.id
        ORDER BY p.id DESC
        LIMIT 1000
        """
        return self.execute_query(query)
    
    async def get_user_viewed_posts(self, user_id: int) -> List[int]:
        """
        Get list of posts user has viewed
        
        Returns:
            List of post IDs
        """
        query = "SELECT DISTINCT post_id FROM post_views WHERE user_id = %s"
        results = self.execute_query(query, (user_id,))
        return [row['post_id'] for row in results]
    
    async def get_user_profile(self, user_id: int) -> Optional[Dict[str, Any]]:
        """
        Get user profile for user-based recommendations
        
        Returns:
            User profile dictionary
        """
        query = """
        SELECT 
            u.id,
            u.username,
            COUNT(DISTINCT p.id) as post_count,
            COUNT(DISTINCT l.id) as like_count,
            COUNT(DISTINCT c.id) as comment_count
        FROM users u
        LEFT JOIN posts p ON u.id = p.author_id
        LEFT JOIN likes l ON u.id = l.user_id
        LEFT JOIN comments c ON u.id = c.user_id
        WHERE u.id = %s
        GROUP BY u.id
        """
        results = self.execute_query(query, (user_id,))
        return results[0] if results else None

"""
Hybrid Recommendation Engine
Combines Collaborative Filtering and Content-Based Filtering
"""

import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
from typing import List, Dict, Tuple, Optional
import os
from datetime import datetime, timedelta

from services.database_service import DatabaseService
from services.cache_service import CacheService
from utils.logger import get_logger

logger = get_logger(__name__)


class HybridRecommender:
    """
    Hybrid recommendation system combining:
    1. Collaborative Filtering (User-based and Item-based)
    2. Content-Based Filtering (TF-IDF on post content)
    """
    
    def __init__(self, db_service: DatabaseService, cache_service: CacheService):
        self.db = db_service
        self.cache = cache_service
        
        # Configuration
        self.min_interactions = int(os.getenv('MIN_INTERACTIONS', '5'))
        self.top_n = int(os.getenv('TOP_N_ITEMS', '10'))
        self.similarity_threshold = float(os.getenv('SIMILARITY_THRESHOLD', '0.1'))
        self.use_hybrid = os.getenv('USE_HYBRID', 'true').lower() == 'true'
        
        # Model data
        self.user_item_matrix = None
        self.item_similarity_matrix = None
        self.user_similarity_matrix = None
        self.content_similarity_matrix = None
        self.post_features = None
        self.tfidf_vectorizer = None
        
        # Statistics
        self.last_update = None
        self.update_interval = int(os.getenv('MODEL_UPDATE_INTERVAL', '3600'))
    
    async def initialize(self):
        """Initialize recommendation models"""
        logger.info("Initializing recommendation models...")
        await self.refresh_model()
        logger.info("Recommendation models initialized")
    
    async def refresh_model(self):
        """Refresh recommendation models with latest data"""
        try:
            logger.info("Refreshing recommendation models...")
            
            # Build collaborative filtering models
            await self._build_collaborative_model()
            
            # Build content-based model
            await self._build_content_model()
            
            # Update timestamp
            self.last_update = datetime.now()
            
            # Invalidate all caches
            self.cache.invalidate_all_recommendations()
            
            logger.info("Models refreshed successfully")
            
        except Exception as e:
            logger.error(f"Error refreshing models: {e}")
            raise
    
    async def _build_collaborative_model(self):
        """Build collaborative filtering model"""
        logger.info("Building collaborative filtering model...")
        
        # Get all user-item interactions
        interactions = await self.db.get_all_interactions()
        
        if not interactions:
            logger.warning("No interactions found for collaborative filtering")
            return
        
        # Create DataFrame
        df = pd.DataFrame(interactions)
        
        # Create user-item matrix (pivot table)
        self.user_item_matrix = df.pivot_table(
            index='user_id',
            columns='item_id',
            values='total_weight',
            fill_value=0
        )
        
        logger.info(f"User-item matrix shape: {self.user_item_matrix.shape}")
        
        # Calculate item similarity (item-based CF)
        if self.user_item_matrix.shape[1] > 1:
            self.item_similarity_matrix = cosine_similarity(
                self.user_item_matrix.T
            )
            logger.info("Item similarity matrix computed")
        
        # Calculate user similarity (user-based CF)
        if self.user_item_matrix.shape[0] > 1:
            self.user_similarity_matrix = cosine_similarity(
                self.user_item_matrix
            )
            logger.info("User similarity matrix computed")
    
    async def _build_content_model(self):
        """Build content-based filtering model"""
        logger.info("Building content-based model...")
        
        # Get all posts with features
        posts = await self.db.get_all_posts_features()
        
        if not posts:
            logger.warning("No posts found for content-based filtering")
            return
        
        # Create DataFrame
        self.post_features = pd.DataFrame(posts)
        
        # Combine text features (title + content + tags)
        self.post_features['text'] = (
            self.post_features['title'].fillna('') + ' ' +
            self.post_features['content'].fillna('') + ' ' +
            self.post_features['tags'].fillna('')
        )
        
        # TF-IDF vectorization
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2)
        )
        
        tfidf_matrix = self.tfidf_vectorizer.fit_transform(
            self.post_features['text']
        )
        
        # Calculate content similarity
        self.content_similarity_matrix = cosine_similarity(tfidf_matrix)
        
        logger.info(f"Content similarity matrix shape: {self.content_similarity_matrix.shape}")
    
    async def recommend_posts(
        self,
        user_id: int,
        limit: int = 10,
        exclude_viewed: bool = True
    ) -> List[Dict[str, float]]:
        """
        Get personalized post recommendations
        
        Args:
            user_id: User ID
            limit: Number of recommendations
            exclude_viewed: Exclude already viewed posts
        
        Returns:
            List of {post_id, score} dictionaries
        """
        # Check cache
        cache_key = self.cache.get_recommendation_cache_key(user_id, 'posts')
        cached = self.cache.get(cache_key)
        if cached:
            logger.info(f"Cache hit for user {user_id} post recommendations")
            return cached[:limit]
        
        # Check if model refresh needed
        if self._needs_refresh():
            await self.refresh_model()
        
        # Get user interactions
        user_interactions = await self.db.get_user_interactions(user_id)
        
        if len(user_interactions) < self.min_interactions:
            # Not enough data, return popular posts
            recommendations = await self._get_popular_posts(limit)
        else:
            # Use hybrid approach
            if self.use_hybrid:
                collab_recs = await self._collaborative_recommend(user_id, limit * 2)
                content_recs = await self._content_based_recommend(user_id, limit * 2)
                
                # Combine recommendations (weighted average)
                recommendations = self._combine_recommendations(
                    collab_recs,
                    content_recs,
                    weights=(0.6, 0.4)  # 60% collaborative, 40% content
                )
            else:
                recommendations = await self._collaborative_recommend(user_id, limit * 2)
        
        # Exclude viewed posts
        if exclude_viewed:
            viewed_posts = await self.db.get_user_viewed_posts(user_id)
            recommendations = [
                rec for rec in recommendations
                if rec['post_id'] not in viewed_posts
            ]
        
        # Limit results
        recommendations = recommendations[:limit]
        
        # Cache results
        self.cache.set(cache_key, recommendations)
        
        return recommendations
    
    async def _collaborative_recommend(
        self,
        user_id: int,
        limit: int
    ) -> List[Dict[str, float]]:
        """Collaborative filtering recommendations"""
        if self.user_item_matrix is None:
            return []
        
        try:
            # Get user index
            user_idx = self.user_item_matrix.index.get_loc(user_id)
            
            # Get similar users (user-based CF)
            if self.user_similarity_matrix is not None:
                user_similarities = self.user_similarity_matrix[user_idx]
                similar_users_idx = np.argsort(user_similarities)[::-1][1:11]  # Top 10
                
                # Weighted sum of similar users' interactions
                recommendations = {}
                for similar_idx in similar_users_idx:
                    similarity = user_similarities[similar_idx]
                    if similarity > self.similarity_threshold:
                        similar_user_items = self.user_item_matrix.iloc[similar_idx]
                        for item_id, weight in similar_user_items.items():
                            if weight > 0:
                                recommendations[item_id] = recommendations.get(item_id, 0) + (
                                    weight * similarity
                                )
                
                # Remove items user already interacted with
                user_items = set(
                    self.user_item_matrix.iloc[user_idx][
                        self.user_item_matrix.iloc[user_idx] > 0
                    ].index
                )
                recommendations = {
                    k: v for k, v in recommendations.items()
                    if k not in user_items
                }
                
                # Sort by score
                sorted_recs = sorted(
                    recommendations.items(),
                    key=lambda x: x[1],
                    reverse=True
                )[:limit]
                
                return [
                    {'post_id': int(post_id), 'score': float(score)}
                    for post_id, score in sorted_recs
                ]
        
        except Exception as e:
            logger.error(f"Error in collaborative filtering: {e}")
        
        return []
    
    async def _content_based_recommend(
        self,
        user_id: int,
        limit: int
    ) -> List[Dict[str, float]]:
        """Content-based filtering recommendations"""
        if self.content_similarity_matrix is None or self.post_features is None:
            return []
        
        try:
            # Get user's liked posts
            user_interactions = await self.db.get_user_interactions(user_id)
            liked_posts = [
                int(interaction['item_id'])
                for interaction in user_interactions
                if interaction['type'] in ['like', 'post']
            ]
            
            if not liked_posts:
                return []
            
            # Find posts in our feature set
            liked_posts_idx = []
            for post_id in liked_posts:
                try:
                    idx = self.post_features[self.post_features['id'] == post_id].index[0]
                    liked_posts_idx.append(idx)
                except IndexError:
                    continue
            
            if not liked_posts_idx:
                return []
            
            # Calculate average similarity to liked posts
            similarity_scores = np.mean(
                self.content_similarity_matrix[liked_posts_idx],
                axis=0
            )
            
            # Get top similar posts
            similar_idx = np.argsort(similarity_scores)[::-1]
            
            recommendations = []
            for idx in similar_idx:
                post_id = int(self.post_features.iloc[idx]['id'])
                score = float(similarity_scores[idx])
                
                # Skip already liked posts
                if post_id not in liked_posts and score > self.similarity_threshold:
                    recommendations.append({'post_id': post_id, 'score': score})
                
                if len(recommendations) >= limit:
                    break
            
            return recommendations
        
        except Exception as e:
            logger.error(f"Error in content-based filtering: {e}")
        
        return []
    
    def _combine_recommendations(
        self,
        recs1: List[Dict[str, float]],
        recs2: List[Dict[str, float]],
        weights: Tuple[float, float] = (0.5, 0.5)
    ) -> List[Dict[str, float]]:
        """Combine two recommendation lists with weights"""
        combined = {}
        
        # Add first recommendations
        for rec in recs1:
            post_id = rec['post_id']
            combined[post_id] = rec['score'] * weights[0]
        
        # Add second recommendations
        for rec in recs2:
            post_id = rec['post_id']
            if post_id in combined:
                combined[post_id] += rec['score'] * weights[1]
            else:
                combined[post_id] = rec['score'] * weights[1]
        
        # Sort by combined score
        sorted_combined = sorted(
            combined.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        return [
            {'post_id': post_id, 'score': score}
            for post_id, score in sorted_combined
        ]
    
    async def _get_popular_posts(self, limit: int) -> List[Dict[str, float]]:
        """Get popular posts for cold start"""
        posts = await self.db.get_all_posts_features()
        
        # Sort by engagement (likes + comments + views)
        for post in posts:
            post['engagement'] = (
                post['like_count'] * 3 +
                post['comment_count'] * 2 +
                post['view_count']
            )
        
        posts.sort(key=lambda x: x['engagement'], reverse=True)
        
        return [
            {'post_id': post['id'], 'score': float(post['engagement'])}
            for post in posts[:limit]
        ]
    
    async def recommend_users(
        self,
        user_id: int,
        limit: int = 10
    ) -> List[Dict[str, float]]:
        """Get similar users to follow"""
        # Check cache
        cache_key = self.cache.get_recommendation_cache_key(user_id, 'users')
        cached = self.cache.get(cache_key)
        if cached:
            return cached[:limit]
        
        if self.user_similarity_matrix is None:
            return []
        
        try:
            user_idx = self.user_item_matrix.index.get_loc(user_id)
            user_similarities = self.user_similarity_matrix[user_idx]
            
            # Get top similar users
            similar_users_idx = np.argsort(user_similarities)[::-1][1:limit+1]
            
            recommendations = []
            for idx in similar_users_idx:
                similar_user_id = int(self.user_item_matrix.index[idx])
                similarity = float(user_similarities[idx])
                
                if similarity > self.similarity_threshold:
                    recommendations.append({
                        'user_id': similar_user_id,
                        'score': similarity
                    })
            
            # Cache results
            self.cache.set(cache_key, recommendations)
            
            return recommendations
        
        except Exception as e:
            logger.error(f"Error recommending users: {e}")
            return []
    
    async def recommend_similar_posts(
        self,
        post_id: int,
        limit: int = 10
    ) -> List[Dict[str, float]]:
        """Get similar posts based on content"""
        # Check cache
        cache_key = self.cache.get_similar_cache_key(post_id)
        cached = self.cache.get(cache_key)
        if cached:
            return cached[:limit]
        
        if self.content_similarity_matrix is None or self.post_features is None:
            return []
        
        try:
            # Find post index
            post_idx = self.post_features[self.post_features['id'] == post_id].index[0]
            
            # Get similarity scores
            similarity_scores = self.content_similarity_matrix[post_idx]
            
            # Get top similar posts
            similar_idx = np.argsort(similarity_scores)[::-1][1:limit+1]
            
            recommendations = []
            for idx in similar_idx:
                similar_post_id = int(self.post_features.iloc[idx]['id'])
                similarity = float(similarity_scores[idx])
                
                if similarity > self.similarity_threshold:
                    recommendations.append({
                        'post_id': similar_post_id,
                        'score': similarity
                    })
            
            # Cache results
            self.cache.set(cache_key, recommendations)
            
            return recommendations
        
        except Exception as e:
            logger.error(f"Error finding similar posts: {e}")
            return []
    
    def _needs_refresh(self) -> bool:
        """Check if model needs refresh"""
        if self.last_update is None:
            return True
        
        elapsed = (datetime.now() - self.last_update).total_seconds()
        return elapsed >= self.update_interval
    
    async def get_statistics(self) -> Dict[str, Any]:
        """Get recommendation engine statistics"""
        return {
            'last_update': self.last_update.isoformat() if self.last_update else None,
            'update_interval': self.update_interval,
            'min_interactions': self.min_interactions,
            'similarity_threshold': self.similarity_threshold,
            'use_hybrid': self.use_hybrid,
            'user_item_matrix_shape': list(self.user_item_matrix.shape) if self.user_item_matrix is not None else None,
            'num_posts': len(self.post_features) if self.post_features is not None else 0,
            'cache_enabled': self.cache.enabled
        }

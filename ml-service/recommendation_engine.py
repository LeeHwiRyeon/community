"""
Content Recommendation Engine
콘텐츠 기반 필터링 및 협업 필터링을 결합한 하이브리드 추천 시스템
"""

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MinMaxScaler
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class RecommendationEngine:
    """추천 엔진 메인 클래스"""
    
    def __init__(self):
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2)
        )
        self.scaler = MinMaxScaler()
        self.posts_df = None
        self.users_df = None
        self.interactions_df = None
        self.tfidf_matrix = None
        
    def load_data(self, posts: List[Dict], users: List[Dict], interactions: List[Dict]):
        """데이터 로드 및 전처리"""
        try:
            # 게시물 데이터
            self.posts_df = pd.DataFrame(posts)
            if not self.posts_df.empty:
                self.posts_df['created_at'] = pd.to_datetime(self.posts_df['created_at'])
                
                # 텍스트 결합 (제목 + 내용)
                self.posts_df['combined_text'] = (
                    self.posts_df['title'].fillna('') + ' ' + 
                    self.posts_df['content'].fillna('')
                )
                
                # TF-IDF 벡터화
                if len(self.posts_df) > 0:
                    self.tfidf_matrix = self.tfidf_vectorizer.fit_transform(
                        self.posts_df['combined_text']
                    )
            
            # 사용자 데이터
            self.users_df = pd.DataFrame(users) if users else pd.DataFrame()
            
            # 상호작용 데이터 (조회, 좋아요, 댓글)
            self.interactions_df = pd.DataFrame(interactions) if interactions else pd.DataFrame()
            if not self.interactions_df.empty:
                self.interactions_df['created_at'] = pd.to_datetime(
                    self.interactions_df['created_at']
                )
            
            logger.info(f"Data loaded: {len(self.posts_df)} posts, "
                       f"{len(self.users_df)} users, "
                       f"{len(self.interactions_df)} interactions")
            
        except Exception as e:
            logger.error(f"Error loading data: {e}")
            raise
    
    def get_content_based_recommendations(
        self, 
        post_id: int, 
        top_n: int = 10
    ) -> List[Dict]:
        """콘텐츠 기반 필터링 - 유사한 게시물 추천"""
        try:
            if self.posts_df is None or self.tfidf_matrix is None:
                return []
            
            # 해당 게시물의 인덱스 찾기
            post_idx = self.posts_df[self.posts_df['post_id'] == post_id].index
            if len(post_idx) == 0:
                logger.warning(f"Post {post_id} not found")
                return []
            
            post_idx = post_idx[0]
            
            # 코사인 유사도 계산
            cosine_sim = cosine_similarity(
                self.tfidf_matrix[post_idx:post_idx+1],
                self.tfidf_matrix
            ).flatten()
            
            # 유사도 점수로 정렬 (자기 자신 제외)
            similar_indices = cosine_sim.argsort()[-top_n-1:-1][::-1]
            
            # 결과 구성
            recommendations = []
            for idx in similar_indices:
                post = self.posts_df.iloc[idx]
                recommendations.append({
                    'post_id': int(post['post_id']),
                    'title': post['title'],
                    'similarity_score': float(cosine_sim[idx]),
                    'category_id': int(post['category_id']),
                    'likes_count': int(post.get('likes_count', 0)),
                    'views_count': int(post.get('views_count', 0)),
                    'created_at': post['created_at'].isoformat()
                })
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error in content-based recommendations: {e}")
            return []
    
    def get_collaborative_recommendations(
        self, 
        user_id: int, 
        top_n: int = 10
    ) -> List[Dict]:
        """협업 필터링 - 사용자 기반 추천"""
        try:
            if self.interactions_df is None or self.interactions_df.empty:
                return self._get_popular_posts(top_n)
            
            # 사용자-게시물 상호작용 매트릭스 생성
            user_item_matrix = self._create_user_item_matrix()
            
            # 해당 사용자의 인덱스 찾기
            if user_id not in user_item_matrix.index:
                logger.info(f"User {user_id} not in matrix, returning popular posts")
                return self._get_popular_posts(top_n)
            
            # 사용자 간 유사도 계산
            user_similarity = self._calculate_user_similarity(user_item_matrix)
            
            # 추천 점수 계산
            recommendations = self._calculate_recommendation_scores(
                user_id, 
                user_item_matrix, 
                user_similarity,
                top_n
            )
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error in collaborative recommendations: {e}")
            return self._get_popular_posts(top_n)
    
    def get_hybrid_recommendations(
        self, 
        user_id: int, 
        top_n: int = 10,
        collaborative_weight: float = 0.6,
        content_weight: float = 0.4
    ) -> List[Dict]:
        """하이브리드 추천 - 협업 + 콘텐츠 기반"""
        try:
            # 사용자가 최근에 본 게시물들 가져오기
            user_interactions = self.interactions_df[
                self.interactions_df['user_id'] == user_id
            ].sort_values('created_at', ascending=False)
            
            if len(user_interactions) == 0:
                return self._get_personalized_popular_posts(user_id, top_n)
            
            # 협업 필터링 점수
            collab_recs = self.get_collaborative_recommendations(user_id, top_n * 2)
            collab_scores = {
                rec['post_id']: rec['score'] 
                for rec in collab_recs
            }
            
            # 최근 본 게시물 기반 콘텐츠 추천
            recent_post_id = user_interactions.iloc[0]['post_id']
            content_recs = self.get_content_based_recommendations(recent_post_id, top_n * 2)
            content_scores = {
                rec['post_id']: rec['similarity_score']
                for rec in content_recs
            }
            
            # 하이브리드 점수 계산
            all_post_ids = set(collab_scores.keys()) | set(content_scores.keys())
            hybrid_scores = {}
            
            for post_id in all_post_ids:
                collab_score = collab_scores.get(post_id, 0)
                content_score = content_scores.get(post_id, 0)
                
                hybrid_scores[post_id] = (
                    collaborative_weight * collab_score +
                    content_weight * content_score
                )
            
            # 상위 N개 선택
            top_posts = sorted(
                hybrid_scores.items(),
                key=lambda x: x[1],
                reverse=True
            )[:top_n]
            
            # 결과 구성
            recommendations = []
            for post_id, score in top_posts:
                post = self.posts_df[self.posts_df['post_id'] == post_id].iloc[0]
                recommendations.append({
                    'post_id': int(post_id),
                    'title': post['title'],
                    'score': float(score),
                    'category_id': int(post['category_id']),
                    'likes_count': int(post.get('likes_count', 0)),
                    'views_count': int(post.get('views_count', 0)),
                    'created_at': post['created_at'].isoformat()
                })
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error in hybrid recommendations: {e}")
            return self._get_popular_posts(top_n)
    
    def _create_user_item_matrix(self) -> pd.DataFrame:
        """사용자-게시물 상호작용 매트릭스 생성"""
        # 상호작용 가중치 (좋아요 > 댓글 > 조회)
        interaction_weights = {
            'like': 3.0,
            'comment': 2.0,
            'view': 1.0
        }
        
        # 가중치 적용
        interactions = self.interactions_df.copy()
        interactions['weight'] = interactions['interaction_type'].map(
            interaction_weights
        ).fillna(1.0)
        
        # 시간 감쇠 적용 (최근 상호작용에 더 높은 가중치)
        now = datetime.now()
        interactions['days_ago'] = (
            now - interactions['created_at']
        ).dt.days
        interactions['time_weight'] = np.exp(-interactions['days_ago'] / 30.0)
        
        interactions['final_weight'] = (
            interactions['weight'] * interactions['time_weight']
        )
        
        # 피벗 테이블 생성
        matrix = interactions.pivot_table(
            index='user_id',
            columns='post_id',
            values='final_weight',
            aggfunc='sum',
            fill_value=0
        )
        
        return matrix
    
    def _calculate_user_similarity(self, matrix: pd.DataFrame) -> pd.DataFrame:
        """사용자 간 유사도 계산"""
        # 코사인 유사도
        similarity = cosine_similarity(matrix)
        similarity_df = pd.DataFrame(
            similarity,
            index=matrix.index,
            columns=matrix.index
        )
        return similarity_df
    
    def _calculate_recommendation_scores(
        self,
        user_id: int,
        user_item_matrix: pd.DataFrame,
        user_similarity: pd.DataFrame,
        top_n: int
    ) -> List[Dict]:
        """추천 점수 계산"""
        # 유사한 사용자들 찾기
        similar_users = user_similarity[user_id].sort_values(ascending=False)[1:11]
        
        # 해당 사용자가 이미 본 게시물 제외
        user_items = user_item_matrix.loc[user_id]
        already_interacted = user_items[user_items > 0].index.tolist()
        
        # 추천 점수 계산
        scores = {}
        for similar_user_id, similarity_score in similar_users.items():
            similar_user_items = user_item_matrix.loc[similar_user_id]
            
            for post_id, interaction_weight in similar_user_items.items():
                if post_id not in already_interacted and interaction_weight > 0:
                    if post_id not in scores:
                        scores[post_id] = 0
                    scores[post_id] += similarity_score * interaction_weight
        
        # 상위 N개 선택
        top_posts = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:top_n]
        
        # 결과 구성
        recommendations = []
        for post_id, score in top_posts:
            post = self.posts_df[self.posts_df['post_id'] == post_id].iloc[0]
            recommendations.append({
                'post_id': int(post_id),
                'title': post['title'],
                'score': float(score),
                'category_id': int(post['category_id']),
                'likes_count': int(post.get('likes_count', 0)),
                'views_count': int(post.get('views_count', 0)),
                'created_at': post['created_at'].isoformat()
            })
        
        return recommendations
    
    def _get_popular_posts(self, top_n: int = 10) -> List[Dict]:
        """인기 게시물 반환 (fallback)"""
        if self.posts_df is None or self.posts_df.empty:
            return []
        
        # 최근 7일 게시물 중 인기순
        recent_date = datetime.now() - timedelta(days=7)
        recent_posts = self.posts_df[self.posts_df['created_at'] >= recent_date]
        
        if len(recent_posts) == 0:
            recent_posts = self.posts_df
        
        # 인기 점수 계산
        recent_posts = recent_posts.copy()
        recent_posts['popularity_score'] = (
            recent_posts['likes_count'] * 3 +
            recent_posts['views_count'] * 0.5 +
            recent_posts.get('comments_count', 0) * 2
        )
        
        # 상위 N개 선택
        top_posts = recent_posts.nlargest(top_n, 'popularity_score')
        
        recommendations = []
        for _, post in top_posts.iterrows():
            recommendations.append({
                'post_id': int(post['post_id']),
                'title': post['title'],
                'score': float(post['popularity_score']),
                'category_id': int(post['category_id']),
                'likes_count': int(post['likes_count']),
                'views_count': int(post['views_count']),
                'created_at': post['created_at'].isoformat()
            })
        
        return recommendations
    
    def _get_personalized_popular_posts(
        self, 
        user_id: int, 
        top_n: int = 10
    ) -> List[Dict]:
        """개인화된 인기 게시물 (사용자 선호 카테고리 기반)"""
        # 사용자가 선호하는 카테고리 파악
        user_interactions = self.interactions_df[
            self.interactions_df['user_id'] == user_id
        ]
        
        if len(user_interactions) > 0:
            # 선호 카테고리 추출
            preferred_categories = (
                user_interactions
                .merge(self.posts_df[['post_id', 'category_id']], on='post_id')
                .groupby('category_id')
                .size()
                .nlargest(3)
                .index.tolist()
            )
            
            # 선호 카테고리의 인기 게시물
            category_posts = self.posts_df[
                self.posts_df['category_id'].isin(preferred_categories)
            ]
            
            if len(category_posts) > 0:
                category_posts = category_posts.copy()
                category_posts['popularity_score'] = (
                    category_posts['likes_count'] * 3 +
                    category_posts['views_count'] * 0.5 +
                    category_posts.get('comments_count', 0) * 2
                )
                
                top_posts = category_posts.nlargest(top_n, 'popularity_score')
                
                recommendations = []
                for _, post in top_posts.iterrows():
                    recommendations.append({
                        'post_id': int(post['post_id']),
                        'title': post['title'],
                        'score': float(post['popularity_score']),
                        'category_id': int(post['category_id']),
                        'likes_count': int(post['likes_count']),
                        'views_count': int(post['views_count']),
                        'created_at': post['created_at'].isoformat()
                    })
                
                return recommendations
        
        return self._get_popular_posts(top_n)


# 싱글톤 인스턴스
recommendation_engine = RecommendationEngine()

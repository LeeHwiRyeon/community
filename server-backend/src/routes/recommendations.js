/**
 * Express.js router for recommendation API
 * Bridges Node.js backend with Python recommendation service
 */

import express from 'express';
import axios from 'axios';
import { authenticateToken } from '../auth/jwt.js';

const router = express.Router();

// Python recommendation service URL
const RECOMMENDATION_SERVICE_URL = process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:8000';

// Helper function to call Python service
async function callRecommendationService(endpoint, params = {}) {
    try {
        const response = await axios.get(`${RECOMMENDATION_SERVICE_URL}${endpoint}`, {
            params,
            timeout: 10000  // 10 second timeout
        });
        return response.data;
    } catch (error) {
        console.error(`Error calling recommendation service (${endpoint}):`, error.message);
        throw new Error('Recommendation service unavailable');
    }
}

/**
 * GET /api/recommendations/posts/:userId
 * Get personalized post recommendations for a user
 */
router.get('/posts/:userId', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const limit = parseInt(req.query.limit) || 10;
        const excludeViewed = req.query.exclude_viewed !== 'false';

        // Verify user can access recommendations (self or admin)
        if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const data = await callRecommendationService('/api/recommend/posts', {
            user_id: userId,
            limit,
            exclude_viewed: excludeViewed
        });

        res.json(data);
    } catch (error) {
        console.error('Error getting post recommendations:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/recommendations/users/:userId
 * Get user recommendations (similar users to follow)
 */
router.get('/users/:userId', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const limit = parseInt(req.query.limit) || 10;

        // Verify user can access recommendations (self or admin)
        if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const data = await callRecommendationService('/api/recommend/users', {
            user_id: userId,
            limit
        });

        res.json(data);
    } catch (error) {
        console.error('Error getting user recommendations:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/recommendations/similar/:postId
 * Get similar posts based on content
 * Public endpoint - no authentication required
 */
router.get('/similar/:postId', async (req, res) => {
    try {
        const postId = parseInt(req.params.postId);
        const limit = parseInt(req.query.limit) || 10;

        const data = await callRecommendationService('/api/recommend/similar', {
            post_id: postId,
            limit
        });

        res.json(data);
    } catch (error) {
        console.error('Error getting similar posts:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/recommendations/refresh
 * Manually trigger model refresh (admin only)
 */
router.post('/refresh', authenticateToken, async (req, res) => {
    try {
        // Only admin can refresh models
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const response = await axios.post(
            `${RECOMMENDATION_SERVICE_URL}/api/recommend/refresh`,
            {},
            { timeout: 30000 }  // 30 second timeout for model refresh
        );

        res.json(response.data);
    } catch (error) {
        console.error('Error refreshing recommendation models:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/recommendations/stats
 * Get recommendation engine statistics (admin only)
 */
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        // Only admin can view stats
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const data = await callRecommendationService('/api/recommend/stats');

        res.json(data);
    } catch (error) {
        console.error('Error getting recommendation stats:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/recommendations/health
 * Check if recommendation service is available
 * Public endpoint
 */
router.get('/health', async (req, res) => {
    try {
        const response = await axios.get(`${RECOMMENDATION_SERVICE_URL}/`, {
            timeout: 5000
        });

        res.json({
            status: 'online',
            service: response.data
        });
    } catch (error) {
        res.status(503).json({
            status: 'offline',
            error: 'Recommendation service unavailable'
        });
    }
});

export default router;

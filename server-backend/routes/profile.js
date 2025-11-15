/**
 * Profile Routes
 * 
 * 사용자 프로필 관련 API 엔드포인트
 */

const express = require('express');
const ProfileService = require('../services/profileService');
const { authenticateToken } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

// Multer 설정 (프로필/커버 이미지 업로드)
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/profiles');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('이미지 파일만 업로드 가능합니다 (jpeg, jpg, png, gif, webp)'));
        }
    }
});

module.exports = (db) => {
    const profileService = new ProfileService(db);

    // ==================== 프로필 조회 API ====================

    /**
     * GET /api/profile/:userId
     * 사용자 프로필 조회
     */
    router.get('/:userId', authenticateToken, async (req, res) => {
        try {
            const { userId } = req.params;
            const viewerId = req.user?.id;

            const profile = await profileService.getUserProfile(userId, viewerId);

            if (!profile) {
                return res.status(404).json({
                    success: false,
                    message: '사용자를 찾을 수 없습니다'
                });
            }

            // 본인이 아니고 비공개 프로필이면 접근 불가
            if (!profile.is_profile_public && profile.id !== viewerId) {
                return res.status(403).json({
                    success: false,
                    message: '비공개 프로필입니다'
                });
            }

            res.json({
                success: true,
                profile
            });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: '프로필 조회에 실패했습니다',
                error: error.message
            });
        }
    });

    /**
     * GET /api/profile/:userId/stats
     * 사용자 활동 통계
     */
    router.get('/:userId/stats', authenticateToken, async (req, res) => {
        try {
            const { userId } = req.params;

            const stats = await profileService.getUserStats(userId);

            res.json({
                success: true,
                stats
            });
        } catch (error) {
            console.error('Get user stats error:', error);
            res.status(500).json({
                success: false,
                message: '통계 조회에 실패했습니다',
                error: error.message
            });
        }
    });

    /**
     * GET /api/profile/:userId/activity
     * 사용자 최근 활동
     */
    router.get('/:userId/activity', authenticateToken, async (req, res) => {
        try {
            const { userId } = req.params;
            const { limit = 10 } = req.query;

            const activities = await profileService.getUserRecentActivity(
                userId,
                parseInt(limit)
            );

            res.json({
                success: true,
                activities
            });
        } catch (error) {
            console.error('Get user activity error:', error);
            res.status(500).json({
                success: false,
                message: '활동 내역 조회에 실패했습니다',
                error: error.message
            });
        }
    });

    /**
     * GET /api/profile/:userId/badges
     * 사용자 배지 목록
     */
    router.get('/:userId/badges', authenticateToken, async (req, res) => {
        try {
            const { userId } = req.params;

            const badges = await profileService.getUserBadges(userId);

            res.json({
                success: true,
                badges
            });
        } catch (error) {
            console.error('Get user badges error:', error);
            res.status(500).json({
                success: false,
                message: '배지 조회에 실패했습니다',
                error: error.message
            });
        }
    });

    // ==================== 프로필 수정 API ====================

    /**
     * PUT /api/profile/:userId
     * 프로필 업데이트 (본인만 가능)
     */
    router.put('/:userId', authenticateToken, async (req, res) => {
        try {
            const { userId } = req.params;

            // 본인만 수정 가능
            if (req.user.id !== parseInt(userId)) {
                return res.status(403).json({
                    success: false,
                    message: '본인의 프로필만 수정할 수 있습니다'
                });
            }

            const updates = req.body;
            const profile = await profileService.updateProfile(userId, updates);

            res.json({
                success: true,
                message: '프로필이 업데이트되었습니다',
                profile
            });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                message: '프로필 업데이트에 실패했습니다',
                error: error.message
            });
        }
    });

    /**
     * POST /api/profile/:userId/profile-image
     * 프로필 이미지 업로드
     */
    router.post(
        '/:userId/profile-image',
        authenticateToken,
        upload.single('profileImage'),
        async (req, res) => {
            try {
                const { userId } = req.params;

                // 본인만 수정 가능
                if (req.user.id !== parseInt(userId)) {
                    return res.status(403).json({
                        success: false,
                        message: '본인의 프로필만 수정할 수 있습니다'
                    });
                }

                if (!req.file) {
                    return res.status(400).json({
                        success: false,
                        message: '이미지 파일이 필요합니다'
                    });
                }

                const imageUrl = `/uploads/profiles/${req.file.filename}`;
                await profileService.updateProfileImage(userId, imageUrl);

                res.json({
                    success: true,
                    message: '프로필 이미지가 업데이트되었습니다',
                    imageUrl
                });
            } catch (error) {
                console.error('Upload profile image error:', error);
                res.status(500).json({
                    success: false,
                    message: '이미지 업로드에 실패했습니다',
                    error: error.message
                });
            }
        }
    );

    /**
     * POST /api/profile/:userId/cover-image
     * 커버 이미지 업로드
     */
    router.post(
        '/:userId/cover-image',
        authenticateToken,
        upload.single('coverImage'),
        async (req, res) => {
            try {
                const { userId } = req.params;

                // 본인만 수정 가능
                if (req.user.id !== parseInt(userId)) {
                    return res.status(403).json({
                        success: false,
                        message: '본인의 프로필만 수정할 수 있습니다'
                    });
                }

                if (!req.file) {
                    return res.status(400).json({
                        success: false,
                        message: '이미지 파일이 필요합니다'
                    });
                }

                const imageUrl = `/uploads/profiles/${req.file.filename}`;
                await profileService.updateCoverImage(userId, imageUrl);

                res.json({
                    success: true,
                    message: '커버 이미지가 업데이트되었습니다',
                    imageUrl
                });
            } catch (error) {
                console.error('Upload cover image error:', error);
                res.status(500).json({
                    success: false,
                    message: '이미지 업로드에 실패했습니다',
                    error: error.message
                });
            }
        }
    );

    // ==================== 배지 관리 API ====================

    /**
     * PUT /api/profile/:userId/badges/:badgeType/visibility
     * 배지 표시 토글
     */
    router.put('/:userId/badges/:badgeType/visibility', authenticateToken, async (req, res) => {
        try {
            const { userId, badgeType } = req.params;

            // 본인만 수정 가능
            if (req.user.id !== parseInt(userId)) {
                return res.status(403).json({
                    success: false,
                    message: '본인의 배지만 수정할 수 있습니다'
                });
            }

            await profileService.toggleBadgeVisibility(userId, badgeType);

            res.json({
                success: true,
                message: '배지 표시 설정이 변경되었습니다'
            });
        } catch (error) {
            console.error('Toggle badge visibility error:', error);
            res.status(500).json({
                success: false,
                message: '배지 설정 변경에 실패했습니다',
                error: error.message
            });
        }
    });

    /**
     * POST /api/profile/:userId/reputation/recalculate
     * 평판 점수 재계산 (본인만)
     */
    router.post('/:userId/reputation/recalculate', authenticateToken, async (req, res) => {
        try {
            const { userId } = req.params;

            // 본인만 가능
            if (req.user.id !== parseInt(userId)) {
                return res.status(403).json({
                    success: false,
                    message: '본인의 평판만 재계산할 수 있습니다'
                });
            }

            const reputation = await profileService.recalculateReputation(userId);

            res.json({
                success: true,
                message: '평판 점수가 재계산되었습니다',
                reputation
            });
        } catch (error) {
            console.error('Recalculate reputation error:', error);
            res.status(500).json({
                success: false,
                message: '평판 재계산에 실패했습니다',
                error: error.message
            });
        }
    });

    // ==================== 검색 및 목록 API ====================

    /**
     * GET /api/profile/search
     * 사용자 검색
     */
    router.get('/search', authenticateToken, async (req, res) => {
        try {
            const { q, page = 1, limit = 20, sortBy = 'reputation' } = req.query;

            if (!q || q.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: '검색어는 2자 이상이어야 합니다'
                });
            }

            const result = await profileService.searchUsers(q, {
                page: parseInt(page),
                limit: parseInt(limit),
                sortBy
            });

            res.json({
                success: true,
                ...result
            });
        } catch (error) {
            console.error('Search users error:', error);
            res.status(500).json({
                success: false,
                message: '사용자 검색에 실패했습니다',
                error: error.message
            });
        }
    });

    /**
     * GET /api/profile/top-contributors
     * 상위 기여자 목록
     */
    router.get('/top-contributors', async (req, res) => {
        try {
            const { limit = 10 } = req.query;

            const contributors = await profileService.getTopContributors(parseInt(limit));

            res.json({
                success: true,
                contributors
            });
        } catch (error) {
            console.error('Get top contributors error:', error);
            res.status(500).json({
                success: false,
                message: '상위 기여자 조회에 실패했습니다',
                error: error.message
            });
        }
    });

    /**
     * GET /api/profile/new-members
     * 신규 회원 목록
     */
    router.get('/new-members', async (req, res) => {
        try {
            const { limit = 10 } = req.query;

            const members = await profileService.getNewMembers(parseInt(limit));

            res.json({
                success: true,
                members
            });
        } catch (error) {
            console.error('Get new members error:', error);
            res.status(500).json({
                success: false,
                message: '신규 회원 조회에 실패했습니다',
                error: error.message
            });
        }
    });

    // ==================== 통계 API ====================

    /**
     * GET /api/profile/:userId/view-stats
     * 프로필 조회수 통계
     */
    router.get('/:userId/view-stats', authenticateToken, async (req, res) => {
        try {
            const { userId } = req.params;
            const { days = 30 } = req.query;

            // 본인만 조회 가능
            if (req.user.id !== parseInt(userId)) {
                return res.status(403).json({
                    success: false,
                    message: '본인의 통계만 조회할 수 있습니다'
                });
            }

            const stats = await profileService.getProfileViewStats(userId, parseInt(days));

            res.json({
                success: true,
                stats
            });
        } catch (error) {
            console.error('Get profile view stats error:', error);
            res.status(500).json({
                success: false,
                message: '조회수 통계 조회에 실패했습니다',
                error: error.message
            });
        }
    });

    /**
     * GET /api/profile/:userId/growth-trend
     * 사용자 성장 추이
     */
    router.get('/:userId/growth-trend', authenticateToken, async (req, res) => {
        try {
            const { userId } = req.params;
            const { days = 30 } = req.query;

            const trend = await profileService.getUserGrowthTrend(userId, parseInt(days));

            res.json({
                success: true,
                trend
            });
        } catch (error) {
            console.error('Get user growth trend error:', error);
            res.status(500).json({
                success: false,
                message: '성장 추이 조회에 실패했습니다',
                error: error.message
            });
        }
    });

    return router;
};

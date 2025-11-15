/**
 * Post Metadata Router
 * Manages SEO metadata and Open Graph tags for posts
 */

import express from 'express';
import { buildAuthMiddleware } from '../auth/jwt.js';
import { query } from '../db.js';

const router = express.Router();
const authMiddleware = buildAuthMiddleware();

/**
 * Generate metadata from post content
 */
function generateMetadataFromContent(title, content) {
    // Remove HTML tags and extra whitespace
    const cleanContent = content
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    // Generate description (first 160 characters)
    const description = cleanContent.length > 160
        ? cleanContent.substring(0, 157) + '...'
        : cleanContent;

    // Extract keywords (simple word frequency analysis)
    const words = cleanContent
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3)
        .filter(word => !/^[0-9]+$/.test(word));

    const wordFreq = {};
    words.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    const keywords = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word]) => word)
        .join(', ');

    return {
        og_title: title,
        og_description: description,
        meta_description: description,
        meta_keywords: keywords,
        auto_generated: 1
    };
}

/**
 * POST /api/posts/:postId/metadata
 * Create or update metadata for a post
 */
router.post('/:postId/metadata', authMiddleware, async (req, res) => {
    try {
        const { postId } = req.params;
        const {
            og_title,
            og_description,
            og_image,
            og_url,
            meta_keywords,
            meta_description,
            auto_generate = false
        } = req.body;

        // Verify post exists and user owns it
        const post = await query(
            'SELECT id, user_id, title, content FROM posts WHERE id = ? AND deleted_at IS NULL',
            [postId]
        );

        if (!post || post.length === 0) {
            return res.status(404).json({
                success: false,
                message: '게시글을 찾을 수 없습니다.'
            });
        }

        if (post[0].user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: '권한이 없습니다.'
            });
        }

        let metadata;

        // Auto-generate metadata if requested
        if (auto_generate) {
            metadata = generateMetadataFromContent(post[0].title, post[0].content);
        } else {
            metadata = {
                og_title: og_title || post[0].title,
                og_description: og_description || null,
                og_image: og_image || null,
                og_url: og_url || null,
                meta_keywords: meta_keywords || null,
                meta_description: meta_description || null,
                auto_generated: 0
            };
        }

        // Check if metadata already exists
        const existing = await query(
            'SELECT id FROM post_metadata WHERE post_id = ?',
            [postId]
        );

        if (existing && existing.length > 0) {
            // Update existing metadata
            await query(
                `UPDATE post_metadata 
                SET og_title = ?, og_description = ?, og_image = ?, og_url = ?,
                    meta_keywords = ?, meta_description = ?, auto_generated = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE post_id = ?`,
                [
                    metadata.og_title,
                    metadata.og_description,
                    metadata.og_image,
                    metadata.og_url,
                    metadata.meta_keywords,
                    metadata.meta_description,
                    metadata.auto_generated,
                    postId
                ]
            );
        } else {
            // Insert new metadata
            await query(
                `INSERT INTO post_metadata 
                (post_id, og_title, og_description, og_image, og_url, 
                 meta_keywords, meta_description, auto_generated)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    postId,
                    metadata.og_title,
                    metadata.og_description,
                    metadata.og_image,
                    metadata.og_url,
                    metadata.meta_keywords,
                    metadata.meta_description,
                    metadata.auto_generated
                ]
            );
        }

        // Fetch updated metadata
        const result = await query(
            'SELECT * FROM post_metadata WHERE post_id = ?',
            [postId]
        );

        res.json({
            success: true,
            message: '메타데이터가 저장되었습니다.',
            metadata: result[0]
        });

    } catch (error) {
        console.error('Post metadata creation error:', error);
        res.status(500).json({
            success: false,
            message: '메타데이터 저장 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * GET /api/posts/:postId/metadata
 * Get metadata for a post
 */
router.get('/:postId/metadata', async (req, res) => {
    try {
        const { postId } = req.params;

        // Verify post exists
        const post = await query(
            'SELECT id FROM posts WHERE id = ? AND deleted_at IS NULL',
            [postId]
        );

        if (!post || post.length === 0) {
            return res.status(404).json({
                success: false,
                message: '게시글을 찾을 수 없습니다.'
            });
        }

        // Get metadata
        const metadata = await query(
            'SELECT * FROM post_metadata WHERE post_id = ?',
            [postId]
        );

        if (!metadata || metadata.length === 0) {
            return res.json({
                success: true,
                metadata: null
            });
        }

        res.json({
            success: true,
            metadata: metadata[0]
        });

    } catch (error) {
        console.error('Get metadata error:', error);
        res.status(500).json({
            success: false,
            message: '메타데이터 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * POST /api/posts/:postId/metadata/auto-generate
 * Auto-generate metadata from post content
 */
router.post('/:postId/metadata/auto-generate', authMiddleware, async (req, res) => {
    try {
        const { postId } = req.params;

        // Get post content
        const post = await query(
            'SELECT id, user_id, title, content FROM posts WHERE id = ? AND deleted_at IS NULL',
            [postId]
        );

        if (!post || post.length === 0) {
            return res.status(404).json({
                success: false,
                message: '게시글을 찾을 수 없습니다.'
            });
        }

        if (post[0].user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: '권한이 없습니다.'
            });
        }

        // Generate metadata
        const metadata = generateMetadataFromContent(post[0].title, post[0].content);

        res.json({
            success: true,
            message: '메타데이터가 생성되었습니다.',
            metadata
        });

    } catch (error) {
        console.error('Auto-generate metadata error:', error);
        res.status(500).json({
            success: false,
            message: '메타데이터 생성 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * DELETE /api/posts/:postId/metadata
 * Delete metadata for a post
 */
router.delete('/:postId/metadata', authMiddleware, async (req, res) => {
    try {
        const { postId } = req.params;

        // Verify post exists and user owns it
        const post = await query(
            'SELECT id, user_id FROM posts WHERE id = ? AND deleted_at IS NULL',
            [postId]
        );

        if (!post || post.length === 0) {
            return res.status(404).json({
                success: false,
                message: '게시글을 찾을 수 없습니다.'
            });
        }

        if (post[0].user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: '권한이 없습니다.'
            });
        }

        // Delete metadata
        await query(
            'DELETE FROM post_metadata WHERE post_id = ?',
            [postId]
        );

        res.json({
            success: true,
            message: '메타데이터가 삭제되었습니다.'
        });

    } catch (error) {
        console.error('Delete metadata error:', error);
        res.status(500).json({
            success: false,
            message: '메타데이터 삭제 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

export default router;

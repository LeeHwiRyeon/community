/**
 * Comments API Routes
 * Handles comment creation, retrieval, updates, deletion, and likes
 */

import express from 'express';
import db from '../config/sqlite-db.js';
import { buildAuthMiddleware } from '../auth/jwt.js';
const authMiddleware = buildAuthMiddleware();
import {
    notifyNewComment,
    notifyCommentReply,
    notifyCommentLike,
} from '../utils/notification-helper.js';

const router = express.Router();

/**
 * GET /api/posts/:postId/comments
 * Get all comments for a post (with nested replies)
 */
router.get('/posts/:postId/comments', async (req, res) => {
    try {
        const { postId } = req.params;
        const { limit = 20, offset = 0 } = req.query;

        // Get all comments for the post (not soft deleted)
        const [comments] = db.query(
            `SELECT 
        c.id,
        c.post_id,
        c.user_id,
        c.content,
        c.parent_id,
        c.created_at,
        c.updated_at,
        u.username,
        u.display_name,
        u.avatar_url,
        (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as like_count,
        CASE WHEN EXISTS (
          SELECT 1 FROM comment_likes 
          WHERE comment_id = c.id AND user_id = ?
        ) THEN 1 ELSE 0 END as is_liked
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ? AND c.deleted_at IS NULL
      ORDER BY c.created_at ASC`,
            [req.user?.id || 0, postId]
        );

        // Build nested comment tree
        const commentMap = new Map();
        const rootComments = [];

        // First pass: create all comment objects
        comments.forEach(comment => {
            commentMap.set(comment.id, {
                ...comment,
                replies: []
            });
        });

        // Second pass: build the tree structure
        comments.forEach(comment => {
            const commentObj = commentMap.get(comment.id);
            if (comment.parent_id) {
                const parent = commentMap.get(comment.parent_id);
                if (parent) {
                    parent.replies.push(commentObj);
                }
            } else {
                rootComments.push(commentObj);
            }
        });

        // Get total count
        const [countResult] = db.query(
            `SELECT COUNT(*) as total 
       FROM comments 
       WHERE post_id = ? AND deleted_at IS NULL`,
            [postId]
        );

        res.json({
            success: true,
            comments: rootComments,
            total: countResult[0].total,
            hasMore: offset + rootComments.length < countResult[0].total
        });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({
            success: false,
            message: '댓글 조회에 실패했습니다.',
            error: error.message
        });
    }
});

/**
 * POST /api/posts/:postId/comments
 * Create a new comment (or reply)
 */
router.post('/posts/:postId/comments', authMiddleware, async (req, res) => {
    try {
        const { postId } = req.params;
        const { content, parent_id } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: '댓글 내용을 입력해주세요.'
            });
        }

        if (content.length > 2000) {
            return res.status(400).json({
                success: false,
                message: '댓글은 2000자를 초과할 수 없습니다.'
            });
        }

        // Check if post exists
        const [posts] = db.query(
            'SELECT id FROM posts WHERE id = ? AND deleted_at IS NULL',
            [postId]
        );

        if (posts.length === 0) {
            return res.status(404).json({
                success: false,
                message: '게시글을 찾을 수 없습니다.'
            });
        }

        // If parent_id is provided, check if parent comment exists
        if (parent_id) {
            const [parentComments] = db.query(
                'SELECT id FROM comments WHERE id = ? AND post_id = ? AND deleted_at IS NULL',
                [parent_id, postId]
            );

            if (parentComments.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '부모 댓글을 찾을 수 없습니다.'
                });
            }
        }

        // Create comment
        const [result] = db.execute(
            `INSERT INTO comments (post_id, user_id, content, parent_id)
       VALUES (?, ?, ?, ?)`,
            [postId, userId, content.trim(), parent_id || null]
        );

        // Get the created comment with user info
        const [newComment] = db.query(
            `SELECT 
        c.id,
        c.post_id,
        c.user_id,
        c.content,
        c.parent_id,
        c.created_at,
        c.updated_at,
        u.username,
        u.display_name,
        u.avatar_url,
        0 as like_count,
        0 as is_liked
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?`,
            [result.lastInsertRowid]
        );

        // Create notifications
        try {
            if (parent_id) {
                // Notify parent comment author about reply
                const [parentComment] = db.query(
                    `SELECT c.user_id, p.title 
           FROM comments c 
           JOIN posts p ON c.post_id = p.id 
           WHERE c.id = ?`,
                    [parent_id]
                );

                if (parentComment.length > 0) {
                    await notifyCommentReply({
                        commentId: parent_id,
                        commentAuthorId: parentComment[0].user_id,
                        replyAuthorId: userId,
                        replyAuthorName: newComment[0].display_name || newComment[0].username,
                        postTitle: parentComment[0].title,
                    });
                }
            } else {
                // Notify post author about new comment
                const [post] = db.query(
                    'SELECT user_id, title FROM posts WHERE id = ?',
                    [postId]
                );

                if (post.length > 0) {
                    await notifyNewComment({
                        postId: postId,
                        postAuthorId: post[0].user_id,
                        commentAuthorId: userId,
                        commentAuthorName: newComment[0].display_name || newComment[0].username,
                        postTitle: post[0].title,
                    });
                }
            }
        } catch (notifError) {
            console.error('Failed to create notification:', notifError);
            // Don't fail the request if notification fails
        }

        res.status(201).json({
            success: true,
            message: '댓글이 작성되었습니다.',
            comment: {
                ...newComment[0],
                replies: []
            }
        });
    } catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({
            success: false,
            message: '댓글 작성에 실패했습니다.',
            error: error.message
        });
    }
});

/**
 * PUT /api/comments/:commentId
 * Update a comment
 */
router.put('/comments/:commentId', authMiddleware, async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: '댓글 내용을 입력해주세요.'
            });
        }

        if (content.length > 2000) {
            return res.status(400).json({
                success: false,
                message: '댓글은 2000자를 초과할 수 없습니다.'
            });
        }

        // Check if comment exists and user is the author
        const [comments] = db.query(
            'SELECT id, user_id FROM comments WHERE id = ? AND deleted_at IS NULL',
            [commentId]
        );

        if (comments.length === 0) {
            return res.status(404).json({
                success: false,
                message: '댓글을 찾을 수 없습니다.'
            });
        }

        if (comments[0].user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: '자신의 댓글만 수정할 수 있습니다.'
            });
        }

        // Update comment
        db.execute(
            `UPDATE comments 
       SET content = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
            [content.trim(), commentId]
        );

        // Get updated comment with user info
        const [updatedComment] = db.query(
            `SELECT 
        c.id,
        c.post_id,
        c.user_id,
        c.content,
        c.parent_id,
        c.created_at,
        c.updated_at,
        u.username,
        u.display_name,
        u.avatar_url,
        (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as like_count,
        CASE WHEN EXISTS (
          SELECT 1 FROM comment_likes 
          WHERE comment_id = c.id AND user_id = ?
        ) THEN 1 ELSE 0 END as is_liked
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?`,
            [userId, commentId]
        );

        res.json({
            success: true,
            message: '댓글이 수정되었습니다.',
            comment: updatedComment[0]
        });
    } catch (error) {
        console.error('Update comment error:', error);
        res.status(500).json({
            success: false,
            message: '댓글 수정에 실패했습니다.',
            error: error.message
        });
    }
});

/**
 * DELETE /api/comments/:commentId
 * Delete a comment (soft delete)
 */
router.delete('/comments/:commentId', authMiddleware, async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;

        // Check if comment exists and user is the author
        const [comments] = db.query(
            'SELECT id, user_id FROM comments WHERE id = ? AND deleted_at IS NULL',
            [commentId]
        );

        if (comments.length === 0) {
            return res.status(404).json({
                success: false,
                message: '댓글을 찾을 수 없습니다.'
            });
        }

        if (comments[0].user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: '자신의 댓글만 삭제할 수 있습니다.'
            });
        }

        // Soft delete comment
        db.execute(
            `UPDATE comments 
       SET deleted_at = CURRENT_TIMESTAMP, content = '[삭제된 댓글입니다]'
       WHERE id = ?`,
            [commentId]
        );

        res.json({
            success: true,
            message: '댓글이 삭제되었습니다.'
        });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({
            success: false,
            message: '댓글 삭제에 실패했습니다.',
            error: error.message
        });
    }
});

/**
 * POST /api/comments/:commentId/like
 * Like or unlike a comment
 */
router.post('/comments/:commentId/like', authMiddleware, async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;

        // Check if comment exists
        const [comments] = db.query(
            'SELECT id FROM comments WHERE id = ? AND deleted_at IS NULL',
            [commentId]
        );

        if (comments.length === 0) {
            return res.status(404).json({
                success: false,
                message: '댓글을 찾을 수 없습니다.'
            });
        }

        // Check if already liked
        const [existingLikes] = db.query(
            'SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?',
            [commentId, userId]
        );

        if (existingLikes.length > 0) {
            // Unlike: remove like
            db.execute(
                'DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?',
                [commentId, userId]
            );

            // Get updated like count
            const [likeCount] = db.query(
                'SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = ?',
                [commentId]
            );

            return res.json({
                success: true,
                message: '좋아요를 취소했습니다.',
                is_liked: false,
                like_count: likeCount[0].count
            });
        } else {
            // Like: add like
            db.execute(
                'INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)',
                [commentId, userId]
            );

            // Get updated like count
            const [likeCount] = db.query(
                'SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = ?',
                [commentId]
            );

            // Create notification for comment author
            try {
                const [comment] = db.query(
                    `SELECT c.user_id, u.username, u.display_name 
           FROM comments c 
           JOIN users u ON u.id = ?
           WHERE c.id = ?`,
                    [userId, commentId]
                );

                if (comment.length > 0) {
                    const [commentData] = db.query(
                        'SELECT user_id FROM comments WHERE id = ?',
                        [commentId]
                    );

                    await notifyCommentLike({
                        commentId: commentId,
                        commentAuthorId: commentData[0].user_id,
                        likeAuthorId: userId,
                        likeAuthorName: comment[0].display_name || comment[0].username,
                    });
                }
            } catch (notifError) {
                console.error('Failed to create like notification:', notifError);
            }

            return res.json({
                success: true,
                message: '좋아요를 추가했습니다.',
                is_liked: true,
                like_count: likeCount[0].count
            });
        }
    } catch (error) {
        console.error('Toggle comment like error:', error);
        res.status(500).json({
            success: false,
            message: '좋아요 처리에 실패했습니다.',
            error: error.message
        });
    }
});

/**
 * GET /api/comments/:commentId
 * Get a single comment by ID
 */
router.get('/comments/:commentId', async (req, res) => {
    try {
        const { commentId } = req.params;

        const [comments] = db.query(
            `SELECT 
        c.id,
        c.post_id,
        c.user_id,
        c.content,
        c.parent_id,
        c.created_at,
        c.updated_at,
        u.username,
        u.display_name,
        u.avatar_url,
        (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as like_count,
        CASE WHEN EXISTS (
          SELECT 1 FROM comment_likes 
          WHERE comment_id = c.id AND user_id = ?
        ) THEN 1 ELSE 0 END as is_liked
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ? AND c.deleted_at IS NULL`,
            [req.user?.id || 0, commentId]
        );

        if (comments.length === 0) {
            return res.status(404).json({
                success: false,
                message: '댓글을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            comment: comments[0]
        });
    } catch (error) {
        console.error('Get comment error:', error);
        res.status(500).json({
            success: false,
            message: '댓글 조회에 실패했습니다.',
            error: error.message
        });
    }
});

export default router;


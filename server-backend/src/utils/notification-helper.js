/**
 * Notification Helper Functions
 * SQLite를 사용한 간단한 알림 생성 유틸리티
 */

import db from '../config/sqlite-db.js';

// Notification types
export const NOTIFICATION_TYPES = {
    COMMENT: 'comment',
    REPLY: 'reply',
    LIKE: 'like',
    COMMENT_LIKE: 'comment_like',
    FOLLOW: 'follow',
    MENTION: 'mention',
    POST: 'post',
    SYSTEM: 'system',
};

/**
 * Create a notification
 */
export async function createNotification({
    userId,
    type,
    title,
    content,
    relatedId = null,
    relatedType = null,
    actorId = null,
}) {
    try {
        // Don't create notification for self-actions
        if (userId === actorId) {
            return null;
        }

        const [result] = db.execute(
            `INSERT INTO notifications (user_id, type, title, content, related_id, related_type, actor_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, type, title, content, relatedId, relatedType, actorId]
        );

        return result.lastInsertRowid;
    } catch (error) {
        console.error('Failed to create notification:', error);
        return null;
    }
}

/**
 * Create notification for new comment on post
 */
export async function notifyNewComment({
    postId,
    postAuthorId,
    commentAuthorId,
    commentAuthorName,
    postTitle,
}) {
    return createNotification({
        userId: postAuthorId,
        type: NOTIFICATION_TYPES.COMMENT,
        title: '새 댓글',
        content: `${commentAuthorName}님이 "${postTitle}" 게시글에 댓글을 남겼습니다.`,
        relatedId: postId,
        relatedType: 'post',
        actorId: commentAuthorId,
    });
}

/**
 * Create notification for reply to comment
 */
export async function notifyCommentReply({
    commentId,
    commentAuthorId,
    replyAuthorId,
    replyAuthorName,
    postTitle,
}) {
    return createNotification({
        userId: commentAuthorId,
        type: NOTIFICATION_TYPES.REPLY,
        title: '답글',
        content: `${replyAuthorName}님이 회원님의 댓글에 답글을 남겼습니다.`,
        relatedId: commentId,
        relatedType: 'comment',
        actorId: replyAuthorId,
    });
}

/**
 * Create notification for comment like
 */
export async function notifyCommentLike({
    commentId,
    commentAuthorId,
    likeAuthorId,
    likeAuthorName,
}) {
    return createNotification({
        userId: commentAuthorId,
        type: NOTIFICATION_TYPES.COMMENT_LIKE,
        title: '댓글 좋아요',
        content: `${likeAuthorName}님이 회원님의 댓글을 좋아합니다.`,
        relatedId: commentId,
        relatedType: 'comment',
        actorId: likeAuthorId,
    });
}

/**
 * Create notification for post like
 */
export async function notifyPostLike({
    postId,
    postAuthorId,
    likeAuthorId,
    likeAuthorName,
    postTitle,
}) {
    return createNotification({
        userId: postAuthorId,
        type: NOTIFICATION_TYPES.LIKE,
        title: '게시글 좋아요',
        content: `${likeAuthorName}님이 "${postTitle}" 게시글을 좋아합니다.`,
        relatedId: postId,
        relatedType: 'post',
        actorId: likeAuthorId,
    });
}

/**
 * Create notification for new follower
 */
export async function notifyNewFollow({
    followedUserId,
    followerUserId,
    followerUsername,
}) {
    return createNotification({
        userId: followedUserId,
        type: NOTIFICATION_TYPES.FOLLOW,
        title: '새 팔로워',
        content: `${followerUsername}님이 회원님을 팔로우하기 시작했습니다.`,
        relatedId: followerUserId,
        relatedType: 'user',
        actorId: followerUserId,
    });
}

/**
 * Create notification for mention
 */
export async function notifyMention({
    mentionedUserId,
    mentionerUserId,
    mentionerUsername,
    contentType,
    contentId,
}) {
    return createNotification({
        userId: mentionedUserId,
        type: NOTIFICATION_TYPES.MENTION,
        title: '멘션',
        content: `${mentionerUsername}님이 회원님을 언급했습니다.`,
        relatedId: contentId,
        relatedType: contentType,
        actorId: mentionerUserId,
    });
}

export default {
    createNotification,
    notifyNewComment,
    notifyCommentReply,
    notifyCommentLike,
    notifyPostLike,
    notifyNewFollow,
    notifyMention,
    NOTIFICATION_TYPES,
};

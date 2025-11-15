import { getPool } from '../db.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('BookmarkService');

class BookmarkService {
    /**
     * 게시물 북마크 추가
     */
    async addBookmark(userId, postId, folder = 'default', notes = null) {
        const pool = getPool();

        try {
            // 게시물 존재 확인
            const [post] = await pool.query(
                'SELECT id, title FROM posts WHERE id = ? AND deleted = 0',
                [postId]
            );

            if (post.length === 0) {
                throw new Error('존재하지 않거나 삭제된 게시물입니다');
            }

            // 이미 북마크되었는지 확인
            const [existing] = await pool.query(
                'SELECT id FROM bookmarks WHERE user_id = ? AND post_id = ?',
                [userId, postId]
            );

            if (existing.length > 0) {
                throw new Error('이미 북마크된 게시물입니다');
            }

            // 북마크 추가
            const [result] = await pool.query(
                'INSERT INTO bookmarks (user_id, post_id, folder, notes) VALUES (?, ?, ?, ?)',
                [userId, postId, folder, notes]
            );

            logger.info(`북마크 추가: user=${userId}, post=${postId}, folder=${folder}`);

            return {
                success: true,
                bookmarkId: result.insertId,
                postTitle: post[0].title
            };
        } catch (error) {
            logger.error('북마크 추가 실패:', error);
            throw error;
        }
    }

    /**
     * 북마크 제거
     */
    async removeBookmark(userId, postId) {
        const pool = getPool();

        try {
            const [result] = await pool.query(
                'DELETE FROM bookmarks WHERE user_id = ? AND post_id = ?',
                [userId, postId]
            );

            if (result.affectedRows === 0) {
                throw new Error('북마크가 존재하지 않습니다');
            }

            logger.info(`북마크 제거: user=${userId}, post=${postId}`);

            return { success: true };
        } catch (error) {
            logger.error('북마크 제거 실패:', error);
            throw error;
        }
    }

    /**
     * 북마크 여부 확인
     */
    async isBookmarked(userId, postId) {
        const pool = getPool();

        try {
            const [result] = await pool.query(
                'SELECT id, folder FROM bookmarks WHERE user_id = ? AND post_id = ?',
                [userId, postId]
            );

            return {
                isBookmarked: result.length > 0,
                folder: result.length > 0 ? result[0].folder : null
            };
        } catch (error) {
            logger.error('북마크 여부 확인 실패:', error);
            throw error;
        }
    }

    /**
     * 사용자의 북마크 목록 조회
     */
    async getUserBookmarks(userId, folder = null, limit = 20, offset = 0) {
        const pool = getPool();

        try {
            let query = `
                SELECT 
                    b.id AS bookmark_id,
                    b.post_id,
                    b.folder,
                    b.notes,
                    b.created_at AS bookmarked_at,
                    p.title,
                    p.content,
                    p.user_id AS author_id,
                    u.username AS author_username,
                    u.display_name AS author_display_name,
                    u.profile_image AS author_avatar,
                    p.board_id,
                    bd.name AS board_name,
                    p.created_at AS post_created_at,
                    p.view_count,
                    p.upvotes,
                    p.downvotes,
                    (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comment_count
                FROM bookmarks b
                INNER JOIN posts p ON b.post_id = p.id
                INNER JOIN users u ON p.user_id = u.id
                INNER JOIN boards bd ON p.board_id = bd.id
                WHERE b.user_id = ? AND p.deleted = 0
            `;

            const params = [userId];

            if (folder) {
                query += ' AND b.folder = ?';
                params.push(folder);
            }

            query += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const [bookmarks] = await pool.query(query, params);

            // 총 개수 조회
            let countQuery = 'SELECT COUNT(*) as total FROM bookmarks b INNER JOIN posts p ON b.post_id = p.id WHERE b.user_id = ? AND p.deleted = 0';
            const countParams = [userId];

            if (folder) {
                countQuery += ' AND b.folder = ?';
                countParams.push(folder);
            }

            const [countResult] = await pool.query(countQuery, countParams);

            return {
                bookmarks,
                total: countResult[0].total,
                limit,
                offset
            };
        } catch (error) {
            logger.error('북마크 목록 조회 실패:', error);
            throw error;
        }
    }

    /**
     * 북마크 폴더 생성
     */
    async createFolder(userId, name, description = null, color = '#3182CE', icon = 'bookmark', isPrivate = false) {
        const pool = getPool();

        try {
            // 중복 확인
            const [existing] = await pool.query(
                'SELECT id FROM bookmark_folders WHERE user_id = ? AND name = ?',
                [userId, name]
            );

            if (existing.length > 0) {
                throw new Error('이미 존재하는 폴더 이름입니다');
            }

            // 폴더 생성
            const [result] = await pool.query(
                'INSERT INTO bookmark_folders (user_id, name, description, color, icon, is_private) VALUES (?, ?, ?, ?, ?, ?)',
                [userId, name, description, color, icon, isPrivate]
            );

            logger.info(`북마크 폴더 생성: user=${userId}, folder=${name}`);

            return {
                success: true,
                folderId: result.insertId
            };
        } catch (error) {
            logger.error('폴더 생성 실패:', error);
            throw error;
        }
    }

    /**
     * 북마크 폴더 목록 조회
     */
    async getUserFolders(userId) {
        const pool = getPool();

        try {
            const [folders] = await pool.query(`
                SELECT 
                    bf.id,
                    bf.name,
                    bf.description,
                    bf.color,
                    bf.icon,
                    bf.is_private,
                    bf.created_at,
                    COUNT(b.id) AS bookmark_count
                FROM bookmark_folders bf
                LEFT JOIN bookmarks b ON bf.user_id = b.user_id AND bf.name = b.folder
                WHERE bf.user_id = ?
                GROUP BY bf.id, bf.name, bf.description, bf.color, bf.icon, bf.is_private, bf.created_at
                ORDER BY bf.created_at ASC
            `, [userId]);

            return folders;
        } catch (error) {
            logger.error('폴더 목록 조회 실패:', error);
            throw error;
        }
    }

    /**
     * 북마크 폴더 수정
     */
    async updateFolder(userId, folderId, updates) {
        const pool = getPool();

        try {
            // 폴더 소유권 확인
            const [folder] = await pool.query(
                'SELECT id, name FROM bookmark_folders WHERE id = ? AND user_id = ?',
                [folderId, userId]
            );

            if (folder.length === 0) {
                throw new Error('폴더를 찾을 수 없거나 권한이 없습니다');
            }

            const oldName = folder[0].name;
            const allowedFields = ['name', 'description', 'color', 'icon', 'is_private'];
            const updateFields = [];
            const updateValues = [];

            for (const [key, value] of Object.entries(updates)) {
                if (allowedFields.includes(key)) {
                    updateFields.push(`${key} = ?`);
                    updateValues.push(value);
                }
            }

            if (updateFields.length === 0) {
                throw new Error('수정할 필드가 없습니다');
            }

            updateValues.push(folderId, userId);

            await pool.query(
                `UPDATE bookmark_folders SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
                updateValues
            );

            // 폴더 이름이 변경된 경우 북마크의 folder 필드도 업데이트
            if (updates.name && updates.name !== oldName) {
                await pool.query(
                    'UPDATE bookmarks SET folder = ? WHERE user_id = ? AND folder = ?',
                    [updates.name, userId, oldName]
                );
            }

            logger.info(`폴더 수정: user=${userId}, folder=${folderId}`);

            return { success: true };
        } catch (error) {
            logger.error('폴더 수정 실패:', error);
            throw error;
        }
    }

    /**
     * 북마크 폴더 삭제
     */
    async deleteFolder(userId, folderId) {
        const pool = getPool();

        try {
            // 폴더 소유권 확인
            const [folder] = await pool.query(
                'SELECT id, name FROM bookmark_folders WHERE id = ? AND user_id = ?',
                [folderId, userId]
            );

            if (folder.length === 0) {
                throw new Error('폴더를 찾을 수 없거나 권한이 없습니다');
            }

            const folderName = folder[0].name;

            // 해당 폴더의 북마크를 기본 폴더로 이동
            await pool.query(
                'UPDATE bookmarks SET folder = ? WHERE user_id = ? AND folder = ?',
                ['default', userId, folderName]
            );

            // 폴더 삭제
            await pool.query(
                'DELETE FROM bookmark_folders WHERE id = ? AND user_id = ?',
                [folderId, userId]
            );

            logger.info(`폴더 삭제: user=${userId}, folder=${folderId}`);

            return { success: true };
        } catch (error) {
            logger.error('폴더 삭제 실패:', error);
            throw error;
        }
    }

    /**
     * 북마크를 다른 폴더로 이동
     */
    async moveBookmark(userId, bookmarkId, targetFolder) {
        const pool = getPool();

        try {
            // 북마크 소유권 확인
            const [bookmark] = await pool.query(
                'SELECT id FROM bookmarks WHERE id = ? AND user_id = ?',
                [bookmarkId, userId]
            );

            if (bookmark.length === 0) {
                throw new Error('북마크를 찾을 수 없거나 권한이 없습니다');
            }

            // 북마크 이동
            await pool.query(
                'UPDATE bookmarks SET folder = ? WHERE id = ? AND user_id = ?',
                [targetFolder, bookmarkId, userId]
            );

            logger.info(`북마크 이동: user=${userId}, bookmark=${bookmarkId}, folder=${targetFolder}`);

            return { success: true };
        } catch (error) {
            logger.error('북마크 이동 실패:', error);
            throw error;
        }
    }

    /**
     * 북마크 메모 수정
     */
    async updateBookmarkNotes(userId, bookmarkId, notes) {
        const pool = getPool();

        try {
            // 북마크 소유권 확인
            const [bookmark] = await pool.query(
                'SELECT id FROM bookmarks WHERE id = ? AND user_id = ?',
                [bookmarkId, userId]
            );

            if (bookmark.length === 0) {
                throw new Error('북마크를 찾을 수 없거나 권한이 없습니다');
            }

            // 메모 업데이트
            await pool.query(
                'UPDATE bookmarks SET notes = ? WHERE id = ? AND user_id = ?',
                [notes, bookmarkId, userId]
            );

            logger.info(`북마크 메모 수정: user=${userId}, bookmark=${bookmarkId}`);

            return { success: true };
        } catch (error) {
            logger.error('북마크 메모 수정 실패:', error);
            throw error;
        }
    }

    /**
     * 사용자 북마크 통계 조회
     */
    async getUserBookmarkStats(userId) {
        const pool = getPool();

        try {
            const [stats] = await pool.query(`
                SELECT 
                    user_id,
                    username,
                    total_bookmarks,
                    folder_count,
                    bookmarks_last_week,
                    last_bookmark_at
                FROM bookmark_stats
                WHERE user_id = ?
            `, [userId]);

            return stats[0] || {
                user_id: userId,
                total_bookmarks: 0,
                folder_count: 0,
                bookmarks_last_week: 0,
                last_bookmark_at: null
            };
        } catch (error) {
            logger.error('북마크 통계 조회 실패:', error);
            throw error;
        }
    }

    /**
     * 인기 북마크 게시물 조회
     */
    async getPopularBookmarkedPosts(limit = 10) {
        const pool = getPool();

        try {
            const [posts] = await pool.query(`
                SELECT * FROM popular_bookmarked_posts
                LIMIT ?
            `, [limit]);

            return posts;
        } catch (error) {
            logger.error('인기 북마크 게시물 조회 실패:', error);
            throw error;
        }
    }
}

export default new BookmarkService();

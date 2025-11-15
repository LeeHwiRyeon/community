/**
 * Group Chat Routes
 * REST API endpoints for group chat management
 */

import express from 'express';
import { authenticateToken } from '../auth/jwt.js';
import { query } from '../db.js';
import crypto from 'crypto';

const router = express.Router();

// ========================================
// Helper Functions
// ========================================

/**
 * Check if user is member of a group
 */
async function isMember(groupId, userId) {
    const [members] = await query(
        'SELECT * FROM group_members WHERE group_id = ? AND user_id = ? AND is_banned = FALSE',
        [groupId, userId]
    );
    return members.length > 0;
}

/**
 * Check if user has specific role in group
 */
async function hasRole(groupId, userId, roles) {
    const [members] = await query(
        'SELECT role FROM group_members WHERE group_id = ? AND user_id = ? AND is_banned = FALSE',
        [groupId, userId]
    );
    if (members.length === 0) return false;
    return roles.includes(members[0].role);
}

/**
 * Get group details with member count
 */
async function getGroupDetails(groupId) {
    const [groups] = await query(`
        SELECT 
            gc.*,
            (SELECT COUNT(*) FROM group_members WHERE group_id = gc.id AND is_banned = FALSE) as member_count,
            (SELECT COUNT(*) FROM group_messages WHERE group_id = gc.id AND deleted_at IS NULL) as message_count
        FROM group_chats gc
        WHERE gc.id = ? AND gc.deleted_at IS NULL
    `, [groupId]);

    return groups[0] || null;
}

// ========================================
// REST API Endpoints
// ========================================

/**
 * POST /api/group-chat/groups
 * Create a new group
 */
router.post('/groups', authenticateToken, async (req, res) => {
    try {
        const { name, description, is_private = false, max_members = 100 } = req.body;
        const userId = req.user.id;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Group name is required' });
        }

        // Generate invite code for private groups
        const inviteCode = is_private ? crypto.randomBytes(8).toString('hex') : null;

        // Create group
        const [result] = await query(
            `INSERT INTO group_chats (name, description, owner_id, is_private, max_members, invite_code)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name.trim(), description || '', userId, is_private, max_members, inviteCode]
        );

        const groupId = result.insertId;

        // Add creator as admin
        await query(
            'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)',
            [groupId, userId, 'admin']
        );

        // Create default settings
        await query(
            'INSERT INTO group_settings (group_id) VALUES (?)',
            [groupId]
        );

        const group = await getGroupDetails(groupId);
        res.status(201).json({ group });
    } catch (error) {
        console.error('[group-chat] Create group error:', error);
        res.status(500).json({ error: 'Failed to create group' });
    }
});

/**
 * GET /api/group-chat/groups
 * Get list of groups user belongs to
 */
router.get('/groups', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20, type = 'all' } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let whereClause = 'WHERE gc.deleted_at IS NULL AND gm.user_id = ? AND gm.is_banned = FALSE';
        if (type === 'owned') {
            whereClause += ' AND gc.owner_id = ?';
        }

        const params = type === 'owned' ? [userId, userId] : [userId];

        const [groups] = await query(`
            SELECT 
                gc.*,
                gm.role as my_role,
                gm.last_read_at,
                (SELECT COUNT(*) FROM group_members WHERE group_id = gc.id AND is_banned = FALSE) as member_count,
                (SELECT COUNT(*) FROM group_messages WHERE group_id = gc.id AND deleted_at IS NULL AND created_at > COALESCE(gm.last_read_at, '1970-01-01')) as unread_count,
                (SELECT MAX(created_at) FROM group_messages WHERE group_id = gc.id AND deleted_at IS NULL) as last_message_at
            FROM group_chats gc
            JOIN group_members gm ON gc.id = gm.group_id
            ${whereClause}
            ORDER BY last_message_at DESC NULLS LAST, gc.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), offset]);

        res.json({ groups, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
        console.error('[group-chat] Get groups error:', error);
        res.status(500).json({ error: 'Failed to get groups' });
    }
});

/**
 * GET /api/group-chat/groups/:id
 * Get group details
 */
router.get('/groups/:id', authenticateToken, async (req, res) => {
    try {
        const groupId = req.params.id;
        const userId = req.user.id;

        // Check if user is member
        if (!await isMember(groupId, userId)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const group = await getGroupDetails(groupId);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Get members
        const [members] = await query(`
            SELECT 
                gm.*,
                u.display_name,
                u.email
            FROM group_members gm
            JOIN users u ON gm.user_id = u.id
            WHERE gm.group_id = ? AND gm.is_banned = FALSE
            ORDER BY gm.role, gm.joined_at
        `, [groupId]);

        // Get settings
        const [settings] = await query(
            'SELECT * FROM group_settings WHERE group_id = ?',
            [groupId]
        );

        res.json({ group, members, settings: settings[0] || {} });
    } catch (error) {
        console.error('[group-chat] Get group details error:', error);
        res.status(500).json({ error: 'Failed to get group details' });
    }
});

/**
 * PUT /api/group-chat/groups/:id
 * Update group details (admin only)
 */
router.put('/groups/:id', authenticateToken, async (req, res) => {
    try {
        const groupId = req.params.id;
        const userId = req.user.id;
        const { name, description, avatar_url, max_members } = req.body;

        // Check if user is admin
        if (!await hasRole(groupId, userId, ['admin'])) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const updates = [];
        const values = [];

        if (name) {
            updates.push('name = ?');
            values.push(name);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }
        if (avatar_url !== undefined) {
            updates.push('avatar_url = ?');
            values.push(avatar_url);
        }
        if (max_members) {
            updates.push('max_members = ?');
            values.push(max_members);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(groupId);
        await query(
            `UPDATE group_chats SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
            values
        );

        const group = await getGroupDetails(groupId);
        res.json({ group });
    } catch (error) {
        console.error('[group-chat] Update group error:', error);
        res.status(500).json({ error: 'Failed to update group' });
    }
});

/**
 * DELETE /api/group-chat/groups/:id
 * Delete group (soft delete, owner only)
 */
router.delete('/groups/:id', authenticateToken, async (req, res) => {
    try {
        const groupId = req.params.id;
        const userId = req.user.id;

        // Check if user is owner
        const [groups] = await query(
            'SELECT owner_id FROM group_chats WHERE id = ? AND deleted_at IS NULL',
            [groupId]
        );

        if (groups.length === 0) {
            return res.status(404).json({ error: 'Group not found' });
        }

        if (groups[0].owner_id !== userId) {
            return res.status(403).json({ error: 'Owner access required' });
        }

        // Soft delete
        await query(
            'UPDATE group_chats SET deleted_at = NOW() WHERE id = ?',
            [groupId]
        );

        res.json({ message: 'Group deleted successfully' });
    } catch (error) {
        console.error('[group-chat] Delete group error:', error);
        res.status(500).json({ error: 'Failed to delete group' });
    }
});

/**
 * POST /api/group-chat/groups/:id/invite
 * Invite user to group
 */
router.post('/groups/:id/invite', authenticateToken, async (req, res) => {
    try {
        const groupId = req.params.id;
        const userId = req.user.id;
        const { invitee_id, message } = req.body;

        if (!invitee_id) {
            return res.status(400).json({ error: 'Invitee user ID is required' });
        }

        // Check if user can invite
        const [settings] = await query(
            'SELECT allow_member_invite FROM group_settings WHERE group_id = ?',
            [groupId]
        );

        const canInvite = settings[0]?.allow_member_invite ||
            await hasRole(groupId, userId, ['admin', 'moderator']);

        if (!canInvite) {
            return res.status(403).json({ error: 'You cannot invite members to this group' });
        }

        // Check if invitee is already a member
        if (await isMember(groupId, invitee_id)) {
            return res.status(400).json({ error: 'User is already a member' });
        }

        // Create invitation
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        await query(`
            INSERT INTO group_invitations (group_id, inviter_id, invitee_id, message, expires_at)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                inviter_id = VALUES(inviter_id),
                message = VALUES(message),
                expires_at = VALUES(expires_at),
                status = 'pending',
                created_at = NOW()
        `, [groupId, userId, invitee_id, message || '', expiresAt]);

        res.json({ message: 'Invitation sent successfully' });
    } catch (error) {
        console.error('[group-chat] Invite error:', error);
        res.status(500).json({ error: 'Failed to send invitation' });
    }
});

/**
 * POST /api/group-chat/invitations/:id/respond
 * Accept or reject invitation
 */
router.post('/invitations/:id/respond', authenticateToken, async (req, res) => {
    try {
        const invitationId = req.params.id;
        const userId = req.user.id;
        const { accept } = req.body;

        // Get invitation
        const [invitations] = await query(`
            SELECT * FROM group_invitations 
            WHERE id = ? AND invitee_id = ? AND status = 'pending'
        `, [invitationId, userId]);

        if (invitations.length === 0) {
            return res.status(404).json({ error: 'Invitation not found' });
        }

        const invitation = invitations[0];

        // Check if expired
        if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
            await query(
                'UPDATE group_invitations SET status = ? WHERE id = ?',
                ['expired', invitationId]
            );
            return res.status(400).json({ error: 'Invitation has expired' });
        }

        if (accept) {
            // Add user to group
            await query(
                'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)',
                [invitation.group_id, userId, 'member']
            );

            await query(
                'UPDATE group_invitations SET status = ?, responded_at = NOW() WHERE id = ?',
                ['accepted', invitationId]
            );
        } else {
            await query(
                'UPDATE group_invitations SET status = ?, responded_at = NOW() WHERE id = ?',
                ['rejected', invitationId]
            );
        }

        res.json({ message: accept ? 'Invitation accepted' : 'Invitation rejected' });
    } catch (error) {
        console.error('[group-chat] Respond to invitation error:', error);
        res.status(500).json({ error: 'Failed to respond to invitation' });
    }
});

/**
 * POST /api/group-chat/groups/:id/join
 * Join public group or join with invite code
 */
router.post('/groups/:id/join', authenticateToken, async (req, res) => {
    try {
        const groupId = req.params.id;
        const userId = req.user.id;
        const { invite_code } = req.body;

        const [groups] = await query(
            'SELECT * FROM group_chats WHERE id = ? AND deleted_at IS NULL',
            [groupId]
        );

        if (groups.length === 0) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const group = groups[0];

        // Check if already a member
        if (await isMember(groupId, userId)) {
            return res.status(400).json({ error: 'Already a member' });
        }

        // Check if private group requires invite code
        if (group.is_private) {
            if (!invite_code || invite_code !== group.invite_code) {
                return res.status(403).json({ error: 'Invalid invite code' });
            }
        }

        // Check member limit
        const [memberCount] = await query(
            'SELECT COUNT(*) as count FROM group_members WHERE group_id = ? AND is_banned = FALSE',
            [groupId]
        );

        if (memberCount[0].count >= group.max_members) {
            return res.status(400).json({ error: 'Group is full' });
        }

        // Add user to group
        await query(
            'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)',
            [groupId, userId, 'member']
        );

        res.json({ message: 'Joined group successfully' });
    } catch (error) {
        console.error('[group-chat] Join group error:', error);
        res.status(500).json({ error: 'Failed to join group' });
    }
});

/**
 * POST /api/group-chat/groups/:id/leave
 * Leave group
 */
router.post('/groups/:id/leave', authenticateToken, async (req, res) => {
    try {
        const groupId = req.params.id;
        const userId = req.user.id;

        // Check if user is owner
        const [groups] = await query(
            'SELECT owner_id FROM group_chats WHERE id = ?',
            [groupId]
        );

        if (groups.length > 0 && groups[0].owner_id === userId) {
            return res.status(400).json({ error: 'Owner cannot leave. Transfer ownership or delete group first.' });
        }

        // Remove user from group
        await query(
            'DELETE FROM group_members WHERE group_id = ? AND user_id = ?',
            [groupId, userId]
        );

        res.json({ message: 'Left group successfully' });
    } catch (error) {
        console.error('[group-chat] Leave group error:', error);
        res.status(500).json({ error: 'Failed to leave group' });
    }
});

/**
 * DELETE /api/group-chat/groups/:id/members/:userId
 * Kick member (admin/moderator only)
 */
router.delete('/groups/:id/members/:userId', authenticateToken, async (req, res) => {
    try {
        const groupId = req.params.id;
        const kickUserId = parseInt(req.params.userId);
        const actorId = req.user.id;

        // Check if actor has permission
        if (!await hasRole(groupId, actorId, ['admin', 'moderator'])) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        // Cannot kick owner
        const [groups] = await query(
            'SELECT owner_id FROM group_chats WHERE id = ?',
            [groupId]
        );

        if (groups[0]?.owner_id === kickUserId) {
            return res.status(400).json({ error: 'Cannot kick group owner' });
        }

        // Remove member
        await query(
            'DELETE FROM group_members WHERE group_id = ? AND user_id = ?',
            [groupId, kickUserId]
        );

        res.json({ message: 'Member removed successfully' });
    } catch (error) {
        console.error('[group-chat] Kick member error:', error);
        res.status(500).json({ error: 'Failed to remove member' });
    }
});

/**
 * PUT /api/group-chat/groups/:id/members/:userId/role
 * Change member role (admin only)
 */
router.put('/groups/:id/members/:userId/role', authenticateToken, async (req, res) => {
    try {
        const groupId = req.params.id;
        const targetUserId = parseInt(req.params.userId);
        const actorId = req.user.id;
        const { role } = req.body;

        if (!['admin', 'moderator', 'member'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        // Check if actor is admin
        if (!await hasRole(groupId, actorId, ['admin'])) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        // Cannot change owner's role
        const [groups] = await query(
            'SELECT owner_id FROM group_chats WHERE id = ?',
            [groupId]
        );

        if (groups[0]?.owner_id === targetUserId) {
            return res.status(400).json({ error: 'Cannot change owner role' });
        }

        // Update role
        await query(
            'UPDATE group_members SET role = ? WHERE group_id = ? AND user_id = ?',
            [role, groupId, targetUserId]
        );

        res.json({ message: 'Role updated successfully' });
    } catch (error) {
        console.error('[group-chat] Update role error:', error);
        res.status(500).json({ error: 'Failed to update role' });
    }
});

/**
 * PUT /api/group-chat/groups/:id/settings
 * Update group settings (admin only)
 */
router.put('/groups/:id/settings', authenticateToken, async (req, res) => {
    try {
        const groupId = req.params.id;
        const userId = req.user.id;
        const {
            allow_member_invite,
            require_approval,
            message_retention_days,
            max_message_length,
            allow_file_upload,
            allowed_file_types,
            max_file_size_mb
        } = req.body;

        // Check if user is admin
        if (!await hasRole(groupId, userId, ['admin'])) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const updates = [];
        const values = [];

        if (allow_member_invite !== undefined) {
            updates.push('allow_member_invite = ?');
            values.push(allow_member_invite);
        }
        if (require_approval !== undefined) {
            updates.push('require_approval = ?');
            values.push(require_approval);
        }
        if (message_retention_days !== undefined) {
            updates.push('message_retention_days = ?');
            values.push(message_retention_days);
        }
        if (max_message_length !== undefined) {
            updates.push('max_message_length = ?');
            values.push(max_message_length);
        }
        if (allow_file_upload !== undefined) {
            updates.push('allow_file_upload = ?');
            values.push(allow_file_upload);
        }
        if (allowed_file_types !== undefined) {
            updates.push('allowed_file_types = ?');
            values.push(allowed_file_types);
        }
        if (max_file_size_mb !== undefined) {
            updates.push('max_file_size_mb = ?');
            values.push(max_file_size_mb);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(groupId);
        await query(
            `UPDATE group_settings SET ${updates.join(', ')}, updated_at = NOW() WHERE group_id = ?`,
            values
        );

        const [settings] = await query(
            'SELECT * FROM group_settings WHERE group_id = ?',
            [groupId]
        );

        res.json({ settings: settings[0] });
    } catch (error) {
        console.error('[group-chat] Update settings error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

/**
 * GET /api/group-chat/groups/:id/messages
 * Get group messages with pagination
 */
router.get('/groups/:id/messages', authenticateToken, async (req, res) => {
    try {
        const groupId = req.params.id;
        const userId = req.user.id;
        const { page = 1, limit = 50, before } = req.query;

        // Check if user is member
        if (!await isMember(groupId, userId)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        let whereClause = 'WHERE gm.group_id = ? AND gm.deleted_at IS NULL';
        const params = [groupId];

        if (before) {
            whereClause += ' AND gm.created_at < ?';
            params.push(new Date(before));
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);
        params.push(parseInt(limit), offset);

        const [messages] = await query(`
            SELECT 
                gm.*,
                u.display_name as sender_name,
                u.email as sender_email,
                (SELECT COUNT(*) FROM group_message_reads WHERE message_id = gm.id) as read_count
            FROM group_messages gm
            JOIN users u ON gm.user_id = u.id
            ${whereClause}
            ORDER BY gm.created_at DESC
            LIMIT ? OFFSET ?
        `, params);

        // Update last_read_at
        await query(
            'UPDATE group_members SET last_read_at = NOW() WHERE group_id = ? AND user_id = ?',
            [groupId, userId]
        );

        res.json({
            messages: messages.reverse(), // Return in chronological order
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        console.error('[group-chat] Get messages error:', error);
        res.status(500).json({ error: 'Failed to get messages' });
    }
});

/**
 * POST /api/group-chat/groups/:id/messages
 * Send message to group
 */
router.post('/groups/:id/messages', authenticateToken, async (req, res) => {
    try {
        const groupId = req.params.id;
        const userId = req.user.id;
        const { content, message_type = 'text', file_url, file_name, file_size, reply_to } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Message content is required' });
        }

        // Check if user is member
        if (!await isMember(groupId, userId)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Check message length
        const [settings] = await query(
            'SELECT max_message_length FROM group_settings WHERE group_id = ?',
            [groupId]
        );

        const maxLength = settings[0]?.max_message_length || 5000;
        if (content.length > maxLength) {
            return res.status(400).json({ error: `Message too long (max ${maxLength} characters)` });
        }

        // Insert message
        const [result] = await query(`
            INSERT INTO group_messages (group_id, user_id, content, message_type, file_url, file_name, file_size, reply_to)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [groupId, userId, content, message_type, file_url || null, file_name || null, file_size || null, reply_to || null]);

        const messageId = result.insertId;

        // Get created message
        const [messages] = await query(`
            SELECT 
                gm.*,
                u.display_name as sender_name,
                u.email as sender_email
            FROM group_messages gm
            JOIN users u ON gm.user_id = u.id
            WHERE gm.id = ?
        `, [messageId]);

        res.status(201).json({ message: messages[0] });
    } catch (error) {
        console.error('[group-chat] Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

/**
 * DELETE /api/group-chat/messages/:id
 * Delete message (author or admin/moderator)
 */
router.delete('/messages/:id', authenticateToken, async (req, res) => {
    try {
        const messageId = req.params.id;
        const userId = req.user.id;

        // Get message
        const [messages] = await query(
            'SELECT * FROM group_messages WHERE id = ? AND deleted_at IS NULL',
            [messageId]
        );

        if (messages.length === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }

        const message = messages[0];

        // Check permission
        const isAuthor = message.user_id === userId;
        const isAdmin = await hasRole(message.group_id, userId, ['admin', 'moderator']);

        if (!isAuthor && !isAdmin) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        // Soft delete
        await query(
            'UPDATE group_messages SET deleted_at = NOW() WHERE id = ?',
            [messageId]
        );

        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('[group-chat] Delete message error:', error);
        res.status(500).json({ error: 'Failed to delete message' });
    }
});

/**
 * GET /api/group-chat/search
 * Search for public groups
 */
router.get('/search', authenticateToken, async (req, res) => {
    try {
        const { q, page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        if (!q || q.trim().length === 0) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const searchPattern = `%${q}%`;

        const [groups] = await query(`
            SELECT 
                gc.*,
                (SELECT COUNT(*) FROM group_members WHERE group_id = gc.id AND is_banned = FALSE) as member_count
            FROM group_chats gc
            WHERE gc.deleted_at IS NULL 
              AND gc.is_private = FALSE
              AND (gc.name LIKE ? OR gc.description LIKE ?)
            ORDER BY member_count DESC, gc.created_at DESC
            LIMIT ? OFFSET ?
        `, [searchPattern, searchPattern, parseInt(limit), offset]);

        res.json({ groups, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
        console.error('[group-chat] Search groups error:', error);
        res.status(500).json({ error: 'Failed to search groups' });
    }
});

export default router;

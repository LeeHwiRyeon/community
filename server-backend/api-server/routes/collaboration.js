const express = require('express');
const router = express.Router();
const collaborationService = require('../services/collaborationService');
const logger = require('../utils/logger');

// Get room statistics
router.get('/rooms/:roomId/stats', (req, res) => {
    try {
        const { roomId } = req.params;
        const stats = collaborationService.getRoomStats(roomId);

        if (!stats) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Error getting room stats:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get all rooms statistics
router.get('/rooms/stats', (req, res) => {
    try {
        const stats = collaborationService.getAllRoomsStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Error getting all rooms stats:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Create a new collaboration room
router.post('/rooms', (req, res) => {
    try {
        const { roomId, userId, documentContent = '' } = req.body;

        if (!roomId || !userId) {
            return res.status(400).json({
                success: false,
                message: 'Room ID and User ID are required'
            });
        }

        // Initialize room if it doesn't exist
        if (!collaborationService.rooms.has(roomId)) {
            collaborationService.rooms.set(roomId, new Set());
            collaborationService.documentStates.set(roomId, {
                content: documentContent,
                version: 0,
                lastModified: Date.now(),
                lastModifiedBy: userId
            });
            collaborationService.cursors.set(roomId, new Map());
        }

        res.json({
            success: true,
            message: 'Room created successfully',
            data: {
                roomId,
                stats: collaborationService.getRoomStats(roomId)
            }
        });
    } catch (error) {
        logger.error('Error creating room:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Delete a collaboration room
router.delete('/rooms/:roomId', (req, res) => {
    try {
        const { roomId } = req.params;

        if (!collaborationService.rooms.has(roomId)) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Remove all clients from room
        const room = collaborationService.rooms.get(roomId);
        room.forEach(client => {
            if (client.ws.readyState === 1) { // WebSocket.OPEN
                client.ws.close(1000, 'Room deleted');
            }
        });

        // Clean up room data
        collaborationService.rooms.delete(roomId);
        collaborationService.documentStates.delete(roomId);
        collaborationService.cursors.delete(roomId);

        res.json({
            success: true,
            message: 'Room deleted successfully'
        });
    } catch (error) {
        logger.error('Error deleting room:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get document state
router.get('/rooms/:roomId/document', (req, res) => {
    try {
        const { roomId } = req.params;
        const documentState = collaborationService.documentStates.get(roomId);

        if (!documentState) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        res.json({
            success: true,
            data: documentState
        });
    } catch (error) {
        logger.error('Error getting document state:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Update document state (for manual updates)
router.put('/rooms/:roomId/document', (req, res) => {
    try {
        const { roomId } = req.params;
        const { content, userId } = req.body;

        if (!content || !userId) {
            return res.status(400).json({
                success: false,
                message: 'Content and User ID are required'
            });
        }

        const documentState = collaborationService.documentStates.get(roomId);
        if (!documentState) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Update document state
        documentState.content = content;
        documentState.version += 1;
        documentState.lastModified = Date.now();
        documentState.lastModifiedBy = userId;

        // Broadcast changes to all clients in room
        collaborationService.broadcastToRoom(roomId, {
            type: 'document_changed',
            changes: { content },
            version: documentState.version,
            userId,
            timestamp: Date.now()
        });

        res.json({
            success: true,
            message: 'Document updated successfully',
            data: documentState
        });
    } catch (error) {
        logger.error('Error updating document:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get active users in room
router.get('/rooms/:roomId/users', (req, res) => {
    try {
        const { roomId } = req.params;
        const stats = collaborationService.getRoomStats(roomId);

        if (!stats) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        res.json({
            success: true,
            data: {
                users: stats.users,
                userCount: stats.userCount
            }
        });
    } catch (error) {
        logger.error('Error getting room users:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get cursor positions in room
router.get('/rooms/:roomId/cursors', (req, res) => {
    try {
        const { roomId } = req.params;
        const stats = collaborationService.getRoomStats(roomId);

        if (!stats) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        res.json({
            success: true,
            data: {
                cursors: stats.cursors
            }
        });
    } catch (error) {
        logger.error('Error getting room cursors:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Health check for collaboration service
router.get('/health', (req, res) => {
    try {
        const totalRooms = collaborationService.rooms.size;
        const totalClients = collaborationService.clients.size;

        res.json({
            success: true,
            data: {
                status: 'healthy',
                totalRooms,
                totalClients,
                timestamp: Date.now()
            }
        });
    } catch (error) {
        logger.error('Error checking collaboration health:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;

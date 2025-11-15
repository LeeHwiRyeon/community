const WebSocket = require('ws');
const EventEmitter = require('events');
const jwt = require('jsonwebtoken');

class CollaborationService extends EventEmitter {
    constructor() {
        super();
        this.wss = null;
        this.rooms = new Map(); // roomId -> Set of clients
        this.clients = new Map(); // clientId -> client info
        this.documentStates = new Map(); // roomId -> document state
        this.cursors = new Map(); // roomId -> Map of userId -> cursor position
    }

    initialize(server) {
        this.wss = new WebSocket.Server({
            server,
            path: '/ws/collaboration',
            verifyClient: this.verifyClient.bind(this)
        });

        this.wss.on('connection', this.handleConnection.bind(this));
        console.log('Collaboration WebSocket server initialized');
    }

    verifyClient(info) {
        // JWT 토큰 검증
        try {
            const url = new URL(info.req.url, 'http://localhost');
            const token = url.searchParams.get('token');

            if (!token) {
                return false;
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            info.req.userId = decoded.userId;
            return true;
        } catch (error) {
            console.error('WebSocket token verification failed:', error.message);
            return false;
        }
    }

    handleConnection(ws, req) {
        const clientId = this.generateClientId();
        const client = {
            id: clientId,
            ws,
            userId: null,
            roomId: null,
            isAlive: true
        };

        this.clients.set(clientId, client);
        ws.clientId = clientId;

        // Heartbeat mechanism
        ws.on('pong', () => {
            client.isAlive = true;
        });

        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                this.handleMessage(client, message);
            } catch (error) {
                console.error('Error parsing message:', error);
                this.sendError(ws, 'Invalid message format');
            }
        });

        ws.on('close', () => {
            this.handleDisconnection(client);
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
            this.handleDisconnection(client);
        });

        this.sendMessage(ws, {
            type: 'connected',
            clientId,
            timestamp: Date.now()
        });
    }

    handleMessage(client, message) {
        switch (message.type) {
            case 'join_room':
                this.handleJoinRoom(client, message);
                break;
            case 'leave_room':
                this.handleLeaveRoom(client, message);
                break;
            case 'document_change':
                this.handleDocumentChange(client, message);
                break;
            case 'cursor_move':
                this.handleCursorMove(client, message);
                break;
            case 'user_typing':
                this.handleUserTyping(client, message);
                break;
            case 'ping':
                this.handlePing(client, message);
                break;
            default:
                console.warn('Unknown message type:', message.type);
        }
    }

    handleJoinRoom(client, message) {
        const { roomId, userId } = message;

        if (!roomId || !userId) {
            this.sendError(client.ws, 'Room ID and User ID are required');
            return;
        }

        // Leave previous room if any
        if (client.roomId) {
            this.handleLeaveRoom(client, { roomId: client.roomId });
        }

        client.roomId = roomId;
        client.userId = userId;

        // Add client to room
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Set());
        }
        this.rooms.get(roomId).add(client);

        // Initialize document state if not exists
        if (!this.documentStates.has(roomId)) {
            this.documentStates.set(roomId, {
                content: '',
                version: 0,
                lastModified: Date.now(),
                lastModifiedBy: userId
            });
        }

        // Initialize cursors for room if not exists
        if (!this.cursors.has(roomId)) {
            this.cursors.set(roomId, new Map());
        }

        // Send current document state to new client
        this.sendMessage(client.ws, {
            type: 'document_state',
            roomId,
            state: this.documentStates.get(roomId)
        });

        // Notify other clients in room
        this.broadcastToRoom(roomId, {
            type: 'user_joined',
            userId,
            clientId: client.id,
            timestamp: Date.now()
        }, client.id);

        console.log(`User ${userId} joined room ${roomId}`);
    }

    handleLeaveRoom(client, message) {
        const { roomId } = message;
        const actualRoomId = roomId || client.roomId;

        if (!actualRoomId || !client.roomId) return;

        if (this.rooms.has(actualRoomId)) {
            this.rooms.get(actualRoomId).delete(client);

            // Remove room if empty
            if (this.rooms.get(actualRoomId).size === 0) {
                this.rooms.delete(actualRoomId);
                this.documentStates.delete(actualRoomId);
                this.cursors.delete(actualRoomId);
            } else {
                // Notify other clients
                this.broadcastToRoom(actualRoomId, {
                    type: 'user_left',
                    userId: client.userId,
                    clientId: client.id,
                    timestamp: Date.now()
                }, client.id);

                // Remove user's cursor
                if (this.cursors.has(actualRoomId)) {
                    this.cursors.get(actualRoomId).delete(client.userId);
                }
            }
        }

        client.roomId = null;
        client.userId = null;

        console.log(`User left room ${actualRoomId}`);
    }

    handleDocumentChange(client, message) {
        const { roomId, changes, version } = message;

        if (!roomId || !client.roomId || roomId !== client.roomId) {
            this.sendError(client.ws, 'Invalid room or not in room');
            return;
        }

        const currentState = this.documentStates.get(roomId);
        if (!currentState) {
            this.sendError(client.ws, 'Room not found');
            return;
        }

        // Simple conflict resolution - accept changes if version matches
        if (version !== currentState.version) {
            this.sendError(client.ws, 'Version conflict');
            return;
        }

        // Apply changes (simplified - in real implementation, use Operational Transform)
        currentState.content = changes.content || currentState.content;
        currentState.version += 1;
        currentState.lastModified = Date.now();
        currentState.lastModifiedBy = client.userId;

        // Broadcast changes to other clients in room
        this.broadcastToRoom(roomId, {
            type: 'document_changed',
            changes,
            version: currentState.version,
            userId: client.userId,
            timestamp: Date.now()
        }, client.id);

        console.log(`Document changed in room ${roomId} by user ${client.userId}`);
    }

    handleCursorMove(client, message) {
        const { roomId, position } = message;

        if (!roomId || !client.roomId || roomId !== client.roomId) {
            return;
        }

        if (this.cursors.has(roomId)) {
            this.cursors.get(roomId).set(client.userId, {
                position,
                timestamp: Date.now()
            });

            // Broadcast cursor position to other clients
            this.broadcastToRoom(roomId, {
                type: 'cursor_moved',
                userId: client.userId,
                position,
                timestamp: Date.now()
            }, client.id);
        }
    }

    handleUserTyping(client, message) {
        const { roomId, isTyping } = message;

        if (!roomId || !client.roomId || roomId !== client.roomId) {
            return;
        }

        // Broadcast typing status to other clients
        this.broadcastToRoom(roomId, {
            type: 'user_typing',
            userId: client.userId,
            isTyping,
            timestamp: Date.now()
        }, client.id);
    }

    handlePing(client, message) {
        this.sendMessage(client.ws, {
            type: 'pong',
            timestamp: Date.now()
        });
    }

    handleDisconnection(client) {
        if (client.roomId) {
            this.handleLeaveRoom(client, { roomId: client.roomId });
        }
        this.clients.delete(client.id);
        console.log(`Client ${client.id} disconnected`);
    }

    broadcastToRoom(roomId, message, excludeClientId = null) {
        if (!this.rooms.has(roomId)) return;

        const room = this.rooms.get(roomId);
        room.forEach(client => {
            if (excludeClientId && client.id === excludeClientId) return;
            if (client.ws.readyState === WebSocket.OPEN) {
                this.sendMessage(client.ws, message);
            }
        });
    }

    sendMessage(ws, message) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }

    sendError(ws, error) {
        this.sendMessage(ws, {
            type: 'error',
            error,
            timestamp: Date.now()
        });
    }

    generateClientId() {
        return 'client_' + Math.random().toString(36).substr(2, 9);
    }

    // Heartbeat mechanism
    startHeartbeat() {
        setInterval(() => {
            this.wss.clients.forEach(ws => {
                const client = this.clients.get(ws.clientId);
                if (!client) return;

                if (!client.isAlive) {
                    ws.terminate();
                    return;
                }

                client.isAlive = false;
                ws.ping();
            });
        }, 30000); // 30 seconds
    }

    // Get room statistics
    getRoomStats(roomId) {
        if (!this.rooms.has(roomId)) return null;

        const room = this.rooms.get(roomId);
        const cursors = this.cursors.get(roomId) || new Map();
        const documentState = this.documentStates.get(roomId);

        return {
            roomId,
            userCount: room.size,
            users: Array.from(room).map(client => ({
                userId: client.userId,
                clientId: client.id,
                isOnline: client.ws.readyState === WebSocket.OPEN
            })),
            cursors: Array.from(cursors.entries()).map(([userId, cursor]) => ({
                userId,
                position: cursor.position,
                timestamp: cursor.timestamp
            })),
            document: documentState ? {
                version: documentState.version,
                lastModified: documentState.lastModified,
                lastModifiedBy: documentState.lastModifiedBy
            } : null
        };
    }

    // Get all rooms statistics
    getAllRoomsStats() {
        const stats = {};
        for (const roomId of this.rooms.keys()) {
            stats[roomId] = this.getRoomStats(roomId);
        }
        return stats;
    }
}

module.exports = new CollaborationService();

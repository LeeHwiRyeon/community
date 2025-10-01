const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

class ChatService {
    constructor(server) {
        this.io = new Server(server, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:5000",
                methods: ["GET", "POST"]
            }
        });

        this.rooms = new Map(); // roomId -> Set of userIds
        this.users = new Map(); // userId -> user info
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`사용자 연결: ${socket.id}`);

            // 사용자 인증
            socket.on('authenticate', (data) => {
                try {
                    const decoded = jwt.verify(data.token, process.env.JWT_SECRET);
                    this.users.set(socket.id, {
                        id: decoded.userId,
                        name: decoded.name,
                        avatar: decoded.avatar,
                        socketId: socket.id
                    });
                    socket.emit('authenticated', { success: true });
                } catch (error) {
                    socket.emit('authenticated', { success: false, error: 'Invalid token' });
                }
            });

            // 방 참가
            socket.on('joinRoom', (data) => {
                const { roomId } = data;
                const user = this.users.get(socket.id);

                if (!user) {
                    socket.emit('error', { message: '인증이 필요합니다.' });
                    return;
                }

                socket.join(roomId);

                // 방에 사용자 추가
                if (!this.rooms.has(roomId)) {
                    this.rooms.set(roomId, new Set());
                }
                this.rooms.get(roomId).add(socket.id);

                // 다른 사용자들에게 사용자 입장 알림
                socket.to(roomId).emit('userJoined', {
                    id: user.id,
                    name: user.name,
                    avatar: user.avatar,
                    isOnline: true
                });

                // 현재 온라인 사용자 목록 전송
                const onlineUsers = Array.from(this.rooms.get(roomId))
                    .map(socketId => {
                        const user = this.users.get(socketId);
                        return user ? {
                            id: user.id,
                            name: user.name,
                            avatar: user.avatar,
                            isOnline: true
                        } : null;
                    })
                    .filter(Boolean);

                socket.emit('onlineUsers', onlineUsers);
                socket.to(roomId).emit('onlineUsers', onlineUsers);

                console.log(`${user.name}님이 방 ${roomId}에 참가했습니다.`);
            });

            // 메시지 전송
            socket.on('message', (data) => {
                const user = this.users.get(socket.id);
                if (!user) return;

                const message = {
                    id: Date.now().toString(),
                    content: data.content,
                    sender: user.name,
                    timestamp: new Date(),
                    type: data.type || 'text',
                    isOwn: false
                };

                // 같은 방의 모든 사용자에게 메시지 전송
                socket.to(data.roomId).emit('message', message);

                console.log(`메시지 전송: ${user.name} -> ${data.roomId}`);
            });

            // 방 나가기
            socket.on('leaveRoom', (data) => {
                const { roomId } = data;
                const user = this.users.get(socket.id);

                if (user) {
                    socket.leave(roomId);

                    // 방에서 사용자 제거
                    if (this.rooms.has(roomId)) {
                        this.rooms.get(roomId).delete(socket.id);

                        // 다른 사용자들에게 사용자 퇴장 알림
                        socket.to(roomId).emit('userLeft', user.id);

                        // 온라인 사용자 목록 업데이트
                        const onlineUsers = Array.from(this.rooms.get(roomId))
                            .map(socketId => {
                                const user = this.users.get(socketId);
                                return user ? {
                                    id: user.id,
                                    name: user.name,
                                    avatar: user.avatar,
                                    isOnline: true
                                } : null;
                            })
                            .filter(Boolean);

                        socket.to(roomId).emit('onlineUsers', onlineUsers);
                    }

                    console.log(`${user.name}님이 방 ${roomId}에서 나갔습니다.`);
                }
            });

            // 연결 해제
            socket.on('disconnect', () => {
                const user = this.users.get(socket.id);
                if (user) {
                    // 모든 방에서 사용자 제거
                    for (const [roomId, users] of this.rooms.entries()) {
                        if (users.has(socket.id)) {
                            users.delete(socket.id);
                            socket.to(roomId).emit('userLeft', user.id);

                            // 온라인 사용자 목록 업데이트
                            const onlineUsers = Array.from(users)
                                .map(socketId => {
                                    const user = this.users.get(socketId);
                                    return user ? {
                                        id: user.id,
                                        name: user.name,
                                        avatar: user.avatar,
                                        isOnline: true
                                    } : null;
                                })
                                .filter(Boolean);

                            socket.to(roomId).emit('onlineUsers', onlineUsers);
                        }
                    }

                    this.users.delete(socket.id);
                    console.log(`${user.name}님이 연결을 해제했습니다.`);
                }
            });
        });
    }

    // 방 생성
    createRoom(roomId, creatorId) {
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Set());
            console.log(`방 ${roomId}이 생성되었습니다.`);
            return true;
        }
        return false;
    }

    // 방 삭제
    deleteRoom(roomId) {
        if (this.rooms.has(roomId)) {
            this.rooms.delete(roomId);
            console.log(`방 ${roomId}이 삭제되었습니다.`);
            return true;
        }
        return false;
    }

    // 방 목록 조회
    getRooms() {
        return Array.from(this.rooms.keys());
    }

    // 방의 사용자 수 조회
    getRoomUserCount(roomId) {
        return this.rooms.has(roomId) ? this.rooms.get(roomId).size : 0;
    }

    // 전체 사용자 수 조회
    getTotalUsers() {
        return this.users.size;
    }

    // 서버 상태 조회
    getStatus() {
        return {
            totalUsers: this.getTotalUsers(),
            totalRooms: this.rooms.size,
            rooms: this.getRooms().map(roomId => ({
                id: roomId,
                userCount: this.getRoomUserCount(roomId)
            }))
        };
    }
}

module.exports = ChatService;

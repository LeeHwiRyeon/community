const io = require('socket.io-client');
const { createServer } = require('http');
const { Server } = require('socket.io');
const ChatService = require('../../server-backend/src/chat/chatService');

describe('WebSocket Integration Tests', () => {
    let httpServer;
    let chatService;
    let client1;
    let client2;
    let port;

    beforeAll((done) => {
        // Create HTTP server
        httpServer = createServer();
        port = 50001; // Use different port for testing

        // Initialize chat service
        chatService = new ChatService(httpServer);

        // Start server
        httpServer.listen(port, () => {
            done();
        });
    });

    afterAll((done) => {
        if (httpServer) {
            httpServer.close(done);
        }
    });

    beforeEach((done) => {
        // Create test clients
        client1 = io(`http://localhost:${port}`, {
            auth: {
                token: 'test-token-1'
            }
        });

        client2 = io(`http://localhost:${port}`, {
            auth: {
                token: 'test-token-2'
            }
        });

        // Wait for connections
        client1.on('connect', () => {
            client2.on('connect', () => {
                done();
            });
        });
    });

    afterEach((done) => {
        if (client1) client1.disconnect();
        if (client2) client2.disconnect();
        done();
    });

    describe('Connection Management', () => {
        test('should connect clients successfully', (done) => {
            expect(client1.connected).toBe(true);
            expect(client2.connected).toBe(true);
            done();
        });

        test('should handle disconnection', (done) => {
            client1.on('disconnect', () => {
                expect(client1.connected).toBe(false);
                done();
            });

            client1.disconnect();
        });
    });

    describe('Room Management', () => {
        test('should join room successfully', (done) => {
            const roomId = 'test-room';

            client1.emit('joinRoom', { roomId });

            client1.on('onlineUsers', (users) => {
                expect(Array.isArray(users)).toBe(true);
                done();
            });
        });

        test('should notify when user joins room', (done) => {
            const roomId = 'test-room';

            client1.emit('joinRoom', { roomId });

            client2.on('userJoined', (user) => {
                expect(user).toBeDefined();
                done();
            });

            client2.emit('joinRoom', { roomId });
        });

        test('should notify when user leaves room', (done) => {
            const roomId = 'test-room';

            client1.emit('joinRoom', { roomId });
            client2.emit('joinRoom', { roomId });

            client2.on('userLeft', (userId) => {
                expect(userId).toBeDefined();
                done();
            });

            client1.emit('leaveRoom', { roomId });
        });
    });

    describe('Message Broadcasting', () => {
        test('should broadcast messages to room', (done) => {
            const roomId = 'test-room';
            const message = {
                content: 'Test message',
                roomId: roomId,
                type: 'text'
            };

            client1.emit('joinRoom', { roomId });
            client2.emit('joinRoom', { roomId });

            client2.on('message', (receivedMessage) => {
                expect(receivedMessage.content).toBe(message.content);
                expect(receivedMessage.type).toBe(message.type);
                done();
            });

            client1.emit('message', message);
        });

        test('should not receive messages from different room', (done) => {
            const room1 = 'room-1';
            const room2 = 'room-2';
            const message = {
                content: 'Test message',
                roomId: room1,
                type: 'text'
            };

            client1.emit('joinRoom', { roomId: room1 });
            client2.emit('joinRoom', { roomId: room2 });

            let messageReceived = false;
            client2.on('message', () => {
                messageReceived = true;
            });

            client1.emit('message', message);

            // Wait a bit to ensure no message is received
            setTimeout(() => {
                expect(messageReceived).toBe(false);
                done();
            }, 100);
        });
    });

    describe('Error Handling', () => {
        test('should handle invalid room operations', (done) => {
            client1.on('error', (error) => {
                expect(error).toBeDefined();
                done();
            });

            // Try to join room without proper authentication
            client1.emit('joinRoom', { roomId: 'test-room' });
        });

        test('should handle message errors', (done) => {
            client1.on('error', (error) => {
                expect(error).toBeDefined();
                done();
            });

            // Try to send message without joining room
            client1.emit('message', {
                content: 'Test message',
                roomId: 'test-room',
                type: 'text'
            });
        });
    });

    describe('Performance Tests', () => {
        test('should handle multiple concurrent connections', (done) => {
            const connections = [];
            const connectionCount = 10;
            let connectedCount = 0;

            for (let i = 0; i < connectionCount; i++) {
                const client = io(`http://localhost:${port}`, {
                    auth: {
                        token: `test-token-${i}`
                    }
                });

                client.on('connect', () => {
                    connectedCount++;
                    if (connectedCount === connectionCount) {
                        // Clean up connections
                        connections.forEach(conn => conn.disconnect());
                        expect(connectedCount).toBe(connectionCount);
                        done();
                    }
                });

                connections.push(client);
            }
        });

        test('should handle rapid message sending', (done) => {
            const roomId = 'performance-test-room';
            const messageCount = 100;
            let receivedCount = 0;

            client1.emit('joinRoom', { roomId });
            client2.emit('joinRoom', { roomId });

            client2.on('message', () => {
                receivedCount++;
                if (receivedCount === messageCount) {
                    expect(receivedCount).toBe(messageCount);
                    done();
                }
            });

            // Send messages rapidly
            for (let i = 0; i < messageCount; i++) {
                client1.emit('message', {
                    content: `Message ${i}`,
                    roomId: roomId,
                    type: 'text'
                });
            }
        });
    });
});

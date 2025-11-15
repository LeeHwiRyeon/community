/**
 * 암호화 채팅 사용 예제
 * 
 * MessageEncryptionV2 및 EncryptedChatService 사용법
 */

import { EncryptedChatService } from '../services/EncryptedChatService';
import { MessageEncryptionV2 } from '../utils/MessageEncryptionV2';
import { KeyExchange } from '../utils/KeyExchange';

/**
 * 예제 1: PBKDF2 방식 (비밀번호 기반)
 * 
 * 사용 시나리오:
 * - 개인 채팅방
 * - 그룹 채팅방 (공유 비밀번호)
 * - 단순한 암호화 필요 시
 */
async function example1_PBKDF2() {
    console.log('=== 예제 1: PBKDF2 방식 ===\n');

    // 1. 서비스 초기화
    const chatService = new EncryptedChatService();

    // 2. 마스터 키 설정 (사용자 비밀번호 또는 PIN)
    await chatService.setMasterKey('my-secure-password-123');

    // 3. 채팅방 암호화 초기화
    const roomId = 'room-12345';
    await chatService.initializeRoomEncryption(roomId);

    // 4. 메시지 암호화 및 전송
    const encrypted = await chatService.encryptAndSendMessage(
        'Hello, this is a secret message!',
        roomId,
        'user-001',
        'Alice'
    );

    console.log('암호화된 메시지:', encrypted);

    // 5. 메시지 수신 및 복호화
    const decrypted = await chatService.receiveAndDecryptMessage(encrypted);

    console.log('복호화된 메시지:', decrypted);
    console.log('내용:', decrypted.content);

    // 6. 무결성 검증
    const isValid = await chatService.verifyMessageIntegrity(encrypted);
    console.log('무결성 검증:', isValid ? '✅ 통과' : '❌ 실패');
}

/**
 * 예제 2: ECDH 방식 (키 교환)
 * 
 * 사용 시나리오:
 * - 1:1 채팅 (엔드투엔드 암호화)
 * - 비밀번호 없이 안전한 통신
 * - Forward secrecy 필요 시
 */
async function example2_ECDH() {
    console.log('\n=== 예제 2: ECDH 방식 ===\n');

    // Alice와 Bob의 서비스
    const aliceChatService = new EncryptedChatService();
    const bobChatService = new EncryptedChatService();

    const roomId = 'private-room-alice-bob';

    // 1. Alice: 키 교환 시작
    const alicePublicKey = await aliceChatService.startKeyExchange(roomId);
    console.log('Alice 공개키 생성:', alicePublicKey);

    // 2. Bob: 키 교환 시작
    const bobPublicKey = await bobChatService.startKeyExchange(roomId);
    console.log('Bob 공개키 생성:', bobPublicKey);

    // 3. 공개키 교환 (서버를 통해 전송된다고 가정)
    await aliceChatService.completeKeyExchange(roomId, bobPublicKey);
    await bobChatService.completeKeyExchange(roomId, alicePublicKey);

    console.log('✅ 키 교환 완료\n');

    // 4. Alice가 메시지 전송
    const aliceMessage = await aliceChatService.encryptAndSendMessage(
        'Hi Bob! This is encrypted with ECDH.',
        roomId,
        'alice',
        'Alice'
    );

    // 5. Bob이 메시지 수신 및 복호화
    const bobReceived = await bobChatService.receiveAndDecryptMessage(aliceMessage);
    console.log('Bob이 받은 메시지:', bobReceived.content);

    // 6. Bob이 답장
    const bobMessage = await bobChatService.encryptAndSendMessage(
        'Hi Alice! I can read your message!',
        roomId,
        'bob',
        'Bob'
    );

    // 7. Alice가 답장 수신
    const aliceReceived = await aliceChatService.receiveAndDecryptMessage(bobMessage);
    console.log('Alice가 받은 메시지:', aliceReceived.content);
}

/**
 * 예제 3: 실전 통합 (React 컴포넌트에서 사용)
 */
class ChatComponent {
    private chatService: EncryptedChatService;
    private currentRoomId: string = '';

    constructor() {
        this.chatService = new EncryptedChatService();
    }

    // 로그인 시 마스터 키 설정
    async onLogin(password: string) {
        await this.chatService.setMasterKey(password);
        console.log('✅ Master key set');
    }

    // 채팅방 입장
    async joinRoom(roomId: string, useECDH: boolean = false) {
        this.currentRoomId = roomId;

        if (useECDH) {
            // ECDH 키 교환 시작
            const publicKey = await this.chatService.startKeyExchange(roomId);

            // 서버로 공개키 전송 (WebSocket 또는 HTTP)
            // await sendPublicKeyToServer(roomId, publicKey);

            console.log('🔑 Waiting for key exchange...');
        } else {
            // PBKDF2 방식
            await this.chatService.initializeRoomEncryption(roomId);
            console.log('✅ Room encryption initialized');
        }
    }

    // 상대방 공개키 수신 (WebSocket 이벤트)
    async onRemotePublicKeyReceived(publicKey: any) {
        await this.chatService.completeKeyExchange(this.currentRoomId, publicKey);
        console.log('✅ Key exchange completed');
    }

    // 메시지 전송
    async sendMessage(content: string, userId: string, userName: string) {
        try {
            const encrypted = await this.chatService.encryptAndSendMessage(
                content,
                this.currentRoomId,
                userId,
                userName
            );

            // 서버로 전송
            // await sendToServer(encrypted);

            return encrypted;
        } catch (error) {
            console.error('❌ Failed to send message:', error);
            throw error;
        }
    }

    // 메시지 수신
    async onMessageReceived(encryptedMessage: any) {
        try {
            const decrypted = await this.chatService.receiveAndDecryptMessage(encryptedMessage);

            // UI에 표시
            // displayMessage(decrypted);

            return decrypted;
        } catch (error) {
            console.error('❌ Failed to decrypt message:', error);
            // 암호화되지 않은 메시지로 처리하거나 에러 표시
        }
    }

    // 채팅방 퇴장
    leaveRoom() {
        this.chatService.clearRoomKey(this.currentRoomId);
        console.log('🚪 Left room');
    }

    // 로그아웃
    logout() {
        this.chatService.clearAllKeys();
        console.log('👋 Logged out');
    }
}

/**
 * 예제 4: 성능 테스트
 */
async function example4_Performance() {
    console.log('\n=== 예제 4: 성능 테스트 ===\n');

    const chatService = new EncryptedChatService();
    await chatService.setMasterKey('test-password');
    await chatService.initializeRoomEncryption('test-room');

    const messageCount = 100;
    const messageContent = 'This is a test message for performance measurement.';

    // 암호화 성능 측정
    console.time('Encryption');
    for (let i = 0; i < messageCount; i++) {
        await chatService.encryptAndSendMessage(
            messageContent,
            'test-room',
            'user-001',
            'Test User'
        );
    }
    console.timeEnd('Encryption');

    // 복호화 성능 측정
    const encrypted = await chatService.encryptAndSendMessage(
        messageContent,
        'test-room',
        'user-001',
        'Test User'
    );

    console.time('Decryption');
    for (let i = 0; i < messageCount; i++) {
        await chatService.receiveAndDecryptMessage(encrypted);
    }
    console.timeEnd('Decryption');
}

/**
 * 예제 5: 에러 처리
 */
async function example5_ErrorHandling() {
    console.log('\n=== 예제 5: 에러 처리 ===\n');

    const chatService = new EncryptedChatService();

    try {
        // 마스터 키 없이 암호화 시도 (실패해야 정상)
        await chatService.initializeRoomEncryption('room-001');
    } catch (error) {
        console.log('✅ Expected error:', (error as Error).message);
    }

    try {
        // 짧은 마스터 키 (실패해야 정상)
        await chatService.setMasterKey('short');
    } catch (error) {
        console.log('✅ Expected error:', (error as Error).message);
    }

    // 정상 설정
    await chatService.setMasterKey('secure-password-123');
    await chatService.initializeRoomEncryption('room-001');

    try {
        // 잘못된 채팅방으로 메시지 수신 (실패해야 정상)
        const fakeMessage: any = {
            id: 'fake',
            roomId: 'wrong-room',
            senderId: 'user',
            senderName: 'User',
            timestamp: Date.now(),
            isEncrypted: true,
            encryptedData: {}
        };
        await chatService.receiveAndDecryptMessage(fakeMessage);
    } catch (error) {
        console.log('✅ Expected error:', (error as Error).message);
    }
}

/**
 * 모든 예제 실행
 */
export async function runAllExamples() {
    try {
        await example1_PBKDF2();
        await example2_ECDH();
        await example4_Performance();
        await example5_ErrorHandling();

        console.log('\n✅ All examples completed successfully!');
    } catch (error) {
        console.error('\n❌ Example failed:', error);
    }
}

// 브라우저 콘솔에서 테스트하려면:
// import { runAllExamples } from './path/to/this/file';
// runAllExamples();

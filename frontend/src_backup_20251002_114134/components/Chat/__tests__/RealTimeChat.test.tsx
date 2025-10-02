import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RealTimeChat from '../RealTimeChat';

// Socket.IO 모킹
jest.mock('socket.io-client', () => {
    const mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        close: jest.fn(),
    };
    return jest.fn(() => mockSocket);
});

// Chakra UI 모킹
jest.mock('@chakra-ui/react', () => ({
    ...jest.requireActual('@chakra-ui/react'),
    useToast: () => jest.fn(),
}));

const mockUser = {
    id: '1',
    name: '테스트 사용자',
    avatar: 'https://example.com/avatar.jpg',
    isOnline: true
};

const mockProps = {
    roomId: 'test-room',
    currentUser: mockUser,
    onMessageSent: jest.fn()
};

describe('RealTimeChat', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('컴포넌트가 정상적으로 렌더링된다', () => {
        render(<RealTimeChat {...mockProps} />);

        expect(screen.getByText('실시간 채팅')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('메시지를 입력하세요...')).toBeInTheDocument();
        expect(screen.getByText('전송')).toBeInTheDocument();
    });

    it('메시지 입력 및 전송이 정상적으로 작동한다', async () => {
        render(<RealTimeChat {...mockProps} />);

        const messageInput = screen.getByPlaceholderText('메시지를 입력하세요...');
        const sendButton = screen.getByText('전송');

        // 메시지 입력
        fireEvent.change(messageInput, { target: { value: '테스트 메시지' } });
        expect(messageInput).toHaveValue('테스트 메시지');

        // 전송 버튼 클릭
        fireEvent.click(sendButton);

        // 입력 필드가 초기화되는지 확인
        await waitFor(() => {
            expect(messageInput).toHaveValue('');
        });
    });

    it('Enter 키로 메시지를 전송할 수 있다', async () => {
        render(<RealTimeChat {...mockProps} />);

        const messageInput = screen.getByPlaceholderText('메시지를 입력하세요...');

        // 메시지 입력
        fireEvent.change(messageInput, { target: { value: 'Enter 키 테스트' } });

        // Enter 키 이벤트
        fireEvent.keyPress(messageInput, { key: 'Enter', code: 'Enter' });

        // 입력 필드가 초기화되는지 확인
        await waitFor(() => {
            expect(messageInput).toHaveValue('');
        });
    });

    it('Shift+Enter는 메시지를 전송하지 않는다', () => {
        render(<RealTimeChat {...mockProps} />);

        const messageInput = screen.getByPlaceholderText('메시지를 입력하세요...');

        // 메시지 입력
        fireEvent.change(messageInput, { target: { value: 'Shift+Enter 테스트' } });

        // Shift+Enter 키 이벤트
        fireEvent.keyPress(messageInput, { key: 'Enter', code: 'Enter', shiftKey: true });

        // 입력 필드가 초기화되지 않는지 확인
        expect(messageInput).toHaveValue('Shift+Enter 테스트');
    });

    it('빈 메시지는 전송되지 않는다', () => {
        render(<RealTimeChat {...mockProps} />);

        const messageInput = screen.getByPlaceholderText('메시지를 입력하세요...');
        const sendButton = screen.getByText('전송');

        // 빈 메시지 입력
        fireEvent.change(messageInput, { target: { value: '   ' } });

        // 전송 버튼이 비활성화되어 있는지 확인
        expect(sendButton).toBeDisabled();
    });

    it('연결 상태가 표시된다', () => {
        render(<RealTimeChat {...mockProps} />);

        // 연결 상태 배지가 있는지 확인
        expect(screen.getByText('연결됨')).toBeInTheDocument();
    });

    it('온라인 사용자 수가 표시된다', () => {
        render(<RealTimeChat {...mockProps} />);

        // 온라인 사용자 수가 표시되는지 확인
        expect(screen.getByText(/명 온라인/)).toBeInTheDocument();
    });
});

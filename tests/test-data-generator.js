// 사용자 테스트용 데이터 생성기
const fs = require('fs');
const path = require('path');

// 테스트 사용자 데이터
const testUsers = [
    {
        id: 1,
        username: 'testuser1',
        email: 'testuser1@example.com',
        password: 'password123',
        role: 'user',
        profile: {
            nickname: '테스트유저1',
            bio: '안녕하세요! 테스트 사용자입니다.',
            avatar: 'https://via.placeholder.com/150/0000FF/FFFFFF?text=U1'
        }
    },
    {
        id: 2,
        username: 'testuser2',
        email: 'testuser2@example.com',
        password: 'password123',
        role: 'user',
        profile: {
            nickname: '테스트유저2',
            bio: '커뮤니티를 즐기고 있습니다.',
            avatar: 'https://via.placeholder.com/150/00FF00/FFFFFF?text=U2'
        }
    },
    {
        id: 3,
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        profile: {
            nickname: '관리자',
            bio: '시스템 관리자입니다.',
            avatar: 'https://via.placeholder.com/150/FF0000/FFFFFF?text=AD'
        }
    }
];

// 테스트 게시판 데이터
const testBoards = [
    {
        id: 1,
        name: '자유게시판',
        description: '자유롭게 이야기를 나누는 공간입니다.',
        category: 'general',
        isActive: true,
        postCount: 0
    },
    {
        id: 2,
        name: '공지사항',
        description: '중요한 공지사항을 확인하세요.',
        category: 'notice',
        isActive: true,
        postCount: 0
    },
    {
        id: 3,
        name: '질문과답변',
        description: '궁금한 것을 질문하고 답변을 받아보세요.',
        category: 'qna',
        isActive: true,
        postCount: 0
    }
];

// 테스트 게시글 데이터
const testPosts = [
    {
        id: 1,
        title: '커뮤니티에 오신 것을 환영합니다!',
        content: '안녕하세요! 이 커뮤니티에 오신 것을 환영합니다.\n\n여기서 다양한 주제에 대해 이야기를 나누고, 정보를 공유할 수 있습니다.\n\n많은 참여 부탁드립니다!',
        authorId: 3,
        boardId: 1,
        category: 'welcome',
        tags: ['환영', '소개', '커뮤니티'],
        isPublished: true,
        viewCount: 15,
        likeCount: 8,
        commentCount: 3,
        createdAt: new Date('2024-07-28T10:00:00Z'),
        updatedAt: new Date('2024-07-28T10:00:00Z')
    },
    {
        id: 2,
        title: '사용법 가이드 - 게시글 작성하기',
        content: '게시글을 작성하는 방법을 알려드립니다.\n\n## 1. 게시판 선택\n원하는 게시판을 선택하세요.\n\n## 2. 제목과 내용 작성\n명확한 제목과 자세한 내용을 작성하세요.\n\n## 3. 태그 추가\n관련 태그를 추가하여 검색하기 쉽게 만드세요.\n\n## 4. 게시\n모든 내용을 확인한 후 게시하세요.',
        authorId: 3,
        boardId: 1,
        category: 'guide',
        tags: ['가이드', '사용법', '게시글'],
        isPublished: true,
        viewCount: 32,
        likeCount: 12,
        commentCount: 5,
        createdAt: new Date('2024-07-28T11:30:00Z'),
        updatedAt: new Date('2024-07-28T11:30:00Z')
    },
    {
        id: 3,
        title: '모바일 앱 사용 중 문제가 있어요',
        content: '안녕하세요. 모바일에서 앱을 사용하는데 로그인이 안 되는 문제가 있습니다.\n\n어떤 해결 방법이 있을까요?',
        authorId: 1,
        boardId: 3,
        category: 'question',
        tags: ['모바일', '로그인', '문제'],
        isPublished: true,
        viewCount: 8,
        likeCount: 2,
        commentCount: 1,
        createdAt: new Date('2024-07-29T09:15:00Z'),
        updatedAt: new Date('2024-07-29T09:15:00Z')
    }
];

// 테스트 댓글 데이터
const testComments = [
    {
        id: 1,
        content: '환영합니다! 좋은 커뮤니티가 되길 바랍니다.',
        authorId: 1,
        postId: 1,
        parentId: null,
        isPublished: true,
        likeCount: 3,
        createdAt: new Date('2024-07-28T10:15:00Z'),
        updatedAt: new Date('2024-07-28T10:15:00Z')
    },
    {
        id: 2,
        content: '감사합니다! 잘 사용하겠습니다.',
        authorId: 2,
        postId: 1,
        parentId: null,
        isPublished: true,
        likeCount: 1,
        createdAt: new Date('2024-07-28T10:20:00Z'),
        updatedAt: new Date('2024-07-28T10:20:00Z')
    },
    {
        id: 3,
        content: '모바일 앱을 다시 설치해보시는 것을 추천드립니다.',
        authorId: 2,
        postId: 3,
        parentId: null,
        isPublished: true,
        likeCount: 0,
        createdAt: new Date('2024-07-29T09:30:00Z'),
        updatedAt: new Date('2024-07-29T09:30:00Z')
    }
];

// 테스트 채팅방 데이터
const testChatRooms = [
    {
        id: 1,
        name: '일반 채팅',
        description: '자유롭게 대화하는 공간입니다.',
        type: 'public',
        maxMembers: 100,
        memberCount: 3,
        isActive: true,
        createdAt: new Date('2024-07-28T08:00:00Z')
    },
    {
        id: 2,
        name: '개발자 채팅',
        description: '개발 관련 이야기를 나누는 공간입니다.',
        type: 'public',
        maxMembers: 50,
        memberCount: 2,
        isActive: true,
        createdAt: new Date('2024-07-28T09:00:00Z')
    }
];

// 테스트 채팅 메시지 데이터
const testChatMessages = [
    {
        id: 1,
        content: '안녕하세요! 처음 가입했습니다.',
        authorId: 1,
        roomId: 1,
        type: 'text',
        createdAt: new Date('2024-07-28T08:05:00Z')
    },
    {
        id: 2,
        content: '환영합니다!',
        authorId: 2,
        roomId: 1,
        type: 'text',
        createdAt: new Date('2024-07-28T08:06:00Z')
    },
    {
        id: 3,
        content: '개발 관련 질문이 있으시면 언제든 물어보세요!',
        authorId: 3,
        roomId: 2,
        type: 'text',
        createdAt: new Date('2024-07-28T09:10:00Z')
    }
];

// 데이터를 JSON 파일로 저장
const testData = {
    users: testUsers,
    boards: testBoards,
    posts: testPosts,
    comments: testComments,
    chatRooms: testChatRooms,
    chatMessages: testChatMessages,
    generatedAt: new Date().toISOString(),
    version: '1.0.0'
};

// 테스트 데이터 디렉토리 생성
const testDataDir = path.join(__dirname, 'test-data');
if (!fs.existsSync(testDataDir)) {
    fs.mkdirSync(testDataDir, { recursive: true });
}

// JSON 파일로 저장
fs.writeFileSync(
    path.join(testDataDir, 'test-data.json'),
    JSON.stringify(testData, null, 2),
    'utf8'
);

// 개별 파일로도 저장
fs.writeFileSync(
    path.join(testDataDir, 'users.json'),
    JSON.stringify(testUsers, null, 2),
    'utf8'
);

fs.writeFileSync(
    path.join(testDataDir, 'boards.json'),
    JSON.stringify(testBoards, null, 2),
    'utf8'
);

fs.writeFileSync(
    path.join(testDataDir, 'posts.json'),
    JSON.stringify(testPosts, null, 2),
    'utf8'
);

fs.writeFileSync(
    path.join(testDataDir, 'comments.json'),
    JSON.stringify(testComments, null, 2),
    'utf8'
);

fs.writeFileSync(
    path.join(testDataDir, 'chat-rooms.json'),
    JSON.stringify(testChatRooms, null, 2),
    'utf8'
);

fs.writeFileSync(
    path.join(testDataDir, 'chat-messages.json'),
    JSON.stringify(testChatMessages, null, 2),
    'utf8'
);

console.log('✅ 테스트 데이터 생성 완료!');
console.log(`📁 저장 위치: ${testDataDir}`);
console.log(`📊 생성된 데이터:`);
console.log(`  - 사용자: ${testUsers.length}명`);
console.log(`  - 게시판: ${testBoards.length}개`);
console.log(`  - 게시글: ${testPosts.length}개`);
console.log(`  - 댓글: ${testComments.length}개`);
console.log(`  - 채팅방: ${testChatRooms.length}개`);
console.log(`  - 채팅 메시지: ${testChatMessages.length}개`);

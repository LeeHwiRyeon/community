describe('User Journey E2E Tests', () => {
    beforeEach(() => {
        // 각 테스트 전에 데이터베이스 초기화
        cy.task('db:seed');
    });

    afterEach(() => {
        // 각 테스트 후에 데이터 정리
        cy.task('db:cleanup');
    });

    describe('Complete User Registration and Post Creation Flow', () => {
        it('should allow user to register, login, and create posts', () => {
            // 1. 사용자 등록
            cy.visit('/register');

            cy.get('[data-testid="email-input"]').type('newuser@example.com');
            cy.get('[data-testid="password-input"]').type('password123');
            cy.get('[data-testid="confirm-password-input"]').type('password123');
            cy.get('[data-testid="name-input"]').type('New User');
            cy.get('[data-testid="register-button"]').click();

            // 등록 성공 확인
            cy.url().should('include', '/login');
            cy.get('[data-testid="success-message"]').should('contain', '회원가입이 완료되었습니다');

            // 2. 로그인
            cy.get('[data-testid="email-input"]').type('newuser@example.com');
            cy.get('[data-testid="password-input"]').type('password123');
            cy.get('[data-testid="login-button"]').click();

            // 로그인 성공 확인
            cy.url().should('include', '/dashboard');
            cy.get('[data-testid="user-menu"]').should('contain', 'New User');

            // 3. 게시글 작성
            cy.visit('/posts/create');

            cy.get('[data-testid="post-title"]').type('My First Post');
            cy.get('[data-testid="post-content"]').type('This is my first post on the community platform. I am excited to share my thoughts!');
            cy.get('[data-testid="post-category"]').select('technology');
            cy.get('[data-testid="post-tags"]').type('javascript, react, tutorial');
            cy.get('[data-testid="submit-post"]').click();

            // 게시글 작성 성공 확인
            cy.url().should('match', /\/posts\/\d+/);
            cy.get('[data-testid="post-title"]').should('contain', 'My First Post');
            cy.get('[data-testid="post-content"]').should('contain', 'This is my first post');

            // 4. 게시글 목록에서 확인
            cy.visit('/posts');
            cy.get('[data-testid="post-list"]').should('contain', 'My First Post');
            cy.get('[data-testid="post-author"]').should('contain', 'New User');
        });
    });

    describe('Post Interaction Flow', () => {
        beforeEach(() => {
            // 테스트 사용자로 로그인
            cy.login('testuser@example.com', 'password123');
        });

        it('should allow user to view, like, and comment on posts', () => {
            // 1. 게시글 목록에서 게시글 클릭
            cy.visit('/posts');
            cy.get('[data-testid="post-card"]').first().click();

            // 게시글 상세 페이지 확인
            cy.url().should('include', '/posts/');
            cy.get('[data-testid="post-title"]').should('be.visible');
            cy.get('[data-testid="post-content"]').should('be.visible');

            // 2. 게시글 좋아요
            cy.get('[data-testid="like-button"]').click();
            cy.get('[data-testid="like-count"]').should('contain', '1');
            cy.get('[data-testid="like-button"]').should('have.class', 'liked');

            // 3. 댓글 작성
            cy.get('[data-testid="comment-input"]').type('Great post! Thanks for sharing.');
            cy.get('[data-testid="submit-comment"]').click();

            // 댓글 작성 확인
            cy.get('[data-testid="comment-list"]').should('contain', 'Great post! Thanks for sharing.');
            cy.get('[data-testid="comment-count"]').should('contain', '1');

            // 4. 댓글 좋아요
            cy.get('[data-testid="comment-like-button"]').first().click();
            cy.get('[data-testid="comment-like-count"]').first().should('contain', '1');

            // 5. 답글 작성
            cy.get('[data-testid="reply-button"]').first().click();
            cy.get('[data-testid="reply-input"]').type('I agree with your comment!');
            cy.get('[data-testid="submit-reply"]').click();

            // 답글 작성 확인
            cy.get('[data-testid="reply-list"]').should('contain', 'I agree with your comment!');
        });
    });

    describe('Search and Filter Flow', () => {
        beforeEach(() => {
            cy.login('testuser@example.com', 'password123');
        });

        it('should allow user to search and filter posts', () => {
            // 1. 기본 검색
            cy.visit('/posts');
            cy.get('[data-testid="search-input"]').type('javascript');
            cy.get('[data-testid="search-button"]').click();

            // 검색 결과 확인
            cy.get('[data-testid="search-results"]').should('be.visible');
            cy.get('[data-testid="post-card"]').should('contain', 'javascript');

            // 2. 카테고리 필터
            cy.get('[data-testid="category-filter"]').select('technology');
            cy.get('[data-testid="apply-filters"]').click();

            // 필터 결과 확인
            cy.get('[data-testid="post-card"]').each(($card) => {
                cy.wrap($card).should('contain', 'technology');
            });

            // 3. 고급 검색
            cy.get('[data-testid="advanced-search-toggle"]').click();
            cy.get('[data-testid="author-filter"]').type('Test Author');
            cy.get('[data-testid="date-from"]').type('2024-01-01');
            cy.get('[data-testid="date-to"]').type('2024-12-31');
            cy.get('[data-testid="min-views"]').type('10');
            cy.get('[data-testid="apply-advanced-filters"]').click();

            // 고급 검색 결과 확인
            cy.get('[data-testid="advanced-search-results"]').should('be.visible');
        });
    });

    describe('User Profile Management Flow', () => {
        beforeEach(() => {
            cy.login('testuser@example.com', 'password123');
        });

        it('should allow user to manage their profile', () => {
            // 1. 프로필 페이지 이동
            cy.get('[data-testid="user-menu"]').click();
            cy.get('[data-testid="profile-link"]').click();

            // 프로필 페이지 확인
            cy.url().should('include', '/profile');
            cy.get('[data-testid="profile-form"]').should('be.visible');

            // 2. 프로필 정보 수정
            cy.get('[data-testid="name-input"]').clear().type('Updated Name');
            cy.get('[data-testid="bio-input"]').clear().type('This is my updated bio');
            cy.get('[data-testid="save-profile"]').click();

            // 수정 성공 확인
            cy.get('[data-testid="success-message"]').should('contain', '프로필이 수정되었습니다');
            cy.get('[data-testid="user-name"]').should('contain', 'Updated Name');

            // 3. 비밀번호 변경
            cy.get('[data-testid="change-password-tab"]').click();
            cy.get('[data-testid="current-password"]').type('password123');
            cy.get('[data-testid="new-password"]').type('newpassword123');
            cy.get('[data-testid="confirm-new-password"]').type('newpassword123');
            cy.get('[data-testid="change-password-button"]').click();

            // 비밀번호 변경 성공 확인
            cy.get('[data-testid="success-message"]').should('contain', '비밀번호가 변경되었습니다');

            // 4. 프로필 사진 업로드
            cy.get('[data-testid="avatar-tab"]').click();
            cy.get('[data-testid="avatar-upload"]').selectFile('cypress/fixtures/test-avatar.jpg');
            cy.get('[data-testid="save-avatar"]').click();

            // 아바타 업로드 성공 확인
            cy.get('[data-testid="success-message"]').should('contain', '프로필 사진이 업로드되었습니다');
        });
    });

    describe('Admin Management Flow', () => {
        beforeEach(() => {
            // 관리자로 로그인
            cy.login('admin@example.com', 'adminpassword');
        });

        it('should allow admin to manage users and content', () => {
            // 1. 관리자 대시보드 접근
            cy.visit('/admin/dashboard');
            cy.get('[data-testid="admin-dashboard"]').should('be.visible');

            // 2. 사용자 관리
            cy.get('[data-testid="users-tab"]').click();
            cy.get('[data-testid="user-list"]').should('be.visible');

            // 사용자 검색
            cy.get('[data-testid="user-search"]').type('testuser');
            cy.get('[data-testid="search-users"]').click();
            cy.get('[data-testid="user-list"]').should('contain', 'testuser');

            // 사용자 상태 변경
            cy.get('[data-testid="user-actions"]').first().click();
            cy.get('[data-testid="suspend-user"]').click();
            cy.get('[data-testid="confirm-suspend"]').click();

            // 사용자 정지 확인
            cy.get('[data-testid="success-message"]').should('contain', '사용자가 정지되었습니다');

            // 3. 콘텐츠 관리
            cy.get('[data-testid="content-tab"]').click();
            cy.get('[data-testid="post-list"]').should('be.visible');

            // 게시글 검토
            cy.get('[data-testid="review-post"]').first().click();
            cy.get('[data-testid="post-review-modal"]').should('be.visible');

            // 게시글 승인
            cy.get('[data-testid="approve-post"]').click();
            cy.get('[data-testid="confirm-approve"]').click();

            // 승인 확인
            cy.get('[data-testid="success-message"]').should('contain', '게시글이 승인되었습니다');

            // 4. 신고 처리
            cy.get('[data-testid="reports-tab"]').click();
            cy.get('[data-testid="report-list"]').should('be.visible');

            // 신고 검토
            cy.get('[data-testid="review-report"]').first().click();
            cy.get('[data-testid="report-details"]').should('be.visible');

            // 신고 처리
            cy.get('[data-testid="resolve-report"]').click();
            cy.get('[data-testid="resolution-reason"]').type('No violation found');
            cy.get('[data-testid="confirm-resolve"]').click();

            // 처리 완료 확인
            cy.get('[data-testid="success-message"]').should('contain', '신고가 처리되었습니다');
        });
    });

    describe('Real-time Features Flow', () => {
        beforeEach(() => {
            cy.login('testuser@example.com', 'password123');
        });

        it('should test real-time notifications and updates', () => {
            // 1. 알림 설정
            cy.visit('/settings/notifications');
            cy.get('[data-testid="email-notifications"]').check();
            cy.get('[data-testid="push-notifications"]').check();
            cy.get('[data-testid="save-notification-settings"]').click();

            // 설정 저장 확인
            cy.get('[data-testid="success-message"]').should('contain', '알림 설정이 저장되었습니다');

            // 2. 실시간 채팅 (새 터미널에서 다른 사용자로 로그인)
            cy.visit('/chat');
            cy.get('[data-testid="chat-room"]').should('be.visible');

            // 메시지 전송
            cy.get('[data-testid="message-input"]').type('Hello, this is a test message');
            cy.get('[data-testid="send-message"]').click();

            // 메시지 전송 확인
            cy.get('[data-testid="message-list"]').should('contain', 'Hello, this is a test message');

            // 3. 실시간 업데이트 확인
            cy.visit('/posts');
            cy.get('[data-testid="live-indicator"]').should('be.visible');

            // 새 게시글 실시간 표시 (시뮬레이션)
            cy.get('[data-testid="new-post-notification"]').should('be.visible');
        });
    });

    describe('Mobile Responsive Flow', () => {
        beforeEach(() => {
            // 모바일 뷰포트 설정
            cy.viewport('iphone-x');
            cy.login('testuser@example.com', 'password123');
        });

        it('should work properly on mobile devices', () => {
            // 1. 모바일 네비게이션
            cy.get('[data-testid="mobile-menu-button"]').click();
            cy.get('[data-testid="mobile-menu"]').should('be.visible');

            // 메뉴 항목 확인
            cy.get('[data-testid="mobile-posts-link"]').should('be.visible');
            cy.get('[data-testid="mobile-profile-link"]').should('be.visible');

            // 2. 모바일 게시글 작성
            cy.get('[data-testid="mobile-create-post"]').click();
            cy.get('[data-testid="mobile-post-form"]').should('be.visible');

            cy.get('[data-testid="mobile-post-title"]').type('Mobile Test Post');
            cy.get('[data-testid="mobile-post-content"]').type('This is a test post from mobile');
            cy.get('[data-testid="mobile-submit-post"]').click();

            // 모바일에서 게시글 작성 확인
            cy.get('[data-testid="mobile-post-success"]').should('be.visible');

            // 3. 모바일 검색
            cy.get('[data-testid="mobile-search-button"]').click();
            cy.get('[data-testid="mobile-search-input"]').type('test');
            cy.get('[data-testid="mobile-search-results"]').should('be.visible');

            // 4. 모바일 프로필
            cy.get('[data-testid="mobile-profile-button"]').click();
            cy.get('[data-testid="mobile-profile-menu"]').should('be.visible');
        });
    });

    describe('Error Handling Flow', () => {
        it('should handle various error scenarios gracefully', () => {
            // 1. 네트워크 오류 시뮬레이션
            cy.intercept('POST', '/api/auth/login', { forceNetworkError: true });

            cy.visit('/login');
            cy.get('[data-testid="email-input"]').type('test@example.com');
            cy.get('[data-testid="password-input"]').type('password123');
            cy.get('[data-testid="login-button"]').click();

            // 네트워크 오류 처리 확인
            cy.get('[data-testid="error-message"]').should('contain', '네트워크 오류가 발생했습니다');

            // 2. 서버 오류 시뮬레이션
            cy.intercept('GET', '/api/posts', { statusCode: 500, body: { error: 'Internal Server Error' } });

            cy.visit('/posts');
            cy.get('[data-testid="error-message"]').should('contain', '서버 오류가 발생했습니다');

            // 3. 404 오류 처리
            cy.visit('/posts/non-existent-post');
            cy.get('[data-testid="404-message"]').should('contain', '페이지를 찾을 수 없습니다');

            // 4. 유효성 검사 오류
            cy.visit('/register');
            cy.get('[data-testid="register-button"]').click();
            cy.get('[data-testid="validation-errors"]').should('be.visible');
        });
    });
});

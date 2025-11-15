# 🧪 테스트 커버리지 향상 가이드

**작성일:** 2025년 11월 12일  
**Phase:** 4 - Task 3 (테스트 커버리지 향상)  
**목표:** 70% 이상 테스트 커버리지 달성

---

## 📋 목차

1. [현재 상태 분석](#1-현재-상태-분석)
2. [테스트 전략](#2-테스트-전략)
3. [백엔드 테스트](#3-백엔드-테스트)
4. [프론트엔드 테스트](#4-프론트엔드-테스트)
5. [E2E 테스트](#5-e2e-테스트)
6. [테스트 실행](#6-테스트-실행)
7. [커버리지 목표](#7-커버리지-목표)

---

## 1. 현재 상태 분석

### 1.1 기존 테스트 현황

#### 백엔드 (server-backend)
```
✅ 기존 테스트:
- tests/social-features.test.js (통합 테스트)
- tests/csrf-integration.test.js (보안 테스트)
- src/logger/__tests__/logger.test.js (단위 테스트)
- tests/api-random.js (API 테스트)
- tests/api-strict.js (엄격한 API 테스트)
- tests/security-strict.js (보안 테스트)

📊 테스트 프레임워크:
- Jest (단위 테스트)
- Node.js Test Runner (통합 테스트)
- Supertest (API 테스트)

⚠️ 부족한 영역:
- 서비스 레이어 단위 테스트 (notificationService, fileUploadService 등)
- 미들웨어 테스트
- Redis 캐싱 로직 테스트
- Elasticsearch 검색 로직 테스트
```

#### 프론트엔드 (frontend)
```
✅ 기존 테스트:
- tests/e2e/*.spec.ts (15개 E2E 테스트)
- tests/pages/NewsPagePage.test.tsx
- src/utils/apiClient.csrf.test.ts
- performance.test.js
- user-acceptance.test.js

📊 테스트 프레임워크:
- Playwright (E2E)
- Vitest (단위/통합)

⚠️ 부족한 영역:
- 컴포넌트 단위 테스트 (NotificationBell, LanguageSwitcher 등)
- Context 테스트 (ThemeContext, NotificationContext)
- 커스텀 훅 테스트
- 유틸리티 함수 테스트
```

---

## 2. 테스트 전략

### 2.1 테스트 피라미드

```
           /\
          /  \  E2E Tests (10%)
         /____\
        /      \  Integration Tests (30%)
       /________\
      /          \  Unit Tests (60%)
     /____________\
```

### 2.2 우선순위

1. **Critical Path (최우선)**
   - 인증/인가 (로그인, 회원가입, JWT)
   - 데이터 CRUD (게시물, 댓글)
   - 파일 업로드
   - 결제/중요 비즈니스 로직

2. **High Priority (높음)**
   - 알림 시스템
   - 채팅 시스템
   - 검색 기능
   - 캐싱 로직

3. **Medium Priority (중간)**
   - UI 컴포넌트
   - 유틸리티 함수
   - 프로필 관리

4. **Low Priority (낮음)**
   - 정적 페이지
   - 스타일링 로직

### 2.3 커버리지 목표

| 영역            | 목표 커버리지 | 현재 | 차이 |
| --------------- | ------------- | ---- | ---- |
| 백엔드 전체     | 70%           | ~30% | +40% |
| - API 라우트    | 80%           | ~50% | +30% |
| - 서비스 레이어 | 75%           | ~20% | +55% |
| - 미들웨어      | 70%           | ~40% | +30% |
| 프론트엔드 전체 | 70%           | ~25% | +45% |
| - 컴포넌트      | 65%           | ~15% | +50% |
| - Context/Hooks | 80%           | ~30% | +50% |
| - 유틸리티      | 85%           | ~50% | +35% |
| E2E             | 100%          | ~80% | +20% |

---

## 3. 백엔드 테스트

### 3.1 단위 테스트 (Services)

#### 3.1.1 알림 서비스 테스트

```javascript
// server-backend/tests/unit/notificationService.test.js

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import notificationService from '../../services/notificationService.js';
import pool from '../../config/database.js';

describe('NotificationService', () => {
    let testUserId;
    
    beforeEach(async () => {
        // 테스트 사용자 생성
        const [result] = await pool.query(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            ['testuser', 'test@example.com', 'password123']
        );
        testUserId = result.insertId;
    });
    
    afterEach(async () => {
        // 테스트 데이터 정리
        await pool.query('DELETE FROM notifications WHERE user_id = ?', [testUserId]);
        await pool.query('DELETE FROM users WHERE id = ?', [testUserId]);
    });
    
    describe('createNotification', () => {
        it('should create a notification successfully', async () => {
            const notification = await notificationService.createNotification({
                userId: testUserId,
                type: 'like',
                message: 'Someone liked your post',
                relatedId: 1,
                relatedType: 'post'
            });
            
            expect(notification).toBeDefined();
            expect(notification.id).toBeDefined();
            expect(notification.type).toBe('like');
        });
        
        it('should throw error for invalid notification type', async () => {
            await expect(
                notificationService.createNotification({
                    userId: testUserId,
                    type: 'invalid_type',
                    message: 'Test'
                })
            ).rejects.toThrow();
        });
        
        it('should not create duplicate notifications', async () => {
            const data = {
                userId: testUserId,
                type: 'like',
                message: 'Test',
                relatedId: 1,
                relatedType: 'post'
            };
            
            await notificationService.createNotification(data);
            await notificationService.createNotification(data);
            
            const notifications = await notificationService.getUserNotifications(testUserId);
            expect(notifications.length).toBe(1);
        });
    });
    
    describe('getUserNotifications', () => {
        it('should return paginated notifications', async () => {
            // 10개 알림 생성
            for (let i = 0; i < 10; i++) {
                await notificationService.createNotification({
                    userId: testUserId,
                    type: 'system',
                    message: `Notification ${i}`
                });
            }
            
            const result = await notificationService.getUserNotifications(testUserId, 1, 5);
            
            expect(result.notifications.length).toBe(5);
            expect(result.total).toBe(10);
            expect(result.hasMore).toBe(true);
        });
        
        it('should filter by read status', async () => {
            await notificationService.createNotification({
                userId: testUserId,
                type: 'system',
                message: 'Unread notification'
            });
            
            const unreadCount = await notificationService.getUnreadCount(testUserId);
            expect(unreadCount).toBe(1);
        });
    });
    
    describe('markAsRead', () => {
        it('should mark single notification as read', async () => {
            const notification = await notificationService.createNotification({
                userId: testUserId,
                type: 'system',
                message: 'Test'
            });
            
            await notificationService.markAsRead(notification.id, testUserId);
            
            const updated = await notificationService.getNotificationById(notification.id);
            expect(updated.isRead).toBe(true);
        });
        
        it('should not mark other user\'s notification', async () => {
            const notification = await notificationService.createNotification({
                userId: testUserId,
                type: 'system',
                message: 'Test'
            });
            
            await expect(
                notificationService.markAsRead(notification.id, 999999)
            ).rejects.toThrow('Unauthorized');
        });
    });
    
    describe('markAllAsRead', () => {
        it('should mark all notifications as read', async () => {
            // 5개 알림 생성
            for (let i = 0; i < 5; i++) {
                await notificationService.createNotification({
                    userId: testUserId,
                    type: 'system',
                    message: `Notification ${i}`
                });
            }
            
            await notificationService.markAllAsRead(testUserId);
            
            const unreadCount = await notificationService.getUnreadCount(testUserId);
            expect(unreadCount).toBe(0);
        });
    });
    
    describe('deleteNotification', () => {
        it('should delete notification successfully', async () => {
            const notification = await notificationService.createNotification({
                userId: testUserId,
                type: 'system',
                message: 'Test'
            });
            
            await notificationService.deleteNotification(notification.id, testUserId);
            
            const deleted = await notificationService.getNotificationById(notification.id);
            expect(deleted).toBeNull();
        });
    });
});
```

#### 3.1.2 파일 업로드 서비스 테스트

```javascript
// server-backend/tests/unit/fileUploadService.test.js

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fileUploadService from '../../services/fileUploadService.js';
import fs from 'fs/promises';
import path from 'path';

vi.mock('sharp');

describe('FileUploadService', () => {
    describe('validateFile', () => {
        it('should accept valid image files', () => {
            const file = {
                mimetype: 'image/jpeg',
                size: 1024 * 1024 // 1MB
            };
            
            expect(() => fileUploadService.validateFile(file)).not.toThrow();
        });
        
        it('should reject files exceeding size limit', () => {
            const file = {
                mimetype: 'image/jpeg',
                size: 11 * 1024 * 1024 // 11MB
            };
            
            expect(() => fileUploadService.validateFile(file)).toThrow('File too large');
        });
        
        it('should reject invalid file types', () => {
            const file = {
                mimetype: 'application/exe',
                size: 1024
            };
            
            expect(() => fileUploadService.validateFile(file)).toThrow('Invalid file type');
        });
    });
    
    describe('generateUniqueFilename', () => {
        it('should generate unique filename with timestamp', () => {
            const filename1 = fileUploadService.generateUniqueFilename('test.jpg');
            const filename2 = fileUploadService.generateUniqueFilename('test.jpg');
            
            expect(filename1).not.toBe(filename2);
            expect(filename1).toMatch(/^\d+-[a-z0-9]+-test\.jpg$/);
        });
        
        it('should preserve file extension', () => {
            const filename = fileUploadService.generateUniqueFilename('image.png');
            expect(filename).toMatch(/\.png$/);
        });
    });
    
    describe('processImage', () => {
        it('should create thumbnail', async () => {
            const mockFile = {
                path: '/tmp/test-image.jpg',
                filename: 'test-image.jpg'
            };
            
            const result = await fileUploadService.processImage(mockFile);
            
            expect(result.thumbnail).toBeDefined();
            expect(result.thumbnail).toMatch(/thumbnail-/);
        });
        
        it('should optimize image quality', async () => {
            // Sharp mock 테스트
            const mockFile = {
                path: '/tmp/test-image.jpg',
                filename: 'test-image.jpg'
            };
            
            const result = await fileUploadService.processImage(mockFile, {
                quality: 80
            });
            
            expect(result.optimized).toBe(true);
        });
    });
    
    describe('deleteFile', () => {
        it('should delete file and thumbnail', async () => {
            const filename = 'test-file.jpg';
            const thumbnailFilename = 'thumbnail-test-file.jpg';
            
            // Mock 파일 생성
            vi.spyOn(fs, 'unlink').mockResolvedValue();
            
            await fileUploadService.deleteFile(filename);
            
            expect(fs.unlink).toHaveBeenCalledWith(
                expect.stringContaining(filename)
            );
            expect(fs.unlink).toHaveBeenCalledWith(
                expect.stringContaining(thumbnailFilename)
            );
        });
    });
});
```

#### 3.1.3 Redis 캐싱 서비스 테스트

```javascript
// server-backend/tests/unit/redisCacheService.test.js

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import redisClient from '../../config/redis.js';

describe('Redis Cache Service', () => {
    const TEST_KEY = 'test:key';
    
    afterEach(async () => {
        await redisClient.del(TEST_KEY);
    });
    
    describe('get and set', () => {
        it('should store and retrieve data', async () => {
            const data = { foo: 'bar', number: 42 };
            
            await redisClient.setex(TEST_KEY, 60, JSON.stringify(data));
            const result = await redisClient.get(TEST_KEY);
            
            expect(JSON.parse(result)).toEqual(data);
        });
        
        it('should return null for non-existent key', async () => {
            const result = await redisClient.get('non-existent-key');
            expect(result).toBeNull();
        });
        
        it('should expire data after TTL', async () => {
            await redisClient.setex(TEST_KEY, 1, 'test-data');
            
            // 1초 대기
            await new Promise(resolve => setTimeout(resolve, 1100));
            
            const result = await redisClient.get(TEST_KEY);
            expect(result).toBeNull();
        });
    });
    
    describe('delete', () => {
        it('should delete key successfully', async () => {
            await redisClient.set(TEST_KEY, 'test-data');
            await redisClient.del(TEST_KEY);
            
            const result = await redisClient.get(TEST_KEY);
            expect(result).toBeNull();
        });
        
        it('should delete multiple keys', async () => {
            await redisClient.set('key1', 'data1');
            await redisClient.set('key2', 'data2');
            
            await redisClient.del('key1', 'key2');
            
            const result1 = await redisClient.get('key1');
            const result2 = await redisClient.get('key2');
            
            expect(result1).toBeNull();
            expect(result2).toBeNull();
        });
    });
    
    describe('pattern matching', () => {
        it('should find keys by pattern', async () => {
            await redisClient.set('user:1', 'data1');
            await redisClient.set('user:2', 'data2');
            await redisClient.set('post:1', 'data3');
            
            const keys = await redisClient.keys('user:*');
            
            expect(keys.length).toBe(2);
            expect(keys).toContain('user:1');
            expect(keys).toContain('user:2');
            
            // 정리
            await redisClient.del('user:1', 'user:2', 'post:1');
        });
    });
});
```

### 3.2 통합 테스트 (API Routes)

#### 3.2.1 알림 API 테스트

```javascript
// server-backend/tests/integration/notifications.api.test.js

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import pool from '../../config/database.js';

describe('Notifications API', () => {
    let authToken;
    let userId;
    
    beforeAll(async () => {
        // 테스트 사용자 생성 및 로그인
        const registerRes = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testuser',
                email: 'test@example.com',
                password: 'Password123!'
            });
        
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'Password123!'
            });
        
        authToken = loginRes.body.token;
        userId = loginRes.body.user.id;
    });
    
    afterAll(async () => {
        // 테스트 데이터 정리
        await pool.query('DELETE FROM notifications WHERE user_id = ?', [userId]);
        await pool.query('DELETE FROM users WHERE id = ?', [userId]);
    });
    
    describe('GET /api/notifications', () => {
        it('should return notifications for authenticated user', async () => {
            const res = await request(app)
                .get('/api/notifications')
                .set('Authorization', `Bearer ${authToken}`);
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('notifications');
            expect(Array.isArray(res.body.notifications)).toBe(true);
        });
        
        it('should return 401 without authentication', async () => {
            const res = await request(app)
                .get('/api/notifications');
            
            expect(res.status).toBe(401);
        });
        
        it('should support pagination', async () => {
            const res = await request(app)
                .get('/api/notifications?page=1&limit=5')
                .set('Authorization', `Bearer ${authToken}`);
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('page', 1);
            expect(res.body).toHaveProperty('limit', 5);
        });
    });
    
    describe('GET /api/notifications/unread-count', () => {
        it('should return unread notification count', async () => {
            const res = await request(app)
                .get('/api/notifications/unread-count')
                .set('Authorization', `Bearer ${authToken}`);
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('count');
            expect(typeof res.body.count).toBe('number');
        });
    });
    
    describe('PUT /api/notifications/:id/read', () => {
        let notificationId;
        
        beforeEach(async () => {
            // 테스트 알림 생성
            const [result] = await pool.query(
                'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
                [userId, 'system', 'Test notification']
            );
            notificationId = result.insertId;
        });
        
        it('should mark notification as read', async () => {
            const res = await request(app)
                .put(`/api/notifications/${notificationId}/read`)
                .set('Authorization', `Bearer ${authToken}`);
            
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
        
        it('should return 404 for non-existent notification', async () => {
            const res = await request(app)
                .put('/api/notifications/999999/read')
                .set('Authorization', `Bearer ${authToken}`);
            
            expect(res.status).toBe(404);
        });
    });
    
    describe('PUT /api/notifications/mark-all-read', () => {
        it('should mark all notifications as read', async () => {
            const res = await request(app)
                .put('/api/notifications/mark-all-read')
                .set('Authorization', `Bearer ${authToken}`);
            
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
    
    describe('DELETE /api/notifications/:id', () => {
        let notificationId;
        
        beforeEach(async () => {
            const [result] = await pool.query(
                'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
                [userId, 'system', 'Test notification']
            );
            notificationId = result.insertId;
        });
        
        it('should delete notification successfully', async () => {
            const res = await request(app)
                .delete(`/api/notifications/${notificationId}`)
                .set('Authorization', `Bearer ${authToken}`);
            
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});
```

### 3.3 미들웨어 테스트

```javascript
// server-backend/tests/unit/authMiddleware.test.js

import { describe, it, expect, vi } from 'vitest';
import { authenticate, authorize } from '../../middleware/auth.js';
import jwt from 'jsonwebtoken';

describe('Auth Middleware', () => {
    describe('authenticate', () => {
        it('should pass with valid token', async () => {
            const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET);
            
            const req = {
                headers: {
                    authorization: `Bearer ${token}`
                }
            };
            const res = {};
            const next = vi.fn();
            
            await authenticate(req, res, next);
            
            expect(req.user).toBeDefined();
            expect(req.user.userId).toBe(1);
            expect(next).toHaveBeenCalled();
        });
        
        it('should fail without token', async () => {
            const req = { headers: {} };
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn()
            };
            const next = vi.fn();
            
            await authenticate(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });
        
        it('should fail with invalid token', async () => {
            const req = {
                headers: {
                    authorization: 'Bearer invalid-token'
                }
            };
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn()
            };
            const next = vi.fn();
            
            await authenticate(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(401);
        });
    });
    
    describe('authorize', () => {
        it('should pass with correct role', () => {
            const middleware = authorize(['admin']);
            
            const req = {
                user: { role: 'admin' }
            };
            const res = {};
            const next = vi.fn();
            
            middleware(req, res, next);
            
            expect(next).toHaveBeenCalled();
        });
        
        it('should fail with incorrect role', () => {
            const middleware = authorize(['admin']);
            
            const req = {
                user: { role: 'user' }
            };
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn()
            };
            const next = vi.fn();
            
            middleware(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });
    });
});
```

---

## 4. 프론트엔드 테스트

### 4.1 컴포넌트 테스트

#### 4.1.1 NotificationBell 테스트

```typescript
// frontend/src/components/__tests__/NotificationBell.test.tsx

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationBell } from '../NotificationBell';
import { NotificationProvider } from '../../contexts/NotificationContext';

describe('NotificationBell', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    
    it('should render notification bell', () => {
        render(
            <NotificationProvider>
                <NotificationBell />
            </NotificationProvider>
        );
        
        expect(screen.getByRole('button')).toBeInTheDocument();
    });
    
    it('should display unread count badge', () => {
        const mockContext = {
            unreadCount: 5,
            notifications: []
        };
        
        render(
            <NotificationProvider value={mockContext}>
                <NotificationBell />
            </NotificationProvider>
        );
        
        expect(screen.getByText('5')).toBeInTheDocument();
    });
    
    it('should open popover on click', async () => {
        render(
            <NotificationProvider>
                <NotificationBell />
            </NotificationProvider>
        );
        
        const button = screen.getByRole('button');
        fireEvent.click(button);
        
        await waitFor(() => {
            expect(screen.getByRole('menu')).toBeInTheDocument();
        });
    });
    
    it('should mark notification as read', async () => {
        const mockMarkAsRead = vi.fn();
        const mockContext = {
            notifications: [
                { id: 1, message: 'Test notification', isRead: false }
            ],
            markAsRead: mockMarkAsRead
        };
        
        render(
            <NotificationProvider value={mockContext}>
                <NotificationBell />
            </NotificationProvider>
        );
        
        fireEvent.click(screen.getByRole('button'));
        
        await waitFor(() => {
            const notification = screen.getByText('Test notification');
            fireEvent.click(notification);
        });
        
        expect(mockMarkAsRead).toHaveBeenCalledWith(1);
    });
});
```

#### 4.1.2 LanguageSwitcher 테스트

```typescript
// frontend/src/components/__tests__/LanguageSwitcher.test.tsx

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n/config';

describe('LanguageSwitcher', () => {
    it('should render language switcher', () => {
        render(
            <I18nextProvider i18n={i18n}>
                <LanguageSwitcher />
            </I18nextProvider>
        );
        
        expect(screen.getByRole('button')).toBeInTheDocument();
    });
    
    it('should display current language', () => {
        i18n.changeLanguage('ko');
        
        render(
            <I18nextProvider i18n={i18n}>
                <LanguageSwitcher />
            </I18nextProvider>
        );
        
        expect(screen.getByText(/한국어/i)).toBeInTheDocument();
    });
    
    it('should change language on selection', async () => {
        const changeLanguageSpy = vi.spyOn(i18n, 'changeLanguage');
        
        render(
            <I18nextProvider i18n={i18n}>
                <LanguageSwitcher />
            </I18nextProvider>
        );
        
        fireEvent.click(screen.getByRole('button'));
        fireEvent.click(screen.getByText('English'));
        
        expect(changeLanguageSpy).toHaveBeenCalledWith('en');
    });
    
    it('should persist language preference', () => {
        const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
        
        render(
            <I18nextProvider i18n={i18n}>
                <LanguageSwitcher />
            </I18nextProvider>
        );
        
        fireEvent.click(screen.getByRole('button'));
        fireEvent.click(screen.getByText('한국어'));
        
        expect(setItemSpy).toHaveBeenCalledWith('language', 'ko');
    });
});
```

### 4.2 Context 테스트

```typescript
// frontend/src/contexts/__tests__/ThemeContext.test.tsx

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../ThemeContext';

describe('ThemeContext', () => {
    beforeEach(() => {
        localStorage.clear();
    });
    
    it('should provide theme context', () => {
        const { result } = renderHook(() => useTheme(), {
            wrapper: ThemeProvider
        });
        
        expect(result.current.mode).toBeDefined();
        expect(result.current.toggleTheme).toBeDefined();
    });
    
    it('should default to light theme', () => {
        const { result } = renderHook(() => useTheme(), {
            wrapper: ThemeProvider
        });
        
        expect(result.current.mode).toBe('light');
    });
    
    it('should toggle theme', () => {
        const { result } = renderHook(() => useTheme(), {
            wrapper: ThemeProvider
        });
        
        act(() => {
            result.current.toggleTheme();
        });
        
        expect(result.current.mode).toBe('dark');
    });
    
    it('should persist theme preference', () => {
        const { result } = renderHook(() => useTheme(), {
            wrapper: ThemeProvider
        });
        
        act(() => {
            result.current.toggleTheme();
        });
        
        expect(localStorage.getItem('theme')).toBe('dark');
    });
    
    it('should load theme from localStorage', () => {
        localStorage.setItem('theme', 'dark');
        
        const { result } = renderHook(() => useTheme(), {
            wrapper: ThemeProvider
        });
        
        expect(result.current.mode).toBe('dark');
    });
});
```

### 4.3 유틸리티 함수 테스트

```typescript
// frontend/src/utils/__tests__/formatDate.test.ts

import { describe, it, expect } from 'vitest';
import { formatDate, formatRelativeTime } from '../formatDate';

describe('formatDate', () => {
    it('should format date in YYYY-MM-DD format', () => {
        const date = new Date('2025-11-12T10:30:00');
        expect(formatDate(date)).toBe('2025-11-12');
    });
    
    it('should handle string dates', () => {
        expect(formatDate('2025-11-12')).toBe('2025-11-12');
    });
    
    it('should handle invalid dates', () => {
        expect(formatDate('invalid')).toBe('Invalid Date');
    });
});

describe('formatRelativeTime', () => {
    const now = new Date('2025-11-12T10:30:00');
    
    it('should return "just now" for recent dates', () => {
        const recent = new Date('2025-11-12T10:29:30');
        expect(formatRelativeTime(recent, now)).toBe('just now');
    });
    
    it('should return minutes ago', () => {
        const minutes = new Date('2025-11-12T10:25:00');
        expect(formatRelativeTime(minutes, now)).toBe('5 minutes ago');
    });
    
    it('should return hours ago', () => {
        const hours = new Date('2025-11-12T08:30:00');
        expect(formatRelativeTime(hours, now)).toBe('2 hours ago');
    });
    
    it('should return days ago', () => {
        const days = new Date('2025-11-10T10:30:00');
        expect(formatRelativeTime(days, now)).toBe('2 days ago');
    });
});
```

---

## 5. E2E 테스트

### 5.1 E2E 테스트 확장

```typescript
// frontend/tests/e2e/notifications-flow.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Notification Flow', () => {
    test.beforeEach(async ({ page }) => {
        // 로그인
        await page.goto('/login');
        await page.fill('[name="email"]', 'test@example.com');
        await page.fill('[name="password"]', 'Password123!');
        await page.click('button[type="submit"]');
        await page.waitForURL('/');
    });
    
    test('should receive real-time notification', async ({ page, context }) => {
        // 새 탭에서 다른 사용자 로그인
        const page2 = await context.newPage();
        await page2.goto('/login');
        await page2.fill('[name="email"]', 'user2@example.com');
        await page2.fill('[name="password"]', 'Password123!');
        await page2.click('button[type="submit"]');
        
        // 첫 번째 사용자의 게시물에 좋아요
        await page2.goto('/posts/1');
        await page2.click('button[aria-label="Like"]');
        
        // 첫 번째 사용자가 알림을 받았는지 확인
        await page.waitForSelector('[data-testid="notification-badge"]');
        const badge = await page.textContent('[data-testid="notification-badge"]');
        expect(badge).toBe('1');
        
        // 알림 센터 열기
        await page.click('[data-testid="notification-bell"]');
        await expect(page.locator('text=liked your post')).toBeVisible();
    });
    
    test('should mark notification as read', async ({ page }) => {
        await page.click('[data-testid="notification-bell"]');
        
        const firstNotification = page.locator('[data-testid="notification-item"]').first();
        await firstNotification.click();
        
        // 읽음 처리 확인
        await expect(firstNotification).toHaveClass(/read/);
    });
    
    test('should mark all as read', async ({ page }) => {
        await page.click('[data-testid="notification-bell"]');
        await page.click('button:has-text("Mark all as read")');
        
        // 모든 알림이 읽음 처리되었는지 확인
        const unreadCount = await page.textContent('[data-testid="unread-count"]');
        expect(unreadCount).toBe('0');
    });
});
```

---

## 6. 테스트 실행

### 6.1 백엔드 테스트 실행

```powershell
# 단위 테스트
cd server-backend
npm run test:unit

# 통합 테스트
npm run test

# 커버리지 포함
npm run test:coverage

# 특정 테스트만 실행
npm run test:unit -- notificationService.test.js

# Watch 모드
npm run test:watch
```

### 6.2 프론트엔드 테스트 실행

```powershell
# 단위/통합 테스트
cd frontend
npm run test

# 커버리지 포함
npm run test:coverage

# Watch 모드
npm run test:watch

# UI 모드
npm run test:ui

# E2E 테스트
npm run test:e2e

# E2E 테스트 (UI 모드)
npm run test:e2e:ui
```

### 6.3 전체 테스트 스위트

```powershell
# 백엔드 + 프론트엔드 모든 테스트
.\scripts\run-all-tests.ps1

# CI/CD 파이프라인용
npm run test:ci
```

---

## 7. 커버리지 목표

### 7.1 목표 달성 계획

| 주차  | 작업                          | 목표 커버리지 |
| ----- | ----------------------------- | ------------- |
| 1주차 | 백엔드 단위 테스트 (Services) | 50%           |
| 2주차 | 백엔드 통합 테스트 (API)      | 65%           |
| 3주차 | 프론트엔드 컴포넌트 테스트    | 55%           |
| 4주차 | E2E 테스트 확장               | 70%           |

### 7.2 우선순위별 테스트 작성

#### High Priority (1-2주)
- [ ] notificationService 단위 테스트
- [ ] fileUploadService 단위 테스트
- [ ] authMiddleware 테스트
- [ ] 알림 API 통합 테스트
- [ ] 파일 업로드 API 통합 테스트
- [ ] NotificationBell 컴포넌트 테스트
- [ ] ThemeContext 테스트

#### Medium Priority (3주)
- [ ] Redis 캐싱 테스트
- [ ] Elasticsearch 검색 테스트
- [ ] chatService 단위 테스트
- [ ] 채팅 API 통합 테스트
- [ ] LanguageSwitcher 컴포넌트 테스트
- [ ] NotificationContext 테스트

#### Low Priority (4주)
- [ ] 유틸리티 함수 테스트
- [ ] 추가 E2E 시나리오
- [ ] 성능 테스트
- [ ] 접근성 테스트

---

## 8. 체크리스트

### 백엔드 테스트 ✅
- [ ] notificationService 단위 테스트 작성
- [ ] fileUploadService 단위 테스트 작성
- [ ] redisCacheService 단위 테스트 작성
- [ ] chatService 단위 테스트 작성
- [ ] searchService 단위 테스트 작성
- [ ] authMiddleware 테스트 작성
- [ ] rateLimiter 미들웨어 테스트 작성
- [ ] 알림 API 통합 테스트 작성
- [ ] 파일 업로드 API 통합 테스트 작성
- [ ] 채팅 API 통합 테스트 작성
- [ ] 검색 API 통합 테스트 작성
- [ ] 백엔드 커버리지 70% 달성

### 프론트엔드 테스트 ✅
- [ ] NotificationBell 컴포넌트 테스트
- [ ] LanguageSwitcher 컴포넌트 테스트
- [ ] FileUpload 컴포넌트 테스트
- [ ] ThemeToggleButton 컴포넌트 테스트
- [ ] ThemeContext 테스트
- [ ] NotificationContext 테스트
- [ ] useNotifications 훅 테스트
- [ ] useTheme 훅 테스트
- [ ] formatDate 유틸리티 테스트
- [ ] apiClient 유틸리티 테스트
- [ ] 프론트엔드 커버리지 70% 달성

### E2E 테스트 ✅
- [ ] 알림 플로우 E2E 테스트
- [ ] 채팅 플로우 E2E 테스트
- [ ] 파일 업로드 플로우 E2E 테스트
- [ ] 검색 플로우 E2E 테스트
- [ ] 테마 전환 E2E 테스트
- [ ] 언어 전환 E2E 테스트
- [ ] E2E 커버리지 100%

### CI/CD 통합 ✅
- [ ] GitHub Actions 워크플로우 설정
- [ ] 테스트 자동화
- [ ] 커버리지 리포트 자동 생성
- [ ] PR에 커버리지 코멘트 자동 추가

---

## 🎉 완료 기준

- ✅ 백엔드 테스트 커버리지 70% 이상
- ✅ 프론트엔드 테스트 커버리지 70% 이상
- ✅ E2E 테스트 모든 Critical Path 커버
- ✅ CI/CD 파이프라인에서 자동 실행
- ✅ 모든 테스트 통과

---

**문서 버전:** 1.0.0  
**작성일:** 2025-11-12  
**작성자:** GitHub Copilot

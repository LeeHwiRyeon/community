# 🚀 Community Platform Phase 3 - 실시간 & 고급 기능 구현

**버전**: 3.0.0  
**작성일**: 2025년 11월 12일  
**시작일**: 2025년 11월 12일  
**예상 기간**: 6-8주  
**상태**: 🟢 **진행 중 (DAY 1)**

---

## 📋 목차

1. [Phase 3 개요](#phase-3-개요)
2. [기술 스택 추가](#기술-스택-추가)
3. [개발 우선순위](#개발-우선순위)
4. [상세 구현 계획](#상세-구현-계획)
5. [데이터베이스 설계](#데이터베이스-설계)
6. [API 설계](#api-설계)
7. [일정 계획](#일정-계획)
8. [성능 및 확장성](#성능-및-확장성)

---

## 🎯 Phase 3 개요

### Phase 2 완료 현황
```
✅ 43개 REST API 엔드포인트
✅ 18개 React 컴포넌트/페이지
✅ 13개 데이터베이스 테이블 + 11개 뷰
✅ 11,855 줄의 프로덕션 코드
✅ 완벽한 문서화 및 API 테스트
✅ 프로덕션 배포 준비 완료
```

### Phase 3 목표
**실시간 통신**과 **고급 기능**으로 엔터프라이즈급 플랫폼 완성

**8대 핵심 기능**:
1. 🔔 **실시간 알림 시스템** (WebSocket)
2. 💬 **1:1 채팅 시스템** (Socket.io)
3. 📁 **파일 업로드 시스템** (이미지/첨부파일)
4. 🔍 **고급 검색 시스템** (Elasticsearch)
5. 👤 **프로필 커스터마이징**
6. 🌙 **다크 모드**
7. 🌐 **다국어 지원** (i18n)
8. 📊 **성능 최적화** (Redis 캐싱)

---

## 🛠️ 기술 스택 추가

### 새로 도입할 기술

| 카테고리        | 기술              | 버전  | 용도                       | 우선순위 |
| --------------- | ----------------- | ----- | -------------------------- | -------- |
| **실시간 통신** | Socket.io         | 4.x   | WebSocket 기반 실시간 통신 | ⭐⭐⭐      |
| **캐싱**        | Redis             | 7.x   | 세션, 캐싱, Pub/Sub        | ⭐⭐⭐      |
| **검색 엔진**   | Elasticsearch     | 8.x   | 전문 검색 및 분석          | ⭐⭐       |
| **파일 저장소** | AWS S3 / MinIO    | -     | 이미지 및 파일 저장        | ⭐⭐⭐      |
| **이미지 처리** | Sharp             | 0.33+ | 이미지 리사이징, 썸네일    | ⭐⭐⭐      |
| **다국어**      | react-i18next     | 13.x  | 다국어 지원                | ⭐⭐       |
| **상태 관리**   | Zustand           | 4.x   | 글로벌 상태 관리           | ⭐⭐       |
| **테마 관리**   | styled-components | 6.x   | 다크 모드 구현             | ⭐⭐       |
| **파일 업로드** | multer            | 1.4+  | 파일 업로드 미들웨어       | ⭐⭐⭐      |
| **PDF 생성**    | pdfkit            | 0.14+ | 리포트 PDF 생성            | ⭐        |

### 기존 기술 스택 (유지)
```
Frontend:  React 18, TypeScript, Material-UI, Chakra UI
Backend:   Node.js 18, Express.js, MySQL 8.0
DevOps:    Docker, Docker Compose
Auth:      JWT Bearer Token
```

---

## 📊 개발 우선순위

### P0 (최우선 - Week 1-2)
```
1️⃣ 실시간 알림 시스템 (WebSocket)
   - Socket.io 서버 설정
   - 알림 DB 테이블 생성
   - 알림 UI 컴포넌트
   - 실시간 푸시 구현
   
2️⃣ 파일 업로드 시스템
   - Multer 미들웨어 설정
   - 이미지 리사이징 (Sharp)
   - S3/MinIO 연동
   - 업로드 UI
```

### P1 (중요 - Week 3-4)
```
3️⃣ 1:1 채팅 시스템
   - Socket.io 채팅 서버
   - 채팅방 관리
   - 메시지 히스토리
   - 읽음 표시
   
4️⃣ Redis 캐싱 도입
   - Redis 컨테이너 설정
   - 세션 저장소
   - API 응답 캐싱
   - 실시간 데이터 캐싱
```

### P2 (보통 - Week 5-6)
```
5️⃣ 고급 검색 (Elasticsearch)
   - Elasticsearch 컨테이너
   - 데이터 인덱싱
   - 자동완성 API
   - 검색 UI 개선
   
6️⃣ 프로필 커스터마이징
   - 프로필 사진 업로드
   - 커버 이미지
   - 자기소개
   - 배지 시스템
```

### P3 (추가 - Week 7-8)
```
7️⃣ 다크 모드
   - 테마 컨텍스트
   - CSS 변수 기반 테마
   - 테마 전환 애니메이션
   
8️⃣ 다국어 지원
   - react-i18next 설정
   - 번역 파일 (ko, en)
   - 언어 전환 UI
```

---

## 📝 상세 구현 계획

### 1️⃣ 실시간 알림 시스템 (5일)

#### 📦 **Backend 구현 (3일)**

**1.1 Socket.io 서버 설정**
```javascript
// server-backend/socketServer.js
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

function initializeSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true
    }
  });

  // JWT 인증 미들웨어
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  // 연결 이벤트
  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected`);
    
    // 사용자별 룸 참가
    socket.join(`user:${socket.userId}`);
    
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });

  return io;
}

module.exports = { initializeSocketServer };
```

**1.2 데이터베이스 마이그레이션**
```sql
-- migrations/add_notification_system.sql

-- 알림 타입 ENUM
CREATE TABLE notification_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type_name VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255),
  icon VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO notification_types (type_name, description, icon) VALUES
('new_follower', '새로운 팔로워', 'person_add'),
('new_comment', '새 댓글', 'comment'),
('comment_reply', '댓글 답글', 'reply'),
('post_like', '게시물 좋아요', 'thumb_up'),
('mention', '멘션', 'alternate_email'),
('moderator_action', '모더레이터 조치', 'gavel'),
('system', '시스템 알림', 'notifications');

-- 알림 테이블
CREATE TABLE notifications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  link VARCHAR(500),
  
  -- 발신자 정보
  sender_id INT,
  sender_name VARCHAR(100),
  sender_avatar VARCHAR(500),
  
  -- 상태
  is_read BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  
  -- 메타데이터 (JSON)
  metadata JSON,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL,
  
  INDEX idx_user_created (user_id, created_at DESC),
  INDEX idx_user_unread (user_id, is_read, created_at DESC),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (type_id) REFERENCES notification_types(id),
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 알림 설정 테이블
CREATE TABLE notification_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  
  -- 알림 타입별 설정 (JSON)
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  
  -- 타입별 활성화
  new_follower_enabled BOOLEAN DEFAULT TRUE,
  new_comment_enabled BOOLEAN DEFAULT TRUE,
  comment_reply_enabled BOOLEAN DEFAULT TRUE,
  post_like_enabled BOOLEAN DEFAULT TRUE,
  mention_enabled BOOLEAN DEFAULT TRUE,
  moderator_action_enabled BOOLEAN DEFAULT TRUE,
  system_enabled BOOLEAN DEFAULT TRUE,
  
  -- 조용한 시간
  quiet_hours_start TIME DEFAULT NULL,
  quiet_hours_end TIME DEFAULT NULL,
  
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 알림 통계 뷰
CREATE VIEW v_notification_stats AS
SELECT 
  user_id,
  COUNT(*) as total_notifications,
  SUM(CASE WHEN is_read = FALSE THEN 1 ELSE 0 END) as unread_count,
  MAX(created_at) as last_notification_at
FROM notifications
WHERE is_deleted = FALSE
GROUP BY user_id;
```

**1.3 알림 서비스**
```javascript
// server-backend/services/notificationService.js
const db = require('../config/database');

class NotificationService {
  // 알림 생성
  async createNotification(data) {
    const { userId, typeId, title, message, link, senderId, metadata } = data;
    
    const [result] = await db.query(`
      INSERT INTO notifications 
      (user_id, type_id, title, message, link, sender_id, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [userId, typeId, title, message, link, senderId, JSON.stringify(metadata)]);
    
    return result.insertId;
  }
  
  // 실시간 알림 전송 (Socket.io)
  async sendRealtimeNotification(io, userId, notification) {
    io.to(`user:${userId}`).emit('notification', notification);
  }
  
  // 대량 알림 생성 (팔로워에게 알림)
  async notifyFollowers(userId, notification) {
    const [followers] = await db.query(`
      SELECT follower_id FROM user_follows WHERE following_id = ?
    `, [userId]);
    
    for (const follower of followers) {
      await this.createNotification({
        ...notification,
        userId: follower.follower_id
      });
    }
  }
  
  // 알림 목록 조회
  async getNotifications(userId, { page = 1, limit = 20, unreadOnly = false }) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        n.*,
        nt.type_name,
        nt.icon,
        u.username as sender_username,
        u.avatar_url as sender_avatar
      FROM notifications n
      JOIN notification_types nt ON n.type_id = nt.id
      LEFT JOIN users u ON n.sender_id = u.id
      WHERE n.user_id = ? AND n.is_deleted = FALSE
    `;
    
    if (unreadOnly) {
      query += ' AND n.is_read = FALSE';
    }
    
    query += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';
    
    const [notifications] = await db.query(query, [userId, limit, offset]);
    
    // 총 개수
    const [countResult] = await db.query(`
      SELECT COUNT(*) as total FROM notifications 
      WHERE user_id = ? AND is_deleted = FALSE ${unreadOnly ? 'AND is_read = FALSE' : ''}
    `, [userId]);
    
    return {
      notifications,
      pagination: {
        total: countResult[0].total,
        page,
        limit,
        pages: Math.ceil(countResult[0].total / limit)
      }
    };
  }
  
  // 읽음 처리
  async markAsRead(notificationId, userId) {
    await db.query(`
      UPDATE notifications 
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `, [notificationId, userId]);
  }
  
  // 모두 읽음 처리
  async markAllAsRead(userId) {
    await db.query(`
      UPDATE notifications 
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND is_read = FALSE
    `, [userId]);
  }
  
  // 알림 삭제
  async deleteNotification(notificationId, userId) {
    await db.query(`
      UPDATE notifications 
      SET is_deleted = TRUE
      WHERE id = ? AND user_id = ?
    `, [notificationId, userId]);
  }
  
  // 읽지 않은 알림 수
  async getUnreadCount(userId) {
    const [result] = await db.query(`
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE user_id = ? AND is_read = FALSE AND is_deleted = FALSE
    `, [userId]);
    
    return result[0].count;
  }
}

module.exports = new NotificationService();
```

**1.4 알림 API 라우트**
```javascript
// server-backend/routes/notifications.js
const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const { authenticateToken } = require('../middleware/auth');

// 알림 목록 조회
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page, limit, unreadOnly } = req.query;
    const result = await notificationService.getNotifications(req.user.userId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      unreadOnly: unreadOnly === 'true'
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 읽지 않은 알림 수
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.userId);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 알림 읽음 처리
router.put('/:notificationId/read', authenticateToken, async (req, res) => {
  try {
    await notificationService.markAsRead(req.params.notificationId, req.user.userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 모두 읽음 처리
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.user.userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 알림 삭제
router.delete('/:notificationId', authenticateToken, async (req, res) => {
  try {
    await notificationService.deleteNotification(req.params.notificationId, req.user.userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

#### 🎨 **Frontend 구현 (2일)**

**2.1 Socket.io 클라이언트**
```typescript
// frontend/src/services/socketService.ts
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  
  connect(token: string) {
    this.socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:50000', {
      auth: { token }
    });
    
    this.socket.on('connect', () => {
      console.log('Socket connected');
    });
    
    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
    
    this.socket.on('notification', (notification) => {
      // 알림 수신 처리
      this.handleNotification(notification);
    });
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  private handleNotification(notification: any) {
    // 브라우저 알림 표시
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo192.png',
        badge: '/logo192.png'
      });
    }
    
    // 커스텀 이벤트 발생
    window.dispatchEvent(new CustomEvent('new-notification', { detail: notification }));
  }
  
  getSocket() {
    return this.socket;
  }
}

export default new SocketService();
```

**2.2 알림 컴포넌트**
```typescript
// frontend/src/components/NotificationBell.tsx
import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Box,
  Text,
  Avatar,
  Flex,
  Button,
  useToast
} from '@chakra-ui/react';
import { BellIcon } from '@chakra-ui/icons';
import socketService from '../services/socketService';

interface Notification {
  id: number;
  title: string;
  message: string;
  link: string;
  is_read: boolean;
  sender_username: string;
  sender_avatar: string;
  created_at: string;
  icon: string;
}

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const toast = useToast();
  
  useEffect(() => {
    // 초기 알림 로드
    loadNotifications();
    loadUnreadCount();
    
    // 실시간 알림 리스너
    const handleNewNotification = (event: any) => {
      const notification = event.detail;
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // 토스트 알림
      toast({
        title: notification.title,
        description: notification.message,
        status: 'info',
        duration: 5000,
        isClosable: true,
        position: 'top-right'
      });
    };
    
    window.addEventListener('new-notification', handleNewNotification);
    
    return () => {
      window.removeEventListener('new-notification', handleNewNotification);
    };
  }, []);
  
  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?limit=10', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setNotifications(data.notifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };
  
  const loadUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/unread-count', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };
  
  const markAsRead = async (notificationId: number) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };
  
  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };
  
  return (
    <Menu>
      <MenuButton
        as={IconButton}
        icon={
          <Badge colorScheme="red" variant={unreadCount > 0 ? 'solid' : 'subtle'}>
            {unreadCount > 0 && (
              <Box position="absolute" top="-5px" right="-5px" fontSize="xs">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Box>
            )}
            <BellIcon boxSize={5} />
          </Badge>
        }
        variant="ghost"
        aria-label="Notifications"
      />
      <MenuList maxH="400px" overflowY="auto" w="350px">
        <Flex justify="space-between" align="center" px={4} py={2} borderBottomWidth="1px">
          <Text fontWeight="bold">알림</Text>
          {unreadCount > 0 && (
            <Button size="xs" variant="ghost" onClick={markAllAsRead}>
              모두 읽음
            </Button>
          )}
        </Flex>
        
        {notifications.length === 0 ? (
          <Box p={4} textAlign="center" color="gray.500">
            알림이 없습니다
          </Box>
        ) : (
          notifications.map(notification => (
            <MenuItem
              key={notification.id}
              py={3}
              bg={!notification.is_read ? 'blue.50' : 'white'}
              _hover={{ bg: 'gray.50' }}
              onClick={() => {
                markAsRead(notification.id);
                if (notification.link) {
                  window.location.href = notification.link;
                }
              }}
            >
              <Flex align="center" w="full">
                <Avatar
                  size="sm"
                  src={notification.sender_avatar}
                  name={notification.sender_username}
                  mr={3}
                />
                <Box flex="1">
                  <Text fontWeight={!notification.is_read ? 'bold' : 'normal'} fontSize="sm">
                    {notification.title}
                  </Text>
                  <Text fontSize="xs" color="gray.600" noOfLines={2}>
                    {notification.message}
                  </Text>
                  <Text fontSize="xs" color="gray.400" mt={1}>
                    {new Date(notification.created_at).toLocaleString('ko-KR')}
                  </Text>
                </Box>
              </Flex>
            </MenuItem>
          ))
        )}
        
        <Button
          w="full"
          variant="ghost"
          size="sm"
          onClick={() => window.location.href = '/notifications'}
        >
          모든 알림 보기
        </Button>
      </MenuList>
    </Menu>
  );
};
```

---

### 2️⃣ 파일 업로드 시스템 (4일)
- 알림 타입별 분류 (댓글, 좋아요, 멘션, 팔로우)
- 읽음/안읽음 상태 관리
- 알림 설정 (켜기/끄기, 타입별 제어)
- 브라우저 푸시 알림 (선택)

**기술 스택**:
- Backend: Socket.IO, Redis Pub/Sub
- Frontend: Socket.IO Client, React Context
- Database: MySQL (알림 저장)

**산출물**:
- `server-backend/services/notification-service.js`
- `server-backend/sockets/notification-socket.js`
- `frontend/src/contexts/NotificationContext.tsx`
- `frontend/src/components/NotificationCenter.tsx`

---

#### 1.2 고급 검색 시스템 ⭐⭐⭐
**우선순위**: P0 (최고)  
**예상 기간**: 4일  
**담당**: Backend + Frontend

**주요 기능**:
- 전체 검색 (게시물, 댓글, 사용자)
- 고급 필터링 (날짜, 카테고리, 태그, 작성자)
- 자동 완성 (Autocomplete)
- 검색 히스토리
- 인기 검색어

**기술 스택**:
- Backend: Elasticsearch (또는 MySQL Full-Text Search)
- Frontend: React Query, Debounce
- Caching: Redis

**산출물**:
- `server-backend/services/search-service.js`
- `server-backend/routes/search.js`
- `frontend/src/components/SearchBar.tsx`
- `frontend/src/components/SearchResults.tsx`

---

#### 1.3 사용자 프로필 v2 ⭐⭐
**우선순위**: P1 (높음)  
**예상 기간**: 3일  
**담당**: Frontend

**주요 기능**:
- 프로필 커스터마이징 (배경 이미지, 테마 색상)
- 활동 통계 (게시물, 댓글, 좋아요 수)
- 배지 시스템 (업적, 등급)
- 소셜 링크 (SNS, 웹사이트)
- 프로필 공개/비공개 설정

**산출물**:
- `frontend/src/components/ProfileV2.tsx`
- `frontend/src/components/ProfileSettings.tsx`
- `frontend/src/components/BadgeDisplay.tsx`

---

### 2단계: 커뮤니티 활성화 (2주)

#### 2.1 콘텐츠 추천 엔진 ⭐⭐⭐
**우선순위**: P1 (높음)  
**예상 기간**: 5일  
**담당**: Backend + Data Analyst

**주요 기능**:
- 개인화된 게시물 추천
- 유사 콘텐츠 추천
- 인기 트렌드 분석
- 사용자 관심사 기반 추천
- A/B 테스트 지원

**알고리즘**:
1. **협업 필터링** (Collaborative Filtering)
   - 사용자 기반: 비슷한 행동 패턴의 사용자 찾기
   - 아이템 기반: 유사한 콘텐츠 찾기

2. **콘텐츠 기반 필터링** (Content-Based)
   - 태그, 카테고리 유사도
   - TF-IDF 텍스트 분석

3. **하이브리드 방식**
   - 협업 + 콘텐츠 기반 결합
   - 가중치 조정

**기술 스택**:
- Backend: Python (scikit-learn, pandas)
- API: Express.js (Python 연동)
- Database: Redis (추천 캐싱)

**산출물**:
- `ml-service/recommendation_engine.py`
- `server-backend/services/recommendation-service.js`
- `frontend/src/components/RecommendedPosts.tsx`

---

#### 2.2 사용자 활동 분석 대시보드 ⭐⭐
**우선순위**: P1 (높음)  
**예상 기간**: 4일  
**담당**: Frontend + Backend

**주요 기능**:
- 개인 활동 통계 (일별, 주별, 월별)
- 인기 게시물 순위
- 커뮤니티 성장 지표
- 사용자 참여도 분석
- 데이터 시각화 (차트, 그래프)

**산출물**:
- `frontend/src/components/AnalyticsDashboard.tsx`
- `frontend/src/components/ActivityChart.tsx`
- `server-backend/routes/analytics.js`

---

#### 2.3 소셜 기능 강화 ⭐⭐
**우선순위**: P2 (중간)  
**예상 기간**: 3일  
**담당**: Backend + Frontend

**주요 기능**:
- 팔로우/언팔로우 시스템
- 친구 추천
- 멘션 기능 (@username)
- 게시물 공유 (외부 SNS)
- 사용자 차단 기능

**산출물**:
- `server-backend/services/social-service.js`
- `frontend/src/components/FollowButton.tsx`
- `frontend/src/components/ShareDialog.tsx`

---

### 3단계: 모바일 및 성능 최적화 (2주)

#### 3.1 Progressive Web App (PWA) ⭐⭐⭐
**우선순위**: P1 (높음)  
**예상 기간**: 4일  
**담당**: Frontend

**주요 기능**:
- 오프라인 지원
- 앱 설치 (Add to Home Screen)
- 푸시 알림
- 백그라운드 동기화
- 캐싱 전략

**기술 스택**:
- Service Worker
- Workbox
- Web Push API

**산출물**:
- `frontend/public/sw.js`
- `frontend/src/service-worker-registration.ts`
- `frontend/public/manifest.json`

---

#### 3.2 반응형 디자인 개선 ⭐⭐
**우선순위**: P1 (높음)  
**예상 기간**: 3일  
**담당**: Frontend

**주요 기능**:
- 모바일 최적화 레이아웃
- 터치 제스처 지원
- 하단 네비게이션 (모바일)
- 이미지 지연 로딩
- 무한 스크롤 최적화

**산출물**:
- `frontend/src/components/MobileLayout.tsx`
- `frontend/src/components/BottomNavigation.tsx`

---

#### 3.3 성능 최적화 ⭐⭐⭐
**우선순위**: P0 (최고)  
**예상 기간**: 5일  
**담당**: Full Stack

**주요 항목**:
- **Frontend**:
  - Code Splitting
  - Lazy Loading
  - Image Optimization (WebP, lazy loading)
  - React.memo, useMemo 최적화
  - Bundle Size 축소

- **Backend**:
  - Database 쿼리 최적화
  - Redis 캐싱 강화
  - Connection Pool 조정
  - API Response 압축

- **Infrastructure**:
  - CDN 연동
  - Load Balancer 설정
  - Gzip/Brotli 압축

**산출물**:
- `PERFORMANCE_OPTIMIZATION_REPORT.md`
- 최적화된 빌드 설정

---

## 🛠️ 기술 스택

### 신규 추가 기술

#### 1. 실시간 통신
- **Socket.IO** (v4.x): WebSocket 라이브러리
- **Redis Pub/Sub**: 멀티 서버 실시간 동기화

#### 2. 검색 엔진
- **Elasticsearch** (v8.x) 또는 **MySQL Full-Text Search**
- **Redis**: 검색 결과 캐싱

#### 3. 추천 시스템
- **Python** (v3.11+)
- **scikit-learn**: 머신러닝 라이브러리
- **pandas**: 데이터 처리
- **Flask/FastAPI**: Python API 서버

#### 4. 데이터 시각화
- **Recharts**: React 차트 라이브러리
- **Chart.js**: 범용 차트 라이브러리

#### 5. PWA
- **Workbox**: Service Worker 도구
- **Web Push API**: 푸시 알림

---

## 📅 일정 계획

### 1주차: 실시간 알림 + 검색 시스템
| 일  | 작업 내용           | 담당     | 예상 시간 |
| --- | ------------------- | -------- | --------- |
| 월  | WebSocket 서버 구축 | Backend  | 1일       |
| 화  | 알림 서비스 구현    | Backend  | 1일       |
| 수  | 알림 UI 컴포넌트    | Frontend | 1일       |
| 목  | 검색 서비스 구현    | Backend  | 1일       |
| 금  | 검색 UI 컴포넌트    | Frontend | 1일       |

### 2주차: 프로필 v2 + 추천 엔진
| 일  | 작업 내용          | 담당             | 예상 시간 |
| --- | ------------------ | ---------------- | --------- |
| 월  | 프로필 v2 UI       | Frontend         | 1일       |
| 화  | 배지 시스템        | Backend/Frontend | 1일       |
| 수  | 추천 알고리즘 연구 | Data             | 1일       |
| 목  | 추천 엔진 구현     | Backend          | 1일       |
| 금  | 추천 UI 통합       | Frontend         | 1일       |

### 3주차: 활동 분석 + 소셜 기능
| 일  | 작업 내용     | 담당             | 예상 시간 |
| --- | ------------- | ---------------- | --------- |
| 월  | 분석 API 구현 | Backend          | 1일       |
| 화  | 대시보드 UI   | Frontend         | 1일       |
| 수  | 팔로우 시스템 | Backend          | 1일       |
| 목  | 멘션 기능     | Backend/Frontend | 1일       |
| 금  | 소셜 기능 UI  | Frontend         | 1일       |

### 4주차: PWA + 성능 최적화
| 일  | 작업 내용              | 담당     | 예상 시간 |
| --- | ---------------------- | -------- | --------- |
| 월  | Service Worker 구현    | Frontend | 1일       |
| 화  | PWA 설정 완료          | Frontend | 1일       |
| 수  | 반응형 디자인 개선     | Frontend | 1일       |
| 목  | 성능 최적화 (Frontend) | Frontend | 1일       |
| 금  | 성능 최적화 (Backend)  | Backend  | 1일       |

---

## 🔍 상세 기획

### 1. 실시간 알림 시스템

#### 1.1 알림 타입
```typescript
enum NotificationType {
  COMMENT = 'comment',           // 댓글 알림
  LIKE = 'like',                // 좋아요 알림
  MENTION = 'mention',          // 멘션 알림
  FOLLOW = 'follow',            // 팔로우 알림
  REPLY = 'reply',              // 답글 알림
  SYSTEM = 'system'             // 시스템 알림
}
```

#### 1.2 알림 데이터 구조
```typescript
interface Notification {
  id: string;
  userId: string;              // 수신자 ID
  type: NotificationType;
  title: string;
  message: string;
  data: {                      // 타입별 추가 데이터
    postId?: string;
    commentId?: string;
    fromUserId?: string;
    fromUsername?: string;
  };
  isRead: boolean;
  createdAt: Date;
}
```

#### 1.3 WebSocket 이벤트
```typescript
// Client → Server
socket.emit('subscribe', { userId });
socket.emit('markAsRead', { notificationId });
socket.emit('markAllAsRead', { userId });

// Server → Client
socket.on('notification', (notification: Notification) => {});
socket.on('notificationCount', (count: number) => {});
```

#### 1.4 API 엔드포인트
```
GET    /api/notifications          - 알림 목록 조회
GET    /api/notifications/count    - 안읽은 알림 개수
PUT    /api/notifications/:id/read - 알림 읽음 처리
PUT    /api/notifications/read-all - 모든 알림 읽음
DELETE /api/notifications/:id      - 알림 삭제
GET    /api/notifications/settings - 알림 설정 조회
PUT    /api/notifications/settings - 알림 설정 변경
```

#### 1.5 UI/UX
- **알림 센터**: 헤더 우측 벨 아이콘
- **배지**: 안읽은 알림 개수 표시
- **드롭다운**: 최근 알림 5개 미리보기
- **전체 페이지**: 모든 알림 목록

---

### 2. 고급 검색 시스템

#### 2.1 검색 타입
```typescript
enum SearchType {
  ALL = 'all',           // 전체 검색
  POSTS = 'posts',       // 게시물
  COMMENTS = 'comments', // 댓글
  USERS = 'users',       // 사용자
  TAGS = 'tags'          // 태그
}
```

#### 2.2 검색 필터
```typescript
interface SearchFilters {
  type: SearchType;
  query: string;
  dateFrom?: Date;
  dateTo?: Date;
  category?: string;
  tags?: string[];
  authorId?: string;
  sortBy?: 'relevance' | 'date' | 'popularity';
  page?: number;
  limit?: number;
}
```

#### 2.3 검색 결과 구조
```typescript
interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  searchTime: number;    // 검색 소요 시간 (ms)
  suggestions: string[]; // 추천 검색어
}
```

#### 2.4 API 엔드포인트
```
GET /api/search                 - 검색 실행
GET /api/search/autocomplete    - 자동완성
GET /api/search/history         - 검색 히스토리
GET /api/search/popular         - 인기 검색어
DELETE /api/search/history/:id  - 히스토리 삭제
```

#### 2.5 검색 알고리즘
1. **Full-Text Search** (MySQL)
   ```sql
   SELECT *, MATCH(title, content) AGAINST ('검색어' IN NATURAL LANGUAGE MODE) AS score
   FROM posts
   WHERE MATCH(title, content) AGAINST ('검색어' IN NATURAL LANGUAGE MODE)
   ORDER BY score DESC;
   ```

2. **Fuzzy Search** (유사 검색)
   - Levenshtein Distance 알고리즘
   - 오타 허용 검색

3. **가중치 적용**
   - 제목: 3배
   - 내용: 1배
   - 태그: 2배
   - 최신 게시물: +보너스

---

### 3. 콘텐츠 추천 엔진

#### 3.1 추천 알고리즘

##### A. 협업 필터링 (Collaborative Filtering)
```python
from sklearn.neighbors import NearestNeighbors

def collaborative_filtering(user_id, n_recommendations=10):
    # 사용자-아이템 행렬 생성
    user_item_matrix = create_user_item_matrix()
    
    # KNN 모델 학습
    model = NearestNeighbors(metric='cosine', algorithm='brute')
    model.fit(user_item_matrix)
    
    # 유사 사용자 찾기
    distances, indices = model.kneighbors([user_item_matrix[user_id]], n_neighbors=11)
    
    # 추천 아이템 생성
    recommendations = generate_recommendations(indices, n_recommendations)
    return recommendations
```

##### B. 콘텐츠 기반 필터링 (Content-Based)
```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def content_based_filtering(post_id, n_recommendations=10):
    # TF-IDF 벡터화
    posts = get_all_posts()
    vectorizer = TfidfVectorizer(max_features=1000)
    tfidf_matrix = vectorizer.fit_transform([p.content for p in posts])
    
    # 코사인 유사도 계산
    similarities = cosine_similarity(tfidf_matrix[post_id], tfidf_matrix)
    
    # 상위 유사 게시물 반환
    similar_indices = similarities.argsort()[0][-n_recommendations-1:-1][::-1]
    return [posts[i] for i in similar_indices]
```

##### C. 하이브리드 추천
```python
def hybrid_recommendation(user_id, n_recommendations=10):
    # 협업 필터링 (50%)
    collab_recs = collaborative_filtering(user_id, n_recommendations * 2)
    
    # 콘텐츠 기반 (30%)
    content_recs = content_based_filtering_for_user(user_id, n_recommendations * 2)
    
    # 인기도 기반 (20%)
    popular_recs = get_popular_posts(n_recommendations)
    
    # 가중 평균으로 결합
    final_recs = weighted_merge(
        collab_recs * 0.5,
        content_recs * 0.3,
        popular_recs * 0.2
    )
    
    return final_recs[:n_recommendations]
```

#### 3.2 추천 데이터 수집
```typescript
interface UserActivity {
  userId: string;
  postId: string;
  action: 'view' | 'like' | 'comment' | 'share';
  duration?: number;  // 조회 시간 (초)
  timestamp: Date;
}
```

#### 3.3 API 엔드포인트
```
GET /api/recommendations/posts     - 게시물 추천
GET /api/recommendations/users     - 사용자 추천
GET /api/recommendations/tags      - 태그 추천
POST /api/recommendations/feedback - 추천 피드백 (좋아요/싫어요)
```

---

### 4. 사용자 활동 분석 대시보드

#### 4.1 분석 지표

##### A. 개인 활동 통계
```typescript
interface UserStats {
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
  totalViews: number;
  followersCount: number;
  followingCount: number;
  activityScore: number;    // 활동 점수
  rank: number;             // 순위
  badges: Badge[];          // 획득한 배지
}
```

##### B. 시계열 데이터
```typescript
interface ActivityTimeSeries {
  date: string;
  posts: number;
  comments: number;
  likes: number;
  views: number;
}
```

##### C. 커뮤니티 통계
```typescript
interface CommunityStats {
  totalUsers: number;
  activeUsers: number;      // 최근 7일 활동
  totalPosts: number;
  totalComments: number;
  growthRate: number;       // 성장률 (%)
  engagementRate: number;   // 참여율 (%)
}
```

#### 4.2 데이터 시각화
- **선 그래프**: 시간별 활동 추이
- **막대 그래프**: 카테고리별 게시물 수
- **도넛 차트**: 활동 유형 비율
- **히트맵**: 요일/시간별 활동 패턴

#### 4.3 API 엔드포인트
```
GET /api/analytics/user/:id         - 개인 통계
GET /api/analytics/user/:id/trend   - 활동 추이
GET /api/analytics/community        - 커뮤니티 통계
GET /api/analytics/popular          - 인기 콘텐츠
GET /api/analytics/leaderboard      - 리더보드
```

---

### 5. Progressive Web App (PWA)

#### 5.1 Service Worker 전략
```javascript
// Cache-First 전략 (정적 리소스)
workbox.routing.registerRoute(
  /\.(?:js|css|png|jpg|jpeg|svg|gif)$/,
  new workbox.strategies.CacheFirst({
    cacheName: 'static-resources',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30일
      }),
    ],
  })
);

// Network-First 전략 (API)
workbox.routing.registerRoute(
  /\/api\//,
  new workbox.strategies.NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5분
      }),
    ],
  })
);
```

#### 5.2 Manifest.json
```json
{
  "name": "Community Platform",
  "short_name": "Community",
  "description": "소셜 커뮤니티 플랫폼",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4f46e5",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

#### 5.3 오프라인 지원
- **오프라인 페이지**: 네트워크 없을 때 표시
- **백그라운드 동기화**: 온라인 복귀 시 자동 동기화
- **읽기 모드**: 캐시된 콘텐츠 읽기

---

## ⚠️ 리스크 관리

### 1. 기술적 리스크

#### 1.1 WebSocket 확장성
**문제**: 동시 접속자 증가 시 서버 부하  
**해결책**:
- Redis Pub/Sub로 멀티 서버 지원
- Socket.IO Adapter 사용
- 로드 밸런서 설정

#### 1.2 추천 엔진 성능
**문제**: 실시간 추천 계산 시간  
**해결책**:
- 오프라인 배치 처리 (매 1시간)
- Redis 캐싱
- 사전 계산된 추천 사용

#### 1.3 검색 성능
**문제**: 대용량 데이터 검색 지연  
**해결책**:
- Elasticsearch 도입
- 인덱싱 최적화
- 검색 결과 캐싱

### 2. 운영 리스크

#### 2.1 데이터 증가
**문제**: 알림, 활동 로그 데이터 급증  
**해결책**:
- 데이터 보관 정책 (90일)
- 아카이빙 시스템
- 자동 정리 스크립트

#### 2.2 사용자 부하
**문제**: 트래픽 급증 시 서버 다운  
**해결책**:
- CDN 연동
- 캐싱 강화
- Auto Scaling

---

## 📊 성공 지표 (KPI)

### 1. 사용자 참여도
- **Daily Active Users (DAU)**: 일일 활성 사용자 수
- **Monthly Active Users (MAU)**: 월간 활성 사용자 수
- **Retention Rate**: 재방문율 (7일, 30일)

### 2. 콘텐츠 활동
- **Posts per User**: 사용자당 게시물 수
- **Comments per Post**: 게시물당 댓글 수
- **Engagement Rate**: 참여율 (좋아요, 댓글, 공유)

### 3. 기술 지표
- **Page Load Time**: 페이지 로딩 시간 (< 2초)
- **API Response Time**: API 응답 시간 (< 200ms)
- **Error Rate**: 에러율 (< 1%)
- **Uptime**: 가동률 (> 99.9%)

---

## 📚 참고 자료

### 실시간 통신
- Socket.IO 공식 문서: https://socket.io/docs/
- Redis Pub/Sub: https://redis.io/docs/manual/pubsub/

### 추천 시스템
- Collaborative Filtering: https://en.wikipedia.org/wiki/Collaborative_filtering
- scikit-learn: https://scikit-learn.org/

### PWA
- Web.dev PWA: https://web.dev/progressive-web-apps/
- Workbox: https://developers.google.com/web/tools/workbox

### 성능 최적화
- Web Vitals: https://web.dev/vitals/
- Lighthouse: https://developers.google.com/web/tools/lighthouse

---

**작성자**: AUTOAGENTS  
**최종 업데이트**: 2025년 11월 9일  
**다음 검토일**: 2025년 11월 16일

---

© 2025 LeeHwiRyeon. All rights reserved.

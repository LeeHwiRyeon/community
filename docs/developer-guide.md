# 개발자 작업 가이드

## 📋 개요
Community Platform v1.3의 개발자 작업 가이드입니다. 실제 구현에 필요한 코드 예시와 기술적 세부사항을 제공합니다.

## 🚀 개발 환경 설정

### 필수 도구 설치
```bash
# Node.js 설치 (v18.x 이상)
node --version

# npm 설치 확인
npm --version

# 프로젝트 클론
git clone https://github.com/your-repo/community-platform.git
cd community-platform

# 의존성 설치
npm install
```

### 환경 변수 설정
```bash
# .env 파일 생성
touch .env

# 환경 변수 설정
echo "NODE_ENV=development" >> .env
echo "PORT=3000" >> .env
echo "DATABASE_URL=postgresql://user:password@localhost:5432/community" >> .env
echo "JWT_SECRET=your-secret-key" >> .env
echo "REDIS_URL=redis://localhost:6379" >> .env
```

## 🎯 핵심 기능 구현

### 1. 실시간 채팅 시스템

#### WebSocket 서버 설정
```javascript
// server-backend/websocket-server/index.js
const io = require('socket.io')(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// 연결 처리
io.on('connection', (socket) => {
  console.log('사용자 연결:', socket.id);
  
  // 채팅방 입장
  socket.on('join_room', (data) => {
    const { roomId, token, timestamp } = data;
    
    // 토큰 검증
    if (!verifyToken(token)) {
      socket.emit('error', { message: '인증 실패' });
      return;
    }
    
    socket.join(roomId);
    socket.emit('joined_room', { roomId });
  });
  
  // 메시지 전송
  socket.on('send_message', (data) => {
    const { roomId, encryptedMessage, fileMetadata } = data;
    
    // 메시지 브로드캐스트
    socket.to(roomId).emit('receive_message', {
      id: generateId(),
      roomId,
      senderId: socket.userId,
      encryptedMessage,
      fileMetadata,
      timestamp: Date.now()
    });
  });
  
  // 연결 해제
  socket.on('disconnect', () => {
    console.log('사용자 연결 해제:', socket.id);
  });
});
```

#### 클라이언트 WebSocket 연결
```typescript
// frontend/src/hooks/useWebSocket.ts
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (message: any) => void;
  joinRoom: (roomId: string) => void;
}

export const useWebSocket = (): UseWebSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    const newSocket = io('ws://localhost:5000', {
      transports: ['websocket'],
      upgrade: false,
      perMessageDeflate: true,
      handshakeTimeout: 10000,
      maxPayload: 1000000
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      reconnectAttempts.current = 0;
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      
      // 지수 백오프로 재연결
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.pow(2, reconnectAttempts.current) * 1000;
        setTimeout(() => {
          reconnectAttempts.current++;
          newSocket.connect();
        }, delay);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const sendMessage = (message: any) => {
    if (socket && isConnected) {
      socket.emit('send_message', message);
    }
  };

  const joinRoom = (roomId: string) => {
    if (socket && isConnected) {
      const token = localStorage.getItem('authToken');
      socket.emit('join_room', {
        roomId,
        token,
        timestamp: Date.now()
      });
    }
  };

  return { socket, isConnected, sendMessage, joinRoom };
};
```

### 2. 메시지 암호화 시스템

#### 암호화 유틸리티
```typescript
// frontend/src/utils/MessageEncryption.ts
import CryptoJS from 'crypto-js';

export interface EncryptedMessage {
  encryptedContent: string;
  iv: string;
  tag: string;
}

export class MessageEncryption {
  private static readonly ALGORITHM = 'AES';
  private static readonly MODE = CryptoJS.mode.GCM;
  private static readonly KEY_SIZE = 256;

  // 메시지 암호화
  static encryptMessage(message: string, key: string): EncryptedMessage {
    const iv = CryptoJS.lib.WordArray.random(12);
    const encrypted = CryptoJS.AES.encrypt(message, key, {
      iv: iv,
      mode: this.MODE,
      padding: CryptoJS.pad.NoPadding
    });

    return {
      encryptedContent: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
      iv: iv.toString(CryptoJS.enc.Base64),
      tag: encrypted.ciphertext.toString(CryptoJS.enc.Base64)
    };
  }

  // 메시지 복호화
  static decryptMessage(encryptedMessage: EncryptedMessage, key: string): string {
    const iv = CryptoJS.enc.Base64.parse(encryptedMessage.iv);
    const ciphertext = CryptoJS.enc.Base64.parse(encryptedMessage.encryptedContent);
    
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: ciphertext } as any,
      key,
      {
        iv: iv,
        mode: this.MODE,
        padding: CryptoJS.pad.NoPadding
      }
    );

    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  // 키 생성
  static generateKey(): string {
    return CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Base64);
  }
}
```

### 3. 파일 공유 시스템

#### 파일 업로드 컴포넌트
```typescript
// frontend/src/components/FileUpload.tsx
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  maxSize?: number;
  acceptedTypes?: string[];
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['image/*', 'application/pdf']
}) => {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploading(true);
      try {
        await onFileUpload(file);
      } catch (error) {
        console.error('파일 업로드 실패:', error);
      } finally {
        setUploading(false);
      }
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>)
  });

  return (
    <div
      {...getRootProps()}
      className={`file-upload-zone ${isDragActive ? 'active' : ''}`}
    >
      <input {...getInputProps()} />
      {uploading ? (
        <div>업로드 중...</div>
      ) : (
        <div>
          {isDragActive ? (
            <p>파일을 여기에 놓으세요...</p>
          ) : (
            <p>파일을 드래그하거나 클릭하여 선택하세요</p>
          )}
        </div>
      )}
    </div>
  );
};
```

#### 파일 서버 API
```javascript
// server-backend/api-server/routes/files.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// 파일 저장 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('지원하지 않는 파일 형식입니다.'));
    }
  }
});

// 파일 업로드
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 선택되지 않았습니다.' });
    }

    const fileData = {
      id: generateId(),
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedAt: new Date()
    };

    // 데이터베이스에 파일 정보 저장
    saveFileToDatabase(fileData);

    res.json({
      success: true,
      fileId: fileData.id,
      fileName: fileData.originalName,
      fileUrl: `/files/${fileData.id}`,
      fileSize: fileData.size,
      fileType: fileData.mimetype
    });
  } catch (error) {
    res.status(500).json({ error: '파일 업로드 실패' });
  }
});

// 파일 다운로드
router.get('/download/:fileId', (req, res) => {
  const { fileId } = req.params;
  
  // 데이터베이스에서 파일 정보 조회
  const fileData = getFileFromDatabase(fileId);
  
  if (!fileData) {
    return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
  }

  res.download(fileData.path, fileData.originalName);
});

module.exports = router;
```

### 4. UI 트리뷰 시스템

#### 트리뷰 컴포넌트
```typescript
// frontend/src/components/TreeView.tsx
import React, { useState, useCallback } from 'react';
import { TreeNode } from './TreeNode';

interface TreeViewProps {
  data: TreeNodeData[];
  onNodeSelect?: (node: TreeNodeData) => void;
  onNodeToggle?: (node: TreeNodeData) => void;
  searchable?: boolean;
  draggable?: boolean;
}

export const TreeView: React.FC<TreeViewProps> = ({
  data,
  onNodeSelect,
  onNodeToggle,
  searchable = true,
  draggable = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const handleNodeToggle = useCallback((node: TreeNodeData) => {
    const newExpanded = new Set(expandedNodes);
    if (expandedNodes.has(node.id)) {
      newExpanded.delete(node.id);
    } else {
      newExpanded.add(node.id);
    }
    setExpandedNodes(newExpanded);
    onNodeToggle?.(node);
  }, [expandedNodes, onNodeToggle]);

  const filteredData = data.filter(node => 
    !searchTerm || node.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="tree-view">
      {searchable && (
        <div className="tree-search">
          <input
            type="text"
            placeholder="검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}
      
      <div className="tree-content">
        {filteredData.map(node => (
          <TreeNode
            key={node.id}
            node={node}
            level={0}
            expanded={expandedNodes.has(node.id)}
            onToggle={handleNodeToggle}
            onSelect={onNodeSelect}
            draggable={draggable}
          />
        ))}
      </div>
    </div>
  );
};
```

#### 트리 노드 컴포넌트
```typescript
// frontend/src/components/TreeNode.tsx
import React, { useState } from 'react';

interface TreeNodeData {
  id: string;
  name: string;
  type: 'folder' | 'user' | 'content';
  children?: TreeNodeData[];
  tags?: string[];
  icon?: string;
  status?: 'active' | 'inactive' | 'pending';
}

interface TreeNodeProps {
  node: TreeNodeData;
  level: number;
  expanded: boolean;
  onToggle: (node: TreeNodeData) => void;
  onSelect: (node: TreeNodeData) => void;
  draggable?: boolean;
}

export const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  level,
  expanded,
  onToggle,
  onSelect,
  draggable = true
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    if (!draggable) return;
    
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', node.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    onSelect(node);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(node);
  };

  return (
    <div
      className={`tree-node ${isDragging ? 'dragging' : ''}`}
      style={{ paddingLeft: `${level * 20}px` }}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
    >
      <div className="node-content">
        {node.children && node.children.length > 0 && (
          <button
            className="toggle-button"
            onClick={handleToggle}
          >
            {expanded ? '▼' : '▶'}
          </button>
        )}
        
        <span className="node-icon">
          {node.icon || getDefaultIcon(node.type)}
        </span>
        
        <span className="node-name">{node.name}</span>
        
        {node.tags && node.tags.length > 0 && (
          <div className="node-tags">
            {node.tags.map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        )}
        
        {node.status && (
          <span className={`status status-${node.status}`}>
            {node.status}
          </span>
        )}
      </div>
      
      {expanded && node.children && (
        <div className="node-children">
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              expanded={false}
              onToggle={onToggle}
              onSelect={onSelect}
              draggable={draggable}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const getDefaultIcon = (type: string): string => {
  switch (type) {
    case 'folder': return '📁';
    case 'user': return '👤';
    case 'content': return '📄';
    default: return '📄';
  }
};
```

### 5. 태그 시스템

#### 태그 관리 API
```javascript
// server-backend/api-server/routes/tags.js
const express = require('express');
const router = express.Router();

// 태그 생성
router.post('/tags', async (req, res) => {
  try {
    const { name, color, description, category } = req.body;
    
    const tag = await Tag.create({
      name,
      color,
      description,
      category,
      createdAt: new Date()
    });
    
    res.json({ success: true, tag });
  } catch (error) {
    res.status(500).json({ error: '태그 생성 실패' });
  }
});

// 태그 목록 조회
router.get('/tags', async (req, res) => {
  try {
    const { category, search } = req.query;
    
    let whereClause = {};
    if (category) whereClause.category = category;
    if (search) whereClause.name = { $like: `%${search}%` };
    
    const tags = await Tag.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });
    
    res.json({ success: true, tags });
  } catch (error) {
    res.status(500).json({ error: '태그 조회 실패' });
  }
});

// 태그 수정
router.put('/tags/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, description, category } = req.body;
    
    const tag = await Tag.findByPk(id);
    if (!tag) {
      return res.status(404).json({ error: '태그를 찾을 수 없습니다.' });
    }
    
    await tag.update({ name, color, description, category });
    
    res.json({ success: true, tag });
  } catch (error) {
    res.status(500).json({ error: '태그 수정 실패' });
  }
});

// 태그 삭제
router.delete('/tags/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const tag = await Tag.findByPk(id);
    if (!tag) {
      return res.status(404).json({ error: '태그를 찾을 수 없습니다.' });
    }
    
    // 태그 사용 현황 확인
    const usageCount = await TagUsage.count({ where: { tagId: id } });
    if (usageCount > 0) {
      return res.status(400).json({ 
        error: '사용 중인 태그는 삭제할 수 없습니다.',
        usageCount 
      });
    }
    
    await tag.destroy();
    
    res.json({ success: true, message: '태그가 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: '태그 삭제 실패' });
  }
});

module.exports = router;
```

### 6. 캐시 시스템

#### Redis 캐시 관리
```javascript
// server-backend/utils/cache.js
const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('error', (err) => {
  console.error('Redis 연결 오류:', err);
});

client.connect();

class CacheManager {
  // 캐시 저장
  static async set(key, value, ttl = 3600) {
    try {
      const serializedValue = JSON.stringify(value);
      await client.setEx(key, ttl, serializedValue);
      return true;
    } catch (error) {
      console.error('캐시 저장 실패:', error);
      return false;
    }
  }

  // 캐시 조회
  static async get(key) {
    try {
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('캐시 조회 실패:', error);
      return null;
    }
  }

  // 캐시 삭제
  static async delete(key) {
    try {
      await client.del(key);
      return true;
    } catch (error) {
      console.error('캐시 삭제 실패:', error);
      return false;
    }
  }

  // 패턴으로 캐시 삭제
  static async deletePattern(pattern) {
    try {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(keys);
      }
      return true;
    } catch (error) {
      console.error('패턴 캐시 삭제 실패:', error);
      return false;
    }
  }

  // 캐시 존재 확인
  static async exists(key) {
    try {
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('캐시 존재 확인 실패:', error);
      return false;
    }
  }
}

module.exports = CacheManager;
```

### 7. 성능 최적화

#### 가상 스크롤링 구현
```typescript
// frontend/src/components/VirtualScroll.tsx
import React, { useMemo, useRef, useState } from 'react';
import { FixedSizeList as List } from 'react-window';

interface VirtualScrollProps {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (props: { index: number; style: any; data: any }) => React.ReactElement;
  overscanCount?: number;
}

export const VirtualScroll: React.FC<VirtualScrollProps> = ({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscanCount = 5
}) => {
  const listRef = useRef<List>(null);
  const [scrollOffset, setScrollOffset] = useState(0);

  const handleScroll = ({ scrollOffset }: { scrollOffset: number }) => {
    setScrollOffset(scrollOffset);
  };

  const itemData = useMemo(() => ({
    items,
    renderItem
  }), [items, renderItem]);

  return (
    <div className="virtual-scroll-container">
      <List
        ref={listRef}
        height={containerHeight}
        width="100%"
        itemCount={items.length}
        itemSize={itemHeight}
        itemData={itemData}
        onScroll={handleScroll}
        overscanCount={overscanCount}
        className="virtual-scroll-list"
      >
        {({ index, style, data }) => {
          const item = data.items[index];
          return data.renderItem({ index, style, data: item });
        }}
      </List>
      
      <div className="scroll-indicator">
        스크롤 위치: {Math.round(scrollOffset)}px
      </div>
    </div>
  );
};
```

#### 지연 로딩 구현
```typescript
// frontend/src/components/LazyImage.tsx
import React, { useState, useRef, useEffect } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  onLoad?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder = '/images/placeholder.jpg',
  className = '',
  onLoad
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  return (
    <div ref={imgRef} className={`lazy-image-container ${className}`}>
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          className={`lazy-image ${isLoaded ? 'loaded' : 'loading'}`}
        />
      )}
      {!isLoaded && (
        <img
          src={placeholder}
          alt="로딩 중..."
          className="lazy-image placeholder"
        />
      )}
    </div>
  );
};
```

## 🧪 테스트

### 단위 테스트
```javascript
// tests/utils/MessageEncryption.test.js
const { MessageEncryption } = require('../../src/utils/MessageEncryption');

describe('MessageEncryption', () => {
  test('메시지 암호화 및 복호화', () => {
    const message = '테스트 메시지';
    const key = MessageEncryption.generateKey();
    
    const encrypted = MessageEncryption.encryptMessage(message, key);
    const decrypted = MessageEncryption.decryptMessage(encrypted, key);
    
    expect(decrypted).toBe(message);
  });

  test('잘못된 키로 복호화 시도', () => {
    const message = '테스트 메시지';
    const correctKey = MessageEncryption.generateKey();
    const wrongKey = MessageEncryption.generateKey();
    
    const encrypted = MessageEncryption.encryptMessage(message, correctKey);
    
    expect(() => {
      MessageEncryption.decryptMessage(encrypted, wrongKey);
    }).toThrow();
  });
});
```

### 통합 테스트
```javascript
// tests/integration/chat.test.js
const request = require('supertest');
const app = require('../../server-backend/app');

describe('채팅 API', () => {
  test('메시지 전송', async () => {
    const response = await request(app)
      .post('/api/chat/send')
      .send({
        roomId: 'test-room',
        message: '테스트 메시지'
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.messageId).toBeDefined();
  });

  test('채팅방 입장', async () => {
    const response = await request(app)
      .post('/api/chat/join')
      .send({
        roomId: 'test-room',
        userId: 'test-user'
      })
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});
```

## 🚀 배포

### Docker 설정
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@db:5432/community
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=community
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

**개발자 작업 가이드 v1.3** - 2024년 10월 최신 버전
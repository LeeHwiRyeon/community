# 암호화 백엔드 통합 가이드

## 📋 개요

엔드-투-엔드 암호화(E2EE) 메시지 시스템을 백엔드 API에 완전 통합하여 안전한 메시지 전송을 제공합니다.

---

## 🎯 주요 기능

### 1️⃣ 공개키 관리
- **키 등록**: 사용자의 ECDH 공개키 저장
- **키 조회**: 다른 사용자의 공개키 검색
- **키 버전 관리**: 키 갱신 및 이력 관리
- **자동 만료**: 설정된 기간 후 키 자동 비활성화

### 2️⃣ 암호화 메시지 저장
- **AES-256-GCM 암호화**: 강력한 대칭키 암호화
- **메타데이터 저장**: IV, Auth Tag, 공개키 등
- **버전 관리**: 암호화 알고리즘 버전 추적
- **삭제 관리**: Soft delete로 감사 추적 가능

### 3️⃣ 감사 로그
- **모든 암호화 작업 기록**: 키 등록, 암호화, 복호화
- **보안 감사**: 실패한 작업 추적
- **IP 추적**: 보안 이벤트 분석
- **규정 준수**: GDPR, HIPAA 등 준수

---

## 🗄️ 데이터베이스 스키마

### encrypted_messages 테이블

```sql
CREATE TABLE encrypted_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- 메시지 관계
    message_id BIGINT NOT NULL,              -- 원본 메시지 ID
    room_id VARCHAR(100) NOT NULL,           -- 채팅방 ID
    sender_id BIGINT NOT NULL,               -- 발신자 ID
    recipient_id BIGINT NULL,                -- 수신자 ID (DM)
    
    -- 암호화 데이터
    encrypted_content TEXT NOT NULL,         -- AES-GCM 암호화된 내용 (Base64)
    iv VARCHAR(32) NOT NULL,                 -- Initialization Vector (Base64)
    auth_tag VARCHAR(32) NOT NULL,           -- Authentication Tag (Base64)
    
    -- 키 교환 메타데이터
    sender_public_key TEXT NOT NULL,         -- 발신자 ECDH 공개키
    encryption_version VARCHAR(10) DEFAULT 'v1',
    key_algorithm VARCHAR(20) DEFAULT 'ECDH-P256',
    encryption_algorithm VARCHAR(20) DEFAULT 'AES-256-GCM',
    
    -- 메타데이터
    is_deleted TINYINT(1) DEFAULT 0,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_message_id (message_id),
    INDEX idx_room_sender (room_id, sender_id),
    INDEX idx_sender_time (sender_id, created_at)
);
```

### user_encryption_keys 테이블

```sql
CREATE TABLE user_encryption_keys (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- 사용자 정보
    user_id BIGINT NOT NULL UNIQUE,
    
    -- 키 정보
    public_key TEXT NOT NULL,                -- ECDH 공개키 (Base64)
    key_algorithm VARCHAR(20) DEFAULT 'ECDH-P256',
    key_version VARCHAR(10) DEFAULT 'v1',
    
    -- 키 상태
    is_active TINYINT(1) DEFAULT 1,
    expires_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_active (user_id, is_active)
);
```

### encryption_audit_log 테이블

```sql
CREATE TABLE encryption_audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- 작업 정보
    user_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL,             -- encrypt, decrypt, key_exchange
    resource_type VARCHAR(50) NOT NULL,      -- message, file, key
    resource_id VARCHAR(100) NULL,
    
    -- 암호화 정보
    encryption_version VARCHAR(10) NULL,
    algorithm VARCHAR(50) NULL,
    
    -- 결과
    status VARCHAR(20) NOT NULL,             -- success, failure
    error_message TEXT NULL,
    
    -- 메타데이터
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_time (user_id, created_at),
    INDEX idx_action_time (action, created_at)
);
```

---

## 🔧 설치 및 설정

### 1️⃣ 마이그레이션 실행

```bash
# 테이블 생성
npm run migrate:encryption

# 롤백 (필요시)
npm run migrate:encryption:down
```

**수동 실행**:
```bash
node src/migrations/20251109_encryption_tables.js

# 롤백
node src/migrations/20251109_encryption_tables.js --down
```

### 2️⃣ 서버 재시작

```bash
npm run restart:win
# 또는
npm start
```

---

## 📡 API 엔드포인트

### 1️⃣ 공개키 등록

**POST** `/api/encryption/keys`

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body**:
```json
{
  "publicKey": "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...",
  "keyAlgorithm": "ECDH-P256",
  "keyVersion": "v1"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "공개키가 등록되었습니다",
  "data": {
    "keyId": 123,
    "keyVersion": "v1",
    "keyAlgorithm": "ECDH-P256"
  }
}
```

**cURL 예제**:
```bash
curl -X POST http://localhost:50000/api/encryption/keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "publicKey": "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...",
    "keyAlgorithm": "ECDH-P256",
    "keyVersion": "v1"
  }'
```

---

### 2️⃣ 공개키 조회

**GET** `/api/encryption/keys/:userId`

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "userId": 42,
    "publicKey": "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...",
    "keyAlgorithm": "ECDH-P256",
    "keyVersion": "v1",
    "createdAt": "2025-11-09T00:00:00.000Z"
  }
}
```

**cURL 예제**:
```bash
curl http://localhost:50000/api/encryption/keys/42 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 3️⃣ 공개키 일괄 조회

**POST** `/api/encryption/keys/batch`

**Request Body**:
```json
{
  "userIds": [1, 2, 3, 4, 5]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "keys": {
      "1": {
        "publicKey": "MFkw...",
        "keyAlgorithm": "ECDH-P256",
        "keyVersion": "v1",
        "createdAt": "2025-11-09T00:00:00.000Z"
      },
      "2": { ... }
    },
    "found": 5,
    "requested": 5
  }
}
```

---

### 4️⃣ 암호화된 메시지 저장

**POST** `/api/encryption/messages`

**Request Body**:
```json
{
  "messageId": 12345,
  "roomId": "room-abc-123",
  "recipientId": 42,
  "encryptedContent": "U2FsdGVkX1+...",
  "iv": "1234567890abcdef",
  "authTag": "fedcba0987654321",
  "senderPublicKey": "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE..."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "암호화된 메시지가 저장되었습니다",
  "data": {
    "id": 789,
    "messageId": 12345,
    "roomId": "room-abc-123"
  }
}
```

**cURL 예제**:
```bash
curl -X POST http://localhost:50000/api/encryption/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messageId": 12345,
    "roomId": "room-abc-123",
    "recipientId": 42,
    "encryptedContent": "U2FsdGVkX1+...",
    "iv": "1234567890abcdef",
    "authTag": "fedcba0987654321",
    "senderPublicKey": "MFkw..."
  }'
```

---

### 5️⃣ 암호화된 메시지 조회

**GET** `/api/encryption/messages/:messageId`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "messageId": 12345,
    "roomId": "room-abc-123",
    "senderId": 1,
    "recipientId": 42,
    "encryptedContent": "U2FsdGVkX1+...",
    "iv": "1234567890abcdef",
    "authTag": "fedcba0987654321",
    "senderPublicKey": "MFkw...",
    "encryptionVersion": "v1",
    "keyAlgorithm": "ECDH-P256",
    "encryptionAlgorithm": "AES-256-GCM",
    "createdAt": "2025-11-09T00:00:00.000Z"
  }
}
```

---

### 6️⃣ 채팅방 메시지 목록

**GET** `/api/encryption/messages/room/:roomId?limit=50&offset=0`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "messageId": 12345,
        "senderId": 1,
        "encryptedContent": "U2FsdGVkX1+...",
        "iv": "...",
        "authTag": "...",
        "senderPublicKey": "...",
        "createdAt": "2025-11-09T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

---

### 7️⃣ 암호화 통계

**GET** `/api/encryption/stats`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "totalEncrypted": 250,
    "roomsWithEncryption": 12,
    "firstEncryptedAt": "2025-11-01T00:00:00.000Z",
    "lastEncryptedAt": "2025-11-09T00:00:00.000Z",
    "publicKey": {
      "algorithm": "ECDH-P256",
      "version": "v1",
      "registeredAt": "2025-11-01T00:00:00.000Z"
    }
  }
}
```

---

## 🧪 테스트

### 수동 테스트 스크립트

**실행 방법**:
```bash
# 서버 시작 (별도 터미널)
npm start

# 테스트 실행 (새 터미널)
npm run test:encryption
```

**테스트 항목**:
1. ✅ 테스트 사용자 생성
2. ✅ 공개키 생성 및 등록 (User 1, User 2)
3. ✅ 공개키 조회
4. ✅ 암호화된 메시지 전송
5. ✅ 암호화된 메시지 조회
6. ✅ 암호화 통계 조회

**예상 출력**:
```
🧪 암호화 API 통합 테스트

서버: http://localhost:50000

🔍 서버 연결 확인 중...
✅ 서버 연결 성공

📝 테스트 1: 테스트 사용자 생성
✅ 테스트 사용자 생성
   2명의 사용자 생성 완료

📝 테스트 2: 공개키 생성 및 등록
✅ User 1 공개키 등록
   키 ID: 1
✅ User 2 공개키 등록

📝 테스트 3: 공개키 조회
✅ 공개키 조회
   공개키 알고리즘: ECDH-P256

📝 테스트 4: 암호화된 메시지 전송
✅ 암호화된 메시지 전송
   메시지 ID: 12345

📝 테스트 5: 암호화된 메시지 조회
✅ 암호화된 메시지 조회
   암호화 알고리즘: AES-256-GCM

📝 테스트 6: 암호화 통계 조회
✅ 암호화 통계 조회
   총 암호화 메시지: 1

📊 테스트 결과 요약
──────────────────────────────────────────────────
✅ 암호화 API 기본 기능 테스트 완료

📝 테스트된 기능:
  1. 공개키 등록
  2. 공개키 조회
  3. 암호화된 메시지 저장
  4. 암호화된 메시지 조회
  5. 암호화 통계

🎉 모든 테스트 완료!
```

---

## 🔒 보안 고려사항

### 1️⃣ 키 관리

- **개인키는 절대 서버에 저장하지 않음**
- 공개키만 서버에 저장
- 키 갱신 시 기존 키 자동 비활성화
- 키 만료 정책 설정 가능

### 2️⃣ 암호화 데이터

- **암호화된 내용만 저장**: 평문 저장 금지
- IV (Initialization Vector): 매 메시지마다 고유
- Auth Tag: 무결성 검증
- 메타데이터 최소화

### 3️⃣ 접근 제어

- JWT 인증 필수
- 발신자/수신자만 메시지 접근 가능
- 감사 로그로 모든 접근 추적
- Rate limiting 적용

### 4️⃣ 감사 로그

- 모든 암호화 작업 기록
- 실패한 작업 추적
- IP 주소 및 User Agent 저장
- 정기적인 로그 분석

---

## 📊 성능 최적화

### 1️⃣ 인덱스 최적화

```sql
-- 자주 조회되는 패턴에 인덱스 추가
CREATE INDEX idx_room_time ON encrypted_messages(room_id, created_at DESC);
CREATE INDEX idx_user_active_key ON user_encryption_keys(user_id, is_active);
```

### 2️⃣ 쿼리 최적화

- **배치 조회**: 여러 사용자의 공개키를 한 번에 조회
- **페이지네이션**: 대량 메시지 조회 시 필수
- **인덱스 활용**: WHERE 절에 인덱스 컬럼 사용

### 3️⃣ 캐싱 전략

```javascript
// Redis로 공개키 캐싱 (선택사항)
const cacheKey = `pubkey:${userId}`;
let publicKey = await redis.get(cacheKey);

if (!publicKey) {
    publicKey = await db.query('SELECT public_key FROM user_encryption_keys WHERE user_id = ?', [userId]);
    await redis.set(cacheKey, publicKey, 'EX', 3600); // 1시간 캐시
}
```

---

## 🚨 문제 해결

### 1️⃣ 마이그레이션 실패

**증상**: 테이블 생성 실패

**해결 방법**:
```bash
# 1. 데이터베이스 연결 확인
mysql -u root -p

# 2. 테이블 존재 여부 확인
SHOW TABLES LIKE 'encrypted_%';

# 3. 수동으로 롤백
npm run migrate:encryption:down

# 4. 다시 실행
npm run migrate:encryption
```

### 2️⃣ 공개키 등록 실패

**증상**: `KEY_REGISTRATION_FAILED`

**원인**:
- JWT 토큰 만료
- 잘못된 공개키 형식
- 데이터베이스 연결 오류

**해결 방법**:
1. JWT 토큰 갱신
2. 공개키 Base64 인코딩 확인
3. 데이터베이스 연결 상태 확인

### 3️⃣ 메시지 조회 권한 오류

**증상**: `ACCESS_DENIED`

**원인**: 발신자도 수신자도 아닌 사용자가 메시지 조회 시도

**해결 방법**: 올바른 사용자로 인증 후 재시도

---

## 📈 프로덕션 배포

### 체크리스트

- [ ] 마이그레이션 실행 확인
- [ ] API 엔드포인트 테스트 완료
- [ ] 감사 로그 활성화 확인
- [ ] 인덱스 생성 확인
- [ ] Rate limiting 설정
- [ ] 모니터링 대시보드 설정
- [ ] 백업 정책 수립
- [ ] 키 만료 정책 설정

---

## 📚 참고 자료

- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [AES-GCM](https://en.wikipedia.org/wiki/Galois/Counter_Mode)
- [ECDH](https://en.wikipedia.org/wiki/Elliptic-curve_Diffie%E2%80%93Hellman)
- [E2EE Best Practices](https://signal.org/docs/)

---

## ✅ 완료 상태

- [x] 데이터베이스 스키마 설계
- [x] 마이그레이션 스크립트 작성
- [x] 암호화 API 라우터 구현
- [x] 공개키 관리 API
- [x] 암호화 메시지 저장/조회 API
- [x] 감사 로그 시스템
- [x] 테스트 스크립트 작성
- [x] API 문서화
- [ ] 프론트엔드 통합
- [ ] 성능 테스트
- [ ] 보안 감사

---

**작성일**: 2025년 11월 9일
**버전**: 1.0.0
**작성자**: GitHub Copilot

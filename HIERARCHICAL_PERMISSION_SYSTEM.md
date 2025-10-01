# 🏢 Community Hub - 계층형 권한 관리 시스템

## 📋 **시스템 개요**

Community Hub는 8단계 계층형 권한 시스템을 통해 사용자별 맞춤형 서비스를 제공합니다. 각 등급은 명확한 권한과 책임을 가지며, 상위 등급이 하위 등급을 관리할 수 있는 구조입니다.

## 🎯 **권한 계층 구조**

### **Level 0: 오너 (Owner) 👑**
- **권한**: 모든 시스템 접근 및 설정
- **관리 대상**: 전체 시스템
- **주요 기능**:
  - 시스템 전체 설정 및 관리
  - 모든 사용자 등급 변경
  - 데이터베이스 직접 접근
  - 수익 및 결제 관리
  - 보안 설정 및 모니터링

### **Level 1: 관리자 (Administrator) 🛡️**
- **권한**: VIP 관리, 커뮤니티 전체 관리
- **관리 대상**: VIP, 스트리머, 코스플레이어
- **주요 기능**:
  - VIP 요청 처리 및 승인
  - 커뮤니티 전체 모니터링
  - 스트리머/코스플레이어 등급 관리
  - 통계 및 분석 데이터 조회
  - 공지사항 작성 및 관리

### **Level 2: VIP (Very Important Person) 💎**
- **권한**: 프리미엄 서비스, 요청 처리
- **관리 대상**: 스트리머, 코스플레이어
- **주요 기능**:
  - 프리미엄 콘텐츠 접근
  - 우선 고객 지원 (24시간 내 응답)
  - 스트리머/코스플레이어 추천 및 관리
  - 특별 이벤트 참여
  - 커스텀 서비스 요청

### **Level 3: 스트리머 (Streamer) 📺**
- **권한**: 라이브 방송, 매니저 관리
- **관리 대상**: 매니저
- **주요 기능**:
  - 라이브 방송 기능
  - 채널 수익화
  - 매니저 추가/삭제/권한 부여
  - 구독자 관리
  - 방송 통계 조회

### **Level 3: 코스플레이어 (Cosplayer) 🎭**
- **권한**: 코스프레 콘텐츠, 매니저 관리
- **관리 대상**: 매니저
- **주요 기능**:
  - 코스프레 콘텐츠 업로드
  - 갤러리 관리
  - 매니저 추가/삭제/권한 부여
  - 팬 관리
  - 콘텐츠 통계 조회

### **Level 4: 매니저 (Manager) 👨‍💼**
- **권한**: 스트리머/코스플레이어 페이지 대리 관리
- **관리 대상**: 없음
- **주요 기능**:
  - 스트리머/코스플레이어 페이지 대리 관리
  - 콘텐츠 사전 검토 및 승인
  - 일정 관리 (방송/이벤트)
  - 팬과의 소통 대리 처리
  - 기본 통계 조회

### **Level 5: 일반유저 (Regular User) 👤**
- **권한**: 기본 기능
- **관리 대상**: 없음
- **주요 기능**:
  - 기본 게시글 작성
  - 댓글 및 좋아요
  - 기본 콘텐츠 조회
  - 프로필 관리

## 🔄 **서비스 제공 구조**

### **VIP 요청 처리 시스템**
```
VIP 요청 → 관리자 검토 → 승인/거부 → 서비스 제공 → 피드백 수집
```

#### **요청 유형**
- **콘텐츠 요청**: 특별 콘텐츠 제작 요청
- **이벤트 요청**: 개인 이벤트 개최 요청
- **기능 요청**: 커스텀 기능 개발 요청
- **지원 요청**: 기술적 문제 해결 요청

### **관리자 VIP 관리 시스템**
```
VIP 활동 모니터링 → 요청 처리 → 서비스 품질 관리 → 만족도 조사
```

#### **관리 기능**
- **VIP 대시보드**: VIP별 활동 현황
- **요청 큐 관리**: 처리 대기 중인 요청 관리
- **서비스 품질 모니터링**: 응답 시간, 만족도 추적
- **VIP 등급 관리**: 등급 상승/하락 결정

### **스트리머/코스플레이어 매니저 시스템**
```
스트리머/코스플레이어 → 매니저 추가 → 권한 부여 → 페이지 위임 → 대리 관리
```

#### **매니저 관리 기능**
- **매니저 추가/삭제**: 신뢰할 수 있는 매니저 선정
- **권한 부여**: 페이지별 세부 권한 설정
- **위임 관리**: 페이지 관리 권한 위임/회수
- **활동 모니터링**: 매니저 활동 현황 추적

## 🛡️ **보안 및 권한 검증**

### **JWT 토큰 기반 인증**
```json
{
  "userId": "user123",
  "tier": 2,
  "permissions": ["vip_access", "request_service"],
  "managedBy": "admin456",
  "exp": 1640995200
}
```

### **API 엔드포인트 보안**
- **Level 0-1**: 모든 API 접근 가능
- **Level 2**: VIP 전용 API + 기본 API
- **Level 3**: 스트리머/코스플레이어 API + 기본 API
- **Level 4**: 매니저 API + 기본 API
- **Level 5**: 기본 API만 접근 가능

### **프론트엔드 권한 검증**
```javascript
// 권한 검증 함수
function hasPermission(userTier, requiredTier) {
    return userTier <= requiredTier;
}

// UI 요소 표시/숨김
function updateUI(userTier) {
    if (hasPermission(userTier, 2)) {
        showVIPFeatures();
    }
    if (hasPermission(userTier, 3)) {
        showStreamerFeatures();
    }
}
```

## 📊 **데이터베이스 스키마**

### **Users 테이블**
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    tier INT NOT NULL DEFAULT 5,
    status ENUM('active', 'inactive', 'suspended', 'pending') DEFAULT 'pending',
    managed_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (managed_by) REFERENCES users(id)
);
```

### **Permissions 테이블**
```sql
CREATE TABLE permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tier INT NOT NULL,
    permission_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Requests 테이블**
```sql
CREATE TABLE requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    requester_id INT NOT NULL,
    request_type ENUM('content', 'event', 'feature', 'support') NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
    assigned_to INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES users(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);
```

## 🚀 **구현 로드맵**

### **Phase 1: 기본 권한 시스템**
- [x] 8단계 등급 체계 설계
- [x] 사용자 관리 UI 구현
- [ ] JWT 토큰 기반 인증
- [ ] API 엔드포인트 보안

### **Phase 2: VIP 서비스 시스템**
- [ ] VIP 요청 처리 시스템
- [ ] 관리자 VIP 관리 대시보드
- [ ] 요청 승인 워크플로우

### **Phase 3: 스트리머/코스플레이어 시스템**
- [ ] 매니저 관리 시스템
- [ ] 페이지 위임 기능
- [ ] 수익 추적 시스템

### **Phase 4: 고급 기능**
- [ ] 실시간 알림 시스템
- [ ] 분석 및 리포팅
- [ ] 모바일 앱 지원

## 📈 **성공 지표**

### **VIP 만족도**
- 요청 처리 시간: 24시간 이내
- 서비스 만족도: 4.5/5.0 이상
- 재이용률: 80% 이상

### **관리 효율성**
- VIP 관리 시간: 50% 단축
- 요청 처리 자동화: 70% 이상
- 시스템 안정성: 99.9% 이상

### **사용자 참여도**
- 스트리머/코스플레이어 활성도: 90% 이상
- 매니저 활용률: 60% 이상
- 일반 사용자 참여도: 70% 이상

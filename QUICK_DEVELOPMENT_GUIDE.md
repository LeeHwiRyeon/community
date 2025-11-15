# 🚀 Community Platform v1.0 - 빠른 개발 가이드

**최종 업데이트**: 2025년 11월 9일

## 📋 **빠른 개발 이터레이션을 위한 완벽한 가이드**

이 문서는 **Community Platform v1.0**에서 빠른 개발 이터레이션을 위한 완벽한 가이드를 제공합니다.

## 🗂️ **파일구조 매핑 시스템**

### **1. 새 기능 추가 워크플로우**

```
1️⃣ data/ 에 목 데이터 추가
   └── data/new-feature.json

2️⃣ server-backend/api-server/routes/ 에 API 엔드포인트 추가
   └── server-backend/api-server/routes/new-feature.js

3️⃣ frontend/src/pages/ 에 페이지 컴포넌트 추가
   └── frontend/src/pages/NewFeature.tsx

4️⃣ frontend/src/App.tsx 에 라우팅 추가
   └── <Route path="/new-feature" element={<NewFeature />} />
```

### **2. API 수정 워크플로우**

```
1️⃣ server-backend/api-server/routes/ 파일 수정
   └── 기존 엔드포인트 로직 업데이트

2️⃣ frontend/src/pages/ 관련 컴포넌트 업데이트
   └── API 호출 부분 수정

3️⃣ data/ 목 데이터 동기화
   └── 새로운 데이터 구조에 맞게 업데이트
```

### **3. UI 컴포넌트 추가 워크플로우**

```
1️⃣ frontend/src/components/ 에 컴포넌트 생성
   └── frontend/src/components/NewComponent.tsx

2️⃣ frontend/src/pages/ 에서 import 및 사용
   └── import NewComponent from '../components/NewComponent';

3️⃣ 필요시 backend API 연동
   └── server-backend/api-server/routes/ 에 관련 엔드포인트 추가
```

## 🔗 **완벽한 매핑 관계**

### **Frontend ↔ Backend 매핑**
| Frontend Page      | Backend API Route        | Data File          |
| ------------------ | ------------------------ | ------------------ |
| `Home.tsx`         | `/api/community-content` | `data/news.json`   |
| `CommunityHub.tsx` | `/api/boards`            | `data/boards.json` |
| `GameCenter.tsx`   | `/api/community-games`   | `data/games.json`  |
| `VIPDashboard.tsx` | `/api/vip-system`        | `data/vip.json`    |
| `SimpleBoard.tsx`  | `/api/posts`             | `data/posts.json`  |
| `QuickContent.tsx` | `/api/quick-content`     | `data/*.json`      |

### **Component ↔ Service 매핑**
| Frontend Component   | Backend Service           | API Endpoint      |
| -------------------- | ------------------------- | ----------------- |
| `ChatSystem.tsx`     | `services/chatService.js` | `/api/chat`       |
| `VotingSystem.tsx`   | `routes/voting.js`        | `/api/voting`     |
| `TodoManagement.tsx` | `routes/todos.js`         | `/api/todos`      |
| `BoardDetail.tsx`    | `routes/boards.js`        | `/api/boards/:id` |
| `PostDetail.tsx`     | `routes/posts.js`         | `/api/posts/:id`  |

## 🛠️ **개발 도구 및 스크립트**

### **필수 개발 스크립트**
```powershell
# 통합 개발환경 시작 (가장 안정적)
./scripts/dev-env.ps1 -Action start

# 프로젝트 정리
./scripts/cleanup-project-v1-1.ps1

# 종료
./scripts/dev-env.ps1 -Action stop
```

### **개발 서버 URL**
- **프론트엔드**: http://localhost:5002
- **백엔드 API**: http://localhost:50000
- **API 문서**: http://localhost:50000/api-docs

## 📋 **개발 체크리스트**

### **새 기능 개발 시**
- [ ] `data/` 에 목 데이터 준비
- [ ] `server-backend/api-server/routes/` 에 API 엔드포인트 구현
- [ ] `frontend/src/pages/` 에 페이지 컴포넌트 생성
- [ ] `frontend/src/App.tsx` 에 라우팅 추가
- [ ] UTF-8 인코딩 확인 (BOM 없음)
- [ ] API 연동 테스트
- [ ] 문서 업데이트

### **기존 기능 수정 시**
- [ ] 관련 파일들 매핑 확인
- [ ] Frontend ↔ Backend 동기화
- [ ] 목 데이터 업데이트
- [ ] UTF-8 인코딩 유지
- [ ] 테스트 실행
- [ ] 문서 업데이트

## 🔍 **디버깅 가이드**

### **일반적인 문제 해결**
1. **컴파일 에러**: `frontend/src/` 파일들의 import 경로 확인
2. **API 연결 실패**: `server-backend/api-server/server.js` 라우트 등록 확인
3. **데이터 로딩 실패**: `data/` 파일 경로 및 JSON 구조 확인
4. **인코딩 문제**: UTF-8 (BOM 없음) 인코딩 확인

### **성능 최적화**
1. **React 컴포넌트**: `React.memo`, `useMemo`, `useCallback` 활용
2. **API 호출**: `useOptimizedData` 훅 사용
3. **데이터 캐싱**: 브라우저 캐시 및 로컬 스토리지 활용
4. **번들 크기**: Vite 빌드 최적화 설정 확인

## 📚 **참고 문서**

- **[PROJECT_STRUCTURE_MAP.md](PROJECT_STRUCTURE_MAP.md)** - 완전한 파일구조 매핑
- **[API_REFERENCE.md](API_REFERENCE.md)** - API 문서
- **[FEATURES.md](FEATURES.md)** - 완성된 기능 목록
- **[AGENT_UTF8_ENCODING_RULES.md](AGENT_UTF8_ENCODING_RULES.md)** - UTF-8 인코딩 규칙

## 🎯 **개발 팁**

### **효율적인 개발을 위한 팁**
1. **파일구조 매핑 활용**: 새 기능 추가 시 매핑 테이블 참조
2. **목 데이터 우선**: API 개발 전 목 데이터로 UI 먼저 구현
3. **컴포넌트 재사용**: `frontend/src/components/` 의 기존 컴포넌트 최대 활용
4. **UTF-8 준수**: 모든 새 파일은 UTF-8 (BOM 없음)으로 생성
5. **문서 동기화**: 기능 추가/수정 시 관련 문서 즉시 업데이트

---

**🚀 이제 Community Platform v1.1에서 빠른 개발 이터레이션을 시작하세요!**

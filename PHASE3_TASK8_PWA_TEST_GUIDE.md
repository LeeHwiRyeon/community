# Phase 3 Task #8: PWA 테스트 및 검증 가이드

**작성일**: 2025-11-10  
**상태**: 🔄 진행 중

---

## 📋 테스트 개요

### 목표
Phase 3에서 구현한 PWA 기능들이 정상적으로 동작하는지 종합 검증

### 테스트 범위
1. ✅ Service Worker 등록 및 활성화
2. ✅ 오프라인 모드 동작
3. ✅ 캐싱 전략 검증
4. ✅ 앱 설치 기능 (Desktop & Mobile)
5. ✅ Web App Manifest 검증

---

## 🧪 테스트 체크리스트

### 1. Service Worker 등록 확인

#### 테스트 방법
1. Preview 서버 실행: `npm run preview` (frontend 디렉토리)
2. Chrome에서 http://localhost:3000 접속
3. **F12** → **Application** 탭 → **Service Workers**

#### 검증 항목
- [ ] Service Worker 상태: **Activated and running**
- [ ] Service Worker 파일: `sw.js` 또는 유사한 이름
- [ ] Scope: `/` (루트)
- [ ] Status: 🟢 **activated**

#### 예상 결과
```
Source: /sw.js
Status: activated and is running
Scope: http://localhost:3000/
```

---

### 2. 캐싱 전략 검증

#### 테스트 방법
1. **F12** → **Application** → **Cache Storage**
2. 캐시된 항목 확인

#### 검증 항목
- [ ] **workbox-precache**: 84개 파일 precached
  - [ ] `index.html`
  - [ ] JavaScript 번들 (main, chunks)
  - [ ] CSS 파일
  - [ ] 이미지 파일 (icons, images)
  - [ ] Web App Manifest
  
- [ ] **api-cache**: API 응답 캐싱 (런타임)
  - NetworkFirst 전략 (5분 TTL)
  
- [ ] **image-cache**: 이미지 캐싱 (런타임)
  - CacheFirst 전략 (30일 TTL)

#### 예상 캐시 크기
- Precache: ~2.06MB (84 entries)
- Runtime caches: 사용량에 따라 증가

---

### 3. 오프라인 모드 테스트

#### 테스트 방법 A: DevTools 사용
1. Chrome DevTools 열기 (F12)
2. **Network** 탭
3. **Throttling** 드롭다운 → **Offline** 선택
4. 페이지 새로고침 (Ctrl+R 또는 F5)

#### 테스트 방법 B: 실제 네트워크 끊기
1. WiFi/이더넷 연결 해제
2. 브라우저 새로고침

#### 검증 항목
- [ ] **홈페이지 로딩**: 캐시에서 정상 로드
- [ ] **정적 리소스**: JS, CSS, 이미지 모두 표시
- [ ] **오프라인 폴백**: API 실패 시 적절한 메시지
- [ ] **Service Worker 상태**: 여전히 활성화

#### 예상 동작
```
✅ HTML, CSS, JS 로딩 성공 (캐시에서)
✅ 이미지 표시 (캐시에서)
❌ API 호출 실패 (예상됨)
✅ 오프라인 메시지 또는 폴백 UI 표시
```

---

### 4. 앱 설치 기능 테스트

#### Desktop 설치 (Chrome)

##### 테스트 방법
1. Chrome에서 http://localhost:3000 접속
2. 주소창 우측 **설치 아이콘** (⊕) 클릭
3. 또는 Chrome 메뉴 → "설치..." 클릭

##### 검증 항목
- [ ] 설치 프롬프트 표시
- [ ] 앱 이름: "TheNewspaper Platform" (manifest에서 지정)
- [ ] 앱 아이콘: 512x512 PWA 아이콘 표시
- [ ] 설치 후 독립 창으로 실행
- [ ] 주소창 숨김 (standalone 모드)

##### 설치 후 확인
- [ ] 시작 메뉴 / 애플리케이션 폴더에 바로가기
- [ ] 독립 창으로 실행 (브라우저 UI 없음)
- [ ] Service Worker 여전히 활성화

#### Mobile 설치 (Android Chrome)

##### 테스트 방법
1. Android 기기에서 Chrome 열기
2. 프로덕션 URL 접속 (로컬호스트는 테스트 불가)
3. "홈 화면에 추가" 배너 표시 대기
4. 또는 Chrome 메뉴 → "홈 화면에 추가"

##### 검증 항목
- [ ] "홈 화면에 추가" 프롬프트
- [ ] 앱 아이콘: 192x192 PWA 아이콘
- [ ] 홈 화면에 아이콘 추가
- [ ] 전체 화면 모드 실행

---

### 5. Web App Manifest 검증

#### 테스트 방법
1. **F12** → **Application** → **Manifest**

#### 검증 항목
- [ ] **Identity**
  - Name: "TheNewspaper Platform"
  - Short name: "TheNewspaper"
  - Start URL: "/"
  
- [ ] **Presentation**
  - Display: "standalone"
  - Orientation: "portrait-primary"
  - Theme color: "#1976d2" (Primary blue)
  - Background color: "#ffffff"
  
- [ ] **Icons** (최소 요구사항)
  - [ ] 192x192 (maskable)
  - [ ] 512x512 (any)
  - [ ] 16x16~256x256 (추가 사이즈)
  - [ ] Apple Touch Icon (180x180)

#### PWA Criteria 체크
- [ ] ✅ Served over HTTPS (프로덕션)
- [ ] ✅ Has a web app manifest
- [ ] ✅ Has a service worker
- [ ] ✅ Has icons (192x192, 512x512)
- [ ] ✅ Has a display mode (standalone/fullscreen)

---

## 🔍 자동화된 테스트 스크립트

### Service Worker 테스트

```javascript
// 브라우저 콘솔에서 실행
(async () => {
  console.log('=== Service Worker 테스트 ===');
  
  // 1. Service Worker 등록 확인
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    console.log('✅ Service Worker 등록:', registration);
    console.log('   - Scope:', registration?.scope);
    console.log('   - Active:', !!registration?.active);
    console.log('   - Waiting:', !!registration?.waiting);
  } else {
    console.log('❌ Service Worker 미지원');
  }
  
  // 2. 캐시 확인
  const caches = await window.caches.keys();
  console.log('\n=== 캐시 목록 ===');
  for (const cacheName of caches) {
    const cache = await window.caches.open(cacheName);
    const keys = await cache.keys();
    console.log(`📦 ${cacheName}: ${keys.length} 항목`);
  }
  
  // 3. Manifest 확인
  const manifestLink = document.querySelector('link[rel="manifest"]');
  if (manifestLink) {
    console.log('\n=== Manifest ===');
    console.log('✅ Manifest URL:', manifestLink.href);
    
    const response = await fetch(manifestLink.href);
    const manifest = await response.json();
    console.log('   - Name:', manifest.name);
    console.log('   - Short Name:', manifest.short_name);
    console.log('   - Display:', manifest.display);
    console.log('   - Icons:', manifest.icons.length, '개');
  }
  
  // 4. 온라인 상태
  console.log('\n=== 네트워크 상태 ===');
  console.log('온라인:', navigator.onLine ? '🟢' : '🔴');
  
  console.log('\n✅ 테스트 완료');
})();
```

### 캐시 내용 상세 확인

```javascript
// 브라우저 콘솔에서 실행
(async () => {
  const cacheName = 'workbox-precache-v2-http://localhost:3000/';
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();
  
  console.log(`=== ${cacheName} ===`);
  console.log(`총 ${requests.length}개 캐시됨\n`);
  
  // URL별로 그룹화
  const grouped = {};
  for (const req of requests) {
    const url = new URL(req.url);
    const ext = url.pathname.split('.').pop() || 'html';
    grouped[ext] = (grouped[ext] || 0) + 1;
  }
  
  console.table(grouped);
  
  // 전체 목록
  console.log('\n전체 캐시 목록:');
  requests.forEach((req, i) => {
    console.log(`${i+1}. ${req.url}`);
  });
})();
```

---

## 📊 예상 테스트 결과

### Service Worker
```
✅ 등록 상태: Active
✅ Scope: /
✅ 버전: 최신
✅ 업데이트: 자동
```

### 캐시
```
✅ Precache: 84 entries (~2.06MB)
✅ Runtime API Cache: 동적
✅ Runtime Image Cache: 동적
✅ 총 캐시: ~2-3MB (초기)
```

### 오프라인
```
✅ HTML: 캐시에서 로드
✅ CSS: 캐시에서 로드
✅ JS: 캐시에서 로드
✅ 이미지: 캐시에서 로드
⚠️ API: 실패 (예상됨)
✅ 폴백: 적절한 메시지
```

### 설치
```
✅ Desktop: 설치 가능
✅ Mobile: 설치 가능 (프로덕션)
✅ 독립 실행: 정상
✅ 아이콘: 표시됨
```

---

## 🐛 알려진 이슈 및 해결 방법

### Issue #1: Service Worker 업데이트 안됨

**증상**: 코드 변경 후 새 버전 적용 안됨

**해결**:
1. Chrome DevTools → Application → Service Workers
2. "Update on reload" 체크
3. "Unregister" 클릭 후 새로고침
4. 또는 "skipWaiting" 버튼 클릭

### Issue #2: 캐시가 너무 큼

**증상**: 브라우저 저장 공간 부족

**해결**:
```javascript
// 브라우저 콘솔에서 실행
await caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});
console.log('모든 캐시 삭제됨');
```

### Issue #3: localhost에서 설치 안됨

**원인**: PWA는 HTTPS 필요 (localhost 제외이지만 일부 기능 제한)

**해결**: 프로덕션 배포 후 테스트

### Issue #4: 오프라인에서 API 오류

**증상**: API 호출 실패 메시지

**예상 동작**: 정상 (오프라인이므로)

**개선**: NetworkFirst 전략으로 캐시된 응답 반환

---

## ✅ 테스트 완료 체크리스트

### 필수 테스트
- [ ] Service Worker 등록 확인
- [ ] 캐시 내용 검증 (84+ entries)
- [ ] 오프라인 모드 동작 확인
- [ ] Manifest 내용 확인

### 선택 테스트
- [ ] Desktop 앱 설치
- [ ] Mobile 앱 설치 (프로덕션)
- [ ] 자동 업데이트 동작
- [ ] 캐시 만료 정책

### 고급 테스트
- [ ] Service Worker Lifecycle
- [ ] Push Notifications (미구현)
- [ ] Background Sync (미구현)
- [ ] Periodic Sync (미구현)

---

## 📝 테스트 리포트 템플릿

### Service Worker
```
✅ / ❌ 등록: _____
✅ / ❌ 활성화: _____
✅ / ❌ Scope: _____
```

### 캐싱
```
✅ / ❌ Precache: ____ entries
✅ / ❌ Runtime Cache: 동작함
✅ / ❌ 총 크기: ____ MB
```

### 오프라인
```
✅ / ❌ HTML 로드: _____
✅ / ❌ 리소스 로드: _____
✅ / ❌ 폴백 UI: _____
```

### 설치
```
✅ / ❌ Desktop: _____
✅ / ❌ Mobile: _____
✅ / ❌ 독립 실행: _____
```

---

## 🎯 다음 단계

### Task #8 완료 후
1. ✅ Phase 3 완료 (8/8 tasks)
2. 📊 최종 보고서 작성
3. 🚀 Phase 4 계획

### Phase 4 Preview
- TypeScript 타입 오류 수정
- 추가 성능 최적화
- 프로덕션 배포 준비
- 모니터링 시스템 구축

---

**현재 상태**: Preview 서버 실행 중  
**다음 작업**: 위 테스트 항목들 수동 실행 후 결과 문서화

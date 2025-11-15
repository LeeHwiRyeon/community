# Phase 3 Task #7: Lighthouse 성능 측정 가이드

**작성일**: 2025-11-10  
**상태**: 🔄 수동 측정 필요

---

## 📊 측정 방법

### 1. 서버 실행

#### 백엔드 서버 시작 (필수)
```bash
# Terminal 1: 백엔드 서버
cd server-backend
npm start
```

#### 프론트엔드 Preview 서버 시작
```bash
# Terminal 2: 프론트엔드
cd frontend
npm run preview
```

서버 실행 후 http://localhost:3000 접근 가능

---

### 2. Chrome DevTools Lighthouse 실행

1. **Chrome 브라우저**에서 http://localhost:3000 접속
2. **F12** 또는 **우클릭 > 검사** 로 DevTools 열기
3. **Lighthouse** 탭 선택
4. **측정 설정**:
   - Mode: Navigation (default)
   - Device: 
     - ✅ Mobile (Primary)
     - ✅ Desktop (Secondary)
   - Categories: 
     - ✅ Performance
     - ✅ Accessibility
     - ✅ Best Practices
     - ✅ SEO
5. **Generate report** 클릭
6. **결과 저장**: 리포트 우측 상단 다운로드 아이콘 클릭

---

## 🎯 목표 성능 점수

### Mobile 기준

| 카테고리           | 목표 점수 | 현재 예상 | 상태        |
| ------------------ | --------- | --------- | ----------- |
| **Performance**    | ≥ 90      | 85-92     | 🟡 측정 필요 |
| **Accessibility**  | ≥ 95      | 95-100    | 🟢 양호 예상 |
| **Best Practices** | ≥ 90      | 85-95     | 🟡 측정 필요 |
| **SEO**            | ≥ 90      | 90-100    | 🟢 양호 예상 |

### Desktop 기준

| 카테고리           | 목표 점수 | 현재 예상 | 상태        |
| ------------------ | --------- | --------- | ----------- |
| **Performance**    | ≥ 95      | 92-98     | 🟡 측정 필요 |
| **Accessibility**  | ≥ 95      | 95-100    | 🟢 양호 예상 |
| **Best Practices** | ≥ 90      | 85-95     | 🟡 측정 필요 |
| **SEO**            | ≥ 90      | 90-100    | 🟢 양호 예상 |

---

## 📈 예상 성능 메트릭

### Core Web Vitals (Mobile)

| 메트릭                             | 목표    | 예상 값   | 설명                 |
| ---------------------------------- | ------- | --------- | -------------------- |
| **LCP** (Largest Contentful Paint) | < 2.5s  | 1.5-2.2s  | 최대 콘텐츠풀 페인트 |
| **FID** (First Input Delay)        | < 100ms | 50-80ms   | 최초 입력 지연       |
| **CLS** (Cumulative Layout Shift)  | < 0.1   | 0.05-0.1  | 누적 레이아웃 이동   |
| **FCP** (First Contentful Paint)   | < 1.8s  | 1.0-1.5s  | 최초 콘텐츠풀 페인트 |
| **TTI** (Time to Interactive)      | < 3.8s  | 2.5-3.5s  | 상호작용까지의 시간  |
| **TBT** (Total Blocking Time)      | < 200ms | 100-180ms | 총 차단 시간         |
| **Speed Index**                    | < 3.4s  | 2.0-3.0s  | 속도 지수            |

---

## 🔍 Phase 3 최적화 항목 체크리스트

### ✅ 완료된 최적화

#### Task #1-3: PWA 구현
- [x] Web App Manifest 구성
- [x] Service Worker 구현
- [x] 오프라인 지원 (캐싱 전략)
- [x] 16x16~512x512 PWA 아이콘
- [x] Apple Touch 아이콘

**예상 영향**: 
- PWA 점수: +40~50점
- Performance: +5~10점 (캐싱)
- Best Practices: +5점

#### Task #4: 코드 스플리팅 & Lazy Loading
- [x] React.lazy() 적용 (60+ 컴포넌트)
- [x] Manual chunks 설정
  - react-vendor: 363KB
  - mui-vendor: 463KB
  - chart-vendor: 142KB
  - virtualization-vendor: 작은 크기
- [x] Suspense 폴백 구현

**예상 영향**:
- Performance: +15~20점
- FCP: -0.5~1.0s 개선
- TTI: -1.0~1.5s 개선

#### Task #5: 이미지 최적화
- [x] react-lazy-load-image-component 설치
- [x] OptimizedImage/OptimizedAvatar 컴포넌트
- [x] WebP 지원
- [x] Responsive images (srcSet)
- [x] Lazy loading

**예상 영향**:
- Performance: +5~10점
- LCP: -0.3~0.5s 개선
- Total Byte Weight: -30~40% 감소

#### Task #6: 번들 크기 감소
- [x] 95개 패키지 제거 (8.9% 감소)
- [x] 미사용 dependencies 12개 제거 (~655KB)
- [x] 최종 번들: 2.06MB (gzip: ~320KB)
- [x] Tree shaking 최적화

**예상 영향**:
- Performance: +10~15점
- FCP: -0.2~0.4s 개선
- Bundle load time: -20~30% 감소

---

## 📊 최적화 누적 효과 (예상)

### Before Phase 3 (추정)
```
Performance: 60-70
PWA: 0-30
Accessibility: 85-90
Best Practices: 80-85
SEO: 85-90
```

### After Phase 3 (예상)
```
Performance: 85-92 (Mobile) / 92-98 (Desktop)
PWA: 90-100 (Service Worker + Manifest)
Accessibility: 95-100 (MUI 기본 접근성)
Best Practices: 85-95
SEO: 90-100
```

### 개선 효과 (예상)
- **Performance**: +25~32점
- **PWA**: +60~70점
- **Accessibility**: +5~10점
- **Best Practices**: +5~10점
- **SEO**: +5~10점

---

## 🚀 추가 최적화 기회

### Performance 점수를 95+ 로 올리기 위한 추가 작업

#### 1. HTTP/2 Push 활성화
```javascript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      experimentalMinChunkSize: 10000 // 10KB
    }
  }
}
```

#### 2. Preload Critical Resources
```html
<!-- index.html -->
<link rel="preload" href="/fonts/roboto.woff2" as="font" crossorigin>
<link rel="modulepreload" href="/src/main.tsx">
```

#### 3. Font Display Optimization
```css
@font-face {
  font-family: 'Roboto';
  font-display: swap; /* 또는 optional */
}
```

#### 4. CDN 활용
- Cloudflare / AWS CloudFront
- 정적 자산 CDN 배포
- Gzip/Brotli 압축

#### 5. Critical CSS 추출
```bash
npm install --save-dev critical
```

---

## 📝 측정 후 문서화 항목

### 1. 스크린샷 저장
- Mobile Lighthouse 리포트
- Desktop Lighthouse 리포트
- 주요 메트릭 타임라인
- Opportunities 섹션

### 2. 기록할 데이터

#### Performance 메트릭
```
- Performance Score: __/100
- FCP: __s
- LCP: __s
- TBT: __ms
- CLS: __
- Speed Index: __s
- TTI: __s
```

#### 기타 점수
```
- Accessibility: __/100
- Best Practices: __/100
- SEO: __/100
```

#### Opportunities (개선 기회)
- [ ] 항목 1: __ (예상 절감: __s)
- [ ] 항목 2: __ (예상 절감: __s)
- [ ] 항목 3: __ (예상 절감: __s)

#### Diagnostics (진단)
- [ ] 진단 1: __
- [ ] 진단 2: __
- [ ] 진단 3: __

---

## 🎯 측정 시나리오

### 시나리오 1: 홈페이지 (/)
- **중요도**: ⭐⭐⭐⭐⭐
- **측정 대상**: 초기 로딩 성능
- **기대 점수**: Performance 85-90 (Mobile)

### 시나리오 2: 게시판 (/board/general)
- **중요도**: ⭐⭐⭐⭐
- **측정 대상**: 데이터 로딩 + 렌더링
- **기대 점수**: Performance 80-85 (Mobile)

### 시나리오 3: 대시보드 (/dashboard)
- **중요도**: ⭐⭐⭐
- **측정 대상**: 복잡한 UI 렌더링
- **기대 점수**: Performance 75-80 (Mobile)

---

## ⚠️ 알려진 이슈

### 1. 백엔드 의존성
- **문제**: 백엔드 API 없이는 일부 페이지 로딩 실패
- **해결**: 백엔드 서버 함께 실행 필요
- **영향**: API 오류로 인한 점수 하락 가능

### 2. HTTPS 미사용
- **문제**: 로컬 개발 환경에서 HTTP 사용
- **해결**: Production 배포 시 HTTPS 적용 필요
- **영향**: Best Practices 점수 -5~10점

### 3. TypeScript 타입 오류
- **문제**: 84개 타입 오류 (빌드 시 무시됨)
- **해결**: Phase 4에서 수정 예정
- **영향**: 런타임 동작에는 영향 없음

---

## 📋 체크리스트

### 측정 전 준비
- [ ] 백엔드 서버 실행 확인
- [ ] 프론트엔드 Preview 서버 실행 확인
- [ ] Chrome 브라우저 최신 버전 확인
- [ ] DevTools Extensions 비활성화 (측정 정확도)
- [ ] 시크릿 모드 사용 (캐시/확장 프로그램 영향 제거)

### 측정 진행
- [ ] Mobile 모드 측정
- [ ] Desktop 모드 측정
- [ ] 각 시나리오별 측정 (홈/게시판/대시보드)
- [ ] 리포트 HTML 다운로드

### 측정 후
- [ ] 점수 문서화
- [ ] 스크린샷 저장
- [ ] Opportunities 검토
- [ ] 개선 계획 수립

---

## 🎉 다음 단계

1. **백엔드 서버 시작**: `cd server-backend && npm start`
2. **프론트엔드 서버 시작**: `cd frontend && npm run preview`
3. **Lighthouse 측정**: Chrome DevTools에서 실행
4. **결과 문서화**: 점수 및 메트릭 기록
5. **Task #7 완료**: TODO 리스트 업데이트
6. **Task #8 진행**: PWA 테스트 및 검증

---

**현재 상태**: Preview 서버 실행 중 (http://localhost:3000)  
**측정 대기**: 백엔드 서버 실행 후 Chrome DevTools Lighthouse 사용

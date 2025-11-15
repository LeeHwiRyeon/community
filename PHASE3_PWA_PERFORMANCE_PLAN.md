# 🚀 Phase 3 - PWA 및 성능 최적화 구현 계획

**작성일**: 2025년 11월 10일  
**프로젝트**: Community Platform v2.0.0  
**예상 기간**: 1주 (5일)  
**우선순위**: P1 (높음)

---

## 📋 목차

1. [현황 분석](#현황-분석)
2. [PWA 구현 계획](#pwa-구현-계획)
3. [성능 최적화 계획](#성능-최적화-계획)
4. [작업 일정](#작업-일정)
5. [검증 기준](#검증-기준)

---

## 📊 현황 분석

### 현재 구성

#### ✅ 이미 구현된 항목

1. **Vite PWA Plugin 설치**
   - `vite-plugin-pwa` 패키지 설치됨
   - `vite.config.ts`에 기본 설정 있음

2. **Service Worker 설정**
   ```typescript
   VitePWA({
       registerType: 'autoUpdate',
       workbox: {
           globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,webp,svg,woff2}'],
           runtimeCaching: [...] // API 캐싱 설정됨
       }
   })
   ```

3. **Web App Manifest 기본 설정**
   ```json
   {
       "name": "Community Platform",
       "short_name": "Community",
       "theme_color": "#2196F3",
       "background_color": "#ffffff",
       "display": "standalone"
   }
   ```

#### ❌ 누락된 항목

1. **PWA 아이콘**
   - `/public/images/icon-192.png` 없음
   - `/public/images/icon-512.png` 없음
   - Favicon 최적화 필요

2. **오프라인 페이지**
   - 네트워크 연결 실패 시 표시할 페이지 없음

3. **설치 프롬프트**
   - "앱 설치하기" 버튼 없음
   - PWA 설치 가능 여부 감지 없음

4. **성능 최적화**
   - 코드 스플리팅 부분적
   - 이미지 최적화 미흡
   - 번들 크기 분석 필요

---

## 🎯 PWA 구현 계획

### 1. PWA 아이콘 생성 (1일차)

#### 작업 내용
- 192x192, 512x512 PNG 아이콘 생성
- Apple Touch Icon (180x180)
- Favicon (32x32, 16x16)
- Maskable icon (512x512)

#### 파일 구조
```
frontend/public/
├── images/
│   ├── icon-192.png         (192x192)
│   ├── icon-512.png         (512x512)
│   ├── icon-maskable.png    (512x512)
│   ├── apple-touch-icon.png (180x180)
│   ├── favicon-32x32.png
│   └── favicon-16x16.png
└── favicon.ico
```

#### Manifest 업데이트
```json
{
  "icons": [
    {
      "src": "/images/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/images/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/images/icon-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

---

### 2. 오프라인 지원 강화 (1일차)

#### 오프라인 페이지 생성

**파일**: `frontend/src/pages/Offline.tsx`

```typescript
import { Box, Heading, Text, Button, VStack, Icon } from '@chakra-ui/react';
import { FiWifiOff } from 'react-icons/fi';

const OfflinePage = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <Box textAlign="center" py={20}>
      <VStack spacing={6}>
        <Icon as={FiWifiOff} boxSize={20} color="gray.400" />
        <Heading>오프라인 상태</Heading>
        <Text color="gray.600">
          인터넷 연결을 확인해주세요.
        </Text>
        <Button colorScheme="blue" onClick={handleRetry}>
          다시 시도
        </Button>
      </VStack>
    </Box>
  );
};

export default OfflinePage;
```

#### Service Worker 설정 업데이트

**파일**: `frontend/vite.config.ts`

```typescript
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    // 오프라인 폴백 추가
    navigateFallback: '/offline.html',
    navigateFallbackDenylist: [/^\/api\//],
    
    // 캐시 전략 개선
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\/api\/.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 5
          }
        }
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|webp|svg|gif)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images-cache',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 30 // 30일
          }
        }
      },
      {
        urlPattern: /\.(?:woff|woff2|ttf|otf)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'fonts-cache',
          expiration: {
            maxEntries: 30,
            maxAgeSeconds: 60 * 60 * 24 * 365 // 1년
          }
        }
      }
    ]
  }
})
```

---

### 3. 설치 프롬프트 구현 (1일차)

#### PWA 설치 컴포넌트

**파일**: `frontend/src/components/PWAInstallPrompt.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  HStack,
  Icon,
  Text,
  useToast,
  Slide
} from '@chakra-ui/react';
import { FiDownload, FiX } from 'react-icons/fi';

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const toast = useToast();

  useEffect(() => {
    // PWA 설치 이벤트 감지
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // 이전에 무시했는지 확인
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 이미 설치되었는지 확인
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsVisible(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      toast({
        title: '설치 완료',
        description: '앱이 성공적으로 설치되었습니다!',
        status: 'success',
        duration: 3000,
      });
    }

    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <Slide direction="bottom" in={isVisible} style={{ zIndex: 10 }}>
      <Box
        p={4}
        bg="blue.500"
        color="white"
        shadow="lg"
      >
        <HStack justify="space-between">
          <HStack spacing={3}>
            <Icon as={FiDownload} boxSize={6} />
            <Box>
              <Text fontWeight="bold">앱으로 설치하기</Text>
              <Text fontSize="sm">더 빠르고 편리하게 이용하세요</Text>
            </Box>
          </HStack>
          <HStack>
            <Button
              colorScheme="whiteAlpha"
              size="sm"
              onClick={handleInstall}
            >
              설치
            </Button>
            <Button
              variant="ghost"
              colorScheme="whiteAlpha"
              size="sm"
              onClick={handleDismiss}
            >
              <Icon as={FiX} />
            </Button>
          </HStack>
        </HStack>
      </Box>
    </Slide>
  );
};

export default PWAInstallPrompt;
```

#### App.tsx에 통합

```typescript
import PWAInstallPrompt from './components/PWAInstallPrompt';

function App() {
  return (
    <>
      {/* 기존 라우터 */}
      <RouterProvider router={router} />
      
      {/* PWA 설치 프롬프트 */}
      <PWAInstallPrompt />
    </>
  );
}
```

---

## ⚡ 성능 최적화 계획

### 1. 코드 스플리팅 (2일차)

#### 라우트 기반 스플리팅

**파일**: `frontend/src/App.tsx`

```typescript
import { lazy, Suspense } from 'react';
import { Spinner, Center } from '@chakra-ui/react';

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Profile = lazy(() => import('./pages/Profile'));
const PostDetail = lazy(() => import('./pages/PostDetail'));
const Search = lazy(() => import('./pages/Search'));

// Loading fallback
const LoadingFallback = () => (
  <Center h="100vh">
    <Spinner size="xl" color="blue.500" />
  </Center>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <Home />
      </Suspense>
    )
  },
  // ... 다른 라우트
]);
```

#### 컴포넌트 레벨 스플리팅

```typescript
// Heavy components
const Chart = lazy(() => import('./components/Chart'));
const Editor = lazy(() => import('./components/Editor'));
const ImageGallery = lazy(() => import('./components/ImageGallery'));

// Usage
<Suspense fallback={<Skeleton height="400px" />}>
  <Chart data={chartData} />
</Suspense>
```

---

### 2. 이미지 최적화 (2일차)

#### React Lazy Load Image

**설치**:
```bash
npm install react-lazy-load-image-component
```

**사용**:
```typescript
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

const OptimizedImage = ({ src, alt }: { src: string; alt: string }) => (
  <LazyLoadImage
    src={src}
    alt={alt}
    effect="blur"
    threshold={100}
  />
);
```

#### WebP 지원

**파일**: `frontend/src/utils/imageOptimizer.ts`

```typescript
export const getOptimizedImageUrl = (url: string, width?: number): string => {
  // WebP 지원 확인
  const supportsWebP = document.createElement('canvas')
    .toDataURL('image/webp')
    .indexOf('data:image/webp') === 0;

  if (supportsWebP) {
    return url.replace(/\.(jpg|jpeg|png)$/, '.webp');
  }

  return url;
};

export const getResponsiveImage = (url: string, width: number) => {
  return `${url}?w=${width}&q=80`;
};
```

---

### 3. 번들 크기 최적화 (3일차)

#### Tree Shaking 확인

**파일**: `frontend/vite.config.ts`

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chakra-vendor': ['@chakra-ui/react', '@emotion/react', '@emotion/styled'],
          'query-vendor': ['@tanstack/react-query'],
          
          // Feature chunks
          'editor': ['./src/components/Editor'],
          'chart': ['./src/components/Chart'],
        }
      }
    },
    
    // 번들 크기 경고 임계값
    chunkSizeWarningLimit: 500,
    
    // 압축
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 프로덕션에서 console.log 제거
        drop_debugger: true
      }
    }
  }
});
```

#### 사용하지 않는 의존성 제거

```bash
# 의존성 분석
npx depcheck

# 번들 분석
npm run build -- --mode analyze
```

---

### 4. Lighthouse 성능 측정 (3일차)

#### 목표 지표

| 항목           | 목표 점수 | 현재 예상  |
| -------------- | --------- | ---------- |
| Performance    | 90+       | 70-80      |
| Accessibility  | 95+       | 85-90      |
| Best Practices | 95+       | 90+        |
| SEO            | 90+       | 80-85      |
| PWA            | 90+       | 0 (미구현) |

#### 측정 스크립트

**파일**: `frontend/scripts/lighthouse.js`

```javascript
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

async function runLighthouse(url) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  
  const options = {
    logLevel: 'info',
    output: 'html',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
    port: chrome.port
  };

  const runnerResult = await lighthouse(url, options);
  
  // 결과 저장
  const fs = require('fs');
  const reportHtml = runnerResult.report;
  fs.writeFileSync('lighthouse-report.html', reportHtml);

  // 점수 출력
  console.log('Performance:', runnerResult.lhr.categories.performance.score * 100);
  console.log('Accessibility:', runnerResult.lhr.categories.accessibility.score * 100);
  console.log('Best Practices:', runnerResult.lhr.categories['best-practices'].score * 100);
  console.log('SEO:', runnerResult.lhr.categories.seo.score * 100);
  console.log('PWA:', runnerResult.lhr.categories.pwa.score * 100);

  await chrome.kill();
}

runLighthouse('http://localhost:5173');
```

---

## 📅 작업 일정

### Day 1: PWA 기본 구현 ✅
- [x] 현황 분석 및 계획 수립
- [ ] PWA 아이콘 생성 (192, 512, maskable)
- [ ] Web App Manifest 완성
- [ ] 오프라인 페이지 생성
- [ ] Service Worker 설정 업데이트

### Day 2: PWA 고급 기능
- [ ] 설치 프롬프트 컴포넌트
- [ ] App.tsx에 통합
- [ ] 설치 이벤트 추적
- [ ] 오프라인 감지 및 처리

### Day 3: 코드 스플리팅
- [ ] 라우트 기반 lazy loading
- [ ] 컴포넌트 레벨 스플리팅
- [ ] Loading fallback 개선
- [ ] Dynamic import 최적화

### Day 4: 이미지 및 번들 최적화
- [ ] React Lazy Load Image 적용
- [ ] WebP 지원 추가
- [ ] 번들 크기 분석
- [ ] Manual chunks 설정
- [ ] Tree shaking 검증

### Day 5: 성능 측정 및 개선
- [ ] Lighthouse CI 설정
- [ ] 성능 점수 측정
- [ ] 병목 지점 식별
- [ ] 최적화 적용
- [ ] 최종 검증

---

## ✅ 검증 기준

### PWA 검증

- [ ] **Installability**
  - [ ] Web App Manifest 올바른 형식
  - [ ] Service Worker 등록됨
  - [ ] HTTPS 또는 localhost
  - [ ] 아이콘 모든 크기 제공

- [ ] **Offline Functionality**
  - [ ] 네트워크 끊김 시 오프라인 페이지 표시
  - [ ] 캐시된 리소스 정상 로드
  - [ ] API 요청 적절히 처리

- [ ] **User Experience**
  - [ ] 설치 프롬프트 표시
  - [ ] 앱처럼 실행 (standalone mode)
  - [ ] 스플래시 화면 (splash screen)
  - [ ] 테마 색상 적용

### 성능 검증

- [ ] **Lighthouse 점수**
  - [ ] Performance: 90+
  - [ ] Accessibility: 95+
  - [ ] Best Practices: 95+
  - [ ] SEO: 90+
  - [ ] PWA: 90+

- [ ] **Core Web Vitals**
  - [ ] LCP (Largest Contentful Paint): < 2.5s
  - [ ] FID (First Input Delay): < 100ms
  - [ ] CLS (Cumulative Layout Shift): < 0.1

- [ ] **번들 크기**
  - [ ] Initial bundle: < 200KB (gzipped)
  - [ ] Total bundle: < 1MB
  - [ ] Chunk 크기: < 500KB

---

## 📦 필요한 패키지

### 설치 목록

```bash
# PWA 관련 (이미 설치됨)
# vite-plugin-pwa

# 이미지 최적화
npm install react-lazy-load-image-component
npm install @types/react-lazy-load-image-component -D

# 성능 측정
npm install lighthouse chrome-launcher -D

# 번들 분석
npm install rollup-plugin-visualizer -D
```

---

## 🎯 다음 단계

1. ✅ PWA 구현 계획 수립 (완료)
2. ⏸️ PWA 아이콘 생성
3. ⏸️ 오프라인 페이지 구현
4. ⏸️ 설치 프롬프트 구현
5. ⏸️ 코드 스플리팅
6. ⏸️ 이미지 최적화
7. ⏸️ 번들 최적화
8. ⏸️ 성능 측정

---

**작성자**: GitHub Copilot  
**작성일**: 2025년 11월 10일  
**버전**: 1.0.0  
**상태**: ✅ 계획 완료

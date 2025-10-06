# UI/UX 디자인 문서

## 📋 개요
Community Platform v1.3의 UI/UX 디자인 시스템 및 가이드라인입니다.

## 🎨 디자인 시스템

### 컬러 팔레트
```css
/* Primary Colors */
--primary-50: #e3f2fd;
--primary-100: #bbdefb;
--primary-500: #2196f3;
--primary-600: #1976d2;
--primary-900: #0d47a1;

/* Secondary Colors */
--secondary-50: #f3e5f5;
--secondary-100: #e1bee7;
--secondary-500: #9c27b0;
--secondary-600: #7b1fa2;
--secondary-900: #4a148c;

/* Neutral Colors */
--gray-50: #fafafa;
--gray-100: #f5f5f5;
--gray-500: #9e9e9e;
--gray-600: #757575;
--gray-900: #212121;

/* Status Colors */
--success: #4caf50;
--warning: #ff9800;
--error: #f44336;
--info: #2196f3;
```

### 타이포그래피
```css
/* Font Family */
--font-primary: 'Inter', 'Roboto', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */

/* Font Weights */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### 간격 시스템
```css
/* Spacing Scale */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### 그림자 시스템
```css
/* Shadow Levels */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

## 🧩 컴포넌트 시스템

### 버튼 컴포넌트
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

// 사용 예시
<Button variant="primary" size="md" icon={<SendIcon />}>
  전송
</Button>
```

### 입력 필드 컴포넌트
```typescript
interface InputProps {
  type: 'text' | 'email' | 'password' | 'search';
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  label?: string;
}

// 사용 예시
<Input
  type="text"
  placeholder="메시지를 입력하세요..."
  icon={<MessageIcon />}
  label="메시지"
/>
```

### 카드 컴포넌트
```typescript
interface CardProps {
  variant: 'default' | 'elevated' | 'outlined';
  padding: 'sm' | 'md' | 'lg';
  hover?: boolean;
  children: React.ReactNode;
}

// 사용 예시
<Card variant="elevated" padding="md" hover>
  <CardHeader>
    <CardTitle>채팅방</CardTitle>
  </CardHeader>
  <CardContent>
    메시지 내용
  </CardContent>
</Card>
```

## 📱 반응형 디자인

### 브레이크포인트
```css
/* Breakpoints */
--breakpoint-sm: 640px;   /* 모바일 */
--breakpoint-md: 768px;   /* 태블릿 */
--breakpoint-lg: 1024px;  /* 데스크톱 */
--breakpoint-xl: 1280px;  /* 대형 데스크톱 */
--breakpoint-2xl: 1536px; /* 초대형 */
```

### 그리드 시스템
```css
/* Grid Layout */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

.grid {
  display: grid;
  gap: var(--space-4);
}

.grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

@media (min-width: 768px) {
  .md\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
  .md\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
}
```

## 🌙 다크모드 지원

### 다크모드 컬러
```css
/* Dark Mode Colors */
[data-theme="dark"] {
  --bg-primary: #121212;
  --bg-secondary: #1e1e1e;
  --bg-tertiary: #2d2d2d;
  
  --text-primary: #ffffff;
  --text-secondary: #b3b3b3;
  --text-tertiary: #808080;
  
  --border-primary: #333333;
  --border-secondary: #404040;
}
```

### 테마 전환
```typescript
const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };
  
  return { theme, toggleTheme };
};
```

## 🎯 사용자 경험 (UX)

### 네비게이션 패턴
- **상단 네비게이션**: 로고, 메인 메뉴, 사용자 메뉴
- **사이드바**: 채팅방 목록, 설정 메뉴
- **브레드크럼**: 현재 위치 표시
- **탭 네비게이션**: 관련 기능 그룹화

### 정보 아키텍처
```
Community Platform
├── 채팅
│   ├── 채팅방 목록
│   ├── 채팅방
│   │   ├── 메시지 목록
│   │   ├── 파일 공유
│   │   └── 참여자 목록
│   └── 새 채팅방 생성
├── 설정
│   ├── 프로필
│   ├── 보안
│   ├── 알림
│   └── 테마
└── 도움말
    ├── 사용자 가이드
    ├── FAQ
    └── 문의하기
```

### 상호작용 패턴
- **호버 효과**: 버튼, 카드에 호버 시 시각적 피드백
- **로딩 상태**: 스피너, 스켈레톤 UI로 로딩 표시
- **에러 상태**: 명확한 에러 메시지와 해결 방법 제시
- **성공 상태**: 작업 완료 시 확인 메시지

## ♿ 접근성 (Accessibility)

### WCAG 2.1 AA 준수
- **색상 대비**: 최소 4.5:1 비율 유지
- **키보드 네비게이션**: 모든 기능 키보드로 접근 가능
- **스크린 리더**: 적절한 ARIA 레이블 제공
- **포커스 표시**: 명확한 포커스 인디케이터

### 접근성 구현
```typescript
// ARIA 레이블 예시
<button
  aria-label="메시지 전송"
  aria-describedby="message-help"
>
  <SendIcon aria-hidden="true" />
</button>

// 키보드 네비게이션
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleClick();
  }
};
```

## 📐 레이아웃 가이드라인

### 채팅 인터페이스
```
┌─────────────────────────────────────┐
│ Header (채팅방 제목, 참여자 수)      │
├─────────────────────────────────────┤
│                                     │
│ Message List (스크롤 가능)          │
│ ├─ 사용자A: 메시지 내용             │
│ ├─ 사용자B: 메시지 내용             │
│ └─ ...                             │
│                                     │
├─────────────────────────────────────┤
│ Input Area (메시지 입력, 전송 버튼)  │
└─────────────────────────────────────┘
```

### 사이드바 레이아웃
```
┌─────────┬──────────────────────────┐
│ Sidebar │ Main Content              │
│         │                          │
│ 채팅방  │ 채팅 메시지               │
│ 목록    │                          │
│         │                          │
│ 설정    │ 파일 공유                 │
│         │                          │
│ 도움말  │ 참여자 목록               │
└─────────┴──────────────────────────┘
```

## 🎨 아이콘 시스템

### 아이콘 라이브러리
- **Material Icons**: Google Material Design 아이콘
- **Heroicons**: Tailwind CSS 아이콘
- **Lucide**: 간결한 선형 아이콘

### 아이콘 사용 가이드
```typescript
// 아이콘 크기
const iconSizes = {
  xs: '12px',
  sm: '16px',
  md: '20px',
  lg: '24px',
  xl: '32px'
};

// 아이콘 사용 예시
<Icon name="send" size="md" color="primary" />
<Icon name="attachment" size="sm" color="secondary" />
```

## 📊 데이터 시각화

### 차트 컴포넌트
```typescript
interface ChartProps {
  type: 'line' | 'bar' | 'pie' | 'doughnut';
  data: ChartData[];
  options?: ChartOptions;
  responsive?: boolean;
}

// 사용 예시
<Chart
  type="line"
  data={performanceData}
  options={{
    responsive: true,
    maintainAspectRatio: false
  }}
/>
```

### 메트릭 카드
```typescript
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  icon?: React.ReactNode;
}

// 사용 예시
<MetricCard
  title="활성 사용자"
  value="1,234"
  change={12.5}
  trend="up"
  icon={<UsersIcon />}
/>
```

## 🔄 애니메이션 가이드

### 전환 효과
```css
/* 기본 전환 */
.transition {
  transition: all 0.2s ease-in-out;
}

/* 페이드 인/아웃 */
.fade-enter {
  opacity: 0;
  transform: translateY(10px);
}

.fade-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.3s, transform 0.3s;
}

/* 슬라이드 효과 */
.slide-enter {
  transform: translateX(-100%);
}

.slide-enter-active {
  transform: translateX(0);
  transition: transform 0.3s ease-out;
}
```

### 마이크로 인터랙션
- **버튼 클릭**: 약간의 스케일 변화
- **호버 효과**: 색상 변화, 그림자 증가
- **로딩**: 회전하는 스피너
- **성공/에러**: 색상 변화와 아이콘 애니메이션

## 📱 모바일 최적화

### 터치 인터페이스
- **터치 타겟**: 최소 44px × 44px
- **제스처**: 스와이프, 핀치 줌 지원
- **터치 피드백**: 햅틱 피드백 제공

### 모바일 레이아웃
```css
/* 모바일 우선 설계 */
.mobile-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.mobile-header {
  position: sticky;
  top: 0;
  z-index: 100;
}

.mobile-content {
  flex: 1;
  overflow-y: auto;
}

.mobile-bottom-nav {
  position: sticky;
  bottom: 0;
  z-index: 100;
}
```

## 🎯 성능 최적화

### 이미지 최적화
- **WebP 포맷**: 최신 이미지 포맷 사용
- **지연 로딩**: Intersection Observer API
- **반응형 이미지**: 디바이스별 최적화
- **압축**: 이미지 품질 최적화

### CSS 최적화
- **Critical CSS**: 중요 CSS 인라인화
- **CSS 압축**: 불필요한 공백 제거
- **CSS 분할**: 페이지별 CSS 분할
- **CSS 변수**: 재사용 가능한 스타일

## 📋 체크리스트

### 디자인 품질
- [ ] 컬러 대비 4.5:1 이상
- [ ] 일관된 간격 시스템 사용
- [ ] 반응형 디자인 적용
- [ ] 다크모드 지원
- [ ] 접근성 가이드라인 준수

### 사용자 경험
- [ ] 직관적인 네비게이션
- [ ] 명확한 피드백 제공
- [ ] 로딩 상태 표시
- [ ] 에러 처리 및 복구
- [ ] 모바일 최적화

### 기술적 구현
- [ ] 컴포넌트 재사용성
- [ ] 성능 최적화
- [ ] 브라우저 호환성
- [ ] SEO 최적화
- [ ] 보안 고려사항

---

**UI/UX 디자인 문서 v1.3** - 2024년 10월 최신 버전

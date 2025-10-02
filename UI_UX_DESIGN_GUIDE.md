# 🎨 Community Platform v1.1 - UI/UX 디자인 가이드

**Community Platform v1.1**의 사용자 인터페이스와 사용자 경험 디자인 가이드입니다. 일관성 있고 직관적인 디자인을 위한 완벽한 가이드를 제공합니다.

## 🎯 **디자인 철학**

### **핵심 원칙**
1. **🎯 사용자 중심**: 사용자의 니즈를 최우선으로 고려
2. **🔄 일관성**: 모든 페이지에서 통일된 경험 제공
3. **⚡ 직관성**: 학습 없이도 쉽게 사용할 수 있는 인터페이스
4. **♿ 접근성**: 모든 사용자가 접근 가능한 디자인
5. **📱 반응성**: 모든 디바이스에서 최적화된 경험

### **브랜드 아이덴티티**
- **현대적이고 깔끔한** 디자인
- **친근하고 따뜻한** 느낌
- **전문적이면서도 접근하기 쉬운** 이미지
- **다양성과 포용성**을 반영하는 디자인

## 🎨 **컬러 시스템**

### **기본 컬러 팔레트**
```css
/* 주요 브랜드 컬러 */
--primary-50: #f0f9ff;    /* 매우 연한 파랑 */
--primary-100: #e0f2fe;   /* 연한 파랑 */
--primary-500: #0ea5e9;   /* 메인 파랑 */
--primary-600: #0284c7;   /* 진한 파랑 */
--primary-900: #0c4a6e;   /* 매우 진한 파랑 */

/* 보조 컬러 */
--secondary-50: #fefce8;  /* 연한 노랑 */
--secondary-500: #eab308; /* 메인 노랑 */
--secondary-600: #ca8a04; /* 진한 노랑 */

/* 중성 컬러 */
--gray-50: #f9fafb;       /* 매우 연한 회색 */
--gray-100: #f3f4f6;      /* 연한 회색 */
--gray-500: #6b7280;      /* 중간 회색 */
--gray-700: #374151;      /* 진한 회색 */
--gray-900: #111827;      /* 매우 진한 회색 */
```

### **상태별 컬러**
```css
/* 성공 */
--success-50: #f0fdf4;
--success-500: #22c55e;
--success-600: #16a34a;

/* 경고 */
--warning-50: #fffbeb;
--warning-500: #f59e0b;
--warning-600: #d97706;

/* 오류 */
--error-50: #fef2f2;
--error-500: #ef4444;
--error-600: #dc2626;

/* 정보 */
--info-50: #eff6ff;
--info-500: #3b82f6;
--info-600: #2563eb;
```

### **다크 모드 컬러**
```css
/* 다크 모드 기본 */
--dark-bg-primary: #0f172a;    /* 메인 배경 */
--dark-bg-secondary: #1e293b;  /* 카드 배경 */
--dark-text-primary: #f1f5f9;  /* 메인 텍스트 */
--dark-text-secondary: #94a3b8; /* 보조 텍스트 */
--dark-border: #334155;         /* 테두리 */
```

## 📝 **타이포그래피**

### **폰트 패밀리**
```css
/* 한글 + 영문 */
font-family: 
  'Pretendard Variable', 'Pretendard',
  -apple-system, BlinkMacSystemFont, 
  'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell',
  'Fira Sans', 'Droid Sans', 'Helvetica Neue',
  sans-serif;

/* 코드/모노스페이스 */
font-family: 
  'JetBrains Mono', 'Fira Code', 'Consolas', 
  'Monaco', 'Courier New', monospace;
```

### **텍스트 크기 시스템**
```css
/* 제목 */
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */
--text-5xl: 3rem;       /* 48px */

/* 줄 간격 */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
```

### **폰트 두께**
```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
```

## 📏 **간격 시스템**

### **스페이싱 스케일**
```css
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

### **컨테이너 너비**
```css
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;
```

## 🔘 **컴포넌트 디자인**

### **버튼 시스템**

#### **기본 버튼**
```css
/* Primary Button */
.btn-primary {
  background: var(--primary-500);
  color: white;
  padding: var(--space-3) var(--space-6);
  border-radius: 0.5rem;
  font-weight: var(--font-medium);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: var(--primary-600);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--primary-500);
  border: 1px solid var(--primary-500);
  padding: var(--space-3) var(--space-6);
  border-radius: 0.5rem;
  font-weight: var(--font-medium);
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: var(--gray-700);
  padding: var(--space-3) var(--space-6);
  border-radius: 0.5rem;
}

.btn-ghost:hover {
  background: var(--gray-100);
}
```

#### **버튼 크기**
```css
.btn-xs { padding: var(--space-1) var(--space-3); font-size: var(--text-xs); }
.btn-sm { padding: var(--space-2) var(--space-4); font-size: var(--text-sm); }
.btn-md { padding: var(--space-3) var(--space-6); font-size: var(--text-base); }
.btn-lg { padding: var(--space-4) var(--space-8); font-size: var(--text-lg); }
.btn-xl { padding: var(--space-5) var(--space-10); font-size: var(--text-xl); }
```

### **카드 컴포넌트**
```css
.card {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.06);
  padding: var(--space-6);
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: 
    0 10px 25px rgba(0, 0, 0, 0.1),
    0 4px 6px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.card-header {
  border-bottom: 1px solid var(--gray-200);
  padding-bottom: var(--space-4);
  margin-bottom: var(--space-4);
}

.card-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--gray-900);
}

.card-content {
  color: var(--gray-700);
  line-height: var(--leading-relaxed);
}
```

### **입력 필드**
```css
.input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--gray-300);
  border-radius: 0.5rem;
  font-size: var(--text-base);
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.input:invalid {
  border-color: var(--error-500);
}

.input-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--gray-700);
  margin-bottom: var(--space-2);
}

.input-error {
  font-size: var(--text-sm);
  color: var(--error-500);
  margin-top: var(--space-1);
}
```

## 📱 **반응형 디자인**

### **브레이크포인트**
```css
/* Mobile First 접근법 */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

### **그리드 시스템**
```css
.container {
  width: 100%;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

@media (min-width: 640px) {
  .container { max-width: 640px; }
}

@media (min-width: 768px) {
  .container { max-width: 768px; }
}

@media (min-width: 1024px) {
  .container { max-width: 1024px; }
}

.grid {
  display: grid;
  gap: var(--space-6);
}

.grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

/* 반응형 그리드 */
@media (min-width: 768px) {
  .md\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
  .md\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
}

@media (min-width: 1024px) {
  .lg\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
  .lg\:grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
}
```

## 🎭 **애니메이션 및 전환**

### **기본 전환 효과**
```css
/* 부드러운 전환 */
.transition-smooth {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.transition-bounce {
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* 페이드 인/아웃 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeOut {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-10px); }
}

.fade-in {
  animation: fadeIn 0.3s ease-out;
}

.fade-out {
  animation: fadeOut 0.3s ease-out;
}
```

### **로딩 애니메이션**
```css
/* 스피너 */
@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--gray-200);
  border-top: 2px solid var(--primary-500);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 펄스 효과 */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

## ♿ **접근성 가이드라인**

### **색상 대비**
- **텍스트**: 최소 4.5:1 대비율 (WCAG AA)
- **큰 텍스트**: 최소 3:1 대비율
- **UI 요소**: 최소 3:1 대비율

### **키보드 네비게이션**
```css
/* 포커스 표시 */
.focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

/* 스킵 링크 */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--primary-500);
  color: white;
  padding: 8px;
  text-decoration: none;
  border-radius: 4px;
}

.skip-link:focus {
  top: 6px;
}
```

### **스크린 리더 지원**
```css
/* 시각적으로 숨김 (스크린 리더용) */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

## 📐 **레이아웃 패턴**

### **헤더 레이아웃**
```css
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) 0;
  border-bottom: 1px solid var(--gray-200);
}

.header-logo {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--primary-500);
}

.header-nav {
  display: flex;
  gap: var(--space-6);
}

.header-actions {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}
```

### **사이드바 레이아웃**
```css
.layout-sidebar {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: var(--space-8);
  min-height: 100vh;
}

.sidebar {
  background: var(--gray-50);
  padding: var(--space-6);
  border-right: 1px solid var(--gray-200);
}

.main-content {
  padding: var(--space-6);
  max-width: 100%;
  overflow-x: auto;
}

/* 모바일에서 사이드바 숨김 */
@media (max-width: 768px) {
  .layout-sidebar {
    grid-template-columns: 1fr;
  }
  
  .sidebar {
    display: none;
  }
}
```

## 🎨 **다크 모드 구현**

### **테마 전환**
```css
/* 라이트 모드 (기본) */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --border-color: #e5e7eb;
}

/* 다크 모드 */
[data-theme="dark"] {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --border-color: #334155;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

### **테마 토글 버튼**
```css
.theme-toggle {
  position: relative;
  width: 50px;
  height: 24px;
  background: var(--gray-300);
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.theme-toggle::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s ease;
}

[data-theme="dark"] .theme-toggle {
  background: var(--primary-500);
}

[data-theme="dark"] .theme-toggle::before {
  transform: translateX(26px);
}
```

## 📊 **성능 최적화**

### **CSS 최적화**
```css
/* 하드웨어 가속 활용 */
.gpu-accelerated {
  transform: translateZ(0);
  will-change: transform;
}

/* 효율적인 애니메이션 */
.efficient-animation {
  transform: translateX(0);
  transition: transform 0.3s ease;
}

.efficient-animation:hover {
  transform: translateX(10px);
}

/* 레이아웃 리플로우 방지 */
.no-reflow {
  position: absolute;
  top: 0;
  left: 0;
}
```

### **이미지 최적화**
```css
/* 반응형 이미지 */
.responsive-image {
  width: 100%;
  height: auto;
  object-fit: cover;
}

/* 지연 로딩 */
.lazy-image {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.lazy-image.loaded {
  opacity: 1;
}
```

## 🔧 **개발자 도구**

### **디버깅 유틸리티**
```css
/* 레이아웃 디버깅 */
.debug * {
  outline: 1px solid red;
}

.debug-grid {
  background-image: 
    linear-gradient(rgba(255,0,0,0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,0,0,0.1) 1px, transparent 1px);
  background-size: 20px 20px;
}

/* 접근성 체크 */
.a11y-check [tabindex="-1"]:focus {
  outline: 3px solid orange !important;
}
```

### **컴포넌트 문서화**
```css
/* 컴포넌트 예시 */
.component-example {
  padding: var(--space-6);
  border: 1px solid var(--gray-200);
  border-radius: 0.5rem;
  margin: var(--space-4) 0;
}

.component-code {
  background: var(--gray-100);
  padding: var(--space-4);
  border-radius: 0.25rem;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  overflow-x: auto;
}
```

---

## 🎉 **마무리**

이 디자인 가이드를 따라 **Community Platform v1.1**의 일관성 있고 사용자 친화적인 인터페이스를 구축하세요!

### **핵심 포인트**
- ✅ **일관성**: 모든 컴포넌트에서 동일한 패턴 사용
- ✅ **접근성**: WCAG 가이드라인 준수
- ✅ **반응형**: 모든 디바이스에서 최적화
- ✅ **성능**: 빠르고 부드러운 사용자 경험
- ✅ **유지보수**: 확장 가능하고 관리하기 쉬운 코드

**아름답고 기능적인 사용자 인터페이스를 만들어보세요!** 🚀✨

---

**📅 마지막 업데이트**: 2025-10-02  
**📋 버전**: v1.1  
**🔤 인코딩**: UTF-8 (BOM 없음)

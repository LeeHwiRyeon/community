# 접근성 개선 가이드 (Accessibility Enhancement Guide)

## 📋 목차
- [1. 개요](#1-개요)
- [2. 현재 접근성 현황](#2-현재-접근성-현황)
- [3. WCAG 2.1 AA 준수 전략](#3-wcag-21-aa-준수-전략)
- [4. 시맨틱 HTML](#4-시맨틱-html)
- [5. ARIA 속성 추가](#5-aria-속성-추가)
- [6. 키보드 네비게이션](#6-키보드-네비게이션)
- [7. 스크린 리더 지원](#7-스크린-리더-지원)
- [8. 색상 및 대비](#8-색상-및-대비)
- [9. 폼 접근성](#9-폼-접근성)
- [10. 이미지 및 미디어](#10-이미지-및-미디어)
- [11. 접근성 테스트](#11-접근성-테스트)
- [12. 체크리스트](#12-체크리스트)
- [13. 구현 로드맵](#13-구현-로드맵)

---

## 1. 개요

### 1.1 목표
커뮤니티 플랫폼을 모든 사용자가 접근 가능하도록 만들기 위해 **WCAG 2.1 AA 표준**을 준수합니다.

### 1.2 주요 원칙 (POUR)
- **Perceivable** (인지 가능): 모든 콘텐츠는 인지할 수 있어야 함
- **Operable** (운영 가능): UI는 키보드로 조작 가능해야 함
- **Understandable** (이해 가능): 정보와 UI는 이해하기 쉬워야 함
- **Robust** (견고함): 다양한 보조 기술과 호환되어야 함

### 1.3 목표 기준
| 항목                   | 현재      | 목표      |
| ---------------------- | --------- | --------- |
| WCAG 2.1 준수          | Partial   | AA Level  |
| Lighthouse 접근성 점수 | ~75       | 90+       |
| 키보드 네비게이션      | 부분 지원 | 전체 지원 |
| 스크린 리더 호환성     | 제한적    | 완전 지원 |
| 색상 대비율            | ~3:1      | 4.5:1+    |

---

## 2. 현재 접근성 현황

### 2.1 ✅ 이미 구현된 기능

#### 기본 ARIA 속성
```tsx
// LanguageSwitcher.tsx
<IconButton
    aria-label={t('common.language')}
    aria-controls={open ? 'language-menu' : undefined}
    aria-haspopup="true"
    aria-expanded={open ? 'true' : undefined}
/>

// NotificationBell.tsx
<IconButton
    aria-label="알림"
    icon={<BellIcon />}
/>

// ProfilePage.tsx
<TabPanel
    role="tabpanel"
    aria-labelledby={`profile-tab-${index}`}
/>
```

#### 이미지 Alt 텍스트
```tsx
// ImageUpload.tsx
<img src={url} alt={`Preview ${index + 1}`} />
<img src={image.url} alt={image.originalName} />

// CosplayShop.tsx
<img src={costume.image} alt={costume.name} />
```

#### 다크 모드 지원
```css
/* theme.css - 색상 대비 고려 */
[data-theme='dark'] {
    --color-background: #0f172a;
    --color-text-primary: #f1f5f9;
}
```

### 2.2 ❌ 개선 필요 영역

1. **시맨틱 HTML 부족**
   - `<div>` 남용, `<section>`, `<article>`, `<nav>` 부족
   
2. **키보드 네비게이션 불완전**
   - Focus trap 없음
   - Skip navigation 없음
   - 일부 인터랙티브 요소에 tabindex 누락

3. **색상 대비 미달**
   - 일부 텍스트 색상이 WCAG AA 기준(4.5:1) 미달

4. **폼 레이블 누락**
   - 일부 입력 필드에 명확한 레이블 없음

5. **동적 콘텐츠 알림 부족**
   - 실시간 알림 시 스크린 리더 알림 없음
   - Loading 상태 알림 없음

---

## 3. WCAG 2.1 AA 준수 전략

### 3.1 인지 가능 (Perceivable)

#### 대체 텍스트 (1.1.1)
```tsx
// ❌ Before
<img src={avatar} />
<IconButton icon={<EditIcon />} />

// ✅ After
<img src={avatar} alt={user.name} />
<IconButton 
    icon={<EditIcon />} 
    aria-label="프로필 수정" 
/>
```

#### 색상에만 의존하지 않기 (1.4.1)
```tsx
// ❌ Before
<Text color="red">오류 발생</Text>

// ✅ After
<Alert status="error" role="alert">
    <AlertIcon /> {/* 시각적 아이콘 추가 */}
    <AlertDescription>오류 발생</AlertDescription>
</Alert>
```

#### 색상 대비 (1.4.3)
```css
/* ❌ Before - 대비율 3:1 */
--color-text-secondary: #94a3b8; /* on white */

/* ✅ After - 대비율 4.5:1+ */
--color-text-secondary: #475569; /* on white */
--color-text-secondary-dark: #cbd5e1; /* on dark */
```

#### 텍스트 크기 조정 (1.4.4)
```css
/* rem 단위 사용으로 사용자 설정 존중 */
body {
    font-size: 1rem; /* 16px */
}

h1 {
    font-size: 2rem; /* 32px */
}

/* 200%까지 확대 시에도 레이아웃 깨지지 않도록 */
@media (max-width: 768px) {
    .container {
        padding: 1rem;
        overflow-x: auto;
    }
}
```

### 3.2 운영 가능 (Operable)

#### 키보드 접근 (2.1.1)
```tsx
// 모든 인터랙티브 요소에 키보드 접근 가능
const CustomButton = ({ onClick, children }) => {
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
        }
    };

    return (
        <Box
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyPress={handleKeyPress}
            cursor="pointer"
        >
            {children}
        </Box>
    );
};
```

#### Focus 순서 (2.4.3)
```tsx
// tabindex를 논리적 순서로 설정
<form>
    <input type="text" name="username" tabIndex={1} />
    <input type="email" name="email" tabIndex={2} />
    <button type="submit" tabIndex={3}>제출</button>
</form>
```

#### 페이지 제목 (2.4.2)
```tsx
// 각 페이지마다 명확한 제목
import { Helmet } from 'react-helmet-async';

const ProfilePage = () => (
    <>
        <Helmet>
            <title>프로필 - 커뮤니티 플랫폼</title>
        </Helmet>
        <main>
            <h1>사용자 프로필</h1>
            {/* 내용 */}
        </main>
    </>
);
```

#### Skip Navigation (2.4.1)
```tsx
// App.tsx에 추가
const SkipNav = () => (
    <a
        href="#main-content"
        style={{
            position: 'absolute',
            left: '-9999px',
            zIndex: 999,
        }}
        onFocus={(e) => {
            e.target.style.left = '0';
        }}
        onBlur={(e) => {
            e.target.style.left = '-9999px';
        }}
    >
        본문으로 건너뛰기
    </a>
);

function App() {
    return (
        <>
            <SkipNav />
            <Navbar />
            <main id="main-content" tabIndex={-1}>
                {/* 페이지 내용 */}
            </main>
        </>
    );
}
```

### 3.3 이해 가능 (Understandable)

#### 명확한 레이블 (3.3.2)
```tsx
// ❌ Before
<input type="text" placeholder="이름" />

// ✅ After
<FormControl>
    <FormLabel htmlFor="username">사용자 이름</FormLabel>
    <Input
        id="username"
        type="text"
        placeholder="이름을 입력하세요"
        aria-required="true"
        aria-describedby="username-hint"
    />
    <FormHelperText id="username-hint">
        2-20자 사이로 입력해주세요
    </FormHelperText>
</FormControl>
```

#### 오류 식별 (3.3.1)
```tsx
// 폼 검증 오류를 명확하게 표시
const [errors, setErrors] = useState<Record<string, string>>({});

<FormControl isInvalid={!!errors.email}>
    <FormLabel htmlFor="email">이메일</FormLabel>
    <Input
        id="email"
        type="email"
        aria-invalid={!!errors.email}
        aria-describedby="email-error"
    />
    {errors.email && (
        <FormErrorMessage id="email-error" role="alert">
            {errors.email}
        </FormErrorMessage>
    )}
</FormControl>
```

### 3.4 견고함 (Robust)

#### 유효한 HTML (4.1.1)
```tsx
// 시맨틱 HTML 사용
<article>
    <header>
        <h2>{post.title}</h2>
        <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
    </header>
    <section>
        {post.content}
    </section>
    <footer>
        <button aria-label="좋아요">👍 {post.likes}</button>
    </footer>
</article>
```

---

## 4. 시맨틱 HTML

### 4.1 레이아웃 구조

```tsx
// ❌ Before - div 남용
<div className="header">
    <div className="nav">
        <div className="nav-item">홈</div>
    </div>
</div>
<div className="main">
    <div className="post">
        <div className="post-title">제목</div>
        <div className="post-content">내용</div>
    </div>
</div>

// ✅ After - 시맨틱 HTML
<header>
    <nav aria-label="주 메뉴">
        <ul>
            <li><Link to="/">홈</Link></li>
            <li><Link to="/community">커뮤니티</Link></li>
        </ul>
    </nav>
</header>

<main id="main-content">
    <article>
        <header>
            <h1>게시글 제목</h1>
            <p>작성자: <span>{author}</span></p>
        </header>
        <section>
            {content}
        </section>
        <footer>
            <button>좋아요</button>
            <button>댓글</button>
        </footer>
    </article>
</main>

<footer>
    <p>&copy; 2025 커뮤니티 플랫폼</p>
</footer>
```

### 4.2 랜드마크 역할

```tsx
// 명확한 랜드마크로 페이지 구조화
const Layout = ({ children }) => (
    <div>
        <header role="banner">
            <nav role="navigation" aria-label="주 메뉴">
                <Navbar />
            </nav>
        </header>

        <main role="main" id="main-content">
            {children}
        </main>

        <aside role="complementary" aria-label="사이드바">
            <Sidebar />
        </aside>

        <footer role="contentinfo">
            <Footer />
        </footer>
    </div>
);
```

---

## 5. ARIA 속성 추가

### 5.1 모달 다이얼로그

```tsx
const AccessibleModal = ({ isOpen, onClose, title, children }) => {
    const initialFocusRef = useRef<HTMLButtonElement>(null);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            initialFocusRef={initialFocusRef}
        >
            <ModalOverlay />
            <ModalContent
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                aria-describedby="modal-description"
            >
                <ModalHeader id="modal-title">{title}</ModalHeader>
                <ModalCloseButton
                    aria-label="닫기"
                    ref={initialFocusRef}
                />
                <ModalBody id="modal-description">
                    {children}
                </ModalBody>
                <ModalFooter>
                    <Button onClick={onClose}>확인</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};
```

### 5.2 드롭다운 메뉴

```tsx
const AccessibleDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Box>
            <Button
                onClick={() => setIsOpen(!isOpen)}
                aria-haspopup="true"
                aria-expanded={isOpen}
                aria-controls="dropdown-menu"
            >
                메뉴
            </Button>
            
            {isOpen && (
                <Menu
                    id="dropdown-menu"
                    role="menu"
                    aria-orientation="vertical"
                >
                    <MenuItem role="menuitem">항목 1</MenuItem>
                    <MenuItem role="menuitem">항목 2</MenuItem>
                    <MenuItem role="menuitem">항목 3</MenuItem>
                </Menu>
            )}
        </Box>
    );
};
```

### 5.3 실시간 업데이트 (Live Regions)

```tsx
// NotificationCenter.tsx 개선
const NotificationCenter = () => {
    const { notifications } = useNotifications();

    return (
        <Box>
            {/* 실시간 알림 영역 */}
            <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
            >
                {notifications.length > 0 && (
                    `새 알림 ${notifications.length}개`
                )}
            </div>

            {/* 알림 목록 */}
            <List aria-label="알림 목록">
                {notifications.map((notification) => (
                    <ListItem key={notification.id}>
                        <Alert status={notification.type}>
                            <AlertIcon />
                            <AlertDescription>
                                {notification.message}
                            </AlertDescription>
                        </Alert>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};
```

### 5.4 로딩 상태

```tsx
const LoadingSpinner = ({ text = '로딩 중...' }) => (
    <Box
        role="status"
        aria-live="polite"
        aria-busy="true"
    >
        <Spinner />
        <Text className="sr-only">{text}</Text>
    </Box>
);

// 사용 예시
{isLoading && <LoadingSpinner text="게시글을 불러오는 중..." />}
```

---

## 6. 키보드 네비게이션

### 6.1 Focus 관리

```tsx
// FocusTrap for Modals
import { useFocusTrap } from '@chakra-ui/react';

const AccessibleModal = ({ isOpen, onClose, children }) => {
    const focusTrapRef = useFocusTrap({ isOpen });

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalContent ref={focusTrapRef}>
                {children}
            </ModalContent>
        </Modal>
    );
};
```

### 6.2 키보드 단축키

```tsx
// useKeyboardShortcuts hook
const useKeyboardShortcuts = () => {
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Ctrl+K: 검색
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                // 검색 모달 열기
            }

            // Esc: 모달 닫기
            if (e.key === 'Escape') {
                // 열린 모달 닫기
            }

            // /: 검색 포커스
            if (e.key === '/' && !isInputFocused()) {
                e.preventDefault();
                // 검색 input에 포커스
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, []);
};

// App.tsx에서 사용
function App() {
    useKeyboardShortcuts();
    return <Routes />;
}
```

### 6.3 Tab 순서 최적화

```tsx
// 논리적 tab 순서 유지
<form>
    {/* tabIndex 명시적 설정 불필요 - DOM 순서대로 자동 */}
    <Input name="username" placeholder="사용자명" />
    <Input name="email" placeholder="이메일" />
    <Input name="password" type="password" placeholder="비밀번호" />
    
    {/* 링크는 자연스럽게 tab 순서에 포함 */}
    <Link to="/forgot-password">비밀번호 찾기</Link>
    
    <Button type="submit">로그인</Button>
</form>

// 특수한 경우에만 tabIndex 사용
<div
    role="button"
    tabIndex={0}  // 포커스 가능하게 만들기
    onClick={handleClick}
    onKeyPress={handleKeyPress}
>
    커스텀 버튼
</div>

<div tabIndex={-1}>  // 프로그래밍 방식으로만 포커스 가능 (tab으로는 불가)
    스킵 대상
</div>
```

### 6.4 Focus Indicator 스타일

```css
/* 명확한 focus 표시 */
*:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
}

/* 키보드 사용자에게만 표시 (:focus-visible) */
button:focus-visible,
a:focus-visible,
input:focus-visible {
    outline: 3px solid var(--color-primary);
    outline-offset: 2px;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
}

/* 마우스 클릭 시에는 outline 숨김 */
button:focus:not(:focus-visible) {
    outline: none;
}
```

---

## 7. 스크린 리더 지원

### 7.1 스크린 리더 전용 텍스트

```css
/* sr-only 클래스 - 스크린 리더에만 보임 */
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
}

/* 포커스 시 보이도록 */
.sr-only:focus {
    position: static;
    width: auto;
    height: auto;
    padding: inherit;
    margin: inherit;
    overflow: visible;
    clip: auto;
    white-space: normal;
}
```

```tsx
// 사용 예시
<button>
    <EditIcon />
    <span className="sr-only">프로필 수정</span>
</button>

<Link to="/settings">
    <SettingsIcon />
    <span className="sr-only">설정 페이지로 이동</span>
</Link>
```

### 7.2 aria-label vs aria-labelledby

```tsx
// aria-label: 간단한 레이블
<button aria-label="검색">
    <SearchIcon />
</button>

// aria-labelledby: 기존 요소 참조
<section aria-labelledby="posts-heading">
    <h2 id="posts-heading">인기 게시글</h2>
    {/* 게시글 목록 */}
</section>

// aria-describedby: 추가 설명
<Input
    id="password"
    type="password"
    aria-describedby="password-hint"
/>
<Text id="password-hint" fontSize="sm" color="gray.500">
    8자 이상, 영문, 숫자, 특수문자 포함
</Text>
```

### 7.3 동적 콘텐츠 알림

```tsx
// 알림 메시지 (assertive = 즉시 알림)
const ErrorAlert = ({ message }) => (
    <Alert status="error" role="alert" aria-live="assertive">
        <AlertIcon />
        <AlertDescription>{message}</AlertDescription>
    </Alert>
);

// 상태 메시지 (polite = 현재 작업 후 알림)
const SuccessMessage = ({ message }) => (
    <div role="status" aria-live="polite">
        {message}
    </div>
);

// 사용 예시
const PostForm = () => {
    const [status, setStatus] = useState('');

    const handleSubmit = async () => {
        setStatus('게시글을 저장하는 중...');
        await savePost();
        setStatus('게시글이 저장되었습니다.');
    };

    return (
        <form onSubmit={handleSubmit}>
            {/* 폼 필드 */}
            
            {status && (
                <div role="status" aria-live="polite">
                    {status}
                </div>
            )}
        </form>
    );
};
```

---

## 8. 색상 및 대비

### 8.1 색상 대비율 개선

```css
/* ❌ Before - 대비율 미달 */
:root {
    --color-text-secondary: #94a3b8; /* 대비율 2.8:1 */
    --color-border: #e2e8f0;
}

/* ✅ After - WCAG AA 준수 (4.5:1+) */
:root {
    /* Light Mode */
    --color-text-primary: #0f172a;      /* 대비율 14.6:1 */
    --color-text-secondary: #475569;    /* 대비율 7.1:1 */
    --color-text-disabled: #64748b;     /* 대비율 4.6:1 */
    
    --color-primary: #2563eb;           /* 대비율 5.3:1 */
    --color-error: #dc2626;             /* 대비율 5.9:1 */
    --color-success: #059669;           /* 대비율 4.5:1 */
}

[data-theme='dark'] {
    /* Dark Mode */
    --color-text-primary: #f1f5f9;      /* 대비율 12.6:1 */
    --color-text-secondary: #cbd5e1;    /* 대비율 8.2:1 */
    --color-text-disabled: #94a3b8;     /* 대비율 4.8:1 */
    
    --color-primary: #60a5fa;           /* 대비율 5.7:1 */
    --color-error: #f87171;             /* 대비율 6.1:1 */
    --color-success: #34d399;           /* 대비율 4.7:1 */
}
```

### 8.2 색상 대비 체크 도구

```tsx
// 개발 중 대비율 검증 유틸리티
const checkContrast = (foreground: string, background: string): number => {
    // https://www.w3.org/TR/WCAG20-TECHS/G17.html
    const getLuminance = (hex: string): number => {
        const rgb = parseInt(hex.slice(1), 16);
        const r = ((rgb >> 16) & 0xff) / 255;
        const g = ((rgb >> 8) & 0xff) / 255;
        const b = ((rgb >> 0) & 0xff) / 255;

        const [rs, gs, bs] = [r, g, b].map(c =>
            c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
        );

        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    return Math.round(ratio * 10) / 10;
};

// 사용 예시
console.log(checkContrast('#475569', '#ffffff')); // 7.1 (WCAG AA ✅)
console.log(checkContrast('#94a3b8', '#ffffff')); // 2.8 (WCAG AA ❌)
```

### 8.3 색상에만 의존하지 않기

```tsx
// ❌ Before - 색상으로만 상태 표시
<Text color="red">오류</Text>
<Text color="green">성공</Text>

// ✅ After - 아이콘과 함께 사용
<Alert status="error">
    <AlertIcon /> {/* ❌ 아이콘 */}
    <AlertDescription>오류가 발생했습니다</AlertDescription>
</Alert>

<Alert status="success">
    <AlertIcon /> {/* ✅ 아이콘 */}
    <AlertDescription>저장되었습니다</AlertDescription>
</Alert>

// 그래프에도 패턴 추가
<Chart
    data={data}
    colors={['#2563eb', '#059669', '#dc2626']}
    patterns={['solid', 'dashed', 'dotted']} // 색맹 사용자를 위한 패턴
/>
```

---

## 9. 폼 접근성

### 9.1 명확한 레이블

```tsx
// ✅ 접근 가능한 폼
const AccessibleForm = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    return (
        <form onSubmit={handleSubmit}>
            {/* 사용자명 */}
            <FormControl isRequired isInvalid={!!errors.username}>
                <FormLabel htmlFor="username">
                    사용자명
                </FormLabel>
                <Input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    aria-required="true"
                    aria-invalid={!!errors.username}
                    aria-describedby="username-hint username-error"
                />
                <FormHelperText id="username-hint">
                    2-20자 사이로 입력해주세요
                </FormHelperText>
                {errors.username && (
                    <FormErrorMessage id="username-error" role="alert">
                        {errors.username}
                    </FormErrorMessage>
                )}
            </FormControl>

            {/* 이메일 */}
            <FormControl isRequired isInvalid={!!errors.email}>
                <FormLabel htmlFor="email">이메일</FormLabel>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    aria-required="true"
                    aria-invalid={!!errors.email}
                    aria-describedby="email-error"
                />
                {errors.email && (
                    <FormErrorMessage id="email-error" role="alert">
                        {errors.email}
                    </FormErrorMessage>
                )}
            </FormControl>

            {/* 비밀번호 */}
            <FormControl isRequired isInvalid={!!errors.password}>
                <FormLabel htmlFor="password">비밀번호</FormLabel>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    aria-required="true"
                    aria-invalid={!!errors.password}
                    aria-describedby="password-hint password-error"
                />
                <FormHelperText id="password-hint">
                    8자 이상, 영문, 숫자, 특수문자 포함
                </FormHelperText>
                {errors.password && (
                    <FormErrorMessage id="password-error" role="alert">
                        {errors.password}
                    </FormErrorMessage>
                )}
            </FormControl>

            <Button type="submit">가입하기</Button>
        </form>
    );
};
```

### 9.2 라디오/체크박스 그룹

```tsx
// 접근 가능한 라디오 그룹
<FormControl as="fieldset">
    <FormLabel as="legend">알림 받기</FormLabel>
    <RadioGroup name="notification-preference">
        <Stack>
            <Radio value="all" id="notif-all">
                모든 알림 받기
            </Radio>
            <Radio value="mentions" id="notif-mentions">
                멘션만 받기
            </Radio>
            <Radio value="none" id="notif-none">
                받지 않기
            </Radio>
        </Stack>
    </RadioGroup>
</FormControl>

// 체크박스 그룹
<FormControl as="fieldset">
    <FormLabel as="legend">관심사 선택</FormLabel>
    <CheckboxGroup>
        <Stack>
            <Checkbox value="games" id="interest-games">
                게임
            </Checkbox>
            <Checkbox value="anime" id="interest-anime">
                애니메이션
            </Checkbox>
            <Checkbox value="cosplay" id="interest-cosplay">
                코스프레
            </Checkbox>
        </Stack>
    </CheckboxGroup>
</FormControl>
```

---

## 10. 이미지 및 미디어

### 10.1 의미 있는 Alt 텍스트

```tsx
// ❌ Before
<img src="/avatar.jpg" alt="이미지" />
<img src="/post-image.jpg" />

// ✅ After
<img 
    src="/avatar.jpg" 
    alt="김철수님의 프로필 사진" 
/>

<img 
    src="/post-image.jpg" 
    alt="2025년 코스프레 대회 우승자 사진 - 원피스 루피 코스프레" 
/>

// 장식용 이미지는 alt를 비워둠
<img src="/decoration.svg" alt="" role="presentation" />
```

### 10.2 비디오/오디오 접근성

```tsx
// 캡션과 트랜스크립트 제공
<video
    controls
    aria-label="커뮤니티 소개 영상"
>
    <source src="/intro.mp4" type="video/mp4" />
    <track
        kind="captions"
        src="/intro-ko.vtt"
        srcLang="ko"
        label="한국어"
        default
    />
    <track
        kind="captions"
        src="/intro-en.vtt"
        srcLang="en"
        label="English"
    />
    <p>
        귀하의 브라우저는 비디오를 지원하지 않습니다.
        <a href="/intro-transcript.txt">트랜스크립트 보기</a>
    </p>
</video>

// 오디오
<audio controls aria-label="팟캐스트 에피소드 1">
    <source src="/podcast.mp3" type="audio/mpeg" />
    <p>
        오디오를 재생할 수 없습니다.
        <a href="/podcast-transcript.txt">트랜스크립트 보기</a>
    </p>
</audio>
```

---

## 11. 접근성 테스트

### 11.1 자동화 테스트

#### axe-core 설치 및 설정

```bash
npm install --save-dev @axe-core/react
```

```tsx
// src/main.tsx (개발 환경에만)
if (process.env.NODE_ENV !== 'production') {
    import('@axe-core/react').then((axe) => {
        axe.default(React, ReactDOM, 1000);
    });
}
```

#### Playwright 접근성 테스트

```typescript
// e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('접근성 테스트', () => {
    test('홈페이지 접근성 검사', async ({ page }) => {
        await page.goto('/');

        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('프로필 페이지 접근성 검사', async ({ page }) => {
        await page.goto('/profile/1');

        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .exclude('#third-party-widget') // 외부 위젯 제외
            .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('키보드 네비게이션', async ({ page }) => {
        await page.goto('/');

        // Tab 키로 네비게이션
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        
        // 현재 포커스된 요소 확인
        const focusedElement = await page.locator(':focus');
        await expect(focusedElement).toBeVisible();

        // Enter로 클릭
        await page.keyboard.press('Enter');
        await expect(page).toHaveURL(/./);
    });
});
```

#### Jest 접근성 테스트

```typescript
// components/__tests__/NotificationBell.a11y.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import NotificationBell from '../NotificationBell';

expect.extend(toHaveNoViolations);

describe('NotificationBell 접근성', () => {
    it('WCAG 위반 사항이 없어야 함', async () => {
        const { container } = render(<NotificationBell />);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('aria-label이 있어야 함', () => {
        const { getByLabelText } = render(<NotificationBell />);
        expect(getByLabelText('알림')).toBeInTheDocument();
    });

    it('키보드로 조작 가능해야 함', () => {
        const { getByRole } = render(<NotificationBell />);
        const button = getByRole('button', { name: '알림' });
        
        expect(button).toHaveAttribute('tabIndex', '0');
    });
});
```

### 11.2 수동 테스트

#### 스크린 리더 테스트
- **Windows**: NVDA (무료), JAWS
- **macOS**: VoiceOver (내장)
- **Linux**: Orca

```bash
# NVDA 단축키
Ctrl + Alt + N : NVDA 시작
Insert + Down Arrow : 다음 항목
Insert + Up Arrow : 이전 항목
Insert + Space : 폼 모드 전환
```

#### 키보드 전용 테스트 체크리스트
- [ ] Tab/Shift+Tab으로 모든 인터랙티브 요소 이동 가능
- [ ] Enter/Space로 버튼 클릭 가능
- [ ] Esc로 모달/드롭다운 닫기 가능
- [ ] 화살표 키로 메뉴/탭 네비게이션 가능
- [ ] 포커스 표시(outline)가 명확히 보임
- [ ] 포커스가 논리적 순서로 이동
- [ ] 모달 열릴 때 포커스 트랩 동작
- [ ] Skip navigation 링크 동작

#### 색각 이상 시뮬레이션
- Chrome DevTools > Rendering > Emulate vision deficiencies
  - Protanopia (적색맹)
  - Deuteranopia (녹색맹)
  - Tritanopia (청색맹)
  - Achromatopsia (전색맹)

### 11.3 Lighthouse 접근성 점수

```bash
# CLI로 Lighthouse 실행
npx lighthouse http://localhost:5173 \
    --only-categories=accessibility \
    --view

# CI/CD에 통합
npx lighthouse http://localhost:5173 \
    --only-categories=accessibility \
    --output=json \
    --output-path=./lighthouse-report.json

# 목표: 90+ 점수
```

---

## 12. 체크리스트

### 12.1 필수 항목 (WCAG 2.1 AA)

#### 인지 가능 (Perceivable)
- [ ] 모든 이미지에 적절한 alt 텍스트
- [ ] 비디오에 자막 제공
- [ ] 오디오에 트랜스크립트 제공
- [ ] 색상 대비율 4.5:1 이상 (일반 텍스트)
- [ ] 색상 대비율 3:1 이상 (큰 텍스트, UI 요소)
- [ ] 색상에만 의존하지 않는 정보 전달
- [ ] 텍스트 200%까지 확대 가능 (레이아웃 깨지지 않음)
- [ ] 콘텐츠를 가로 스크롤 없이 볼 수 있음

#### 운영 가능 (Operable)
- [ ] 모든 기능을 키보드로 조작 가능
- [ ] 키보드 포커스가 함정에 빠지지 않음
- [ ] 포커스 표시가 명확히 보임
- [ ] 각 페이지에 고유한 제목
- [ ] Skip navigation 링크 제공
- [ ] 명확한 링크 텍스트 (여기 클릭 금지)
- [ ] 여러 방법으로 페이지 찾기 가능
- [ ] Focus 순서가 논리적
- [ ] 3초 이상 깜빡이는 콘텐츠 없음

#### 이해 가능 (Understandable)
- [ ] HTML lang 속성 설정
- [ ] 명확하고 일관된 네비게이션
- [ ] 일관된 UI 패턴
- [ ] 폼 레이블 명확하게 표시
- [ ] 입력 오류 명확하게 표시
- [ ] 오류 수정 제안 제공
- [ ] 중요한 작업은 되돌리기/확인 가능

#### 견고함 (Robust)
- [ ] 유효한 HTML (W3C 검증 통과)
- [ ] ARIA 속성 올바르게 사용
- [ ] 상태 변경 시 스크린 리더 알림
- [ ] 보조 기술과 호환

### 12.2 구현 체크리스트

#### 컴포넌트별
- [ ] NotificationBell: aria-label, badge count 스크린 리더 알림
- [ ] NotificationCenter: live region, 알림 목록 aria-label
- [ ] Modal: dialog role, focus trap, aria-labelledby
- [ ] Dropdown: aria-haspopup, aria-expanded, keyboard navigation
- [ ] Form: 레이블 연결, 오류 메시지, required 표시
- [ ] TabPanel: role, aria-labelledby, 키보드 네비게이션
- [ ] ImageUpload: 업로드 상태 알림, 미리보기 alt
- [ ] ThemeToggle: 현재 테마 상태 알림
- [ ] LanguageSwitcher: 현재 언어 표시, 선택 시 알림

#### 페이지별
- [ ] 모든 페이지: 고유 title, main landmark, skip nav
- [ ] HomePage: 시맨틱 section, article
- [ ] ProfilePage: tab 네비게이션 접근성
- [ ] CommunityHub: 게시글 목록 aria-label
- [ ] Settings: 폼 접근성, 저장 상태 알림
- [ ] Login/Register: 명확한 레이블, 오류 처리

---

## 13. 구현 로드맵

### Week 1: 기반 작업 (Foundation)
**목표**: 시맨틱 HTML, 기본 ARIA 속성

- **Day 1-2**: 시맨틱 HTML 리팩토링
  - [ ] div → header, nav, main, section, article, footer 변경
  - [ ] 랜드마크 역할(role) 추가
  - [ ] Skip navigation 링크 구현

- **Day 3-4**: 페이지 제목 및 메타데이터
  - [ ] react-helmet-async 설치
  - [ ] 모든 페이지에 고유 title 설정
  - [ ] lang 속성 설정 (ko/en)

- **Day 5**: 색상 대비 개선
  - [ ] 모든 텍스트 색상 대비율 체크
  - [ ] theme.css 색상 값 조정
  - [ ] 다크 모드 대비율 검증

### Week 2: 키보드 & 포커스 (Keyboard & Focus)
**목표**: 키보드 네비게이션 완성

- **Day 1-2**: Focus 관리
  - [ ] 모든 인터랙티브 요소에 포커스 가능
  - [ ] Focus indicator 스타일 개선
  - [ ] Modal focus trap 구현

- **Day 3-4**: 키보드 단축키
  - [ ] useKeyboardShortcuts hook 구현
  - [ ] Ctrl+K 검색, Esc 닫기, / 검색 포커스
  - [ ] 단축키 도움말 페이지 추가

- **Day 5**: Tab 순서 최적화
  - [ ] 모든 페이지 tab 순서 검토
  - [ ] tabIndex 불필요한 곳 제거
  - [ ] 논리적 순서로 재배치

### Week 3: ARIA & 스크린 리더 (ARIA & Screen Reader)
**목표**: 스크린 리더 완전 지원

- **Day 1-2**: ARIA 속성 추가
  - [ ] NotificationCenter: live region
  - [ ] Modal: dialog, aria-labelledby
  - [ ] Dropdown: aria-haspopup, aria-expanded
  - [ ] Form: aria-invalid, aria-describedby

- **Day 3-4**: 동적 콘텐츠 알림
  - [ ] Loading 상태 aria-live
  - [ ] 알림 수신 시 스크린 리더 알림
  - [ ] 오류 메시지 role="alert"

- **Day 5**: 스크린 리더 테스트
  - [ ] NVDA로 전체 앱 테스트
  - [ ] VoiceOver로 macOS 테스트
  - [ ] 발견된 문제 수정

### Week 4: 폼 & 미디어 (Forms & Media)
**목표**: 폼 및 미디어 접근성 완성

- **Day 1-2**: 폼 접근성
  - [ ] 모든 input에 명확한 레이블
  - [ ] 오류 메시지 aria-describedby 연결
  - [ ] required, pattern 검증
  - [ ] 라디오/체크박스 그룹 fieldset

- **Day 3**: 이미지 & 미디어
  - [ ] 모든 이미지 alt 텍스트 개선
  - [ ] 장식 이미지 alt="" 및 role="presentation"
  - [ ] 비디오 자막 VTT 파일 생성
  - [ ] 오디오 트랜스크립트 제공

- **Day 4**: 자동화 테스트
  - [ ] axe-core React 설정
  - [ ] Playwright 접근성 테스트 추가
  - [ ] Jest 컴포넌트 접근성 테스트
  - [ ] CI/CD에 Lighthouse 통합

- **Day 5**: 최종 검증 및 문서화
  - [ ] WCAG 2.1 AA 체크리스트 완료
  - [ ] Lighthouse 접근성 90+ 달성
  - [ ] 접근성 명세서 작성
  - [ ] 사용자 가이드에 접근성 기능 추가

---

## 14. 추가 리소스

### 14.1 참고 문서
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

### 14.2 도구
- [axe DevTools](https://chrome.google.com/webstore/detail/axe-devtools-web-accessib/lhdoppojpmngadmnindnejefpokejbdd)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Color Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/)

### 14.3 스크린 리더
- [NVDA](https://www.nvaccess.org/) (Windows, 무료)
- [JAWS](https://www.freedomscientific.com/products/software/jaws/) (Windows, 유료)
- VoiceOver (macOS/iOS, 내장)
- [Orca](https://help.gnome.org/users/orca/stable/) (Linux, 무료)

---

## 15. 결론

접근성은 모든 사용자에게 동등한 경험을 제공하는 것입니다. WCAG 2.1 AA 표준을 준수함으로써:

- 🎯 **더 넓은 사용자층**: 장애인, 고령자 포함
- ⚖️ **법적 준수**: 웹 접근성 법규 충족
- 📈 **SEO 개선**: 시맨틱 HTML로 검색 엔진 최적화
- 💡 **UX 향상**: 모든 사용자에게 더 나은 경험

4주간의 체계적인 구현으로 Lighthouse 접근성 점수 90+ 달성을 목표로 합니다.

---

**작성일**: 2025-11-12  
**작성자**: AUTOAGENTS  
**버전**: 1.0

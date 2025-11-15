# UI/UX 개선 계획

**작성일**: 2025년 11월 11일  
**대상**: 커뮤니티 플랫폼 프론트엔드  
**목표**: 사용자 경험 향상 및 전문적인 인터페이스 구현

---

## 📋 현재 상태 분석

### ✅ 잘 구현된 부분
- Material-UI 컴포넌트 활용
- 기본적인 로딩 상태 표시 (`loading` state, `CircularProgress`)
- 에러 메시지 표시 (`error` state, `Alert`)
- 반응형 Container 사용
- 페이지네이션 구현
- 투표 시스템 컴포넌트 통합

### ⚠️ 개선이 필요한 부분
1. **로딩 상태**: CircularProgress만 있고 스켈레톤 UI 없음
2. **에러 처리**: 단순 Alert만 표시, 재시도 기능 없음
3. **빈 상태**: 데이터가 없을 때의 안내가 부족
4. **사용자 피드백**: 작업 완료 시 토스트/스낵바 없음
5. **애니메이션**: 페이지 전환 및 컴포넌트 로딩 애니메이션 부족
6. **접근성**: 키보드 네비게이션 및 스크린 리더 지원 미흡
7. **성능**: 무한 스크롤 미구현, 이미지 레이지 로딩 없음

---

## 🎯 개선 우선순위

### Phase 1: 핵심 UX 개선 (즉시 적용 가능)
1. **스켈레톤 로더 추가** - 로딩 상태 개선
2. **토스트/스낵바 시스템** - 사용자 피드백 강화
3. **에러 바운더리** - 에러 처리 개선
4. **빈 상태 컴포넌트** - 데이터 없을 때 안내

### Phase 2: 인터랙션 개선 (단기)
5. **페이지 전환 애니메이션** - 부드러운 이동
6. **낙관적 업데이트** - 즉각적인 반응
7. **무한 스크롤** - 페이지네이션 대체
8. **이미지 레이지 로딩** - 성능 최적화

### Phase 3: 접근성 및 고급 기능 (중기)
9. **키보드 네비게이션** - 접근성 개선
10. **다크 모드** - 사용자 선호도 지원
11. **오프라인 지원** - PWA 기능 강화
12. **실시간 업데이트** - Socket.io 활용

---

## 🛠️ 세부 개선 사항

## 1. 스켈레톤 로더 (Skeleton Loading)

### 목적
- 로딩 중에도 레이아웃 구조를 보여줌
- 체감 로딩 시간 단축
- 레이아웃 시프트 방지

### 구현 방법
```tsx
import { Skeleton } from '@mui/material';

// 게시글 목록 스켈레톤
const PostListSkeleton = () => (
  <List>
    {[...Array(5)].map((_, index) => (
      <ListItem key={index}>
        <ListItemText
          primary={<Skeleton variant="text" width="60%" />}
          secondary={
            <>
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="text" width="30%" />
            </>
          }
        />
      </ListItem>
    ))}
  </List>
);

// 사용
{loading ? <PostListSkeleton /> : <PostList posts={posts} />}
```

### 적용 대상
- `BoardDetail.tsx`: 게시판 정보, 게시글 목록
- `PostDetail.tsx`: 게시글 내용, 댓글 목록
- 게시판 목록 페이지

---

## 2. 토스트/스낵바 시스템

### 목적
- 작업 완료/실패 즉시 피드백
- 비침투적 알림 (페이지 이동 없이)
- 일관된 메시지 표시

### 구현 방법
```tsx
// 1. Context 생성
import { createContext, useContext, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';

interface SnackbarContextType {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
}

const SnackbarContext = createContext<SnackbarContextType | null>(null);

export const SnackbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<'success' | 'error' | 'info'>('info');

  const show = (msg: string, sev: 'success' | 'error' | 'info') => {
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  };

  return (
    <SnackbarContext.Provider value={{
      showSuccess: (msg) => show(msg, 'success'),
      showError: (msg) => show(msg, 'error'),
      showInfo: (msg) => show(msg, 'info'),
    }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setOpen(false)} severity={severity}>
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) throw new Error('useSnackbar must be used within SnackbarProvider');
  return context;
};

// 2. 사용 예
const { showSuccess, showError } = useSnackbar();

const createPost = async () => {
  try {
    await fetch(...);
    showSuccess('게시글이 작성되었습니다!');
  } catch (error) {
    showError('게시글 작성에 실패했습니다.');
  }
};
```

### 적용 시나리오
- ✅ 게시글 작성 성공/실패
- ✅ 댓글 작성 성공/실패
- ✅ 투표 성공
- ✅ 북마크 추가/제거
- ✅ 팔로우/언팔로우

---

## 3. 에러 바운더리 및 재시도

### 목적
- 에러 발생 시 전체 앱 크래시 방지
- 사용자에게 명확한 에러 메시지 제공
- 재시도 옵션 제공

### 구현 방법
```tsx
// 1. 에러 바운더리 컴포넌트
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Typography, Container } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Container maxWidth="sm">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '50vh',
              textAlign: 'center',
              gap: 2
            }}
          >
            <ErrorOutline sx={{ fontSize: 80, color: 'error.main' }} />
            <Typography variant="h4" gutterBottom>
              문제가 발생했습니다
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {this.state.error?.message || '알 수 없는 오류가 발생했습니다.'}
            </Typography>
            <Button
              variant="contained"
              onClick={() => window.location.reload()}
              sx={{ mt: 2 }}
            >
              페이지 새로고침
            </Button>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

// 2. API 에러 처리 개선
const loadPosts = async () => {
  try {
    setLoading(true);
    setError(null);
    const response = await fetch(`/api/boards/${boardId}/posts`);
    
    if (!response.ok) {
      throw new Error(`서버 오류: ${response.status}`);
    }
    
    const data = await response.json();
    setPosts(data.items.map(mapPostFromBackend));
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
    setError(errorMessage);
    showError(errorMessage);
  } finally {
    setLoading(false);
  }
};

// 3. 재시도 버튼이 있는 에러 표시
{error && (
  <Alert 
    severity="error" 
    action={
      <Button color="inherit" size="small" onClick={loadPosts}>
        재시도
      </Button>
    }
  >
    {error}
  </Alert>
)}
```

---

## 4. 빈 상태 (Empty State) 컴포넌트

### 목적
- 데이터가 없을 때 명확한 안내
- 다음 행동 제안 (CTA)
- 긍정적인 사용자 경험

### 구현 방법
```tsx
import { Box, Typography, Button } from '@mui/material';
import { Inbox, AddCircle } from '@mui/icons-material';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <Inbox sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.5 }} />,
  title,
  description,
  action
}) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      py: 8,
      px: 2,
      textAlign: 'center'
    }}
  >
    {icon}
    <Typography variant="h5" sx={{ mt: 2, mb: 1, color: 'text.secondary' }}>
      {title}
    </Typography>
    {description && (
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
        {description}
      </Typography>
    )}
    {action && (
      <Button
        variant="contained"
        startIcon={<AddCircle />}
        onClick={action.onClick}
      >
        {action.label}
      </Button>
    )}
  </Box>
);

// 사용 예
{posts.length === 0 && !loading && (
  <EmptyState
    title="게시글이 없습니다"
    description="이 게시판에 첫 번째 게시글을 작성해보세요!"
    action={{
      label: "게시글 작성하기",
      onClick: () => setCreatePostOpen(true)
    }}
  />
)}
```

### 적용 대상
- 게시글 목록이 비어있을 때
- 댓글이 없을 때
- 검색 결과가 없을 때
- 팔로우/북마크가 없을 때

---

## 5. 페이지 전환 애니메이션

### 목적
- 부드러운 페이지 전환
- 사용자의 위치 인식 강화
- 전문적인 느낌

### 구현 방법
```tsx
import { motion, AnimatePresence } from 'framer-motion';

// 페이지 래퍼
const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

// 리스트 아이템 애니메이션
const ListItemTransition: React.FC<{ index: number; children: React.ReactNode }> = ({ index, children }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05, duration: 0.3 }}
  >
    {children}
  </motion.div>
);

// 사용
<PageTransition>
  <Container>
    {/* 페이지 내용 */}
  </Container>
</PageTransition>
```

### 설치 필요
```bash
npm install framer-motion
```

---

## 6. 낙관적 업데이트 (Optimistic Updates)

### 목적
- 즉각적인 사용자 피드백
- 체감 속도 향상
- 자연스러운 인터랙션

### 구현 방법
```tsx
const handleVote = async (postId: string, voteType: 'up' | 'down') => {
  // 1. 즉시 UI 업데이트 (낙관적)
  setPosts(prevPosts =>
    prevPosts.map(post =>
      post.id === postId
        ? { ...post, voteCount: post.voteCount + (voteType === 'up' ? 1 : -1) }
        : post
    )
  );

  try {
    // 2. 서버에 요청
    const response = await fetch(`/api/posts/${postId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ voteType })
    });

    if (!response.ok) {
      throw new Error('투표 실패');
    }

    // 3. 성공 시 피드백
    showSuccess('투표가 반영되었습니다!');
  } catch (error) {
    // 4. 실패 시 롤백
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, voteCount: post.voteCount - (voteType === 'up' ? 1 : -1) }
          : post
      )
    );
    showError('투표에 실패했습니다.');
  }
};
```

### 적용 대상
- 투표 (좋아요/싫어요)
- 북마크 토글
- 댓글 작성
- 팔로우/언팔로우

---

## 7. 무한 스크롤

### 목적
- 페이지네이션보다 자연스러운 경험
- 모바일 친화적
- 연속적인 콘텐츠 소비

### 구현 방법
```tsx
import { useEffect, useRef, useCallback } from 'react';

const useInfiniteScroll = (callback: () => void, hasMore: boolean, loading: boolean) => {
  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        callback();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore, callback]);

  return lastElementRef;
};

// 사용
const BoardDetail = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    
    const response = await fetch(`/api/boards/${boardId}/posts?offset=${page * 20}&limit=20`);
    const data = await response.json();
    
    setPosts(prev => [...prev, ...data.items.map(mapPostFromBackend)]);
    setHasMore(data.hasMore);
    setPage(prev => prev + 1);
    setLoading(false);
  }, [page, loading, boardId]);

  const lastPostRef = useInfiniteScroll(loadMore, hasMore, loading);

  return (
    <List>
      {posts.map((post, index) => (
        <ListItem 
          key={post.id}
          ref={index === posts.length - 1 ? lastPostRef : null}
        >
          {/* 게시글 내용 */}
        </ListItem>
      ))}
      {loading && <CircularProgress />}
    </List>
  );
};
```

---

## 8. 이미지 레이지 로딩

### 목적
- 초기 로딩 속도 개선
- 데이터 사용량 절약
- 부드러운 이미지 로딩

### 구현 방법
```tsx
import { useState, useEffect, useRef } from 'react';
import { Skeleton } from '@mui/material';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: string | number;
  height?: string | number;
}

const LazyImage: React.FC<LazyImageProps> = ({ src, alt, width, height }) => {
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
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <Box sx={{ position: 'relative', width, height }}>
      {!isLoaded && (
        <Skeleton 
          variant="rectangular" 
          width={width} 
          height={height}
          sx={{ position: 'absolute', top: 0, left: 0 }}
        />
      )}
      <img
        ref={imgRef}
        src={isInView ? src : undefined}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        style={{
          width,
          height,
          objectFit: 'cover',
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out'
        }}
      />
    </Box>
  );
};
```

---

## 9. 키보드 네비게이션

### 목적
- 접근성 향상
- 파워 유저 지원
- WCAG 준수

### 구현 방법
```tsx
// 게시글 목록에서 화살표 키로 이동
const BoardDetail = () => {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, posts.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        navigate(`/posts/${posts[selectedIndex].id}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, posts, navigate]);

  return (
    <List ref={listRef}>
      {posts.map((post, index) => (
        <ListItem
          key={post.id}
          selected={index === selectedIndex}
          tabIndex={0}
          sx={{
            cursor: 'pointer',
            '&.Mui-selected': {
              backgroundColor: 'action.selected'
            }
          }}
        >
          {/* 게시글 내용 */}
        </ListItem>
      ))}
    </List>
  );
};
```

---

## 10. 다크 모드

### 목적
- 사용자 선호도 지원
- 눈의 피로 감소
- 현대적인 UX

### 구현 방법
```tsx
import { createTheme, ThemeProvider, useMediaQuery } from '@mui/material';
import { createContext, useContext, useState, useEffect, useMemo } from 'react';

type ColorMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  mode: ColorMode;
  setMode: (mode: ColorMode) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const CustomThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState<ColorMode>(() => {
    const saved = localStorage.getItem('themeMode') as ColorMode;
    return saved || 'auto';
  });

  const actualMode = mode === 'auto' ? (prefersDarkMode ? 'dark' : 'light') : mode;

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: actualMode,
          primary: {
            main: actualMode === 'dark' ? '#90caf9' : '#1976d2',
          },
          background: {
            default: actualMode === 'dark' ? '#121212' : '#fafafa',
            paper: actualMode === 'dark' ? '#1e1e1e' : '#ffffff',
          },
        },
      }),
    [actualMode]
  );

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, setMode }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeMode must be used within CustomThemeProvider');
  return context;
};

// 테마 토글 버튼
const ThemeToggle = () => {
  const { mode, setMode } = useThemeMode();
  
  return (
    <IconButton onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}>
      {mode === 'dark' ? <LightMode /> : <DarkMode />}
    </IconButton>
  );
};
```

---

## 📊 구현 로드맵

### Week 1: 핵심 UX (Phase 1)
- [ ] Day 1-2: 스켈레톤 로더 구현 및 적용
- [ ] Day 3: 토스트/스낵바 시스템 구현
- [ ] Day 4: 에러 바운더리 및 재시도 기능
- [ ] Day 5: 빈 상태 컴포넌트 구현

### Week 2: 인터랙션 (Phase 2)
- [ ] Day 1: Framer Motion 설치 및 기본 애니메이션
- [ ] Day 2: 낙관적 업데이트 구현
- [ ] Day 3-4: 무한 스크롤 구현
- [ ] Day 5: 이미지 레이지 로딩

### Week 3: 접근성 및 고급 (Phase 3)
- [ ] Day 1-2: 키보드 네비게이션
- [ ] Day 3-4: 다크 모드 구현
- [ ] Day 5: 오프라인 지원 (PWA)

### Week 4: 실시간 기능
- [ ] Day 1-3: Socket.io 통합 (실시간 댓글, 알림)
- [ ] Day 4-5: 테스트 및 버그 수정

---

## 🎨 디자인 시스템 개선

### 컬러 팔레트 표준화
```tsx
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
    },
    info: {
      main: '#0288d1',
      light: '#03a9f4',
      dark: '#01579b',
    },
  },
  typography: {
    fontFamily: '"Noto Sans KR", "Roboto", "Arial", sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 700 },
    h2: { fontSize: '2rem', fontWeight: 600 },
    h3: { fontSize: '1.75rem', fontWeight: 600 },
    h4: { fontSize: '1.5rem', fontWeight: 500 },
    h5: { fontSize: '1.25rem', fontWeight: 500 },
    h6: { fontSize: '1rem', fontWeight: 500 },
    body1: { fontSize: '1rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
  },
  spacing: 8, // 8px 기준
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0,0,0,0.1)',
    '0px 4px 8px rgba(0,0,0,0.1)',
    // ... 더 많은 그림자 정의
  ],
});
```

### 컴포넌트 스타일 가이드
- **여백**: 8px 배수 사용 (spacing(1) = 8px)
- **모서리**: 8px 둥근 모서리 (borderRadius)
- **그림자**: 최소한으로 사용, 계층 구분에만
- **폰트 크기**: 14px ~ 40px 범위
- **줄 간격**: 본문 1.6, 제목 1.3

---

## 📈 성능 최적화

### 코드 스플리팅
```tsx
import { lazy, Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';

// 페이지 레이지 로딩
const BoardDetail = lazy(() => import('./pages/BoardDetail'));
const PostDetail = lazy(() => import('./pages/PostDetail'));

// 로딩 컴포넌트
const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
    <CircularProgress />
  </Box>
);

// 라우터에서 사용
<Suspense fallback={<PageLoader />}>
  <Routes>
    <Route path="/boards/:boardId" element={<BoardDetail />} />
    <Route path="/posts/:postId" element={<PostDetail />} />
  </Routes>
</Suspense>
```

### React.memo 활용
```tsx
import { memo } from 'react';

export const PostListItem = memo<PostListItemProps>(({ post, onClick }) => {
  return (
    <ListItem onClick={() => onClick(post.id)}>
      {/* ... */}
    </ListItem>
  );
}, (prevProps, nextProps) => {
  // 게시글 ID가 같고 내용이 변경되지 않았으면 리렌더링 스킵
  return prevProps.post.id === nextProps.post.id &&
         prevProps.post.updatedAt === nextProps.post.updatedAt;
});
```

---

## 🧪 테스트 계획

### 단위 테스트
- 모든 새로운 컴포넌트에 대한 테스트 작성
- Jest + React Testing Library 사용

### 통합 테스트
- 주요 사용자 플로우 테스트
- Playwright 또는 Cypress 사용

### 접근성 테스트
- axe-core로 자동 접근성 검사
- 스크린 리더 수동 테스트

---

## 📝 체크리스트

### Phase 1 체크리스트
- [ ] SkeletonLoader 컴포넌트 생성
- [ ] BoardDetail에 스켈레톤 적용
- [ ] PostDetail에 스켈레톤 적용
- [ ] SnackbarProvider Context 생성
- [ ] App.tsx에 SnackbarProvider 추가
- [ ] 모든 성공/실패 액션에 스낵바 적용
- [ ] ErrorBoundary 컴포넌트 생성
- [ ] 주요 페이지에 ErrorBoundary 적용
- [ ] EmptyState 컴포넌트 생성
- [ ] 빈 목록에 EmptyState 적용

### Phase 2 체크리스트
- [ ] framer-motion 설치
- [ ] PageTransition 컴포넌트 생성
- [ ] 모든 페이지에 애니메이션 적용
- [ ] 낙관적 업데이트 구현 (투표, 북마크)
- [ ] useInfiniteScroll 훅 생성
- [ ] 페이지네이션을 무한 스크롤로 교체
- [ ] LazyImage 컴포넌트 생성
- [ ] 모든 이미지에 레이지 로딩 적용

### Phase 3 체크리스트
- [ ] 키보드 네비게이션 구현
- [ ] CustomThemeProvider 생성
- [ ] 다크 모드 토글 버튼 추가
- [ ] Service Worker 설정
- [ ] 오프라인 페이지 생성
- [ ] Socket.io 클라이언트 통합
- [ ] 실시간 댓글 업데이트 구현

---

## 🎯 성공 지표 (KPI)

### 사용자 경험
- **체감 로딩 시간**: 50% 감소 (스켈레톤 로더)
- **에러 복구율**: 80% 이상 (재시도 기능)
- **사용자 만족도**: 4.5/5.0 이상

### 성능
- **First Contentful Paint (FCP)**: < 1.5초
- **Time to Interactive (TTI)**: < 3초
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Lighthouse 점수**: 90+ (Performance, Accessibility)

### 접근성
- **WCAG 2.1 Level AA 준수**: 100%
- **키보드 네비게이션 가능 페이지**: 100%
- **스크린 리더 호환성**: 완전 지원

---

## 📚 참고 자료

### 디자인 시스템
- [Material-UI Documentation](https://mui.com/)
- [Material Design Guidelines](https://material.io/design)

### 애니메이션
- [Framer Motion Docs](https://www.framer.com/motion/)
- [CSS Tricks - Animation Guide](https://css-tricks.com/almanac/properties/a/animation/)

### 접근성
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### 성능
- [Web.dev Performance](https://web.dev/performance/)
- [React Performance Optimization](https://reactjs.org/docs/optimizing-performance.html)

---

## 🚀 다음 단계

1. **우선순위 재검토**: 팀과 함께 Phase 1 작업 우선순위 확정
2. **리소스 할당**: 개발자, 디자이너 배정
3. **스프린트 계획**: 2주 단위 스프린트로 진행
4. **프로토타입 제작**: 핵심 개선사항 프로토타입
5. **사용자 테스트**: 베타 사용자 피드백 수집
6. **점진적 배포**: 기능별 단계적 출시

---

**작성자**: GitHub Copilot  
**검토 필요**: UI/UX 팀, 개발팀, QA팀  
**예상 완료**: 4주 (Phase 1-3)

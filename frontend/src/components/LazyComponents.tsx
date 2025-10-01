import React, { Suspense, lazy } from 'react';
import { Spinner, Box, Text } from '@chakra-ui/react';

// 로딩 컴포넌트
const LoadingSpinner = () => (
    <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="200px"
        gap={4}
    >
        <Spinner size="xl" color="blue.500" />
        <Text color="gray.500">로딩 중...</Text>
    </Box>
);

// 지연 로딩 컴포넌트들
export const LazyAdminDashboard = lazy(() => import('./Admin/AdminDashboard'));
export const LazyRealTimeChat = lazy(() => import('./Chat/RealTimeChat'));
export const LazyMobileNavigation = lazy(() => import('./Mobile/MobileNavigation'));
export const LazyTouchGestureHandler = lazy(() => import('./Mobile/TouchGestureHandler'));

// 지연 로딩 래퍼 컴포넌트
export const withLazyLoading = <P extends object>(
    Component: React.ComponentType<P>,
    fallback?: React.ReactNode
) => {
    return (props: P) => (
        <Suspense fallback={fallback || <LoadingSpinner />}>
            <Component {...props} />
        </Suspense>
    );
};

// 페이지별 지연 로딩 컴포넌트
export const LazyHomePage = lazy(() => import('../pages/HomePage'));
export const LazyBoardPage = lazy(() => import('../pages/BoardPage'));
export const LazyPostPage = lazy(() => import('../pages/PostPage'));
export const LazyUserPage = lazy(() => import('../pages/UserPage'));
export const LazyChatPage = lazy(() => import('../pages/ChatPage'));
export const LazyAdminPage = lazy(() => import('../pages/AdminPage'));

// 관리자 페이지 지연 로딩
export const LazyUserManagement = lazy(() => import('./Admin/UserManagement'));
export const LazyContentManagement = lazy(() => import('./Admin/ContentManagement'));
export const LazyAnalytics = lazy(() => import('./Admin/Analytics'));
export const LazySystemMonitoring = lazy(() => import('./Admin/SystemMonitoring'));

// 채팅 관련 지연 로딩
export const LazyChatRoom = lazy(() => import('./Chat/ChatRoom'));
export const LazyChatMessage = lazy(() => import('./Chat/ChatMessage'));
export const LazyOnlineUsers = lazy(() => import('./Chat/OnlineUsers'));

// 게시판 관련 지연 로딩
export const LazyPostList = lazy(() => import('./Board/PostList'));
export const LazyPostItem = lazy(() => import('./Board/PostItem'));
export const LazyPostEditor = lazy(() => import('./Board/PostEditor'));
export const LazyCommentList = lazy(() => import('./Board/CommentList'));
export const LazyCommentItem = lazy(() => import('./Board/CommentItem'));

// 사용자 관련 지연 로딩
export const LazyUserProfile = lazy(() => import('./User/UserProfile'));
export const LazyUserSettings = lazy(() => import('./User/UserSettings'));
export const LazyUserPosts = lazy(() => import('./User/UserPosts'));

// 모바일 관련 지연 로딩
export const LazyMobilePostList = lazy(() => import('./Mobile/MobilePostList'));
export const LazyMobilePostItem = lazy(() => import('./Mobile/MobilePostItem'));
export const LazyMobileChat = lazy(() => import('./Mobile/MobileChat'));

// 유틸리티 지연 로딩
export const LazyImageOptimizer = lazy(() => import('./Utils/ImageOptimizer'));
export const LazyFileUploader = lazy(() => import('./Utils/FileUploader'));
export const LazySearchBox = lazy(() => import('./Utils/SearchBox'));

// 에러 바운더리와 함께 사용할 수 있는 지연 로딩 컴포넌트
export const createLazyComponent = <P extends object>(
    importFunc: () => Promise<{ default: React.ComponentType<P> }>,
    fallback?: React.ReactNode
) => {
    const LazyComponent = lazy(importFunc);

    return (props: P) => (
        <Suspense fallback={fallback || <LoadingSpinner />}>
            <LazyComponent {...props} />
        </Suspense>
    );
};

// 동적 임포트를 위한 유틸리티 함수
export const dynamicImport = async <T = any>(
    modulePath: string,
    exportName?: string
): Promise<T> => {
    try {
        const module = await import(modulePath);
        return exportName ? module[exportName] : module.default;
    } catch (error) {
        console.error(`Failed to load module ${modulePath}:`, error);
        throw error;
    }
};

// 프리로딩을 위한 유틸리티 함수
export const preloadComponent = (importFunc: () => Promise<any>) => {
    return () => {
        importFunc().catch(error => {
            console.error('Failed to preload component:', error);
        });
    };
};

// 컴포넌트 프리로딩 목록
export const preloadComponents = {
    adminDashboard: preloadComponent(() => import('./Admin/AdminDashboard')),
    realTimeChat: preloadComponent(() => import('./Chat/RealTimeChat')),
    mobileNavigation: preloadComponent(() => import('./Mobile/MobileNavigation')),
    userProfile: preloadComponent(() => import('./User/UserProfile')),
    postEditor: preloadComponent(() => import('./Board/PostEditor')),
};

export default {
    LazyAdminDashboard,
    LazyRealTimeChat,
    LazyMobileNavigation,
    LazyTouchGestureHandler,
    withLazyLoading,
    createLazyComponent,
    dynamicImport,
    preloadComponents,
};

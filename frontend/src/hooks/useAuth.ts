import { useState, useEffect } from 'react';
import { authService, AuthState, UserProfile } from '../services/AuthService';

/**
 * 🔐 인증 훅
 * 
 * Firebase 인증 상태 관리 및 인증 기능 제공
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-01-02
 */

export const useAuth = () => {
    const [authState, setAuthState] = useState<AuthState>(authService.getAuthState());

    useEffect(() => {
        // 인증 상태 변경 리스너 등록
        const unsubscribe = authService.onAuthStateChange((newState) => {
            setAuthState(newState);
        });

        // 컴포넌트 언마운트 시 리스너 제거
        return unsubscribe;
    }, []);

    // 👤 익명 로그인
    const signInAnonymously = async (): Promise<UserProfile | null> => {
        return await authService.signInAnonymously();
    };

    // 🔍 구글 로그인
    const signInWithGoogle = async (): Promise<UserProfile | null> => {
        return await authService.signInWithGoogle();
    };

    // 🚪 로그아웃
    const signOut = async (): Promise<void> => {
        await authService.signOut();
    };

    // 🔄 익명 → 구글 계정 연결
    const linkWithGoogle = async (): Promise<UserProfile | null> => {
        return await authService.linkWithGoogle();
    };

    // 📝 프로필 업데이트
    const updateProfile = async (updates: {
        displayName?: string;
        photoURL?: string;
    }): Promise<boolean> => {
        return await authService.updateUserProfile(updates);
    };

    // 🎯 토큰 가져오기
    const getIdToken = async (): Promise<string | null> => {
        return await authService.getIdToken();
    };

    // 🔄 토큰 새로고침
    const refreshToken = async (): Promise<string | null> => {
        return await authService.refreshToken();
    };

    // 🧹 에러 초기화
    const clearError = (): void => {
        authService.clearError();
    };

    // 📊 현재 사용자 프로필
    const currentUser = authService.getCurrentUserProfile();

    // 📊 인증 통계
    const authStats = authService.getAuthStats();

    return {
        // 상태
        user: authState.user,
        isAnonymous: authState.isAnonymous,
        isLoading: authState.isLoading,
        error: authState.error,
        currentUser,
        authStats,

        // 액션
        signInAnonymously,
        signInWithGoogle,
        signOut,
        linkWithGoogle,
        updateProfile,
        getIdToken,
        refreshToken,
        clearError
    };
};

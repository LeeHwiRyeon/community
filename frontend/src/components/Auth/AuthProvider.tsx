import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { AuthState, UserProfile } from '../../services/AuthService';

// 인증 컨텍스트 타입
interface AuthContextType {
    // 상태
    user: any;
    isAnonymous: boolean;
    isLoading: boolean;
    error: string | null;
    currentUser: UserProfile | null;
    authStats: {
        isLoggedIn: boolean;
        isAnonymous: boolean;
        hasEmail: boolean;
        hasDisplayName: boolean;
        hasPhoto: boolean;
    };

    // 액션
    signInAnonymously: () => Promise<UserProfile | null>;
    signInWithGoogle: () => Promise<UserProfile | null>;
    signOut: () => Promise<void>;
    linkWithGoogle: () => Promise<UserProfile | null>;
    updateProfile: (updates: { displayName?: string; photoURL?: string }) => Promise<boolean>;
    getIdToken: () => Promise<string | null>;
    refreshToken: () => Promise<string | null>;
    clearError: () => void;
}

// 인증 컨텍스트 생성
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 인증 프로바이더 컴포넌트
interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const auth = useAuth();

    return (
        <AuthContext.Provider value={auth}>
            {children}
        </AuthContext.Provider>
    );
};

// 인증 훅 (컨텍스트 사용)
export const useAuthContext = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext는 AuthProvider 내에서 사용되어야 합니다.');
    }
    return context;
};

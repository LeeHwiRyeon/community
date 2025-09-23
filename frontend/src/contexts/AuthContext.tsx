import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
import type { User } from '../types/api';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (provider: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isAuthenticated = !!user && api.tokenManager.isAuthenticated();

    // 앱 시작 시 사용자 정보 확인
    useEffect(() => {
        const checkAuth = async () => {
            if (api.tokenManager.isAuthenticated()) {
                try {
                    const response = await api.auth.getMe();
                    if (response.data) {
                        setUser(response.data);
                    } else {
                        // 토큰이 유효하지 않은 경우
                        api.tokenManager.clearTokens();
                    }
                } catch (error) {
                    console.error('Auth check failed:', error);
                    api.tokenManager.clearTokens();
                }
            }
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (provider: string) => {
        try {
            const response = await api.auth.getLoginUrl(provider);
            if (response.data?.url) {
                // OAuth URL로 리디렉션
                window.location.href = response.data.url;
            } else {
                throw new Error('Login URL not received');
            }
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const logout = () => {
        api.auth.logout();
        setUser(null);
    };

    const refreshUser = async () => {
        if (!api.tokenManager.isAuthenticated()) {
            setUser(null);
            return;
        }

        try {
            const response = await api.auth.getMe();
            if (response.data) {
                setUser(response.data);
            } else {
                setUser(null);
                api.tokenManager.clearTokens();
            }
        } catch (error) {
            console.error('User refresh failed:', error);
            setUser(null);
            api.tokenManager.clearTokens();
        }
    };

    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        refreshUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
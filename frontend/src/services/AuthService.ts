/**
 * 🔐 인증 서비스 v3.0
 * 
 * Firebase 기반 인증 시스템 (익명, 구글 로그인)
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-01-02
 */

import { initializeApp } from 'firebase/app';
import {
    getAuth,
    signInAnonymously,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    User,
    signOut,
    updateProfile
} from 'firebase/auth';

// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "thenewspaper-platform.firebaseapp.com",
    projectId: "thenewspaper-platform",
    storageBucket: "thenewspaper-platform.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdefghijklmnop"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// 인증 상태 타입
export interface AuthState {
    user: User | null;
    isAnonymous: boolean;
    isLoading: boolean;
    error: string | null;
}

// 사용자 정보 타입
export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    isAnonymous: boolean;
    createdAt: Date;
    lastLoginAt: Date;
}

export class AuthService {
    private static instance: AuthService;
    private authState: AuthState = {
        user: null,
        isAnonymous: false,
        isLoading: true,
        error: null
    };
    private listeners: Set<(state: AuthState) => void> = new Set();

    static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    constructor() {
        this.initializeAuth();
    }

    // 🔐 인증 초기화
    private initializeAuth(): void {
        console.log('🔐 Firebase 인증 초기화 중...');

        onAuthStateChanged(auth, (user) => {
            console.log('🔐 인증 상태 변경:', user ? '로그인됨' : '로그아웃됨');

            this.authState = {
                user,
                isAnonymous: user?.isAnonymous || false,
                isLoading: false,
                error: null
            };

            this.notifyListeners();

            if (user) {
                console.log('👤 사용자 정보:', {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    isAnonymous: user.isAnonymous
                });
            }
        });
    }

    // 👤 익명 로그인
    async signInAnonymously(): Promise<UserProfile | null> {
        try {
            console.log('👤 익명 로그인 시도...');

            const result = await signInAnonymously(auth);
            const user = result.user;

            console.log('✅ 익명 로그인 성공:', user.uid);

            return this.createUserProfile(user);
        } catch (error: any) {
            console.error('❌ 익명 로그인 실패:', error);
            this.authState.error = error.message;
            this.notifyListeners();
            return null;
        }
    }

    // 🔍 구글 로그인
    async signInWithGoogle(): Promise<UserProfile | null> {
        try {
            console.log('🔍 구글 로그인 시도...');

            // 추가 스코프 설정
            googleProvider.addScope('email');
            googleProvider.addScope('profile');

            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            console.log('✅ 구글 로그인 성공:', user.email);

            return this.createUserProfile(user);
        } catch (error: any) {
            console.error('❌ 구글 로그인 실패:', error);
            this.authState.error = error.message;
            this.notifyListeners();
            return null;
        }
    }

    // 🚪 로그아웃
    async signOut(): Promise<void> {
        try {
            console.log('🚪 로그아웃 시도...');
            await signOut(auth);
            console.log('✅ 로그아웃 성공');
        } catch (error: any) {
            console.error('❌ 로그아웃 실패:', error);
            this.authState.error = error.message;
            this.notifyListeners();
        }
    }

    // 👤 사용자 프로필 생성
    private createUserProfile(user: User): UserProfile {
        return {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            isAnonymous: user.isAnonymous,
            createdAt: new Date(),
            lastLoginAt: new Date()
        };
    }

    // 📝 프로필 업데이트
    async updateUserProfile(updates: {
        displayName?: string;
        photoURL?: string;
    }): Promise<boolean> {
        try {
            if (!this.authState.user) {
                throw new Error('로그인된 사용자가 없습니다.');
            }

            console.log('📝 프로필 업데이트 시도...');
            await updateProfile(this.authState.user, updates);
            console.log('✅ 프로필 업데이트 성공');

            return true;
        } catch (error: any) {
            console.error('❌ 프로필 업데이트 실패:', error);
            this.authState.error = error.message;
            this.notifyListeners();
            return false;
        }
    }

    // 🔄 익명 → 구글 계정 연결
    async linkWithGoogle(): Promise<UserProfile | null> {
        try {
            if (!this.authState.user || !this.authState.isAnonymous) {
                throw new Error('익명 사용자만 연결할 수 있습니다.');
            }

            console.log('🔄 익명 계정을 구글 계정으로 연결 시도...');

            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            console.log('✅ 계정 연결 성공:', user.email);

            return this.createUserProfile(user);
        } catch (error: any) {
            console.error('❌ 계정 연결 실패:', error);
            this.authState.error = error.message;
            this.notifyListeners();
            return null;
        }
    }

    // 📊 현재 인증 상태 가져오기
    getAuthState(): AuthState {
        return { ...this.authState };
    }

    // 👤 현재 사용자 프로필 가져오기
    getCurrentUserProfile(): UserProfile | null {
        if (!this.authState.user) return null;
        return this.createUserProfile(this.authState.user);
    }

    // 🔔 인증 상태 변경 리스너 등록
    onAuthStateChange(callback: (state: AuthState) => void): () => void {
        this.listeners.add(callback);

        // 즉시 현재 상태 전달
        callback(this.authState);

        // 리스너 제거 함수 반환
        return () => {
            this.listeners.delete(callback);
        };
    }

    // 🔔 리스너들에게 상태 변경 알림
    private notifyListeners(): void {
        this.listeners.forEach(callback => {
            try {
                callback(this.authState);
            } catch (error) {
                console.error('인증 상태 리스너 오류:', error);
            }
        });
    }

    // 🎯 토큰 가져오기
    async getIdToken(): Promise<string | null> {
        try {
            if (!this.authState.user) return null;

            const token = await this.authState.user.getIdToken();
            console.log('🎯 ID 토큰 획득 성공');
            return token;
        } catch (error: any) {
            console.error('❌ 토큰 획득 실패:', error);
            return null;
        }
    }

    // 🔄 토큰 새로고침
    async refreshToken(): Promise<string | null> {
        try {
            if (!this.authState.user) return null;

            const token = await this.authState.user.getIdToken(true);
            console.log('🔄 토큰 새로고침 성공');
            return token;
        } catch (error: any) {
            console.error('❌ 토큰 새로고침 실패:', error);
            return null;
        }
    }

    // 🧹 에러 초기화
    clearError(): void {
        this.authState.error = null;
        this.notifyListeners();
    }

    // 📊 인증 통계
    getAuthStats(): {
        isLoggedIn: boolean;
        isAnonymous: boolean;
        hasEmail: boolean;
        hasDisplayName: boolean;
        hasPhoto: boolean;
    } {
        const user = this.authState.user;
        return {
            isLoggedIn: !!user,
            isAnonymous: user?.isAnonymous || false,
            hasEmail: !!user?.email,
            hasDisplayName: !!user?.displayName,
            hasPhoto: !!user?.photoURL
        };
    }
}

// 싱글톤 인스턴스 생성
export const authService = AuthService.getInstance();

// 인증 상태 타입은 이미 위에서 export됨

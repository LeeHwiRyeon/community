import React, { useState } from 'react';
import { useAuthContext } from './AuthProvider';
import ModernButton from '../ModernUI/ModernButton';
import ModernCard from '../ModernUI/ModernCard';

/**
 * 🔐 로그인 폼 컴포넌트
 * 
 * 익명 로그인 및 구글 로그인 기능
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-01-02
 */
const LoginForm: React.FC = () => {
    const {
        signInAnonymously,
        signInWithGoogle,
        linkWithGoogle,
        isLoading,
        error,
        clearError,
        authStats
    } = useAuthContext();

    const [isSigningIn, setIsSigningIn] = useState(false);

    // 👤 익명 로그인 핸들러
    const handleAnonymousLogin = async () => {
        try {
            setIsSigningIn(true);
            clearError();

            console.log('👤 익명 로그인 시작...');
            const userProfile = await signInAnonymously();

            if (userProfile) {
                console.log('✅ 익명 로그인 성공:', userProfile.uid);
            } else {
                console.log('❌ 익명 로그인 실패');
            }
        } catch (error) {
            console.error('익명 로그인 오류:', error);
        } finally {
            setIsSigningIn(false);
        }
    };

    // 🔍 구글 로그인 핸들러
    const handleGoogleLogin = async () => {
        try {
            setIsSigningIn(true);
            clearError();

            console.log('🔍 구글 로그인 시작...');
            const userProfile = await signInWithGoogle();

            if (userProfile) {
                console.log('✅ 구글 로그인 성공:', userProfile.email);
            } else {
                console.log('❌ 구글 로그인 실패');
            }
        } catch (error) {
            console.error('구글 로그인 오류:', error);
        } finally {
            setIsSigningIn(false);
        }
    };

    // 🔄 계정 연결 핸들러
    const handleLinkAccount = async () => {
        try {
            setIsSigningIn(true);
            clearError();

            console.log('🔄 익명 계정을 구글 계정으로 연결 시작...');
            const userProfile = await linkWithGoogle();

            if (userProfile) {
                console.log('✅ 계정 연결 성공:', userProfile.email);
            } else {
                console.log('❌ 계정 연결 실패');
            }
        } catch (error) {
            console.error('계정 연결 오류:', error);
        } finally {
            setIsSigningIn(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
        }}>
            <ModernCard
                variant="glass"
                padding="lg"
                style={{
                    maxWidth: '500px',
                    width: '100%',
                    textAlign: 'center'
                }}
            >
                <h1 style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    marginBottom: '1rem',
                    color: 'white',
                    background: 'linear-gradient(45deg, #ffffff, #f0f4ff)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    🔐 로그인
                </h1>

                <p style={{
                    fontSize: '1.1rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                    marginBottom: '2rem'
                }}>
                    Community Platform v3.0에 오신 것을 환영합니다!
                </p>

                {/* 에러 메시지 */}
                {error && (
                    <div
                        style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid rgba(239, 68, 68, 0.5)',
                            borderRadius: '0.5rem',
                            padding: '1rem',
                            marginBottom: '1.5rem',
                            color: '#fca5a5'
                        }}
                        data-testid="error-message"
                        role="alert"
                    >
                        ❌ {error}
                    </div>
                )}

                {/* 로그인 버튼들 */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        marginBottom: '2rem'
                    }}
                    data-testid="login-buttons-container"
                >
                    {/* 익명 로그인 */}
                    <ModernButton
                        variant="primary"
                        size="lg"
                        onClick={handleAnonymousLogin}
                        loading={isSigningIn}
                        disabled={isLoading || isSigningIn}
                        style={{
                            width: '100%',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                        }}
                        data-testid="anonymous-login-button"
                    >
                        👤 익명으로 시작하기
                    </ModernButton>

                    {/* 구글 로그인 */}
                    <ModernButton
                        variant="secondary"
                        size="lg"
                        onClick={handleGoogleLogin}
                        loading={isSigningIn}
                        disabled={isLoading || isSigningIn}
                        style={{
                            width: '100%',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            color: 'white',
                            border: 'none'
                        }}
                        data-testid="google-login-button"
                    >
                        🔍 Google로 로그인
                    </ModernButton>

                    {/* 익명 계정 연결 (익명 사용자만 표시) */}
                    {authStats.isAnonymous && (
                        <ModernButton
                            variant="ghost"
                            size="lg"
                            onClick={handleLinkAccount}
                            loading={isSigningIn}
                            disabled={isLoading || isSigningIn}
                            style={{
                                width: '100%',
                                color: 'white',
                                border: '2px solid rgba(255, 255, 255, 0.3)'
                            }}
                            data-testid="link-account-button"
                        >
                            🔄 Google 계정으로 연결
                        </ModernButton>
                    )}
                </div>

                {/* 로딩 상태 */}
                {isLoading && (
                    <div style={{
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '0.9rem'
                    }}>
                        🔄 인증 상태 확인 중...
                    </div>
                )}

                {/* 인증 상태 정보 */}
                {authStats.isLoggedIn && (
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        marginTop: '1rem',
                        fontSize: '0.9rem',
                        color: 'rgba(255, 255, 255, 0.8)'
                    }}>
                        <div style={{ marginBottom: '0.5rem' }}>
                            ✅ 로그인 상태: {authStats.isAnonymous ? '익명' : '인증됨'}
                        </div>
                        {authStats.hasEmail && (
                            <div>📧 이메일: 연결됨</div>
                        )}
                        {authStats.hasDisplayName && (
                            <div>👤 이름: 설정됨</div>
                        )}
                        {authStats.hasPhoto && (
                            <div>🖼️ 프로필 사진: 설정됨</div>
                        )}
                    </div>
                )}

                {/* 도움말 */}
                <div style={{
                    marginTop: '2rem',
                    fontSize: '0.8rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    lineHeight: '1.5'
                }}>
                    <p>💡 <strong>익명 로그인</strong>: 빠르게 시작하고 나중에 계정을 연결할 수 있습니다.</p>
                    <p>🔍 <strong>Google 로그인</strong>: Google 계정으로 안전하게 로그인합니다.</p>
                </div>
            </ModernCard>
        </div>
    );
};

export default LoginForm;

import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface AuthCallbackProps {
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

export const AuthCallback: React.FC<AuthCallbackProps> = ({ onSuccess, onError }) => {
    const [isProcessing, setIsProcessing] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { refreshUser } = useAuth();

    useEffect(() => {
        const processCallback = async () => {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const code = urlParams.get('code');
                const state = urlParams.get('state');
                const error = urlParams.get('error');

                if (error) {
                    throw new Error(`OAuth error: ${error}`);
                }

                if (!code) {
                    throw new Error('No authorization code received');
                }

                // URL에서 provider 추출 (state 또는 현재 경로에서)
                const pathSegments = window.location.pathname.split('/');
                const provider = pathSegments[pathSegments.length - 1] || 'google';

                // 백엔드 콜백 엔드포인트 호출
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/callback/${provider}?code=${code}&state=${state || ''}`);

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Authentication failed');
                }

                const authData = await response.json();

                // 토큰 저장
                if (authData.access && authData.refresh) {
                    api.tokenManager.setTokens(authData.access, authData.refresh);

                    // 사용자 정보 갱신
                    await refreshUser();

                    onSuccess?.();
                } else {
                    throw new Error('No tokens received');
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
                setError(errorMessage);
                onError?.(errorMessage);
            } finally {
                setIsProcessing(false);
            }
        };

        processCallback();
    }, [refreshUser, onSuccess, onError]);

    if (isProcessing) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">인증 처리 중...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="text-red-500 text-lg font-semibold mb-4">인증 실패</div>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        홈으로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    return null;
};
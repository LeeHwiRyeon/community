import React, { useState } from 'react';
import { useAuthContext } from './AuthProvider';
import ModernButton from '../ModernUI/ModernButton';
import ModernCard from '../ModernUI/ModernCard';
import ModernInput from '../ModernUI/ModernInput';

/**
 * 👤 사용자 프로필 컴포넌트
 * 
 * 사용자 정보 표시 및 프로필 업데이트
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-01-02
 */
const UserProfile: React.FC = () => {
    const {
        currentUser,
        signOut,
        updateProfile,
        linkWithGoogle,
        authStats,
        isLoading
    } = useAuthContext();

    const [isEditing, setIsEditing] = useState(false);
    const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
    const [photoURL, setPhotoURL] = useState(currentUser?.photoURL || '');
    const [isUpdating, setIsUpdating] = useState(false);

    // 🚪 로그아웃 핸들러
    const handleSignOut = async () => {
        try {
            console.log('🚪 로그아웃 시작...');
            await signOut();
            console.log('✅ 로그아웃 성공');
        } catch (error) {
            console.error('로그아웃 오류:', error);
        }
    };

    // 🔄 계정 연결 핸들러
    const handleLinkAccount = async () => {
        try {
            console.log('🔄 Google 계정 연결 시작...');
            await linkWithGoogle();
            console.log('✅ 계정 연결 성공');
        } catch (error) {
            console.error('계정 연결 오류:', error);
        }
    };

    // 📝 프로필 업데이트 핸들러
    const handleUpdateProfile = async () => {
        try {
            setIsUpdating(true);
            console.log('📝 프로필 업데이트 시작...');

            const success = await updateProfile({
                displayName: displayName || undefined,
                photoURL: photoURL || undefined
            });

            if (success) {
                console.log('✅ 프로필 업데이트 성공');
                setIsEditing(false);
            } else {
                console.log('❌ 프로필 업데이트 실패');
            }
        } catch (error) {
            console.error('프로필 업데이트 오류:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    if (!currentUser) {
        return (
            <div style={{
                padding: '2rem',
                textAlign: 'center',
                color: 'white'
            }}>
                <h2>👤 사용자 정보를 불러오는 중...</h2>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '2rem'
        }}>
            <div style={{
                maxWidth: '800px',
                margin: '0 auto'
            }}>
                <h1 style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    marginBottom: '2rem',
                    color: 'white',
                    textAlign: 'center'
                }}>
                    👤 사용자 프로필
                </h1>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                    gap: '2rem'
                }}>
                    {/* 프로필 정보 카드 */}
                    <ModernCard
                        variant="glass"
                        padding="lg"
                        style={{
                            color: 'white'
                        }}
                    >
                        <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            marginBottom: '1.5rem',
                            textAlign: 'center'
                        }}>
                            📊 계정 정보
                        </h2>

                        {/* 프로필 사진 */}
                        {currentUser.photoURL ? (
                            <div style={{
                                textAlign: 'center',
                                marginBottom: '1.5rem'
                            }}>
                                <img
                                    src={currentUser.photoURL}
                                    alt="프로필"
                                    style={{
                                        width: '100px',
                                        height: '100px',
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        border: '3px solid rgba(255, 255, 255, 0.3)'
                                    }}
                                />
                            </div>
                        ) : (
                            <div style={{
                                textAlign: 'center',
                                marginBottom: '1.5rem'
                            }}>
                                <div style={{
                                    width: '100px',
                                    height: '100px',
                                    borderRadius: '50%',
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '2rem',
                                    margin: '0 auto'
                                }}>
                                    👤
                                </div>
                            </div>
                        )}

                        {/* 사용자 정보 */}
                        <div style={{
                            gap: '1rem'
                        }}>
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                borderRadius: '0.5rem',
                                padding: '1rem',
                                marginBottom: '1rem'
                            }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>👤 이름</div>
                                <div>{currentUser.displayName || '설정되지 않음'}</div>
                            </div>

                            <div style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                borderRadius: '0.5rem',
                                padding: '1rem',
                                marginBottom: '1rem'
                            }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>📧 이메일</div>
                                <div>{currentUser.email || '익명 사용자'}</div>
                            </div>

                            <div style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                borderRadius: '0.5rem',
                                padding: '1rem',
                                marginBottom: '1rem'
                            }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>🆔 사용자 ID</div>
                                <div style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                                    {currentUser.uid}
                                </div>
                            </div>

                            <div style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                borderRadius: '0.5rem',
                                padding: '1rem',
                                marginBottom: '1rem'
                            }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>🔐 계정 타입</div>
                                <div>
                                    {currentUser.isAnonymous ? '👤 익명 계정' : '✅ 인증된 계정'}
                                </div>
                            </div>
                        </div>
                    </ModernCard>

                    {/* 프로필 편집 카드 */}
                    <ModernCard
                        variant="glass"
                        padding="lg"
                        style={{
                            color: 'white'
                        }}
                    >
                        <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            marginBottom: '1.5rem',
                            textAlign: 'center'
                        }}>
                            ⚙️ 프로필 설정
                        </h2>

                        {!isEditing ? (
                            <div>
                                <div style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    borderRadius: '0.5rem',
                                    padding: '1rem',
                                    marginBottom: '1.5rem'
                                }}>
                                    <h3 style={{ marginBottom: '1rem' }}>📊 계정 상태</h3>
                                    <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                                        <div>✅ 로그인: {authStats.isLoggedIn ? '완료' : '미완료'}</div>
                                        <div>👤 익명: {authStats.isAnonymous ? '예' : '아니오'}</div>
                                        <div>📧 이메일: {authStats.hasEmail ? '연결됨' : '없음'}</div>
                                        <div>👤 이름: {authStats.hasDisplayName ? '설정됨' : '없음'}</div>
                                        <div>🖼️ 사진: {authStats.hasPhoto ? '설정됨' : '없음'}</div>
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1rem'
                                }}>
                                    <ModernButton
                                        variant="primary"
                                        size="md"
                                        onClick={() => setIsEditing(true)}
                                        style={{
                                            width: '100%',
                                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                                        }}
                                    >
                                        📝 프로필 편집
                                    </ModernButton>

                                    {authStats.isAnonymous && (
                                        <ModernButton
                                            variant="secondary"
                                            size="md"
                                            onClick={handleLinkAccount}
                                            style={{
                                                width: '100%',
                                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                color: 'white',
                                                border: 'none'
                                            }}
                                        >
                                            🔄 Google 계정 연결
                                        </ModernButton>
                                    )}

                                    <ModernButton
                                        variant="ghost"
                                        size="md"
                                        onClick={handleSignOut}
                                        style={{
                                            width: '100%',
                                            color: '#ef4444',
                                            border: '2px solid rgba(239, 68, 68, 0.3)'
                                        }}
                                    >
                                        🚪 로그아웃
                                    </ModernButton>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1rem',
                                    marginBottom: '1.5rem'
                                }}>
                                    <ModernInput
                                        label="👤 표시 이름"
                                        placeholder="이름을 입력하세요"
                                        value={displayName}
                                        onChange={setDisplayName}
                                        style={{ color: 'white' }}
                                    />

                                    <ModernInput
                                        label="🖼️ 프로필 사진 URL"
                                        placeholder="이미지 URL을 입력하세요"
                                        value={photoURL}
                                        onChange={setPhotoURL}
                                        style={{ color: 'white' }}
                                    />
                                </div>

                                <div style={{
                                    display: 'flex',
                                    gap: '1rem'
                                }}>
                                    <ModernButton
                                        variant="primary"
                                        size="md"
                                        onClick={handleUpdateProfile}
                                        loading={isUpdating}
                                        disabled={isUpdating}
                                        style={{
                                            flex: 1,
                                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                        }}
                                    >
                                        💾 저장
                                    </ModernButton>

                                    <ModernButton
                                        variant="ghost"
                                        size="md"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setDisplayName(currentUser.displayName || '');
                                            setPhotoURL(currentUser.photoURL || '');
                                        }}
                                        style={{
                                            flex: 1,
                                            color: 'white',
                                            border: '2px solid rgba(255, 255, 255, 0.3)'
                                        }}
                                    >
                                        ❌ 취소
                                    </ModernButton>
                                </div>
                            </div>
                        )}
                    </ModernCard>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;

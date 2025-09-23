import React from 'react'

function App() {
    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#fef7ed',
            padding: '20px',
            fontFamily: 'Arial, sans-serif'
        }}>
            <h1 style={{
                color: '#92400e',
                fontSize: '2rem',
                textAlign: 'center',
                marginBottom: '20px'
            }}>
                📰 The News Paper - 테스트
            </h1>

            <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                maxWidth: '800px',
                margin: '0 auto'
            }}>
                <h2 style={{ color: '#1f2937', marginBottom: '15px' }}>
                    🎮 게임 커뮤니티에 오신 것을 환영합니다!
                </h2>

                <p style={{ color: '#6b7280', lineHeight: '1.6', marginBottom: '15px' }}>
                    이 페이지가 보인다면 React 앱이 정상적으로 작동하고 있습니다.
                </p>

                <div style={{
                    backgroundColor: '#f3f4f6',
                    padding: '15px',
                    borderRadius: '6px',
                    marginBottom: '15px'
                }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#374151' }}>
                        🔧 현재 상태:
                    </h3>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#6b7280' }}>
                        <li>✅ React 앱 로딩 완료</li>
                        <li>✅ CSS 스타일 적용 완료</li>
                        <li>✅ 한글 폰트 지원</li>
                        <li>✅ 백그라운드 색상 표시</li>
                    </ul>
                </div>

                <button
                    style={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                    onClick={() => {
                        alert('버튼이 정상적으로 작동합니다! 🎉');
                    }}
                >
                    🧪 테스트 버튼 클릭
                </button>
            </div>

            <div style={{
                textAlign: 'center',
                marginTop: '40px',
                color: '#9ca3af',
                fontSize: '14px'
            }}>
                현재 시간: {new Date().toLocaleString('ko-KR')}
            </div>
        </div>
    )
}

export default App
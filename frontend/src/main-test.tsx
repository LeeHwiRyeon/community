import { createRoot } from 'react-dom/client'
import './newspaper.css'

// 간단한 테스트 컴포넌트
function App() {
    return (
        <div>
            <h1>프론트엔드 테스트</h1>
            <p>React 앱이 정상적으로 로드되었습니다!</p>
            <div style={{
                padding: '20px',
                background: '#f0f0f0',
                margin: '20px',
                borderRadius: '8px'
            }}>
                <h2>백엔드 연결 테스트</h2>
                <button onClick={async () => {
                    try {
                        const response = await fetch('http://localhost:50000/api/health')
                        const data = await response.json()
                        alert('백엔드 연결 성공: ' + JSON.stringify(data))
                    } catch (error) {
                        alert('백엔드 연결 실패: ' + error.message)
                    }
                }}>
                    백엔드 테스트
                </button>
            </div>
        </div>
    )
}

createRoot(document.getElementById('root')!).render(<App />)
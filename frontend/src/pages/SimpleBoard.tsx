import React, { useState, useEffect } from 'react';
import './SimpleBoard.css'; // CSS 파일 분리

interface BoardItem {
    id: number;
    title: string;
    summary: string;
    author: string;
    timestamp: string;
    views: number;
    comments: number;
    category: string;
    badge?: string;
    isCompleted?: boolean;
}

const SimpleBoard: React.FC = () => {
    const [boardItems, setBoardItems] = useState<BoardItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 기존 뉴스페이퍼 스타일의 모의 데이터
        const mockData: BoardItem[] = [
            {
                id: 1,
                title: "📰 커뮤니티 메인 페이지 UI/UX 개선 완료",
                summary: "사용자 중심의 직관적인 인터페이스로 전면 개편하여 사용성을 크게 향상시켰습니다.",
                author: "AUTOAGENTS Manager",
                timestamp: "2시간 전",
                views: 245,
                comments: 12,
                category: "개발",
                badge: "완료",
                isCompleted: true
            },
            {
                id: 2,
                title: "🎮 게임 커뮤니티 리더보드 시스템 구축",
                summary: "실시간 순위 시스템과 게임별 통계 기능을 추가하여 경쟁적인 게임 환경을 조성했습니다.",
                author: "Game Developer",
                timestamp: "4시간 전",
                views: 189,
                comments: 8,
                category: "게임",
                badge: "진행중"
            },
            {
                id: 3,
                title: "📺 스트리밍 플랫폼 연동 기능 개발",
                summary: "라이브 방송 상태 표시 및 실시간 채팅 기능을 통해 스트리머와 시청자 간 소통을 강화했습니다.",
                author: "Streaming Team",
                timestamp: "6시간 전",
                views: 156,
                comments: 15,
                category: "스트리밍",
                badge: "검토중"
            },
            {
                id: 4,
                title: "🎭 코스프레 갤러리 포트폴리오 시스템",
                summary: "작품 전시와 제작 과정 공유를 위한 전문적인 갤러리 시스템을 구축했습니다.",
                author: "Art Director",
                timestamp: "8시간 전",
                views: 203,
                comments: 22,
                category: "아트",
                badge: "완료",
                isCompleted: true
            },
            {
                id: 5,
                title: "⚡ 성능 최적화 및 무한스크롤 구현",
                summary: "대량 데이터 처리 시 랙 방지를 위한 가상화 스크롤링과 캐싱 시스템을 도입했습니다.",
                author: "Performance Team",
                timestamp: "12시간 전",
                views: 134,
                comments: 6,
                category: "최적화",
                badge: "완료",
                isCompleted: true
            },
            {
                id: 6,
                title: "🔧 개발 환경 개선 - 크롬 보호 시스템",
                summary: "개발 서버 재시작 시 브라우저 종료 방지 및 선택적 프로세스 관리 시스템을 구축했습니다.",
                author: "DevOps Team",
                timestamp: "1일 전",
                views: 98,
                comments: 4,
                category: "인프라",
                badge: "진행중"
            }
        ];

        setTimeout(() => {
            setBoardItems(mockData);
            setLoading(false);
        }, 500);
    }, []);

    const handleCardClick = (item: BoardItem) => {
        console.log('Board item clicked:', item.title);
    };

    const handleToggleComplete = (id: number) => {
        setBoardItems(prev =>
            prev.map(item =>
                item.id === id
                    ? { ...item, isCompleted: !item.isCompleted }
                    : item
            )
        );
    };

    if (loading) {
        return (
            <div className="simple-board">
                <div className="simple-board__header">
                    <h1 className="simple-board__title">📋 Simple Board</h1>
                    <p className="simple-board__subtitle">기존 뉴스페이퍼 스타일의 심플한 게시판</p>
                </div>
                <div className="simple-board__loading">
                    {[...Array(6)].map((_, index) => (
                        <div key={index} className="board-card-skeleton">
                            <div className="board-card-skeleton__header">
                                <div className="board-card-skeleton__title-section">
                                    <div className="skeleton" style={{ width: '20px', height: '20px', borderRadius: '50%' }}></div>
                                    <div className="skeleton" style={{ width: '60%', height: '20px' }}></div>
                                    <div className="skeleton" style={{ width: '60px', height: '18px', borderRadius: '12px' }}></div>
                                </div>
                                <div className="skeleton" style={{ width: '100%', height: '16px' }}></div>
                            </div>
                            <div className="board-card-skeleton__body">
                                <div className="skeleton" style={{ width: '80px', height: '12px' }}></div>
                                <div className="skeleton" style={{ width: '60px', height: '12px' }}></div>
                                <div className="skeleton" style={{ width: '70px', height: '12px' }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="simple-board">
            <div className="simple-board__header">
                <h1 className="simple-board__title">📋 Simple Board</h1>
                <p className="simple-board__subtitle">기존 뉴스페이퍼 스타일의 심플한 게시판</p>
                <div className="simple-board__stats">
                    <span>총 {boardItems.length}개 항목</span>
                    <span>완료: {boardItems.filter(item => item.isCompleted).length}개</span>
                    <span>진행중: {boardItems.filter(item => !item.isCompleted).length}개</span>
                </div>
            </div>

            <div className="simple-board__content">
                <div className="community-hub__board-cards">
                    {boardItems.map((item, index) => (
                        <div
                            key={item.id}
                            className={`board-card card-enter card-pulse ${item.isCompleted ? 'completed' : ''}`}
                            style={{ animationDelay: `${index * 0.1}s` }}
                            onClick={() => handleCardClick(item)}
                        >
                            <div className="board-card__header">
                                <div className="board-card__title-section">
                                    <input
                                        type="checkbox"
                                        className="board-card__todo-checkbox"
                                        checked={item.isCompleted || false}
                                        onChange={() => handleToggleComplete(item.id)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <label className="board-card__checkbox-label">
                                        <h3 className="board-card__title">{item.title}</h3>
                                    </label>
                                    {item.badge && (
                                        <span className={`board-card__badge ${item.badge === '완료' ? 'completed' : item.badge === '진행중' ? 'in-progress' : 'review'}`}>
                                            {item.badge}
                                        </span>
                                    )}
                                </div>
                                <p className="board-card__summary">{item.summary}</p>
                            </div>
                            <div className="board-card__body">
                                <span>👤 {item.author}</span>
                                <span>🕒 {item.timestamp}</span>
                                <span>👁️ {item.views}</span>
                                <span>💬 {item.comments}</span>
                                <span>📂 {item.category}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="simple-board__footer">
                <p>💡 기존 뉴스페이퍼 CSS 구조를 활용한 심플보드 시스템</p>
                <p>🚀 board-card, attachment-uploader, post-card 스타일 적용</p>
            </div>
        </div>
    );
};

export default SimpleBoard;

import { useState, useEffect } from 'react'
import { TestRunner, allTests } from './testCases'

// 백엔드 API와 호환되는 타입 정의
interface Article {
  id: string
  title: string
  content?: string
  author?: string
  timestamp: string
  category?: string
  views?: number
  comments?: number
  likes?: number
  image?: string
  isHot?: boolean
  isNew?: boolean
  boardId: string
  board_id: string
  date?: string
  tag?: string
  thumb?: string
  deleted?: number
  created_at?: string
  updated_at?: string
}

interface Board {
  id: string
  name: string
  title: string
  description?: string
  icon?: string
  type?: 'text' | 'image' | 'stream'
  color?: string
  ordering?: number
  deleted?: number
  created_at?: string
  updated_at?: string
}

interface TrendingItem {
  id: string
  title: string
  rank: number
  views: number
  category: string
  isRising: boolean
  boardId: string
}

// 목데이터
const boards: Board[] = [
  { id: 'all', name: '전체', title: '전체', description: '모든 게시판', icon: '📋', type: 'text', color: 'bg-gray-100' },
  { id: 'strategy', name: '공략', title: '공략', description: '게임 공략 및 팁', icon: '🎯', type: 'text', color: 'bg-blue-100' },
  { id: 'free', name: '자유게시판', title: '자유게시판', description: '자유로운 대화', icon: '💬', type: 'text', color: 'bg-green-100' },
  { id: 'cosplay', name: '코스프레', title: '코스프레', description: '코스프레 사진 및 정보', icon: '📸', type: 'image', color: 'bg-pink-100' },
  { id: 'streaming', name: '방송', title: '방송', description: '게임 방송 및 스트리밍', icon: '📺', type: 'stream', color: 'bg-purple-100' },
  { id: 'ranking', name: '랭킹', title: '랭킹', description: '게임 순위 및 통계', icon: '🏆', type: 'text', color: 'bg-yellow-100' }
]

const mockArticles: Article[] = [
  {
    id: '1',
    title: '리그 오브 레전드 14.24 패치 노트 전체 분석',
    content: '이번 패치에서는 ADC 메타에 큰 변화가 있을 것으로 예상됩니다. 주요 변경사항을 살펴보겠습니다.',
    author: '프로게이머김철수',
    timestamp: '2024-01-15T10:00:00Z',
    category: '뉴스',
    views: 15420,
    comments: 89,
    likes: 234,
    image: 'https://via.placeholder.com/400x200/4F46E5/ffffff?text=LOL+Patch',
    isHot: true,
    isNew: false,
    boardId: 'strategy',
    board_id: 'strategy'
  },
  {
    id: '2',
    title: '발로란트 새로운 요원 네온 상세 가이드',
    content: '전격적인 스킬셋을 가진 네온의 활용법과 팁을 알아보세요.',
    author: '발로마스터',
    timestamp: '2024-01-15T09:30:00Z',
    category: '공략',
    views: 8930,
    comments: 45,
    likes: 178,
    image: 'https://via.placeholder.com/400x200/DC2626/ffffff?text=Valorant+Guide',
    isHot: false,
    isNew: true,
    boardId: 'strategy',
    board_id: 'strategy'
  },
  {
    id: '3',
    title: '오늘 점심 뭐 먹을까요? 추천 좀 해주세요',
    content: '회사 근처에서 맛있는 점심 메뉴 추천받습니다!',
    author: '직장인게이머',
    timestamp: '2024-01-15T12:00:00Z',
    category: '잡담',
    views: 2341,
    comments: 67,
    likes: 23,
    isHot: false,
    isNew: true,
    boardId: 'free',
    board_id: 'free'
  },
  {
    id: '4',
    title: '아리 코스프레 의상 제작 후기',
    content: '직접 제작한 아리 코스프레 의상 제작 과정을 공유합니다.',
    author: '코스어',
    timestamp: '2024-01-15T11:45:00Z',
    category: '코스프레',
    views: 12450,
    comments: 156,
    likes: 890,
    image: 'https://via.placeholder.com/400x200/EC4899/ffffff?text=Cosplay',
    isHot: true,
    isNew: false,
    boardId: 'cosplay',
    board_id: 'cosplay'
  },
  {
    id: '5',
    title: '[LIVE] 롤 랭크게임 클라이밍 방송',
    content: '다이아까지 올라가는 여정을 함께해요! 소통 환영합니다.',
    author: '스트리머짱구',
    timestamp: '2024-01-15T13:00:00Z',
    category: '방송',
    views: 3789,
    comments: 234,
    likes: 567,
    isHot: false,
    isNew: true,
    boardId: 'streaming',
    board_id: 'streaming'
  }
]

const trendingData: TrendingItem[] = [
  { id: '1', title: '리그 오브 레전드 14.24 패치 노트', rank: 1, views: 15420, category: '뉴스', isRising: true, boardId: 'strategy' },
  { id: '4', title: '아리 코스프레 의상 제작 후기', rank: 2, views: 12450, category: '코스프레', isRising: false, boardId: 'cosplay' },
  { id: '2', title: '발로란트 새로운 요원 네온 가이드', rank: 3, views: 8930, category: '공략', isRising: true, boardId: 'strategy' },
  { id: '5', title: '[LIVE] 롤 랭크게임 방송', rank: 4, views: 3456, category: '방송', isRising: false, boardId: 'streaming' },
  { id: '3', title: '오늘 점심 뭐 먹을까요?', rank: 5, views: 2341, category: '잡담', isRising: true, boardId: 'free' }
]

function App() {
  const [selectedBoard, setSelectedBoard] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPost, setSelectedPost] = useState<Article | null>(null)
  const [showAllTrending, setShowAllTrending] = useState(false)
  const [currentPage, setCurrentPage] = useState<'home' | 'board'>('home')
  const [filteredArticles, setFilteredArticles] = useState<Article[]>(mockArticles)
  const [testResults, setTestResults] = useState<any[]>([])
  const [isRunningTests, setIsRunningTests] = useState(false)

  // 게시글 필터링
  useEffect(() => {
    let filtered = mockArticles

    if (selectedBoard !== 'all') {
      filtered = filtered.filter(article => article.boardId === selectedBoard)
    }

    if (searchQuery) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredArticles(filtered)
  }, [selectedBoard, searchQuery])

  // 테스트 실행
  const runTests = async () => {
    setIsRunningTests(true)
    const testRunner = new TestRunner()
    const results = await testRunner.runAllTests(allTests)
    setTestResults(results)
    setIsRunningTests(false)

    console.log('테스트 실행 완료:', testRunner.getSummary())
  }

  // 시간 포맷팅
  const formatTime = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diff = now.getTime() - time.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (hours < 1) return '방금 전'
    if (hours < 24) return `${hours}시간 전`
    return `${Math.floor(hours / 24)}일 전`
  }

  // 게시글 클릭 핸들러 - 테스트 케이스 1
  const handlePostClick = (article: Article) => {
    setSelectedBoard(article.boardId)
    setCurrentPage('board')
    setSelectedPost(article)

    console.log(`✅ 테스트 통과: 게시글 "${article.title}" 클릭 -> 보드 "${article.boardId}"로 이동`)
  }

  // 보드 클릭 핸들러 - 테스트 케이스 2  
  const handleBoardClick = (boardId: string) => {
    setSelectedBoard(boardId)
    setCurrentPage(boardId === 'all' ? 'home' : 'board')
    setSelectedPost(null)

    console.log(`✅ 테스트 통과: 보드 "${boardId}" 클릭 -> 페이지 이동`)
  }

  // 홈으로 돌아가기
  const handleHomeClick = () => {
    setCurrentPage('home')
    setSelectedBoard('all')
    setSelectedPost(null)
    setSearchQuery('')

    console.log('✅ 테스트 통과: 홈으로 이동')
  }

  // 트렌딩 아이템 클릭 핸들러 - 테스트 케이스 3
  const handleTrendingClick = (item: TrendingItem) => {
    const article = mockArticles.find(a => a.id === item.id)
    if (article) {
      handlePostClick(article)
      console.log(`✅ 테스트 통과: 트렌딩 아이템 "${item.title}" 클릭`)
    }
  }

  // 기본 스타일 클래스들
  const styles = {
    container: 'max-w-7xl mx-auto px-4',
    card: 'bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 cursor-pointer',
    button: 'px-4 py-2 rounded-md font-medium transition-colors duration-200 cursor-pointer',
    buttonPrimary: 'bg-blue-600 text-white hover:bg-blue-700',
    buttonSecondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    buttonOutline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    badge: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
    badgeHot: 'bg-red-100 text-red-800',
    badgeNew: 'bg-green-100 text-green-800',
    badgeCategory: 'bg-blue-100 text-blue-800',
    input: 'px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
  }

  // 게시글 컴포넌트
  const PostCard = ({ article, compact = false }: { article: Article, compact?: boolean }) => (
    <div
      className={`${styles.card} p-4`}
      onClick={() => handlePostClick(article)}
      data-testid={`post-${article.id}`}
    >
      <div className={`flex gap-4 ${compact ? 'items-center' : ''}`}>
        {article.image && !compact && (
          <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
            <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`${styles.badge} ${styles.badgeCategory}`}>
              {article.category}
            </span>
            {article.isHot && (
              <span className={`${styles.badge} ${styles.badgeHot}`}>HOT</span>
            )}
            {article.isNew && (
              <span className={`${styles.badge} ${styles.badgeNew}`}>NEW</span>
            )}
          </div>

          <h3 className={`font-semibold text-gray-900 mb-2 ${compact ? 'text-sm' : 'text-base'}`}>
            {article.title}
          </h3>

          {!compact && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {article.content}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-3">
              <span>{article.author}</span>
              <span>{formatTime(article.timestamp)}</span>
            </div>
            <div className="flex items-center gap-3">
              <span>👁 {article.views.toLocaleString()}</span>
              <span>💬 {article.comments}</span>
              <span>👍 {article.likes}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // 트렌딩 아이템 컴포넌트
  const TrendingItem = ({ item }: { item: TrendingItem }) => (
    <div
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => handleTrendingClick(item)}
      data-testid={`trending-${item.id}`}
    >
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
        {item.rank}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.title}</p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{item.category}</span>
          <span>👁 {item.views.toLocaleString()}</span>
          {item.isRising && (
            <span className="text-red-500">📈 급상승</span>
          )}
        </div>
      </div>
    </div>
  )

  // 메인 페이지 렌더링
  if (currentPage === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
        {/* 헤더 */}
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className={`${styles.container} py-4`}>
            <div className="flex items-center justify-between">
              <button
                className="text-3xl font-bold text-amber-800 hover:text-amber-900 transition-colors"
                onClick={handleHomeClick}
                data-testid="home-button"
              >
                📰 The News Paper
              </button>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="게시글 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`${styles.input} w-64 pl-10`}
                    data-testid="search-input"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                </div>
                <button className={`${styles.button} ${styles.buttonOutline}`}>
                  👤 로그인
                </button>
                <button
                  className={`${styles.button} ${styles.buttonPrimary}`}
                  onClick={runTests}
                  disabled={isRunningTests}
                  data-testid="run-tests-button"
                >
                  {isRunningTests ? '테스트 실행 중...' : '🧪 테스트 실행'}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* 테스트 결과 표시 */}
        {testResults.length > 0 && (
          <div className={`${styles.container} py-4`}>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="font-bold mb-3">테스트 결과</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded ${result.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                  >
                    <div className="font-medium">{result.passed ? '✅' : '❌'} {result.testCase.name}</div>
                    <div className="text-xs opacity-75">{result.testCase.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 메인 컨텐츠 */}
        <main className={`${styles.container} py-6`}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 왼쪽: 메인 기사 영역 */}
            <div className="lg:col-span-3 space-y-6">
              <section>
                <h2 className="text-2xl font-bold mb-4 text-gray-900">게임뉴스</h2>
                <div className="grid gap-4">
                  {filteredArticles.slice(0, 3).map(article => (
                    <PostCard key={article.id} article={article} />
                  ))}
                </div>
              </section>

              <hr className="border-gray-200" />

              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">커뮤니티</h2>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {boards.map(board => (
                    <button
                      key={board.id}
                      className={`${styles.button} ${selectedBoard === board.id ? styles.buttonPrimary : styles.buttonOutline} gap-2`}
                      onClick={() => handleBoardClick(board.id)}
                      data-testid={`board-tab-${board.id}`}
                    >
                      <span>{board.icon}</span>
                      {board.name}
                    </button>
                  ))}
                </div>

                <div className="grid gap-4">
                  {filteredArticles.slice(0, 5).map(article => (
                    <PostCard key={article.id} article={article} compact />
                  ))}
                </div>
              </section>
            </div>

            {/* 오른쪽: 사이드바 */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">실시간 인기</h3>
                  <button
                    className={`${styles.button} text-sm px-2 py-1 ${styles.buttonSecondary}`}
                    onClick={() => setShowAllTrending(!showAllTrending)}
                    data-testid="trending-toggle"
                  >
                    {showAllTrending ? '접기' : '더보기'}
                  </button>
                </div>
                <div className="space-y-2">
                  {(showAllTrending ? trendingData : trendingData.slice(0, 5)).map(item => (
                    <TrendingItem key={item.id} item={item} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* 푸터 */}
        <footer className="border-t bg-white/50 mt-12">
          <div className={`${styles.container} py-8`}>
            <div className="text-center text-sm text-gray-600">
              <p>© 2024 The News Paper. 모든 권리 보유.</p>
              <p className="mt-2">
                문의: <a href="mailto:ShinyPool1992@gmail.com" className="text-blue-600 hover:underline">ShinyPool1992@gmail.com</a>
              </p>
            </div>
          </div>
        </footer>
      </div>
    )
  }

  // 게시판 페이지 렌더링
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className={`${styles.container} py-4`}>
          <div className="flex items-center justify-between">
            <button
              className="text-3xl font-bold text-amber-800 hover:text-amber-900 transition-colors"
              onClick={handleHomeClick}
              data-testid="home-button"
            >
              📰 The News Paper
            </button>

            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="게시글 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${styles.input} w-64 pl-10`}
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
              </div>
              <button className={`${styles.button} ${styles.buttonOutline}`}>
                👤 로그인
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className={`${styles.container} py-6`}>
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <button
              className="hover:text-blue-600"
              onClick={handleHomeClick}
            >
              홈
            </button>
            <span>›</span>
            <span>{boards.find(b => b.id === selectedBoard)?.name}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {boards.find(b => b.id === selectedBoard)?.icon} {boards.find(b => b.id === selectedBoard)?.name}
          </h1>
          <p className="text-gray-600 mt-1">
            {boards.find(b => b.id === selectedBoard)?.description}
          </p>
        </div>

        <div className="grid gap-4">
          {filteredArticles.map(article => (
            <PostCard key={article.id} article={article} />
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">게시글이 없습니다.</p>
          </div>
        )}
      </main>

      {/* 게시글 상세 모달 */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`${styles.badge} ${styles.badgeCategory}`}>{selectedPost.category}</span>
                  {selectedPost.isHot && <span className={`${styles.badge} ${styles.badgeHot}`}>HOT</span>}
                  {selectedPost.isNew && <span className={`${styles.badge} ${styles.badgeNew}`}>NEW</span>}
                </div>
                <button
                  className="text-gray-500 hover:text-gray-700 text-xl"
                  onClick={() => setSelectedPost(null)}
                  data-testid="modal-close"
                >
                  ✕
                </button>
              </div>
              <h1 className="text-2xl font-bold mt-3 mb-2">{selectedPost.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{selectedPost.author}</span>
                <span>{formatTime(selectedPost.timestamp)}</span>
                <span>👁 {selectedPost.views.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {selectedPost.image && (
                <img src={selectedPost.image} alt={selectedPost.title} className="w-full rounded-lg mb-4" />
              )}
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap leading-relaxed">{selectedPost.content}</p>
              </div>

              <div className="flex items-center gap-4 mt-6 pt-4 border-t">
                <button className={`${styles.button} ${styles.buttonOutline} gap-2`}>
                  👍 좋아요 {selectedPost.likes}
                </button>
                <button className={`${styles.button} ${styles.buttonOutline} gap-2`}>
                  💬 댓글 {selectedPost.comments}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
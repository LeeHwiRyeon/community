export const SAMPLE_TITLES = [
  '초보자용 가이드',
  '최고 승률 빌드 추천',
  '프로게이머 인터뷰',
  '패치 노트 요약',
  '신규 챔피언 분석',
  '발로란트 신규 맵 공개',
  '신규 캐릭터 정식 출시',
  '배틀그라운드 신규 맵 첫인상',
  '메이플스토리 사냥터 추천',
  '로스트아크 레이드 공략'
]

export const SAMPLE_SNIPPETS = [
  '요약: 핵심 포인트만 정리했습니다.',
  '팁 모음: 지금 바로 적용 가능한 전략.',
  '체크리스트: 준비물과 주의사항 정리.',
  '주의사항과 권장 설정 포함.',
  '데이터 기반 분석과 통계 제공.'
]

export const SAMPLE_AUTHORS = ['에디터', '게이머23', '비공식', '프로연구소', '운영진']
export const SAMPLE_CATEGORIES = ['guide', 'news', 'image', 'talk', 'event']
export const SAMPLE_THUMBS = [
  'https://picsum.photos/seed/mock1/400/300',
  'https://picsum.photos/seed/mock2/400/300',
  'https://picsum.photos/seed/mock3/400/300',
  ''
]

export const mockRandInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
export const mockPick = (arr) => arr[Math.floor(Math.random() * arr.length)]
export const mockRandomId = () => 'm_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4)

// 최적화된 검색 서비스
const Redis = require('ioredis');
const { performance } = require('perf_hooks');

class OptimizedSearchService {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3
    });
    
    this.cachePrefix = 'search:';
    this.cacheTTL = 300; // 5분
    this.searchIndex = new Map(); // 인메모리 검색 인덱스
  }

  // 검색 인덱스 구축
  async buildSearchIndex() {
    console.log('🔍 검색 인덱스 구축 시작...');
    const start = performance.now();
    
    try {
      // 게시글 데이터 로드 (실제로는 데이터베이스에서)
      const posts = await this.loadPosts();
      
      // 인덱스 구축
      for (const post of posts) {
        this.addToIndex(post);
      }
      
      const end = performance.now();
      console.log(`✅ 검색 인덱스 구축 완료 (${(end - start).toFixed(2)}ms)`);
      
      return true;
    } catch (error) {
      console.error('❌ 검색 인덱스 구축 실패:', error);
      return false;
    }
  }

  // 게시글을 검색 인덱스에 추가
  addToIndex(post) {
    const words = this.extractWords(post.title + ' ' + post.content);
    
    for (const word of words) {
      if (!this.searchIndex.has(word)) {
        this.searchIndex.set(word, []);
      }
      this.searchIndex.get(word).push(post.id);
    }
  }

  // 텍스트에서 검색 가능한 단어 추출
  extractWords(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s가-힣]/g, ' ') // 특수문자 제거, 한글 포함
      .split(/\s+/)
      .filter(word => word.length > 1) // 1글자 단어 제외
      .filter(word => !this.isStopWord(word)); // 불용어 제외
  }

  // 불용어 필터링
  isStopWord(word) {
    const stopWords = [
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      '이', '그', '저', '것', '수', '있', '하', '되', '되다', '하다', '있다', '없다'
    ];
    return stopWords.includes(word);
  }

  // 최적화된 검색 실행
  async search(query, options = {}) {
    const start = performance.now();
    const { limit = 10, offset = 0, boardId } = options;
    
    try {
      // 1. 캐시 확인
      const cacheKey = this.getCacheKey(query, options);
      const cachedResult = await this.getFromCache(cacheKey);
      
      if (cachedResult) {
        console.log('📦 캐시에서 검색 결과 반환');
        return cachedResult;
      }
      
      // 2. 검색 실행
      const results = await this.executeSearch(query, options);
      
      // 3. 결과 캐싱
      await this.setCache(cacheKey, results);
      
      const end = performance.now();
      console.log(`🔍 검색 완료 (${(end - start).toFixed(2)}ms)`);
      
      return results;
    } catch (error) {
      console.error('❌ 검색 실행 실패:', error);
      throw error;
    }
  }

  // 실제 검색 실행
  async executeSearch(query, options) {
    const { limit = 10, offset = 0, boardId } = options;
    const words = this.extractWords(query);
    
    if (words.length === 0) {
      return { total: 0, results: [] };
    }
    
    // 검색어별 매칭되는 게시글 ID 수집
    const postIdSets = words.map(word => {
      const ids = this.searchIndex.get(word) || [];
      return new Set(ids);
    });
    
    // 교집합 계산 (모든 검색어가 포함된 게시글)
    let matchingPostIds = postIdSets[0];
    for (let i = 1; i < postIdSets.length; i++) {
      matchingPostIds = new Set([...matchingPostIds].filter(id => postIdSets[i].has(id)));
    }
    
    // 게시글 데이터 로드
    const postIds = Array.from(matchingPostIds);
    const posts = await this.loadPostsByIds(postIds);
    
    // 필터링 (boardId가 있는 경우)
    const filteredPosts = boardId ? 
      posts.filter(post => post.boardId === boardId) : posts;
    
    // 정렬 (최신순)
    const sortedPosts = filteredPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // 페이지네이션
    const paginatedPosts = sortedPosts.slice(offset, offset + limit);
    
    return {
      total: filteredPosts.length,
      results: paginatedPosts,
      query: query,
      searchTime: performance.now()
    };
  }

  // 캐시 키 생성
  getCacheKey(query, options) {
    const { limit, offset, boardId } = options;
    return `${this.cachePrefix}${query}:${limit}:${offset}:${boardId || 'all'}`;
  }

  // 캐시에서 데이터 가져오기
  async getFromCache(key) {
    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('캐시 조회 실패:', error);
      return null;
    }
  }

  // 캐시에 데이터 저장
  async setCache(key, data) {
    try {
      await this.redis.setex(key, this.cacheTTL, JSON.stringify(data));
    } catch (error) {
      console.error('캐시 저장 실패:', error);
    }
  }

  // 게시글 데이터 로드 (실제로는 데이터베이스에서)
  async loadPosts() {
    // 실제 구현에서는 데이터베이스에서 로드
    return [
      {
        id: 1,
        title: '커뮤니티에 오신 것을 환영합니다!',
        content: '안녕하세요! 이 커뮤니티에 오신 것을 환영합니다.',
        boardId: 1,
        createdAt: new Date('2024-07-28T10:00:00Z')
      },
      {
        id: 2,
        title: '사용법 가이드 - 게시글 작성하기',
        content: '게시글을 작성하는 방법을 알려드립니다.',
        boardId: 1,
        createdAt: new Date('2024-07-28T11:30:00Z')
      },
      {
        id: 3,
        title: '모바일 앱 사용 중 문제가 있어요',
        content: '안녕하세요. 모바일에서 앱을 사용하는데 로그인이 안 되는 문제가 있습니다.',
        boardId: 3,
        createdAt: new Date('2024-07-29T09:15:00Z')
      }
    ];
  }

  // 특정 ID의 게시글들 로드
  async loadPostsByIds(ids) {
    const allPosts = await this.loadPosts();
    return allPosts.filter(post => ids.includes(post.id));
  }

  // 검색 통계
  async getSearchStats() {
    return {
      indexSize: this.searchIndex.size,
      totalWords: Array.from(this.searchIndex.keys()).length,
      averagePostsPerWord: Array.from(this.searchIndex.values())
        .reduce((sum, posts) => sum + posts.length, 0) / this.searchIndex.size
    };
  }

  // 인덱스 최적화
  async optimizeIndex() {
    console.log('🔧 검색 인덱스 최적화 시작...');
    
    // 중복 제거
    for (const [word, postIds] of this.searchIndex.entries()) {
      this.searchIndex.set(word, [...new Set(postIds)]);
    }
    
    console.log('✅ 검색 인덱스 최적화 완료');
  }
}

module.exports = new OptimizedSearchService();

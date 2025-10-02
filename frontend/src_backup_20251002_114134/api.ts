export const API_BASE = 'http://localhost:3001/api'

const REQUEST_TIMEOUT_MS = 1500



export interface Board {

  id: string

  title: string

  order: number

  summary?: string

  category?: string | null

  community?: string | null

  community_title?: string | null

  rank?: number

  deleted?: number

  ordering?: number

  format?: string | null

  preview_format?: string | null

}





export type PostPreview =

  | {

    type: 'article'

    tag?: string

    excerpt?: string

  }

  | {

    type: 'discussion'

    mood?: string

    snippet?: string

    highlight?: string

    replies?: number

    lastReplyBy?: string

  }

  | {

    type: 'broadcast'

    streamer: string

    platform: string

    streamUrl: string

    scheduledFor: string

    scheduleLabel?: string | null

    isLive: boolean

    tags?: string[]

    thumbnail?: string | null

  }

  | {

    type: 'gallery'

    images: string[]

    tags?: string[]

    likes?: number

    featuredCosplayer?: string

    palette?: string

  }

  | {

    type: string

    [key: string]: unknown

  }



export interface Post {

  id: string

  board_id: string

  title: string

  content?: string

  author?: string | null

  created_at: string

  updated_at: string

  views: number

  deleted?: boolean

  category?: string | null

  thumb?: string | null

  mediaType?: string | null

  preview?: PostPreview

  stream_url?: string | null

  comments_count?: number

  date?: string | null

}



export interface CommunityBoardSummary {

  id: string

  title: string

  summary?: string

  category?: string | null

  rank?: number

  ordering?: number

  format?: string | null

  preview_format?: string | null

  posts?: Post[]

}



export interface CommunitySummary {

  id: string

  title: string

  description?: string | null

  rank?: number

  totalViews?: number

  boards: CommunityBoardSummary[]

}



export interface SearchResultItem {

  id: string

  board: string

  board_title?: string | null

  board_icon?: string | null

  title: string

  author?: string | null

  category?: string | null

  created_at: string

  updated_at: string

}




export interface SearchResponse {

  ok?: boolean

  query: string

  count: number

  total?: number

  offset?: number

  limit?: number

  items: SearchResultItem[]

}




export interface TrendingItem {

  id: string

  board: string

  title: string

  category?: string | null

  image?: string | null

  author?: string | null

  views: number

  created_at: string

  updated_at: string

  rank: number

  isRising: boolean

}



export interface TrendingResponse {

  items: TrendingItem[]

  periodDays: number

  limit: number

  source?: string

  cache?: boolean

  ttlMs?: number

}



const FALLBACK_BOARDS: Board[] = [

  {

    id: 'news',

    title: 'News Highlights',

    summary: 'Latest patch notes, tournament recaps, and studio updates.',

    category: 'news',

    order: 1,

    format: 'article',

    preview_format: 'article'

  },

  {

    id: 'community',

    title: 'Community Lounge',

    summary: 'Discussion threads and recruitment posts from active players.',

    category: 'community',

    order: 2,

    format: 'discussion',

    preview_format: 'discussion'

  },

  {

    id: 'broadcast',

    title: 'Live Broadcasts',

    summary: 'Watch strategy breakdowns, ranked grinds, and event co-streams.',

    category: 'broadcast',

    order: 3,

    format: 'broadcast',

    preview_format: 'broadcast'

  },

  {

    id: 'cosplay',

    title: 'Cosplay Gallery',

    summary: 'Curated images and build diaries from community creators.',

    category: 'cosplay',

    order: 4,

    format: 'gallery',

    preview_format: 'gallery'

  }

]



const FALLBACK_POST_LIBRARY: Record<string, () => Post[]> = {

  news: () => [

    {

      id: 'news-fallback-1',

      board_id: 'news',

      title: 'Patch 3.2 balance report',

      content: 'Quick breakdown of the most impactful balance changes hitting live this week.',

      author: 'Editorial Desk',

      created_at: '2024-08-22T09:00:00Z',

      updated_at: '2024-08-22T09:00:00Z',

      date: '2024-08-22',

      views: 1840,

      comments_count: 42,

      thumb: 'https://images.unsplash.com/photo-1523966211575-eb4a68a9aa2d?auto=format&fit=crop&w=640&h=360&q=80',

      category: 'news',

      mediaType: 'article',

      preview: {

        type: 'article',

        tag: 'Patch Notes',

        excerpt: 'Patch 3.2 targets burst damage and introduces adjustments to the ranked map pool.'

      }

    },

    {

      id: 'news-fallback-2',

      board_id: 'news',

      title: 'Tournament weekend recap',

      content: 'Highlights from this weekend\'s tournament series with standout plays and draft surprises.',

      author: 'Esports Desk',

      created_at: '2024-08-20T08:30:00Z',

      updated_at: '2024-08-20T08:30:00Z',

      date: '2024-08-20',

      views: 1520,

      comments_count: 31,

      thumb: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=640&h=360&q=80',

      category: 'news',

      mediaType: 'article',

      preview: {

        type: 'article',

        tag: 'Esports',

        excerpt: 'Key takeaways from the semifinal reverse sweep and the meta picks to watch next bracket.'

      }

    }

  ],

  community: () => [

    {

      id: 'community-fallback-1',

      board_id: 'community',

      title: 'Show us your best clutch this week',

      content: 'Drop a short description or clip of your wildest clutch play and celebrate together.',

      author: 'Moderator',

      created_at: '2024-08-21T14:10:00Z',

      updated_at: '2024-08-21T14:10:00Z',

      date: '2024-08-21',

      views: 890,

      comments_count: 58,

      thumb: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=640&h=360&q=80',

      category: 'community',

      mediaType: 'discussion',

      preview: {

        type: 'discussion',

        mood: 'Highlights',

        snippet: 'Share a clip of your best play from the past week.',

        highlight: '"Need support main for tonight\'s clash bracket."',

        replies: 58,

        lastReplyBy: 'ClutchKing'

      }

    },

    {

      id: 'community-fallback-2',

      board_id: 'community',

      title: 'Looking for duo partners this weekend',

      content: 'Post your preferred role and availability to find new teammates for ranked grind.',

      author: 'QueueBuddy',

      created_at: '2024-08-19T10:05:00Z',

      updated_at: '2024-08-19T10:05:00Z',

      date: '2024-08-19',

      views: 640,

      comments_count: 36,

      thumb: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=640&h=360&q=80',

      category: 'community',

      mediaType: 'discussion',

      preview: {

        type: 'discussion',

        mood: 'Recruiting',

        snippet: 'Find teammates for weekend league or community tournaments.',

        highlight: '"Diamond ADC looking for consistent support duo."',

        replies: 36,

        lastReplyBy: 'Supportive'

      }

    }

  ],

  broadcast: () => [

    {

      id: 'broadcast-fallback-1',

      board_id: 'broadcast',

      title: 'Ranked grind with pro shotcaller',

      content: 'Join the live coaching session as MetaCoach queues challenger ranked and breaks down macro calls.',

      author: 'MetaCoach',

      created_at: '2024-08-22T11:00:00Z',

      updated_at: '2024-08-22T11:00:00Z',

      date: '2024-08-22',

      views: 5620,

      comments_count: 68,

      thumb: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=640&h=360&q=80',

      category: 'broadcast',

      mediaType: 'broadcast',

      stream_url: 'https://www.twitch.tv/metacoach',

      preview: {

        type: 'broadcast',

        streamer: 'MetaCoach',

        platform: 'Twitch',

        streamUrl: 'https://www.twitch.tv/metacoach',

        scheduledFor: '2024-08-22T12:00:00Z',

        scheduleLabel: '21:00 KST',

        isLive: false,

        tags: ['Ranked', 'Coaching'],

        thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=640&h=360&q=80'

      }

    },

    {

      id: 'broadcast-fallback-2',

      board_id: 'broadcast',

      title: 'Strategy desk: playoff replay night',

      content: 'Co-streaming the playoff semifinals with pause-and-talk analysis from former coaches.',

      author: 'AnalystDesk',

      created_at: '2024-08-21T18:30:00Z',

      updated_at: '2024-08-21T18:30:00Z',

      date: '2024-08-21',

      views: 4380,

      comments_count: 52,

      thumb: 'https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=640&h=360&q=80',

      category: 'broadcast',

      mediaType: 'broadcast',

      stream_url: 'https://www.youtube.com/@AnalystDesk/live',

      preview: {

        type: 'broadcast',

        streamer: 'AnalystDesk',

        platform: 'YouTube Live',

        streamUrl: 'https://www.youtube.com/@AnalystDesk/live',

        scheduledFor: '2024-08-21T19:00:00Z',

        scheduleLabel: 'Live Now',

        isLive: true,

        tags: ['Watch Party', 'Strategy'],

        thumbnail: 'https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=640&h=360&q=80'

      }

    }

  ],

  cosplay: () => [

    {

      id: 'cosplay-fallback-1',

      board_id: 'cosplay',

      title: 'Arcane-inspired Vi armor build',

      content: 'Step-by-step notes covering foam carving, paint treatments, and weathering for an Arcane Vi costume.',

      author: 'ArcLight',

      created_at: '2024-08-18T07:45:00Z',

      updated_at: '2024-08-18T07:45:00Z',

      date: '2024-08-18',

      views: 1720,

      comments_count: 27,

      thumb: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=640&h=360&q=80',

      category: 'cosplay',

      mediaType: 'gallery',

      preview: {

        type: 'gallery',

        images: [

          'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=420&h=420&q=80',

          'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=420&h=420&q=80',

          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=420&h=420&q=80'

        ],

        tags: ['Cosplay', 'Armor', 'Arcane'],

        likes: 1240,

        featuredCosplayer: 'ArcLight',

        palette: 'Magenta Steel'

      }

    },

    {

      id: 'cosplay-fallback-2',

      board_id: 'cosplay',

      title: 'Elemental showcase photo gallery',

      content: 'Photography set celebrating pyro and hydro character costumes with LED effects.',

      author: 'StudioSeren',

      created_at: '2024-08-16T15:20:00Z',

      updated_at: '2024-08-16T15:20:00Z',

      date: '2024-08-16',

      views: 1560,

      comments_count: 19,

      thumb: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=640&h=360&q=80',

      category: 'cosplay',

      mediaType: 'gallery',

      preview: {

        type: 'gallery',

        images: [

          'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=420&h=420&q=80',

          'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=420&h=420&q=80',

          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=420&h=420&q=80'

        ],

        tags: ['Photography', 'Cosplay', 'Lighting'],

        likes: 980,

        featuredCosplayer: 'StudioSeren',

        palette: 'Crystal Bloom'

      }

    }

  ]

}



const collectFallbackPosts = (): Post[] =>

  Object.values(FALLBACK_POST_LIBRARY).flatMap((factory) => factory())



const resolveFallbackPosts = (boardId: string): Post[] => {

  if (!boardId) {

    return []

  }

  const directFactory = FALLBACK_POST_LIBRARY[boardId]

  if (directFactory) {

    return directFactory()

  }

  const suffix = boardId.split('-').pop() ?? ''

  const fallbackFactory = suffix ? FALLBACK_POST_LIBRARY[suffix] : undefined

  if (!fallbackFactory) {

    return []

  }

  return fallbackFactory().map((post) => ({

    ...post,

    board_id: boardId

  }))

}



const FALLBACK_COMMUNITIES: CommunitySummary[] = [
  {
    id: 'global-community',
    title: 'Community Hub',
    description: 'Sample data to demonstrate news, community chatter, broadcasts, and cosplay galleries.',
    rank: 1,
    totalViews: 18170,
    boards: [
      {
        id: 'global-news',
        title: 'Daily News',
        summary: 'Keep up with live patches and competitive headlines.',
        category: 'news',
        rank: 1,
        ordering: 1,
        format: 'article',
        preview_format: 'article',
        posts: resolveFallbackPosts('global-news')
      },
      {
        id: 'global-community-lounge',
        title: 'Community Lounge',
        summary: 'Find duo partners, highlight reels, and open discussions.',
        category: 'community',
        rank: 2,
        ordering: 2,
        format: 'discussion',
        preview_format: 'discussion',
        posts: resolveFallbackPosts('global-community-lounge')
      },
      {
        id: 'global-broadcast-stage',
        title: 'Broadcast Stage',
        summary: 'Live streams and replay analysis from trusted creators.',
        category: 'broadcast',
        rank: 3,
        ordering: 3,
        format: 'broadcast',
        preview_format: 'broadcast',
        posts: resolveFallbackPosts('global-broadcast-stage')
      },
      {
        id: 'global-cosplay-gallery',
        title: 'Cosplay Gallery',
        summary: 'Curated image threads and build diaries from creators.',
        category: 'cosplay',
        rank: 4,
        ordering: 4,
        format: 'gallery',
        preview_format: 'gallery',
        posts: resolveFallbackPosts('global-cosplay-gallery')
      }
    ]
  }
]





class ApiService {

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {

    const controller = new AbortController()

    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)



    const externalSignal = options?.signal

    if (externalSignal) {

      if (externalSignal.aborted) {

        controller.abort()

      } else {

        externalSignal.addEventListener('abort', () => controller.abort(), { once: true })

      }

    }



    try {

      const response = await fetch(`${API_BASE}${endpoint}`, {

        headers: {

          'Content-Type': 'application/json',

          ...options?.headers

        },

        ...options,

        signal: controller.signal

      })



      if (!response.ok) {

        throw new Error(`API Error: ${response.status}`)

      }



      const text = await response.text()

      return text ? (JSON.parse(text) as T) : (undefined as T)

    } catch (error) {

      if (error instanceof DOMException && error.name === 'AbortError') {

        throw new Error('Request timeout')

      }

      throw error

    } finally {

      clearTimeout(timeoutId)

    }

  }



  async getBoards(): Promise<Board[]> {

    try {

      const response = await this.request<{ success: boolean; data: Board[] }>('/boards')

      if (response && response.success && Array.isArray(response.data)) {

        return response.data.map((board, idx) => ({

          ...board,

          order: typeof board.order === 'number' ? board.order : idx + 1

        }))

      }

      return FALLBACK_BOARDS

    } catch (error) {

      console.warn('Failed to fetch boards, using fallback data:', error)

      return FALLBACK_BOARDS

    }

  }



  async getCommunities(): Promise<CommunitySummary[]> {

    try {

      const response = await this.request<{ success: boolean, data: CommunitySummary[] }>('/communities');
      return response.data || FALLBACK_COMMUNITIES;

    } catch (error) {

      console.warn('Failed to fetch communities, using fallback data:', error)

      return FALLBACK_COMMUNITIES

    }

  }



  async getPosts(boardId: string, params?: Record<string, string | undefined>): Promise<Post[]> {

    try {
      // Try to fetch from backend first
      const backendResponse = await this.request<{ success: boolean, data: Post[] }>(`/boards/${boardId}/posts`);
      if (backendResponse.data) {
        return backendResponse.data;
      }

      const searchParams = new URLSearchParams()

      if (params) {

        Object.entries(params).forEach(([key, value]) => {

          if (value) {

            searchParams.set(key, value)

          }

        })

      }

      const suffix = searchParams.toString()

      const endpoint = suffix ? `/boards/${boardId}/posts?${suffix}` : `/boards/${boardId}/posts`

      const apiResponse = await this.request<{ success: boolean; data: { posts: Post[] } }>(endpoint)

      if (apiResponse && apiResponse.success && apiResponse.data && Array.isArray(apiResponse.data.posts)) {

        return apiResponse.data.posts

      }

      return resolveFallbackPosts(boardId)

    } catch (error) {

      console.warn('Failed to fetch posts, using fallback data:', error)

      return resolveFallbackPosts(boardId)

    }

  }



  async getPost(postId: string): Promise<Post> {

    try {

      const response = await this.request<{ success: boolean; data: Post }>(`/posts/${postId}`)

      if (response && response.success && response.data) {

        return response.data

      }

      throw new Error('Post not found')

    } catch (error) {

      console.warn('Failed to fetch post, using fallback data:', error)

      const allPosts = collectFallbackPosts()

      const post = allPosts.find((candidate) => candidate.id === postId)

      if (!post) {

        throw new Error('Post not found')

      }

      return post

    }

  }



  async searchPosts(query: string, limit = 20, offset = 0): Promise<SearchResponse> {

    const params = new URLSearchParams()

    params.set('q', query)

    params.set('limit', String(limit))

    params.set('offset', String(offset))



    try {

      return await this.request<SearchResponse>(`/search?${params.toString()}`)

    } catch (error) {

      console.warn('Search request failed:', error)

      return { ok: false, query, count: 0, total: 0, offset, limit, items: [] }

    }

  }



  async getTrending(limit = 5, periodDays = 7): Promise<TrendingResponse> {

    try {
      const response = await this.request<{ success: boolean, data: TrendingResponse }>('/trending');
      return response.data || { items: [] };
    } catch (error) {
      console.warn('Failed to fetch trending data:', error)
      return { items: [] }
    }
  }

  async getTrendingOld(limit = 5, periodDays = 7): Promise<TrendingResponse> {

    const params = new URLSearchParams()

    params.set('limit', String(limit))

    params.set('period', `${periodDays}d`)



    try {

      return await this.request<TrendingResponse>(`/trending?${params.toString()}`)

    } catch (error) {

      console.warn('Failed to fetch trending, falling back to local data:', error)

      const fallbackItems = collectFallbackPosts()

        .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))

        .slice(0, limit)

        .map((post, index) => ({

          id: post.id,

          board: post.board_id,

          title: post.title,

          category: post.category ?? null,

          image: post.thumb ?? null,

          author: post.author ?? null,

          views: post.views,

          created_at: post.created_at,

          updated_at: post.updated_at,

          rank: index + 1,

          isRising: index < 2

        }))

      return { items: fallbackItems, periodDays, limit }

    }

  }



  async createPost(boardId: string, post: Partial<Post>): Promise<Post> {

    return this.request<Post>(`/boards/${boardId}/posts`, {

      method: 'POST',

      body: JSON.stringify(post)

    })

  }



  async updatePost(boardId: string, postId: string, post: Partial<Post>): Promise<Post> {

    return this.request<Post>(`/boards/${boardId}/posts/${postId}`, {

      method: 'PATCH',

      body: JSON.stringify(post)

    })

  }



  async deletePost(boardId: string, postId: string): Promise<void> {

    await this.request<void>(`/boards/${boardId}/posts/${postId}`, {

      method: 'DELETE'

    })

  }



  async incrementViews(postId: string): Promise<void> {

    await this.request<void>(`/posts/${postId}/view`, {

      method: 'POST'

    })

  }



  // Broadcast API methods
  async getBroadcasts(): Promise<Broadcast[]> {

    return this.request<Broadcast[]>('/broadcasts')

  }



  async getBroadcast(postId: string): Promise<Broadcast | null> {

    try {

      return await this.request<Broadcast>(`/broadcasts/${postId}`)

    } catch (error) {

      console.warn('Failed to fetch broadcast:', error)

      return null

    }

  }



  async createBroadcast(broadcast: Omit<Broadcast, 'id' | 'created_at' | 'updated_at'>): Promise<Broadcast> {

    return this.request<Broadcast>('/broadcasts', {

      method: 'POST',

      body: JSON.stringify(broadcast)

    })

  }



  async updateBroadcast(postId: string, broadcast: Partial<Omit<Broadcast, 'id' | 'post_id' | 'created_at' | 'updated_at'>>): Promise<Broadcast> {

    return this.request<Broadcast>(`/broadcasts/${postId}`, {

      method: 'PATCH',

      body: JSON.stringify(broadcast)

    })

  }



  async deleteBroadcast(postId: string): Promise<void> {

    await this.request<void>(`/broadcasts/${postId}`, {

      method: 'DELETE'

    })

  }



  async getSpoiler(postId: string): Promise<{ hasSpoiler: boolean }> {

    return this.request<{ hasSpoiler: boolean }>(`/posts/${postId}/spoiler`)

  }

}



export const apiService = new ApiService()

export interface Broadcast {
  id: number
  post_id: string
  stream_url: string
  is_live: boolean
  schedule?: string | null
  platform: string
  streamer: string
  created_at: string
  updated_at: string
}

// Comment API functions
export interface Comment {
  id: string;
  postId: string;
  parentId?: string;
  authorId: number;
  authorName: string;
  content: string;
  depth: number;
  path: string;
  likes: number;
  dislikes: number;
  replies: number;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  children: Comment[];
  metadata?: any;
}

export const getComments = async (postId: string, page: number = 1, limit: number = 50, sort: string = 'newest'): Promise<{ comments: Comment[]; total: number; page: number; limit: number }> => {
  try {
    const response = await fetch(`${API_BASE}/comments/posts/${postId}?page=${page}&limit=${limit}&sort=${sort}`);
    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to fetch comments');
    }
  } catch (error) {
    console.error('Error fetching comments:', error);
    return { comments: [], total: 0, page, limit };
  }
};

export const createComment = async (postId: string, content: string, parentId?: string, authorId: number = 1, authorName: string = '사용자'): Promise<Comment> => {
  try {
    const response = await fetch(`${API_BASE}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        postId,
        parentId,
        authorId,
        authorName,
        content
      }),
    });

    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to create comment');
    }
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
};

export const updateComment = async (commentId: string, content: string, authorId: number = 1): Promise<Comment> => {
  try {
    const response = await fetch(`${API_BASE}/comments/${commentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        authorId
      }),
    });

    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to update comment');
    }
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
};

export const deleteComment = async (commentId: string, authorId: number = 1): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        authorId
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to delete comment');
    }
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

// Comment Reaction API functions
export interface CommentReactionStats {
  total: number;
  reactions: {
    [key: string]: number;
  };
}

export const toggleCommentReaction = async (commentId: string, reactionType: string, emoji?: string, userId?: number): Promise<{ action: string; reaction: any; stats: CommentReactionStats }> => {
  try {
    const response = await fetch(`${API_BASE}/comment-reactions/${commentId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reactionType,
        emoji,
        userId
      }),
    });

    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to toggle reaction');
    }
  } catch (error) {
    console.error('Error toggling reaction:', error);
    throw error;
  }
};

export const getCommentReactionStats = async (commentId: string): Promise<CommentReactionStats> => {
  try {
    const response = await fetch(`${API_BASE}/comment-reactions/${commentId}/stats`);
    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to fetch reaction stats');
    }
  } catch (error) {
    console.error('Error fetching reaction stats:', error);
    return { total: 0, reactions: {} };
  }
};

export const getUserReactions = async (commentId: string, userId?: number): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE}/comment-reactions/${commentId}/user-reactions?userId=${userId || ''}`);
    const data = await response.json();

    if (data.success) {
      return data.data.map((r: any) => r.type);
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error fetching user reactions:', error);
    return [];
  }
};

// Read Status API functions
export interface ReadStatus {
  id: string;
  postId: string;
  boardId: string;
  communityId?: string;
  readAt: string;
  readDuration?: number;
  isFullyRead: boolean;
  scrollPosition?: number;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  isAnonymous: boolean;
}

export interface ReadStatusStats {
  totalRead: number;
  fullyRead: number;
  avgReadDuration: number;
  lastReadAt: string | null;
}

export const updateReadStatus = async (
  postId: string,
  boardId: string,
  communityId?: string,
  userId?: number,
  readDuration?: number,
  scrollPosition?: number,
  deviceType?: 'desktop' | 'mobile' | 'tablet'
): Promise<ReadStatus> => {
  try {
    const response = await fetch(`${API_BASE}/read-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        postId,
        boardId,
        communityId,
        userId,
        readDuration,
        scrollPosition,
        deviceType
      }),
    });
    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to update read status');
    }
  } catch (error) {
    console.error('Error updating read status:', error);
    throw error;
  }
};

export const getUserReadStatus = async (userId?: number, ipAddress?: string): Promise<ReadStatus[]> => {
  try {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId.toString());
    if (ipAddress) params.append('ipAddress', ipAddress);

    const response = await fetch(`${API_BASE}/read-status/user?${params}`);
    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to get user read status');
    }
  } catch (error) {
    console.error('Error getting user read status:', error);
    throw error;
  }
};

export const getPostReadStatus = async (postId: string, userId?: number, ipAddress?: string): Promise<ReadStatus | null> => {
  try {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId.toString());
    if (ipAddress) params.append('ipAddress', ipAddress);

    const response = await fetch(`${API_BASE}/read-status/post/${postId}?${params}`);
    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to get post read status');
    }
  } catch (error) {
    console.error('Error getting post read status:', error);
    throw error;
  }
};

export const getUnreadPosts = async (
  boardId: string,
  communityId?: string,
  userId?: number,
  ipAddress?: string,
  limit: number = 20
): Promise<{ posts: Post[]; total: number; limit: number }> => {
  try {
    const params = new URLSearchParams();
    params.append('boardId', boardId);
    if (communityId) params.append('communityId', communityId);
    if (userId) params.append('userId', userId.toString());
    if (ipAddress) params.append('ipAddress', ipAddress);
    params.append('limit', limit.toString());

    const response = await fetch(`${API_BASE}/read-status/unread?${params}`);
    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to get unread posts');
    }
  } catch (error) {
    console.error('Error getting unread posts:', error);
    throw error;
  }
};

export const getReadStats = async (boardId?: string, communityId?: string, userId?: number): Promise<ReadStatusStats> => {
  try {
    const params = new URLSearchParams();
    if (boardId) params.append('boardId', boardId);
    if (communityId) params.append('communityId', communityId);
    if (userId) params.append('userId', userId.toString());

    const response = await fetch(`${API_BASE}/read-status/stats?${params}`);
    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to get read stats');
    }
  } catch (error) {
    console.error('Error getting read stats:', error);
    throw error;
  }
};

export const deleteReadStatus = async (postId: string, userId?: number, ipAddress?: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/read-status/${postId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, ipAddress }),
    });
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to delete read status');
    }
  } catch (error) {
    console.error('Error deleting read status:', error);
    throw error;
  }
};

// Comment History API functions
export interface CommentHistoryItem {
  id: string;
  commentId: string;
  version: number;
  content: string;
  previousContent?: string;
  changeType: 'create' | 'edit' | 'delete' | 'restore';
  changeReason?: string;
  editedBy?: number;
  editedByName?: string;
  createdAt: string;
  metadata?: any;
}

export interface CommentHistoryStats {
  totalEdits: number;
  editCount: number;
  deleteCount: number;
  restoreCount: number;
  lastEditAt: string | null;
}

// Comment Report API functions
export interface CommentReport {
  id: string;
  commentId: string;
  reporterId?: number;
  reporterName?: string;
  reportType: string;
  reason: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isAnonymous: boolean;
  adminNotes?: string;
  resolvedBy?: number;
  resolvedAt?: string;
  actionTaken?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  comment?: {
    id: string;
    content: string;
    authorName: string;
    createdAt: string;
  };
  reporter?: {
    id: number;
    username: string;
    email: string;
  };
  resolver?: {
    id: number;
    username: string;
  };
}

export interface CommentReportStats {
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  stats: Array<{
    status: string;
    reportType: string;
    priority: string;
    count: number;
  }>;
}

export const createCommentHistory = async (
  commentId: string,
  content: string,
  previousContent: string | null,
  changeType: 'create' | 'edit' | 'delete' | 'restore',
  editedBy?: number,
  editedByName?: string,
  changeReason?: string,
  metadata?: any
): Promise<CommentHistoryItem> => {
  try {
    const response = await fetch(`${API_BASE}/comment-history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        commentId,
        content,
        previousContent,
        changeType,
        editedBy,
        editedByName,
        changeReason,
        metadata
      }),
    });
    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to create comment history');
    }
  } catch (error) {
    console.error('Error creating comment history:', error);
    throw error;
  }
};

export const getCommentHistory = async (commentId: string, includeDeleted: boolean = false): Promise<CommentHistoryItem[]> => {
  try {
    const params = new URLSearchParams();
    if (includeDeleted) params.append('includeDeleted', 'true');

    const response = await fetch(`${API_BASE}/comment-history/comment/${commentId}?${params}`);
    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to get comment history');
    }
  } catch (error) {
    console.error('Error getting comment history:', error);
    throw error;
  }
};

export const getCommentVersion = async (commentId: string, version: number): Promise<CommentHistoryItem | null> => {
  try {
    const response = await fetch(`${API_BASE}/comment-history/comment/${commentId}/version/${version}`);
    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to get comment version');
    }
  } catch (error) {
    console.error('Error getting comment version:', error);
    throw error;
  }
};

export const getCommentHistoryStats = async (commentId?: string, editedBy?: number): Promise<CommentHistoryStats> => {
  try {
    const params = new URLSearchParams();
    if (commentId) params.append('commentId', commentId);
    if (editedBy) params.append('editedBy', editedBy.toString());

    const response = await fetch(`${API_BASE}/comment-history/stats?${params}`);
    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to get comment history stats');
    }
  } catch (error) {
    console.error('Error getting comment history stats:', error);
    throw error;
  }
};

export const compareCommentVersions = async (commentId: string, version1: number, version2: number): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE}/comment-history/compare/${commentId}?version1=${version1}&version2=${version2}`);
    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to compare comment versions');
    }
  } catch (error) {
    console.error('Error comparing comment versions:', error);
    throw error;
  }
};

export const restoreCommentVersion = async (
  commentId: string,
  version: number,
  editedBy?: number,
  editedByName?: string,
  changeReason?: string
): Promise<{ comment: any; history: CommentHistoryItem }> => {
  try {
    const response = await fetch(`${API_BASE}/comment-history/restore/${commentId}/${version}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        editedBy,
        editedByName,
        changeReason
      }),
    });
    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to restore comment version');
    }
  } catch (error) {
    console.error('Error restoring comment version:', error);
    throw error;
  }
};

export const searchCommentHistory = async (params: {
  commentId?: string;
  editedBy?: number;
  changeType?: string;
  startDate?: string;
  endDate?: string;
  searchContent?: string;
  page?: number;
  limit?: number;
}): Promise<{
  history: CommentHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  try {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE}/comment-history/search?${searchParams}`);
    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to search comment history');
    }
  } catch (error) {
    console.error('Error searching comment history:', error);
    throw error;
  }
};

export const deleteCommentHistory = async (commentId: string, version?: number): Promise<void> => {
  try {
    const params = new URLSearchParams();
    if (version) params.append('version', version.toString());

    const response = await fetch(`${API_BASE}/comment-history/comment/${commentId}?${params}`, {
      method: 'DELETE',
    });
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to delete comment history');
    }
  } catch (error) {
    console.error('Error deleting comment history:', error);
    throw error;
  }
};

// Comment Report API functions
export const createCommentReport = async (
  commentId: string,
  reportType: string,
  reason: string,
  isAnonymous: boolean = false,
  reporterName?: string
): Promise<{ reportId: string; message: string }> => {
  const response = await fetch(`${API_BASE}/comment-reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      commentId,
      reportType,
      reason,
      isAnonymous,
      reporterName
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create comment report');
  }

  return response.json();
};

export const getCommentReports = async (
  page: number = 1,
  limit: number = 20,
  status?: string,
  reportType?: string,
  priority?: string,
  sortBy: string = 'created_at',
  sortOrder: string = 'DESC'
): Promise<{
  reports: CommentReport[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
    sortOrder,
  });

  if (status) params.append('status', status);
  if (reportType) params.append('reportType', reportType);
  if (priority) params.append('priority', priority);

  const response = await fetch(`${API_BASE}/comment-reports?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch comment reports');
  }

  return response.json();
};

export const getCommentReport = async (reportId: string): Promise<{ report: CommentReport }> => {
  const response = await fetch(`${API_BASE}/comment-reports/${reportId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch comment report');
  }

  return response.json();
};

export const resolveCommentReport = async (
  reportId: string,
  status: string,
  actionTaken?: string,
  adminNotes?: string,
  priority?: string
): Promise<{ message: string; report: CommentReport }> => {
  const response = await fetch(`${API_BASE}/comment-reports/${reportId}/resolve`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status,
      actionTaken,
      adminNotes,
      priority
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to resolve comment report');
  }

  return response.json();
};

export const getCommentReportStats = async (): Promise<CommentReportStats> => {
  const response = await fetch(`${API_BASE}/comment-reports/stats/overview`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch comment report stats');
  }

  return response.json();
};

export const getCommentReportsByComment = async (commentId: string): Promise<{ reports: CommentReport[] }> => {
  const response = await fetch(`${API_BASE}/comment-reports/comment/${commentId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch comment reports');
  }

  return response.json();
};

export const deleteCommentReport = async (reportId: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/comment-reports/${reportId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete comment report');
  }
};


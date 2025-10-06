# 인터랙티브 문서 시스템

## 📋 개요
Community Platform v1.3의 인터랙티브 문서 시스템입니다. 사용자가 문서를 읽으면서 직접 체험하고 학습할 수 있는 기능을 제공합니다.

## 🎯 인터랙티브 기능

### 라이브 코드 에디터
```typescript
interface LiveCodeEditorProps {
  language: 'typescript' | 'javascript' | 'python' | 'sql' | 'css' | 'html';
  initialCode: string;
  executable?: boolean;
  showOutput?: boolean;
  showConsole?: boolean;
  theme?: 'light' | 'dark';
  fontSize?: number;
  readOnly?: boolean;
}

// 사용 예시 - 채팅 시스템 코드
const chatSystemCode = `
import React, { useState, useEffect } from 'react';
import { WebSocket } from 'ws';

const ChatSystem: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  
  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:5000');
    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages(prev => [...prev, message]);
    };
    setWs(websocket);
    
    return () => websocket.close();
  }, []);
  
  const sendMessage = (content: string) => {
    if (ws) {
      ws.send(JSON.stringify({ content, timestamp: Date.now() }));
    }
  };
  
  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className="message">
            {msg.content}
          </div>
        ))}
      </div>
      <input 
        onKeyPress={(e) => e.key === 'Enter' && sendMessage(e.target.value)}
        placeholder="메시지를 입력하세요..."
      />
    </div>
  );
};

export default ChatSystem;
`;

<LiveCodeEditor
  language="typescript"
  initialCode={chatSystemCode}
  executable={true}
  showOutput={true}
  showConsole={true}
  theme="dark"
  fontSize={14}
  readOnly={false}
/>
```

### 인터랙티브 튜토리얼
```typescript
interface InteractiveTutorialProps {
  steps: TutorialStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete: () => void;
  showProgress?: boolean;
  allowSkip?: boolean;
}

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  action?: TutorialAction;
  validation?: (input: any) => boolean;
}

interface TutorialAction {
  type: 'click' | 'type' | 'drag' | 'select';
  target: string;
  expectedValue?: any;
}

// 사용 예시 - 채팅 시스템 튜토리얼
const chatTutorialSteps: TutorialStep[] = [
  {
    id: 'step1',
    title: '채팅방 입장하기',
    description: '채팅방 목록에서 원하는 방을 클릭해보세요.',
    content: <ChatRoomList />,
    action: { type: 'click', target: '.chat-room-item' }
  },
  {
    id: 'step2',
    title: '메시지 전송하기',
    description: '메시지 입력창에 텍스트를 입력하고 Enter를 눌러보세요.',
    content: <MessageInput />,
    action: { type: 'type', target: '.message-input', expectedValue: '안녕하세요!' }
  },
  {
    id: 'step3',
    title: '파일 공유하기',
    description: '파일 아이콘을 클릭하여 이미지를 업로드해보세요.',
    content: <FileUpload />,
    action: { type: 'click', target: '.file-upload-button' }
  }
];

<InteractiveTutorial
  steps={chatTutorialSteps}
  currentStep={0}
  onStepChange={(step) => console.log('Step changed to:', step)}
  onComplete={() => console.log('Tutorial completed!')}
  showProgress={true}
  allowSkip={true}
/>
```

### 실시간 프리뷰
```typescript
interface LivePreviewProps {
  code: string;
  language: 'html' | 'css' | 'javascript' | 'typescript';
  autoUpdate?: boolean;
  updateDelay?: number;
  showCode?: boolean;
  showPreview?: boolean;
  splitView?: boolean;
}

// 사용 예시 - UI 컴포넌트 프리뷰
const buttonComponentCode = `
import React from 'react';
import { Button } from '@mui/material';

const CustomButton: React.FC = () => {
  return (
    <Button 
      variant="contained" 
      color="primary"
      onClick={() => alert('버튼이 클릭되었습니다!')}
    >
      클릭하세요
    </Button>
  );
};

export default CustomButton;
`;

<LivePreview
  code={buttonComponentCode}
  language="typescript"
  autoUpdate={true}
  updateDelay={500}
  showCode={true}
  showPreview={true}
  splitView={true}
/>
```

## 🎮 게임화 요소

### 진행률 표시
```typescript
interface ProgressTrackerProps {
  totalSteps: number;
  completedSteps: number;
  currentStep: number;
  showPercentage?: boolean;
  showSteps?: boolean;
  animated?: boolean;
  color?: string;
}

// 사용 예시
<ProgressTracker
  totalSteps={10}
  completedSteps={3}
  currentStep={4}
  showPercentage={true}
  showSteps={true}
  animated={true}
  color="#2196f3"
/>
```

### 배지 시스템
```typescript
interface BadgeSystemProps {
  badges: Badge[];
  earnedBadges: string[];
  onBadgeEarned?: (badge: Badge) => void;
  showProgress?: boolean;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  requirement: BadgeRequirement;
  progress?: number;
}

interface BadgeRequirement {
  type: 'steps' | 'time' | 'action' | 'custom';
  target: number;
  current: number;
}

// 사용 예시
const documentationBadges: Badge[] = [
  {
    id: 'first-read',
    name: '첫 읽기',
    description: '첫 번째 문서를 읽었습니다',
    icon: '📖',
    color: '#4caf50',
    requirement: { type: 'steps', target: 1, current: 0 }
  },
  {
    id: 'code-master',
    name: '코드 마스터',
    description: '10개의 코드 예제를 실행했습니다',
    icon: '💻',
    color: '#2196f3',
    requirement: { type: 'action', target: 10, current: 0 }
  },
  {
    id: 'tutorial-complete',
    name: '튜토리얼 완료',
    description: '모든 튜토리얼을 완료했습니다',
    icon: '🎓',
    color: '#ff9800',
    requirement: { type: 'steps', target: 5, current: 0 }
  }
];

<BadgeSystem
  badges={documentationBadges}
  earnedBadges={['first-read']}
  onBadgeEarned={(badge) => console.log('Badge earned:', badge.name)}
  showProgress={true}
/>
```

### 퀴즈 시스템
```typescript
interface QuizSystemProps {
  questions: QuizQuestion[];
  currentQuestion: number;
  onAnswer: (questionId: string, answer: any) => void;
  onComplete: (score: number) => void;
  showHint?: boolean;
  allowRetry?: boolean;
  timeLimit?: number;
}

interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'code' | 'drag-drop';
  options?: string[];
  correctAnswer: any;
  explanation?: string;
  hint?: string;
  code?: string;
}

// 사용 예시 - 채팅 시스템 퀴즈
const chatSystemQuiz: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'WebSocket 연결을 위한 프로토콜은 무엇인가요?',
    type: 'multiple-choice',
    options: ['HTTP', 'WebSocket', 'FTP', 'SMTP'],
    correctAnswer: 'WebSocket',
    explanation: 'WebSocket은 실시간 양방향 통신을 위한 프로토콜입니다.'
  },
  {
    id: 'q2',
    question: '다음 코드에서 메시지를 전송하는 함수는 무엇인가요?',
    type: 'code',
    code: `
const sendMessage = (content: string) => {
  if (ws) {
    ws.send(JSON.stringify({ content, timestamp: Date.now() }));
  }
};
    `,
    correctAnswer: 'sendMessage',
    explanation: 'sendMessage 함수가 WebSocket을 통해 메시지를 전송합니다.'
  }
];

<QuizSystem
  questions={chatSystemQuiz}
  currentQuestion={0}
  onAnswer={(questionId, answer) => console.log('Answer:', questionId, answer)}
  onComplete={(score) => console.log('Quiz completed with score:', score)}
  showHint={true}
  allowRetry={true}
  timeLimit={300}
/>
```

## 🔍 스마트 검색

### 시맨틱 검색
```typescript
interface SemanticSearchProps {
  documents: Document[];
  query: string;
  onResults: (results: SearchResult[]) => void;
  filters?: SearchFilter[];
  highlightMatches?: boolean;
  showSuggestions?: boolean;
}

interface Document {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  lastModified: Date;
}

interface SearchResult {
  document: Document;
  relevanceScore: number;
  matchedSnippets: string[];
  highlightedContent: string;
}

// 사용 예시
const documentationDocuments: Document[] = [
  {
    id: 'chat-system',
    title: '실시간 채팅 시스템',
    content: 'WebSocket을 사용한 실시간 채팅 시스템 구현 방법...',
    tags: ['websocket', 'realtime', 'chat'],
    category: 'features',
    lastModified: new Date('2024-10-01')
  },
  {
    id: 'security-system',
    title: '보안 시스템',
    content: 'AES-256-GCM 암호화를 사용한 보안 시스템...',
    tags: ['security', 'encryption', 'aes'],
    category: 'security',
    lastModified: new Date('2024-10-02')
  }
];

<SemanticSearch
  documents={documentationDocuments}
  query="실시간 통신"
  onResults={(results) => console.log('Search results:', results)}
  filters={[
    { key: 'category', label: '카테고리', options: ['features', 'security', 'performance'] },
    { key: 'tags', label: '태그', options: ['websocket', 'security', 'performance'] }
  ]}
  highlightMatches={true}
  showSuggestions={true}
/>
```

### AI 기반 추천
```typescript
interface AIRecommendationProps {
  currentDocument: string;
  userHistory: string[];
  onRecommend: (recommendations: Recommendation[]) => void;
  maxRecommendations?: number;
  includeRelated?: boolean;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  relevanceScore: number;
  reason: string;
  type: 'document' | 'tutorial' | 'example' | 'related';
}

// 사용 예시
<AIRecommendation
  currentDocument="chat-system"
  userHistory={['websocket', 'realtime', 'security']}
  onRecommend={(recommendations) => console.log('Recommendations:', recommendations)}
  maxRecommendations={5}
  includeRelated={true}
/>
```

## 📊 분석 및 인사이트

### 사용자 행동 분석
```typescript
interface UserBehaviorAnalyticsProps {
  userId: string;
  sessionData: SessionData[];
  onInsight: (insight: UserInsight) => void;
  showVisualization?: boolean;
  exportable?: boolean;
}

interface SessionData {
  timestamp: Date;
  action: string;
  document: string;
  duration: number;
  success: boolean;
}

interface UserInsight {
  type: 'learning-pattern' | 'difficulty-area' | 'progress-trend' | 'recommendation';
  title: string;
  description: string;
  data: any;
  actionable: boolean;
}

// 사용 예시
<UserBehaviorAnalytics
  userId="user123"
  sessionData={userSessionData}
  onInsight={(insight) => console.log('User insight:', insight)}
  showVisualization={true}
  exportable={true}
/>
```

### 문서 효과성 분석
```typescript
interface DocumentEffectivenessProps {
  documents: Document[];
  metrics: DocumentMetrics[];
  onAnalysis: (analysis: DocumentAnalysis) => void;
  showComparison?: boolean;
  showTrends?: boolean;
}

interface DocumentMetrics {
  documentId: string;
  views: number;
  completionRate: number;
  averageTime: number;
  userSatisfaction: number;
  lastUpdated: Date;
}

interface DocumentAnalysis {
  documentId: string;
  effectivenessScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  trend: 'improving' | 'stable' | 'declining';
}

// 사용 예시
<DocumentEffectiveness
  documents={allDocuments}
  metrics={documentMetrics}
  onAnalysis={(analysis) => console.log('Document analysis:', analysis)}
  showComparison={true}
  showTrends={true}
/>
```

## 🎨 커스터마이징

### 개인화 설정
```typescript
interface PersonalizationSettingsProps {
  userId: string;
  preferences: UserPreferences;
  onUpdate: (preferences: UserPreferences) => void;
  showPreview?: boolean;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  language: 'ko' | 'en' | 'ja';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  learningStyle: 'visual' | 'textual' | 'interactive';
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
}

// 사용 예시
<PersonalizationSettings
  userId="user123"
  preferences={userPreferences}
  onUpdate={(preferences) => console.log('Preferences updated:', preferences)}
  showPreview={true}
/>
```

### 테마 커스터마이징
```typescript
interface ThemeCustomizationProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  showPreview?: boolean;
  allowExport?: boolean;
}

interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    accent: string;
  };
  fonts: {
    family: string;
    sizes: { small: string; medium: string; large: string };
  };
  spacing: { small: number; medium: number; large: number };
  borderRadius: number;
  shadows: string[];
}

// 사용 예시
<ThemeCustomization
  currentTheme={currentTheme}
  onThemeChange={(theme) => console.log('Theme changed:', theme)}
  showPreview={true}
  allowExport={true}
/>
```

## 📱 모바일 최적화

### 터치 제스처
```typescript
interface TouchGesturesProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onPinch?: (scale: number) => void;
  onTap?: (position: { x: number; y: number }) => void;
  onLongPress?: (position: { x: number; y: number }) => void;
  sensitivity?: number;
}

// 사용 예시
<TouchGestures
  onSwipeLeft={() => console.log('Swipe left - previous page')}
  onSwipeRight={() => console.log('Swipe right - next page')}
  onPinch={(scale) => console.log('Pinch zoom:', scale)}
  onTap={(position) => console.log('Tap at:', position)}
  onLongPress={(position) => console.log('Long press at:', position)}
  sensitivity={0.8}
/>
```

### 모바일 네비게이션
```typescript
interface MobileNavigationProps {
  sections: NavigationSection[];
  currentSection: string;
  onSectionChange: (section: string) => void;
  showProgress?: boolean;
  sticky?: boolean;
}

interface NavigationSection {
  id: string;
  title: string;
  icon: string;
  order: number;
  completed?: boolean;
}

// 사용 예시
<MobileNavigation
  sections={documentSections}
  currentSection="chat-system"
  onSectionChange={(section) => console.log('Section changed to:', section)}
  showProgress={true}
  sticky={true}
/>
```

## 🔧 성능 최적화

### 지연 로딩
```typescript
interface LazyLoadingProps {
  children: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  fallback?: React.ReactNode;
  onLoad?: () => void;
}

// 사용 예시
<LazyLoading
  threshold={0.1}
  rootMargin="50px"
  fallback={<div>로딩 중...</div>}
  onLoad={() => console.log('Content loaded')}
>
  <HeavyVisualization />
</LazyLoading>
```

### 캐싱 시스템
```typescript
interface CachingSystemProps {
  cacheKey: string;
  data: any;
  ttl?: number; // Time to live in seconds
  onCacheHit?: (data: any) => void;
  onCacheMiss?: () => void;
}

// 사용 예시
<CachingSystem
  cacheKey="document-content-chat-system"
  data={documentContent}
  ttl={3600} // 1 hour
  onCacheHit={(data) => console.log('Cache hit:', data)}
  onCacheMiss={() => console.log('Cache miss')}
/>
```

## 📋 체크리스트

### 인터랙티브 기능
- [ ] 라이브 코드 에디터 구현
- [ ] 인터랙티브 튜토리얼 완성
- [ ] 실시간 프리뷰 기능
- [ ] 퀴즈 시스템 구현
- [ ] 진행률 추적 시스템

### 사용자 경험
- [ ] 직관적인 인터페이스
- [ ] 모바일 최적화
- [ ] 접근성 준수
- [ ] 개인화 설정
- [ ] 성능 최적화

### 분석 및 인사이트
- [ ] 사용자 행동 분석
- [ ] 문서 효과성 측정
- [ ] AI 기반 추천
- [ ] 시맨틱 검색
- [ ] 데이터 시각화

---

**인터랙티브 문서 시스템 v1.3** - 2024년 10월 최신 버전

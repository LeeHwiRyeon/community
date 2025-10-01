# 한글 개발 가이드 및 코드 스탠다드

## 🎯 목표
한글 개발 시에도 모듈식 구조와 컴포넌트 관리가 깨지지 않도록 **엄격한 가이드라인**을 수립하고, **AI 코드 검증 시스템**을 구축합니다.

## 🚨 한글 개발 시 주요 문제점

### 1. 모듈식 구조 파괴
- 한글 주석으로 인한 인코딩 문제
- 파일명 한글 사용으로 인한 경로 문제
- 한글 변수명으로 인한 가독성 저하

### 2. 컴포넌트 관리 문제
- 한글 props로 인한 타입 안정성 저하
- 한글 상태명으로 인한 디버깅 어려움
- 한글 API 응답으로 인한 파싱 오류

### 3. 버그 발생 원인
- 인코딩 불일치 (UTF-8 vs EUC-KR)
- 한글 정규식 패턴 오류
- 한글 문자열 길이 계산 오류

## 📋 개발 가이드라인

### 1. 파일명 규칙
```bash
# ✅ 올바른 예시
components/UserProfile.tsx
hooks/useUserAuth.ts
utils/dateFormatter.ts
services/apiClient.ts

# ❌ 잘못된 예시
components/사용자프로필.tsx
hooks/사용자인증훅.ts
utils/날짜포맷터.ts
services/API클라이언트.ts
```

### 2. 변수명 규칙
```typescript
// ✅ 올바른 예시
const userProfile = { name: '홍길동', age: 30 }
const isAuthenticated = true
const userList = []
const handleUserClick = () => {}

// ❌ 잘못된 예시
const 사용자프로필 = { 이름: '홍길동', 나이: 30 }
const 인증됨 = true
const 사용자목록 = []
const 사용자클릭처리 = () => {}
```

### 3. 컴포넌트 구조 규칙
```typescript
// ✅ 올바른 예시
interface UserProfileProps {
  userId: string
  userName: string
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

const UserProfile: React.FC<UserProfileProps> = ({
  userId,
  userName,
  onEdit,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false)
  
  const handleEdit = useCallback(() => {
    setIsEditing(true)
    onEdit(userId)
  }, [userId, onEdit])
  
  return (
    <div className="user-profile">
      <h3>{userName}</h3>
      <button onClick={handleEdit}>편집</button>
      <button onClick={() => onDelete(userId)}>삭제</button>
    </div>
  )
}

// ❌ 잘못된 예시
interface 사용자프로필속성 {
  사용자ID: string
  사용자이름: string
  편집함수: (id: string) => void
  삭제함수: (id: string) => void
}
```

### 4. API 응답 처리 규칙
```typescript
// ✅ 올바른 예시
interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
  error?: string
}

interface UserData {
  id: string
  name: string
  email: string
  createdAt: string
}

const fetchUser = async (userId: string): Promise<ApiResponse<UserData>> => {
  try {
    const response = await fetch(`/api/users/${userId}`)
    const result: ApiResponse<UserData> = await response.json()
    return result
  } catch (error) {
    return {
      success: false,
      data: {} as UserData,
      message: '사용자 정보를 가져오는데 실패했습니다.',
      error: error.message
    }
  }
}

// ❌ 잘못된 예시
const 사용자가져오기 = async (사용자ID: string) => {
  // 한글 함수명과 변수명 사용
}
```

### 5. 상태 관리 규칙
```typescript
// ✅ 올바른 예시
interface AppState {
  user: {
    id: string | null
    name: string | null
    isAuthenticated: boolean
  }
  ui: {
    isLoading: boolean
    error: string | null
    theme: 'light' | 'dark'
  }
  data: {
    posts: Post[]
    comments: Comment[]
    users: User[]
  }
}

const useAppState = () => {
  const [state, setState] = useState<AppState>({
    user: {
      id: null,
      name: null,
      isAuthenticated: false
    },
    ui: {
      isLoading: false,
      error: null,
      theme: 'light'
    },
    data: {
      posts: [],
      comments: [],
      users: []
    }
  })
  
  return { state, setState }
}

// ❌ 잘못된 예시
const 앱상태관리 = () => {
  const [상태, 상태설정] = useState({
    사용자: { 아이디: null, 이름: null, 인증됨: false },
    UI: { 로딩중: false, 에러: null, 테마: '밝음' }
  })
}
```

## 🔧 코드 스탠다드

### 1. 인코딩 규칙
```typescript
// 모든 파일은 UTF-8 BOM 없이 저장
// 파일 상단에 인코딩 명시
/**
 * @fileoverview 사용자 프로필 컴포넌트
 * @encoding UTF-8
 * @author 개발팀
 * @created 2025-01-26
 */
```

### 2. 한글 문자열 처리 규칙
```typescript
// ✅ 올바른 예시
const koreanText = '안녕하세요'
const textLength = koreanText.length // 5 (문자 단위)
const byteLength = Buffer.byteLength(koreanText, 'utf8') // 15 (바이트 단위)

// 정규식에서 한글 처리
const koreanRegex = /[가-힣]+/g
const hasKorean = koreanRegex.test(text)

// 한글 정렬
const koreanSort = (a: string, b: string) => a.localeCompare(b, 'ko-KR')

// ❌ 잘못된 예시
const textLength = koreanText.length // 바이트 길이로 착각
const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/ // 불완전한 한글 정규식
```

### 3. 타입 안정성 규칙
```typescript
// ✅ 올바른 예시
type UserRole = 'admin' | 'user' | 'moderator'
type Theme = 'light' | 'dark'
type Language = 'ko' | 'en' | 'ja'

interface User {
  id: string
  name: string
  role: UserRole
  preferences: {
    theme: Theme
    language: Language
  }
}

// 한글 상수는 별도 관리
const USER_ROLES = {
  ADMIN: 'admin' as const,
  USER: 'user' as const,
  MODERATOR: 'moderator' as const
} as const

const MESSAGES = {
  SUCCESS: '성공적으로 처리되었습니다.',
  ERROR: '오류가 발생했습니다.',
  LOADING: '로딩 중...'
} as const

// ❌ 잘못된 예시
type 사용자역할 = '관리자' | '사용자' | '운영자'
const 메시지 = '성공적으로 처리되었습니다.'
```

### 4. 에러 처리 규칙
```typescript
// ✅ 올바른 예시
class KoreanError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, any>
  ) {
    super(message)
    this.name = 'KoreanError'
  }
}

const handleKoreanError = (error: unknown) => {
  if (error instanceof KoreanError) {
    console.error(`한글 에러 [${error.code}]:`, error.message)
    console.error('컨텍스트:', error.context)
  } else {
    console.error('알 수 없는 에러:', error)
  }
}

// ❌ 잘못된 예시
const 한글에러처리 = (에러: unknown) => {
  // 한글 함수명과 변수명 사용
}
```

## 🤖 AI 코드 검증 시스템

### 1. 검증 규칙 정의
```typescript
interface CodeValidationRule {
  name: string
  description: string
  severity: 'error' | 'warning' | 'info'
  check: (code: string) => ValidationResult
}

interface ValidationResult {
  passed: boolean
  message: string
  line?: number
  column?: number
  suggestion?: string
}

const validationRules: CodeValidationRule[] = [
  {
    name: 'korean-variable-names',
    description: '한글 변수명 사용 금지',
    severity: 'error',
    check: (code) => {
      const koreanVarRegex = /(const|let|var)\s+[가-힣]+/
      const match = code.match(koreanVarRegex)
      if (match) {
        return {
          passed: false,
          message: '한글 변수명은 사용할 수 없습니다.',
          suggestion: '영문 변수명을 사용하세요.'
        }
      }
      return { passed: true, message: '' }
    }
  },
  {
    name: 'korean-function-names',
    description: '한글 함수명 사용 금지',
    severity: 'error',
    check: (code) => {
      const koreanFuncRegex = /function\s+[가-힣]+|const\s+[가-힣]+\s*=/g
      const match = code.match(koreanFuncRegex)
      if (match) {
        return {
          passed: false,
          message: '한글 함수명은 사용할 수 없습니다.',
          suggestion: '영문 함수명을 사용하세요.'
        }
      }
      return { passed: true, message: '' }
    }
  },
  {
    name: 'korean-file-names',
    description: '한글 파일명 사용 금지',
    severity: 'error',
    check: (code) => {
      // 파일명 검증은 별도 처리
      return { passed: true, message: '' }
    }
  },
  {
    name: 'korean-import-paths',
    description: '한글 import 경로 사용 금지',
    severity: 'error',
    check: (code) => {
      const koreanImportRegex = /import.*from\s+['"][^'"]*[가-힣][^'"]*['"]/
      const match = code.match(koreanImportRegex)
      if (match) {
        return {
          passed: false,
          message: '한글 import 경로는 사용할 수 없습니다.',
          suggestion: '영문 경로를 사용하세요.'
        }
      }
      return { passed: true, message: '' }
    }
  },
  {
    name: 'korean-props-interface',
    description: '한글 props 인터페이스 사용 금지',
    severity: 'error',
    check: (code) => {
      const koreanInterfaceRegex = /interface\s+[가-힣]+/
      const match = code.match(koreanInterfaceRegex)
      if (match) {
        return {
          passed: false,
          message: '한글 인터페이스명은 사용할 수 없습니다.',
          suggestion: '영문 인터페이스명을 사용하세요.'
        }
      }
      return { passed: true, message: '' }
    }
  }
]
```

### 2. 검증 시스템 구현
```typescript
class KoreanCodeValidator {
  private rules: CodeValidationRule[]
  
  constructor(rules: CodeValidationRule[]) {
    this.rules = rules
  }
  
  validate(code: string, filename: string): ValidationResult[] {
    const results: ValidationResult[] = []
    
    // 파일명 검증
    if (this.hasKoreanInFilename(filename)) {
      results.push({
        passed: false,
        message: '한글 파일명은 사용할 수 없습니다.',
        suggestion: '영문 파일명을 사용하세요.'
      })
    }
    
    // 코드 검증
    for (const rule of this.rules) {
      const result = rule.check(code)
      if (!result.passed) {
        results.push({
          ...result,
          severity: rule.severity
        })
      }
    }
    
    return results
  }
  
  private hasKoreanInFilename(filename: string): boolean {
    const koreanRegex = /[가-힣]/
    return koreanRegex.test(filename)
  }
  
  validateFile(filePath: string): Promise<ValidationResult[]> {
    return fs.readFile(filePath, 'utf8').then(code => {
      const filename = path.basename(filePath)
      return this.validate(code, filename)
    })
  }
}
```

### 3. AI 코드 생성 전 검증
```typescript
class AICodeGenerator {
  private validator: KoreanCodeValidator
  
  constructor() {
    this.validator = new KoreanCodeValidator(validationRules)
  }
  
  async generateCode(prompt: string): Promise<string> {
    // AI 코드 생성
    const generatedCode = await this.callAI(prompt)
    
    // 검증
    const validationResults = this.validator.validate(generatedCode, 'generated.ts')
    
    // 검증 실패 시 재생성
    if (validationResults.some(r => !r.passed)) {
      console.log('❌ 코드 검증 실패, 재생성 중...')
      console.log('검증 결과:', validationResults)
      
      // 검증 실패 사유를 포함한 새로운 프롬프트 생성
      const improvedPrompt = this.createImprovedPrompt(prompt, validationResults)
      return this.generateCode(improvedPrompt)
    }
    
    console.log('✅ 코드 검증 통과')
    return generatedCode
  }
  
  private createImprovedPrompt(originalPrompt: string, validationResults: ValidationResult[]): string {
    const errorMessages = validationResults
      .filter(r => !r.passed)
      .map(r => `- ${r.message} (${r.suggestion})`)
      .join('\n')
    
    return `${originalPrompt}

중요: 다음 규칙을 반드시 준수해야 합니다:
1. 모든 변수명, 함수명, 인터페이스명은 영문으로 작성
2. 파일명은 영문으로 작성
3. import 경로는 영문으로 작성
4. 한글은 주석과 문자열 내용에만 사용

이전 생성 코드의 오류:
${errorMessages}

위 오류를 수정하여 다시 생성해주세요.`
  }
  
  private async callAI(prompt: string): Promise<string> {
    // 실제 AI API 호출 구현
    return 'generated code'
  }
}
```

## 🚀 실행 방법

### 1. 검증 시스템 설치
```bash
npm install -g korean-code-validator
```

### 2. 프로젝트에 검증 규칙 적용
```bash
# 프로젝트 루트에 검증 설정 파일 생성
touch .korean-validator.json
```

### 3. AI 코드 생성 시 자동 검증
```typescript
const generator = new AICodeGenerator()
const code = await generator.generateCode('사용자 프로필 컴포넌트를 만들어주세요')
```

## 📋 체크리스트

### ✅ 개발 전 체크리스트
- [ ] 파일명이 영문인가?
- [ ] 변수명이 영문인가?
- [ ] 함수명이 영문인가?
- [ ] 인터페이스명이 영문인가?
- [ ] import 경로가 영문인가?

### ✅ AI 코드 생성 후 체크리스트
- [ ] 검증 시스템 통과했는가?
- [ ] 한글 변수명이 없는가?
- [ ] 한글 함수명이 없는가?
- [ ] 한글 파일명이 없는가?
- [ ] 타입 안정성이 보장되는가?

## 🎯 예상 효과

### 1. 코드 품질 향상
- 모듈식 구조 유지
- 컴포넌트 관리 개선
- 버그 발생률 감소

### 2. 개발 효율성 향상
- AI 코드 검증 자동화
- 일관된 코드 스타일
- 디버깅 시간 단축

### 3. 유지보수성 향상
- 코드 가독성 개선
- 타입 안정성 보장
- 팀 협업 효율성 증대

---

**이 가이드를 통해 한글 개발 시에도 모듈식 구조와 컴포넌트 관리가 깨지지 않도록 보장할 수 있습니다!** 🎯

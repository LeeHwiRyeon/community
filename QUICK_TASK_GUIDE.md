# 빠른 Task 생성 가이드

> **Created**: 2025-09-29  
> **Status**: Ready for Use  
> **Version**: 1.0.0

## 🎯 개요

터미널에서 바로바로 Task를 생성할 수 있는 간단한 시스템입니다. 자연어로 작업 요청을 입력하면 자동으로 분석하여 적절한 Task를 생성합니다.

## 🚀 사용법

### 1. 기본 사용법

```bash
# Node.js로 직접 실행
node quick-task.js "작업 요청"

# 배치 스크립트로 실행 (Windows)
task.bat "작업 요청"
```

### 2. 사용 예시

```bash
# 버그 수정 요청
node quick-task.js "로그인 버그 수정해줘"
node quick-task.js "버튼이 클릭이 안 돼"
node quick-task.js "페이지가 느려"

# 기능 개발 요청
node quick-task.js "새로운 사용자 관리 기능 추가"
node quick-task.js "파일 업로드 기능 만들어줘"
node quick-task.js "검색 기능 개선"

# 개선 작업 요청
node quick-task.js "성능 최적화 필요해"
node quick-task.js "코드 정리해줘"
node quick-task.js "UI 개선해줘"

# 긴급 작업 요청
node quick-task.js "긴급하게 보안 패치 적용해줘"
node quick-task.js "즉시 서버 재시작 필요"
```

### 3. 배치 스크립트 사용 (Windows)

```cmd
# 기본 사용
task.bat "로그인 버그 수정해줘"

# 여러 단어가 포함된 요청
task.bat "새로운 사용자 관리 기능 추가"

# 긴급 작업
task.bat "긴급하게 보안 패치 적용해줘"
```

## 📊 자동 분석 기능

### 카테고리 자동 분류
- **버그**: 버그, 오류, 에러, 문제, 수정, fix
- **기능**: 기능, 추가, 개발, 구현, 만들, create
- **개선**: 개선, 향상, 최적화, 성능, 빠르게, optimize
- **리팩토링**: 리팩토링, 정리, 코드 정리, refactor, cleanup
- **테스트**: 테스트, 검증, test
- **문서화**: 문서, 가이드, 설명, documentation, guide
- **보안**: 보안, 보호, security
- **배포**: 배포, deploy, 릴리즈
- **유지보수**: 기본값

### 우선순위 자동 설정
- **긴급**: 긴급, 즉시, asap, urgent, critical, 중요
- **높음**: 높음, 중요, high, 빠르게, 우선
- **낮음**: 낮음, 나중에, low, 여유, 선택
- **보통**: 기본값

### 예상 작업 시간 추정
- **간단한 작업**: 1시간
- **복잡한 작업**: 8시간
- **카테고리별 기본 시간**:
  - 버그 수정: 2시간
  - 기능 개발: 4시간
  - 개선 작업: 3시간
  - 리팩토링: 6시간
  - 테스트: 2시간
  - 문서화: 1시간
  - 성능 최적화: 4시간
  - 보안: 3시간
  - 배포: 2시간
  - 유지보수: 2시간

## 📁 생성되는 파일

### TODO 백로그
- **위치**: `docs/todo-backlog.md`
- **형식**: Markdown 테이블
- **내용**: 생성된 모든 Task 목록

### 작업 히스토리
- **위치**: `docs/work-history.md`
- **형식**: JSON
- **내용**: Task 생성 이력 및 메타데이터

## 🎯 사용 팁

### 효과적인 입력 방법
1. **구체적으로 입력**: "버그 수정" → "로그인 버그 수정해줘"
2. **우선순위 명시**: "긴급하게 로그인 버그 수정해줘"
3. **카테고리 힌트**: "새로운 기능 추가" → "새로운 사용자 관리 기능 추가"

### 빠른 작업 예시
```bash
# 간단한 버그 수정
node quick-task.js "로그인 버그"

# 기능 추가
node quick-task.js "파일 업로드 기능"

# 긴급 작업
node quick-task.js "긴급 보안 패치"

# 성능 개선
node quick-task.js "성능 최적화"
```

## 🔍 생성된 Task 확인

### TODO 백로그에서 확인
```bash
# 생성된 Task 목록 보기
type docs\todo-backlog.md | findstr AUTO-

# 최근 생성된 Task만 보기
type docs\todo-backlog.md | findstr AUTO- | tail -10
```

### 작업 히스토리에서 확인
```bash
# JSON 형태로 확인
type docs\work-history.md
```

## 🛠️ 문제 해결

### 자주 발생하는 문제

1. **Node.js가 설치되지 않음**
   ```
   'node'은(는) 내부 또는 외부 명령, 실행할 수 있는 프로그램, 또는 배치 파일이 아닙니다.
   ```
   - 해결: https://nodejs.org/에서 Node.js 설치

2. **한글 인코딩 문제**
   - 해결: Windows에서 `chcp 65001` 실행 후 다시 시도

3. **파일 권한 오류**
   ```
   EACCES: permission denied
   ```
   - 해결: 관리자 권한으로 실행

### 로그 확인
- 콘솔에 직접 출력됨
- 오류 발생 시 상세한 오류 메시지 표시

## 📈 성능 최적화

### 권장 사항
1. **명확한 입력**: 구체적이고 명확한 자연어 사용
2. **카테고리 활용**: 적절한 키워드 사용으로 자동 분류 개선
3. **정기적인 정리**: 완료된 Task 아카이브

### 모니터링
- TODO 백로그에서 Task 상태 확인
- 작업 히스토리에서 생성 이력 추적

## 🎉 완료!

이제 터미널에서 간단한 명령어로 바로바로 Task를 생성할 수 있습니다!

```bash
# 가장 간단한 사용법
node quick-task.js "작업 요청"

# Windows 배치 스크립트
task.bat "작업 요청"
```

---

**문서 버전**: 1.0.0  
**최종 업데이트**: 2025-09-29  
**작성자**: 자동화 시스템

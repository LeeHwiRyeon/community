# 🚀 자동화 실행 가이드

## 📋 개요

이 가이드는 Community Hub 프로젝트의 자동화 시스템을 설정하고 실행하는 방법을 설명합니다.

## 🛠️ 설치 및 설정

### 1. 필수 요구사항

```bash
# Node.js 20+ 설치 확인
node --version

# npm 설치 확인
npm --version

# Git 설치 확인
git --version
```

### 2. 스크립트 권한 설정

```bash
# 실행 권한 부여
chmod +x scripts/auto-todo-generator.js
chmod +x scripts/auto-task-assigner.js
chmod +x scripts/auto-progress-tracker.js
```

### 3. 필요한 디렉토리 생성

```bash
# 알림 디렉토리 생성
mkdir -p notifications

# 진행 리포트 디렉토리 생성
mkdir -p docs/reports
```

## 🔧 수동 실행 방법

### 1. 자동 TODO 생성

```bash
# 모든 이벤트 감지 및 TODO 생성
node scripts/auto-todo-generator.js

# 특정 유형만 감지
node scripts/auto-todo-generator.js --type=bug
node scripts/auto-todo-generator.js --type=improvement
node scripts/auto-todo-generator.js --type=performance
```

### 2. 자동 작업 할당

```bash
# 모든 할당 가능한 TODO에 대해 작업 할당
node scripts/auto-task-assigner.js

# 특정 우선순위만 할당
node scripts/auto-task-assigner.js --priority=high
node scripts/auto-task-assigner.js --priority=critical
```

### 3. 자동 진행 추적

```bash
# 전체 진행 상황 분석 및 추적
node scripts/auto-progress-tracker.js

# 특정 기간만 분석
node scripts/auto-progress-tracker.js --days=7
node scripts/auto-progress-tracker.js --days=30
```

## 🤖 자동 실행 설정

### 1. GitHub Actions 설정

#### 워크플로우 활성화
1. GitHub 리포지토리 → Settings → Actions
2. "Allow all actions and reusable workflows" 선택
3. `.github/workflows/auto-development.yml` 파일이 자동으로 활성화됨

#### 스케줄 확인
- **TODO 생성**: 매일 오전 9시
- **진행 추적**: 6시간마다
- **작업 할당**: 매주 월요일 오전 10시

### 2. 수동 트리거

```bash
# GitHub Actions에서 수동 실행
# Repository → Actions → "자동 개발 워크플로우" → "Run workflow"
```

### 3. 로컬 크론 작업 설정 (선택사항)

```bash
# crontab 편집
crontab -e

# 다음 라인 추가
0 9 * * * cd /path/to/community && node scripts/auto-todo-generator.js
0 */6 * * * cd /path/to/community && node scripts/auto-progress-tracker.js
0 10 * * 1 cd /path/to/community && node scripts/auto-task-assigner.js
```

## 📊 모니터링 및 확인

### 1. 실행 로그 확인

```bash
# GitHub Actions 로그
# Repository → Actions → 최근 실행 → 로그 확인

# 로컬 실행 로그
node scripts/auto-todo-generator.js 2>&1 | tee logs/todo-generation.log
node scripts/auto-task-assigner.js 2>&1 | tee logs/task-assignment.log
node scripts/auto-progress-tracker.js 2>&1 | tee logs/progress-tracking.log
```

### 2. 결과 파일 확인

```bash
# TODO 백로그 업데이트 확인
cat docs/todo-backlog.md

# 진행 리포트 확인
cat docs/progress-report.md

# 할당 알림 확인
cat notifications/assignments.md
```

### 3. 성능 지표 모니터링

```bash
# TODO 생성 통계
grep -c "자동 생성된 TODO" docs/todo-backlog.md

# 완료된 작업 통계
grep -c "✅" docs/todo-backlog.md

# 진행률 확인
grep "진행률:" docs/progress-report.md
```

## 🔧 커스터마이징

### 1. 개발자 정보 수정

`scripts/auto-task-assigner.js` 파일에서 개발자 정보 수정:

```javascript
this.developers = [
  {
    id: 'dev1',
    name: 'Your Name',
    skills: ['react', 'typescript', 'ui'],
    workload: 0,
    maxWorkload: 10,
    preferences: ['ui', 'ux']
  },
  // ... 더 많은 개발자 추가
]
```

### 2. 감지 패턴 수정

`scripts/auto-todo-generator.js` 파일에서 감지 패턴 수정:

```javascript
this.bugPatterns = [
  { pattern: /YourPattern/gi, severity: 'high', category: 'your-category' },
  // ... 더 많은 패턴 추가
]
```

### 3. 우선순위 기준 수정

`scripts/auto-task-assigner.js` 파일에서 우선순위 계산 로직 수정:

```javascript
calculatePriority(severity, category) {
  // 커스텀 우선순위 로직 구현
  return customPriority
}
```

## 🚨 문제 해결

### 1. 일반적인 문제

#### 권한 오류
```bash
# 해결 방법
chmod +x scripts/*.js
```

#### Node.js 모듈 오류
```bash
# 해결 방법
npm install
cd frontend && npm install
cd ../server-backend && npm install
```

#### Git 커밋 오류
```bash
# 해결 방법
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"
```

### 2. 디버깅

#### 상세 로그 활성화
```bash
# 디버그 모드로 실행
DEBUG=* node scripts/auto-todo-generator.js
DEBUG=* node scripts/auto-task-assigner.js
DEBUG=* node scripts/auto-progress-tracker.js
```

#### 단계별 실행
```bash
# TODO 생성만 실행
node scripts/auto-todo-generator.js --dry-run

# 작업 할당만 실행
node scripts/auto-task-assigner.js --dry-run

# 진행 추적만 실행
node scripts/auto-progress-tracker.js --dry-run
```

## 📈 성과 측정

### 1. 자동화 효과 측정

```bash
# TODO 생성 속도
echo "TODO 생성 수: $(grep -c "자동 생성된 TODO" docs/todo-backlog.md)"

# 작업 완료율
echo "완료율: $(grep -c "✅" docs/todo-backlog.md)/$(grep -c "|" docs/todo-backlog.md)"

# 평균 완료 시간
echo "평균 완료 시간: $(calculate-average-time.sh)"
```

### 2. 품질 지표

```bash
# 코드 품질 점수
npm run lint:score

# 테스트 커버리지
npm run test:coverage

# 성능 점수
npm run lighthouse:score
```

## 🎯 목표 달성 전략

### 1. 단계별 목표 설정

```bash
# 1주차 목표
echo "1주차: 기본 자동화 구축 완료"

# 2주차 목표
echo "2주차: 작업 할당 자동화 완료"

# 3주차 목표
echo "3주차: 피드백 루프 구축 완료"

# 4주차 목표
echo "4주차: 목표 버전 달성"
```

### 2. 버전 진행률 추적

```bash
# 현재 버전 확인
cat package.json | grep version

# 목표 버전 설정
echo "목표 버전: v2.0.0"

# 진행률 계산
node scripts/version-tracker.js
```

## 🔄 지속적인 개선

### 1. 주간 리뷰

```bash
# 주간 성과 리포트 생성
node scripts/weekly-report.js

# 개선사항 식별
node scripts/identify-improvements.js
```

### 2. 알고리즘 최적화

```bash
# 학습 데이터 수집
node scripts/collect-learning-data.js

# 알고리즘 업데이트
node scripts/update-algorithms.js
```

## 📚 추가 자료

- [자동화 전략 문서](./development-automation-strategy.md)
- [TODO 백로그](./todo-backlog.md)
- [진행 리포트](./progress-report.md)
- [GitHub Actions 가이드](../CI_CD_GUIDE.md)

---

**다음 단계**: 이 가이드를 따라 자동화 시스템을 설정하고 실행해보세요. 문제가 발생하면 문제 해결 섹션을 참고하거나 이슈를 생성해주세요.

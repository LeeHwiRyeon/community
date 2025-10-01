# 🤖 대화형 매니저 시스템 가이드

## 📋 개요

대화형 매니저 시스템은 사용자와의 자연스러운 대화를 통해 작업을 관리하고 자동으로 TODO를 생성하는 지능형 작업 관리 시스템입니다.

## 🚀 주요 기능

### 1. 대화형 작업 관리
- 자연어로 작업 요청 입력
- 자동 작업 분석 및 분할
- 실시간 진행 상황 확인
- 대화 기록 저장 및 관리

### 2. 지능형 작업 분석
- 입력 내용의 복잡도 자동 분석
- 우선순위 자동 결정
- 카테고리 자동 분류
- 의존성 관계 파악

### 3. 자동 TODO 생성
- 작업을 세부 TODO로 자동 분할
- 우선순위 기반 정렬
- 병렬 처리 가능 여부 판단
- 예상 시간 자동 계산

### 4. 워크플로우 데이터베이스
- 전체 작업 흐름 저장
- 진행 상황 실시간 추적
- 통계 및 리포트 생성
- 데이터 정리 및 아카이브

## 🛠️ 설치 및 실행

### 1. 의존성 설치
```bash
npm install uuid
```

### 2. 시스템 실행
```bash
# 통합 대화형 매니저 실행
node integrated-conversational-manager.js

# 워크플로우 데이터베이스 관리
node workflow-database-manager.js

# 테스트 실행
node test-conversational-manager.js
```

## 💬 사용법

### 기본 명령어

| 명령어              | 설명                      | 예시                |
| ------------------- | ------------------------- | ------------------- |
| `status`            | 현재 워크플로우 상태 확인 | `status`            |
| `next`              | 다음 추천 작업 보기       | `next`              |
| `list`              | 모든 워크플로우 목록      | `list`              |
| `complete [taskId]` | 작업 완료 처리            | `complete task_123` |
| `report`            | 전체 리포트 생성          | `report`            |
| `stats`             | 통계 정보                 | `stats`             |
| `cleanup`           | 데이터 정리               | `cleanup`           |
| `quit`              | 시스템 종료               | `quit`              |

### 작업 요청 예시

```
💬 React 웹 애플리케이션 개발 - 사용자 인증, 게시판, 댓글 기능 구현

🔍 작업 요청 분석 중...
📊 작업 분석 및 분할 중...
📋 TODO 생성 중...

✅ 워크플로우 생성 완료: React 웹 애플리케이션 개발
📋 워크플로우 ID: c5cbe06c-396b-47c3-9b4d-c9007b4dce2a
🎯 우선순위: high
📂 카테고리: development
📊 복잡도: medium
⏱️ 예상 시간: 1-3시간

📋 생성된 작업 (6개):
  1. 요구사항 분석 (high)
  2. 기술 설계 (high)
  3. 개발 환경 구축 (medium)
  4. 핵심 기능 구현 (high)
  5. 테스트 작성 (medium)
  6. 문서화 (low)

✅ TODO 생성 완료 (6개)
```

## 📊 시스템 아키텍처

### 1. ConversationalManager
- 사용자 입력 처리
- 작업 분석 및 분할
- TODO 생성
- 대화 기록 관리

### 2. WorkflowDatabaseManager
- 워크플로우 데이터 저장
- 작업 상태 관리
- 의존성 추적
- 통계 및 리포트

### 3. IntegratedConversationalManager
- 통합 인터페이스
- 실시간 대화 처리
- 명령어 해석
- 시스템 통합

## 🎯 작업 분류 시스템

### 카테고리별 작업 템플릿

#### Development (개발)
1. 요구사항 분석 (high, 1-2시간)
2. 기술 설계 (high, 2-3시간)
3. 개발 환경 구축 (medium, 30분-1시간)
4. 핵심 기능 구현 (high, 4-8시간)
5. 테스트 작성 (medium, 2-4시간)
6. 문서화 (low, 1-2시간)

#### Bug-fix (버그 수정)
1. 버그 재현 (high, 30분-1시간)
2. 원인 분석 (high, 1-2시간)
3. 수정 방안 설계 (medium, 30분-1시간)
4. 코드 수정 (high, 1-3시간)
5. 테스트 및 검증 (high, 1-2시간)

#### General (일반)
1. 분석 및 계획 (high, 30분-1시간)
2. 실행 (high, 1-4시간)
3. 검토 및 완료 (medium, 30분-1시간)

## 📈 우선순위 시스템

### 우선순위 결정 기준
- **urgent**: 긴급, 즉시, 빠르게, ASAP
- **high**: 중요, 우선, 먼저, priority
- **medium**: 기본 우선순위
- **low**: 낮은 우선순위

### 복잡도 분석
- **low**: 50자 미만, 키워드 1개 이하
- **medium**: 200자 미만, 키워드 3개 이하
- **high**: 500자 미만, 키워드 5개 이하
- **very_high**: 500자 이상, 키워드 5개 초과

## 🔄 워크플로우 생명주기

1. **생성**: 사용자 입력으로 워크플로우 생성
2. **분석**: 입력 내용 분석 및 작업 분할
3. **실행**: TODO 생성 및 작업 진행
4. **모니터링**: 실시간 진행 상황 추적
5. **완료**: 모든 작업 완료 시 워크플로우 완료
6. **아카이브**: 완료된 워크플로우 정리

## 📁 데이터베이스 구조

### 워크플로우 데이터베이스 (workflow-database.json)
```json
{
  "workflows": [
    {
      "id": "workflow_id",
      "title": "워크플로우 제목",
      "description": "상세 설명",
      "priority": "high",
      "category": "development",
      "status": "active",
      "tasks": [],
      "todos": [],
      "conversationLog": [],
      "metadata": {
        "progress": 0,
        "complexity": "medium",
        "estimatedTotalTime": "1-3시간"
      }
    }
  ]
}
```

### TODO 데이터베이스 (todo-database.json)
```json
{
  "todos": [
    {
      "id": "todo_id",
      "workflowId": "workflow_id",
      "taskId": "task_id",
      "title": "TODO 제목",
      "description": "상세 설명",
      "priority": "high",
      "status": "pending",
      "estimatedTime": "1-2시간"
    }
  ]
}
```

## 🎉 장점

### 1. 효율성
- 작업을 자동으로 분석하고 분할
- 우선순위 기반 자동 정렬
- 병렬 처리 가능 작업 식별

### 2. 투명성
- 모든 과정이 대화로 기록
- 실시간 진행 상황 확인
- 상세한 통계 및 리포트

### 3. 유연성
- 자연어로 작업 요청
- 실시간 작업 방향 조정
- 다양한 카테고리 지원

### 4. 자동화
- TODO 자동 생성
- 우선순위 자동 결정
- 진행률 자동 계산

## 🔧 커스터마이징

### 작업 템플릿 수정
`integrated-conversational-manager.js`의 `getTaskTemplates()` 메서드에서 카테고리별 작업 템플릿을 수정할 수 있습니다.

### 우선순위 키워드 추가
`analyzePriority()` 메서드에서 우선순위 결정 키워드를 추가할 수 있습니다.

### 카테고리 분류 개선
`categorizeInput()` 메서드에서 카테고리 분류 로직을 개선할 수 있습니다.

## 🚀 향후 개선 계획

1. **AI 통합**: 더 정교한 작업 분석을 위한 AI 모델 통합
2. **실시간 협업**: 여러 사용자 간 실시간 협업 지원
3. **모바일 지원**: 모바일 앱 개발
4. **API 제공**: REST API를 통한 외부 시스템 연동
5. **알림 시스템**: 작업 완료 및 마감일 알림

## 📞 지원

문제가 발생하거나 개선 사항이 있으면 이슈를 등록해 주세요.

---

**대화형 매니저 시스템으로 더 효율적인 작업 관리가 가능합니다! 🚀**

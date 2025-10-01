# 🤖 AutoAgent 워크플로우 가이드

**작성일**: 2025-10-02  
**버전**: v1.0.0  
**대상**: 개발팀, 운영팀, 관리자

---

## 📋 **목차**

1. [시스템 개요](#시스템-개요)
2. [워커 플로우 자동화](#워커-플로우-자동화)
3. [액션플랜 자동화](#액션플랜-자동화)
4. [자동 복구 시스템](#자동-복구-시스템)
5. [API 사용법](#api-사용법)
6. [모니터링 및 알림](#모니터링-및-알림)
7. [문제 해결](#문제-해결)
8. [베스트 프랙티스](#베스트-프랙티스)

---

## 🎯 **시스템 개요**

### **AutoAgent v1.0.0 주요 기능**

- ✅ **워커 플로우 자동화**: 작업 자동 할당 및 실행
- ✅ **액션플랜 자동화**: 복잡한 작업의 자동화된 실행
- ✅ **자동 복구 시스템**: 장애 감지 및 자동 복구
- ✅ **실시간 모니터링**: 시스템 상태 실시간 추적
- ✅ **알림 및 에스컬레이션**: 문제 발생 시 자동 알림

### **시스템 아키텍처**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Worker Flow   │    │  Action Plan    │    │ Auto Recovery   │
│   Automation    │    │  Automation     │    │    System       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Management API  │
                    │     v1.0.0      │
                    └─────────────────┘
```

---

## 🔧 **워커 플로우 자동화**

### **워커 등록**

```bash
# 워커 등록
curl -X POST http://localhost:50000/api/autoagents-management/v1/workers \
  -H "Content-Type: application/json" \
  -d '{
    "id": "TODO_WORKER_001",
    "name": "TODO 관리 워커",
    "type": "TODO",
    "capabilities": ["task_creation", "task_assignment", "task_monitoring"]
  }'
```

### **작업 할당**

```bash
# 작업 할당
curl -X POST http://localhost:50000/api/autoagents-management/v1/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "type": "TODO",
    "priority": "high",
    "data": {
      "title": "새로운 기능 개발",
      "description": "사용자 인증 시스템 개선",
      "deadline": "2025-10-10"
    },
    "workflow": "TODO_WORKFLOW"
  }'
```

### **워크플로우 실행**

```bash
# 워크플로우 실행
curl -X POST http://localhost:50000/api/autoagents-management/v1/workflows/TODO_WORKFLOW/execute \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "taskId": "task_123",
      "userId": "user_456"
    }
  }'
```

### **워커 상태 확인**

```bash
# 워커 목록 조회
curl -X GET http://localhost:50000/api/autoagents-management/v1/workers
```

---

## 📋 **액션플랜 자동화**

### **액션플랜 생성**

```bash
# 시스템 점검 액션플랜 생성
curl -X POST http://localhost:50000/api/autoagents-management/v1/action-plans \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "SYSTEM_CHECK",
    "data": {
      "serverId": "server_001",
      "checkLevel": "comprehensive"
    }
  }'
```

### **액션플랜 실행**

```bash
# 액션플랜 실행
curl -X POST http://localhost:50000/api/autoagents-management/v1/action-plans/plan_1234567890/execute
```

### **액션플랜 재시도**

```bash
# 실패한 액션플랜 재시도
curl -X POST http://localhost:50000/api/autoagents-management/v1/action-plans/plan_1234567890/retry
```

### **액션플랜 목록 조회**

```bash
# 모든 액션플랜 조회
curl -X GET http://localhost:50000/api/autoagents-management/v1/action-plans

# 특정 상태의 액션플랜 조회
curl -X GET "http://localhost:50000/api/autoagents-management/v1/action-plans?status=running"

# 특정 카테고리의 액션플랜 조회
curl -X GET "http://localhost:50000/api/autoagents-management/v1/action-plans?category=security"
```

---

## 🛡️ **자동 복구 시스템**

### **헬스 체크 등록**

```bash
# 커스텀 헬스 체크 등록
curl -X POST http://localhost:50000/api/autoagents-management/v1/health-checks \
  -H "Content-Type: application/json" \
  -d '{
    "id": "custom_service_check",
    "name": "커스텀 서비스 확인",
    "type": "service",
    "interval": 30000,
    "timeout": 10000,
    "threshold": 3
  }'
```

### **인시던트 조회**

```bash
# 모든 인시던트 조회
curl -X GET http://localhost:50000/api/autoagents-management/v1/incidents

# 활성 인시던트만 조회
curl -X GET "http://localhost:50000/api/autoagents-management/v1/incidents?status=active"
```

### **인시던트 수동 해결**

```bash
# 인시던트 수동 해결
curl -X POST http://localhost:50000/api/autoagents-management/v1/incidents/incident_1234567890/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "resolution": "서비스 재시작으로 문제 해결됨"
  }'
```

---

## 📊 **API 사용법**

### **시스템 상태 확인**

```bash
# 전체 시스템 상태 조회
curl -X GET http://localhost:50000/api/autoagents-management/v1/status
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2025-10-02T10:30:00.000Z",
    "version": "1.0.0",
    "components": {
      "workerAutomation": {
        "status": "running",
        "workers": 5,
        "activeTasks": 3,
        "performance": {
          "totalTasks": 150,
          "completedTasks": 147,
          "successRate": 98.0
        }
      },
      "actionPlanAutomation": {
        "status": "running",
        "totalPlans": 25,
        "activePlans": 2,
        "performance": {
          "successRate": 96.0
        }
      },
      "autoRecoverySystem": {
        "status": "running",
        "totalIncidents": 8,
        "activeIncidents": 0,
        "performance": {
          "autoRecovered": 7,
          "successRate": 87.5
        }
      }
    }
  }
}
```

### **성능 메트릭 조회**

```bash
# 성능 메트릭 조회
curl -X GET http://localhost:50000/api/autoagents-management/v1/metrics
```

---

## 🔔 **모니터링 및 알림**

### **알림 채널**

- **이메일**: 관리자, 매니저
- **Slack**: 개발팀, 운영팀
- **SMS**: 긴급 상황 시
- **PagerDuty**: 24/7 온콜

### **알림 규칙**

| 심각도   | 조건                     | 채널                         | 수신자                 | 에스컬레이션 시간 |
| -------- | ------------------------ | ---------------------------- | ---------------------- | ----------------- |
| Critical | 서비스 다운, 데이터 손실 | Email, SMS, Slack, PagerDuty | Admin, Manager, OnCall | 5분               |
| High     | 성능 저하, 리소스 부족   | Email, Slack                 | Admin, Manager         | 15분              |
| Medium   | 경고 임계값 초과         | Email, Slack                 | Admin                  | 30분              |

### **모니터링 대시보드**

```bash
# 실시간 모니터링 URL
http://localhost:50000/api/autoagents-management/v1/status
http://localhost:50000/api/autoagents-management/v1/metrics
```

---

## 🚨 **문제 해결**

### **일반적인 문제**

#### **1. 워커가 작업을 받지 못하는 경우**

**증상**: 작업이 대기열에 쌓이지만 워커가 처리하지 않음

**해결 방법**:
```bash
# 워커 상태 확인
curl -X GET http://localhost:50000/api/autoagents-management/v1/workers

# 워커 재시작
curl -X POST http://localhost:50000/api/autoagents-management/v1/workers/WORKER_ID/restart
```

#### **2. 액션플랜이 실패하는 경우**

**증상**: 액션플랜이 계속 실패 상태

**해결 방법**:
```bash
# 액션플랜 상세 정보 확인
curl -X GET http://localhost:50000/api/autoagents-management/v1/action-plans/PLAN_ID

# 액션플랜 재시도
curl -X POST http://localhost:50000/api/autoagents-management/v1/action-plans/PLAN_ID/retry
```

#### **3. 자동 복구가 작동하지 않는 경우**

**증상**: 장애가 감지되지만 자동 복구가 실행되지 않음

**해결 방법**:
```bash
# 인시던트 상태 확인
curl -X GET http://localhost:50000/api/autoagents-management/v1/incidents?status=active

# 수동 복구 실행
curl -X POST http://localhost:50000/api/autoagents-management/v1/incidents/INCIDENT_ID/resolve \
  -H "Content-Type: application/json" \
  -d '{"resolution": "수동 복구 실행"}'
```

### **로그 확인**

```bash
# 시스템 로그 확인
tail -f logs/autoagent.log

# 에러 로그 확인
grep "ERROR" logs/autoagent.log

# 특정 워커 로그 확인
grep "WORKER_ID" logs/autoagent.log
```

---

## 💡 **베스트 프랙티스**

### **1. 워커 관리**

- **워커 등록 시**: 명확한 ID와 타입 지정
- **능력 설정**: 워커가 수행할 수 있는 작업만 capabilities에 포함
- **모니터링**: 정기적으로 워커 상태 확인

### **2. 액션플랜 설계**

- **의존성 관리**: 액션플랜 간 의존성을 명확히 정의
- **우선순위 설정**: 중요도에 따른 적절한 우선순위 할당
- **타임아웃 설정**: 각 액션에 적절한 타임아웃 설정

### **3. 자동 복구 설정**

- **헬스 체크**: 중요한 서비스에 대한 헬스 체크 등록
- **임계값 설정**: 적절한 실패 임계값 설정
- **복구 전략**: 다양한 복구 전략을 단계별로 설정

### **4. 모니터링**

- **정기적 확인**: 시스템 상태를 정기적으로 확인
- **알림 설정**: 적절한 알림 채널과 수신자 설정
- **로그 관리**: 로그 파일을 정기적으로 정리

---

## 📞 **지원 및 문의**

### **긴급 상황**
- **24/7 온콜**: +82-10-1234-5678
- **이메일**: oncall@company.com
- **Slack**: #emergency-support

### **일반 문의**
- **이메일**: support@company.com
- **Slack**: #autoagent-support
- **문서**: [내부 위키](https://wiki.company.com/autoagent)

### **개발팀**
- **이메일**: dev-team@company.com
- **Slack**: #dev-team
- **GitHub**: [AutoAgent Repository](https://github.com/company/autoagent)

---

## 📝 **변경 이력**

| 버전   | 날짜       | 변경사항    | 작성자            |
| ------ | ---------- | ----------- | ----------------- |
| v1.0.0 | 2025-10-02 | 초기 릴리즈 | AUTOAGENTS 매니저 |

---

**© 2025 Community Hub. All rights reserved.**

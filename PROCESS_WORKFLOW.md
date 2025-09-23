# Development Process Workflow

이 문서는 기능 요청에서 배포 직전까지 반복 가능한 최소 표준 루프를 정의합니다.

## 0. 용어
- Feature Request: 신규/변경 요구 (Issue 또는 구두)
- Action Plan: 구현 세부 계획 (스코프·아웃스코프 명확화)
- Test Cases: 기능을 검증하는 구체 시나리오 (입력/절차/예상결과)
- DoD(Definition of Done): 기능 완료 판단 기준 체크리스트

## 1. 루프 개요
1. Request 수집 → Feature 명세 초안 작성 (FEATURE_TEMPLATE.md 기반)
2. Action Plan 수립 (작업 단위/순서/리스크/롤백 전략)
3. Test Case 설계 (성공/실패/경계/권한/보안 최소 포함)
4. 구현 (작은 커밋; DB 변경 분리; 테스트 주도)
5. 자동/수동 테스트 실행 (CI script 또는 node --test)
6. 문서 갱신 (API_REFERENCE, DB_SCHEMA, CHANGELOG optional)
7. DoD 체크 후 Close → 다음 요청 반복

## 2. Feature 요청 → 명세 (요약 템플릿)
| 항목               | 내용                              |
| ------------------ | --------------------------------- |
| 제목               | 간결한 기능명                     |
| 배경/문제          | 해결하려는 Pain Point             |
| 목표(Outcome)      | 사용자/시스템 관점 측정 가능 결과 |
| 범위(In Scope)     | 구현 포함 항목 리스트             |
| 제외(Out of Scope) | 이번에 다루지 않는 항목           |
| 의존성             | 다른 서비스/모듈/DB 변경          |
| 리스크 & 대응      | 실패 시 영향 / 완화 전략          |
| 마이그레이션       | 스키마/데이터 이전 절차 (있다면)  |
| 롤백 전략          | 실패 시 되돌리는 방법             |
| 성능/보안 고려     | 임계 QPS, 권한, 취약점 포인트     |
| 환경변수           | 추가/변경 ENV 목록                |

## 3. Action Plan 템플릿
번호 순서대로 수행 가능해야 하며, 병렬 작업 명시.
```
1. Schema: <변경 요약 / DDL>
2. Backend: <파일별 수정 개요>
3. Auth/RBAC: <권한 영향>
4. Tests: <추가/수정 테스트 파일> (happy path + edge)
5. Docs: API_REFERENCE, DB_SCHEMA 업데이트
6. Migration: <실행 커맨드 또는 스크립트>
7. Cleanup: Dead code 제거, TODO 정리
```

## 4. Test Case 설계 가이드
최소 포함 범주:
- Happy Path (정상 흐름)
- Validation Error (잘못된 입력)
- AuthZ/AuthN (권한 & 미인증)
- Edge (경계값, 빈 목록, 0개, 최대 길이)
- Negative (잘못된 토큰, 만료 refresh 등)
- 성능/API 안정(선택: 간단 부하 루프 or latency 측정)

케이스 표 예시:
| ID  | 시나리오                 | 입력            | 절차                      | 예상결과                  |
| --- | ------------------------ | --------------- | ------------------------- | ------------------------- |
| A1  | 첫 사용자 admin 자동승격 | code=abc        | /callback -> /me          | role=admin                |
| A2  | refresh 회전             | refresh=valid   | /refresh                  | 새 access/refresh 발급    |
| A3  | moderator 삭제 차단      | moderator token | DELETE /announcements/:id | 403                       |
| A4  | soft delete 후 목록 제외 | admin token     | create -> delete -> list  | 목록에 미포함             |
| A5  | account linking          | link=1 + bearer | 2nd provider callback     | linked:true & 동일 userId |

## 5. Definition of Done 체크리스트
| 항목                                                       | 상태 |
| ---------------------------------------------------------- | ---- |
| Action Plan 모든 작업 완료                                 |      |
| 새/변경 DB 스키마 반영 & 마이그레이션 스크립트             |      |
| Test Cases 작성 & 모두 통과 (자동)                         |      |
| 주요 실패 케이스(권한/validation) 테스트 포함              |      |
| 문서(API_REFERENCE / DB_SCHEMA / API_USAGE 교차 링크) 갱신 |      |
| 환경변수 문서화                                            |      |
| 린트/빌드 오류 없음                                        |      |
| 위험/롤백 전략 문서화                                      |      |
| 운영 로그/메트릭 지표 추가(필요 시)                        |      |
| TODO/주석 임시비밀번호/비밀 제거                           |      |

## 6. 문서 갱신 규칙
- API_ENDPOINT 추가/변경 시: API_REFERENCE.md 수정 (요청/응답/권한/샘플)
- DB 변경 시: DB_SCHEMA.md 테이블 diff & 마이그레이션 단계 추가
- 새 ENV: README 환경변수 표 또는 별도 CONFIG.md 업데이트
- 배포 전 마지막 커밋 메시지: `feat: <기능> (docs updated)` 또는 `fix:` prefix

## 7. 브랜치 & 커밋 (권장)
| 목적                | 브랜치 패턴    |
| ------------------- | -------------- |
| 기능                | feature/<slug> |
| 핫픽스              | fix/<slug>     |
| 스키마 마이그레이션 | schema/<slug>  |

커밋 메시지 Prefix: feat / fix / refactor / docs / test / chore / perf / build

## 8. 예시 워크플로 (요약)
```
요청 접수 → FEATURE_TEMPLATE 작성
→ Action Plan & Test 표 확정
→ (필요) Schema 변경 먼저 커밋
→ 기능 구현 (작은 단위 커밋 + 테스트 동시 추가)
 → 수동 검증용 테스트 페이지 갱신 (frontend/test-frontend.html 에 신규 기능 테스트 함수 추가 / 간단 항목은 simple-test.html)
→ node --test 전부 통과
→ API_REFERENCE / DB_SCHEMA 갱신
→ DoD 체크 → Merge → 다음 요청
```

## 9. 품질 게이트
- 테스트 100% 성공 (실패 테스트 남기지 않음)
- 중대한 console.error 없음 (고의적 로깅 제외)
- 메트릭/로그 추가 후 과도한 스팸 없는지 1회 점검
- 보안: 새 엔드포인트 권한 필수 여부 검토 + 입력 값 기본 검증

## 10. 향후 확장 아이디어
- 자동 CHANGELOG 생성 (Conventional Commits)
- pre-commit 훅: lint + node --test 빠른 subset
- OpenAPI 스펙 자동 생성 + 문서 호스팅

---
이 워크플로 문서는 기능 작업 시작 전에 반드시 읽고 필요한 템플릿(FEATURE_TEMPLATE.md) 채운 뒤 진행하세요.

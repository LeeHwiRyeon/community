# 고급 작성 기능 설계 (Phase 1 Step 26)

## 1. 협업 작성 MVP
- **역할**: `owner`, `contributor`, `viewer` 세 가지. owner만이 협업자 추가/삭제 및 권한 변경 가능.
- **API 계약**:
  - `POST /api/posts/:id/collaborators` (body: `{ userId, role }`).
  - `DELETE /api/posts/:id/collaborators/:userId`.
  - `GET /api/posts/:id/collaborators` → 현재 협업자 목록과 권한 반환.
- **감사 로그**: 모든 추가/삭제 이벤트를 `post_collab_history` 테이블에 기록(`action`, `actor`, `timestamp`).

## 2. 예약 발행
- 스키마: `posts` 테이블에 `scheduled_at TIMESTAMP NULL` 컬럼 추가.
- 큐: `scheduled_posts` 작업 큐를 1분 주기로 폴링하여 발행 시간 도달 시 자동 게시.
- 제한: 최소 3분 이후 시간만 예약 허용. 실패 시 관리자에게 Slack 알림 전송.
- 타임존: 모든 시간은 UTC로 저장하고 UI에서 로컬 타임존으로 변환.

## 3. 버전 관리
- 테이블: `post_versions { id, post_id, version_no, snapshot_json, created_at, author_id }`.
- UI: 좌/우 diff 뷰 제공, 선택한 버전으로 복원할 수 있는 "버전 복구" 버튼.
- 보존 정책: 최근 20개 버전을 유지하고, 나머지는 압축 저장 또는 아카이브.

## 4. 리뷰 워크플로우
- 상태 머신: `draft` → `pending_review` → (`approved` | `rejected`).
- 승인 API: `POST /api/posts/:id/request-review`, `POST /api/posts/:id/approve`, `POST /api/posts/:id/reject`.
- 알림: 상태 변경 시 Slack Webhook 및 이메일 발송.
- SLA: 리뷰 요청 24시간 이내 응답, 초과 시 자동 재알림.

## 5. SEO 제안 기능
- 데이터: TF-IDF 기반 키워드 후보 + 외부 트렌드 API(예: Google Trends).
- 출력: 상위 5개 제안을 카드 형태로 제공, "적용" 버튼으로 본문에 삽입.
- 지표: `seo.suggestion.used`, `seo.suggestion.dismissed`, `seo.suggestion.feedback` 이벤트 수집.
- UI: 에디터 우측 패널에 배치, 접근성을 위해 키보드 포커스 순서 정의.

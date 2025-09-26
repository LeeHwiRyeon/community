# RPG 프로필 시스템 설계 메모 (Phase 1 Step 01-07)

## 1. 활동 로그 및 경험치/배지 규칙 (Step 01)
| 이벤트 | 경험치 | 주석 |
| --- | --- | --- |
| 게시글 최초 작성 | +40 XP | 하루 최대 5회 누적 |
| 게시글 수정(주요 변경) | +10 XP | 6시간 내 중복 발생 시 1회만 인정 |
| 댓글 작성 | +15 XP | 스팸 필터 통과 시에만 쌓임 |
| 댓글 추천 받음 | +5 XP | 게시글 작성자에게는 추가로 +5 XP |
| 좋아요 수신 | +2 XP | 하루 최대 50회 |
| 게시글이 주간 트렌딩 진입 | +120 XP | 1주일에 1회 제한 |
| 신고 처리 후 무혐의 판정 | +30 XP | 품질 기여도를 위한 보상 |

레벨 구간은 누적 경험치 기준으로 10단계(Lv.1~Lv.10)를 구성하고, Lv.10 도달 시 추가 배지를 지급합니다. 배지 조건은 다음과 같이 문서화합니다.

- 첫 게시물, 첫 댓글, 첫 좋아요 획득
- 누적 게시물 50/200/500회
- 누적 댓글 200/1000회
- 좋아요 1000회 이상 수신
- 커뮤니티 이벤트 주최(관리자 승인 로그 기반)

## 2. DB 스키마 및 인덱스 초안 (Step 02)
```
users
- id (PK)
- display_name
- email
- avatar_url
- rpg_level INT DEFAULT 1
- rpg_xp INT DEFAULT 0
- last_levelup_at TIMESTAMP NULL

user_stats
- user_id (PK, FK)
- posts_count INT DEFAULT 0
- comments_count INT DEFAULT 0
- likes_received INT DEFAULT 0
- badges_count INT DEFAULT 0
- activity_score INT GENERATED ALWAYS AS (posts_count*4 + comments_count*2 + likes_received) STORED
INDEX user_stats_activity_score_idx (activity_score DESC)

user_badges
- id (PK)
- user_id (FK)
- badge_code VARCHAR(32)
- earned_at TIMESTAMP DEFAULT NOW()
UNIQUE (user_id, badge_code)
INDEX user_badges_earned_at_idx (earned_at DESC)
```
마이그레이션 작성 시 `users` 테이블에 RPG 칼럼을 추가하는 ALTER, `user_stats`, `user_badges` 테이블 생성, 기본 인덱스 정의를 포함합니다.

## 3. 서비스 계층 설계 (Step 03)
`server-backend/src/services/profile/` 아래에 `profileProgressService.ts`(XP/레벨 계산)와 `badgeService.ts`(배지 판단)를 배치합니다.

핵심 함수:
- `applyActivityEvent(userId, eventType, metadata)` → 경험치 계산, 레벨업 여부 판정, 필요한 경우 배지 부여
- `calculateNextLevelProgress(xp)` → 다음 레벨에 필요한 경험치 반환
- `listEarnedBadges(userId)` → `user_badges` 조회 + 메타데이터 병합

서비스는 이벤트 버스(`events/activity-event`)에서 호출되며, XP 업데이트 후 캐시 무효화 메시지를 발행합니다.

## 4. 활동 이벤트 파이프라인 (Step 04)
게시물/댓글/좋아요 발생 시 각각의 도메인 모듈에서 `publishActivityEvent`를 호출합니다.

```
activity_event queue payload
{
  "userId": "uuid",
  "eventType": "post.created",
  "entityId": "postId",
  "metadata": { "boardId": "..." },
  "occurredAt": "ISO8601"
}
```
컨슈머는 순차 처리 후 XP/레벨/배지 로직을 실행하고, 레벨업 시 추가 알림 이벤트(`notifications.levelup`)를 발행합니다. 실패 시 재시도(3회) 후 DLQ에 누적합니다.

## 5. 프로필 API 계약 (Step 05)
| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/profile/:userId` | 레벨/경험치/배지 리스트/최근 활동 요약을 반환 (캐시 60초) |
| GET | `/api/profile/progress` | 로그인 사용자의 다음 레벨까지 남은 경험치, 신규 배지 후보를 반환 |

응답 예시는 `schemas/profile/`에 JSON Schema로 저장합니다. 권한: 자신 또는 공개 프로필만 허용. 비공개 배지의 경우 필터링 처리합니다.

## 6. 프론트엔드 UI 가이드 (Step 05-06)
- `ProfileCard`: 좌측 아바타, 우측에 레벨 배지, 경험치 진행 바, 상단에 닉네임/칭호.
- `UserTooltip`: Hover 시 미니 카드 노출 (레벨, 최근 획득 배지 3개, 활동성 수치).
- 반응형: 320px 이하에서는 진행 바를 단일 라인으로 줄이고 배지 아이콘만 표시.
- 테마: 다크 모드 대비 색상 쌍을 팔레트로 정의 (`theme/rpg.ts`).

## 7. 알림 및 모니터링 (Step 07)
- 레벨업 토스트 → `toast.success("Lv.X 달성! 새로운 칭호를 확인하세요")`
- 알림 센터에 `achievement` 타입 이벤트 저장, 읽음 처리 포함.
- 메트릭: `rpg.levelup.count`, `rpg.badge.earned`, `rpg.xp.apply.duration`
- 로그: 실패 시 `warn` 레벨로 이벤트 payload와 함께 남기고 DLQ 상태를 Kibana 대시보드에 표시.
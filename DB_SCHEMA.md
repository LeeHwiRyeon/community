# 🗄️ 데이터베이스 스키마 참조 문서

**Community Platform v1.1**의 완전한 데이터베이스 스키마 문서입니다. 모든 테이블 구조와 관계를 한글로 명확하게 설명합니다.

## 📋 **데이터베이스 정보**
- **데이터베이스**: MariaDB/MySQL (utf8mb4)
- **인코딩**: UTF-8 완전 지원
- **TIMESTAMP 기본값**: `CURRENT_TIMESTAMP` (필요 시 자동 업데이트)
- **자동 생성**: `initSchema()` 함수에서 테이블이 존재하지 않을 경우 자동 생성

## 📊 **테이블 개요 (한눈에 보기)**

| 테이블명                | 목적                | 주요 특징                                      |
| ---------------------- | ------------------ | --------------------------------------------- |
| boards                 | 게시판 메타데이터   | 소프트 삭제(`deleted`), 정렬 인덱스            |
| posts                  | 게시글 본문/메타    | 전문검색(title,content), board_id 필터 인덱스  |
| post_views             | 조회수 누적         | 배치 플러시, 게시글당 단일 행                  |
| users                  | 사용자 정보         | 첫 사용자는 관리자, 이메일 고유                |
| user_social_identities | 소셜 계정 연결      | (제공자,제공자_사용자_ID) 고유                 |
| user_stats             | 사용자 활동 집계    | 경험치/레벨 메타, activity_score 생성 컬럼     |
| user_badges            | 배지 획득 이력      | (사용자_ID,배지_코드) 고유, 획득일 인덱스      |
| announcements          | 공지사항            | 기간 필터 + 우선순위, 소프트 삭제 + 히스토리   |
| events                 | 이벤트 정보         | 상태/시간 필터, 소프트 삭제 + 히스토리         |
| announcement_history   | 공지사항 변경 기록  | 추가 전용 로그                                |
| event_history          | 이벤트 변경 기록    | 추가 전용 로그                                |
| auth_audit             | 인증 감사 로그      | 로그인/갱신/연결 이벤트 기록                  |
| votes                  | 투표 기록           | 사용자/대상/투표유형, 중복 투표 방지           |
| broadcasts             | 방송 정보           | 스트림 URL, 라이브 상태, 일정, 게시글 연동     |

## 📋 **boards (게시판 테이블)**
| 컬럼명      | 데이터 타입        | 설명                |
| ---------- | ----------------- | ------------------- |
| id         | VARCHAR(64) PK    | 게시판 고유 식별자   |
| title      | VARCHAR(200)      | 게시판 제목         |
| ordering   | INT DEFAULT 1000  | UI 정렬 우선순위 |
| deleted    | TINYINT DEFAULT 0 | 1=숨김           |
| created_at | TIMESTAMP         | 생성             |
| updated_at | TIMESTAMP         | 수정             |

## posts
(게시글 본문 및 메타)
| 컬럼       | 타입                     | 설명               |
| ---------- | ------------------------ | ------------------ |
| id         | VARCHAR(64) PK           |
| board_id   | VARCHAR(64) FK boards.id |
| title      | VARCHAR(500) NOT NULL    |
| content    | MEDIUMTEXT               |
| date       | DATE                     | 임의 날짜 메타     |
| tag        | VARCHAR(100)             |
| thumb      | VARCHAR(500)             | 썸네일 URL         |
| author     | VARCHAR(100)             | 표시명 (익명 허용) |
| category   | VARCHAR(200)             | UX 분류            |
| deleted    | TINYINT DEFAULT 0        |
| created_at | TIMESTAMP                |
| updated_at | TIMESTAMP                |

FULLTEXT: (title, content) - 지원 안되면 설치 환경 무시.

## post_views
| 컬럼       | 타입           | 설명        |
| ---------- | -------------- | ----------- |
| post_id    | VARCHAR(64) PK | posts.id FK |
| views      | INT DEFAULT 0  | 누적        |
| updated_at | TIMESTAMP      |

## users
| 컬럼            | 타입                         | 설명                 |
| --------------- | ---------------------------- | -------------------- |
| id              | BIGINT PK AUTO_INCREMENT     |
| display_name    | VARCHAR(200)                 |
| email           | VARCHAR(320) UNIQUE NULL     |
| role            | VARCHAR(32) DEFAULT 'user'   | user/moderator/admin |
| status          | VARCHAR(32) DEFAULT 'active' |
| rpg_level       | INT DEFAULT 1                | RPG 레벨             |
| rpg_xp          | INT DEFAULT 0                | 누적 경험치          |
| last_levelup_at | TIMESTAMP NULL               | 최근 레벨업 시각     |
| created_at      | TIMESTAMP                    |
| updated_at      | TIMESTAMP                    |

## user_stats
| 컬럼           | 타입                                                                               | 설명            |
| -------------- | ---------------------------------------------------------------------------------- | --------------- |
| user_id        | BIGINT PK FK users.id                                                              | 사용자          |
| posts_count    | INT DEFAULT 0                                                                      | 게시글 숫자     |
| comments_count | INT DEFAULT 0                                                                      | 댓글 숫자       |
| likes_received | INT DEFAULT 0                                                                      | 받은 좋아요     |
| badges_count   | INT DEFAULT 0                                                                      | 획득 배지 수    |
| activity_score | INT STORED GENERATED ALWAYS AS (posts_count*4 + comments_count*2 + likes_received) | 리더보드용 점수 |
| updated_at     | TIMESTAMP DEFAULT CURRENT_TIMESTAMP                                                | 최신 갱신       |

INDEX: `user_stats_activity_score_idx (activity_score DESC)`

## user_badges
| 컬럼       | 타입                                | 설명        |
| ---------- | ----------------------------------- | ----------- |
| id         | BIGINT PK AUTO_INCREMENT            |
| user_id    | BIGINT FK users.id                  | 배지 소유자 |
| badge_code | VARCHAR(32)                         | 배지 식별자 |
| earned_at  | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | 획득 시각   |

UNIQUE: `(user_id, badge_code)`
INDEX: `user_badges_earned_at_idx (earned_at DESC)`

## user_social_identities
| 컬럼              | 타입                     | 설명 |
| ----------------- | ------------------------ | ---- |
| id                | BIGINT PK AUTO_INCREMENT |
| user_id           | BIGINT FK users.id       |
| provider          | VARCHAR(32)              |
| provider_user_id  | VARCHAR(190)             |
| email_at_provider | VARCHAR(320) NULL        |
| profile_json      | TEXT NULL                |
| created_at        | TIMESTAMP                |

UNIQUE: (provider, provider_user_id)

## announcements
| 컬럼       | 타입                     | 설명 |
| ---------- | ------------------------ | ---- |
| id         | BIGINT PK AUTO_INCREMENT |
| slug       | VARCHAR(120) UNIQUE NULL |
| title      | VARCHAR(300) NOT NULL    |
| body       | MEDIUMTEXT               |
| starts_at  | DATETIME NULL            |
| ends_at    | DATETIME NULL            |
| priority   | INT DEFAULT 100          |
| active     | TINYINT DEFAULT 1        |
| deleted    | TINYINT DEFAULT 0        |
| created_at | TIMESTAMP                |
| updated_at | TIMESTAMP                |

## events
| 컬럼       | 타입                          | 설명 |
| ---------- | ----------------------------- | ---- |
| id         | BIGINT PK AUTO_INCREMENT      |
| title      | VARCHAR(300) NOT NULL         |
| body       | MEDIUMTEXT                    |
| starts_at  | DATETIME NULL                 |
| ends_at    | DATETIME NULL                 |
| location   | VARCHAR(300)                  |
| status     | VARCHAR(32) DEFAULT 'planned' |
| meta_json  | TEXT                          |
| deleted    | TINYINT DEFAULT 0             |
| created_at | TIMESTAMP                     |
| updated_at | TIMESTAMP                     |

## announcement_history / event_history
공통 컬럼:
| 컬럼                       | 타입                     | 설명                    |
| -------------------------- | ------------------------ | ----------------------- |
| id                         | BIGINT PK AUTO_INCREMENT |
| announcement_id / event_id | BIGINT                   | 원본 참조               |
| action                     | VARCHAR(32)              | create/update/delete    |
| snapshot                   | MEDIUMTEXT               | JSON 직렬화 (원본 전체) |
| actor_user_id              | BIGINT NULL              | 수행자                  |
| created_at                 | TIMESTAMP                |

## auth_audit
| 컬럼        | 타입                     | 설명                                                                 |
| ----------- | ------------------------ | -------------------------------------------------------------------- |
| id          | BIGINT PK AUTO_INCREMENT |
| user_id     | BIGINT NULL              |
| provider    | VARCHAR(32) NULL         |
| event       | VARCHAR(64)              | login_success / login_fail / refresh_success / login_link_success 등 |
| ip          | VARCHAR(100)             |
| user_agent  | VARCHAR(300)             |
| detail_json | TEXT                     | 추가 정보                                                            |
| created_at  | TIMESTAMP                |

## votes
| 컬럼        | 타입                     | 설명                    |
| ----------- | ------------------------ | ----------------------- |
| id          | BIGINT PK AUTO_INCREMENT |
| user_id     | BIGINT FK users.id       | 투표자                  |
| target_type | VARCHAR(16)              | 'post' or 'comment'     |
| target_id   | VARCHAR(64)              | posts.id or comments.id |
| vote_type   | VARCHAR(4)               | 'up' or 'down'          |
| created_at  | TIMESTAMP                | 투표 시각               |

UNIQUE: `(user_id, target_type, target_id)` - 중복 투표 방지
INDEX: `votes_target_idx (target_type, target_id, vote_type)` - 투표 수 집계용

## broadcasts
| 컬럼       | 타입                     | 설명                        |
| ---------- | ------------------------ | --------------------------- |
| id         | BIGINT PK AUTO_INCREMENT |
| post_id    | VARCHAR(64) FK posts.id  | 연결된 게시물               |
| stream_url | VARCHAR(500)             | 스트리밍 URL                |
| is_live    | TINYINT DEFAULT 0        | 1=라이브 중                 |
| schedule   | TIMESTAMP NULL           | 방송 예정 시간              |
| platform   | VARCHAR(50)              | 플랫폼 (Twitch, YouTube 등) |
| streamer   | VARCHAR(100)             | 스트리머 이름               |
| created_at | TIMESTAMP                |
| updated_at | TIMESTAMP                |

INDEX: `broadcasts_post_id_idx (post_id)`, `broadcasts_schedule_idx (schedule)`

## 인덱스 & 제약 요약
| Table                  | Primary | Unique                          | Secondary / Fulltext                        | Notes                                             |
| ---------------------- | ------- | ------------------------------- | ------------------------------------------- | ------------------------------------------------- |
| boards                 | id      | (id)                            | (ordering)                                  | soft delete flag only (no FK yet)                 |
| posts                  | id      | (id)                            | (board_id,deleted), FULLTEXT(title,content) | consider (board_id,created_at) for board timeline |
| post_views             | post_id | (post_id)                       | -                                           | updated via batch flush                           |
| users                  | id      | email                           | -                                           | add (role) if role filtered queries 증가          |
| user_social_identities | id      | (provider,provider_user_id)     | (user_id)                                   | fast linking lookup                               |
| user_stats             | user_id | (user_id)                       | (activity_score DESC)                       | generated column, 주간 리더보드에 활용            |
| user_badges            | id      | (user_id,badge_code)            | (user_id,earned_at DESC)                    | 배지 타임라인, user_id FK 예정                    |
| announcements          | id      | slug                            | (active,starts_at,ends_at)                  | maybe (priority DESC, starts_at) later            |
| events                 | id      | -                               | (status,starts_at)                          | add (starts_at) alone if range scan heavy         |
| announcement_history   | id      | -                               | (announcement_id)                           | partition/time prune candidate                    |
| event_history          | id      | -                               | (event_id)                                  | 〃                                                |
| auth_audit             | id      | -                               | (user_id,created_at),(event,created_at)     | high write; consider monthly partition            |
| votes                  | id      | (user_id,target_type,target_id) | (target_type,target_id,vote_type)           | 중복 투표 방지, 집계 쿼리 최적화                  |

## FK 제안 (현재 코드 레벨 검증 후 적용 예정)
| Relation                                                 | Proposed ON DELETE           | Reason                        |
| -------------------------------------------------------- | ---------------------------- | ----------------------------- |
| posts.board_id -> boards.id                              | RESTRICT (또는 CASCADE 논의) | 게시판 삭제 정책 명확 후 적용 |
| post_views.post_id -> posts.id                           | CASCADE                      | 고아 row 방지                 |
| user_social_identities.user_id -> users.id               | CASCADE                      | 사용자 제거 시 연결 자동 정리 |
| announcement_history.announcement_id -> announcements.id | CASCADE                      | 히스토리 일관성               |
| event_history.event_id -> events.id                      | CASCADE                      | 〃                            |
| auth_audit.user_id -> users.id                           | SET NULL                     | 감사 레코드 보존 우선         |
| votes.user_id -> users.id                                | CASCADE                      | 투표자 제거 시 투표 삭제      |
| broadcasts.post_id -> posts.id                           | CASCADE                      | 게시물 삭제 시 방송 정보 삭제 |

적용 순서: 1) 데이터 무결성 사전 점검 (LEFT JOIN orphan 탐지) 2) 짧은 락 시간 확보 (off-peak) 3) FK 추가 (ALGORITHM=INPLACE 가능 여부 확인) 4) 모니터링 (deadlock / error rate) 5) 문서 갱신.

## 변경/마이그레이션 가이드
1. 새 컬럼 추가: `ALTER TABLE <tbl> ADD COLUMN ...` (NOT NULL 추가 시 DEFAULT 지정)
2. 컬럼 유형 변경 시: 다운타임 최소화 위해 새 컬럼 추가 → 데이터 복사 → 스왑 → 구컬럼 삭제
3. 대용량 마이그레이션: 배치 단위 (LIMIT/OFFSET 대신 PK range) + 백업
4. 인덱스 추가: 쓰기 증가 영향 고려. off-peak 적용
5. Rollback: 변경 전 스키마 스냅샷(DDL dump) 저장 후 역순 실행

## 설계 결정(요약)
- Soft delete: 복원/감사 필요 + 물리 삭제 지연 (이벤트 기록 유지)
- History append-only: 변경 추적 & 롤백 레퍼런스
- auth_audit: 보안/포렌식, 비동기 실패 허용 (핵심 기능과 분리)
- post_views 분리: 쓰기 폭주 시 posts 락 회피

## 향후 개선 후보
- partition (history/audit 테이블, 기간별)
- multi-column 복합 인덱스 튜닝 (검색 패턴 안정 후)
- 이벤트 sourcing 일부 전환 (필요 시)
- row-based CDC 적용 (실시간 알림 파이프라인)


## Search Fulltext Migration
1. Add FULLTEXT index on `(title, content)` in staging database.
2. Deploy fallback flag `approx=1` to bypass FULLTEXT when index unavailable.
3. After verification, update `/api/boards/:id/posts` to prefer FULLTEXT and remove LIKE fallback for MySQL 5.
4. Document rollback: drop index and restore LIKE queries.

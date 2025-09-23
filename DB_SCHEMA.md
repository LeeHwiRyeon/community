# Database Schema Reference

간결하면서 추적 가능한 스키마 레퍼런스. 생성 로직은 `initSchema()` 내부에 있으며 존재하지 않을 경우 자동 생성됩니다.

> DB: MariaDB/MySQL (utf8mb4). TIMESTAMP 기본값은 `CURRENT_TIMESTAMP` (필요 시 on update 포함).

## Quick Index (테이블 한눈에)
| Table                  | Purpose            | Key Points                                    |
| ---------------------- | ------------------ | --------------------------------------------- |
| boards                 | 게시판 메타        | soft delete(`deleted`), ordering 인덱스       |
| posts                  | 게시글 본문/메타   | FULLTEXT(title,content), board_id 필터 인덱스 |
| post_views             | 조회수 누적        | flush 배치, 단일 row per post                 |
| users                  | 사용자             | 첫 사용자 admin, email UNIQUE                 |
| user_social_identities | 소셜 계정 링크     | (provider,provider_user_id) UNIQUE            |
| announcements          | 공지               | 기간 필터 + priority, soft delete + history   |
| events                 | 이벤트             | status/time 필터, soft delete + history       |
| announcement_history   | 공지 변경 스냅샷   | append-only                                   |
| event_history          | 이벤트 변경 스냅샷 | append-only                                   |
| auth_audit             | 인증 감사          | login/refresh/link 이벤트 기록                |

## boards
| 컬럼       | 타입              | 설명             |
| ---------- | ----------------- | ---------------- |
| id         | VARCHAR(64) PK    | 게시판 식별자    |
| title      | VARCHAR(200)      | 제목             |
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
| 컬럼         | 타입                         | 설명                 |
| ------------ | ---------------------------- | -------------------- |
| id           | BIGINT PK AUTO_INCREMENT     |
| display_name | VARCHAR(200)                 |
| email        | VARCHAR(320) UNIQUE NULL     |
| role         | VARCHAR(32) DEFAULT 'user'   | user/moderator/admin |
| status       | VARCHAR(32) DEFAULT 'active' |
| created_at   | TIMESTAMP                    |
| updated_at   | TIMESTAMP                    |

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

## 인덱스 & 제약 요약
| Table                  | Primary | Unique                      | Secondary / Fulltext                        | Notes                                             |
| ---------------------- | ------- | --------------------------- | ------------------------------------------- | ------------------------------------------------- |
| boards                 | id      | (id)                        | (ordering)                                  | soft delete flag only (no FK yet)                 |
| posts                  | id      | (id)                        | (board_id,deleted), FULLTEXT(title,content) | consider (board_id,created_at) for board timeline |
| post_views             | post_id | (post_id)                   | -                                           | updated via batch flush                           |
| users                  | id      | email                       | -                                           | add (role) if role filtered queries 증가          |
| user_social_identities | id      | (provider,provider_user_id) | (user_id)                                   | fast linking lookup                               |
| announcements          | id      | slug                        | (active,starts_at,ends_at)                  | maybe (priority DESC, starts_at) later            |
| events                 | id      | -                           | (status,starts_at)                          | add (starts_at) alone if range scan heavy         |
| announcement_history   | id      | -                           | (announcement_id)                           | partition/time prune candidate                    |
| event_history          | id      | -                           | (event_id)                                  | 〃                                                |
| auth_audit             | id      | -                           | (user_id,created_at),(event,created_at)     | high write; consider monthly partition            |

## FK 제안 (현재 코드 레벨 검증 후 적용 예정)
| Relation                                                 | Proposed ON DELETE           | Reason                        |
| -------------------------------------------------------- | ---------------------------- | ----------------------------- |
| posts.board_id -> boards.id                              | RESTRICT (또는 CASCADE 논의) | 게시판 삭제 정책 명확 후 적용 |
| post_views.post_id -> posts.id                           | CASCADE                      | 고아 row 방지                 |
| user_social_identities.user_id -> users.id               | CASCADE                      | 사용자 제거 시 연결 자동 정리 |
| announcement_history.announcement_id -> announcements.id | CASCADE                      | 히스토리 일관성               |
| event_history.event_id -> events.id                      | CASCADE                      | 〃                            |
| auth_audit.user_id -> users.id                           | SET NULL                     | 감사 레코드 보존 우선         |

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

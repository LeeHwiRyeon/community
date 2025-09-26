# 팔로우·태그 데이터 모델 계획 (Phase 1 Step 29)

## 1. 팔로우 관계 스키마
- 테이블 `user_follows` : `{ follower_id BIGINT, followee_id BIGINT, created_at TIMESTAMP }`, PK는 (follower_id, followee_id).
- 인덱스: `followee_id, created_at DESC`로 팬 목록 조회 최적화.
- API: `POST /api/users/:id/follow`, `DELETE /api/users/:id/follow`, `GET /api/users/:id/followers`.
- 알림: 팔로우 발생 시 `notifications.follow` 생성, 하루에 최대 50회 제한.

## 2. 피드 구성
- 개인화 가중치: 기본 점수 + 팔로우 관계 가중치 1.5배 반영.
- 캐시: Redis Sorted Set `feed:<userId>`에 게시물 ID 저장, TTL 5분.
- 무효화: 새 게시물, 삭제, 설정 변경 시 해당 사용자 피드를 즉시 삭제.

## 3. 태그 관리
- `tags { id, label, normalized_label, usage_count }`, `post_tags { post_id, tag_id }`.
- 태그 병합: 관리자 UI에서 `POST /api/tags/:id/merge` 로 병합 대상 지정.
- 추천: 최근 인기 태그 + 개인화 선호 태그를 혼합한 추천을 제공.
- 통계: `tag_stats_daily`에 일별 사용량을 저장하여 추세 분석.

## 4. 모니터링
- 메트릭: `follow.new`, `follow.unfollow`, `tag.used`, `tag.merge`.
- 대시보드: 팔로우 상위 사용자, 태그 Top 20, 일간 성장률을 시각화.
- 개인정보 보호: 팔로우 목록 공개 여부를 사용자 설정(비공개 시 팔로워 수만 노출).

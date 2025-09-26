# RPG 지표 대시보드 설계 (Phase 1 Step 37)

## 1. 목적
- 게이미피케이션 기능(RPG 레벨/배지) 도입 이후 참여 지표를 실시간으로 확인할 수 있는 운영 대시보드 초안을 정의한다.
- 레벨업, 배지 획득, XP 지급에 대한 흐름을 한 눈에 파악하여 성장 정체나 규칙 오작동을 빠르게 발견한다.

## 2. 수집 파이프라인
- server-backend/src/metrics-rpg.js가 ecordRpgProgressEvent를 통해 XP 지급, 레벨업, 배지 이벤트를 수집한다.
  - 모든 이벤트는 7일 슬라이딩 윈도우로 메모리에 유지되며 최대 기록 수(RPG_METRICS_HISTORY, 기본 200)를 제한한다.
  - untimeMetrics에 다음 카운터를 반영한다: pgXpEvents, pgXpAwardTotal, pgXpAwardMax, pgLevelUpCount, pgBadgeUnlockCount, pgLastEventAt.
  - 레벨업/배지 획득 시 logger.event()로 pg.levelup, pg.badge.unlocked 이벤트를 남겨 Kibana 검색 지표로도 활용한다.
- 서비스 계층(profile-progress-service.js)에서 활동 이벤트 처리 후 ecordRpgProgressEvent를 호출하여 파이프라인으로 데이터를 전달한다.
- 테스트 전용 헬퍼 esetRpgMetricsForTest()로 상태 초기화를 지원하여 CI에서 결정적인 결과를 보장한다.

## 3. 대시보드 위젯 구성 초안
| 영역 | 시각화 | 설명 |
| --- | --- | --- |
| 레벨업 트렌드 | 라인/에어리어 차트 | getRpgDashboardSnapshot().levelUps.byDay 데이터를 이용해 일자별 레벨업 횟수를 표시한다. 7일 이동평균선을 추가해 변동성을 확인한다. |
| 배지 획득 분포 | 막대 차트 | snapshot.badges.distribution을 배지 코드 기준으로 정렬해 상위 10개 배지 획득 현황을 노출한다. |
| XP 지급 요약 | 카드형 지표 | snapshot.xp.summary의 평균/최댓값/카운트를 카드 3개로 표현하고, untimeMetrics.rpgXpAwardMax와 비교해 이상치를 감지한다. |
| 실시간 알림 피드 | 리스트 | 최근 20개의 레벨업 및 배지 로그(logger.event)를 스트리밍하여 운영자가 수동으로 상태를 파악할 수 있도록 한다. |

## 4. 메트릭 정의 및 임계값
- **레벨업 이상 탐지**: 1시간 내 레벨업 횟수가 aseline * 3을 초과하면 Slack 경보 전송.
- **배지 획득 분포**: 특정 배지 비중이 40%를 넘으면 규칙/조건 점검.
- **XP 지급 검증**: snapshot.xp.summary.max가 200 이상이면 수동 감사 리스트에 추가.
- **데이터 최신성**: untimeMetrics.rpgLastEventAt이 30분 이상 갱신되지 않으면 수집 파이프라인 확인.

## 5. 운영 절차
1. 스테이징에서 
ode --test server-backend/tests/unit/profile-progress-service.test.js로 회귀검증 후 배포.
2. 배포 직후 getRpgDashboardSnapshot() API Hook(추후 /internal/metrics/rpg로 노출 예정)을 호출해 위젯 데이터가 생성되는지 확인.
3. Kibana에서 event:"rpg.levelup" 쿼리로 로그 이벤트 흐름을 모니터링하고 대시보드 차트와 일치하는지 검증.
4. 위젯 초기 버전은 운영용 Admin 콘솔에 iframe 형태로 삽입하고, 추후 Grafana/Datadog으로 이관한다.

## 6. 후속 작업
- 베타 기간에는 이벤트 데이터를 S3로 주 1회 백업하여 장기 추세 분석 기반을 마련한다.
- untimeMetrics 인메모리 한계를 넘는 경우를 대비하여 Redis Pub/Sub 스트림 연동을 검토한다.
- 배지별 세부 속성(획득 조건, 난이도)을 API 응답에 포함해 위젯에서 필터링 가능하도록 확장한다.

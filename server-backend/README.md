# Community Backend (Express + MariaDB)

## Setup

1. Copy `.env.example` to `.env` and set DB credentials.
2. Install dependencies:
```bash
npm install
```
3. Initialize schema & import initial JSON data:
```bash
npm run import:init
```
4. Start server:
```bash
npm run start
```
Server default port: 50000.

## API Endpoints

- `GET /api/trending (추가), GET /api/home (추가)`
- `(개발 전용) POST /api/mock/generate, POST /api/mock/reset, GET /api/mock/status`
- `GET /api/help` (요약/셀프디스커버리 엔드포인트, 로깅 제외)

## DB Schema (요약)
```

#### 목업 데이터 유틸 (개발/테스트 전용)

다음 엔드포인트는 NODE_ENV=test 또는 ENV_ALLOW_MOCK=1에서만 동작합니다.

  - count 기본 20, 최대 1000
  - 생성되는 글은 `tag='mock'`으로 표시되며, 일부는 임의의 조회수도 함께 채워집니다.
	- 옵션(선택):
		- daysBack(number, 기본 7): 최근 N일 이내 랜덤 날짜
		- viewsMin/viewsMax(number): 초기 조회수 범위
		- thumbsRatio(0~1): 썸네일 부여 비율
		- titlePrefix(string | string[]): 제목 앞에 접두사(배열이면 랜덤 선택)
		- categoryPool(string[]): 카테고리 후보 목록
		- authorPool(string[]): 작성자 후보 목록
		- boardWeights(object): { [boardId]: weight } 비율로 보드 분포 가중치
		- contentLengthMin/Max(number): 본문 길이 범위
		- seed(any): 시드(선택, seedrandom 존재 시)

예시(한 번만 설정):

1) PowerShell
	- `$env:ENV_ALLOW_MOCK='1'`
2) 목업 100개 생성
	- `Invoke-RestMethod -Method Post -Uri 'http://localhost:50000/api/mock/generate' -Body (@{count=100} | ConvertTo-Json) -ContentType 'application/json'`
	- 옵션 예시: `Invoke-RestMethod -Method Post -Uri 'http://localhost:50000/api/mock/generate' -Body (@{count=200; daysBack=30; viewsMin=100; viewsMax=5000; thumbsRatio=0.6; titlePrefix='[테스트]|[목업]'; categoryPool='news,general,image'; authorPool='에디터,게스트'; contentLengthMin=80; contentLengthMax=800} | ConvertTo-Json) -ContentType 'application/json'`
	- PowerShell 권장 패턴(가독성):
	```powershell
	$body = @{ count = 50; daysBack = 14; viewsMin = 10; viewsMax = 2000; thumbsRatio = 0.6; titlePrefix = @('[TEST]','[MOCK]') }
	$json = $body | ConvertTo-Json -Depth 4 -Compress
	Invoke-RestMethod -Method Post -Uri 'http://localhost:50000/api/mock/generate' -Body $json -ContentType 'application/json'
	```
3) 상태 확인
	- `Invoke-RestMethod -Uri 'http://localhost:50000/api/mock/status'`
4) 리셋
	- `Invoke-RestMethod -Method Post -Uri 'http://localhost:50000/api/mock/reset'`

#### Windows에서 서버 재시작(통일된 방법)

- 포트 50000 점유 프로세스 종료만: `npm run stop:win`
- 재시작(동일 포트, .env 사용): `npm run restart:win`
  - 목업 기능 켜고 시작하려면 스크립트를 직접: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/win-restart.ps1 -Port 50000 -Mock`
```

## Notes
- Soft delete 는 deleted=1 플래그.
- `posts-map` 은 모든 posts를 불러오므로 운영 시 캐싱 고려.
- 조회수는 write-heavy -> 추후 batch 처리 또는 Redis 고려 가능.
 \- 보안/로그 추가 사항:
	 - 시드 고정: `seedrandom` → mock 생성 시 body.seed 지정하면 동일한 분포 재현
	 - Trending 캐싱: /api/trending 30초 메모리 캐시 (응답에 cache, ttlMs 필드)
	 - Mock 자동 정리: `MOCK_MAX_AGE_DAYS` (기본 30) 보다 오래된 tag='mock' 레코드 시간당 1회 삭제
	 - 요청 로깅 확장: `/api/help` 제외 모든 `/api` 요청에 대해 start/done(or abort) 라인 기록
		 - 필드: m(메소드), p(경로), s(상태코드), ms(총 소요 ms), ip, ua(잘린 UA), reqBytes, respBytes, aborted(bool)
	 - 중단(클라이언트 연결 종료) 발생 시 `req.abort` 기록 (finish 미도달)
	 - JSON 로그 모드: `LOG_JSON=1` 설정 시 각 라인이 구조적 JSON (`ts,level,msg,추가필드`)
	 - 기본 모드: `[ISO] LEVEL msg {meta...}` 포맷
	 - 보안 패턴 필터: 단순 SQL/XSS 패턴(UNION SELECT, <script 등) 발견 시 400 + `secBlocked` 메트릭 증가
	 - Helmet 통합: 기본 활성 (CSP 비활성화는 `DISABLE_CSP=1`, Helmet 전체 비활성화는 `DISABLE_HELMET=1`)
	 - 프로세스 이벤트 로깅: signal, unhandledRejection, uncaughtException, exit 모두 runtime.log 기록
	 - 실행 감사: `npm run audit:security` (심각도 점검; CI 실패 방지는 || exit 0 처리)
	 - 서버 시작/종료 확인: `evt server.listen`, `evt process.exit` 로그로 추적
	 - 재시작 스크립트(win-restart.ps1) 포트 강제 점유 해제 및 백그라운드 기동 지원

### /api/help
간단한 기능 맵 / 로깅모드 / 보안 설정 상태를 반환. 운영 중 셀프 디스커버리용. (의도적으로 요청 로깅 제외)

예:
```
GET /api/help -> {
	"ok": true,
	"endpoints": { "health": "/api/health", ... },
	"logging": { "jsonMode": false, "fields": ["m","p",...] },
	"security": { "helmet": "enabled", "csp": "enabled" }
}
```

### 운영 시 추가 권장
- 환경변수 `DISABLE_CSP=1` 을 기본적으로 사용하지 말고 점진적으로 CSP 강화
- 필요 시 보안 필터를 WAF 또는 전문 라이브러리(helmet, xss-filters)로 교체
- `secBlocked` 급증 시 IP 기반 rate limit 또는 차단 구현 고려
- 주기적 `npm run audit:security` + 변경 이력 점검

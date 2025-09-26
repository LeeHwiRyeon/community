# 사용자 피드백 수집 시스템 계획 (Microsoft Clarity 기반)

## 1. 도구 선택 및 범위
- 1차 도입: Microsoft Clarity (무료, 세션 녹화/히트맵 제공).
- 백업 플랜: FullStory/Hotjar (보안 정책 및 예산 확인 후 단계적 확장).
- 적용 페이지: 홈, 게시판 목록, 게시글 보기, 검색 결과, 작성/편집.

## 2. 기술 통합 체크리스트
- 프론트엔드: `frontend/src/index.tsx`에 환경변수 `VITE_ENABLE_CLARITY` 조건부 스크립트 삽입.
- 스크립트 로드: `<script type="text/javascript" defer>` 형태, 클라이언트 ID는 `.env`(`CLARITY_PROJECT_ID`)로 관리.
- 익명화: IP 마스킹, 키 입력 데이터 캡처 비활성화, 민감 영역(입력 필드) `data-clarity-mask=true` 적용.
- Opt-out: 환경설정 모달에 "사용자 행동 분석 비활성화" 토글 제공 (`localStorage` 플래그로 persist).

## 3. 데이터 활용 및 보안
- 세션 녹화 접근 권한: PM/UX 리서처로 제한, 로그인 SSO 적용.
- 보존 기간: 기본 30일, 필요 시 다운로드 후 내부 보안 스토리지 이동.
- 개인정보 영향 평가(PIA) 문서화 및 보안팀 검토.

## 4. 운영 워크플로우
1. 기능 배포 전 스테이징에서 스크립트 정상 동작 확인.
2. 주간 리포트: 주요 이탈 구간, 클릭 히트맵, 검색 UX 개선 인사이트 정리.
3. 피드백 아카이빙: `docs/ux-findings/`에 스프린트별 요약 기록.

## 5. QA & 모니터링
- Playwright e2e에 Clarity 스크립트 주입 여부 스냅샷 추가.
- Lighthouse로 성능 영향 측정 (TTI/TBT 변화 < 5% 목표).
- 로그: `analytics.clarity.optout`, `analytics.clarity.scriptLoaded` 이벤트를 프론트 로깅 시스템에 기록.

## 6. 향후 확장
- A/B 테스트 플랫폼과 연동하여 이벤트 시퀀스 비교.
- 사용자 인터뷰 예약 흐름과 Clarity 세션 링크 연결.
- GDPR/CCPA 대응을 위한 지역별 Consent Manager 통합.

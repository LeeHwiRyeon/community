# 접근성 개선 체크리스트 (Phase 1 Step 27)

## 1. 키보드 내비게이션
- 모든 툴바/패널은 `Tab` 순서로 접근 가능해야 하고 `Shift+Tab`으로 역방향 이동 가능.
- ESC 키로 팝업/모달을 닫고 본문으로 포커스를 되돌릴 수 있게 구현.
- Playwright 스크립트로 키보드만 사용한 플로우를 주기적으로 검증.

## 2. ARIA 및 스크린리더 지원
- 버튼과 토글에는 `aria-label` 또는 시각적 라벨을 연결.
- 실시간 상태(자동 저장 등)는 `aria-live="polite"` 영역을 통해 알림.
- Tooltip, Badge 등은 `role="tooltip"`과 적절한 `aria-describedby` 관계를 가진다.

## 3. 색 대비 & 테마
- 텍스트 대비는 WCAG 2.1 AA 기준(4.5:1 이상)을 만족.
- 경고/강조 색상(`--color-accent`, `--color-warning`)은 라이트/다크 모드 모두에서 대비를 검증.
- Percy + axe-core로 시각 회귀 및 접근성 정적 검사를 병행.

## 4. 모바일 접근성
- 터치 타겟 크기는 최소 48px × 48px.
- 가로 스크롤이 필요한 영역은 시각적으로 표시하고 키보드로도 접근 가능하도록 처리.
- iOS/Android에서 VoiceOver/TalkBack으로 주요 플로우를 QA 체크리스트화.

## 5. 진행 상태 및 로딩 UI
- 진행 표시줄은 `role="progressbar"`와 `aria-valuemin/max/now` 속성을 포함.
- Skeleton 로딩 컴포넌트는 `aria-busy="true"`로 표시하고 완료 시 false로 변경.
- 상태 변화 알림은 `aria-live` 영역을 통해 사용자에게 즉시 전달.

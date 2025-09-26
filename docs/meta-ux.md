# 메타데이터 및 템플릿 UX 설계 (Phase 1 Steps 24-25)

## 1. 제목·태그·SEO 제약 (Step 24)
- **제목 규칙**: 최소 5자, 최대 150자. 금지어 목록(`metadata/blocked_terms.json`)은 저장 시 필터링.
- **요약/본문 발췌**: 요약은 최대 240자, 본문에서 처음 160자를 기본값으로 제안하되 사용자가 수정 가능.
- **태그 정책**:
  - 최소 1개, 최대 8개.
  - 각 태그는 2~25자, 특수문자는 `-`와 `_`만 허용.
  - 중복 태그는 자동 병합.
- **Taxonomy API**:
  - `GET /api/taxonomy/categories`는 10분 캐시, 관리자가 강제로 리프레시 가능.
  - `GET /api/taxonomy/search?q=`는 `{ id, type, label, usageCount }` 목록을 반환하고 사용 횟수 기준 정렬.
- **SEO 히스토리**: 제목/요약/태그 변경 시 `post_meta_history` 테이블에 diff JSON을 저장하여 롤백 근거 확보.

## 2. 자동완성 & API 계약 (Step 24)
- 자동완성 케이스: 최근 사용 태그, 조직 전체 인기 태그, 개인화 추천(`user_tag_pref`).
- 요청 제한: 1초에 5회로 제한하고, 초과 시 429와 재시도 대기 시간을 안내.
- SEO 메타 태그: SSR 단계에서 `<meta name="description">`, `<meta property="og:*">`를 동적으로 생성.

## 3. 편의 기능 UX (Step 25)
- **자동 저장 배지**: "자동 저장됨 HH:MM" 형식으로 표시하며, 실패 시 경고 배지로 전환.
- **미리보기 경로**: `/preview` 페이지에서 기사 레이아웃과 동일한 스타일을 확인, 다크 모드 토글 제공.
- **단축키 도움말**: `Ctrl+/`를 누르면 단축키 오버레이(`frontend/src/components/ShortcutHelp.tsx`) 표시.
- **템플릿 관리**:
  - API: `GET/POST/PUT/DELETE /api/templates`.
  - 권한: 작성자는 본인 템플릿만, 모더레이터는 조직 공유 템플릿 편집 가능.
  - 플레이스홀더: `{{title}}`, `{{summary}}`, `{{tags}}` 등 기본 변수를 제공하고, 사용자 정의 필드도 허용.
- **문서화**: 템플릿 작성 가이드를 위키에 연결하고, 변경 시 Changelog를 남긴다.

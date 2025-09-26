# WYSIWYG ?먮뵒???좏깮 諛?UX ?ㅺ퀎 (Phase 1 Step 18-23)

## 1. ?꾨낫 鍮꾧탳 諛??좎젙 (Step 18)
| ??ぉ | Tiptap | Slate | Quill |
| --- | --- | --- | --- |
| TypeScript 吏??| ?곗닔 (怨듭떇 ??? | 吏곸젒 ????뺤옣 ?꾩슂 | ?쒗븳??|
| 而ㅼ뒪?곕쭏?댁쭠 | ?몃뱶 ?뺤옣?쇰줈 ?먯쑀???믪쓬 | ??섏? ?쒖뼱 媛?? 援ы쁽 鍮꾩슜 ?믪쓬 | ?쒗븳??|
| ?묒뾽 湲곕뒫 | Y.js ?듯빀 ?덉젣 ?띾? | ?뚮윭洹몄씤 ?꾩슂 | ?놁쓬 |
| ?쇱씠?좎뒪 | MIT | MIT | BSD |
| 踰덈뱾 ?ш린 | 以묎컙(肄붿뼱 + ?뺤옣 ?좏깮) | 媛踰쇱? | 媛踰쇱? |

寃곗젙: **Tiptap** (ProseMirror 湲곕컲) ?ъ슜. ?댁쑀: TypeScript 移쒗솕?? ?띾????뺤옣, 而ㅻ??덊떚 吏??

## 2. ?먮뵒???섑띁 諛??쒖떇 湲곕뒫 (Step 19)
- ?섑띁 ?꾩튂: `frontend/src/components/editor/RichEditor.tsx`
- ?곹깭 愿由? ?대? ProseMirror ?곹깭 + ?몃? `onChange` 肄쒕갚.
- Toolbar 援ъ꽦: Bold, Italic, Underline, Color Picker, Heading(1~3), Quote, Code, Link, Undo/Redo.
- ?⑥텞??留ㅽ븨: `Ctrl+B/I/U`, `Ctrl+Shift+C`(Code), `Ctrl+Shift+K`(Link).
- ?붾젅?? `theme/editor.ts`???쇱씠???ㅽ겕 紐⑤뱶 ?됱긽 ?뺤쓽, ?묎렐???鍮??뺣낫 (WCAG AA 湲곗?).

## 3. 목록 & 체크리스트 UX (Step 20)
- **들여쓰기/내어쓰기**: `Tab`으로 하위 항목을 만들고 `Shift+Tab`으로 상위 레벨로 이동합니다.
- **체크리스트 토글**: TaskList 익스텐션을 사용하며, 커서가 체크박스에 있을 때 `Space`로 완료 상태를 전환합니다.
- **Enter 동작**
  - 일반 항목: Enter 입력 시 동일 레벨의 새 항목을 추가합니다.
  - 빈 항목에서 Enter: 목록을 종료하고 본문으로 돌아갑니다.
- **모바일 최적화**: 320px 이하 화면에서는 체크박스를 좌측에 배치하고 텍스트를 줄바꿈하여 표시합니다.
- **키보드 포커스 이탈**: `Shift+Escape`를 누르면 목록 모드에서 빠져나와 일반 본문으로 포커스를 이동합니다.

## 4. 링크 임베드 & 미디어 UX (Step 21)
- 지원 대상: YouTube, Twitch, Twitter(X) 등 Open Graph 메타 정보를 지원하는 URL.
- 기술 스택: Tiptap oEmbed 어댑터 + 허용 도메인 화이트리스트(`allowedHosts`).
- 삽입 플로우
  1. 툴바에서 “Link” 버튼 선택 후 URL 입력.
  2. `/api/embeds/preview` 호출로 `{ title, thumbnail, type }` 응답 수신.
  3. 미리보기 모달에서 “임베드 추가” 또는 “링크 유지” 선택.
- 에러 처리: 2회 연속 실패 시 일반 하이퍼링크로 전환하고 메시지를 표시합니다.
- 접근성: iframe 삽입 시 `title` 속성을 포함하고, 키보드 탐색 순서에 임베드 카드가 포함되도록 합니다.

## 5. 코드 블록 & 하이라이트 (Step 22)
- 하이라이터: Prism.js를 기본 사용, 언어 선택이 가능한 드롭다운 제공(기본값 `auto`).
- 지원 언어: `javascript`, `typescript`, `python`, `go`, `rust`, `json`, `yaml`, `bash` 등.
- 기능: 코드 복사 버튼, 줄 번호 토글, 작은 화면에서는 좌우 스크롤 가능하도록 처리.
- 저장 형식: ProseMirror JSON으로 저장하며, 백엔드 `/api/posts` 저장 시 JSON Schema(`schemas/editor-content.json`)를 검증합니다.
- 내보내기: 향후 Markdown 변환을 위해 코드 블록 타입과 언어 정보를 그대로 유지합니다.

## 6. 접근성 & 테스트 (Step 23)
- ARIA: 툴바 버튼에 `aria-label`과 토글 버튼의 `aria-pressed`를 지정합니다. 목록/체크리스트 입력 필드는 라벨을 연결합니다.
- 단위 테스트: 주요 명령(목록 들여쓰기, 체크박스 토글, 코드 블록 생성 등)을 ProseMirror 트랜잭션 스냅샷으로 검증합니다.
- E2E: Playwright 시나리오로 키보드만 사용한 편집 플로우(목록 작성→임베드→코드 블록)를 검증합니다.
- 접근성 검사: axe-core CLI로 정적 검사를 실행하고, 주요 툴바에 대해 스크린리더 시나리오를 문서화합니다.
- 성능 기준: 연속 입력 시 16ms 이하 렌더링 유지, 5,000자 이상의 본문에서도 스크롤이 끊기지 않아야 합니다.

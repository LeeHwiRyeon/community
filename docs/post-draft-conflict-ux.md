# Draft Conflict UX Specification (Step 40)

## 1. Overview
- **Goal**: Ensure authors understand when another session/device overwrites a draft and provide safe recovery paths.
- **Scope**: Applies to auto-save flow implemented via `useDraftAutoSave`. Triggered when backend returns HTTP 409 with `draft_conflict` payload.

## 2. Trigger Conditions
| Scenario | Detection | Notes |
| --- | --- | --- |
| Same account opened on second device/browser | `draft.conflict_warning` true or conflict response | Most common case. |
| Draft deleted from another session | 404 after conflict resolution | Show toast then navigate to dashboard. |
| Rate-limit after conflict | 429 following conflict | Show banner to retry later; keep local data. |

## 3. UX Flow
1. **Auto-save detects conflict**
   - Stop background save timers.
   - Set status `conflict`; expose last server version snapshot.
2. **Conflict modal** (blocking)
   - Title: “다른 기기에서 변경되었습니다” / “Changes detected from another device”.
   - Body copy includes last saved time and device hint (if available).
   - Options:
     - `내 변경 유지 / Keep my edits` (primary): keeps local content, retries save with forced overwrite (future Step 40.2).
     - `다른 버전 보기 / Review other version`: opens side-by-side view (Phase 2, fallback is open in new window linking to history).
     - `취소 / Cancel`: dismiss modal, remain in conflict state; disable auto-save until resolved.
3. **Inline banner**
   - If modal dismissed, persistent banner at top of editor: “자동 저장이 중단되었습니다. 충돌을 해결하세요.” / “Auto-save paused. Resolve the conflict to continue.”.
   - Retains CTA buttons for “Keep my edits” and “Reload remote version”.
4. **Event Logging**
   - Emit analytics events:
     - `draft_conflict_detected` (properties: draftId, boardId, timeSinceLastSave).
     - `draft_conflict_resolved` (outcome: keep_local / reload_remote / cancel).

## 4. Copy Deck
| Element | Korean | English |
| --- | --- | --- |
| Modal Title | 다른 기기에서 변경되었습니다 | Changes detected from another device |
| Modal Body (soft warning) | 다른 세션에서 같은 초안이 저장되었습니다. 내 변경 사항은 안전하게 보관되어 있으며, 어떻게 처리할지 결정할 때까지 자동 저장이 일시 중지됩니다. | Another session just saved this draft. Your edits are safe, but auto-save is paused until you decide how to proceed. |
| Modal Body (server overwrite) | 다른 기기에서 더 최신 버전이 저장되었습니다. 아래 버튼을 사용해 내 변경을 유지하거나, 서버 버전을 확인할 수 있습니다. | A newer version was saved elsewhere. Use the options below to keep your edits or review the server copy. |
| Primary CTA | 내 변경 유지 | Keep my edits |
| Secondary CTA | 다른 버전 보기 | Review other version |
| Tertiary CTA | 취소 | Cancel |
| Banner Message | 자동 저장이 중단되었습니다. 충돌을 해결해야 계속 저장됩니다. | Auto-save is paused. Resolve the conflict to resume saving. |
| Banner CTA 1 | 내 변경 유지 | Keep my edits |
| Banner CTA 2 | 원본 다시 불러오기 | Reload server version |
| Toast (soft warning) | 다른 기기에서 같은 초안을 저장했습니다. 충돌을 해결할 때까지 자동 저장을 일시 중지했습니다. | Another device saved this draft. Auto-save is paused until you resolve the conflict. |
| Toast (server deleted) | 다른 기기에서 초안이 삭제되어 자동 저장을 종료했습니다. 새 초안을 만들어 주세요. | The draft was deleted from another device, so auto-save has stopped. Please start a new draft. |

## 5. Visual Requirements
- Provide Figma frames for desktop/mobile (two-column vs full-width overlay).
- Outline state colors (warning yellow #FFAA2C, text #2F1E00) with dark-mode equivalents.
- Include focus order (modal buttons left-to-right; default focus primary CTA).
- Ensure modal accessible: `role="dialog"`, `aria-labelledby`, `aria-describedby`.

## 6. Implementation Notes
- Extend `useDraftAutoSave` to expose `conflictDraft` snapshot for review.
- Provide hook callbacks: `resolveConflict({ strategy: 'keepLocal' | 'reloadRemote' })`.
- Add new context or component `DraftConflictModal` in `frontend/src/components/editor/`.
- Guard auto-save timer restart only after conflict resolution.

## 7. QA Checklist
- Simulate dual-session edit (browser A/B) and verify modal.
- Verify keyboard navigation order and ESC closes modal.
- Confirm analytics events fire with correct payloads.
- Confirm banner hides after resolution and auto-save resumes.

## 8. Open Questions
- Do we need server-side merge assistance? (Future Step 53 integration.)
- Should we surface device info (browser, OS) to help identify session? (Requires backend logging.)


## 9. Flow Deliverables (Figma)
- **Desktop flow**
  1. Conflict detected → editor overlay modal (`dialog_conflict_desktop`).
  2. Optional comparison screen showing local vs. server snapshots (`dialog_conflict_compare`).
  3. Resolution confirmation toast/badge once an option is chosen.
- **Mobile flow**
  1. Full-screen sheet variant of the conflict modal with stacked CTAs.
  2. Scrollable diff preview section; default collapsed.
  3. Banner reappears at top of editor when sheet dismissed without resolution.
- **State variants**
  - Soft warning (`conflict_warning=true`) uses yellow accent, optimistic message.
  - Hard 409 uses danger tone with “Reload server version” emphasised.
  - Deleted-draft fallback shows guidance to start a new draft and link back to list.
- **Accessibility notes**
  - Provide focus order annotations and describe screen-reader announcements.
  - Include WCAG contrast checks for both light/dark modes.

### Figma export checklist
| Item | Description |
| --- | --- |
| Frame names | `draft-conflict/desktop`, `draft-conflict/mobile`, `draft-conflict/diff` |
| Components | Modal shell, banner strip, toast badge, CTA buttons |
| Tokens | Reference design tokens: `color.warning.500`, `color.danger.500`, `space.400`, `radius.md` |
| Annotations | Interaction arrows, voiceover script, analytics event IDs |
| Deliverable link | `TODO: add Figma share URL here (design team)` |

# TODO Backlog Overview (Phase 1 Remaining Work)

> Updated: 2025-09-26. Source of truth for task numbering is `FEATURES.md` (Steps 40 ~ 59). Use this list to plan next sprints and to avoid duplicating completed work.

## Draft Workflow (Steps 40 ~ 41)
| Step | Status | Scope | Notes / Dependencies |
| --- | --- | --- | --- |
| 40 | ⬜ | Draft conflict UX (multi-device warnings, modal, merge hints) | Depends on `useDraftAutoSave` hook (Create/Edit). Define design spec and QA cases. |
| 41 | ⬜ | Draft testing + monitoring (auto-save hook unit tests, Playwright recovery flow, alert wiring) | Needs metrics + alert channel (`drafts.*` alerts) before release. |

## Attachments Pipeline (Steps 42 ~ 45)
| Step | Status | Scope | Notes |
| --- | --- | --- | --- |
| 42 | ⬜ | Signed upload API + server validation | Coordinate with security plan (`docs/attachments.md`). |
| 43 | ⬜ | Worker + storage cleanup deployment | Requires queue infra (decide on Bull/Redis or cron). |
| 44 | ⬜ | Frontend uploader + preview renderer | Wire to editor once WYSIWYG ready. |
| 45 | ⬜ | Attachment test suite + CI alerts | Add large-file manual QA checklist. |

## Editor & Authoring Experience (Steps 46 ~ 48)
| Step | Status | Scope |
| --- | --- | --- |
| 46 | ⬜ | Editor wrapper implementation, base formatting + accessibility audit |
| 47 | ⬜ | Embed/code/table features with mobile/i18n review |
| 48 | ⬜ | Serialization + automated regression reporting |

## Metadata & UX Enhancements (Steps 49 ~ 52)
| Step | Status | Scope |
| --- | --- | --- |
| 49 | ⬜ | Backend taxonomy API + validation metrics |
| 50 | ⬜ | Frontend metadata UX + SEO history logging |
| 51 | ⬜ | Auto-save feedback UI + preview mode release + docs update |
| 52 | ⬜ | Keyboard shortcut guide + template manager |

## Advanced Authoring & Scheduling (Steps 53 ~ 54)
| Step | Status | Scope |
| --- | --- | --- |
| 53 | ⬜ | Collaboration, scheduled publish, version compare MVP |
| 54 | ⬜ | Review workflow + SEO suggestion tooling |

## Quality, Security, Social Expansion (Steps 55 ~ 59)
| Step | Status | Scope |
| --- | --- | --- |
| 55 | ⬜ | Accessibility backlog (WCAG checklist automation + manual audits) |
| 56 | ⬜ | Security hardening (XSS filtering, upload scanning, rate limit QA) |
| 57 | ⬜ | Moderator tooling + regression suites |
| 58 | ⬜ | Follow feature rollout (backend, notifications, benchmarks, training) |
| 59 | ⬜ | Tags & search phase-2 release + Phase 2 kickoff report |

## Usage Guidelines
- Update this document whenever a step’s status changes (✅ / ⬜) to keep planners aligned.
- Link design specs, pull requests, and QA reports inline under “Notes” for traceability.
- Before starting work on a step, cross-check existing docs (see `docs/*.md`) to avoid duplicating finished specs.
- Keep commit messages referencing step numbers (e.g., `Step 42`) for easy filtering.

## Upcoming Sprint Plan (Week 1 ~ Week 2)
| Priority | Step | Owner | Deliverable | References |
| --- | --- | --- | --- | --- |
| P0 | 40 | TBD | Draft conflict UX spec + Figma flows (multi-device modal, retry CTA) | `frontend/src/hooks/useDraftAutoSave.ts`, `docs/post-draft.md` |
| P0 | 41 | TBD | Auto-save hook unit tests + Playwright recovery scenario + alert wiring doc | `frontend/src/hooks/useDraftAutoSave.ts`, `docs/post-draft.md` |
| P1 | 42 | TBD | Upload signing API stub + validation middleware skeleton | `docs/attachments.md`, `server-backend/src/routes.js` |
| P1 | 43 | TBD | Worker architecture decision (Redis queue vs cron) + ADR draft | `docs/attachments.md` |
| P2 | 46 | TBD | Editor wrapper spike (select Tiptap vs Slate) + accessibility checklist update | `docs/editor-wysiwyg.md`, `docs/accessibility-checklist.md` |

### Notes
- Confirm design resources availability before kicking off Step 40; conflict modal text must cover both Korean/English. (Spec draft: docs/post-draft-conflict-ux.md)
- Step 41 testing requires branch of `frontend/tests` to add Vitest coverage; consider adding `draft-auto-save.test.tsx`. (Testing plan: docs/post-draft-testing-monitoring.md)
- Attachments (Steps 42-43) depend on security review; align with `security-plan.md` before merging API scaffolding.
- Revisit priorities weekly; once Step 40 enters development, link PR IDs in the table.

## Next Action Plan (Unblocked Tasks)
| Step | Action | Owner | Target | Notes |
| --- | --- | --- | --- | --- |
| 40 | Draft conflict UX spec (modal copy, flowchart) | TBD | 2025-09-30 | Reference: `frontend/src/hooks/useDraftAutoSave.ts`, add bilingual strings. |
| 41 | Auto-save testing plan (Vitest + Playwright) | TBD | 2025-10-02 | Draft test list in `frontend/tests/README.md`, set alert topic `drafts.save.failure`. |
| 42-45 | Attachments architecture review meeting | TBD | 2025-10-03 | Confirm storage choice; align with `docs/attachments.md` + `security-plan.md`. |
| 46 | Editor stack decision (Tiptap vs Slate) | TBD | 2025-10-04 | Summarize in `docs/editor-wysiwyg.md`, include A11y checklist delta. |
| 49-50 | Metadata validation spike (taxonomy API schema) | TBD | 2025-10-07 | Create ERD update; coordinate with analytics metrics plan. |
| 55 | Accessibility audit backlog grooming | TBD | 2025-10-07 | Update `docs/accessibility-checklist.md` with tooling ownership. |

## Backlog Review Reminder
- Revisit Steps 47-59 during next planning call; update deliverables with new dates once dependencies settle.
- Each action should create/update supporting docs or tickets (link IDs in this table).

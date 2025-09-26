# 보안 및 검증 전략 (Phase 1 Step 28)

## 1. 콘텐츠 위생 (XSS 방지)
- DOMPurify 기반의 허용 태그 목록(`security/allowed-tags.json`)을 유지하며 스크립트/iframe/object는 기본 제거.
- 저장 전 서버 측에서도 동일한 필터를 적용해 이중 방어.
- 위험 패턴 감지 시 `security.xss.blocked` 메트릭을 기록하고 관리자 알림.

## 2. 파일 업로드 검증
- ClamAV 또는 유사 스캐너로 업로드 즉시 검사, 의심 파일은 `attachments_quarantine` 버킷에 임시 보관.
- 1회 이상 실패한 파일은 즉시 차단하고 Slack `#alerts-security` 채널에 통지.
- 업로드 서명은 HMAC을 이용해 위변조를 방지, 만료 시간은 10분.

## 3. 남용 방지
- 포스트/댓글 작성 등 쓰기 API는 사용자당 분당 30회로 제한.
- reCAPTCHA Enterprise(또는 hCaptcha)를 회원가입·비밀번호 재설정에 적용.
- IP·사용자 단위 스팸 점수를 기록(`spam_score`)하고 임계치 초과 시 검토 큐에 자동 등록.

## 4. 신고 & 검토 시스템
- 테이블: `content_flags { id, entity_type, entity_id, reason, status, reviewer_id, created_at }`.
- 관리자 UI에서 상태 변경, Slack DM으로 책임자에게 즉시 알림.
- SLA: 신고 접수 후 12시간 내 1차 응답, 미처리 시 Escalation 정책 발동.

## 5. 테스트 & CI 파이프라인
- Jest + Supertest로 XSS 페이로드/권한 우회 테스트를 자동화.
- Playwright로 파일 업로드/검역 플로우를 E2E 검증.
- CI에 `security` Job을 추가해 정적 분석(Snyk 등)과 취약성 검사 실행.
- 메트릭: `security.upload.quarantine`, `security.rate_limit.blocked` 등을 수집.

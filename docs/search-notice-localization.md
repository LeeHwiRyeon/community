# 검색 공지/알림 메시지 현지화 가이드

## 1. 대상 메시지 분류
- 검색 결과 없음 안내 (`search.empty`)
- 검색 지연/장애 알림 (`search.slow`, `search.unavailable`)
- 인덱스 구축 진행 안내 (`search.indexing`)
- 최근 인기 검색어 소개 (`search.trending`)
- 필터/정렬 적용 알림 (`search.filter.applied`, `search.sort.applied`)

## 2. 문구 작성 원칙
- 짧고 명확한 문장 (한 줄 40자 이하).
- 사용자 행동 유도 문구 포함 (예: 다른 키워드 제안).
- 서비스명/고유명사는 각 언어 스타일 가이드 준수.
- 기술 용어는 glossary 기반 번역 사용.

## 3. 언어별 현지화 체크리스트
| 항목 | ko-KR | en-US | ja-JP |
| --- | --- | --- | --- |
| 단위/날짜 표기 확인 | ✅ | ✅ | ✅ |
| 격식 수준/경어 | 평어 | Friendly | 丁寧語 |
| RTL 고려 필요? | ❌ | ❌ | ❌ |

## 4. 번역 워크플로우
1. 기본 한국어 문구 작성 → `locales/ko/search.json` 저장.
2. Phrase/POEditor 등 TMS에 업로드 → 각 언어 번역 요청.
3. 번역 완료 후 `locales/<lang>/search.json` 병합.
4. QA: 브라우저 언어 변경 → 렌더링 확인, 줄 바꿈/overflow 점검.
5. 변경 사항을 `i18n/CHANGELOG.md`에 기록.

## 5. QA 및 테스트
- Playwright 다국어 시나리오: `tests/e2e/search.spec.js`에 locale별 스냅샷 추가.
- 스크린리더 테스트: 주요 알림 aria-live 영역 번역 적용 여부 확인.
- 로그/메트릭: locale별 알림 노출 비율을 `search.notice.locale`로 추적.

## 6. 유지보수
- 새 메시지 추가 시 PR 템플릿에 "i18n 파일 갱신 여부" 체크 항목 활용.
- 분기별 번역 리뷰 미팅에서 용어 통일 점검.
- 긴급 장애 알림 문구는 영어/한국어 우선 작성 후 TMS에 긴급 태스크 생성.

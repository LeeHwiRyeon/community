# 📢 알림 시스템 가이드

이 문서는 Community Hub 프로젝트의 알림 시스템 설정 및 사용 방법을 설명합니다.

## 📋 목차
- [지원하는 알림 채널](#지원하는-알림-채널)
- [Slack 알림 설정](#slack-알림-설정)
- [Discord 알림 설정](#discord-알림-설정)
- [알림 트리거 이벤트](#알림-트리거-이벤트)
- [알림 메시지 형식](#알림-메시지-형식)
- [커스텀 알림 설정](#커스텀-알림-설정)

## 📡 지원하는 알림 채널

### Slack
- **장점**: 팀 협업에 최적화, 다양한 통합 기능
- **사용 사례**: CI/CD 알림, 에러 알림, 배포 상태
- **설정 난이도**: 중간

### Discord
- **장점**: 실시간 커뮤니티, 쉬운 설정
- **사용 사례**: 개발팀 알림, 모니터링 알림
- **설정 난이도**: 쉬움

## 🔧 Slack 알림 설정

### 1. Slack 앱 생성
1. [Slack API](https://api.slack.com/apps) 접속
2. **"Create New App"** → **"From scratch"** 선택
3. 앱 이름과 워크스페이스 선택

### 2. 웹훅 URL 생성
1. **"Incoming Webhooks"** 활성화
2. **"Add New Webhook to Workspace"** 클릭
3. 알림을 보낼 채널 선택
4. **"Allow"** 클릭하여 권한 부여
5. 생성된 **Webhook URL** 복사

### 3. GitHub Secrets 설정
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

### 4. 알림 테스트
```bash
# 테스트 메시지 전송
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"테스트 알림입니다! 🚀"}' \
  YOUR_SLACK_WEBHOOK_URL
```

## 🎮 Discord 알림 설정

### 1. Discord 웹훅 생성
1. Discord 서버 설정 → **통합** → **웹훅**
2. **"새 웹훅"** 클릭
3. 웹훅 이름과 채널 설정
4. **"웹훅 URL 복사"** 클릭

### 2. GitHub Secrets 설정
```
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR/DISCORD/WEBHOOK
```

### 3. 알림 테스트
```bash
# 테스트 메시지 전송
curl -X POST -H 'Content-type: application/json' \
  --data '{"content":"테스트 알림입니다! 🚀"}' \
  YOUR_DISCORD_WEBHOOK_URL
```

## 🎯 알림 트리거 이벤트

### CI/CD 이벤트
- **빌드 시작**: 새로운 커밋 푸시 시
- **빌드 성공**: 모든 테스트 통과 시
- **빌드 실패**: 테스트 실패 또는 빌드 오류 시
- **배포 시작**: 프로덕션 배포 시작 시
- **배포 성공**: 배포 완료 및 헬스체크 통과 시
- **배포 실패**: 배포 실패 또는 롤백 시

### 모니터링 이벤트
- **서버 다운**: 백엔드 서비스 응답 없음
- **높은 에러율**: API 에러율 임계치 초과
- **성능 저하**: 응답 시간 임계치 초과
- **디스크 공간 부족**: 서버 디스크 공간 부족

### 수동 트리거
- **긴급 알림**: 수동으로 중요한 이슈 알림
- **점검 알림**: 서버 점검 시작/종료 알림
- **업데이트 알림**: 주요 기능 업데이트 알림

## 📝 알림 메시지 형식

### Slack 메시지 형식
```json
{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "🚀 배포 성공"
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*환경:* 프로덕션"
        },
        {
          "type": "mrkdwn",
          "text": "*커밋:* <https://github.com/...|abc1234>"
        },
        {
          "type": "mrkdwn",
          "text": "*배포자:* @username"
        },
        {
          "type": "mrkdwn",
          "text": "*시간:* 2025-01-26 15:30:00"
        }
      ]
    }
  ]
}
```

### Discord 메시지 형식
```json
{
  "embeds": [
    {
      "title": "🚀 배포 성공",
      "color": 3066993,
      "fields": [
        {
          "name": "환경",
          "value": "프로덕션",
          "inline": true
        },
        {
          "name": "커밋",
          "value": "[abc1234](https://github.com/...)",
          "inline": true
        },
        {
          "name": "배포자",
          "value": "@username",
          "inline": true
        },
        {
          "name": "시간",
          "value": "2025-01-26 15:30:00",
          "inline": true
        }
      ],
      "footer": {
        "text": "Community Hub CI/CD"
      }
    }
  ]
}
```

## ⚙️ 커스텀 알림 설정

### 알림 필터링
```yaml
# .github/workflows/deploy.yml
notify:
  needs: [build-and-push, deploy]
  runs-on: ubuntu-latest
  if: always() && contains(github.event.head_commit.message, '[notify]')

  steps:
  - name: Custom notification
    run: |
      # 커스텀 로직
      echo "커스텀 알림 전송"
```

### 조건부 알림
```yaml
# 특정 브랜치에서만 알림
if: github.ref == 'refs/heads/main'

# 실패시에만 알림
if: failure()

# 성공시에만 알림
if: success()
```

### 다중 채널 알림
```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}

- name: Notify Discord
  if: always()
  run: |
    curl -X POST -H 'Content-type: application/json' \
      --data '{"content":"배포 알림"}' \
      ${{ secrets.DISCORD_WEBHOOK_URL }}
```

## 🔧 고급 설정

### 알림 템플릿
```bash
# 알림 템플릿 파일 생성
# scripts/notification-templates/
# ├── deploy-success.json
# ├── deploy-failure.json
# ├── build-success.json
# └── build-failure.json
```

### 알림 우선순위
- **높음**: 배포 실패, 서버 다운, 보안 이슈
- **중간**: 빌드 실패, 성능 저하
- **낮음**: 배포 성공, 일반 업데이트

### 알림 그룹화
- **개발팀**: 모든 CI/CD 이벤트
- **운영팀**: 배포 및 모니터링 이벤트
- **관리팀**: 중요 업데이트 및 이슈

## 📊 알림 모니터링

### 알림 통계
- 일일 알림 수량
- 알림 타입별 분포
- 응답 시간 분석

### 알림 품질
- 거짓 긍정/부정률
- 알림 피로도 측정
- 사용자 만족도 조사

## 🚨 문제 해결

### 알림이 오지 않는 경우
1. **웹훅 URL 확인**: GitHub Secrets에 올바른 URL 설정
2. **권한 확인**: Slack/Discord에서 웹훅 권한 확인
3. **워크플로우 확인**: GitHub Actions 로그에서 알림 단계 확인

### 알림이 너무 많이 오는 경우
1. **필터 추가**: 조건부 알림 설정
2. **그룹화**: 유사 알림 그룹화
3. **빈도 조절**: 알림 간격 설정

### 알림 형식이 깨지는 경우
1. **JSON 검증**: 메시지 JSON 형식 확인
2. **특수문자 이스케이프**: 마크다운 특수문자 처리
3. **길이 제한**: 플랫폼별 메시지 길이 제한 확인

---

## 📞 지원

알림 시스템 설정에 문제가 발생하면:
1. [환경 설정 가이드](./environment-setup.md) 확인
2. [CI/CD 가이드](../CI_CD_GUIDE.md) 확인
3. 플랫폼별 공식 문서 참고:
   - [Slack Webhooks](https://api.slack.com/messaging/webhooks)
   - [Discord Webhooks](https://discord.com/developers/docs/resources/webhook)

---

*알림 시스템 버전: 1.0 | 마지막 업데이트: 2025-01-26*
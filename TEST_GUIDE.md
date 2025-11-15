# 커뮤니티 핵심 기능 테스트 가이드

## 1. 서버 실행

먼저 **새 PowerShell 창**을 열고 다음 명령을 실행하세요:

```powershell
cd c:\Users\hwi\Desktop\Projects\community\server-backend
node src/index.js
```

서버가 다음과 같은 메시지를 출력하면 준비 완료입니다:
```
[2025-11-11 08:XX:XX KST] EVT server.listen {"port":3001}
✅ All startup checks passed. Server is ready to start.
```

## 2. 테스트 실행

서버가 실행 중인 상태에서 **다른 PowerShell 창**에서 다음 명령을 실행하세요:

```powershell
cd c:\Users\hwi\Desktop\Projects\community\server-backend
node test-community-features.js
```

## 3. 예상 테스트 결과

성공적으로 실행되면 다음과 같은 출력을 볼 수 있습니다:

```
============================================================
테스트: 서버 Health Check
============================================================
✓ 서버 정상 동작 (포트: 3001)
ℹ Uptime: XX초
ℹ Database: ok

============================================================
테스트: 게시판 목록 조회
============================================================
✓ 게시판 N개 조회 성공
ℹ 첫 번째 게시판: gaming

...

============================================================
테스트 결과 요약
============================================================
✓ 성공: 7개
```

## 4. 수동 API 테스트

PowerShell에서 직접 API를 테스트할 수도 있습니다:

### 게시판 목록 조회
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/api/boards" -UseBasicParsing | Select-Object StatusCode
```

### 게시물 목록 조회 (boardId를 실제 ID로 변경)
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/api/boards/gaming/posts" -UseBasicParsing | Select-Object StatusCode
```

### 게시물 생성 (boardId를 실제 ID로 변경)
```powershell
$postData = @{
    title = "테스트 게시물"
    content = "테스트 내용입니다."
    author = "test-user"
    author_id = 1
} | ConvertTo-Json

Invoke-WebRequest `
    -Uri "http://localhost:3001/api/boards/gaming/posts" `
    -Method POST `
    -Body $postData `
    -ContentType "application/json" `
    -UseBasicParsing | Select-Object StatusCode
```

## 5. 문제 해결

### 서버 연결 실패
- 서버가 실행 중인지 확인
- 포트 3001이 다른 프로그램에서 사용 중인지 확인
- 방화벽 설정 확인

### 게시판이 없음
데이터베이스에 게시판 데이터가 필요합니다. SQL 직접 실행:

```sql
INSERT INTO boards (id, title, description, format) VALUES
('gaming', 'Gaming Community', 'General gaming discussions', 'discussion'),
('tech', 'Tech Community', 'Technology discussions', 'article');
```

### 인증 오류 (401)
일부 API는 JWT 토큰이 필요합니다. 먼저 로그인 API를 호출하여 토큰을 받아야 합니다.

## 다음 단계

테스트가 성공하면:
1. 프론트엔드에서 해당 API를 사용하는지 확인
2. UI/UX 개선 포인트 파악
3. 누락된 기능 구현

테스트가 실패하면:
1. 서버 로그 확인
2. DB 연결 상태 확인
3. API 엔드포인트 구현 검토

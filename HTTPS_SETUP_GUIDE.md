# 🔒 HTTPS 설정 가이드

## 📋 개요
Community Platform v3.0에서 HTTPS 지원을 위한 설정 가이드입니다.

## 🚀 빠른 시작

### 1. 인증서 생성
```bash
cd frontend/certs
bash generate-cert.sh
```

### 2. 프론트엔드 HTTPS 서버 실행
```bash
cd frontend
npm run dev:https
```

### 3. 백엔드 HTTPS 서버 실행
```bash
cd server-backend
npm start
```

## 🌐 접속 URL

- **HTTPS 프론트엔드**: https://localhost:3000
- **HTTPS 백엔드**: https://localhost:3443
- **HTTP 프론트엔드**: http://localhost:3000 (기존)
- **HTTP 백엔드**: http://localhost:3001 (기존)

## ⚠️ 주의사항

1. **자체 서명 인증서**: 개발용 자체 서명 인증서를 사용합니다
2. **브라우저 경고**: 첫 접속 시 보안 경고가 표시될 수 있습니다
3. **신뢰 설정**: "고급" → "localhost로 이동"을 클릭하여 신뢰하세요

## 🔧 문제 해결

### 인증서 오류
```bash
# 인증서 재생성
rm frontend/certs/server.*
cd frontend/certs
bash generate-cert.sh
```

### 포트 충돌
```bash
# 사용 중인 포트 확인
netstat -ano | findstr :3000
netstat -ano | findstr :3443
```

## 📚 추가 정보

- **개발 환경**: 자체 서명 인증서 사용
- **프로덕션**: Let's Encrypt 또는 상용 인증서 사용 권장
- **보안**: HTTPS는 데이터 암호화를 제공합니다

---
**생성일**: 2025-10-04T06:38:06.382Z
**버전**: 3.0.0

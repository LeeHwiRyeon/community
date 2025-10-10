#!/bin/bash
# SSL 인증서 생성 스크립트

# 인증서 디렉토리 생성
mkdir -p certs

# 개인 키 생성
openssl genrsa -out certs/server.key 2048

# 인증서 서명 요청 생성
openssl req -new -key certs/server.key -out certs/server.csr -subj "/C=KR/ST=Seoul/L=Seoul/O=Community Platform/OU=IT Department/CN=localhost"

# 자체 서명 인증서 생성
openssl x509 -req -days 365 -in certs/server.csr -signkey certs/server.key -out certs/server.crt

# 권한 설정
chmod 600 certs/server.key
chmod 644 certs/server.crt

echo "SSL 인증서 생성 완료!"
echo "server.crt: $(ls -la certs/server.crt)"
echo "server.key: $(ls -la certs/server.key)"

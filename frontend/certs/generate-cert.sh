#!/bin/bash
# 자체 서명 인증서 생성
openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.crt -days 365 -nodes -subj "/C=KR/ST=Seoul/L=Seoul/O=Community Platform/OU=IT Department/CN=localhost"
echo "인증서 생성 완료!"

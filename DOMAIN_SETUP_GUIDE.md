# 🌐 Community Platform 2.0 도메인 설정 가이드

## 📋 **개요**

Community Platform 2.0의 도메인 설정 및 SSL 인증서 구성을 위한 완전한 가이드입니다.

---

## 🎯 **도메인 설정 목표**

### **설정할 도메인**
- **메인 도메인**: `community-platform.com`
- **서브도메인**: `www.community-platform.com`
- **API 도메인**: `api.community-platform.com` (선택사항)
- **관리자 도메인**: `admin.community-platform.com` (선택사항)

### **SSL 인증서**
- **Let's Encrypt**: 무료 SSL 인증서
- **GCP 관리형 SSL**: Google Cloud Platform 관리형 인증서
- **와일드카드 인증서**: `*.community-platform.com`

---

## 🛒 **도메인 구매**

### **1. 도메인 등록업체 선택**

#### **권장 도메인 등록업체**

##### **🥇 1순위: Cloudflare**
- **장점**: 무료 DNS, DDoS 보호, 빠른 DNS
- **가격**: 도메인 + 무료 DNS
- **추천 이유**: GCP와 완벽 호환, 무료 보안 기능

##### **🥈 2순위: Google Domains**
- **장점**: Google 생태계 통합, 간단한 관리
- **가격**: 경쟁력 있는 가격
- **추천 이유**: GCP와 네이티브 통합

##### **🥉 3순위: Namecheap**
- **장점**: 저렴한 가격, 좋은 고객 서비스
- **가격**: 가장 저렴한 가격
- **추천 이유**: 가성비 최고

### **2. 도메인 구매 과정**

#### **Cloudflare를 통한 구매**
1. **Cloudflare 계정 생성**: https://dash.cloudflare.com
2. **도메인 검색**: 원하는 도메인 검색
3. **도메인 구매**: 구매 및 등록
4. **DNS 설정**: Cloudflare DNS 활성화

#### **Google Domains를 통한 구매**
1. **Google Domains 접속**: https://domains.google
2. **도메인 검색**: 원하는 도메인 검색
3. **도메인 구매**: 구매 및 등록
4. **DNS 설정**: Google DNS 사용

---

## 🔧 **DNS 설정**

### **1. GCP Cloud DNS 설정**

#### **DNS 존 생성**
```bash
# DNS 존 생성
gcloud dns managed-zones create community-platform-zone \
    --dns-name=community-platform.com \
    --description="Community Platform 2.0 DNS Zone"

# DNS 서버 확인
gcloud dns managed-zones describe community-platform-zone \
    --format="value(nameServers)"
```

#### **DNS 레코드 설정**
```bash
# A 레코드 (메인 도메인)
gcloud dns record-sets create community-platform.com. \
    --zone=community-platform-zone \
    --type=A \
    --ttl=300 \
    --rrdatas=LOAD_BALANCER_IP

# A 레코드 (www 서브도메인)
gcloud dns record-sets create www.community-platform.com. \
    --zone=community-platform-zone \
    --type=A \
    --ttl=300 \
    --rrdatas=LOAD_BALANCER_IP

# CNAME 레코드 (API 서브도메인)
gcloud dns record-sets create api.community-platform.com. \
    --zone=community-platform-zone \
    --type=CNAME \
    --ttl=300 \
    --rrdatas=community-platform.com.

# CNAME 레코드 (관리자 서브도메인)
gcloud dns record-sets create admin.community-platform.com. \
    --zone=community-platform-zone \
    --type=CNAME \
    --ttl=300 \
    --rrdatas=community-platform.com.
```

### **2. 도메인 등록업체 DNS 설정**

#### **Cloudflare DNS 설정**
1. **Cloudflare 대시보드 접속**
2. **도메인 선택**: community-platform.com
3. **DNS 탭 클릭**
4. **GCP DNS 서버 추가**:
   - Type: NS
   - Name: @
   - Value: GCP에서 제공한 네임서버

#### **Google Domains DNS 설정**
1. **Google Domains 대시보드 접속**
2. **도메인 선택**: community-platform.com
3. **DNS 탭 클릭**
4. **커스텀 네임서버 설정**:
   - GCP에서 제공한 네임서버 입력

---

## 🔒 **SSL 인증서 설정**

### **1. GCP 관리형 SSL 인증서**

#### **SSL 인증서 생성**
```bash
# 관리형 SSL 인증서 생성
gcloud compute ssl-certificates create community-platform-ssl-cert \
    --domains=community-platform.com,www.community-platform.com \
    --global

# SSL 인증서 상태 확인
gcloud compute ssl-certificates describe community-platform-ssl-cert \
    --global \
    --format="value(managed.status)"
```

#### **HTTPS 프록시 설정**
```bash
# HTTPS 프록시 생성
gcloud compute target-https-proxies create community-platform-https-proxy \
    --url-map=community-platform-url-map \
    --ssl-certificates=community-platform-ssl-cert

# HTTPS 포워딩 규칙 생성
gcloud compute forwarding-rules create community-platform-https-rule \
    --global \
    --target-https-proxy=community-platform-https-proxy \
    --ports=443
```

### **2. Let's Encrypt SSL 인증서 (대안)**

#### **Certbot 설치**
```bash
# Certbot 설치
sudo apt update
sudo apt install certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d community-platform.com -d www.community-platform.com

# 자동 갱신 설정
sudo crontab -e
# 다음 라인 추가: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🌐 **Nginx 설정**

### **1. Nginx 설정 파일**

#### **메인 설정 파일**
```nginx
# /etc/nginx/sites-available/community-platform
server {
    listen 80;
    server_name community-platform.com www.community-platform.com;
    
    # HTTP에서 HTTPS로 리다이렉트
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name community-platform.com www.community-platform.com;
    
    # SSL 인증서 설정
    ssl_certificate /etc/letsencrypt/live/community-platform.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/community-platform.com/privkey.pem;
    
    # SSL 보안 설정
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 보안 헤더
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # 로그 설정
    access_log /var/log/nginx/community-platform.access.log;
    error_log /var/log/nginx/community-platform.error.log;
    
    # 정적 파일 서빙
    location /static/ {
        alias /var/www/community-platform/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API 프록시
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # 메인 애플리케이션
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### **설정 파일 활성화**
```bash
# 설정 파일 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/community-platform /etc/nginx/sites-enabled/

# 기본 설정 비활성화
sudo rm /etc/nginx/sites-enabled/default

# Nginx 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

---

## 🔍 **도메인 설정 검증**

### **1. DNS 전파 확인**

#### **온라인 도구 사용**
- **DNS Checker**: https://dnschecker.org
- **What's My DNS**: https://whatsmydns.net
- **DNS Propagation Checker**: https://dnspropagation.net

#### **명령어로 확인**
```bash
# A 레코드 확인
dig community-platform.com A
nslookup community-platform.com

# CNAME 레코드 확인
dig www.community-platform.com CNAME
nslookup www.community-platform.com

# 모든 레코드 확인
dig community-platform.com ANY
```

### **2. SSL 인증서 확인**

#### **SSL Labs 테스트**
- **SSL Labs**: https://www.ssllabs.com/ssltest/
- **도메인 입력**: community-platform.com
- **등급 확인**: A+ 등급 목표

#### **명령어로 확인**
```bash
# SSL 인증서 정보 확인
openssl s_client -connect community-platform.com:443 -servername community-platform.com

# 인증서 만료일 확인
echo | openssl s_client -connect community-platform.com:443 2>/dev/null | openssl x509 -noout -dates
```

---

## 🚀 **배포 후 확인**

### **1. 웹사이트 접속 확인**
- **HTTP 접속**: http://community-platform.com
- **HTTPS 리다이렉트**: https://community-platform.com
- **www 서브도메인**: https://www.community-platform.com

### **2. 기능 테스트**
- **메인 페이지**: 정상 로딩 확인
- **API 엔드포인트**: /api/health 응답 확인
- **정적 파일**: CSS, JS, 이미지 로딩 확인
- **모바일 반응형**: 모바일 디바이스에서 확인

### **3. 성능 테스트**
- **페이지 속도**: Google PageSpeed Insights
- **GTmetrix**: https://gtmetrix.com
- **WebPageTest**: https://www.webpagetest.org

---

## 🔧 **문제 해결**

### **1. DNS 전파 지연**
- **문제**: 도메인이 아직 접속되지 않음
- **해결**: 24-48시간 대기 (최대 72시간)
- **확인**: DNS 전파 확인 도구 사용

### **2. SSL 인증서 발급 실패**
- **문제**: SSL 인증서가 발급되지 않음
- **해결**: DNS 설정 확인, 도메인 소유권 확인
- **대안**: Let's Encrypt 수동 설정

### **3. HTTPS 리다이렉트 문제**
- **문제**: HTTP에서 HTTPS로 리다이렉트되지 않음
- **해결**: Nginx 설정 확인, 방화벽 포트 확인

### **4. 서브도메인 접속 문제**
- **문제**: www 서브도메인이 작동하지 않음
- **해결**: DNS CNAME 레코드 확인

---

## 📊 **모니터링 설정**

### **1. 도메인 모니터링**
- **Uptime Robot**: 무료 웹사이트 모니터링
- **Pingdom**: 고급 모니터링 서비스
- **StatusCake**: 무료 모니터링 도구

### **2. SSL 인증서 모니터링**
- **SSL Labs**: 정기적 SSL 테스트
- **Certbot**: 자동 갱신 확인
- **GCP 모니터링**: 관리형 SSL 상태 확인

### **3. DNS 모니터링**
- **Cloudflare Analytics**: DNS 쿼리 분석
- **GCP Cloud DNS**: DNS 쿼리 로그
- **DNS Made Easy**: DNS 성능 모니터링

---

## 🎯 **최종 체크리스트**

### **✅ 도메인 설정 완료**
- [ ] 도메인 구매 완료
- [ ] DNS 설정 완료
- [ ] DNS 전파 확인 완료
- [ ] SSL 인증서 발급 완료
- [ ] HTTPS 리다이렉트 설정 완료
- [ ] 서브도메인 설정 완료

### **✅ 보안 설정 완료**
- [ ] SSL 인증서 A+ 등급 달성
- [ ] 보안 헤더 설정 완료
- [ ] HSTS 설정 완료
- [ ] 방화벽 설정 완료

### **✅ 성능 최적화 완료**
- [ ] CDN 설정 완료
- [ ] 정적 파일 캐싱 설정 완료
- [ ] Gzip 압축 설정 완료
- [ ] 페이지 속도 최적화 완료

---

## 🎉 **최종 결과**

### **🌐 완성된 도메인 설정**
- **메인 도메인**: https://community-platform.com
- **www 서브도메인**: https://www.community-platform.com
- **SSL 인증서**: A+ 등급
- **DNS 전파**: 전 세계 완료
- **성능**: 최적화 완료

### **🚀 다음 단계**
1. **애플리케이션 배포**: `./deploy-to-gcp.sh` 실행
2. **모니터링 설정**: Uptime Robot 등 설정
3. **백업 설정**: 정기적 백업 스케줄
4. **사용자 알림**: 도메인 공개 및 가이드 제공

---

*Community Platform 2.0 - 도메인 설정 가이드*

**🌐 완벽한 도메인 설정으로 Community Platform 2.0을 시작하세요!** 🚀

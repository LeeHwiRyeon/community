# 🏗️ **베타 테스트 인프라 구축 가이드**

> **Community Platform v1.2 베타 테스트 환경**  
> 구축일: 2025-10-02  
> 담당자: AUTOAGENTS Manager  
> 목적: 안정적이고 확장 가능한 베타 테스트 환경 구축

---

## 🎯 **인프라 구축 개요**

### **구축 목표**
- **고가용성**: 99.9% 업타임 보장
- **글로벌 접근**: 3개 리전 멀티 배포
- **확장성**: 500명 동시 사용자 지원
- **모니터링**: 실시간 성능 및 사용자 행동 추적

### **기술 스택**
```yaml
Cloud Provider: AWS
Regions: us-east-1, eu-west-1, ap-northeast-2
Container: Docker + Kubernetes
Database: RDS MariaDB + ElastiCache Redis
CDN: CloudFront + S3
Monitoring: CloudWatch + Grafana + Prometheus
Security: WAF + Shield + Certificate Manager
```

---

## ☁️ **AWS 인프라 아키텍처**

### **네트워크 구성**

#### **VPC 설정**
```yaml
# VPC Configuration
VPC:
  Name: community-beta-vpc
  CIDR: 10.0.0.0/16
  
Subnets:
  Public:
    - 10.0.1.0/24 (us-east-1a)
    - 10.0.2.0/24 (us-east-1b)
  Private:
    - 10.0.10.0/24 (us-east-1a)
    - 10.0.20.0/24 (us-east-1b)
    
Internet Gateway: community-beta-igw
NAT Gateway: community-beta-nat
Route Tables: Public/Private routing
```

#### **보안 그룹**
```yaml
# Security Groups
Web-SG:
  Inbound:
    - Port 80 (HTTP) from 0.0.0.0/0
    - Port 443 (HTTPS) from 0.0.0.0/0
  Outbound: All traffic

App-SG:
  Inbound:
    - Port 3000 (React) from Web-SG
    - Port 5000 (Express) from Web-SG
  Outbound: All traffic

DB-SG:
  Inbound:
    - Port 3306 (MariaDB) from App-SG
    - Port 6379 (Redis) from App-SG
  Outbound: None
```

### **컴퓨팅 리소스**

#### **EKS 클러스터 설정**
```yaml
# EKS Cluster
Cluster Name: community-beta-cluster
Version: 1.28
Node Groups:
  - Name: frontend-nodes
    Instance Type: t3.medium
    Min Size: 2
    Max Size: 10
    Desired: 3
  - Name: backend-nodes
    Instance Type: t3.large
    Min Size: 2
    Max Size: 8
    Desired: 3
```

#### **Application Load Balancer**
```yaml
# ALB Configuration
Name: community-beta-alb
Scheme: internet-facing
Type: application
Listeners:
  - Port 80 → Redirect to 443
  - Port 443 → Target Groups
Target Groups:
  - frontend-tg (Port 3000)
  - backend-tg (Port 5000)
Health Check: /health
```

### **데이터베이스 설정**

#### **RDS MariaDB**
```yaml
# RDS Configuration
Engine: MariaDB 10.11
Instance Class: db.t3.medium
Multi-AZ: Yes
Storage: 100GB GP3
Backup Retention: 7 days
Monitoring: Enhanced monitoring
Security: Encrypted at rest
```

#### **ElastiCache Redis**
```yaml
# Redis Configuration
Engine: Redis 7.0
Node Type: cache.t3.micro
Num Cache Nodes: 2
Replication Group: community-beta-redis
Automatic Failover: Yes
Backup: Daily snapshots
```

---

## 🐳 **Docker 및 Kubernetes 설정**

### **Frontend Dockerfile**
```dockerfile
# frontend/Dockerfile.beta
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### **Backend Dockerfile**
```dockerfile
# server-backend/Dockerfile.beta
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .

USER node
EXPOSE 5000

CMD ["npm", "start"]
```

### **Kubernetes Manifests**

#### **Frontend Deployment**
```yaml
# k8s/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-deployment
  namespace: community-beta
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: community/frontend:beta
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
```

#### **Backend Deployment**
```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-deployment
  namespace: community-beta
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: community/backend:beta
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          value: "beta"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: host
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: password
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 10
          periodSeconds: 5
```

#### **Services**
```yaml
# k8s/services.yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: community-beta
spec:
  selector:
    app: frontend
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP

---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: community-beta
spec:
  selector:
    app: backend
  ports:
  - port: 5000
    targetPort: 5000
  type: ClusterIP
```

---

## 📊 **모니터링 및 로깅 설정**

### **Prometheus 설정**
```yaml
# monitoring/prometheus-config.yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
    - role: pod
    relabel_configs:
    - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
      action: keep
      regex: true

  - job_name: 'node-exporter'
    static_configs:
    - targets: ['node-exporter:9100']

alerting:
  alertmanagers:
  - static_configs:
    - targets:
      - alertmanager:9093
```

### **Grafana 대시보드**
```json
{
  "dashboard": {
    "title": "Community Platform Beta Test Dashboard",
    "panels": [
      {
        "title": "Active Users",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m]))",
            "legendFormat": "Requests/sec"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "5xx errors"
          }
        ]
      },
      {
        "title": "Resource Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(container_cpu_usage_seconds_total[5m])",
            "legendFormat": "CPU Usage"
          },
          {
            "expr": "container_memory_usage_bytes",
            "legendFormat": "Memory Usage"
          }
        ]
      }
    ]
  }
}
```

### **CloudWatch 알람**
```yaml
# cloudwatch-alarms.yaml
Alarms:
  - Name: HighCPUUtilization
    MetricName: CPUUtilization
    Namespace: AWS/EKS
    Statistic: Average
    Period: 300
    EvaluationPeriods: 2
    Threshold: 80
    ComparisonOperator: GreaterThanThreshold
    AlarmActions:
      - arn:aws:sns:us-east-1:123456789012:beta-alerts

  - Name: HighMemoryUtilization
    MetricName: MemoryUtilization
    Namespace: AWS/EKS
    Statistic: Average
    Period: 300
    EvaluationPeriods: 2
    Threshold: 85
    ComparisonOperator: GreaterThanThreshold

  - Name: HighErrorRate
    MetricName: 5XXError
    Namespace: AWS/ApplicationELB
    Statistic: Sum
    Period: 300
    EvaluationPeriods: 2
    Threshold: 10
    ComparisonOperator: GreaterThanThreshold
```

---

## 🔒 **보안 설정**

### **SSL/TLS 인증서**
```yaml
# SSL Certificate
Certificate Manager:
  Domain: beta.community-platform.com
  Validation: DNS validation
  Auto-renewal: Yes
  
CloudFront:
  SSL Certificate: ACM Certificate
  Security Policy: TLSv1.2_2021
  HSTS: max-age=31536000
```

### **WAF 규칙**
```yaml
# WAF Configuration
WebACL: community-beta-waf
Rules:
  - Name: AWSManagedRulesCommonRuleSet
    Priority: 1
    Action: Block
    
  - Name: AWSManagedRulesKnownBadInputsRuleSet
    Priority: 2
    Action: Block
    
  - Name: RateLimitRule
    Priority: 3
    Action: Block
    RateLimit: 2000 requests per 5 minutes
    
  - Name: GeoBlockRule
    Priority: 4
    Action: Block
    Countries: [CN, RU, KP]  # 필요시 조정
```

### **Secrets 관리**
```yaml
# AWS Secrets Manager
Secrets:
  - Name: community-beta/database
    Values:
      host: rds-endpoint
      username: admin
      password: auto-generated
      database: community_beta
      
  - Name: community-beta/redis
    Values:
      url: redis://elasticache-endpoint:6379
      
  - Name: community-beta/jwt
    Values:
      secret: auto-generated-256-bit-key
      
  - Name: community-beta/external-apis
    Values:
      openai_api_key: sk-...
      google_translate_key: AIza...
```

---

## 🚀 **CI/CD 파이프라인**

### **GitHub Actions Workflow**
```yaml
# .github/workflows/beta-deploy.yml
name: Beta Deployment

on:
  push:
    branches: [beta]
  pull_request:
    branches: [beta]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm ci
    - run: npm run test
    - run: npm run lint
    - run: npm run type-check

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/beta'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
    
    - name: Login to Amazon ECR
      uses: aws-actions/amazon-ecr-login@v1
    
    - name: Build and push Frontend image
      run: |
        docker build -f frontend/Dockerfile.beta -t $ECR_REGISTRY/community-frontend:beta frontend/
        docker push $ECR_REGISTRY/community-frontend:beta
    
    - name: Build and push Backend image
      run: |
        docker build -f server-backend/Dockerfile.beta -t $ECR_REGISTRY/community-backend:beta server-backend/
        docker push $ECR_REGISTRY/community-backend:beta
    
    - name: Deploy to EKS
      run: |
        aws eks update-kubeconfig --region us-east-1 --name community-beta-cluster
        kubectl set image deployment/frontend-deployment frontend=$ECR_REGISTRY/community-frontend:beta -n community-beta
        kubectl set image deployment/backend-deployment backend=$ECR_REGISTRY/community-backend:beta -n community-beta
        kubectl rollout status deployment/frontend-deployment -n community-beta
        kubectl rollout status deployment/backend-deployment -n community-beta
    
    - name: Run smoke tests
      run: |
        npm run test:smoke -- --url=https://beta.community-platform.com
```

---

## 📈 **성능 최적화**

### **Auto Scaling 설정**
```yaml
# HPA (Horizontal Pod Autoscaler)
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: frontend-hpa
  namespace: community-beta
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: frontend-deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
  namespace: community-beta
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend-deployment
  minReplicas: 2
  maxReplicas: 8
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### **CDN 설정**
```yaml
# CloudFront Distribution
Distribution:
  Origins:
    - DomainName: community-beta-alb-123456789.us-east-1.elb.amazonaws.com
      Id: ALB-Origin
      CustomOriginConfig:
        HTTPPort: 80
        HTTPSPort: 443
        OriginProtocolPolicy: https-only
  
  DefaultCacheBehavior:
    TargetOriginId: ALB-Origin
    ViewerProtocolPolicy: redirect-to-https
    CachePolicyId: 4135ea2d-6df8-44a3-9df3-4b5a84be39ad  # Managed-CachingOptimized
    OriginRequestPolicyId: 88a5eaf4-2fd4-4709-b370-b4c650ea3fcf  # Managed-CORS-S3Origin
  
  CacheBehaviors:
    - PathPattern: "/api/*"
      TargetOriginId: ALB-Origin
      CachePolicyId: 4135ea2d-6df8-44a3-9df3-4b5a84be39ad
      TTL: 0  # No caching for API calls
    
    - PathPattern: "/static/*"
      TargetOriginId: ALB-Origin
      CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6  # Managed-CachingOptimizedForUncompressedObjects
      TTL: 86400  # 1 day caching for static assets
  
  PriceClass: PriceClass_All
  Enabled: true
```

---

## 🔧 **배포 스크립트**

### **인프라 배포 스크립트**
```bash
#!/bin/bash
# scripts/deploy-beta-infrastructure.sh

set -e

echo "🚀 Community Platform Beta Infrastructure Deployment"
echo "=================================================="

# Variables
AWS_REGION="us-east-1"
CLUSTER_NAME="community-beta-cluster"
NAMESPACE="community-beta"

# 1. Create EKS Cluster
echo "📦 Creating EKS Cluster..."
eksctl create cluster \
  --name $CLUSTER_NAME \
  --region $AWS_REGION \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 10 \
  --managed

# 2. Create Namespace
echo "📁 Creating Kubernetes Namespace..."
kubectl create namespace $NAMESPACE

# 3. Apply Kubernetes Manifests
echo "⚙️ Applying Kubernetes Manifests..."
kubectl apply -f k8s/ -n $NAMESPACE

# 4. Install Monitoring Stack
echo "📊 Installing Monitoring Stack..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --values monitoring/prometheus-values.yaml

# 5. Setup Ingress Controller
echo "🌐 Setting up Ingress Controller..."
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace

# 6. Apply SSL Certificate
echo "🔒 Setting up SSL Certificate..."
kubectl apply -f k8s/ssl-certificate.yaml -n $NAMESPACE

# 7. Setup External DNS
echo "🌍 Setting up External DNS..."
helm repo add external-dns https://kubernetes-sigs.github.io/external-dns/
helm install external-dns external-dns/external-dns \
  --namespace external-dns \
  --create-namespace \
  --values monitoring/external-dns-values.yaml

echo "✅ Beta Infrastructure Deployment Complete!"
echo "🌐 Access URL: https://beta.community-platform.com"
echo "📊 Monitoring: https://grafana.beta.community-platform.com"
```

### **애플리케이션 배포 스크립트**
```bash
#!/bin/bash
# scripts/deploy-beta-application.sh

set -e

echo "🚀 Community Platform Beta Application Deployment"
echo "=============================================="

# Variables
ECR_REGISTRY="123456789012.dkr.ecr.us-east-1.amazonaws.com"
NAMESPACE="community-beta"
VERSION=$(git rev-parse --short HEAD)

# 1. Build and Push Images
echo "🏗️ Building Docker Images..."
docker build -f frontend/Dockerfile.beta -t $ECR_REGISTRY/community-frontend:$VERSION frontend/
docker build -f server-backend/Dockerfile.beta -t $ECR_REGISTRY/community-backend:$VERSION server-backend/

echo "📤 Pushing Images to ECR..."
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REGISTRY
docker push $ECR_REGISTRY/community-frontend:$VERSION
docker push $ECR_REGISTRY/community-backend:$VERSION

# 2. Update Kubernetes Deployments
echo "🔄 Updating Kubernetes Deployments..."
kubectl set image deployment/frontend-deployment frontend=$ECR_REGISTRY/community-frontend:$VERSION -n $NAMESPACE
kubectl set image deployment/backend-deployment backend=$ECR_REGISTRY/community-backend:$VERSION -n $NAMESPACE

# 3. Wait for Rollout
echo "⏳ Waiting for Rollout to Complete..."
kubectl rollout status deployment/frontend-deployment -n $NAMESPACE --timeout=300s
kubectl rollout status deployment/backend-deployment -n $NAMESPACE --timeout=300s

# 4. Run Health Checks
echo "🏥 Running Health Checks..."
kubectl get pods -n $NAMESPACE
kubectl get services -n $NAMESPACE
kubectl get ingress -n $NAMESPACE

# 5. Run Smoke Tests
echo "🧪 Running Smoke Tests..."
sleep 30  # Wait for services to be ready
curl -f https://beta.community-platform.com/health || exit 1
curl -f https://beta.community-platform.com/api/health || exit 1

echo "✅ Beta Application Deployment Complete!"
echo "🌐 Application URL: https://beta.community-platform.com"
echo "📊 Version Deployed: $VERSION"
```

---

## 📋 **배포 체크리스트**

### **배포 전 체크리스트**
- [ ] **AWS 계정 및 권한 확인**
- [ ] **도메인 및 SSL 인증서 준비**
- [ ] **Docker 이미지 빌드 및 테스트**
- [ ] **Kubernetes 매니페스트 검증**
- [ ] **환경 변수 및 시크릿 설정**
- [ ] **모니터링 도구 설정**
- [ ] **백업 및 복구 계획 수립**

### **배포 후 체크리스트**
- [ ] **서비스 상태 확인**
- [ ] **헬스 체크 통과 확인**
- [ ] **모니터링 대시보드 확인**
- [ ] **로그 수집 정상 동작 확인**
- [ ] **SSL 인증서 적용 확인**
- [ ] **CDN 캐싱 동작 확인**
- [ ] **오토 스케일링 설정 확인**
- [ ] **알람 및 알림 테스트**

---

**🎉 결론: 견고하고 확장 가능한 베타 테스트 인프라를 통해 Community Platform v1.2의 성공적인 베타 테스트를 지원합니다!**

---

*인프라 구축 가이드 작성일: 2025-10-02*  
*작성자: AUTOAGENTS Manager*  
*배포 환경: AWS Multi-Region*  
*예상 구축 시간: 4-6시간*

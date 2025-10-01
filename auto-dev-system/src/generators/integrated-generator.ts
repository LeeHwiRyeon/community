import { APIGenerator } from './api-generator';
import { UIGenerator } from './ui-generator';
import { DatabaseGenerator } from './database-generator';
import { ProjectGenerator } from './project-generator';
import { CodeFile, TechStack, Goal, ProjectStructure } from '@/types';

export class IntegratedGenerator {
    private apiGenerator: APIGenerator;
    private uiGenerator: UIGenerator;
    private databaseGenerator: DatabaseGenerator;
    private projectGenerator: ProjectGenerator;
    private outputDir: string;

    constructor(openaiApiKey: string, outputDir: string = './generated-projects') {
        this.apiGenerator = new APIGenerator(openaiApiKey, outputDir);
        this.uiGenerator = new UIGenerator(openaiApiKey, outputDir);
        this.databaseGenerator = new DatabaseGenerator(openaiApiKey, outputDir);
        this.projectGenerator = new ProjectGenerator(outputDir);
        this.outputDir = outputDir;
    }

    /**
     * 통합 코드 생성
     */
    async generateCompleteProject(
        goal: Goal,
        techStack: TechStack
    ): Promise<{
        projectStructure: ProjectStructure;
        generatedFiles: CodeFile[];
        summary: {
            totalFiles: number;
            apiFiles: number;
            uiFiles: number;
            databaseFiles: number;
            configFiles: number;
        };
    }> {
        console.log('🚀 통합 프로젝트 생성 시작...');

        const allGeneratedFiles: CodeFile[] = [];

        try {
            // 1. 프로젝트 구조 생성
            console.log('📁 프로젝트 구조 생성 중...');
            const projectStructure = await this.projectGenerator.generateProjectStructure(
                this.sanitizeProjectName(goal.description),
                techStack,
                this.determineProjectType(goal)
            );

            // 2. 데이터베이스 스키마 생성
            console.log('🗄️ 데이터베이스 스키마 생성 중...');
            const databaseFiles = await this.databaseGenerator.generateDatabaseSchema(
                goal,
                techStack,
                projectStructure
            );
            allGeneratedFiles.push(...databaseFiles);

            // 3. API 코드 생성
            console.log('🔧 API 코드 생성 중...');
            const apiFiles = await this.apiGenerator.generateAPICode(
                goal,
                techStack,
                projectStructure
            );
            allGeneratedFiles.push(...apiFiles);

            // 4. UI 컴포넌트 생성
            console.log('🎨 UI 컴포넌트 생성 중...');
            const uiFiles = await this.uiGenerator.generateUIComponents(
                goal,
                techStack,
                projectStructure
            );
            allGeneratedFiles.push(...uiFiles);

            // 5. 추가 설정 파일들 생성
            console.log('⚙️ 설정 파일들 생성 중...');
            const configFiles = await this.generateAdditionalConfigFiles(goal, techStack, projectStructure);
            allGeneratedFiles.push(...configFiles);

            // 6. 문서 파일들 생성
            console.log('📚 문서 파일들 생성 중...');
            const docFiles = await this.generateDocumentationFiles(goal, techStack, projectStructure);
            allGeneratedFiles.push(...docFiles);

            // 7. 테스트 파일들 생성
            console.log('🧪 테스트 파일들 생성 중...');
            const testFiles = await this.generateTestFiles(goal, techStack, projectStructure);
            allGeneratedFiles.push(...testFiles);

            // 8. 배포 파일들 생성
            console.log('🚀 배포 파일들 생성 중...');
            const deployFiles = await this.generateDeploymentFiles(goal, techStack, projectStructure);
            allGeneratedFiles.push(...deployFiles);

            // 9. 최종 프로젝트 구조 업데이트
            projectStructure.files = allGeneratedFiles;

            const summary = {
                totalFiles: allGeneratedFiles.length,
                apiFiles: apiFiles.length,
                uiFiles: uiFiles.length,
                databaseFiles: databaseFiles.length,
                configFiles: configFiles.length
            };

            console.log(`✅ 통합 프로젝트 생성 완료: ${summary.totalFiles}개 파일`);

            return {
                projectStructure,
                generatedFiles: allGeneratedFiles,
                summary
            };

        } catch (error) {
            console.error('❌ 통합 프로젝트 생성 실패:', error);
            throw error;
        }
    }

    /**
     * 프로젝트 이름 정리
     */
    private sanitizeProjectName(description: string): string {
        return description
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50);
    }

    /**
     * 프로젝트 타입 결정
     */
    private determineProjectType(goal: Goal): 'monolith' | 'microservices' | 'serverless' {
        if (goal.complexity === 'enterprise') {
            return 'microservices';
        } else if (goal.category === 'api' && goal.complexity === 'simple') {
            return 'serverless';
        } else {
            return 'monolith';
        }
    }

    /**
     * 추가 설정 파일들 생성
     */
    private async generateAdditionalConfigFiles(
        goal: Goal,
        techStack: TechStack,
        projectStructure: ProjectStructure
    ): Promise<CodeFile[]> {
        const files: CodeFile[] = [];

        // .gitignore 파일
        const gitignoreContent = this.generateGitignore(techStack);
        files.push({
            id: this.generateId(),
            name: '.gitignore',
            path: '.gitignore',
            content: gitignoreContent,
            language: 'text',
            size: gitignoreContent.length,
            complexity: 1,
            quality: 8,
            lastModified: new Date()
        });

        // Docker Compose 파일
        const dockerComposeContent = this.generateDockerCompose(goal, techStack);
        files.push({
            id: this.generateId(),
            name: 'docker-compose.yml',
            path: 'docker-compose.yml',
            content: dockerComposeContent,
            language: 'yaml',
            size: dockerComposeContent.length,
            complexity: 3,
            quality: 7,
            lastModified: new Date()
        });

        // Kubernetes 매니페스트
        const k8sFiles = this.generateKubernetesManifests(goal, techStack);
        for (const [filename, content] of Object.entries(k8sFiles)) {
            files.push({
                id: this.generateId(),
                name: filename,
                path: `k8s/${filename}`,
                content,
                language: 'yaml',
                size: content.length,
                complexity: 4,
                quality: 7,
                lastModified: new Date()
            });
        }

        // CI/CD 파이프라인
        const ciFiles = this.generateCIPipeline(techStack);
        for (const [filename, content] of Object.entries(ciFiles)) {
            files.push({
                id: this.generateId(),
                name: filename,
                path: `.github/workflows/${filename}`,
                content,
                language: 'yaml',
                size: content.length,
                complexity: 5,
                quality: 8,
                lastModified: new Date()
            });
        }

        // 환경 설정 파일
        const envFiles = this.generateEnvironmentFiles(techStack);
        for (const [filename, content] of Object.entries(envFiles)) {
            files.push({
                id: this.generateId(),
                name: filename,
                path: filename,
                content,
                language: 'text',
                size: content.length,
                complexity: 2,
                quality: 6,
                lastModified: new Date()
            });
        }

        return files;
    }

    /**
     * 문서 파일들 생성
     */
    private async generateDocumentationFiles(
        goal: Goal,
        techStack: TechStack,
        projectStructure: ProjectStructure
    ): Promise<CodeFile[]> {
        const files: CodeFile[] = [];

        // README.md
        const readmeContent = this.generateREADME(goal, techStack, projectStructure);
        files.push({
            id: this.generateId(),
            name: 'README.md',
            path: 'README.md',
            content: readmeContent,
            language: 'markdown',
            size: readmeContent.length,
            complexity: 3,
            quality: 8,
            lastModified: new Date()
        });

        // API 문서
        const apiDocContent = this.generateAPIDocumentation(goal, techStack);
        files.push({
            id: this.generateId(),
            name: 'API.md',
            path: 'docs/API.md',
            content: apiDocContent,
            language: 'markdown',
            size: apiDocContent.length,
            complexity: 4,
            quality: 7,
            lastModified: new Date()
        });

        // 개발 가이드
        const devGuideContent = this.generateDevelopmentGuide(goal, techStack);
        files.push({
            id: this.generateId(),
            name: 'DEVELOPMENT.md',
            path: 'docs/DEVELOPMENT.md',
            content: devGuideContent,
            language: 'markdown',
            size: devGuideContent.length,
            complexity: 3,
            quality: 7,
            lastModified: new Date()
        });

        // 배포 가이드
        const deployGuideContent = this.generateDeploymentGuide(goal, techStack);
        files.push({
            id: this.generateId(),
            name: 'DEPLOYMENT.md',
            path: 'docs/DEPLOYMENT.md',
            content: deployGuideContent,
            language: 'markdown',
            size: deployGuideContent.length,
            complexity: 4,
            quality: 7,
            lastModified: new Date()
        });

        return files;
    }

    /**
     * 테스트 파일들 생성
     */
    private async generateTestFiles(
        goal: Goal,
        techStack: TechStack,
        projectStructure: ProjectStructure
    ): Promise<CodeFile[]> {
        const files: CodeFile[] = [];

        // Jest 설정
        const jestConfigContent = this.generateJestConfig(techStack);
        files.push({
            id: this.generateId(),
            name: 'jest.config.js',
            path: 'jest.config.js',
            content: jestConfigContent,
            language: 'javascript',
            size: jestConfigContent.length,
            complexity: 3,
            quality: 7,
            lastModified: new Date()
        });

        // Playwright 설정
        const playwrightConfigContent = this.generatePlaywrightConfig(techStack);
        files.push({
            id: this.generateId(),
            name: 'playwright.config.ts',
            path: 'playwright.config.ts',
            content: playwrightConfigContent,
            language: 'typescript',
            size: playwrightConfigContent.length,
            complexity: 4,
            quality: 7,
            lastModified: new Date()
        });

        // 테스트 유틸리티
        const testUtilsContent = this.generateTestUtils(techStack);
        files.push({
            id: this.generateId(),
            name: 'test-utils.ts',
            path: 'src/test-utils.ts',
            content: testUtilsContent,
            language: 'typescript',
            size: testUtilsContent.length,
            complexity: 3,
            quality: 6,
            lastModified: new Date()
        });

        return files;
    }

    /**
     * 배포 파일들 생성
     */
    private async generateDeploymentFiles(
        goal: Goal,
        techStack: TechStack,
        projectStructure: ProjectStructure
    ): Promise<CodeFile[]> {
        const files: CodeFile[] = [];

        // Dockerfile
        const dockerfileContent = this.generateDockerfile(goal, techStack);
        files.push({
            id: this.generateId(),
            name: 'Dockerfile',
            path: 'Dockerfile',
            content: dockerfileContent,
            language: 'dockerfile',
            size: dockerfileContent.length,
            complexity: 3,
            quality: 7,
            lastModified: new Date()
        });

        // Nginx 설정
        const nginxConfigContent = this.generateNginxConfig(techStack);
        files.push({
            id: this.generateId(),
            name: 'nginx.conf',
            path: 'nginx/nginx.conf',
            content: nginxConfigContent,
            language: 'text',
            size: nginxConfigContent.length,
            complexity: 3,
            quality: 6,
            lastModified: new Date()
        });

        // 배포 스크립트
        const deployScriptContent = this.generateDeployScript(techStack);
        files.push({
            id: this.generateId(),
            name: 'deploy.sh',
            path: 'scripts/deploy.sh',
            content: deployScriptContent,
            language: 'shell',
            size: deployScriptContent.length,
            complexity: 4,
            quality: 7,
            lastModified: new Date()
        });

        return files;
    }

    // 설정 파일 생성 메서드들
    private generateGitignore(techStack: TechStack): string {
        const isNode = techStack.backend.some(tech => tech.name === 'Node.js');
        const isReact = techStack.frontend.some(tech => tech.name === 'React');
        const isVue = techStack.frontend.some(tech => tech.name === 'Vue.js');
        const isAngular = techStack.frontend.some(tech => tech.name === 'Angular');

        let content = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
dist/
build/
.next/
out/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
public

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/

# Editor directories and files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Database
*.db
*.sqlite
*.sqlite3

# Docker
.dockerignore

# Kubernetes
*.kubeconfig

# Terraform
*.tfstate
*.tfstate.*
.terraform/

# Secrets
secrets/
*.pem
*.key
*.crt
`;

        if (isNode) {
            content += `
# Node.js specific
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
`;
        }

        if (isReact) {
            content += `
# React specific
build/
public/static/
`;
        }

        if (isVue) {
            content += `
# Vue.js specific
dist/
.nuxt/
`;
        }

        if (isAngular) {
            content += `
# Angular specific
dist/
.angular/
`;
        }

        return content;
    }

    private generateDockerCompose(goal: Goal, techStack: TechStack): string {
        const isPostgreSQL = techStack.database.some(db => db.name === 'PostgreSQL');
        const isMongoDB = techStack.database.some(db => db.name === 'MongoDB');
        const isRedis = techStack.database.some(db => db.name === 'Redis');

        let content = `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
`;

        if (isPostgreSQL) {
            content += `      - postgres
`;
        }
        if (isMongoDB) {
            content += `      - mongodb
`;
        }
        if (isRedis) {
            content += `      - redis
`;
        }

        content += `    volumes:
      - ./logs:/app/logs

`;

        if (isPostgreSQL) {
            content += `  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: ${this.sanitizeProjectName(goal.description)}
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

`;
        }

        if (isMongoDB) {
            content += `  mongodb:
    image: mongo:7
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"

`;
        }

        if (isRedis) {
            content += `  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

`;
        }

        content += `volumes:
`;

        if (isPostgreSQL) {
            content += `  postgres_data:
`;
        }
        if (isMongoDB) {
            content += `  mongodb_data:
`;
        }
        if (isRedis) {
            content += `  redis_data:
`;
        }

        return content;
    }

    private generateKubernetesManifests(goal: Goal, techStack: TechStack): Record<string, string> {
        return {
            'deployment.yaml': `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${this.sanitizeProjectName(goal.description)}-app
  labels:
    app: ${this.sanitizeProjectName(goal.description)}
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ${this.sanitizeProjectName(goal.description)}
  template:
    metadata:
      labels:
        app: ${this.sanitizeProjectName(goal.description)}
    spec:
      containers:
      - name: app
        image: ${this.sanitizeProjectName(goal.description)}:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"`,
            'service.yaml': `apiVersion: v1
kind: Service
metadata:
  name: ${this.sanitizeProjectName(goal.description)}-service
spec:
  selector:
    app: ${this.sanitizeProjectName(goal.description)}
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer`,
            'ingress.yaml': `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${this.sanitizeProjectName(goal.description)}-ingress
spec:
  rules:
  - host: ${this.sanitizeProjectName(goal.description)}.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ${this.sanitizeProjectName(goal.description)}-service
            port:
              number: 80`
        };
    }

    private generateCIPipeline(techStack: TechStack): Record<string, string> {
        return {
            'ci.yml': `name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linter
      run: npm run lint
    
    - name: Run tests
      run: npm test
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Build application
      run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to production
      run: |
        echo "Deploying to production..."
        # Add deployment commands here`
        };
    }

    private generateEnvironmentFiles(techStack: TechStack): Record<string, string> {
        return {
            '.env.example': `# Environment Variables
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/database
MONGODB_URI=mongodb://localhost:27017/database
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# External Services
API_KEY=your-api-key
WEBHOOK_URL=your-webhook-url`,
            '.env.development': `NODE_ENV=development
PORT=3000
LOG_LEVEL=debug`,
            '.env.production': `NODE_ENV=production
PORT=3000
LOG_LEVEL=info`
        };
    }

    private generateREADME(goal: Goal, techStack: TechStack, projectStructure: ProjectStructure): string {
        return `# ${goal.description}

자동 생성된 프로젝트입니다.

## 🚀 기술 스택

### Backend
${techStack.backend.map(tech => `- ${tech.name} ${tech.version}`).join('\n')}

### Frontend
${techStack.frontend.map(tech => `- ${tech.name} ${tech.version}`).join('\n')}

### Database
${techStack.database.map(tech => `- ${tech.name} ${tech.version}`).join('\n')}

## 📦 설치 및 실행

### 개발 환경

\`\`\`bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 테스트 실행
npm test

# 빌드
npm run build
\`\`\`

### Docker를 사용한 실행

\`\`\`bash
# Docker Compose로 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f
\`\`\`

### Kubernetes를 사용한 배포

\`\`\`bash
# Kubernetes 매니페스트 적용
kubectl apply -f k8s/

# 서비스 확인
kubectl get services
kubectl get pods
\`\`\`

## 📁 프로젝트 구조

\`\`\`
${projectStructure.name}/
${this.generateProjectTree(projectStructure)}
\`\`\`

## 🔧 개발 가이드

### API 엔드포인트

- \`GET /health\` - 헬스 체크
- \`GET /api/\` - API 루트

### 데이터베이스

데이터베이스 스키마는 \`database/schema.sql\` 파일을 참조하세요.

### 테스트

\`\`\`bash
# 단위 테스트
npm test

# E2E 테스트
npm run test:e2e

# 커버리지 확인
npm run test:coverage
\`\`\`

## 📚 문서

- [API 문서](./docs/API.md)
- [개발 가이드](./docs/DEVELOPMENT.md)
- [배포 가이드](./docs/DEPLOYMENT.md)

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your Changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the Branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

---

**자동 개발 시스템으로 생성된 프로젝트입니다. 🚀**
`;
    }

    private generateProjectTree(projectStructure: ProjectStructure): string {
        // 간단한 프로젝트 트리 생성
        return `├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── models/
│   └── utils/
├── database/
│   ├── schema.sql
│   ├── migrations/
│   └── seeds/
├── docs/
├── tests/
├── k8s/
└── scripts/`;
    }

    private generateAPIDocumentation(goal: Goal, techStack: TechStack): string {
        return `# API 문서

## 개요

${goal.description}을 위한 REST API입니다.

## 인증

API는 JWT 토큰을 사용한 인증을 지원합니다.

\`\`\`
Authorization: Bearer <token>
\`\`\`

## 엔드포인트

### 헬스 체크

#### GET /health

서버 상태를 확인합니다.

**응답:**
\`\`\`json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
\`\`\`

### 사용자 관리

#### POST /api/auth/login

사용자 로그인

**요청:**
\`\`\`json
{
  "email": "user@example.com",
  "password": "password"
}
\`\`\`

**응답:**
\`\`\`json
{
  "token": "jwt-token",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name"
  }
}
\`\`\`

## 에러 코드

| 코드 | 설명 |
|------|------|
| 400 | 잘못된 요청 |
| 401 | 인증 실패 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 500 | 서버 오류 |
`;
    }

    private generateDevelopmentGuide(goal: Goal, techStack: TechStack): string {
        return `# 개발 가이드

## 개발 환경 설정

### 필수 요구사항

- Node.js 18.x 이상
- npm 또는 yarn
- Git

### 데이터베이스 설정

1. PostgreSQL 설치 및 실행
2. 데이터베이스 생성
3. 환경 변수 설정

\`\`\`bash
# 데이터베이스 생성
createdb ${this.sanitizeProjectName(goal.description)}

# 마이그레이션 실행
npm run migrate

# 시드 데이터 삽입
npm run seed
\`\`\`

### 개발 서버 실행

\`\`\`bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
\`\`\`

## 코딩 컨벤션

### TypeScript

- 엄격한 타입 체크 사용
- 인터페이스 정의 필수
- JSDoc 주석 작성

### 코드 스타일

- ESLint 규칙 준수
- Prettier 포맷팅 사용
- 의미있는 변수명 사용

## 테스트

### 단위 테스트

\`\`\`bash
npm test
\`\`\`

### E2E 테스트

\`\`\`bash
npm run test:e2e
\`\`\`

## 디버깅

### 로그 확인

\`\`\`bash
# 개발 로그
npm run dev

# 프로덕션 로그
docker-compose logs -f app
\`\`\`
`;
    }

    private generateDeploymentGuide(goal: Goal, techStack: TechStack): string {
        return `# 배포 가이드

## Docker를 사용한 배포

### 이미지 빌드

\`\`\`bash
docker build -t ${this.sanitizeProjectName(goal.description)} .
\`\`\`

### 컨테이너 실행

\`\`\`bash
docker run -p 3000:3000 \\
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \\
  ${this.sanitizeProjectName(goal.description)}
\`\`\`

### Docker Compose 사용

\`\`\`bash
docker-compose up -d
\`\`\`

## Kubernetes를 사용한 배포

### 매니페스트 적용

\`\`\`bash
kubectl apply -f k8s/
\`\`\`

### 서비스 확인

\`\`\`bash
kubectl get services
kubectl get pods
\`\`\`

## 환경 변수

### 필수 환경 변수

- \`DATABASE_URL\`: 데이터베이스 연결 문자열
- \`JWT_SECRET\`: JWT 시크릿 키
- \`NODE_ENV\`: 환경 (development/production)

### 선택적 환경 변수

- \`PORT\`: 서버 포트 (기본값: 3000)
- \`LOG_LEVEL\`: 로그 레벨 (기본값: info)
- \`CORS_ORIGIN\`: CORS 허용 오리진

## 모니터링

### 헬스 체크

\`\`\`bash
curl http://localhost:3000/health
\`\`\`

### 로그 모니터링

\`\`\`bash
# Docker 로그
docker-compose logs -f

# Kubernetes 로그
kubectl logs -f deployment/${this.sanitizeProjectName(goal.description)}-app
\`\`\`
`;
    }

    private generateJestConfig(techStack: TechStack): string {
        return `module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/test-utils.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/test-utils.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
`;
    }

    private generatePlaywrightConfig(techStack: TechStack): string {
        return `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
`;
    }

    private generateTestUtils(techStack: TechStack): string {
        return `import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

// 테스트 유틸리티 함수들
export const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, { ...options });
};

// Mock 데이터 생성 함수들
export const createMockUser = (overrides = {}) => ({
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  ...overrides,
});

export const createMockPost = (overrides = {}) => ({
  id: 1,
  title: 'Test Post',
  content: 'Test content',
  authorId: 1,
  createdAt: new Date().toISOString(),
  ...overrides,
});

// API Mock 함수들
export const mockApiResponse = (data: any, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
});

// 테스트 헬퍼 함수들
export const waitFor = (ms: number) => 
  new Promise(resolve => setTimeout(resolve, ms));
`;
    }

    private generateDockerfile(goal: Goal, techStack: TechStack): string {
        const isNode = techStack.backend.some(tech => tech.name === 'Node.js');
        const isReact = techStack.frontend.some(tech => tech.name === 'React');

        if (isNode && isReact) {
            return `# Multi-stage build for Node.js + React
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

CMD ["npm", "start"]`;
        } else if (isNode) {
            return `FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

CMD ["npm", "start"]`;
        } else {
            return `# Generic Dockerfile
FROM alpine:latest

WORKDIR /app

COPY . .

EXPOSE 3000

CMD ["echo", "Hello from ${goal.description}"]`;
        }
    }

    private generateNginxConfig(techStack: TechStack): string {
        return `server {
    listen 80;
    server_name localhost;

    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location /static/ {
        alias /app/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        proxy_pass http://app:3000/health;
        access_log off;
    }
}`;
    }

    private generateDeployScript(techStack: TechStack): string {
        return `#!/bin/bash

# 배포 스크립트
# Generated by Auto Dev System

set -e

echo "🚀 배포 시작..."

# 환경 변수 확인
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL 환경 변수가 설정되지 않았습니다."
    exit 1
fi

# Docker 이미지 빌드
echo "📦 Docker 이미지 빌드 중..."
docker build -t ${this.sanitizeProjectName(goal.description)}:latest .

# 기존 컨테이너 중지
echo "🛑 기존 컨테이너 중지 중..."
docker-compose down || true

# 새 컨테이너 시작
echo "🚀 새 컨테이너 시작 중..."
docker-compose up -d

# 헬스 체크
echo "❤️  헬스 체크 중..."
sleep 10
curl -f http://localhost:3000/health || {
    echo "❌ 헬스 체크 실패"
    exit 1
}

echo "✅ 배포 완료!"
echo "🌐 애플리케이션: http://localhost:3000"
echo "❤️  헬스 체크: http://localhost:3000/health"
`;
    }

    /**
     * 고유 ID 생성
     */
    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}

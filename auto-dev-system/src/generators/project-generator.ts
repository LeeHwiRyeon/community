import fs from 'fs/promises';
import path from 'path';
import { ProjectStructure, Directory, ProjectFile, Dependency, Script, TechStack } from '@/types';

export class ProjectGenerator {
    private outputDir: string;

    constructor(outputDir: string = './generated-projects') {
        this.outputDir = outputDir;
    }

    /**
     * 프로젝트 구조 생성
     */
    async generateProjectStructure(
        name: string,
        techStack: TechStack,
        type: 'monolith' | 'microservices' | 'serverless' = 'monolith'
    ): Promise<ProjectStructure> {
        const projectDir = path.join(this.outputDir, name);

        // 프로젝트 디렉토리 생성
        await fs.mkdir(projectDir, { recursive: true });

        const structure: ProjectStructure = {
            id: this.generateId(),
            name,
            type,
            directories: [],
            files: [],
            dependencies: [],
            scripts: []
        };

        // 프로젝트 타입별 구조 생성
        switch (type) {
            case 'monolith':
                await this.generateMonolithStructure(projectDir, techStack, structure);
                break;
            case 'microservices':
                await this.generateMicroservicesStructure(projectDir, techStack, structure);
                break;
            case 'serverless':
                await this.generateServerlessStructure(projectDir, techStack, structure);
                break;
        }

        return structure;
    }

    /**
     * 모놀리식 프로젝트 구조 생성
     */
    private async generateMonolithStructure(
        projectDir: string,
        techStack: TechStack,
        structure: ProjectStructure
    ): Promise<void> {
        // 루트 디렉토리 구조
        const rootDirs = [
            'src',
            'public',
            'tests',
            'docs',
            'scripts',
            'config'
        ];

        for (const dir of rootDirs) {
            const dirPath = path.join(projectDir, dir);
            await fs.mkdir(dirPath, { recursive: true });

            structure.directories.push({
                name: dir,
                path: dir,
                purpose: this.getDirectoryPurpose(dir),
                children: []
            });
        }

        // src 하위 구조
        const srcDirs = ['components', 'pages', 'services', 'utils', 'hooks', 'types'];
        for (const dir of srcDirs) {
            const dirPath = path.join(projectDir, 'src', dir);
            await fs.mkdir(dirPath, { recursive: true });

            structure.directories[0].children.push({
                name: dir,
                path: `src/${dir}`,
                purpose: this.getDirectoryPurpose(`src/${dir}`),
                children: []
            });
        }

        // 기본 파일들 생성
        await this.generateBasicFiles(projectDir, techStack, structure);
    }

    /**
     * 마이크로서비스 프로젝트 구조 생성
     */
    private async generateMicroservicesStructure(
        projectDir: string,
        techStack: TechStack,
        structure: ProjectStructure
    ): Promise<void> {
        // 서비스별 디렉토리 생성
        const services = ['user-service', 'content-service', 'notification-service', 'api-gateway'];

        for (const service of services) {
            const serviceDir = path.join(projectDir, 'services', service);
            await fs.mkdir(serviceDir, { recursive: true });

            structure.directories.push({
                name: service,
                path: `services/${service}`,
                purpose: `${service} 마이크로서비스`,
                children: []
            });

            // 각 서비스 내부 구조
            const serviceDirs = ['src', 'tests', 'docs', 'config'];
            for (const dir of serviceDirs) {
                const dirPath = path.join(serviceDir, dir);
                await fs.mkdir(dirPath, { recursive: true });

                structure.directories[structure.directories.length - 1].children.push({
                    name: dir,
                    path: `services/${service}/${dir}`,
                    purpose: this.getDirectoryPurpose(dir),
                    children: []
                });
            }
        }

        // 공통 디렉토리
        const commonDirs = ['shared', 'infrastructure', 'docs'];
        for (const dir of commonDirs) {
            const dirPath = path.join(projectDir, dir);
            await fs.mkdir(dirPath, { recursive: true });

            structure.directories.push({
                name: dir,
                path: dir,
                purpose: this.getDirectoryPurpose(dir),
                children: []
            });
        }

        // 마이크로서비스용 기본 파일들 생성
        await this.generateMicroservicesFiles(projectDir, techStack, structure);
    }

    /**
     * 서버리스 프로젝트 구조 생성
     */
    private async generateServerlessStructure(
        projectDir: string,
        techStack: TechStack,
        structure: ProjectStructure
    ): Promise<void> {
        // 함수별 디렉토리 생성
        const functions = ['auth', 'api', 'webhook', 'scheduled'];

        for (const func of functions) {
            const funcDir = path.join(projectDir, 'functions', func);
            await fs.mkdir(funcDir, { recursive: true });

            structure.directories.push({
                name: func,
                path: `functions/${func}`,
                purpose: `${func} 서버리스 함수`,
                children: []
            });
        }

        // 서버리스용 기본 파일들 생성
        await this.generateServerlessFiles(projectDir, techStack, structure);
    }

    /**
     * 기본 파일들 생성
     */
    private async generateBasicFiles(
        projectDir: string,
        techStack: TechStack,
        structure: ProjectStructure
    ): Promise<void> {
        // package.json
        const packageJson = this.generatePackageJson(techStack);
        await this.writeFile(projectDir, 'package.json', packageJson);
        structure.files.push({
            name: 'package.json',
            path: 'package.json',
            type: 'config',
            content: packageJson,
            language: 'json',
            size: packageJson.length
        });

        // README.md
        const readme = this.generateReadme(structure.name);
        await this.writeFile(projectDir, 'README.md', readme);
        structure.files.push({
            name: 'README.md',
            path: 'README.md',
            type: 'documentation',
            content: readme,
            language: 'markdown',
            size: readme.length
        });

        // TypeScript 설정
        if (techStack.frontend.some(tech => tech.name === 'TypeScript') ||
            techStack.backend.some(tech => tech.name === 'TypeScript')) {
            const tsconfig = this.generateTsConfig();
            await this.writeFile(projectDir, 'tsconfig.json', tsconfig);
            structure.files.push({
                name: 'tsconfig.json',
                path: 'tsconfig.json',
                type: 'config',
                content: tsconfig,
                language: 'json',
                size: tsconfig.length
            });
        }

        // Docker 설정
        const dockerfile = this.generateDockerfile(techStack);
        await this.writeFile(projectDir, 'Dockerfile', dockerfile);
        structure.files.push({
            name: 'Dockerfile',
            path: 'Dockerfile',
            type: 'config',
            content: dockerfile,
            language: 'dockerfile',
            size: dockerfile.length
        });

        // 환경 변수 파일
        const envExample = this.generateEnvExample();
        await this.writeFile(projectDir, '.env.example', envExample);
        structure.files.push({
            name: '.env.example',
            path: '.env.example',
            type: 'config',
            content: envExample,
            language: 'text',
            size: envExample.length
        });
    }

    /**
     * 마이크로서비스용 파일들 생성
     */
    private async generateMicroservicesFiles(
        projectDir: string,
        techStack: TechStack,
        structure: ProjectStructure
    ): Promise<void> {
        // docker-compose.yml
        const dockerCompose = this.generateDockerCompose();
        await this.writeFile(projectDir, 'docker-compose.yml', dockerCompose);
        structure.files.push({
            name: 'docker-compose.yml',
            path: 'docker-compose.yml',
            type: 'config',
            content: dockerCompose,
            language: 'yaml',
            size: dockerCompose.length
        });

        // Kubernetes 설정
        const k8sManifests = this.generateK8sManifests();
        for (const [filename, content] of Object.entries(k8sManifests)) {
            const k8sDir = path.join(projectDir, 'k8s');
            await fs.mkdir(k8sDir, { recursive: true });
            await this.writeFile(k8sDir, filename, content);
            structure.files.push({
                name: filename,
                path: `k8s/${filename}`,
                type: 'config',
                content,
                language: 'yaml',
                size: content.length
            });
        }
    }

    /**
     * 서버리스용 파일들 생성
     */
    private async generateServerlessFiles(
        projectDir: string,
        techStack: TechStack,
        structure: ProjectStructure
    ): Promise<void> {
        // serverless.yml
        const serverlessConfig = this.generateServerlessConfig();
        await this.writeFile(projectDir, 'serverless.yml', serverlessConfig);
        structure.files.push({
            name: 'serverless.yml',
            path: 'serverless.yml',
            type: 'config',
            content: serverlessConfig,
            language: 'yaml',
            size: serverlessConfig.length
        });
    }

    /**
     * package.json 생성
     */
    private generatePackageJson(techStack: TechStack): string {
        const dependencies: Dependency[] = [];
        const devDependencies: Dependency[] = [];

        // 프론트엔드 의존성
        techStack.frontend.forEach(tech => {
            switch (tech.name) {
                case 'React':
                    dependencies.push({
                        name: 'react',
                        version: '^18.2.0',
                        type: 'production',
                        description: 'React 라이브러리'
                    });
                    dependencies.push({
                        name: 'react-dom',
                        version: '^18.2.0',
                        type: 'production',
                        description: 'React DOM 렌더러'
                    });
                    break;
                case 'Vue.js':
                    dependencies.push({
                        name: 'vue',
                        version: '^3.3.0',
                        type: 'production',
                        description: 'Vue.js 프레임워크'
                    });
                    break;
            }
        });

        // 백엔드 의존성
        techStack.backend.forEach(tech => {
            switch (tech.name) {
                case 'Node.js':
                    dependencies.push({
                        name: 'express',
                        version: '^4.18.0',
                        type: 'production',
                        description: 'Express.js 웹 프레임워크'
                    });
                    break;
                case 'Python':
                    // Python 의존성은 requirements.txt로 관리
                    break;
            }
        });

        // 데이터베이스 의존성
        techStack.database.forEach(tech => {
            switch (tech.name) {
                case 'PostgreSQL':
                    dependencies.push({
                        name: 'pg',
                        version: '^8.11.0',
                        type: 'production',
                        description: 'PostgreSQL 클라이언트'
                    });
                    break;
                case 'MongoDB':
                    dependencies.push({
                        name: 'mongodb',
                        version: '^6.0.0',
                        type: 'production',
                        description: 'MongoDB 드라이버'
                    });
                    break;
                case 'Redis':
                    dependencies.push({
                        name: 'redis',
                        version: '^4.6.0',
                        type: 'production',
                        description: 'Redis 클라이언트'
                    });
                    break;
            }
        });

        // 개발 의존성
        devDependencies.push({
            name: 'typescript',
            version: '^5.0.0',
            type: 'development',
            description: 'TypeScript 컴파일러'
        });
        devDependencies.push({
            name: '@types/node',
            version: '^20.0.0',
            type: 'development',
            description: 'Node.js 타입 정의'
        });
        devDependencies.push({
            name: 'jest',
            version: '^29.7.0',
            type: 'development',
            description: '테스트 프레임워크'
        });

        const packageJson = {
            name: 'auto-generated-project',
            version: '1.0.0',
            description: '자동 생성된 프로젝트',
            main: 'dist/index.js',
            scripts: {
                dev: 'tsx watch src/index.ts',
                build: 'tsc',
                start: 'node dist/index.js',
                test: 'jest',
                test: watch: 'jest --watch',
                lint: 'eslint src/**/*.ts',
                format: 'prettier --write src/**/*.ts'
            },
            dependencies: dependencies.reduce((acc, dep) => {
                acc[dep.name] = dep.version;
                return acc;
            }, {} as Record<string, string>),
            devDependencies: devDependencies.reduce((acc, dep) => {
                acc[dep.name] = dep.version;
                return acc;
            }, {} as Record<string, string>),
            keywords: ['auto-generated', 'typescript', 'nodejs'],
            author: 'Auto Dev System',
            license: 'MIT'
        };

        return JSON.stringify(packageJson, null, 2);
    }

    /**
     * README.md 생성
     */
    private generateReadme(projectName: string): string {
        return `# ${projectName}

자동 생성된 프로젝트입니다.

## 설치 및 실행

\`\`\`bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 테스트 실행
npm test
\`\`\`

## 프로젝트 구조

- \`src/\` - 소스 코드
- \`tests/\` - 테스트 파일
- \`docs/\` - 문서
- \`scripts/\` - 스크립트

## 개발 가이드

이 프로젝트는 자동 개발 시스템에 의해 생성되었습니다.
`;
    }

    /**
     * tsconfig.json 생성
     */
    private generateTsConfig(): string {
        return JSON.stringify({
            compilerOptions: {
                target: 'ES2022',
                module: 'commonjs',
                lib: ['ES2022'],
                outDir: './dist',
                rootDir: './src',
                strict: true,
                esModuleInterop: true,
                skipLibCheck: true,
                forceConsistentCasingInFileNames: true,
                resolveJsonModule: true,
                declaration: true,
                sourceMap: true
            },
            include: ['src/**/*'],
            exclude: ['node_modules', 'dist', '**/*.test.ts']
        }, null, 2);
    }

    /**
     * Dockerfile 생성
     */
    private generateDockerfile(techStack: TechStack): string {
        const isNodeProject = techStack.backend.some(tech => tech.name === 'Node.js');
        const isPythonProject = techStack.backend.some(tech => tech.name === 'Python');

        if (isNodeProject) {
            return `FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]`;
        } else if (isPythonProject) {
            return `FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "main.py"]`;
        }

        return `# Dockerfile for auto-generated project
FROM alpine:latest

WORKDIR /app

COPY . .

EXPOSE 3000

CMD ["echo", "Hello from auto-generated project"]`;
    }

    /**
     * .env.example 생성
     */
    private generateEnvExample(): string {
        return `# 환경 변수 설정
NODE_ENV=development
PORT=3000

# 데이터베이스 설정
DATABASE_URL=postgresql://username:password@localhost:5432/database
REDIS_URL=redis://localhost:6379

# API 키
API_KEY=your_api_key_here

# 로깅
LOG_LEVEL=info
`;
    }

    /**
     * docker-compose.yml 생성
     */
    private generateDockerCompose(): string {
        return `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
`;
    }

    /**
     * Kubernetes 매니페스트 생성
     */
    private generateK8sManifests(): Record<string, string> {
        return {
            'deployment.yaml': `apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: app
  template:
    metadata:
      labels:
        app: app
    spec:
      containers:
      - name: app
        image: app:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"`,
            'service.yaml': `apiVersion: v1
kind: Service
metadata:
  name: app-service
spec:
  selector:
    app: app
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer`,
            'ingress.yaml': `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
spec:
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: app-service
            port:
              number: 80`
        };
    }

    /**
     * serverless.yml 생성
     */
    private generateServerlessConfig(): string {
        return `service: auto-generated-project

provider:
  name: aws
  runtime: nodejs20.x
  region: ap-northeast-2

functions:
  hello:
    handler: src/handlers/hello.handler
    events:
      - http:
          path: hello
          method: get

  api:
    handler: src/handlers/api.handler
    events:
      - http:
          path: api/{proxy+}
          method: ANY

plugins:
  - serverless-offline
`;
    }

    /**
     * 디렉토리 목적 설명
     */
    private getDirectoryPurpose(dir: string): string {
        const purposes: Record<string, string> = {
            'src': '소스 코드',
            'public': '정적 파일',
            'tests': '테스트 파일',
            'docs': '문서',
            'scripts': '빌드 및 배포 스크립트',
            'config': '설정 파일',
            'src/components': 'React 컴포넌트',
            'src/pages': '페이지 컴포넌트',
            'src/services': '비즈니스 로직',
            'src/utils': '유틸리티 함수',
            'src/hooks': 'React 훅',
            'src/types': 'TypeScript 타입 정의',
            'shared': '공통 코드',
            'infrastructure': '인프라 설정'
        };

        return purposes[dir] || '일반 디렉토리';
    }

    /**
     * 파일 쓰기 헬퍼
     */
    private async writeFile(dir: string, filename: string, content: string): Promise<void> {
        const filePath = path.join(dir, filename);
        await fs.writeFile(filePath, content, 'utf-8');
    }

    /**
     * 고유 ID 생성
     */
    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}

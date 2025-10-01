import fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';
import { CodeFile, TechStack, Goal } from '@/types';

export class APIGenerator {
    private openai: OpenAI;
    private outputDir: string;

    constructor(apiKey: string, outputDir: string = './generated-projects') {
        this.openai = new OpenAI({ apiKey });
        this.outputDir = outputDir;
    }

    /**
     * API 코드 생성
     */
    async generateAPICode(
        goal: Goal,
        techStack: TechStack,
        projectStructure: any
    ): Promise<CodeFile[]> {
        console.log('🔧 API 코드 생성 중...');

        const generatedFiles: CodeFile[] = [];

        try {
            // 1. 메인 서버 파일 생성
            const serverFile = await this.generateServerFile(goal, techStack);
            generatedFiles.push(serverFile);

            // 2. 라우터 파일들 생성
            const routerFiles = await this.generateRouterFiles(goal, techStack);
            generatedFiles.push(...routerFiles);

            // 3. 컨트롤러 파일들 생성
            const controllerFiles = await this.generateControllerFiles(goal, techStack);
            generatedFiles.push(...controllerFiles);

            // 4. 서비스 파일들 생성
            const serviceFiles = await this.generateServiceFiles(goal, techStack);
            generatedFiles.push(...serviceFiles);

            // 5. 미들웨어 파일들 생성
            const middlewareFiles = await this.generateMiddlewareFiles(techStack);
            generatedFiles.push(...middlewareFiles);

            // 6. 모델 파일들 생성
            const modelFiles = await this.generateModelFiles(goal, techStack);
            generatedFiles.push(...modelFiles);

            // 7. 유틸리티 파일들 생성
            const utilityFiles = await this.generateUtilityFiles(techStack);
            generatedFiles.push(...utilityFiles);

            // 8. 설정 파일들 생성
            const configFiles = await this.generateConfigFiles(techStack);
            generatedFiles.push(...configFiles);

            // 파일들을 실제로 생성
            await this.writeFilesToDisk(generatedFiles, projectStructure);

            console.log(`✅ API 코드 생성 완료: ${generatedFiles.length}개 파일`);
            return generatedFiles;

        } catch (error) {
            console.error('❌ API 코드 생성 실패:', error);
            throw error;
        }
    }

    /**
     * 메인 서버 파일 생성
     */
    private async generateServerFile(goal: Goal, techStack: TechStack): Promise<CodeFile> {
        const isExpress = techStack.backend.some(tech => tech.name === 'Node.js');
        const isFastify = techStack.backend.some(tech => tech.name === 'Fastify');
        const isKoa = techStack.backend.some(tech => tech.name === 'Koa');

        let content = '';
        let filename = '';

        if (isExpress) {
            filename = 'server.js';
            content = await this.generateExpressServer(goal, techStack);
        } else if (isFastify) {
            filename = 'server.js';
            content = await this.generateFastifyServer(goal, techStack);
        } else if (isKoa) {
            filename = 'server.js';
            content = await this.generateKoaServer(goal, techStack);
        } else {
            // 기본 Express 서버
            filename = 'server.js';
            content = await this.generateExpressServer(goal, techStack);
        }

        return {
            id: this.generateId(),
            name: filename,
            path: `src/${filename}`,
            content,
            language: 'javascript',
            size: content.length,
            complexity: this.calculateComplexity(content),
            quality: this.calculateQuality(content),
            lastModified: new Date()
        };
    }

    /**
     * Express 서버 생성
     */
    private async generateExpressServer(goal: Goal, techStack: TechStack): Promise<string> {
        const prompt = `
다음 요구사항에 맞는 Express.js 서버를 생성해주세요:

목표: ${goal.description}
카테고리: ${goal.category}
복잡도: ${goal.complexity}
요구사항: ${goal.requirements.map(r => r.description).join(', ')}

기술 스택:
- Backend: ${techStack.backend.map(t => t.name).join(', ')}
- Database: ${techStack.database.map(t => t.name).join(', ')}
- Frontend: ${techStack.frontend.map(t => t.name).join(', ')}

다음 기능들을 포함해야 합니다:
1. Express.js 기본 설정
2. CORS, Helmet, Morgan 미들웨어
3. JSON 파싱 미들웨어
4. 라우터 설정
5. 에러 핸들링 미들웨어
6. 헬스 체크 엔드포인트
7. 환경 변수 설정
8. 로깅 설정

완전한 서버 코드를 생성해주세요.
    `;

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 2000
        });

        return response.choices[0].message.content || this.getDefaultExpressServer();
    }

    /**
     * Fastify 서버 생성
     */
    private async generateFastifyServer(goal: Goal, techStack: TechStack): Promise<string> {
        const prompt = `
다음 요구사항에 맞는 Fastify 서버를 생성해주세요:

목표: ${goal.description}
카테고리: ${goal.category}
복잡도: ${goal.complexity}

기술 스택:
- Backend: ${techStack.backend.map(t => t.name).join(', ')}
- Database: ${techStack.database.map(t => t.name).join(', ')}

다음 기능들을 포함해야 합니다:
1. Fastify 기본 설정
2. CORS, Helmet 플러그인
3. 라우터 등록
4. 에러 핸들링
5. 헬스 체크 엔드포인트
6. 환경 변수 설정

완전한 서버 코드를 생성해주세요.
    `;

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 2000
        });

        return response.choices[0].message.content || this.getDefaultFastifyServer();
    }

    /**
     * Koa 서버 생성
     */
    private async generateKoaServer(goal: Goal, techStack: TechStack): Promise<string> {
        const prompt = `
다음 요구사항에 맞는 Koa 서버를 생성해주세요:

목표: ${goal.description}
카테고리: ${goal.category}
복잡도: ${goal.complexity}

기술 스택:
- Backend: ${techStack.backend.map(t => t.name).join(', ')}
- Database: ${techStack.database.map(t => t.name).join(', ')}

다음 기능들을 포함해야 합니다:
1. Koa 기본 설정
2. CORS, Helmet 미들웨어
3. 라우터 설정
4. 에러 핸들링
5. 헬스 체크 엔드포인트
6. 환경 변수 설정

완전한 서버 코드를 생성해주세요.
    `;

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 2000
        });

        return response.choices[0].message.content || this.getDefaultKoaServer();
    }

    /**
     * 라우터 파일들 생성
     */
    private async generateRouterFiles(goal: Goal, techStack: TechStack): Promise<CodeFile[]> {
        const files: CodeFile[] = [];

        // 목표에 따른 라우터 생성
        const routers = this.determineRouters(goal);

        for (const router of routers) {
            const content = await this.generateRouterContent(router, goal, techStack);
            files.push({
                id: this.generateId(),
                name: `${router.name}.js`,
                path: `src/routes/${router.name}.js`,
                content,
                language: 'javascript',
                size: content.length,
                complexity: this.calculateComplexity(content),
                quality: this.calculateQuality(content),
                lastModified: new Date()
            });
        }

        // 메인 라우터 파일
        const mainRouterContent = this.generateMainRouter(routers);
        files.push({
            id: this.generateId(),
            name: 'index.js',
            path: 'src/routes/index.js',
            content: mainRouterContent,
            language: 'javascript',
            size: mainRouterContent.length,
            complexity: this.calculateComplexity(mainRouterContent),
            quality: this.calculateQuality(mainRouterContent),
            lastModified: new Date()
        });

        return files;
    }

    /**
     * 목표에 따른 라우터 결정
     */
    private determineRouters(goal: Goal): Array<{ name: string; endpoints: string[] }> {
        const routers = [];

        // 기본 라우터들
        routers.push({ name: 'health', endpoints: ['GET /health', 'GET /status'] });

        // 목표별 라우터 추가
        if (goal.category === 'web-app' || goal.category === 'api') {
            if (goal.requirements.some(r => r.description.includes('인증') || r.description.includes('로그인'))) {
                routers.push({
                    name: 'auth',
                    endpoints: [
                        'POST /auth/login',
                        'POST /auth/register',
                        'POST /auth/logout',
                        'POST /auth/refresh',
                        'GET /auth/profile'
                    ]
                });
            }

            if (goal.requirements.some(r => r.description.includes('사용자') || r.description.includes('프로필'))) {
                routers.push({
                    name: 'users',
                    endpoints: [
                        'GET /users',
                        'GET /users/:id',
                        'PUT /users/:id',
                        'DELETE /users/:id'
                    ]
                });
            }

            if (goal.requirements.some(r => r.description.includes('게시물') || r.description.includes('포스트'))) {
                routers.push({
                    name: 'posts',
                    endpoints: [
                        'GET /posts',
                        'GET /posts/:id',
                        'POST /posts',
                        'PUT /posts/:id',
                        'DELETE /posts/:id'
                    ]
                });
            }

            if (goal.requirements.some(r => r.description.includes('댓글') || r.description.includes('코멘트'))) {
                routers.push({
                    name: 'comments',
                    endpoints: [
                        'GET /comments',
                        'GET /comments/:id',
                        'POST /comments',
                        'PUT /comments/:id',
                        'DELETE /comments/:id'
                    ]
                });
            }
        }

        return routers;
    }

    /**
     * 라우터 내용 생성
     */
    private async generateRouterContent(
        router: { name: string; endpoints: string[] },
        goal: Goal,
        techStack: TechStack
    ): Promise<string> {
        const prompt = `
다음 라우터를 생성해주세요:

라우터 이름: ${router.name}
엔드포인트: ${router.endpoints.join(', ')}

목표: ${goal.description}
기술 스택: ${techStack.backend.map(t => t.name).join(', ')}

다음 기능들을 포함해야 합니다:
1. Express Router 설정
2. 각 엔드포인트에 대한 라우트 핸들러
3. 요청 유효성 검사
4. 에러 핸들링
5. 적절한 HTTP 상태 코드
6. JSDoc 주석

완전한 라우터 코드를 생성해주세요.
    `;

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 1500
        });

        return response.choices[0].message.content || this.getDefaultRouter(router);
    }

    /**
     * 메인 라우터 생성
     */
    private generateMainRouter(routers: Array<{ name: string; endpoints: string[] }>): string {
        const imports = routers.map(router =>
            `const ${router.name}Router = require('./${router.name}');`
        ).join('\n');

        const routes = routers.map(router =>
            `app.use('/api/${router.name}', ${router.name}Router);`
        ).join('\n');

        return `const express = require('express');
const app = express();

${imports}

// 라우터 등록
${routes}

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: '요청한 리소스를 찾을 수 없습니다.',
    path: req.originalUrl
  });
});

module.exports = app;
`;
    }

    /**
     * 컨트롤러 파일들 생성
     */
    private async generateControllerFiles(goal: Goal, techStack: TechStack): Promise<CodeFile[]> {
        const files: CodeFile[] = [];
        const routers = this.determineRouters(goal);

        for (const router of routers) {
            if (router.name === 'health') continue; // 헬스 체크는 별도 처리

            const content = await this.generateControllerContent(router, goal, techStack);
            files.push({
                id: this.generateId(),
                name: `${router.name}Controller.js`,
                path: `src/controllers/${router.name}Controller.js`,
                content,
                language: 'javascript',
                size: content.length,
                complexity: this.calculateComplexity(content),
                quality: this.calculateQuality(content),
                lastModified: new Date()
            });
        }

        return files;
    }

    /**
     * 컨트롤러 내용 생성
     */
    private async generateControllerContent(
        router: { name: string; endpoints: string[] },
        goal: Goal,
        techStack: TechStack
    ): Promise<string> {
        const prompt = `
다음 컨트롤러를 생성해주세요:

컨트롤러 이름: ${router.name}Controller
엔드포인트: ${router.endpoints.join(', ')}

목표: ${goal.description}
기술 스택: ${techStack.backend.map(t => t.name).join(', ')}

다음 기능들을 포함해야 합니다:
1. 각 엔드포인트에 대한 컨트롤러 함수
2. 요청 데이터 유효성 검사
3. 서비스 레이어 호출
4. 응답 데이터 포맷팅
5. 에러 핸들링
6. JSDoc 주석
7. 적절한 HTTP 상태 코드

완전한 컨트롤러 코드를 생성해주세요.
    `;

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 1500
        });

        return response.choices[0].message.content || this.getDefaultController(router);
    }

    /**
     * 서비스 파일들 생성
     */
    private async generateServiceFiles(goal: Goal, techStack: TechStack): Promise<CodeFile[]> {
        const files: CodeFile[] = [];
        const routers = this.determineRouters(goal);

        for (const router of routers) {
            if (router.name === 'health') continue;

            const content = await this.generateServiceContent(router, goal, techStack);
            files.push({
                id: this.generateId(),
                name: `${router.name}Service.js`,
                path: `src/services/${router.name}Service.js`,
                content,
                language: 'javascript',
                size: content.length,
                complexity: this.calculateComplexity(content),
                quality: this.calculateQuality(content),
                lastModified: new Date()
            });
        }

        return files;
    }

    /**
     * 서비스 내용 생성
     */
    private async generateServiceContent(
        router: { name: string; endpoints: string[] },
        goal: Goal,
        techStack: TechStack
    ): Promise<string> {
        const prompt = `
다음 서비스를 생성해주세요:

서비스 이름: ${router.name}Service
기능: ${router.endpoints.join(', ')}

목표: ${goal.description}
기술 스택: ${techStack.backend.map(t => t.name).join(', ')}
데이터베이스: ${techStack.database.map(t => t.name).join(', ')}

다음 기능들을 포함해야 합니다:
1. 비즈니스 로직 구현
2. 데이터베이스 연동
3. 데이터 유효성 검사
4. 에러 처리
5. 로깅
6. JSDoc 주석

완전한 서비스 코드를 생성해주세요.
    `;

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 1500
        });

        return response.choices[0].message.content || this.getDefaultService(router);
    }

    /**
     * 미들웨어 파일들 생성
     */
    private async generateMiddlewareFiles(techStack: TechStack): Promise<CodeFile[]> {
        const files: CodeFile[] = [];

        // 인증 미들웨어
        const authMiddleware = this.generateAuthMiddleware();
        files.push({
            id: this.generateId(),
            name: 'auth.js',
            path: 'src/middleware/auth.js',
            content: authMiddleware,
            language: 'javascript',
            size: authMiddleware.length,
            complexity: this.calculateComplexity(authMiddleware),
            quality: this.calculateQuality(authMiddleware),
            lastModified: new Date()
        });

        // 유효성 검사 미들웨어
        const validationMiddleware = this.generateValidationMiddleware();
        files.push({
            id: this.generateId(),
            name: 'validation.js',
            path: 'src/middleware/validation.js',
            content: validationMiddleware,
            language: 'javascript',
            size: validationMiddleware.length,
            complexity: this.calculateComplexity(validationMiddleware),
            quality: this.calculateQuality(validationMiddleware),
            lastModified: new Date()
        });

        // 에러 핸들링 미들웨어
        const errorMiddleware = this.generateErrorMiddleware();
        files.push({
            id: this.generateId(),
            name: 'errorHandler.js',
            path: 'src/middleware/errorHandler.js',
            content: errorMiddleware,
            language: 'javascript',
            size: errorMiddleware.length,
            complexity: this.calculateComplexity(errorMiddleware),
            quality: this.calculateQuality(errorMiddleware),
            lastModified: new Date()
        });

        return files;
    }

    /**
     * 모델 파일들 생성
     */
    private async generateModelFiles(goal: Goal, techStack: TechStack): Promise<CodeFile[]> {
        const files: CodeFile[] = [];
        const routers = this.determineRouters(goal);

        for (const router of routers) {
            if (router.name === 'health') continue;

            const content = await this.generateModelContent(router, techStack);
            files.push({
                id: this.generateId(),
                name: `${router.name}.js`,
                path: `src/models/${router.name}.js`,
                content,
                language: 'javascript',
                size: content.length,
                complexity: this.calculateComplexity(content),
                quality: this.calculateQuality(content),
                lastModified: new Date()
            });
        }

        return files;
    }

    /**
     * 모델 내용 생성
     */
    private async generateModelContent(
        router: { name: string; endpoints: string[] },
        techStack: TechStack
    ): Promise<string> {
        const isMongoDB = techStack.database.some(db => db.name === 'MongoDB');
        const isPostgreSQL = techStack.database.some(db => db.name === 'PostgreSQL');

        if (isMongoDB) {
            return this.generateMongoDBModel(router);
        } else if (isPostgreSQL) {
            return this.generatePostgreSQLModel(router);
        } else {
            return this.generateDefaultModel(router);
        }
    }

    /**
     * 유틸리티 파일들 생성
     */
    private async generateUtilityFiles(techStack: TechStack): Promise<CodeFile[]> {
        const files: CodeFile[] = [];

        // 데이터베이스 연결 유틸리티
        const dbUtil = this.generateDatabaseUtil(techStack);
        files.push({
            id: this.generateId(),
            name: 'database.js',
            path: 'src/utils/database.js',
            content: dbUtil,
            language: 'javascript',
            size: dbUtil.length,
            complexity: this.calculateComplexity(dbUtil),
            quality: this.calculateQuality(dbUtil),
            lastModified: new Date()
        });

        // 로깅 유틸리티
        const loggerUtil = this.generateLoggerUtil();
        files.push({
            id: this.generateId(),
            name: 'logger.js',
            path: 'src/utils/logger.js',
            content: loggerUtil,
            language: 'javascript',
            size: loggerUtil.length,
            complexity: this.calculateComplexity(loggerUtil),
            quality: this.calculateQuality(loggerUtil),
            lastModified: new Date()
        });

        // 암호화 유틸리티
        const cryptoUtil = this.generateCryptoUtil();
        files.push({
            id: this.generateId(),
            name: 'crypto.js',
            path: 'src/utils/crypto.js',
            content: cryptoUtil,
            language: 'javascript',
            size: cryptoUtil.length,
            complexity: this.calculateComplexity(cryptoUtil),
            quality: this.calculateQuality(cryptoUtil),
            lastModified: new Date()
        });

        return files;
    }

    /**
     * 설정 파일들 생성
     */
    private async generateConfigFiles(techStack: TechStack): Promise<CodeFile[]> {
        const files: CodeFile[] = [];

        // 환경 설정
        const envConfig = this.generateEnvConfig();
        files.push({
            id: this.generateId(),
            name: 'config.js',
            path: 'src/config/config.js',
            content: envConfig,
            language: 'javascript',
            size: envConfig.length,
            complexity: this.calculateComplexity(envConfig),
            quality: this.calculateQuality(envConfig),
            lastModified: new Date()
        });

        // 데이터베이스 설정
        const dbConfig = this.generateDatabaseConfig(techStack);
        files.push({
            id: this.generateId(),
            name: 'database.js',
            path: 'src/config/database.js',
            content: dbConfig,
            language: 'javascript',
            size: dbConfig.length,
            complexity: this.calculateComplexity(dbConfig),
            quality: this.calculateQuality(dbConfig),
            lastModified: new Date()
        });

        return files;
    }

    /**
     * 파일들을 디스크에 쓰기
     */
    private async writeFilesToDisk(files: CodeFile[], projectStructure: any): Promise<void> {
        for (const file of files) {
            const filePath = path.join(this.outputDir, projectStructure.name, file.path);
            const dirPath = path.dirname(filePath);

            // 디렉토리 생성
            await fs.mkdir(dirPath, { recursive: true });

            // 파일 쓰기
            await fs.writeFile(filePath, file.content, 'utf-8');
        }
    }

    // 기본 구현 메서드들
    private getDefaultExpressServer(): string {
        return `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 라우터
app.use('/api', require('./routes'));

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// 에러 핸들링
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(\`서버가 포트 \${PORT}에서 실행 중입니다.\`);
});

module.exports = app;
`;
    }

    private getDefaultFastifyServer(): string {
        return `const fastify = require('fastify')({ logger: true });
require('dotenv').config();

// 플러그인 등록
fastify.register(require('@fastify/cors'));
fastify.register(require('@fastify/helmet'));

// 라우터 등록
fastify.register(require('./routes'), { prefix: '/api' });

// 헬스 체크
fastify.get('/health', async (request, reply) => {
  return { status: 'healthy', timestamp: new Date().toISOString() };
});

const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 3000 });
    console.log('서버가 실행 중입니다.');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
`;
    }

    private getDefaultKoaServer(): string {
        return `const Koa = require('koa');
const Router = require('@koa/router');
const cors = require('@koa/cors');
const helmet = require('koa-helmet');
const bodyParser = require('koa-bodyparser');
require('dotenv').config();

const app = new Koa();
const router = new Router();

// 미들웨어
app.use(helmet());
app.use(cors());
app.use(bodyParser());

// 라우터 등록
app.use(router.routes());
app.use(router.allowedMethods());

// 헬스 체크
router.get('/health', (ctx) => {
  ctx.body = { status: 'healthy', timestamp: new Date().toISOString() };
});

app.listen(process.env.PORT || 3000, () => {
  console.log('서버가 실행 중입니다.');
});
`;
    }

    private getDefaultRouter(router: { name: string; endpoints: string[] }): string {
        return `const express = require('express');
const router = express.Router();

// ${router.name} 라우터
${router.endpoints.map(endpoint => {
            const [method, path] = endpoint.split(' ');
            return `router.${method.toLowerCase()}('${path}', (req, res) => {
  res.json({ message: '${router.name} ${method} ${path}' });
});`;
        }).join('\n\n')}

module.exports = router;
`;
    }

    private getDefaultController(router: { name: string; endpoints: string[] }): string {
        return `const ${router.name}Service = require('../services/${router.name}Service');

class ${router.name.charAt(0).toUpperCase() + router.name.slice(1)}Controller {
  // ${router.name} 컨트롤러 메서드들
  ${router.endpoints.map(endpoint => {
            const [method, path] = endpoint.split(' ');
            const methodName = method.toLowerCase() + path.replace(/[^a-zA-Z0-9]/g, '');
            return `static async ${methodName}(req, res, next) {
    try {
      // TODO: 구현 필요
      res.json({ message: '${router.name} ${method} ${path}' });
    } catch (error) {
      next(error);
    }
  }`;
        }).join('\n\n  ')}
}

module.exports = ${router.name.charAt(0).toUpperCase() + router.name.slice(1)}Controller;
`;
    }

    private getDefaultService(router: { name: string; endpoints: string[] }): string {
        return `class ${router.name.charAt(0).toUpperCase() + router.name.slice(1)}Service {
  // ${router.name} 서비스 메서드들
  ${router.endpoints.map(endpoint => {
            const [method, path] = endpoint.split(' ');
            const methodName = method.toLowerCase() + path.replace(/[^a-zA-Z0-9]/g, '');
            return `static async ${methodName}(data) {
    // TODO: 비즈니스 로직 구현
    return { message: '${router.name} ${method} ${path}' };
  }`;
        }).join('\n\n  ')}
}

module.exports = ${router.name.charAt(0).toUpperCase() + router.name.slice(1)}Service;
`;
    }

    private generateAuthMiddleware(): string {
        return `const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

module.exports = authMiddleware;
`;
    }

    private generateValidationMiddleware(): string {
        return `const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details.map(detail => detail.message)
      });
    }
    
    next();
  };
};

module.exports = validate;
`;
    }

    private generateErrorMiddleware(): string {
        return `const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message
  });
};

module.exports = errorHandler;
`;
    }

    private generateMongoDBModel(router: { name: string; endpoints: string[] }): string {
        return `const mongoose = require('mongoose');

const ${router.name}Schema = new mongoose.Schema({
  // TODO: 스키마 정의
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('${router.name.charAt(0).toUpperCase() + router.name.slice(1)}', ${router.name}Schema);
`;
    }

    private generatePostgreSQLModel(router: { name: string; endpoints: string[] }): string {
        return `const { Pool } = require('pg');

class ${router.name.charAt(0).toUpperCase() + router.name.slice(1)}Model {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  // TODO: 모델 메서드 구현
  async findAll() {
    const query = 'SELECT * FROM ${router.name}s';
    const result = await this.pool.query(query);
    return result.rows;
  }

  async findById(id) {
    const query = 'SELECT * FROM ${router.name}s WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = new ${router.name.charAt(0).toUpperCase() + router.name.slice(1)}Model();
`;
    }

    private generateDefaultModel(router: { name: string; endpoints: string[] }): string {
        return `class ${router.name.charAt(0).toUpperCase() + router.name.slice(1)}Model {
  constructor() {
    this.data = [];
  }

  // TODO: 모델 메서드 구현
  findAll() {
    return this.data;
  }

  findById(id) {
    return this.data.find(item => item.id === id);
  }
}

module.exports = new ${router.name.charAt(0).toUpperCase() + router.name.slice(1)}Model();
`;
    }

    private generateDatabaseUtil(techStack: TechStack): string {
        const isMongoDB = techStack.database.some(db => db.name === 'MongoDB');
        const isPostgreSQL = techStack.database.some(db => db.name === 'PostgreSQL');

        if (isMongoDB) {
            return `const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB 연결 성공');
  } catch (error) {
    console.error('MongoDB 연결 실패:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
`;
        } else if (isPostgreSQL) {
            return `const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query executed', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

module.exports = { query, pool };
`;
        } else {
            return `// 데이터베이스 연결 유틸리티
// TODO: 실제 데이터베이스 연결 구현

module.exports = {
  connect: () => console.log('데이터베이스 연결'),
  query: () => console.log('쿼리 실행')
};
`;
        }
    }

    private generateLoggerUtil(): string {
        return `const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

module.exports = logger;
`;
    }

    private generateCryptoUtil(): string {
        return `const crypto = require('crypto');
const bcrypt = require('bcrypt');

const cryptoUtil = {
  // 해시 생성
  hashPassword: async (password) => {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  },

  // 비밀번호 검증
  comparePassword: async (password, hash) => {
    return await bcrypt.compare(password, hash);
  },

  // JWT 토큰 생성
  generateToken: (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
  },

  // 랜덤 문자열 생성
  generateRandomString: (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
  }
};

module.exports = cryptoUtil;
`;
    }

    private generateEnvConfig(): string {
        return `require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'app',
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  }
};

module.exports = config;
`;
    }

    private generateDatabaseConfig(techStack: TechStack): string {
        const isMongoDB = techStack.database.some(db => db.name === 'MongoDB');
        const isPostgreSQL = techStack.database.some(db => db.name === 'PostgreSQL');

        if (isMongoDB) {
            return `const mongoose = require('mongoose');

const mongoConfig = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/app',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  }
};

module.exports = mongoConfig;
`;
        } else if (isPostgreSQL) {
            return `const postgresConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

module.exports = postgresConfig;
`;
        } else {
            return `// 데이터베이스 설정
// TODO: 실제 데이터베이스 설정 구현

module.exports = {
  // 기본 설정
};
`;
        }
    }

    /**
     * 코드 복잡도 계산
     */
    private calculateComplexity(content: string): number {
        const lines = content.split('\n').length;
        const functions = (content.match(/function|=>/g) || []).length;
        const conditions = (content.match(/if|else|switch|case/g) || []).length;
        const loops = (content.match(/for|while|do/g) || []).length;

        return Math.min(10, Math.max(1, (lines / 50) + (functions / 10) + (conditions / 5) + (loops / 3)));
    }

    /**
     * 코드 품질 계산
     */
    private calculateQuality(content: string): number {
        let score = 5; // 기본 점수

        // JSDoc 주석 확인
        if (content.includes('/**')) score += 1;

        // 에러 핸들링 확인
        if (content.includes('try') && content.includes('catch')) score += 1;

        // 타입 검사 확인
        if (content.includes('typeof') || content.includes('instanceof')) score += 1;

        // 로깅 확인
        if (content.includes('console.log') || content.includes('logger')) score += 1;

        // 상수 사용 확인
        if (content.includes('const ') && !content.includes('var ')) score += 1;

        return Math.min(10, Math.max(1, score));
    }

    /**
     * 고유 ID 생성
     */
    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}

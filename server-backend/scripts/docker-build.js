#!/usr/bin/env node
/**
 * Docker 이미지 빌드 & 최적화 스크립트
 * 
 * @version 1.0.0
 * @date 2025-11-09
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI 색상 코드
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

const log = {
    title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
};

/**
 * 명령어 실행 헬퍼
 */
function execCommand(command, description) {
    try {
        log.info(`${description}...`);
        const output = execSync(command, {
            encoding: 'utf-8',
            stdio: 'pipe'
        });
        log.success(description);
        return output;
    } catch (error) {
        log.error(`${description} 실패`);
        throw error;
    }
}

/**
 * Docker 이미지 크기 조회
 */
function getImageSize(imageName) {
    try {
        const output = execSync(`docker images ${imageName} --format "{{.Size}}"`, {
            encoding: 'utf-8'
        });
        return output.trim();
    } catch (error) {
        return 'unknown';
    }
}

/**
 * .dockerignore 파일 생성/검증
 */
function ensureDockerignore() {
    log.title('📝 .dockerignore 파일 검증');

    const dockerignorePath = path.join(__dirname, '../../.dockerignore');
    const requiredPatterns = [
        'node_modules',
        'npm-debug.log',
        '.env',
        '.env.*',
        '.git',
        '.github',
        '*.md',
        'test-*',
        'tests/',
        'coverage/',
        '.vscode',
        '*.log',
        'logs/',
        'temp/',
        'tmp/',
        'backups/',
        '*.test.js',
        '*.spec.js',
    ];

    if (!fs.existsSync(dockerignorePath)) {
        log.warning('.dockerignore 파일이 없습니다. 생성합니다...');
        fs.writeFileSync(dockerignorePath, requiredPatterns.join('\n'));
        log.success('.dockerignore 파일 생성 완료');
    } else {
        const content = fs.readFileSync(dockerignorePath, 'utf-8');
        const missing = requiredPatterns.filter(pattern => !content.includes(pattern));

        if (missing.length > 0) {
            log.warning(`누락된 패턴: ${missing.join(', ')}`);
            fs.appendFileSync(dockerignorePath, '\n' + missing.join('\n'));
            log.success('.dockerignore 파일 업데이트 완료');
        } else {
            log.success('.dockerignore 파일이 최신 상태입니다.');
        }
    }
}

/**
 * 프로덕션 Docker 이미지 빌드
 */
function buildProductionImage(imageName, version) {
    log.title('🐳 프로덕션 Docker 이미지 빌드');

    const tag = `${imageName}:${version}`;
    const latestTag = `${imageName}:latest`;

    // BuildKit 활성화 (더 빠른 빌드)
    process.env.DOCKER_BUILDKIT = '1';

    // 빌드 명령어
    const buildCommand = `docker build -f Dockerfile.production -t ${tag} -t ${latestTag} .`;

    log.info('빌드 시작...');
    log.info(`이미지: ${tag}`);

    try {
        execSync(buildCommand, {
            encoding: 'utf-8',
            stdio: 'inherit', // 빌드 진행 상황 표시
            cwd: path.join(__dirname, '../..')
        });

        const size = getImageSize(tag);
        log.success(`빌드 완료! 이미지 크기: ${size}`);

        return tag;
    } catch (error) {
        log.error('빌드 실패');
        throw error;
    }
}

/**
 * 이미지 취약점 스캔 (Trivy)
 */
function scanImage(imageName) {
    log.title('🔍 이미지 취약점 스캔');

    try {
        // Trivy 설치 확인
        execSync('trivy --version', { stdio: 'ignore' });
    } catch (error) {
        log.warning('Trivy가 설치되어 있지 않습니다.');
        log.info('설치: https://aquasecurity.github.io/trivy/latest/getting-started/installation/');
        return;
    }

    try {
        log.info('취약점 스캔 중...');
        const output = execSync(`trivy image --severity HIGH,CRITICAL ${imageName}`, {
            encoding: 'utf-8',
            stdio: 'pipe'
        });

        if (output.includes('Total: 0')) {
            log.success('취약점 없음');
        } else {
            log.warning('취약점 발견:');
            console.log(output);
        }
    } catch (error) {
        log.warning('취약점 스캔 중 경고가 발생했습니다.');
    }
}

/**
 * 이미지 레이어 분석
 */
function analyzeImageLayers(imageName) {
    log.title('📊 이미지 레이어 분석');

    try {
        const output = execSync(`docker history ${imageName} --human`, {
            encoding: 'utf-8'
        });

        console.log(output);
    } catch (error) {
        log.warning('레이어 분석 실패');
    }
}

/**
 * 이미지 테스트 (컨테이너 실행 테스트)
 */
async function testImage(imageName) {
    log.title('🧪 이미지 테스트');

    const containerName = `test-${Date.now()}`;

    try {
        // 컨테이너 실행
        log.info('테스트 컨테이너 시작...');
        execSync(
            `docker run -d --name ${containerName} -p 50001:50000 ` +
            `-e NODE_ENV=test ` +
            `-e PORT=50000 ` +
            `-e JWT_SECRET=test_secret_32_bytes_minimum_length_required ` +
            `-e SESSION_SECRET=test_session_secret_32_bytes_minimum ` +
            `-e DB_HOST=host.docker.internal ` +
            `-e DB_PORT=3306 ` +
            `-e DB_NAME=test_db ` +
            `-e DB_USER=test ` +
            `-e DB_PASSWORD=test ` +
            `-e REDIS_URL=redis://host.docker.internal:6379 ` +
            `${imageName}`,
            { stdio: 'pipe' }
        );

        // 컨테이너 시작 대기
        log.info('컨테이너 초기화 대기 (5초)...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // 헬스체크
        log.info('헬스체크 수행...');
        const healthOutput = execSync(`docker exec ${containerName} node scripts/health-check.js`, {
            encoding: 'utf-8',
            stdio: 'pipe'
        });

        log.success('컨테이너 테스트 성공');
    } catch (error) {
        log.error('컨테이너 테스트 실패');

        // 로그 출력
        try {
            const logs = execSync(`docker logs ${containerName}`, { encoding: 'utf-8' });
            console.log('\n컨테이너 로그:');
            console.log(logs);
        } catch (e) {
            // ignore
        }
    } finally {
        // 컨테이너 정리
        try {
            execSync(`docker stop ${containerName}`, { stdio: 'ignore' });
            execSync(`docker rm ${containerName}`, { stdio: 'ignore' });
            log.info('테스트 컨테이너 정리 완료');
        } catch (e) {
            // ignore
        }
    }
}

/**
 * 이미지 푸시 (Docker Hub / Registry)
 */
function pushImage(imageName) {
    log.title('📤 이미지 푸시');

    const registry = process.env.DOCKER_REGISTRY || '';

    if (!registry) {
        log.warning('DOCKER_REGISTRY 환경변수가 설정되지 않았습니다.');
        log.info('로컬 빌드만 수행합니다.');
        return;
    }

    const remoteTag = `${registry}/${imageName}`;

    try {
        // 태그 추가
        execCommand(
            `docker tag ${imageName} ${remoteTag}`,
            '레지스트리 태그 추가'
        );

        // 푸시
        log.info(`${remoteTag} 푸시 중...`);
        execSync(`docker push ${remoteTag}`, {
            stdio: 'inherit'
        });
        log.success('이미지 푸시 완료');
    } catch (error) {
        log.error('이미지 푸시 실패');
        throw error;
    }
}

/**
 * 메인 함수
 */
async function main() {
    console.log(`
${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════════════╗
║         🐳 Docker 빌드 & 최적화 v1.0.0              ║
╚═══════════════════════════════════════════════════════╝${colors.reset}
  `);

    const args = process.argv.slice(2);
    const version = args[0] || 'latest';
    const imageName = 'community-platform';

    log.info(`빌드 버전: ${version}`);
    log.info(`이미지 이름: ${imageName}\n`);

    try {
        // 1. .dockerignore 검증
        ensureDockerignore();

        // 2. 프로덕션 이미지 빌드
        const tag = buildProductionImage(imageName, version);

        // 3. 이미지 분석
        analyzeImageLayers(tag);

        // 4. 취약점 스캔
        scanImage(tag);

        // 5. 이미지 테스트 (선택적)
        if (process.env.RUN_IMAGE_TEST === 'true') {
            await testImage(tag);
        }

        // 6. 이미지 푸시 (선택적)
        if (process.env.PUSH_IMAGE === 'true') {
            pushImage(tag);
        }

        log.title('✅ 빌드 완료');
        log.success(`이미지: ${tag}`);
        log.info('\n실행 명령어:');
        console.log(`  docker run -d -p 50000:50000 --env-file .env.production ${tag}`);
        console.log('');

    } catch (error) {
        log.error(`빌드 실패: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}

// 스크립트 실행
main().catch(error => {
    console.error('예기치 않은 오류:', error);
    process.exit(1);
});

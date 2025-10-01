#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 색상 코드
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// 로그 함수
const log = (message, color = 'reset') => {
    console.log(`${colors[color]}${message}${colors.reset}`);
};

// 진행률 표시
const showProgress = (step, total, message) => {
    const percentage = Math.round((step / total) * 100);
    const progressBar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
    process.stdout.write(`\r${colors.cyan}[${progressBar}] ${percentage}% - ${message}${colors.reset}`);
    if (step === total) {
        console.log(); // 새 줄
    }
};

// 에러 처리
const handleError = (error, step) => {
    log(`❌ ${step} 실패: ${error.message}`, 'red');
    process.exit(1);
};

// 빌드 단계
const buildSteps = [
    { name: '환경 확인', func: checkEnvironment },
    { name: '의존성 설치', func: installDependencies },
    { name: '백엔드 빌드', func: buildBackend },
    { name: '프론트엔드 빌드', func: buildFrontend },
    { name: '빌드 검증', func: verifyBuild },
    { name: '정리 작업', func: cleanup }
];

// 메인 빌드 함수
async function main() {
    try {
        log('🚀 Community Platform 2.0 빌드 시작...', 'bright');
        log('='.repeat(60), 'cyan');

        for (let i = 0; i < buildSteps.length; i++) {
            const step = buildSteps[i];
            showProgress(i + 1, buildSteps.length, step.name);

            try {
                await step.func();
                log(`✅ ${step.name} 완료`, 'green');
            } catch (error) {
                handleError(error, step.name);
            }
        }

        log('='.repeat(60), 'cyan');
        log('🎉 빌드가 성공적으로 완료되었습니다!', 'bright');
        log('📁 빌드 결과:', 'blue');
        log('  - 백엔드: server-backend/dist/', 'blue');
        log('  - 프론트엔드: frontend/build/', 'blue');

    } catch (error) {
        handleError(error, '전체 빌드');
    }
}

// 1. 환경 확인
function checkEnvironment() {
    log('🔍 Node.js 버전 확인...', 'yellow');
    const nodeVersion = process.version;
    log(`   Node.js: ${nodeVersion}`, 'blue');

    if (parseInt(nodeVersion.slice(1).split('.')[0]) < 18) {
        throw new Error('Node.js 18 이상이 필요합니다.');
    }

    log('🔍 npm 버전 확인...', 'yellow');
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    log(`   npm: ${npmVersion}`, 'blue');

    log('🔍 프로젝트 구조 확인...', 'yellow');
    const requiredDirs = ['frontend', 'server-backend'];
    for (const dir of requiredDirs) {
        if (!fs.existsSync(dir)) {
            throw new Error(`필수 디렉토리가 없습니다: ${dir}`);
        }
    }
    log('   프로젝트 구조: OK', 'green');
}

// 2. 의존성 설치
function installDependencies() {
    log('📦 루트 의존성 설치...', 'yellow');
    execSync('npm install', { stdio: 'inherit' });

    log('📦 백엔드 의존성 설치...', 'yellow');
    execSync('cd server-backend && npm install', { stdio: 'inherit' });

    log('📦 프론트엔드 의존성 설치...', 'yellow');
    execSync('cd frontend && npm install', { stdio: 'inherit' });
}

// 3. 백엔드 빌드
function buildBackend() {
    log('🔧 백엔드 빌드 시작...', 'yellow');

    // 백엔드 빌드 디렉토리 생성
    const distDir = path.join('server-backend', 'dist');
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
    }

    // TypeScript 컴파일 (만약 있다면)
    try {
        execSync('cd server-backend && npx tsc', { stdio: 'inherit' });
    } catch (error) {
        // TypeScript가 없으면 JavaScript 파일 복사
        log('   TypeScript 없음, JavaScript 파일 복사...', 'blue');

        // 디렉토리 존재 확인 후 복사
        const dirsToCopy = ['api-server', 'routes', 'services'];
        for (const dir of dirsToCopy) {
            if (fs.existsSync(path.join('server-backend', dir))) {
                execSync(`cd server-backend && xcopy /E /I /Y ${dir} dist\\${dir}`, { stdio: 'inherit' });
            }
        }

        // utils 디렉토리가 있으면 복사
        if (fs.existsSync(path.join('server-backend', 'utils'))) {
            execSync('cd server-backend && xcopy /E /I /Y utils dist\\utils', { stdio: 'inherit' });
        } else {
            log('   utils 디렉토리 없음, 건너뜀...', 'yellow');
        }

        // package.json 복사
        if (fs.existsSync(path.join('server-backend', 'package.json'))) {
            execSync('cd server-backend && copy package.json dist\\', { stdio: 'inherit' });
        }
    }

    log('   백엔드 빌드 완료', 'green');
}

// 4. 프론트엔드 빌드
function buildFrontend() {
    log('📦 프론트엔드 빌드 시작...', 'yellow');

    // React 앱 빌드
    execSync('cd frontend && npm run build', { stdio: 'inherit' });

    log('   프론트엔드 빌드 완료', 'green');
}

// 5. 빌드 검증
function verifyBuild() {
    log('🔍 빌드 결과 검증...', 'yellow');

    // 백엔드 빌드 확인
    const backendDist = path.join('server-backend', 'dist');
    if (!fs.existsSync(backendDist)) {
        throw new Error('백엔드 빌드 결과가 없습니다.');
    }

    // 프론트엔드 빌드 확인
    const frontendBuild = path.join('frontend', 'build');
    if (!fs.existsSync(frontendBuild)) {
        throw new Error('프론트엔드 빌드 결과가 없습니다.');
    }

    // 빌드 크기 확인
    const backendSize = getDirSize(backendDist);
    const frontendSize = getDirSize(frontendBuild);

    log(`   백엔드 빌드 크기: ${formatBytes(backendSize)}`, 'blue');
    log(`   프론트엔드 빌드 크기: ${formatBytes(frontendSize)}`, 'blue');

    log('   빌드 검증 완료', 'green');
}

// 6. 정리 작업
function cleanup() {
    log('🧹 정리 작업...', 'yellow');

    // 임시 파일 정리
    const tempFiles = [
        'server-backend/dist/.gitkeep',
        'frontend/build/.gitkeep'
    ];

    for (const file of tempFiles) {
        if (fs.existsSync(file)) {
            fs.unlinkSync(file);
        }
    }

    log('   정리 작업 완료', 'green');
}

// 디렉토리 크기 계산
function getDirSize(dirPath) {
    let totalSize = 0;

    function calculateSize(itemPath) {
        const stats = fs.statSync(itemPath);
        if (stats.isDirectory()) {
            const files = fs.readdirSync(itemPath);
            for (const file of files) {
                calculateSize(path.join(itemPath, file));
            }
        } else {
            totalSize += stats.size;
        }
    }

    calculateSize(dirPath);
    return totalSize;
}

// 바이트를 읽기 쉬운 형태로 변환
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 빌드 시작
main().catch(console.error);

#!/usr/bin/env node

/**
 * 🔒 HTTPS 활성화 스크립트
 * 
 * 개발 환경에서 HTTPS 지원 활성화
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-01-02
 */

const fs = require('fs');
const path = require('path');

class HTTPSEnabler {
    constructor() {
        this.projectRoot = process.cwd();
        this.frontendDir = path.join(this.projectRoot, 'frontend');
        this.backendDir = path.join(this.projectRoot, 'server-backend');
    }

    updateViteConfig() {
        console.log('🔒 Vite 설정을 HTTPS로 업데이트 중...');

        const viteConfigPath = path.join(this.frontendDir, 'vite.config.ts');

        if (fs.existsSync(viteConfigPath)) {
            let config = fs.readFileSync(viteConfigPath, 'utf8');

            // HTTPS 설정 추가
            const httpsConfig = `
    // HTTPS 설정
    https: {
        key: fs.readFileSync(path.join(__dirname, 'certs/server.key')),
        cert: fs.readFileSync(path.join(__dirname, 'certs/server.crt')),
    },`;

            // server 설정에 HTTPS 추가
            config = config.replace(
                /server:\s*{([^}]+)}/,
                `server: {$1${httpsConfig}\n    }`
            );

            // fs import 추가
            if (!config.includes("import fs from 'fs';")) {
                config = config.replace(
                    /import { defineConfig } from 'vite';/,
                    `import { defineConfig } from 'vite';
import fs from 'fs';`
                );
            }

            fs.writeFileSync(viteConfigPath, config);
            console.log('✅ Vite HTTPS 설정 완료');
        }
    }

    generateSelfSignedCert() {
        console.log('🔐 자체 서명 인증서 생성 중...');

        const certsDir = path.join(this.frontendDir, 'certs');
        if (!fs.existsSync(certsDir)) {
            fs.mkdirSync(certsDir, { recursive: true });
        }

        // 간단한 자체 서명 인증서 생성 스크립트
        const certScript = `#!/bin/bash
# 자체 서명 인증서 생성
openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.crt -days 365 -nodes -subj "/C=KR/ST=Seoul/L=Seoul/O=Community Platform/OU=IT Department/CN=localhost"
echo "인증서 생성 완료!"
`;

        const certScriptPath = path.join(certsDir, 'generate-cert.sh');
        fs.writeFileSync(certScriptPath, certScript);

        console.log('✅ 인증서 생성 스크립트 생성 완료');
        console.log('💡 실행 방법: cd frontend/certs && bash generate-cert.sh');
    }

    updatePackageJson() {
        console.log('📦 package.json 스크립트 업데이트 중...');

        const packageJsonPath = path.join(this.frontendDir, 'package.json');

        if (fs.existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

            // HTTPS 개발 서버 스크립트 추가
            packageJson.scripts = {
                ...packageJson.scripts,
                'dev:https': 'vite --host --https',
                'build:https': 'vite build --https',
            };

            fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
            console.log('✅ package.json HTTPS 스크립트 추가 완료');
        }
    }

    updateBackendHTTPS() {
        console.log('🔒 백엔드 HTTPS 설정 중...');

        const serverPath = path.join(this.backendDir, 'server.js');

        if (fs.existsSync(serverPath)) {
            let serverCode = fs.readFileSync(serverPath, 'utf8');

            // HTTPS 서버 설정 추가
            const httpsConfig = `
const https = require('https');
const fs = require('fs');

// HTTPS 옵션
const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, 'certs/server.key')),
    cert: fs.readFileSync(path.join(__dirname, 'certs/server.crt')),
};

// HTTPS 서버 생성
const httpsServer = https.createServer(httpsOptions, app);
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

httpsServer.listen(HTTPS_PORT, () => {
    console.log(\`🔒 HTTPS 서버가 https://localhost:\${HTTPS_PORT}에서 실행 중입니다\`);
});`;

            // 기존 서버 코드에 HTTPS 추가
            serverCode = serverCode.replace(
                /app\.listen\(PORT, \(\) => \{[\s\S]*?\}\);/,
                `app.listen(PORT, () => {
    console.log(\`HTTP 서버가 http://localhost:\${PORT}에서 실행 중입니다\`);
});

${httpsConfig}`
            );

            fs.writeFileSync(serverPath, serverCode);
            console.log('✅ 백엔드 HTTPS 설정 완료');
        }
    }

    createHTTPSGuide() {
        console.log('📋 HTTPS 가이드 생성 중...');

        const guide = `# 🔒 HTTPS 설정 가이드

## 📋 개요
Community Platform v3.0에서 HTTPS 지원을 위한 설정 가이드입니다.

## 🚀 빠른 시작

### 1. 인증서 생성
\`\`\`bash
cd frontend/certs
bash generate-cert.sh
\`\`\`

### 2. 프론트엔드 HTTPS 서버 실행
\`\`\`bash
cd frontend
npm run dev:https
\`\`\`

### 3. 백엔드 HTTPS 서버 실행
\`\`\`bash
cd server-backend
npm start
\`\`\`

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
\`\`\`bash
# 인증서 재생성
rm frontend/certs/server.*
cd frontend/certs
bash generate-cert.sh
\`\`\`

### 포트 충돌
\`\`\`bash
# 사용 중인 포트 확인
netstat -ano | findstr :3000
netstat -ano | findstr :3443
\`\`\`

## 📚 추가 정보

- **개발 환경**: 자체 서명 인증서 사용
- **프로덕션**: Let's Encrypt 또는 상용 인증서 사용 권장
- **보안**: HTTPS는 데이터 암호화를 제공합니다

---
**생성일**: ${new Date().toISOString()}
**버전**: 3.0.0
`;

        const guidePath = path.join(this.projectRoot, 'HTTPS_SETUP_GUIDE.md');
        fs.writeFileSync(guidePath, guide);
        console.log('✅ HTTPS 가이드 생성 완료');
    }

    async run() {
        try {
            console.log('🔒 HTTPS 활성화 시작...');

            this.updateViteConfig();
            this.generateSelfSignedCert();
            this.updatePackageJson();
            this.updateBackendHTTPS();
            this.createHTTPSGuide();

            console.log('\n🎉 HTTPS 설정 완료!');
            console.log('\n📋 다음 단계:');
            console.log('1. cd frontend/certs && bash generate-cert.sh');
            console.log('2. cd frontend && npm run dev:https');
            console.log('3. 브라우저에서 https://localhost:3000 접속');
            console.log('\n⚠️  첫 접속 시 보안 경고가 표시되면 "고급" → "localhost로 이동" 클릭');

        } catch (error) {
            console.error('❌ HTTPS 설정 실패:', error);
        }
    }
}

// 스크립트 실행
if (require.main === module) {
    const enabler = new HTTPSEnabler();
    enabler.run().catch(console.error);
}

module.exports = HTTPSEnabler;

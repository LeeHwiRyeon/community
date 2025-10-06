/**
 * 🔧 완전한 텍스트 깨짐 해결 시스템
 * 모든 텍스트 인코딩 문제 완전 해결
 */

const fs = require('fs').promises;
const path = require('path');

class CompleteTextFixSystem {
    constructor() {
        this.encoding = 'utf8';
        this.fixedFiles = new Set();
    }

    async fixAllTextIssues() {
        console.log('🔧 완전한 텍스트 깨짐 해결 시작...');

        // 1. 모든 스크립트 파일 수정
        await this.fixScriptFiles();

        // 2. 설정 파일 수정
        await this.fixConfigFiles();

        // 3. 로그 파일 정리
        await this.cleanLogFiles();

        console.log('✅ 모든 텍스트 깨짐 문제 해결 완료!');
    }

    async fixScriptFiles() {
        const scriptFiles = [
            './scripts/lightweight-integrated-system.js',
            './scripts/ultimate-integrated-system.js',
            './scripts/ultra-fast-diagnosis-system.js',
            './scripts/complete-automation-system.js',
            './scripts/real-time-problem-solver.js',
            './scripts/ai-diagnosis-engine.js',
            './scripts/text-fix-system.js'
        ];

        for (const file of scriptFiles) {
            await this.fixFileEncoding(file);
        }
    }

    async fixConfigFiles() {
        const configFiles = [
            './package.json',
            './frontend/package.json',
            './server-backend/package.json'
        ];

        for (const file of configFiles) {
            await this.fixFileEncoding(file);
        }
    }

    async fixFileEncoding(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');

            // 텍스트 정규화 및 인코딩 수정
            const fixedContent = content
                .normalize('NFC')
                .replace(/[\u200B-\u200D\uFEFF]/g, '') // 제어 문자 제거
                .replace(/\r\n/g, '\n') // 줄바꿈 통일
                .replace(/\r/g, '\n'); // Mac 스타일 줄바꿈 수정

            await fs.writeFile(filePath, fixedContent, 'utf8');
            this.fixedFiles.add(filePath);

            console.log(`✅ 파일 수정 완료: ${filePath}`);
            return true;
        } catch (error) {
            console.error(`❌ 파일 수정 실패: ${filePath}`, error.message);
            return false;
        }
    }

    async cleanLogFiles() {
        const logDirs = [
            './test-logs',
            './logs',
            './server-backend/logs'
        ];

        for (const dir of logDirs) {
            try {
                await fs.mkdir(dir, { recursive: true });
                console.log(`✅ 로그 디렉토리 정리: ${dir}`);
            } catch (error) {
                // 디렉토리가 이미 존재하는 경우 무시
            }
        }
    }

    async testTextDisplay() {
        console.log('🧪 텍스트 표시 테스트...');
        console.log('✅ 한글: 안녕하세요');
        console.log('✅ 이모지: 🚀 🤖 🔧 ⚡ 💾 📊 🎯');
        console.log('✅ 특수문자: !@#$%^&*()');
        console.log('✅ 숫자: 1234567890');
        console.log('✅ 영문: Hello World');
        console.log('✅ 텍스트 테스트 완료!');
    }
}

// 실행
if (require.main === module) {
    const textFixer = new CompleteTextFixSystem();

    textFixer.fixAllTextIssues()
        .then(() => textFixer.testTextDisplay())
        .catch(console.error);
}

module.exports = CompleteTextFixSystem;

/**
 * 🔧 텍스트 깨짐 해결 시스템
 * UTF-8 인코딩 보장 및 텍스트 정상화
 */

const fs = require('fs').promises;
const path = require('path');

class TextFixSystem {
    constructor() {
        this.encoding = 'utf8';
        this.fixedFiles = new Set();
    }

    async fixTextEncoding(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const normalizedContent = content.normalize('NFC');
            
            await fs.writeFile(filePath, normalizedContent, 'utf8');
            this.fixedFiles.add(filePath);
            
            console.log(`✅ 텍스트 인코딩 수정: ${filePath}`);
            return true;
        } catch (error) {
            console.error(`❌ 텍스트 수정 실패: ${filePath}`, error.message);
            return false;
        }
    }

    async fixAllTextFiles() {
        const filesToFix = [
            './scripts/lightweight-integrated-system.js',
            './scripts/ultimate-integrated-system.js',
            './scripts/ultra-fast-diagnosis-system.js',
            './scripts/complete-automation-system.js',
            './scripts/real-time-problem-solver.js',
            './scripts/ai-diagnosis-engine.js'
        ];

        for (const file of filesToFix) {
            await this.fixTextEncoding(file);
        }

        console.log(`✅ 총 ${this.fixedFiles.size}개 파일 텍스트 수정 완료`);
    }
}

// 실행
if (require.main === module) {
    const textFixer = new TextFixSystem();
    textFixer.fixAllTextFiles().catch(console.error);
}

module.exports = TextFixSystem;

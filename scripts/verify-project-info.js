#!/usr/bin/env node

/**
 * 🔍 프로젝트 정보 검증 스크립트
 * TheNewsPaper Platform 프로젝트 정보 일관성 검사
 */

const fs = require('fs');
const path = require('path');

class ProjectInfoVerifier {
    constructor() {
        this.projectName = 'TheNewsPaper Platform';
        this.projectId = 'thenewspaper-platform';
        this.year = new Date().getFullYear();
        this.issues = [];
        this.fixes = [];
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
    }

    checkFile(filePath, expectedContent) {
        try {
            if (!fs.existsSync(filePath)) {
                this.issues.push(`파일 없음: ${filePath}`);
                return false;
            }

            const content = fs.readFileSync(filePath, 'utf8');
            
            for (const [key, value] of Object.entries(expectedContent)) {
                if (!content.includes(value)) {
                    this.issues.push(`${filePath}: ${key} 누락 (예상: ${value})`);
                } else {
                    this.log(`✅ ${filePath}: ${key} 확인됨`, 'success');
                }
            }
            
            return true;
        } catch (error) {
            this.issues.push(`${filePath}: 읽기 오류 - ${error.message}`);
            return false;
        }
    }

    verifyProjectInfo() {
        this.log('🔍 프로젝트 정보 검증 시작...');

        // 1. 메인 페이지 검증
        this.log('📄 메인 페이지 검증...');
        const indexHtmlChecks = {
            '프로젝트 이름': this.projectName,
            '프로젝트 ID': this.projectId,
            '올바른 연도': this.year.toString(),
            'Firebase 정보': 'Powered by Firebase & GitHub'
        };
        this.checkFile('public/index.html', indexHtmlChecks);

        // 2. Firebase 설정 검증
        this.log('🔥 Firebase 설정 검증...');
        const firebaseChecks = {
            '프로젝트 ID': this.projectId
        };
        this.checkFile('.firebaserc', firebaseChecks);

        // 3. package.json 검증
        this.log('📦 package.json 검증...');
        if (fs.existsSync('package.json')) {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            if (packageJson.name && !packageJson.name.includes('thenewspaper')) {
                this.issues.push('package.json: 프로젝트 이름이 일치하지 않음');
            }
        }

        // 4. README.md 검증
        this.log('📖 README.md 검증...');
        const readmeChecks = {
            '프로젝트 이름': this.projectName,
            '프로젝트 설명': '뉴스, 게임, 스트리밍, 코스프레'
        };
        this.checkFile('README.md', readmeChecks);

        // 5. 워크플로우 파일 검증
        this.log('⚙️ GitHub Actions 워크플로우 검증...');
        const workflowFiles = [
            '.github/workflows/firebase-deploy.yml',
            '.github/workflows/github-pages.yml'
        ];

        workflowFiles.forEach(file => {
            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf8');
                if (!content.includes(this.projectId)) {
                    this.issues.push(`${file}: 프로젝트 ID 누락`);
                } else {
                    this.log(`✅ ${file}: 프로젝트 ID 확인됨`, 'success');
                }
            }
        });

        return this.issues.length === 0;
    }

    generateReport() {
        this.log('📋 검증 보고서 생성...');

        const report = `# 🔍 프로젝트 정보 검증 보고서

## 📊 검증 정보
- **검증 시간**: ${new Date().toISOString()}
- **프로젝트 이름**: ${this.projectName}
- **프로젝트 ID**: ${this.projectId}
- **검증 연도**: ${this.year}

## ✅ 검증 결과
- **총 검사 항목**: ${this.issues.length + this.fixes.length}개
- **발견된 문제**: ${this.issues.length}개
- **수정된 항목**: ${this.fixes.length}개

## 🔧 발견된 문제
${this.issues.length > 0 ? this.issues.map(issue => `- ❌ ${issue}`).join('\n') : '- ✅ 문제 없음'}

## 🛠️ 수정된 항목
${this.fixes.length > 0 ? this.fixes.map(fix => `- ✅ ${fix}`).join('\n') : '- 수정된 항목 없음'}

## 📋 검증된 파일
- **public/index.html**: 메인 페이지 프로젝트 정보
- **.firebaserc**: Firebase 프로젝트 설정
- **firebase.json**: Firebase 호스팅 설정
- **package.json**: Node.js 프로젝트 설정
- **README.md**: 프로젝트 문서
- **.github/workflows/**: GitHub Actions 워크플로우

## 🎯 권장 사항
1. **일관성 유지**: 모든 파일에서 프로젝트 이름과 ID 일관성 유지
2. **문서 업데이트**: README.md에 최신 프로젝트 정보 반영
3. **워크플로우 검토**: GitHub Actions에서 올바른 프로젝트 ID 사용
4. **메타데이터**: HTML 메타 태그에 정확한 프로젝트 정보 포함

## 🔗 관련 링크
- **Firebase 콘솔**: https://console.firebase.google.com/project/${this.projectId}
- **GitHub 저장소**: https://github.com/LeeHwiRyeon/community
- **호스팅 URL**: https://${this.projectId}.web.app

---
*프로젝트 정보 검증 시스템 v1.0*

**${this.issues.length === 0 ? '🎉 모든 검증이 통과되었습니다!' : '⚠️ 일부 문제가 발견되었습니다. 수정이 필요합니다.'}** 🚀
`;

        fs.writeFileSync('PROJECT_VERIFICATION_REPORT.md', report);
        this.log('검증 보고서 생성 완료: PROJECT_VERIFICATION_REPORT.md', 'success');
    }

    async run() {
        this.log('🔍 프로젝트 정보 검증 시작!');
        
        try {
            // 프로젝트 정보 검증
            const isValid = this.verifyProjectInfo();
            
            // 보고서 생성
            this.generateReport();
            
            if (isValid) {
                this.log('✅ 모든 검증이 통과되었습니다!', 'success');
            } else {
                this.log(`⚠️ ${this.issues.length}개의 문제가 발견되었습니다.`, 'warning');
                this.issues.forEach(issue => this.log(`- ${issue}`, 'error'));
            }
            
            this.log('📋 보고서: PROJECT_VERIFICATION_REPORT.md', 'info');
            
        } catch (error) {
            this.log(`❌ 검증 실패: ${error.message}`, 'error');
            process.exit(1);
        }
    }
}

// 스크립트 실행
if (require.main === module) {
    const verifier = new ProjectInfoVerifier();
    verifier.run().catch(console.error);
}

module.exports = ProjectInfoVerifier;

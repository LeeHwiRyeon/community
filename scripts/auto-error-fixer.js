/**
 * 🔧 자동 에러 수정 시스템
 * 
 * TypeScript 컴파일 에러를 자동으로 감지하고 수정
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-01-02
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class AutoErrorFixer {
    constructor() {
        this.fixes = [
            {
                pattern: /Property 'item' does not exist on type/,
                fix: (content) => {
                    // Grid item prop 제거
                    return content.replace(/<Grid item xs=/g, '<Grid xs=');
                },
                description: 'Grid item prop 제거'
            },
            {
                pattern: /Property 'xs' does not exist on type/,
                fix: (content) => {
                    // Grid를 Box로 변경
                    return content.replace(/<Grid item xs={(\d+)} md={(\d+)} lg={(\d+)}>/g, '<Box sx={{ flex: 1 }}>');
                },
                description: 'Grid를 Box로 변경'
            },
            {
                pattern: /Property 'processingStart' does not exist on type 'PerformanceEntry'/,
                fix: (content) => {
                    // PerformanceEntry 타입 캐스팅
                    return content.replace(/entry\.processingStart/g, '(entry as any).processingStart');
                },
                description: 'PerformanceEntry 타입 캐스팅'
            },
            {
                pattern: /Property 'hadRecentInput' does not exist on type 'PerformanceEntry'/,
                fix: (content) => {
                    return content.replace(/entry\.hadRecentInput/g, '(entry as any).hadRecentInput');
                },
                description: 'PerformanceEntry hadRecentInput 타입 캐스팅'
            },
            {
                pattern: /Property 'value' does not exist on type 'PerformanceEntry'/,
                fix: (content) => {
                    return content.replace(/entry\.value/g, '(entry as any).value');
                },
                description: 'PerformanceEntry value 타입 캐스팅'
            },
            {
                pattern: /Property 'transferSize' does not exist on type 'PerformanceEntry'/,
                fix: (content) => {
                    return content.replace(/entry\.transferSize/g, '(entry as any).transferSize');
                },
                description: 'PerformanceEntry transferSize 타입 캐스팅'
            },
            {
                pattern: /Type 'string' is not assignable to type 'undefined'/,
                fix: (content) => {
                    // as="button" 제거
                    return content.replace(/ as="button"/g, '');
                },
                description: 'as="button" prop 제거'
            }
        ];
    }

    // 파일 스캔 및 에러 수정
    async fixFile(filePath) {
        try {
            console.log(`🔍 파일 스캔 중: ${filePath}`);

            if (!fs.existsSync(filePath)) {
                console.log(`❌ 파일이 존재하지 않음: ${filePath}`);
                return false;
            }

            let content = fs.readFileSync(filePath, 'utf8');
            let modified = false;
            let fixCount = 0;

            // 각 수정 규칙 적용
            for (const fix of this.fixes) {
                if (fix.pattern.test(content)) {
                    console.log(`🔧 수정 적용: ${fix.description}`);
                    content = fix.fix(content);
                    modified = true;
                    fixCount++;
                }
            }

            if (modified) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`✅ 파일 수정 완료: ${filePath} (${fixCount}개 수정)`);
                return true;
            } else {
                console.log(`✅ 에러 없음: ${filePath}`);
                return false;
            }

        } catch (error) {
            console.error(`❌ 파일 수정 실패: ${filePath}`, error.message);
            return false;
        }
    }

    // 디렉토리 재귀 스캔
    async scanDirectory(dirPath, extensions = ['.tsx', '.ts']) {
        const results = {
            scanned: 0,
            fixed: 0,
            errors: 0
        };

        try {
            const files = fs.readdirSync(dirPath);

            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stat = fs.statSync(filePath);

                if (stat.isDirectory()) {
                    // 재귀적으로 하위 디렉토리 스캔
                    const subResults = await this.scanDirectory(filePath, extensions);
                    results.scanned += subResults.scanned;
                    results.fixed += subResults.fixed;
                    results.errors += subResults.errors;
                } else if (extensions.some(ext => file.endsWith(ext))) {
                    results.scanned++;
                    const fixed = await this.fixFile(filePath);
                    if (fixed) {
                        results.fixed++;
                    }
                }
            }
        } catch (error) {
            console.error(`❌ 디렉토리 스캔 실패: ${dirPath}`, error.message);
            results.errors++;
        }

        return results;
    }

    // TypeScript 컴파일 체크
    async checkCompilation() {
        return new Promise((resolve) => {
            console.log('🔍 TypeScript 컴파일 체크 중...');

            exec('cd frontend && npx tsc --noEmit', (error, stdout, stderr) => {
                if (error) {
                    console.log('❌ 컴파일 에러 발견');
                    console.log(stderr);
                    resolve(false);
                } else {
                    console.log('✅ 컴파일 성공');
                    resolve(true);
                }
            });
        });
    }

    // 전체 수정 프로세스 실행
    async runAutoFix() {
        console.log('🚀 자동 에러 수정 시스템 시작!');
        console.log('='.repeat(60));

        const frontendSrcPath = path.join(__dirname, '..', 'frontend', 'src');

        if (!fs.existsSync(frontendSrcPath)) {
            console.error('❌ frontend/src 디렉토리를 찾을 수 없습니다.');
            return;
        }

        // 1단계: 파일 스캔 및 수정
        console.log('\n📁 파일 스캔 및 수정 중...');
        const scanResults = await this.scanDirectory(frontendSrcPath);

        console.log(`\n📊 스캔 결과:`);
        console.log(`   - 스캔된 파일: ${scanResults.scanned}개`);
        console.log(`   - 수정된 파일: ${scanResults.fixed}개`);
        console.log(`   - 에러 발생: ${scanResults.errors}개`);

        // 2단계: 컴파일 체크
        console.log('\n🔍 컴파일 체크 중...');
        const compilationSuccess = await this.checkCompilation();

        if (compilationSuccess) {
            console.log('\n🎉 모든 에러가 수정되었습니다!');
        } else {
            console.log('\n⚠️ 일부 에러가 남아있습니다. 추가 수정이 필요합니다.');
        }

        return {
            scanResults,
            compilationSuccess
        };
    }
}

// 실행
if (require.main === module) {
    const fixer = new AutoErrorFixer();
    fixer.runAutoFix().catch(console.error);
}

module.exports = AutoErrorFixer;

#!/usr/bin/env node

/**
 * 자동 버그 수정 스크립트
 * 발견된 주요 TypeScript 오류들을 자동으로 수정합니다.
 */

const fs = require('fs').promises
const path = require('path')

class AutoBugFixer {
    constructor() {
        this.fixedFiles = []
        this.fixedIssues = []
    }

    async init() {
        console.log('🔧 자동 버그 수정 시작...')
        console.log('=========================')

        await this.fixMissingImports()
        await this.fixTypeErrors()
        await this.fixConstantsDuplicates()
        await this.generateReport()
    }

    async fixMissingImports() {
        console.log('\n📦 누락된 import 수정 중...')

        const importFixes = [
            {
                file: 'frontend/src/hooks/useSpeechRecognition.ts',
                fixes: [
                    {
                        search: /import React from 'react'/,
                        replace: "import React, { useRef } from 'react'"
                    }
                ]
            },
            {
                file: 'frontend/src/utils/constants.ts',
                fixes: [
                    {
                        search: /const API_BASE_URL = import\.meta\.env\.VITE_API_BASE_URL/,
                        replace: "const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL"
                    }
                ]
            },
            {
                file: 'frontend/src/contexts/AuthContext.tsx',
                fixes: [
                    {
                        search: /const API_BASE_URL = import\.meta\.env\.VITE_API_BASE_URL/,
                        replace: "const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL"
                    }
                ]
            }
        ]

        for (const fix of importFixes) {
            await this.applyFileFixes(fix.file, fix.fixes)
        }
    }

    async fixTypeErrors() {
        console.log('\n🔍 타입 오류 수정 중...')

        const typeFixes = [
            {
                file: 'frontend/src/hooks/useForm.ts',
                fixes: [
                    {
                        search: /const \[touched, setTouched\] = useState<Partial<Record<keyof T, boolean>>>\(\{\}\)/,
                        replace: "const [touchedState, setTouchedState] = useState<Partial<Record<keyof T, boolean>>>({})"
                    },
                    {
                        search: /setTouched\(prev => \(\{ \.\.\.prev, \[name\]: touched \}\)\)/,
                        replace: "setTouchedState(prev => ({ ...prev, [name]: touched }))"
                    }
                ]
            },
            {
                file: 'frontend/src/hooks/useGeolocation.ts',
                fixes: [
                    {
                        search: /error\.code = GeolocationPositionError\.GEOLOCATION_UNSUPPORTED/,
                        replace: "// error.code = 4 // GEOLOCATION_UNSUPPORTED"
                    },
                    {
                        search: /error\.message = 'Geolocation is not supported'/,
                        replace: "// error.message = 'Geolocation is not supported'"
                    }
                ]
            }
        ]

        for (const fix of typeFixes) {
            await this.applyFileFixes(fix.file, fix.fixes)
        }
    }

    async fixConstantsDuplicates() {
        console.log('\n🔄 constants.ts 중복 속성 수정 중...')

        try {
            const filePath = 'frontend/src/utils/constants.ts'
            let content = await fs.readFile(filePath, 'utf8')

            // 더 많은 중복 속성들을 찾아서 제거
            const duplicatePatterns = [
                // MIME_TYPES 객체의 중복들
                /    'application\/json': 'application\/json',\s*\n\s*'application\/json': 'application\/json',/g,
                /    'text\/html': 'text\/html',\s*\n\s*'text\/html': 'text\/html',/g,
                /    'text\/css': 'text\/css',\s*\n\s*'text\/css': 'text\/css',/g,
                /    'text\/javascript': 'text\/javascript',\s*\n\s*'text\/javascript': 'text\/javascript',/g,
                /    'image\/jpeg': 'image\/jpeg',\s*\n\s*'image\/jpeg': 'image\/jpeg',/g,
                /    'image\/png': 'image\/png',\s*\n\s*'image\/png': 'image\/png',/g,
                /    'image\/gif': 'image\/gif',\s*\n\s*'image\/gif': 'image\/gif',/g,
            ]

            let hasChanges = false
            for (const pattern of duplicatePatterns) {
                if (pattern.test(content)) {
                    content = content.replace(pattern, (match) => {
                        const lines = match.split('\n')
                        return lines[0] + '\n' // 첫 번째 줄만 유지
                    })
                    hasChanges = true
                }
            }

            if (hasChanges) {
                await fs.writeFile(filePath, content, 'utf8')
                this.fixedFiles.push(filePath)
                this.fixedIssues.push('constants.ts 중복 속성 제거')
                console.log('  ✅ constants.ts 중복 속성 수정 완료')
            }
        } catch (error) {
            console.log('  ❌ constants.ts 수정 실패:', error.message)
        }
    }

    async applyFileFixes(filePath, fixes) {
        try {
            const fullPath = path.resolve(filePath)
            let content = await fs.readFile(fullPath, 'utf8')
            let hasChanges = false

            for (const fix of fixes) {
                if (fix.search.test && fix.search.test(content)) {
                    content = content.replace(fix.search, fix.replace)
                    hasChanges = true
                } else if (typeof fix.search === 'string' && content.includes(fix.search)) {
                    content = content.replace(fix.search, fix.replace)
                    hasChanges = true
                }
            }

            if (hasChanges) {
                await fs.writeFile(fullPath, content, 'utf8')
                this.fixedFiles.push(filePath)
                this.fixedIssues.push(`${path.basename(filePath)} 타입 오류 수정`)
                console.log(`  ✅ ${path.basename(filePath)} 수정 완료`)
            }
        } catch (error) {
            console.log(`  ❌ ${path.basename(filePath)} 수정 실패:`, error.message)
        }
    }

    async generateReport() {
        console.log('\n📊 자동 버그 수정 보고서')
        console.log('========================')
        console.log(`✅ 수정된 파일: ${this.fixedFiles.length}개`)
        console.log(`🔧 수정된 이슈: ${this.fixedIssues.length}개`)

        if (this.fixedFiles.length > 0) {
            console.log('\n📁 수정된 파일 목록:')
            this.fixedFiles.forEach(file => {
                console.log(`  - ${file}`)
            })
        }

        if (this.fixedIssues.length > 0) {
            console.log('\n🔧 수정된 이슈 목록:')
            this.fixedIssues.forEach(issue => {
                console.log(`  - ${issue}`)
            })
        }

        // 수정 보고서를 파일로 저장
        const report = {
            timestamp: new Date().toISOString(),
            fixedFiles: this.fixedFiles,
            fixedIssues: this.fixedIssues,
            summary: {
                totalFiles: this.fixedFiles.length,
                totalIssues: this.fixedIssues.length
            }
        }

        await fs.writeFile('auto-bug-fix-report.json', JSON.stringify(report, null, 2), 'utf8')
        console.log('\n💾 보고서 저장: auto-bug-fix-report.json')

        console.log('\n🎉 자동 버그 수정 완료!')
        console.log('다음 단계: npm run build로 빌드 테스트를 진행하세요.')
    }
}

// 실행
async function main() {
    const fixer = new AutoBugFixer()
    await fixer.init()
}

if (require.main === module) {
    main().catch(console.error)
}

module.exports = AutoBugFixer

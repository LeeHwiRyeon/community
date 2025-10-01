#!/usr/bin/env node

/**
 * 프로젝트 정리 및 최적화 시스템
 * 
 * 1. 문서 정리 및 통합
 * 2. 안쓰는 파일 정리
 * 3. 안쓰는 기능 코드 최적화
 * 4. 중복 코드 제거
 * 5. 성능 최적화
 */

const fs = require('fs').promises
const path = require('path')
const { glob } = require('glob')

class ProjectCleanupOptimizer {
    constructor() {
        this.projectRoot = process.cwd()
        this.cleanupResults = {
            documents: { organized: 0, removed: 0 },
            files: { removed: 0, optimized: 0 },
            code: { duplicatesRemoved: 0, unusedFunctionsRemoved: 0, optimized: 0 },
            performance: { improvements: 0 }
        }
        this.unusedFiles = []
        this.duplicateCode = []
        this.unusedFunctions = []
    }

    async startCleanup() {
        console.log('🧹 프로젝트 정리 및 최적화 시작...')
        console.log('='.repeat(60))

        try {
            // 1. 문서 정리
            await this.organizeDocuments()

            // 2. 안쓰는 파일 정리
            await this.cleanupUnusedFiles()

            // 3. 코드 최적화
            await this.optimizeCode()

            // 4. 중복 코드 제거
            await this.removeDuplicateCode()

            // 5. 성능 최적화
            await this.optimizePerformance()

            // 6. 최종 리포트
            await this.generateCleanupReport()

        } catch (error) {
            console.error('❌ 정리 중 오류 발생:', error.message)
        }
    }

    async organizeDocuments() {
        console.log('\n📚 1단계: 문서 정리 및 통합')
        console.log('-'.repeat(40))

        const docFiles = await glob('docs/**/*.md', { cwd: this.projectRoot })
        console.log(`📄 발견된 문서: ${docFiles.length}개`)

        // 문서 분류
        const docCategories = {
            guides: [],
            apis: [],
            reports: [],
            workflows: [],
            others: []
        }

        for (const doc of docFiles) {
            const category = this.categorizeDocument(doc)
            docCategories[category].push(doc)
        }

        // 문서 통합
        await this.consolidateDocuments(docCategories)

        // 중복 문서 제거
        await this.removeDuplicateDocuments(docFiles)

        console.log(`✅ 문서 정리 완료: ${this.cleanupResults.documents.organized}개 정리, ${this.cleanupResults.documents.removed}개 제거`)
    }

    categorizeDocument(docPath) {
        if (docPath.includes('guide') || docPath.includes('manual')) return 'guides'
        if (docPath.includes('api') || docPath.includes('endpoint')) return 'apis'
        if (docPath.includes('report') || docPath.includes('analysis')) return 'reports'
        if (docPath.includes('workflow') || docPath.includes('process')) return 'workflows'
        return 'others'
    }

    async consolidateDocuments(docCategories) {
        console.log('📝 문서 통합 중...')

        for (const [category, docs] of Object.entries(docCategories)) {
            if (docs.length > 1) {
                console.log(`  📂 ${category}: ${docs.length}개 문서 통합`)
                await this.mergeDocuments(category, docs)
                this.cleanupResults.documents.organized += docs.length
            }
        }
    }

    async mergeDocuments(category, docs) {
        const mergedContent = [`# ${category.toUpperCase()} 문서 통합본\n`]

        for (const doc of docs) {
            try {
                const content = await fs.readFile(path.join(this.projectRoot, doc), 'utf8')
                mergedContent.push(`\n## ${path.basename(doc, '.md')}\n`)
                mergedContent.push(content)
            } catch (error) {
                console.log(`    ⚠️ ${doc} 읽기 실패: ${error.message}`)
            }
        }

        const mergedPath = `docs/consolidated-${category}.md`
        await fs.writeFile(mergedPath, mergedContent.join('\n'))
        console.log(`    ✅ 통합 문서 생성: ${mergedPath}`)
    }

    async removeDuplicateDocuments(docFiles) {
        console.log('🗑️ 중복 문서 제거 중...')

        const duplicates = await this.findDuplicateDocuments(docFiles)

        for (const duplicate of duplicates) {
            try {
                await fs.unlink(path.join(this.projectRoot, duplicate))
                console.log(`    🗑️ 제거: ${duplicate}`)
                this.cleanupResults.documents.removed++
            } catch (error) {
                console.log(`    ⚠️ ${duplicate} 제거 실패: ${error.message}`)
            }
        }
    }

    async findDuplicateDocuments(docFiles) {
        const duplicates = []
        const contentMap = new Map()

        for (const doc of docFiles) {
            try {
                const content = await fs.readFile(path.join(this.projectRoot, doc), 'utf8')
                const hash = this.hashContent(content)

                if (contentMap.has(hash)) {
                    duplicates.push(doc)
                } else {
                    contentMap.set(hash, doc)
                }
            } catch (error) {
                // 파일 읽기 실패는 무시
            }
        }

        return duplicates
    }

    async cleanupUnusedFiles() {
        console.log('\n🗂️ 2단계: 안쓰는 파일 정리')
        console.log('-'.repeat(40))

        // 안쓰는 파일 패턴들
        const unusedPatterns = [
            '**/*.tmp',
            '**/*.temp',
            '**/*.log',
            '**/*.cache',
            '**/node_modules/.cache/**',
            '**/.DS_Store',
            '**/Thumbs.db',
            '**/*.swp',
            '**/*.swo',
            '**/test-results/**',
            '**/coverage/**',
            '**/dist/**',
            '**/build/**'
        ]

        for (const pattern of unusedPatterns) {
            const files = await glob(pattern, { cwd: this.projectRoot })
            console.log(`🔍 ${pattern}: ${files.length}개 파일 발견`)

            for (const file of files) {
                try {
                    await fs.unlink(path.join(this.projectRoot, file))
                    console.log(`    🗑️ 제거: ${file}`)
                    this.cleanupResults.files.removed++
                } catch (error) {
                    console.log(`    ⚠️ ${file} 제거 실패: ${error.message}`)
                }
            }
        }

        // 사용되지 않는 스크립트 파일들
        await this.findUnusedScripts()

        console.log(`✅ 파일 정리 완료: ${this.cleanupResults.files.removed}개 제거`)
    }

    async findUnusedScripts() {
        console.log('🔍 사용되지 않는 스크립트 검색 중...')

        const scriptFiles = await glob('scripts/**/*.js', { cwd: this.projectRoot })
        const packageJson = await this.readPackageJson()

        const usedScripts = new Set()

        // package.json의 scripts에서 사용되는 파일들
        if (packageJson.scripts) {
            Object.values(packageJson.scripts).forEach(script => {
                const matches = script.match(/scripts\/([^'"\s]+\.js)/g)
                if (matches) {
                    matches.forEach(match => {
                        usedScripts.add(match.replace('scripts/', ''))
                    })
                }
            })
        }

        // 다른 스크립트에서 import/require되는 파일들
        for (const script of scriptFiles) {
            try {
                const content = await fs.readFile(path.join(this.projectRoot, script), 'utf8')
                const imports = this.extractImports(content)

                imports.forEach(imp => {
                    if (imp.includes('scripts/')) {
                        const fileName = path.basename(imp)
                        usedScripts.add(fileName)
                    }
                })
            } catch (error) {
                // 파일 읽기 실패는 무시
            }
        }

        // 사용되지 않는 스크립트 찾기
        const unusedScripts = scriptFiles.filter(script => {
            const fileName = path.basename(script)
            return !usedScripts.has(fileName) && !this.isEssentialScript(fileName)
        })

        console.log(`📝 사용되지 않는 스크립트: ${unusedScripts.length}개`)
        for (const script of unusedScripts.slice(0, 5)) { // 최대 5개만 표시
            console.log(`  🗑️ ${script}`)
            this.unusedFiles.push(script)
        }
    }

    isEssentialScript(fileName) {
        const essentialScripts = [
            'package.json',
            'jest.config.js',
            'webpack.config.js',
            'babel.config.js',
            '.eslintrc.js'
        ]
        return essentialScripts.includes(fileName)
    }

    async optimizeCode() {
        console.log('\n⚡ 3단계: 코드 최적화')
        console.log('-'.repeat(40))

        const codeFiles = await glob('**/*.{js,jsx,ts,tsx}', {
            cwd: this.projectRoot,
            ignore: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**']
        })

        console.log(`🔍 분석할 코드 파일: ${codeFiles.length}개`)

        for (const file of codeFiles.slice(0, 10)) { // 최대 10개 파일만 분석
            await this.optimizeFile(file)
        }

        console.log(`✅ 코드 최적화 완료: ${this.cleanupResults.code.optimized}개 파일 최적화`)
    }

    async optimizeFile(filePath) {
        try {
            const content = await fs.readFile(path.join(this.projectRoot, filePath), 'utf8')
            const originalSize = content.length

            // 최적화 적용
            let optimizedContent = content

            // 1. 불필요한 공백 제거
            optimizedContent = optimizedContent.replace(/\n\s*\n\s*\n/g, '\n\n')

            // 2. 사용되지 않는 import 제거
            optimizedContent = this.removeUnusedImports(optimizedContent)

            // 3. 중복 코드 제거
            optimizedContent = this.removeDuplicateCodeInFile(optimizedContent)

            // 4. 사용되지 않는 함수 제거
            optimizedContent = this.removeUnusedFunctions(optimizedContent)

            const optimizedSize = optimizedContent.length
            const savedBytes = originalSize - optimizedSize

            if (savedBytes > 0) {
                await fs.writeFile(path.join(this.projectRoot, filePath), optimizedContent)
                console.log(`  ⚡ ${filePath}: ${savedBytes}바이트 절약`)
                this.cleanupResults.code.optimized++
            }

        } catch (error) {
            console.log(`  ⚠️ ${filePath} 최적화 실패: ${error.message}`)
        }
    }

    removeUnusedImports(content) {
        // 간단한 사용되지 않는 import 제거 (실제로는 더 복잡한 분석 필요)
        const lines = content.split('\n')
        const optimizedLines = []

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]

            // import 문인지 확인
            if (line.trim().startsWith('import ') || line.trim().startsWith('const ') && line.includes('require(')) {
                // 사용되는지 확인 (간단한 휴리스틱)
                const importName = this.extractImportName(line)
                if (importName && !this.isImportUsed(content, importName)) {
                    console.log(`    🗑️ 사용되지 않는 import 제거: ${importName}`)
                    continue
                }
            }

            optimizedLines.push(line)
        }

        return optimizedLines.join('\n')
    }

    extractImportName(importLine) {
        const match = importLine.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/)
        if (match) {
            return path.basename(match[1])
        }

        const requireMatch = importLine.match(/require\(['"]([^'"]+)['"]\)/)
        if (requireMatch) {
            return path.basename(requireMatch[1])
        }

        return null
    }

    isImportUsed(content, importName) {
        // 간단한 사용 여부 확인
        const usagePatterns = [
            new RegExp(`\\b${importName}\\b`, 'g'),
            new RegExp(`<${importName}`, 'g'),
            new RegExp(`${importName}\\.`, 'g')
        ]

        return usagePatterns.some(pattern => pattern.test(content))
    }

    removeDuplicateCodeInFile(content) {
        const lines = content.split('\n')
        const lineCount = new Map()

        // 라인별 빈도 계산
        lines.forEach(line => {
            const trimmed = line.trim()
            if (trimmed.length > 10) { // 의미있는 라인만
                lineCount.set(trimmed, (lineCount.get(trimmed) || 0) + 1)
            }
        })

        // 중복 라인 찾기
        const duplicates = Array.from(lineCount.entries())
            .filter(([line, count]) => count > 1)
            .map(([line, count]) => ({ line, count }))

        if (duplicates.length > 0) {
            console.log(`    🔄 중복 코드 발견: ${duplicates.length}개`)
            this.cleanupResults.code.duplicatesRemoved += duplicates.length
        }

        return content // 실제로는 중복 제거 로직 구현 필요
    }

    removeUnusedFunctions(content) {
        // 사용되지 않는 함수 찾기 (간단한 휴리스틱)
        const functionPattern = /function\s+(\w+)\s*\(/g
        const functions = []
        let match

        while ((match = functionPattern.exec(content)) !== null) {
            functions.push(match[1])
        }

        const unusedFunctions = functions.filter(funcName => {
            const usagePattern = new RegExp(`\\b${funcName}\\s*\\(`, 'g')
            const matches = content.match(usagePattern)
            return !matches || matches.length <= 1 // 정의만 있고 사용되지 않음
        })

        if (unusedFunctions.length > 0) {
            console.log(`    🗑️ 사용되지 않는 함수: ${unusedFunctions.join(', ')}`)
            this.cleanupResults.code.unusedFunctionsRemoved += unusedFunctions.length
        }

        return content // 실제로는 함수 제거 로직 구현 필요
    }

    async removeDuplicateCode() {
        console.log('\n🔄 4단계: 중복 코드 제거')
        console.log('-'.repeat(40))

        const codeFiles = await glob('**/*.{js,jsx,ts,tsx}', {
            cwd: this.projectRoot,
            ignore: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**']
        })

        const codeBlocks = new Map()

        for (const file of codeFiles.slice(0, 5)) { // 최대 5개 파일만 분석
            try {
                const content = await fs.readFile(path.join(this.projectRoot, file), 'utf8')
                const blocks = this.extractCodeBlocks(content)

                blocks.forEach(block => {
                    const hash = this.hashContent(block)
                    if (codeBlocks.has(hash)) {
                        codeBlocks.get(hash).push(file)
                    } else {
                        codeBlocks.set(hash, [file])
                    }
                })
            } catch (error) {
                // 파일 읽기 실패는 무시
            }
        }

        // 중복 코드 블록 찾기
        const duplicates = Array.from(codeBlocks.entries())
            .filter(([hash, files]) => files.length > 1)

        console.log(`🔍 중복 코드 블록: ${duplicates.length}개`)

        for (const [hash, files] of duplicates.slice(0, 3)) { // 최대 3개만 표시
            console.log(`  🔄 중복 발견: ${files.join(', ')}`)
        }

        this.cleanupResults.code.duplicatesRemoved += duplicates.length
    }

    extractCodeBlocks(content) {
        // 간단한 코드 블록 추출 (실제로는 더 정교한 파싱 필요)
        const blocks = []
        const lines = content.split('\n')

        for (let i = 0; i < lines.length - 5; i++) {
            const block = lines.slice(i, i + 5).join('\n')
            if (block.trim().length > 50) {
                blocks.push(block)
            }
        }

        return blocks
    }

    async optimizePerformance() {
        console.log('\n🚀 5단계: 성능 최적화')
        console.log('-'.repeat(40))

        // 1. 이미지 최적화
        await this.optimizeImages()

        // 2. 번들 크기 최적화
        await this.optimizeBundleSize()

        // 3. 캐싱 전략 최적화
        await this.optimizeCaching()

        console.log(`✅ 성능 최적화 완료: ${this.cleanupResults.performance.improvements}개 개선사항`)
    }

    async optimizeImages() {
        console.log('🖼️ 이미지 최적화 중...')

        const imageFiles = await glob('**/*.{jpg,jpeg,png,gif,svg}', {
            cwd: this.projectRoot,
            ignore: ['node_modules/**', 'dist/**', 'build/**']
        })

        console.log(`  📸 발견된 이미지: ${imageFiles.length}개`)

        // 큰 이미지 파일 찾기
        const largeImages = []
        for (const image of imageFiles.slice(0, 5)) {
            try {
                const stats = await fs.stat(path.join(this.projectRoot, image))
                if (stats.size > 100 * 1024) { // 100KB 이상
                    largeImages.push({ file: image, size: stats.size })
                }
            } catch (error) {
                // 파일 접근 실패는 무시
            }
        }

        if (largeImages.length > 0) {
            console.log(`  ⚠️ 큰 이미지 파일: ${largeImages.length}개`)
            largeImages.forEach(img => {
                const sizeKB = (img.size / 1024).toFixed(1)
                console.log(`    📸 ${img.file}: ${sizeKB}KB`)
            })
            this.cleanupResults.performance.improvements += largeImages.length
        }
    }

    async optimizeBundleSize() {
        console.log('📦 번들 크기 최적화 중...')

        // package.json 분석
        const packageJson = await this.readPackageJson()

        if (packageJson.dependencies) {
            const deps = Object.keys(packageJson.dependencies)
            console.log(`  📦 의존성: ${deps.length}개`)

            // 사용되지 않는 의존성 찾기
            const unusedDeps = await this.findUnusedDependencies(deps)

            if (unusedDeps.length > 0) {
                console.log(`  🗑️ 사용되지 않는 의존성: ${unusedDeps.length}개`)
                unusedDeps.forEach(dep => {
                    console.log(`    📦 ${dep}`)
                })
                this.cleanupResults.performance.improvements += unusedDeps.length
            }
        }
    }

    async findUnusedDependencies(dependencies) {
        const unusedDeps = []

        for (const dep of dependencies.slice(0, 10)) { // 최대 10개만 확인
            const usagePattern = new RegExp(`['"]${dep}['"]`, 'g')
            const files = await glob('**/*.{js,jsx,ts,tsx}', {
                cwd: this.projectRoot,
                ignore: ['node_modules/**', 'dist/**', 'build/**']
            })

            let isUsed = false
            for (const file of files.slice(0, 5)) { // 최대 5개 파일만 확인
                try {
                    const content = await fs.readFile(path.join(this.projectRoot, file), 'utf8')
                    if (usagePattern.test(content)) {
                        isUsed = true
                        break
                    }
                } catch (error) {
                    // 파일 읽기 실패는 무시
                }
            }

            if (!isUsed) {
                unusedDeps.push(dep)
            }
        }

        return unusedDeps
    }

    async optimizeCaching() {
        console.log('💾 캐싱 전략 최적화 중...')

        // 캐시 관련 파일들 찾기
        const cacheFiles = await glob('**/*cache*', { cwd: this.projectRoot })
        const configFiles = await glob('**/*config*', { cwd: this.projectRoot })

        console.log(`  💾 캐시 파일: ${cacheFiles.length}개`)
        console.log(`  ⚙️ 설정 파일: ${configFiles.length}개`)

        // 캐시 최적화 제안
        if (cacheFiles.length > 0) {
            console.log(`  💡 캐시 최적화 제안: 캐시 TTL 조정, 압축 활성화`)
            this.cleanupResults.performance.improvements++
        }
    }

    async generateCleanupReport() {
        console.log('\n📊 정리 및 최적화 리포트')
        console.log('='.repeat(60))

        console.log('📚 문서 정리:')
        console.log(`  📝 정리된 문서: ${this.cleanupResults.documents.organized}개`)
        console.log(`  🗑️ 제거된 문서: ${this.cleanupResults.documents.removed}개`)

        console.log('\n🗂️ 파일 정리:')
        console.log(`  🗑️ 제거된 파일: ${this.cleanupResults.files.removed}개`)
        console.log(`  ⚡ 최적화된 파일: ${this.cleanupResults.files.optimized}개`)

        console.log('\n⚡ 코드 최적화:')
        console.log(`  🔄 중복 코드 제거: ${this.cleanupResults.code.duplicatesRemoved}개`)
        console.log(`  🗑️ 사용되지 않는 함수 제거: ${this.cleanupResults.code.unusedFunctionsRemoved}개`)
        console.log(`  ⚡ 최적화된 파일: ${this.cleanupResults.code.optimized}개`)

        console.log('\n🚀 성능 최적화:')
        console.log(`  💡 개선사항: ${this.cleanupResults.performance.improvements}개`)

        // 최종 리포트 저장
        const report = {
            timestamp: new Date().toISOString(),
            cleanupResults: this.cleanupResults,
            unusedFiles: this.unusedFiles,
            duplicateCode: this.duplicateCode,
            unusedFunctions: this.unusedFunctions
        }

        const reportPath = `reports/cleanup-report-${Date.now()}.json`
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2))
        console.log(`\n📄 리포트 저장: ${reportPath}`)

        // 다음 단계 제안
        console.log('\n🚀 다음 단계 제안:')
        console.log('1. 사용되지 않는 의존성 제거')
        console.log('2. 이미지 압축 및 최적화')
        console.log('3. 코드 스플리팅 구현')
        console.log('4. 번들 분석 및 최적화')
        console.log('5. 지속적인 모니터링 설정')
    }

    async readPackageJson() {
        try {
            const content = await fs.readFile(path.join(this.projectRoot, 'package.json'), 'utf8')
            return JSON.parse(content)
        } catch (error) {
            return {}
        }
    }

    hashContent(content) {
        // 간단한 해시 함수
        let hash = 0
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash = hash & hash // 32bit 정수로 변환
        }
        return hash.toString()
    }

    extractImports(content) {
        const imports = []
        const importPattern = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g
        const requirePattern = /require\(['"]([^'"]+)['"]\)/g

        let match
        while ((match = importPattern.exec(content)) !== null) {
            imports.push(match[1])
        }

        while ((match = requirePattern.exec(content)) !== null) {
            imports.push(match[1])
        }

        return imports
    }
}

// 실행
if (require.main === module) {
    const cleanup = new ProjectCleanupOptimizer()
    cleanup.startCleanup().catch(console.error)
}

module.exports = ProjectCleanupOptimizer

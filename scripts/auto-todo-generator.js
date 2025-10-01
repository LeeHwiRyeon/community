#!/usr/bin/env node

/**
 * 자동 TODO 생성기
 * 
 * 이 스크립트는 다음을 자동으로 수행합니다:
 * 1. 버그 감지 및 TODO 생성
 * 2. 개선사항 감지 및 TODO 생성
 * 3. 기능 요청 감지 및 TODO 생성
 * 4. 우선순위 계산 및 할당
 */

const fs = require('fs').promises
const path = require('path')
const { exec } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)

class AutoTodoGenerator {
    constructor() {
        this.todoFile = 'docs/todo-backlog.md'
        this.bugPatterns = [
            { pattern: /Error:|Exception:|Failed:/gi, severity: 'high', category: 'error' },
            { pattern: /TypeError|ReferenceError|SyntaxError/gi, severity: 'critical', category: 'javascript' },
            { pattern: /500|502|503|504/gi, severity: 'high', category: 'http' },
            { pattern: /timeout|slow|performance/gi, severity: 'medium', category: 'performance' },
            { pattern: /security|vulnerability|injection/gi, severity: 'critical', category: 'security' }
        ]

        this.improvementPatterns = [
            { pattern: /TODO|FIXME|HACK/gi, severity: 'low', category: 'code-quality' },
            { pattern: /optimize|improve|enhance/gi, severity: 'medium', category: 'optimization' },
            { pattern: /refactor|cleanup|modernize/gi, severity: 'low', category: 'maintenance' }
        ]
    }

    async run() {
        console.log('🚀 자동 TODO 생성기 시작...')

        try {
            // 1. 버그 감지
            const bugs = await this.detectBugs()
            console.log(`🐛 감지된 버그: ${bugs.length}개`)

            // 2. 개선사항 감지
            const improvements = await this.detectImprovements()
            console.log(`🔧 감지된 개선사항: ${improvements.length}개`)

            // 3. 테스트 실패 감지
            const testFailures = await this.detectTestFailures()
            console.log(`🧪 감지된 테스트 실패: ${testFailures.length}개`)

            // 4. 성능 이슈 감지
            const performanceIssues = await this.detectPerformanceIssues()
            console.log(`⚡ 감지된 성능 이슈: ${performanceIssues.length}개`)

            // 5. TODO 생성
            const allTodos = [...bugs, ...improvements, ...testFailures, ...performanceIssues]
            await this.generateTodos(allTodos)

            console.log(`✅ 총 ${allTodos.length}개의 TODO가 생성되었습니다.`)

        } catch (error) {
            console.error('❌ 오류 발생:', error.message)
            process.exit(1)
        }
    }

    async detectBugs() {
        const bugs = []

        try {
            // 에러 로그 분석
            const logFiles = ['logs/error.log', 'backend.err', 'frontend-preview.err']

            for (const logFile of logFiles) {
                try {
                    const content = await fs.readFile(logFile, 'utf8')
                    const lines = content.split('\n').filter(line => line.trim())

                    for (const line of lines) {
                        for (const pattern of this.bugPatterns) {
                            if (pattern.pattern.test(line)) {
                                bugs.push({
                                    type: 'bug',
                                    title: this.extractTitle(line),
                                    description: line.trim(),
                                    severity: pattern.severity,
                                    category: pattern.category,
                                    source: logFile,
                                    priority: this.calculatePriority(pattern.severity, pattern.category)
                                })
                            }
                        }
                    }
                } catch (err) {
                    // 로그 파일이 없으면 무시
                }
            }

            // Git 커밋에서 에러 메시지 찾기
            const { stdout } = await execAsync('git log --oneline -20 --grep="fix\\|bug\\|error" --grep="Fix\\|Bug\\|Error" -i')
            const commits = stdout.split('\n').filter(line => line.trim())

            for (const commit of commits) {
                if (commit.includes('fix') || commit.includes('bug') || commit.includes('error')) {
                    bugs.push({
                        type: 'bug',
                        title: `Review commit: ${commit}`,
                        description: commit,
                        severity: 'medium',
                        category: 'git',
                        source: 'git-log',
                        priority: this.calculatePriority('medium', 'git')
                    })
                }
            }

        } catch (error) {
            console.warn('⚠️ 버그 감지 중 오류:', error.message)
        }

        return bugs
    }

    async detectImprovements() {
        const improvements = []

        try {
            // 코드에서 TODO, FIXME, HACK 주석 찾기 (Windows 호환)
            let stdout = ''
            try {
                if (process.platform === 'win32') {
                    // Windows에서는 findstr 사용
                    const { stdout: winStdout } = await execAsync('findstr /r /s /i "TODO FIXME HACK" *.js *.ts *.tsx 2>nul || echo.')
                    stdout = winStdout
                } else {
                    // Linux/Mac에서는 grep 사용
                    const { stdout: unixStdout } = await execAsync('grep -r "TODO\\|FIXME\\|HACK" --include="*.js" --include="*.ts" --include="*.tsx" . || true')
                    stdout = unixStdout
                }
            } catch (error) {
                // 명령어 실행 실패 시 파일 시스템으로 직접 검색
                stdout = await this.searchCommentsInFiles()
            }
            const lines = stdout.split('\n').filter(line => line.trim())

            for (const line of lines) {
                const match = line.match(/(.*):(.*):(.*)/)
                if (match) {
                    const [, file, lineNum, content] = match
                    improvements.push({
                        type: 'improvement',
                        title: `Code improvement needed: ${content.trim()}`,
                        description: `File: ${file}, Line: ${lineNum}\n${content.trim()}`,
                        severity: 'low',
                        category: 'code-quality',
                        source: file,
                        priority: this.calculatePriority('low', 'code-quality')
                    })
                }
            }

        } catch (error) {
            console.warn('⚠️ 개선사항 감지 중 오류:', error.message)
        }

        return improvements
    }

    async detectTestFailures() {
        const failures = []

        try {
            // 테스트 결과 파일 확인
            const testResultFiles = [
                'test-results.json',
                'frontend/test-results.json',
                'server-backend/test-results.json'
            ]

            for (const file of testResultFiles) {
                try {
                    const content = await fs.readFile(file, 'utf8')
                    const results = JSON.parse(content)

                    if (results.failures && results.failures.length > 0) {
                        for (const failure of results.failures) {
                            failures.push({
                                type: 'test-failure',
                                title: `Test failure: ${failure.title || failure.name}`,
                                description: failure.error || failure.message || 'Test failed',
                                severity: 'high',
                                category: 'testing',
                                source: file,
                                priority: this.calculatePriority('high', 'testing')
                            })
                        }
                    }
                } catch (err) {
                    // 파일이 없거나 파싱 오류면 무시
                }
            }

        } catch (error) {
            console.warn('⚠️ 테스트 실패 감지 중 오류:', error.message)
        }

        return failures
    }

    async detectPerformanceIssues() {
        const issues = []

        try {
            // Lighthouse 리포트 확인
            const lighthouseFiles = [
                'lighthouse-report.json',
                'frontend/lighthouse-report.json'
            ]

            for (const file of lighthouseFiles) {
                try {
                    const content = await fs.readFile(file, 'utf8')
                    const report = JSON.parse(content)

                    if (report.categories) {
                        for (const [category, data] of Object.entries(report.categories)) {
                            if (data.score < 0.9) {
                                issues.push({
                                    type: 'performance',
                                    title: `Performance issue: ${category} score is ${(data.score * 100).toFixed(1)}%`,
                                    description: `Category: ${category}\nScore: ${(data.score * 100).toFixed(1)}%\nTarget: 90%`,
                                    severity: data.score < 0.7 ? 'high' : 'medium',
                                    category: 'performance',
                                    source: file,
                                    priority: this.calculatePriority(data.score < 0.7 ? 'high' : 'medium', 'performance')
                                })
                            }
                        }
                    }
                } catch (err) {
                    // 파일이 없거나 파싱 오류면 무시
                }
            }

        } catch (error) {
            console.warn('⚠️ 성능 이슈 감지 중 오류:', error.message)
        }

        return issues
    }

    async generateTodos(todos) {
        if (todos.length === 0) {
            console.log('📝 새로운 TODO가 없습니다.')
            return
        }

        // 기존 TODO 파일 읽기
        let content = ''
        try {
            content = await fs.readFile(this.todoFile, 'utf8')
        } catch (error) {
            console.warn('⚠️ TODO 파일을 읽을 수 없습니다. 새로 생성합니다.')
        }

        // 새로운 TODO 섹션 생성
        const newSection = this.createTodoSection(todos)

        // TODO 파일 업데이트
        const updatedContent = this.insertNewTodos(content, newSection)
        await fs.writeFile(this.todoFile, updatedContent, 'utf8')

        console.log('📝 TODO 파일이 업데이트되었습니다.')
    }

    createTodoSection(todos) {
        const now = new Date().toISOString().split('T')[0]
        let section = `\n## 🤖 자동 생성된 TODO (${now})\n\n`

        // 우선순위별로 그룹화
        const grouped = this.groupByPriority(todos)

        for (const [priority, priorityTodos] of Object.entries(grouped)) {
            const emoji = this.getPriorityEmoji(priority)
            section += `### ${emoji} ${priority.toUpperCase()} 우선순위\n\n`

            for (const todo of priorityTodos) {
                section += `| ${this.getTypeEmoji(todo.type)} | ${todo.title} | ${todo.severity} | ${todo.category} | ${todo.source} | ${todo.priority} |\n`
            }
            section += '\n'
        }

        return section
    }

    groupByPriority(todos) {
        const groups = {
            critical: [],
            high: [],
            medium: [],
            low: []
        }

        for (const todo of todos) {
            groups[todo.severity].push(todo)
        }

        return groups
    }

    async searchCommentsInFiles() {
        const fs = require('fs')
        const path = require('path')
        const results = []

        const searchInDirectory = async (dir) => {
            const files = await fs.promises.readdir(dir, { withFileTypes: true })

            for (const file of files) {
                const fullPath = path.join(dir, file.name)

                if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
                    await searchInDirectory(fullPath)
                } else if (file.isFile() && /\.(js|ts|tsx)$/.test(file.name)) {
                    try {
                        const content = await fs.promises.readFile(fullPath, 'utf8')
                        const lines = content.split('\n')

                        lines.forEach((line, index) => {
                            if (/TODO|FIXME|HACK/i.test(line)) {
                                results.push(`${fullPath}:${index + 1}:${line.trim()}`)
                            }
                        })
                    } catch (error) {
                        // 파일 읽기 실패 시 무시
                    }
                }
            }
        }

        await searchInDirectory('.')
        return results.join('\n')
    }

    getPriorityEmoji(priority) {
        const emojis = {
            critical: '🚨',
            high: '🔥',
            medium: '⚡',
            low: '📋'
        }
        return emojis[priority] || '📋'
    }

    getTypeEmoji(type) {
        const emojis = {
            bug: '🐛',
            improvement: '🔧',
            'test-failure': '🧪',
            performance: '⚡'
        }
        return emojis[type] || '📝'
    }

    insertNewTodos(content, newSection) {
        // 기존 자동 생성 섹션 찾기
        const autoSectionRegex = /## 🤖 자동 생성된 TODO.*?(?=## |$)/s
        const match = content.match(autoSectionRegex)

        if (match) {
            // 기존 섹션 교체
            return content.replace(autoSectionRegex, newSection)
        } else {
            // 새 섹션 추가 (Usage Guidelines 앞에)
            const insertPoint = content.indexOf('## Usage Guidelines')
            if (insertPoint !== -1) {
                return content.slice(0, insertPoint) + newSection + '\n' + content.slice(insertPoint)
            } else {
                return content + '\n' + newSection
            }
        }
    }

    extractTitle(line) {
        // 에러 메시지에서 의미있는 제목 추출
        const match = line.match(/(Error|Exception|Failed):\s*(.+)/i)
        if (match) {
            return match[2].trim().substring(0, 100)
        }

        return line.trim().substring(0, 100)
    }

    calculatePriority(severity, category) {
        const severityWeight = {
            critical: 4,
            high: 3,
            medium: 2,
            low: 1
        }

        const categoryWeight = {
            security: 4,
            error: 3,
            performance: 3,
            testing: 2,
            'code-quality': 1,
            maintenance: 1
        }

        const priority = severityWeight[severity] * (categoryWeight[category] || 1)
        return Math.min(priority, 4)
    }
}

// 스크립트 실행
if (require.main === module) {
    const generator = new AutoTodoGenerator()
    generator.run().catch(console.error)
}

module.exports = AutoTodoGenerator

#!/usr/bin/env node

/**
 * 자동 진행 추적기
 * 
 * 이 스크립트는 다음을 자동으로 수행합니다:
 * 1. 작업 진행 상황 모니터링
 * 2. 완료된 작업 자동 감지
 * 3. 지연된 작업 에스컬레이션
 * 4. 다음 TODO 자동 생성
 */

const fs = require('fs').promises
const path = require('path')
const { exec } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)

class AutoProgressTracker {
    constructor() {
        this.todoFile = 'docs/todo-backlog.md'
        this.progressFile = 'docs/progress-report.md'
        this.versionFile = 'package.json'
    }

    async run() {
        console.log('📊 자동 진행 추적기 시작...')

        try {
            // 1. 현재 진행 상황 분석
            const progress = await this.analyzeProgress()
            console.log(`📈 진행률: ${progress.completionRate}%`)

            // 2. 완료된 작업 감지
            const completed = await this.detectCompletedTasks()
            console.log(`✅ 완료된 작업: ${completed.length}개`)

            // 3. 지연된 작업 감지
            const delayed = await this.detectDelayedTasks()
            console.log(`⏰ 지연된 작업: ${delayed.length}개`)

            // 4. 진행 리포트 생성
            await this.generateProgressReport(progress, completed, delayed)

            // 5. 다음 TODO 생성
            if (completed.length > 0) {
                await this.generateNextTodos(completed)
            }

            // 6. 버전 체크
            await this.checkVersionProgress()

            console.log('✅ 진행 추적이 완료되었습니다.')

        } catch (error) {
            console.error('❌ 오류 발생:', error.message)
            process.exit(1)
        }
    }

    async analyzeProgress() {
        const todos = await this.parseTodos()
        const total = todos.length
        const completed = todos.filter(todo =>
            todo.status === '✅' ||
            todo.status === 'completed' ||
            todo.status === 'done'
        ).length

        const inProgress = todos.filter(todo =>
            todo.status === '🔄' ||
            todo.status === 'In Progress' ||
            todo.status === 'in-progress'
        ).length

        const pending = todos.filter(todo =>
            todo.status === '⬜' ||
            todo.status === 'pending' ||
            todo.status === 'todo'
        ).length

        return {
            total,
            completed,
            inProgress,
            pending,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
        }
    }

    async parseTodos() {
        const content = await fs.readFile(this.todoFile, 'utf8')
        const todos = []

        const lines = content.split('\n')
        let inTable = false

        for (const line of lines) {
            if (line.includes('|') && line.includes('Step') && line.includes('Status')) {
                inTable = true
                continue
            }

            if (inTable && line.includes('|') && !line.includes('---')) {
                const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell)

                if (cells.length >= 4) {
                    const todo = {
                        step: cells[0],
                        status: cells[1],
                        title: cells[2],
                        assignee: cells[3] || 'TBD',
                        priority: this.extractPriority(cells[2]),
                        createdAt: this.extractDate(line) || new Date().toISOString().split('T')[0]
                    }

                    todos.push(todo)
                }
            }

            if (inTable && line.trim() === '') {
                inTable = false
            }
        }

        return todos
    }

    extractPriority(title) {
        if (title.includes('Critical') || title.includes('P0')) return 4
        if (title.includes('High') || title.includes('P1')) return 3
        if (title.includes('Medium') || title.includes('P2')) return 2
        if (title.includes('Low') || title.includes('P3')) return 1
        return 2
    }

    extractDate(line) {
        // 날짜 패턴 찾기 (YYYY-MM-DD)
        const dateMatch = line.match(/(\d{4}-\d{2}-\d{2})/)
        return dateMatch ? dateMatch[1] : null
    }

    async detectCompletedTasks() {
        const completed = []

        try {
            // Git 커밋 분석
            const { stdout } = await execAsync('git log --oneline --since="1 day ago" --grep="fix\\|complete\\|done\\|finish" -i')
            const commits = stdout.split('\n').filter(line => line.trim())

            for (const commit of commits) {
                if (commit.includes('fix') || commit.includes('complete') || commit.includes('done')) {
                    completed.push({
                        type: 'commit',
                        title: commit,
                        timestamp: new Date().toISOString(),
                        source: 'git'
                    })
                }
            }

            // 테스트 결과 분석
            const testFiles = [
                'test-results.json',
                'frontend/test-results.json',
                'server-backend/test-results.json'
            ]

            for (const file of testFiles) {
                try {
                    const content = await fs.readFile(file, 'utf8')
                    const results = JSON.parse(content)

                    if (results.passed && results.passed.length > 0) {
                        for (const test of results.passed) {
                            completed.push({
                                type: 'test',
                                title: `Test passed: ${test.title || test.name}`,
                                timestamp: new Date().toISOString(),
                                source: file
                            })
                        }
                    }
                } catch (err) {
                    // 파일이 없으면 무시
                }
            }

        } catch (error) {
            console.warn('⚠️ 완료된 작업 감지 중 오류:', error.message)
        }

        return completed
    }

    async detectDelayedTasks() {
        const delayed = []
        const todos = await this.parseTodos()
        const now = new Date()

        for (const todo of todos) {
            if (todo.status === '🔄' || todo.status === 'In Progress') {
                const createdAt = new Date(todo.createdAt)
                const daysElapsed = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24))

                // 우선순위에 따른 지연 기준
                const delayThreshold = {
                    4: 1,  // Critical: 1일
                    3: 3,  // High: 3일
                    2: 7,  // Medium: 7일
                    1: 14  // Low: 14일
                }

                const threshold = delayThreshold[todo.priority] || 7

                if (daysElapsed > threshold) {
                    delayed.push({
                        ...todo,
                        daysElapsed,
                        threshold
                    })
                }
            }
        }

        return delayed
    }

    async generateProgressReport(progress, completed, delayed) {
        const now = new Date().toISOString().split('T')[0]

        let content = `# 진행 리포트 (${now})\n\n`

        // 전체 진행률
        content += `## 📊 전체 진행률\n\n`
        content += `- **완료**: ${progress.completed}개 (${progress.completionRate}%)\n`
        content += `- **진행 중**: ${progress.inProgress}개\n`
        content += `- **대기 중**: ${progress.pending}개\n`
        content += `- **총 작업**: ${progress.total}개\n\n`

        // 진행률 바
        const progressBar = this.generateProgressBar(progress.completionRate)
        content += `\`${progressBar}\` ${progress.completionRate}%\n\n`

        // 완료된 작업
        if (completed.length > 0) {
            content += `## ✅ 최근 완료된 작업\n\n`
            for (const task of completed.slice(0, 10)) {
                content += `- **${task.type}**: ${task.title}\n`
            }
            content += '\n'
        }

        // 지연된 작업
        if (delayed.length > 0) {
            content += `## ⏰ 지연된 작업 (주의 필요)\n\n`
            for (const task of delayed) {
                content += `- **${task.title}** (${task.daysElapsed}일 경과, 기준: ${task.threshold}일)\n`
                content += `  - 담당자: ${task.assignee}\n`
                content += `  - 우선순위: ${task.priority}\n\n`
            }
        }

        // 다음 주 목표
        content += `## 🎯 다음 주 목표\n\n`
        const nextWeekGoals = this.generateNextWeekGoals(progress)
        for (const goal of nextWeekGoals) {
            content += `- [ ] ${goal}\n`
        }
        content += '\n'

        // 버전 진행률
        const versionProgress = await this.calculateVersionProgress()
        content += `## 🚀 버전 진행률\n\n`
        content += `- **현재 버전**: ${versionProgress.current}\n`
        content += `- **목표 버전**: ${versionProgress.target}\n`
        content += `- **진행률**: ${versionProgress.progress}%\n\n`

        await fs.writeFile(this.progressFile, content, 'utf8')
        console.log('📊 진행 리포트가 생성되었습니다.')
    }

    generateProgressBar(percentage) {
        const filled = Math.round(percentage / 5)
        const empty = 20 - filled
        return '█'.repeat(filled) + '░'.repeat(empty)
    }

    generateNextWeekGoals(progress) {
        const goals = []

        if (progress.completionRate < 50) {
            goals.push('기본 기능 완성 (50% 달성)')
        } else if (progress.completionRate < 80) {
            goals.push('핵심 기능 완성 (80% 달성)')
        } else {
            goals.push('모든 기능 완성 (100% 달성)')
        }

        if (progress.inProgress > 0) {
            goals.push('진행 중인 작업 완료')
        }

        if (progress.pending > 0) {
            goals.push('대기 중인 작업 시작')
        }

        goals.push('코드 품질 개선')
        goals.push('테스트 커버리지 향상')

        return goals
    }

    async calculateVersionProgress() {
        try {
            const content = await fs.readFile(this.versionFile, 'utf8')
            const packageJson = JSON.parse(content)
            const currentVersion = packageJson.version

            // 목표 버전 설정 (예: v2.0.0)
            const targetVersion = '2.0.0'

            // 버전 비교 (간단한 예시)
            const current = currentVersion.split('.').map(Number)
            const target = targetVersion.split('.').map(Number)

            let progress = 0
            for (let i = 0; i < Math.min(current.length, target.length); i++) {
                if (current[i] < target[i]) {
                    progress = (i * 33) + ((current[i] / target[i]) * 33)
                    break
                } else if (current[i] === target[i]) {
                    progress = (i + 1) * 33
                }
            }

            return {
                current: currentVersion,
                target: targetVersion,
                progress: Math.min(Math.round(progress), 100)
            }
        } catch (error) {
            return {
                current: '1.0.0',
                target: '2.0.0',
                progress: 0
            }
        }
    }

    async generateNextTodos(completed) {
        const nextTodos = []

        // 완료된 작업을 기반으로 다음 TODO 생성
        for (const task of completed) {
            if (task.type === 'test' && task.title.includes('unit')) {
                nextTodos.push({
                    type: 'improvement',
                    title: '통합 테스트 추가',
                    description: '단위 테스트 완료 후 통합 테스트 구현',
                    priority: 2,
                    category: 'testing'
                })
            }

            if (task.type === 'commit' && task.title.includes('feature')) {
                nextTodos.push({
                    type: 'improvement',
                    title: '기능 문서화',
                    description: '새로운 기능에 대한 문서 작성',
                    priority: 1,
                    category: 'documentation'
                })
            }
        }

        if (nextTodos.length > 0) {
            await this.addNextTodos(nextTodos)
            console.log(`🔄 다음 TODO ${nextTodos.length}개가 생성되었습니다.`)
        }
    }

    async addNextTodos(todos) {
        const content = await fs.readFile(this.todoFile, 'utf8')
        const now = new Date().toISOString().split('T')[0]

        let newSection = `\n## 🔄 자동 생성된 후속 TODO (${now})\n\n`

        for (const todo of todos) {
            newSection += `| ${this.getTypeEmoji(todo.type)} | ${todo.title} | ${todo.priority} | ${todo.category} | TBD | ${now} |\n`
        }

        const updatedContent = content + '\n' + newSection
        await fs.writeFile(this.todoFile, updatedContent, 'utf8')
    }

    getTypeEmoji(type) {
        const emojis = {
            improvement: '🔧',
            feature: '✨',
            bug: '🐛',
            test: '🧪',
            documentation: '📚'
        }
        return emojis[type] || '📝'
    }

    async checkVersionProgress() {
        const versionProgress = await this.calculateVersionProgress()

        if (versionProgress.progress >= 100) {
            console.log('🎉 목표 버전에 도달했습니다!')

            // 릴리스 알림 생성
            const releaseNotification = {
                version: versionProgress.current,
                timestamp: new Date().toISOString(),
                message: '목표 버전 달성! 릴리스 준비를 시작하세요.'
            }

            await fs.writeFile('notifications/release-ready.json', JSON.stringify(releaseNotification, null, 2), 'utf8')
        } else {
            console.log(`📈 버전 진행률: ${versionProgress.progress}% (${versionProgress.current} → ${versionProgress.target})`)
        }
    }
}

// 스크립트 실행
if (require.main === module) {
    const tracker = new AutoProgressTracker()
    tracker.run().catch(console.error)
}

module.exports = AutoProgressTracker

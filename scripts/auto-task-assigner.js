#!/usr/bin/env node

/**
 * 자동 작업 할당기
 * 
 * 이 스크립트는 다음을 자동으로 수행합니다:
 * 1. TODO 분석 및 우선순위 계산
 * 2. 개발자 스킬 및 워크로드 분석
 * 3. 최적의 담당자 할당
 * 4. 작업 분배 및 알림
 */

const fs = require('fs').promises
const path = require('path')

class AutoTaskAssigner {
    constructor() {
        this.todoFile = 'docs/todo-backlog.md'
        this.developers = [
            {
                id: 'dev1',
                name: 'Frontend Developer',
                skills: ['react', 'typescript', 'ui', 'ux', 'frontend'],
                workload: 0,
                maxWorkload: 10,
                preferences: ['ui', 'ux', 'frontend']
            },
            {
                id: 'dev2',
                name: 'Backend Developer',
                skills: ['nodejs', 'express', 'database', 'api', 'backend'],
                workload: 0,
                maxWorkload: 10,
                preferences: ['api', 'database', 'backend']
            },
            {
                id: 'dev3',
                name: 'Full Stack Developer',
                skills: ['react', 'nodejs', 'typescript', 'database', 'api', 'testing'],
                workload: 0,
                maxWorkload: 12,
                preferences: ['testing', 'integration', 'devops']
            },
            {
                id: 'dev4',
                name: 'DevOps Engineer',
                skills: ['docker', 'ci-cd', 'monitoring', 'deployment', 'infrastructure'],
                workload: 0,
                maxWorkload: 8,
                preferences: ['deployment', 'monitoring', 'infrastructure']
            }
        ]

        this.skillMapping = {
            'frontend': ['react', 'typescript', 'ui', 'ux', 'frontend'],
            'backend': ['nodejs', 'express', 'database', 'api', 'backend'],
            'testing': ['testing', 'jest', 'playwright', 'e2e'],
            'performance': ['performance', 'optimization', 'monitoring'],
            'security': ['security', 'authentication', 'authorization'],
            'devops': ['docker', 'ci-cd', 'deployment', 'monitoring'],
            'ui': ['ui', 'ux', 'frontend', 'react'],
            'ux': ['ux', 'ui', 'frontend', 'design'],
            'api': ['api', 'backend', 'nodejs', 'express'],
            'database': ['database', 'sql', 'backend', 'nodejs'],
            'javascript': ['javascript', 'typescript', 'nodejs', 'react'],
            'http': ['api', 'backend', 'http', 'express'],
            'code-quality': ['typescript', 'javascript', 'testing', 'refactoring'],
            'maintenance': ['refactoring', 'cleanup', 'documentation'],
            'git': ['git', 'version-control', 'collaboration'],
            'error': ['debugging', 'error-handling', 'backend', 'frontend']
        }
    }

    async run() {
        console.log('🎯 자동 작업 할당기 시작...')

        try {
            // 1. TODO 목록 읽기
            const todos = await this.parseTodos()
            console.log(`📋 분석할 TODO: ${todos.length}개`)

            // 2. 할당 가능한 TODO 필터링
            const assignableTodos = todos.filter(todo =>
                todo.status === '⬜' &&
                !todo.assignee &&
                todo.priority >= 2
            )
            console.log(`✅ 할당 가능한 TODO: ${assignableTodos.length}개`)

            // 3. 개발자 워크로드 분석
            await this.analyzeWorkload()

            // 4. TODO 할당
            const assignments = await this.assignTasks(assignableTodos)
            console.log(`🎯 할당된 작업: ${assignments.length}개`)

            // 5. 할당 결과 업데이트
            await this.updateAssignments(assignments)

            // 6. 알림 생성
            await this.generateNotifications(assignments)

            console.log('✅ 작업 할당이 완료되었습니다.')

        } catch (error) {
            console.error('❌ 오류 발생:', error.message)
            process.exit(1)
        }
    }

    async parseTodos() {
        const content = await fs.readFile(this.todoFile, 'utf8')
        const todos = []

        // 마크다운 테이블 파싱
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
                        category: this.extractCategory(cells[2]),
                        priority: this.extractPriority(cells[2]),
                        assignee: null,
                        estimatedHours: this.estimateHours(cells[2])
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

    extractCategory(title) {
        const titleLower = title.toLowerCase()

        for (const [category, keywords] of Object.entries(this.skillMapping)) {
            if (keywords.some(keyword => titleLower.includes(keyword))) {
                return category
            }
        }

        return 'general'
    }

    extractPriority(title) {
        if (title.includes('Critical') || title.includes('P0')) return 4
        if (title.includes('High') || title.includes('P1')) return 3
        if (title.includes('Medium') || title.includes('P2')) return 2
        if (title.includes('Low') || title.includes('P3')) return 1
        return 2 // 기본값
    }

    estimateHours(title) {
        const titleLower = title.toLowerCase()

        if (titleLower.includes('bug') || titleLower.includes('fix')) {
            return 2
        } else if (titleLower.includes('feature') || titleLower.includes('implement')) {
            return 8
        } else if (titleLower.includes('test') || titleLower.includes('testing')) {
            return 4
        } else if (titleLower.includes('optimize') || titleLower.includes('performance')) {
            return 6
        } else if (titleLower.includes('documentation') || titleLower.includes('docs')) {
            return 3
        }

        return 4 // 기본값
    }

    async analyzeWorkload() {
        // 현재 진행 중인 작업 분석
        const todos = await this.parseTodos()

        for (const developer of this.developers) {
            developer.workload = 0

            // 해당 개발자에게 할당된 작업들의 예상 시간 합계
            const assignedTodos = todos.filter(todo =>
                todo.assignee === developer.id &&
                (todo.status === '🔄' || todo.status === 'In Progress')
            )

            developer.workload = assignedTodos.reduce((sum, todo) => sum + todo.estimatedHours, 0)
        }
    }

    async assignTasks(todos) {
        const assignments = []

        // 우선순위 순으로 정렬
        const sortedTodos = todos.sort((a, b) => b.priority - a.priority)

        for (const todo of sortedTodos) {
            const bestDeveloper = this.findBestDeveloper(todo)

            if (bestDeveloper) {
                assignments.push({
                    todo,
                    developer: bestDeveloper,
                    score: this.calculateAssignmentScore(todo, bestDeveloper)
                })

                // 워크로드 업데이트
                bestDeveloper.workload += todo.estimatedHours
            }
        }

        return assignments
    }

    findBestDeveloper(todo) {
        const availableDevelopers = this.developers.filter(dev =>
            dev.workload + todo.estimatedHours <= dev.maxWorkload
        )

        if (availableDevelopers.length === 0) {
            return null
        }

        // 스킬 매칭 점수 계산
        let bestDeveloper = null
        let bestScore = 0

        for (const developer of availableDevelopers) {
            const score = this.calculateAssignmentScore(todo, developer)

            if (score > bestScore) {
                bestScore = score
                bestDeveloper = developer
            }
        }

        return bestDeveloper
    }

    calculateAssignmentScore(todo, developer) {
        let score = 0

        // 스킬 매칭 점수 (40%)
        const requiredSkills = this.skillMapping[todo.category] || []
        const skillMatch = requiredSkills.filter(skill =>
            developer.skills.includes(skill)
        ).length / requiredSkills.length
        score += skillMatch * 40

        // 선호도 점수 (30%)
        const preferenceMatch = developer.preferences.includes(todo.category) ? 1 : 0
        score += preferenceMatch * 30

        // 워크로드 균형 점수 (20%)
        const workloadRatio = developer.workload / developer.maxWorkload
        const workloadScore = 1 - workloadRatio
        score += workloadScore * 20

        // 우선순위 가중치 (10%)
        const priorityWeight = todo.priority / 4
        score += priorityWeight * 10

        return score
    }

    async updateAssignments(assignments) {
        let content = await fs.readFile(this.todoFile, 'utf8')

        for (const assignment of assignments) {
            const { todo, developer } = assignment

            // TODO 파일에서 해당 라인 찾아서 업데이트
            const lines = content.split('\n')

            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes(todo.step) && lines[i].includes(todo.title)) {
                    // 담당자 정보 추가
                    lines[i] = lines[i].replace('TBD', developer.name)
                    break
                }
            }

            content = lines.join('\n')
        }

        await fs.writeFile(this.todoFile, content, 'utf8')
    }

    async generateNotifications(assignments) {
        const notifications = []

        for (const assignment of assignments) {
            const { todo, developer } = assignment

            notifications.push({
                developer: developer.name,
                todo: todo.title,
                priority: todo.priority,
                estimatedHours: todo.estimatedHours,
                deadline: this.calculateDeadline(todo.priority, todo.estimatedHours)
            })
        }

        // 알림 파일 생성
        const notificationContent = this.formatNotifications(notifications)
        await fs.writeFile('notifications/assignments.md', notificationContent, 'utf8')

        console.log('📧 할당 알림이 생성되었습니다.')
    }

    calculateDeadline(priority, estimatedHours) {
        const now = new Date()
        const hoursPerDay = 8
        const daysNeeded = Math.ceil(estimatedHours / hoursPerDay)

        // 우선순위에 따른 데드라인 조정
        const priorityMultiplier = {
            4: 1,    // Critical: 1일
            3: 2,    // High: 2일
            2: 5,    // Medium: 5일
            1: 10    // Low: 10일
        }

        const maxDays = priorityMultiplier[priority] || 5
        const actualDays = Math.min(daysNeeded, maxDays)

        const deadline = new Date(now.getTime() + actualDays * 24 * 60 * 60 * 1000)
        return deadline.toISOString().split('T')[0]
    }

    formatNotifications(notifications) {
        const now = new Date().toISOString().split('T')[0]
        let content = `# 작업 할당 알림 (${now})\n\n`

        // 개발자별로 그룹화
        const grouped = {}
        for (const notification of notifications) {
            if (!grouped[notification.developer]) {
                grouped[notification.developer] = []
            }
            grouped[notification.developer].push(notification)
        }

        for (const [developer, tasks] of Object.entries(grouped)) {
            content += `## 👨‍💻 ${developer}\n\n`

            for (const task of tasks) {
                const priorityEmoji = this.getPriorityEmoji(task.priority)
                content += `- ${priorityEmoji} **${task.todo}**\n`
                content += `  - 예상 시간: ${task.estimatedHours}시간\n`
                content += `  - 마감일: ${task.deadline}\n\n`
            }
        }

        return content
    }

    getPriorityEmoji(priority) {
        const emojis = {
            4: '🚨',
            3: '🔥',
            2: '⚡',
            1: '📋'
        }
        return emojis[priority] || '📋'
    }
}

// 스크립트 실행
if (require.main === module) {
    const assigner = new AutoTaskAssigner()
    assigner.run().catch(console.error)
}

module.exports = AutoTaskAssigner

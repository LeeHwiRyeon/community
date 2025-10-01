#!/usr/bin/env node

/**
 * 매니저 입력 기반 자동 Task 생성 시스템
 * 
 * 이 시스템은 다음을 수행합니다:
 * 1. 매니저로부터 자연어 입력 받기
 * 2. 입력 분석 및 의도 파악
 * 3. 자동 Task 생성 및 우선순위 설정
 * 4. TODO 백로그 업데이트
 * 5. 작업 할당 및 스케줄링
 */

const fs = require('fs').promises
const path = require('path')
const readline = require('readline')
const { exec } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)

class ManagerInputTaskGenerator {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        })
        this.todoBacklog = 'docs/todo-backlog.md'
        this.workHistory = 'docs/work-history.md'
        this.taskCounter = 1
        this.categories = {
            'bug': '버그 수정',
            'feature': '기능 개발',
            'improvement': '개선 작업',
            'refactor': '리팩토링',
            'test': '테스트',
            'documentation': '문서화',
            'performance': '성능 최적화',
            'security': '보안',
            'deployment': '배포',
            'maintenance': '유지보수'
        }
        this.priorities = {
            'urgent': { level: 1, label: '긴급', color: '🔴' },
            'high': { level: 2, label: '높음', color: '🟠' },
            'medium': { level: 3, label: '보통', color: '🟡' },
            'low': { level: 4, label: '낮음', color: '🟢' }
        }
    }

    async start() {
        console.log('🎯 매니저 입력 기반 자동 Task 생성 시스템')
        console.log('==========================================')
        console.log('')
        console.log('💡 사용법:')
        console.log('  - 자연어로 작업 요청을 입력하세요')
        console.log('  - 예: "로그인 버그 수정해줘"')
        console.log('  - 예: "새로운 사용자 관리 기능 추가"')
        console.log('  - 예: "성능 최적화 필요해"')
        console.log('  - 종료하려면 "exit" 또는 "quit" 입력')
        console.log('')

        await this.loadExistingTasks()
        await this.interactiveMode()
    }

    async loadExistingTasks() {
        try {
            const content = await fs.readFile(this.todoBacklog, 'utf8')
            const taskMatches = content.match(/AUTO-\d+/g)
            if (taskMatches) {
                this.taskCounter = Math.max(...taskMatches.map(match =>
                    parseInt(match.replace('AUTO-', ''))
                )) + 1
            }
        } catch (error) {
            console.log('📝 새로운 TODO 백로그 파일을 생성합니다.')
        }
    }

    async interactiveMode() {
        while (true) {
            try {
                const input = await this.question('\n🔍 작업 요청을 입력하세요: ')

                if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
                    console.log('\n👋 시스템을 종료합니다.')
                    break
                }

                if (input.trim() === '') {
                    console.log('❌ 입력이 비어있습니다. 다시 입력해주세요.')
                    continue
                }

                // 입력 분석 및 Task 생성
                const task = await this.analyzeInputAndCreateTask(input)

                if (task) {
                    await this.saveTask(task)
                    await this.displayTaskSummary(task)
                }

            } catch (error) {
                console.error('❌ 오류 발생:', error.message)
            }
        }

        this.rl.close()
    }

    async analyzeInputAndCreateTask(input) {
        console.log('\n🔍 입력 분석 중...')

        // 1. 카테고리 분석
        const category = this.analyzeCategory(input)

        // 2. 우선순위 분석
        const priority = this.analyzePriority(input)

        // 3. 예상 작업 시간 추정
        const estimatedHours = this.estimateWorkHours(input, category)

        // 4. 의존성 분석
        const dependencies = await this.analyzeDependencies(input)

        // 5. Task 생성
        const task = {
            id: `AUTO-${this.taskCounter++}`,
            title: this.generateTaskTitle(input, category),
            description: this.generateTaskDescription(input, category),
            category: category,
            priority: priority,
            estimatedHours: estimatedHours,
            dependencies: dependencies,
            status: 'pending',
            createdAt: new Date().toISOString(),
            assignedTo: 'TBD',
            tags: this.extractTags(input),
            originalInput: input
        }

        return task
    }

    analyzeCategory(input) {
        const lowerInput = input.toLowerCase()

        // 버그 관련 키워드
        if (lowerInput.includes('버그') || lowerInput.includes('오류') || lowerInput.includes('에러') ||
            lowerInput.includes('문제') || lowerInput.includes('수정') || lowerInput.includes('fix')) {
            return 'bug'
        }

        // 기능 개발 키워드
        if (lowerInput.includes('기능') || lowerInput.includes('추가') || lowerInput.includes('개발') ||
            lowerInput.includes('구현') || lowerInput.includes('만들') || lowerInput.includes('create')) {
            return 'feature'
        }

        // 개선 키워드
        if (lowerInput.includes('개선') || lowerInput.includes('향상') || lowerInput.includes('최적화') ||
            lowerInput.includes('성능') || lowerInput.includes('빠르게') || lowerInput.includes('optimize')) {
            return 'improvement'
        }

        // 리팩토링 키워드
        if (lowerInput.includes('리팩토링') || lowerInput.includes('정리') || lowerInput.includes('코드 정리') ||
            lowerInput.includes('refactor') || lowerInput.includes('cleanup')) {
            return 'refactor'
        }

        // 테스트 키워드
        if (lowerInput.includes('테스트') || lowerInput.includes('검증') || lowerInput.includes('test')) {
            return 'test'
        }

        // 문서화 키워드
        if (lowerInput.includes('문서') || lowerInput.includes('가이드') || lowerInput.includes('설명') ||
            lowerInput.includes('documentation') || lowerInput.includes('guide')) {
            return 'documentation'
        }

        // 보안 키워드
        if (lowerInput.includes('보안') || lowerInput.includes('보호') || lowerInput.includes('security')) {
            return 'security'
        }

        // 배포 키워드
        if (lowerInput.includes('배포') || lowerInput.includes('deploy') || lowerInput.includes('릴리즈')) {
            return 'deployment'
        }

        // 기본값
        return 'maintenance'
    }

    analyzePriority(input) {
        const lowerInput = input.toLowerCase()

        // 긴급 키워드
        if (lowerInput.includes('긴급') || lowerInput.includes('즉시') || lowerInput.includes('asap') ||
            lowerInput.includes('urgent') || lowerInput.includes('critical') || lowerInput.includes('중요')) {
            return 'urgent'
        }

        // 높은 우선순위 키워드
        if (lowerInput.includes('높음') || lowerInput.includes('중요') || lowerInput.includes('high') ||
            lowerInput.includes('빠르게') || lowerInput.includes('우선')) {
            return 'high'
        }

        // 낮은 우선순위 키워드
        if (lowerInput.includes('낮음') || lowerInput.includes('나중에') || lowerInput.includes('low') ||
            lowerInput.includes('여유') || lowerInput.includes('선택')) {
            return 'low'
        }

        // 기본값
        return 'medium'
    }

    estimateWorkHours(input, category) {
        const lowerInput = input.toLowerCase()

        // 간단한 작업
        if (lowerInput.includes('간단') || lowerInput.includes('quick') || lowerInput.includes('작은') ||
            lowerInput.includes('minor') || lowerInput.includes('small')) {
            return 1
        }

        // 복잡한 작업
        if (lowerInput.includes('복잡') || lowerInput.includes('복잡한') || lowerInput.includes('complex') ||
            lowerInput.includes('큰') || lowerInput.includes('major') || lowerInput.includes('대규모')) {
            return 8
        }

        // 카테고리별 기본 시간
        const categoryHours = {
            'bug': 2,
            'feature': 4,
            'improvement': 3,
            'refactor': 6,
            'test': 2,
            'documentation': 1,
            'performance': 4,
            'security': 3,
            'deployment': 2,
            'maintenance': 2
        }

        return categoryHours[category] || 3
    }

    async analyzeDependencies(input) {
        const dependencies = []

        // Git 히스토리에서 관련 커밋 찾기
        try {
            const { stdout } = await execAsync('git log --oneline --since="7 days ago"')
            const commits = stdout.split('\n').filter(line => line.trim())

            for (const commit of commits) {
                if (this.isRelatedCommit(input, commit)) {
                    dependencies.push({
                        type: 'commit',
                        reference: commit,
                        description: '관련 커밋'
                    })
                }
            }
        } catch (error) {
            // Git 히스토리 분석 실패 시 무시
        }

        return dependencies
    }

    isRelatedCommit(input, commit) {
        const inputWords = input.toLowerCase().split(/\s+/)
        const commitWords = commit.toLowerCase().split(/\s+/)

        // 공통 단어가 2개 이상 있으면 관련성 있음
        const commonWords = inputWords.filter(word =>
            commitWords.includes(word) && word.length > 2
        )

        return commonWords.length >= 2
    }

    generateTaskTitle(input, category) {
        const categoryLabel = this.categories[category]

        // 입력에서 핵심 키워드 추출
        const keywords = this.extractKeywords(input)

        if (keywords.length > 0) {
            return `${categoryLabel}: ${keywords.join(' ')}`
        }

        return `${categoryLabel}: ${input.substring(0, 50)}${input.length > 50 ? '...' : ''}`
    }

    generateTaskDescription(input, category) {
        const categoryLabel = this.categories[category]

        return `**자동 생성된 작업**
        
**원본 입력**: ${input}
**카테고리**: ${categoryLabel}
**생성 시간**: ${new Date().toLocaleString('ko-KR')}

**작업 내용**:
- ${this.generateWorkSteps(input, category).join('\n- ')}

**참고사항**:
- 자동 생성된 작업이므로 필요시 수정하세요
- 의존성 관계를 확인하고 순서를 조정하세요
- 예상 시간은 참고용이며 실제 작업에 따라 달라질 수 있습니다`
    }

    generateWorkSteps(input, category) {
        const steps = []

        switch (category) {
            case 'bug':
                steps.push('버그 재현 환경 구축')
                steps.push('원인 분석 및 로그 확인')
                steps.push('수정 코드 작성')
                steps.push('테스트 케이스 작성')
                steps.push('수정 사항 검증')
                break

            case 'feature':
                steps.push('요구사항 분석 및 설계')
                steps.push('기능 구현')
                steps.push('단위 테스트 작성')
                steps.push('통합 테스트')
                steps.push('문서화')
                break

            case 'improvement':
                steps.push('현재 상태 분석')
                steps.push('개선 방안 설계')
                steps.push('개선 코드 구현')
                steps.push('성능 측정 및 검증')
                steps.push('문서 업데이트')
                break

            default:
                steps.push('작업 계획 수립')
                steps.push('구현')
                steps.push('테스트')
                steps.push('검증')
                steps.push('완료')
        }

        return steps
    }

    extractKeywords(input) {
        // 불용어 제거
        const stopWords = ['을', '를', '이', '가', '에', '에서', '로', '으로', '의', '와', '과', '도', '는', '은', '해줘', '해주세요', '해', '해라', '해봐', '해보세요']

        return input
            .split(/\s+/)
            .filter(word => word.length > 1 && !stopWords.includes(word))
            .slice(0, 5) // 최대 5개 키워드
    }

    extractTags(input) {
        const tags = []
        const lowerInput = input.toLowerCase()

        // 기술 스택 태그
        const techStack = ['react', 'node', 'javascript', 'typescript', 'css', 'html', 'api', 'database', 'git']
        techStack.forEach(tech => {
            if (lowerInput.includes(tech)) {
                tags.push(tech)
            }
        })

        // 기능 태그
        const features = ['login', 'auth', 'user', 'admin', 'ui', 'ux', 'mobile', 'responsive', 'performance']
        features.forEach(feature => {
            if (lowerInput.includes(feature)) {
                tags.push(feature)
            }
        })

        return tags
    }

    async saveTask(task) {
        console.log('\n💾 Task 저장 중...')

        // TODO 백로그에 추가
        await this.updateTodoBacklog(task)

        // 작업 히스토리에 추가
        await this.updateWorkHistory(task)

        console.log('✅ Task가 성공적으로 저장되었습니다.')
    }

    async updateTodoBacklog(task) {
        const now = new Date().toISOString().split('T')[0]
        const priorityInfo = this.priorities[task.priority]

        let content = ''
        try {
            content = await fs.readFile(this.todoBacklog, 'utf8')
        } catch (error) {
            content = '# TODO Backlog\n\n'
        }

        const newTaskEntry = `| ${task.id} | ⬜ | ${task.title} | ${priorityInfo.color} ${priorityInfo.label} | ${this.categories[task.category]} | ${task.assignedTo} | ${task.estimatedHours}h | ${now} |\n`

        // 테이블 헤더가 없으면 추가
        if (!content.includes('| ID | Status | Title | Priority | Category | Assignee | Hours | Date |')) {
            content += '\n| ID | Status | Title | Priority | Category | Assignee | Hours | Date |\n'
            content += '|----|--------|-------|----------|----------|----------|-------|------|\n'
        }

        content += newTaskEntry

        await fs.writeFile(this.todoBacklog, content, 'utf8')
    }

    async updateWorkHistory(task) {
        const historyEntry = {
            timestamp: task.createdAt,
            type: 'task_created',
            taskId: task.id,
            title: task.title,
            category: task.category,
            priority: task.priority,
            originalInput: task.originalInput
        }

        let history = []
        try {
            const content = await fs.readFile(this.workHistory, 'utf8')
            history = JSON.parse(content)
        } catch (error) {
            history = []
        }

        history.push(historyEntry)

        await fs.writeFile(this.workHistory, JSON.stringify(history, null, 2), 'utf8')
    }

    async displayTaskSummary(task) {
        const priorityInfo = this.priorities[task.priority]

        console.log('\n📋 생성된 Task 요약')
        console.log('==================')
        console.log(`🆔 ID: ${task.id}`)
        console.log(`📝 제목: ${task.title}`)
        console.log(`🏷️  카테고리: ${this.categories[task.category]}`)
        console.log(`⚡ 우선순위: ${priorityInfo.color} ${priorityInfo.label}`)
        console.log(`⏱️  예상 시간: ${task.estimatedHours}시간`)
        console.log(`👤 담당자: ${task.assignedTo}`)
        console.log(`🏷️  태그: ${task.tags.join(', ') || '없음'}`)
        console.log(`📅 생성일: ${new Date(task.createdAt).toLocaleString('ko-KR')}`)

        if (task.dependencies.length > 0) {
            console.log(`🔗 의존성: ${task.dependencies.length}개 발견`)
        }

        console.log('\n📄 상세 설명:')
        console.log(task.description)
    }

    question(prompt) {
        return new Promise((resolve) => {
            this.rl.question(prompt, resolve)
        })
    }
}

// CLI 실행
if (require.main === module) {
    const generator = new ManagerInputTaskGenerator()
    generator.start().catch(console.error)
}

module.exports = ManagerInputTaskGenerator

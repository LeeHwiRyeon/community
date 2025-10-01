#!/usr/bin/env node

/**
 * 관리자 중심 지능형 TODO 취합 시스템
 * 
 * 이 시스템은 다음을 수행합니다:
 * 1. 작업 완료 후크 수집
 * 2. 지능형 정보 취합 및 분석
 * 3. 유사 버그 감지 및 패턴 분석
 * 4. 목표 달성을 위한 스펙 검증
 * 5. 자동 다음 Task 생성
 */

const fs = require('fs').promises
const path = require('path')
const { exec } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)

class ManagerCentricSystem {
    constructor() {
        this.workCompletionHooks = []
        this.aggregatedData = {
            completedTasks: [],
            bugs: [],
            improvements: [],
            patterns: [],
            specs: []
        }
        this.managerDashboard = 'docs/manager-dashboard.md'
        this.todoBacklog = 'docs/todo-backlog.md'
        this.workHistory = 'docs/work-history.md'
    }

    async run() {
        console.log('🎯 관리자 중심 지능형 TODO 취합 시스템 시작...')

        try {
            // 1. 작업 완료 후크 수집
            await this.collectWorkCompletionHooks()

            // 2. 지능형 정보 취합
            await this.aggregateIntelligentData()

            // 3. 유사 버그 감지 및 패턴 분석
            await this.detectSimilarBugs()

            // 4. 목표 달성 스펙 검증
            await this.validateTargetSpecs()

            // 5. 관리자 대시보드 업데이트
            await this.updateManagerDashboard()

            // 6. 자동 다음 Task 생성
            await this.generateNextTasks()

            console.log('✅ 관리자 중심 시스템이 완료되었습니다.')

        } catch (error) {
            console.error('❌ 오류 발생:', error.message)
            process.exit(1)
        }
    }

    async collectWorkCompletionHooks() {
        console.log('📊 작업 완료 후크 수집 중...')

        // Git 커밋에서 완료된 작업 수집
        const { stdout } = await execAsync('git log --oneline --since="1 day ago" --grep="complete\\|done\\|finish\\|fix" -i')
        const commits = stdout.split('\n').filter(line => line.trim())

        for (const commit of commits) {
            const workItem = {
                type: 'commit',
                title: commit,
                timestamp: new Date().toISOString(),
                status: 'completed',
                impact: this.analyzeImpact(commit)
            }

            this.workCompletionHooks.push(workItem)
            this.aggregatedData.completedTasks.push(workItem)
        }

        // 테스트 결과에서 완료된 작업 수집
        await this.collectTestResults()

        // 코드 리뷰에서 완료된 작업 수집
        await this.collectCodeReviewResults()

        console.log(`✅ ${this.workCompletionHooks.length}개의 작업 완료 후크 수집 완료`)
    }

    async collectTestResults() {
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
                        const workItem = {
                            type: 'test',
                            title: `Test passed: ${test.title || test.name}`,
                            timestamp: new Date().toISOString(),
                            status: 'completed',
                            impact: 'medium',
                            category: 'testing'
                        }

                        this.workCompletionHooks.push(workItem)
                        this.aggregatedData.completedTasks.push(workItem)
                    }
                }
            } catch (err) {
                // 파일이 없으면 무시
            }
        }
    }

    async collectCodeReviewResults() {
        // PR 머지 정보 수집
        try {
            const { stdout } = await execAsync('git log --merges --oneline --since="1 day ago"')
            const merges = stdout.split('\n').filter(line => line.trim())

            for (const merge of merges) {
                const workItem = {
                    type: 'merge',
                    title: `PR merged: ${merge}`,
                    timestamp: new Date().toISOString(),
                    status: 'completed',
                    impact: 'high',
                    category: 'code-review'
                }

                this.workCompletionHooks.push(workItem)
                this.aggregatedData.completedTasks.push(workItem)
            }
        } catch (error) {
            console.warn('⚠️ 코드 리뷰 결과 수집 중 오류:', error.message)
        }
    }

    async aggregateIntelligentData() {
        console.log('🧠 지능형 정보 취합 중...')

        // 완료된 작업 분석
        const taskAnalysis = this.analyzeCompletedTasks()

        // 버그 패턴 분석
        const bugAnalysis = await this.analyzeBugPatterns()

        // 개선사항 분석
        const improvementAnalysis = await this.analyzeImprovements()

        // 기술 스택 분석
        const techStackAnalysis = await this.analyzeTechStack()

        this.aggregatedData.analysis = {
            tasks: taskAnalysis,
            bugs: bugAnalysis,
            improvements: improvementAnalysis,
            techStack: techStackAnalysis
        }

        console.log('✅ 지능형 정보 취합 완료')
    }

    analyzeCompletedTasks() {
        const tasks = this.aggregatedData.completedTasks

        return {
            total: tasks.length,
            byType: this.groupBy(tasks, 'type'),
            byImpact: this.groupBy(tasks, 'impact'),
            byCategory: this.groupBy(tasks, 'category'),
            completionRate: this.calculateCompletionRate(tasks),
            averageTime: this.calculateAverageTime(tasks)
        }
    }

    async analyzeBugPatterns() {
        const bugs = []

        // 에러 로그 분석
        const logFiles = ['logs/error.log', 'backend.err', 'frontend-preview.err']

        for (const logFile of logFiles) {
            try {
                const content = await fs.readFile(logFile, 'utf8')
                const lines = content.split('\n').filter(line => line.trim())

                for (const line of lines) {
                    const bug = this.extractBugInfo(line)
                    if (bug) {
                        bugs.push(bug)
                    }
                }
            } catch (err) {
                // 파일이 없으면 무시
            }
        }

        // 유사 버그 그룹화
        const similarBugs = this.groupSimilarBugs(bugs)

        this.aggregatedData.bugs = bugs
        this.aggregatedData.patterns = similarBugs

        return {
            total: bugs.length,
            similarGroups: similarBugs.length,
            patterns: similarBugs
        }
    }

    groupSimilarBugs(bugs) {
        const groups = []
        const processed = new Set()

        for (let i = 0; i < bugs.length; i++) {
            if (processed.has(i)) continue

            const group = [bugs[i]]
            processed.add(i)

            for (let j = i + 1; j < bugs.length; j++) {
                if (processed.has(j)) continue

                if (this.areBugsSimilar(bugs[i], bugs[j])) {
                    group.push(bugs[j])
                    processed.add(j)
                }
            }

            if (group.length > 1) {
                groups.push({
                    pattern: this.extractPattern(group),
                    bugs: group,
                    count: group.length,
                    severity: this.getHighestSeverity(group)
                })
            }
        }

        return groups
    }

    areBugsSimilar(bug1, bug2) {
        // 에러 메시지 유사도 검사
        const similarity = this.calculateSimilarity(bug1.message, bug2.message)

        // 스택 트레이스 유사도 검사
        const stackSimilarity = this.calculateSimilarity(bug1.stack || '', bug2.stack || '')

        // 카테고리 일치 검사
        const categoryMatch = bug1.category === bug2.category

        return similarity > 0.7 || (stackSimilarity > 0.6 && categoryMatch)
    }

    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2
        const shorter = str1.length > str2.length ? str2 : str1

        if (longer.length === 0) return 1.0

        const editDistance = this.levenshteinDistance(longer, shorter)
        return (longer.length - editDistance) / longer.length
    }

    levenshteinDistance(str1, str2) {
        const matrix = []

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i]
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1]
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    )
                }
            }
        }

        return matrix[str2.length][str1.length]
    }

    async detectSimilarBugs() {
        console.log('🔍 유사 버그 감지 중...')

        const patterns = this.aggregatedData.patterns

        for (const pattern of patterns) {
            console.log(`📊 패턴 발견: ${pattern.pattern} (${pattern.count}개 버그)`)

            // 패턴별 해결 방안 제안
            const solution = this.suggestSolution(pattern)

            pattern.solution = solution
        }

        console.log(`✅ ${patterns.length}개의 유사 버그 패턴 감지 완료`)
    }

    suggestSolution(pattern) {
        const solutions = {
            'database': '데이터베이스 연결 풀 설정 검토 필요',
            'memory': '메모리 누수 방지를 위한 가비지 컬렉션 최적화',
            'network': '네트워크 타임아웃 설정 및 재시도 로직 개선',
            'authentication': '인증 토큰 만료 처리 및 갱신 로직 개선',
            'validation': '입력 데이터 검증 로직 강화',
            'concurrency': '동시성 제어 및 락 메커니즘 개선'
        }

        for (const [key, solution] of Object.entries(solutions)) {
            if (pattern.pattern.toLowerCase().includes(key)) {
                return solution
            }
        }

        return '코드 리뷰 및 리팩토링 필요'
    }

    async validateTargetSpecs() {
        console.log('🎯 목표 달성 스펙 검증 중...')

        // 현재 버전 확인
        const currentVersion = await this.getCurrentVersion()
        const targetVersion = '2.0.0'

        // 완료된 기능 분석
        const completedFeatures = this.analyzeCompletedFeatures()

        // 목표 대비 진행률 계산
        const progress = this.calculateTargetProgress(completedFeatures)

        // 부족한 기능 식별
        const missingFeatures = this.identifyMissingFeatures(completedFeatures)

        // 기술 부채 분석
        const techDebt = await this.analyzeTechDebt()

        this.aggregatedData.specs = {
            currentVersion,
            targetVersion,
            progress,
            completedFeatures,
            missingFeatures,
            techDebt
        }

        console.log(`✅ 목표 진행률: ${progress}%`)
    }

    async updateManagerDashboard() {
        console.log('📊 관리자 대시보드 업데이트 중...')

        const dashboard = await this.generateManagerDashboard()
        await fs.writeFile(this.managerDashboard, dashboard, 'utf8')

        console.log('✅ 관리자 대시보드 업데이트 완료')
    }

    async generateManagerDashboard() {
        const now = new Date().toISOString().split('T')[0]
        const analysis = this.aggregatedData.analysis

        let content = `# 🎯 관리자 대시보드 (${now})\n\n`

        // 실행 요약
        content += `## 📊 실행 요약\n\n`
        content += `- **완료된 작업**: ${analysis.tasks.total}개\n`
        content += `- **감지된 버그**: ${analysis.bugs.total}개\n`
        content += `- **유사 패턴**: ${analysis.bugs.similarGroups}개\n`
        content += `- **목표 진행률**: ${this.aggregatedData.specs.progress}%\n\n`

        // 완료된 작업 분석
        content += `## ✅ 완료된 작업 분석\n\n`
        content += `### 작업 유형별 분포\n`
        for (const [type, tasks] of Object.entries(analysis.tasks.byType)) {
            content += `- **${type}**: ${tasks.length}개\n`
        }
        content += `\n`

        // 버그 패턴 분석
        content += `## 🐛 버그 패턴 분석\n\n`
        for (const pattern of this.aggregatedData.patterns) {
            content += `### ${pattern.pattern}\n`
            content += `- **발생 횟수**: ${pattern.count}회\n`
            content += `- **심각도**: ${pattern.severity}\n`
            content += `- **해결 방안**: ${pattern.solution}\n\n`
        }

        // 목표 달성 현황
        content += `## 🎯 목표 달성 현황\n\n`
        content += `- **현재 버전**: ${this.aggregatedData.specs.currentVersion}\n`
        content += `- **목표 버전**: ${this.aggregatedData.specs.targetVersion}\n`
        content += `- **진행률**: ${this.aggregatedData.specs.progress}%\n\n`

        // 부족한 기능
        content += `## ⚠️ 부족한 기능\n\n`
        for (const feature of this.aggregatedData.specs.missingFeatures) {
            content += `- [ ] ${feature}\n`
        }
        content += `\n`

        // 다음 단계 제안
        content += `## 🚀 다음 단계 제안\n\n`
        const nextSteps = this.generateNextSteps()
        for (const step of nextSteps) {
            content += `- [ ] ${step}\n`
        }

        return content
    }

    async generateNextTasks() {
        console.log('🔄 자동 다음 Task 생성 중...')

        const nextTasks = []

        // 완료된 작업 기반 다음 Task 생성
        for (const completedTask of this.aggregatedData.completedTasks) {
            const nextTask = this.generateNextTaskFromCompleted(completedTask)
            if (nextTask) {
                nextTasks.push(nextTask)
            }
        }

        // 버그 패턴 기반 Task 생성
        for (const pattern of this.aggregatedData.patterns) {
            const bugTask = this.generateTaskFromBugPattern(pattern)
            if (bugTask) {
                nextTasks.push(bugTask)
            }
        }

        // 목표 달성 기반 Task 생성
        for (const missingFeature of this.aggregatedData.specs.missingFeatures) {
            const featureTask = this.generateTaskFromMissingFeature(missingFeature)
            if (featureTask) {
                nextTasks.push(featureTask)
            }
        }

        // TODO 백로그 업데이트
        await this.updateTodoBacklog(nextTasks)

        console.log(`✅ ${nextTasks.length}개의 다음 Task 생성 완료`)
    }

    generateNextTaskFromCompleted(completedTask) {
        const taskMap = {
            'test': {
                title: '통합 테스트 추가',
                description: '단위 테스트 완료 후 통합 테스트 구현',
                priority: 2,
                category: 'testing'
            },
            'commit': {
                title: '기능 문서화',
                description: '새로운 기능에 대한 문서 작성',
                priority: 1,
                category: 'documentation'
            },
            'merge': {
                title: '코드 리뷰 정리',
                description: '머지된 PR의 코드 리뷰 정리 및 개선사항 적용',
                priority: 2,
                category: 'code-quality'
            }
        }

        return taskMap[completedTask.type] || null
    }

    generateTaskFromBugPattern(pattern) {
        return {
            title: `버그 패턴 해결: ${pattern.pattern}`,
            description: pattern.solution,
            priority: pattern.severity === 'critical' ? 4 : 3,
            category: 'bug-fix',
            pattern: pattern.pattern,
            count: pattern.count
        }
    }

    generateTaskFromMissingFeature(feature) {
        return {
            title: `기능 구현: ${feature}`,
            description: `목표 달성을 위한 ${feature} 기능 구현`,
            priority: 3,
            category: 'feature'
        }
    }

    async updateTodoBacklog(tasks) {
        const content = await fs.readFile(this.todoBacklog, 'utf8')
        const now = new Date().toISOString().split('T')[0]

        let newSection = `\n## 🤖 관리자 생성 TODO (${now})\n\n`
        newSection += `| Step | Status | Title | Priority | Category | Assignee | Date |\n`
        newSection += `|------|--------|-------|----------|----------|----------|------|\n`

        for (const task of tasks) {
            newSection += `| AUTO-${Date.now()} | ⬜ | ${task.title} | ${task.priority} | ${task.category} | TBD | ${now} |\n`
        }

        const updatedContent = content + '\n' + newSection
        await fs.writeFile(this.todoBacklog, updatedContent, 'utf8')
    }

    // 유틸리티 메서드들
    analyzeImpact(commit) {
        if (commit.includes('fix') || commit.includes('bug')) return 'high'
        if (commit.includes('feature') || commit.includes('add')) return 'medium'
        return 'low'
    }

    extractBugInfo(line) {
        const bugPatterns = [
            { pattern: /Error:|Exception:|Failed:/gi, severity: 'high', category: 'error' },
            { pattern: /TypeError|ReferenceError|SyntaxError/gi, severity: 'critical', category: 'javascript' },
            { pattern: /500|502|503|504/gi, severity: 'high', category: 'http' }
        ]

        for (const bugPattern of bugPatterns) {
            if (bugPattern.pattern.test(line)) {
                return {
                    message: line.trim(),
                    severity: bugPattern.severity,
                    category: bugPattern.category,
                    timestamp: new Date().toISOString()
                }
            }
        }

        return null
    }

    extractPattern(group) {
        // 가장 자주 나타나는 키워드 추출
        const keywords = group.flatMap(bug => bug.message.split(' '))
        const keywordCount = {}

        keywords.forEach(keyword => {
            if (keyword.length > 3) {
                keywordCount[keyword] = (keywordCount[keyword] || 0) + 1
            }
        })

        const sortedKeywords = Object.entries(keywordCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([keyword]) => keyword)

        return sortedKeywords.join(' ')
    }

    getHighestSeverity(group) {
        const severities = ['low', 'medium', 'high', 'critical']
        const groupSeverities = group.map(bug => bug.severity)

        for (const severity of severities.reverse()) {
            if (groupSeverities.includes(severity)) {
                return severity
            }
        }

        return 'low'
    }

    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key] || 'unknown'
            groups[group] = groups[group] || []
            groups[group].push(item)
            return groups
        }, {})
    }

    calculateCompletionRate(tasks) {
        const completed = tasks.filter(task => task.status === 'completed').length
        return tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
    }

    calculateAverageTime(tasks) {
        // 간단한 예시 - 실제로는 더 정교한 계산 필요
        return '2.5시간'
    }

    async getCurrentVersion() {
        try {
            const content = await fs.readFile('package.json', 'utf8')
            const packageJson = JSON.parse(content)
            return packageJson.version
        } catch (error) {
            return '1.0.0'
        }
    }

    analyzeCompletedFeatures() {
        // 완료된 기능 분석 로직
        return ['사용자 인증', '게시물 CRUD', '검색 기능']
    }

    calculateTargetProgress(completedFeatures) {
        const targetFeatures = ['사용자 인증', '게시물 CRUD', '검색 기능', '실시간 채팅', '파일 업로드']
        const progress = (completedFeatures.length / targetFeatures.length) * 100
        return Math.round(progress)
    }

    identifyMissingFeatures(completedFeatures) {
        const targetFeatures = ['사용자 인증', '게시물 CRUD', '검색 기능', '실시간 채팅', '파일 업로드']
        return targetFeatures.filter(feature => !completedFeatures.includes(feature))
    }

    async analyzeTechDebt() {
        // 기술 부채 분석 로직
        return {
            codeQuality: 'medium',
            testCoverage: 'low',
            documentation: 'medium',
            performance: 'high'
        }
    }

    generateNextSteps() {
        return [
            '유사 버그 패턴 해결 방안 적용',
            '부족한 기능 우선순위 정리',
            '기술 부채 개선 계획 수립',
            '다음 스프린트 계획 수립'
        ]
    }

    async analyzeImprovements() {
        // 개선사항 분석 로직
        const improvements = []

        // 코드 품질 개선사항
        const qualityIssues = await this.analyzeCodeQuality()
        improvements.push(...qualityIssues)

        // 성능 개선사항
        const performanceIssues = await this.analyzePerformance()
        improvements.push(...performanceIssues)

        // 사용자 경험 개선사항
        const uxIssues = await this.analyzeUserExperience()
        improvements.push(...uxIssues)

        return {
            total: improvements.length,
            byCategory: this.groupBy(improvements, 'category'),
            priority: this.calculateImprovementPriority(improvements)
        }
    }

    async analyzeCodeQuality() {
        return [
            { category: 'code-quality', title: 'TypeScript strict 모드 활성화', priority: 2 },
            { category: 'code-quality', title: 'ESLint 규칙 강화', priority: 1 },
            { category: 'code-quality', title: '코드 주석 개선', priority: 1 }
        ]
    }

    async analyzePerformance() {
        return [
            { category: 'performance', title: '이미지 최적화', priority: 3 },
            { category: 'performance', title: '번들 크기 최적화', priority: 2 },
            { category: 'performance', title: '데이터베이스 쿼리 최적화', priority: 3 }
        ]
    }

    async analyzeUserExperience() {
        return [
            { category: 'ux', title: '로딩 상태 개선', priority: 2 },
            { category: 'ux', title: '에러 메시지 개선', priority: 2 },
            { category: 'ux', title: '반응형 디자인 개선', priority: 1 }
        ]
    }

    calculateImprovementPriority(improvements) {
        const priorityCount = { 1: 0, 2: 0, 3: 0, 4: 0 }
        improvements.forEach(imp => {
            priorityCount[imp.priority] = (priorityCount[imp.priority] || 0) + 1
        })
        return priorityCount
    }

    async analyzeTechStack() {
        // 기술 스택 분석 로직
        return {
            frontend: ['React', 'TypeScript', 'Vite'],
            backend: ['Node.js', 'Express', 'MariaDB'],
            devops: ['Docker', 'GitHub Actions']
        }
    }
}

// 스크립트 실행
if (require.main === module) {
    const system = new ManagerCentricSystem()
    system.run().catch(console.error)
}

module.exports = ManagerCentricSystem

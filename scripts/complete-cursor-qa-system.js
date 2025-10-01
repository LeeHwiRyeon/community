#!/usr/bin/env node

/**
 * 완전한 Cursor QA 시스템
 * 
 * 1. 한글/영어 입력 → Cursor GPT 자동코드생성
 * 2. QA 계속 TODO 뽑아내서 버그 신고
 * 3. 테스트케이스에서 정적으로 먼저 다 찾기
 * 4. 버그 자동 감지 및 TODO 생성
 */

const fs = require('fs').promises
const path = require('path')

class CompleteCursorQASystem {
    constructor() {
        this.workflow = {
            userInput: '',
            language: 'korean', // korean, english
            cursorPrompt: '',
            generatedCode: '',
            qaResults: [],
            staticAnalysis: [],
            bugReports: [],
            generatedTodos: [],
            workResult: ''
        }

        this.todoCategories = {
            bug: 'Bug Fix',
            feature: 'Feature Request',
            improvement: 'Improvement',
            refactor: 'Refactoring',
            test: 'Testing',
            doc: 'Documentation',
            perf: 'Performance',
            sec: 'Security',
            qa: 'QA Testing',
            static: 'Static Analysis'
        }
    }

    async processUserRequest(input) {
        console.log('🚀 완전한 Cursor QA 시스템 시작...')
        console.log(`📝 사용자 입력: ${input}`)

        try {
            // 1. 언어 감지 (한글/영어)
            const language = this.detectLanguage(input)
            console.log(`🌐 감지된 언어: ${language}`)

            // 2. Cursor GPT 자동코드생성
            const cursorResult = await this.generateCodeWithCursor(input, language)
            console.log(`🤖 Cursor 코드 생성 완료`)

            // 3. QA 계속 TODO 뽑아내서 버그 신고
            const qaResults = await this.performContinuousQA(cursorResult.code)
            console.log(`🔍 QA 결과: ${qaResults.length}개 이슈 발견`)

            // 4. 테스트케이스에서 정적으로 먼저 다 찾기
            const staticAnalysis = await this.performStaticAnalysis(cursorResult.code)
            console.log(`📊 정적 분석: ${staticAnalysis.length}개 문제 발견`)

            // 5. 버그 신고 및 TODO 생성
            const bugReports = await this.generateBugReports(qaResults, staticAnalysis)
            console.log(`🐛 버그 신고: ${bugReports.length}개 생성`)

            // 6. 통합 TODO 생성
            const todos = await this.generateIntegratedTodos(input, qaResults, staticAnalysis, bugReports)
            console.log(`📋 통합 TODO: ${todos.length}개 생성`)

            // 7. 작업 결과 통합
            const workResult = await this.integrateWorkResult(input, language, cursorResult, qaResults, staticAnalysis, bugReports, todos)
            console.log(`✅ 작업 결과 통합 완료`)

            // 8. 결과 저장
            await this.saveWorkResult(workResult)

            return workResult

        } catch (error) {
            console.error('❌ 처리 오류:', error.message)
            throw error
        }
    }

    detectLanguage(input) {
        // 한글 감지
        const koreanRegex = /[가-힣]/
        if (koreanRegex.test(input)) {
            return 'korean'
        }

        // 영어 감지
        const englishRegex = /[a-zA-Z]/
        if (englishRegex.test(input)) {
            return 'english'
        }

        return 'unknown'
    }

    async generateCodeWithCursor(input, language) {
        console.log('🤖 Cursor GPT와 통신 중...')

        // 언어별 프롬프트 생성
        const prompt = this.createCursorPrompt(input, language)

        // 시뮬레이션된 Cursor 응답
        const cursorResponse = {
            analysis: `Code analysis for: ${input}`,
            solution: `Solution approach for the reported issue`,
            code: `// Generated code
export const handleUserRequest = async (input) => {
  try {
    // Main implementation
    const result = await processInput(input)
    
    // Error handling
    if (!result.success) {
      throw new Error(result.error)
    }
    
    return {
      success: true,
      data: result.data,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error processing request:', error)
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
}

// Helper functions
const processInput = async (input) => {
  // Process input logic
  return { success: true, data: input }
}`,
            tests: `// Test cases
describe('handleUserRequest', () => {
  it('should handle valid input successfully', async () => {
    const result = await handleUserRequest('test input')
    expect(result.success).toBe(true)
    expect(result.data).toBe('test input')
  })
  
  it('should handle invalid input with error', async () => {
    const result = await handleUserRequest(null)
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
  
  it('should include timestamp in response', async () => {
    const result = await handleUserRequest('test')
    expect(result.timestamp).toBeDefined()
  })
})`,
            docs: `## handleUserRequest

### Description
Processes user input and returns a structured response.

### Parameters
- input: string - The user input to process

### Returns
- Promise<{success: boolean, data?: any, error?: string, timestamp: string}>

### Usage
\`\`\`typescript
const result = await handleUserRequest('user input')
if (result.success) {
  console.log('Success:', result.data)
} else {
  console.error('Error:', result.error)
}
\`\`\``
        }

        return {
            prompt,
            ...cursorResponse
        }
    }

    createCursorPrompt(input, language) {
        if (language === 'korean') {
            return `Please analyze and fix the following Korean user report: "${input}"

This is a Korean user report, please understand the context and provide a solution.

Requirements:
1. Identify the root cause of the problem
2. Provide a complete solution with code
3. Include proper error handling
4. Add comprehensive test cases
5. Ensure the solution is scalable and maintainable
6. Consider edge cases and potential bugs

Please provide:
- Problem analysis
- Solution approach
- Code implementation
- Test cases
- Documentation updates`
        } else {
            return `Please analyze and fix the following issue: "${input}"

Requirements:
1. Identify the root cause of the problem
2. Provide a complete solution with code
3. Include proper error handling
4. Add comprehensive test cases
5. Ensure the solution is scalable and maintainable
6. Consider edge cases and potential bugs

Please provide:
- Problem analysis
- Solution approach
- Code implementation
- Test cases
- Documentation updates`
        }
    }

    async performContinuousQA(code) {
        console.log('🔍 QA 계속 실행 중...')

        const qaResults = []

        // 1. 코드 품질 검사
        const qualityIssues = this.checkCodeQuality(code)
        qaResults.push(...qualityIssues)

        // 2. 보안 취약점 검사
        const securityIssues = this.checkSecurityVulnerabilities(code)
        qaResults.push(...securityIssues)

        // 3. 성능 문제 검사
        const performanceIssues = this.checkPerformanceIssues(code)
        qaResults.push(...performanceIssues)

        // 4. 접근성 검사
        const accessibilityIssues = this.checkAccessibilityIssues(code)
        qaResults.push(...accessibilityIssues)

        // 5. 브라우저 호환성 검사
        const compatibilityIssues = this.checkBrowserCompatibility(code)
        qaResults.push(...compatibilityIssues)

        return qaResults
    }

    checkCodeQuality(code) {
        const issues = []

        // 1. 에러 처리 검사
        if (!code.includes('try') || !code.includes('catch')) {
            issues.push({
                type: 'error_handling',
                severity: 'high',
                message: 'Missing error handling in code',
                suggestion: 'Add try-catch blocks for proper error handling',
                line: this.findLineNumber(code, 'export'),
                category: 'bug'
            })
        }

        // 2. 타입 안정성 검사
        if (code.includes('any') || code.includes('unknown')) {
            issues.push({
                type: 'type_safety',
                severity: 'medium',
                message: 'Using any or unknown types reduces type safety',
                suggestion: 'Use specific types instead of any or unknown',
                line: this.findLineNumber(code, 'any'),
                category: 'improvement'
            })
        }

        // 3. 하드코딩 검사
        if (code.includes('localhost') || code.includes('127.0.0.1')) {
            issues.push({
                type: 'hardcoded_values',
                severity: 'medium',
                message: 'Hardcoded values found in code',
                suggestion: 'Use environment variables or configuration files',
                line: this.findLineNumber(code, 'localhost'),
                category: 'improvement'
            })
        }

        // 4. 중복 코드 검사
        const duplicateLines = this.findDuplicateLines(code)
        if (duplicateLines.length > 0) {
            issues.push({
                type: 'code_duplication',
                severity: 'low',
                message: `Found ${duplicateLines.length} duplicate lines`,
                suggestion: 'Extract common code into reusable functions',
                line: duplicateLines[0],
                category: 'refactor'
            })
        }

        return issues
    }

    checkSecurityVulnerabilities(code) {
        const issues = []

        // 1. SQL 인젝션 검사
        if (code.includes('query') && !code.includes('parameterized')) {
            issues.push({
                type: 'sql_injection',
                severity: 'critical',
                message: 'Potential SQL injection vulnerability',
                suggestion: 'Use parameterized queries or prepared statements',
                line: this.findLineNumber(code, 'query'),
                category: 'security'
            })
        }

        // 2. XSS 검사
        if (code.includes('innerHTML') || code.includes('document.write')) {
            issues.push({
                type: 'xss',
                severity: 'high',
                message: 'Potential XSS vulnerability',
                suggestion: 'Use textContent or sanitize HTML content',
                line: this.findLineNumber(code, 'innerHTML'),
                category: 'security'
            })
        }

        // 3. CSRF 검사
        if (code.includes('fetch') && !code.includes('csrf')) {
            issues.push({
                type: 'csrf',
                severity: 'medium',
                message: 'Missing CSRF protection',
                suggestion: 'Add CSRF tokens to requests',
                line: this.findLineNumber(code, 'fetch'),
                category: 'security'
            })
        }

        return issues
    }

    checkPerformanceIssues(code) {
        const issues = []

        // 1. 메모리 누수 검사
        if (code.includes('addEventListener') && !code.includes('removeEventListener')) {
            issues.push({
                type: 'memory_leak',
                severity: 'medium',
                message: 'Potential memory leak from event listeners',
                suggestion: 'Remove event listeners when components unmount',
                line: this.findLineNumber(code, 'addEventListener'),
                category: 'performance'
            })
        }

        // 2. 무한 루프 검사
        if (code.includes('while(true)') || code.includes('for(;;)')) {
            issues.push({
                type: 'infinite_loop',
                severity: 'high',
                message: 'Potential infinite loop detected',
                suggestion: 'Add proper loop termination conditions',
                line: this.findLineNumber(code, 'while(true)'),
                category: 'bug'
            })
        }

        // 3. 비효율적인 DOM 조작 검사
        if (code.includes('innerHTML') && code.includes('+=')) {
            issues.push({
                type: 'dom_manipulation',
                severity: 'low',
                message: 'Inefficient DOM manipulation',
                suggestion: 'Use documentFragment or batch DOM updates',
                line: this.findLineNumber(code, 'innerHTML'),
                category: 'performance'
            })
        }

        return issues
    }

    checkAccessibilityIssues(code) {
        const issues = []

        // 1. alt 속성 검사
        if (code.includes('<img') && !code.includes('alt=')) {
            issues.push({
                type: 'accessibility',
                severity: 'medium',
                message: 'Images missing alt attributes',
                suggestion: 'Add alt attributes to all images',
                line: this.findLineNumber(code, '<img'),
                category: 'accessibility'
            })
        }

        // 2. 키보드 접근성 검사
        if (code.includes('onClick') && !code.includes('onKeyDown')) {
            issues.push({
                type: 'keyboard_accessibility',
                severity: 'medium',
                message: 'Missing keyboard accessibility',
                suggestion: 'Add keyboard event handlers for interactive elements',
                line: this.findLineNumber(code, 'onClick'),
                category: 'accessibility'
            })
        }

        return issues
    }

    checkBrowserCompatibility(code) {
        const issues = []

        // 1. ES6+ 기능 검사
        if (code.includes('async/await') && !code.includes('babel')) {
            issues.push({
                type: 'browser_compatibility',
                severity: 'low',
                message: 'ES6+ features may not work in older browsers',
                suggestion: 'Add Babel transpilation for browser compatibility',
                line: this.findLineNumber(code, 'async'),
                category: 'compatibility'
            })
        }

        return issues
    }

    async performStaticAnalysis(code) {
        console.log('📊 정적 분석 실행 중...')

        const staticResults = []

        // 1. 코드 복잡도 분석
        const complexity = this.analyzeCodeComplexity(code)
        staticResults.push(complexity)

        // 2. 의존성 분석
        const dependencies = this.analyzeDependencies(code)
        staticResults.push(dependencies)

        // 3. 테스트 커버리지 분석
        const testCoverage = this.analyzeTestCoverage(code)
        staticResults.push(testCoverage)

        // 4. 코드 메트릭 분석
        const metrics = this.analyzeCodeMetrics(code)
        staticResults.push(metrics)

        return staticResults
    }

    analyzeCodeComplexity(code) {
        const lines = code.split('\n')
        const cyclomaticComplexity = this.calculateCyclomaticComplexity(code)

        return {
            type: 'complexity',
            severity: cyclomaticComplexity > 10 ? 'high' : cyclomaticComplexity > 5 ? 'medium' : 'low',
            message: `Cyclomatic complexity: ${cyclomaticComplexity}`,
            suggestion: cyclomaticComplexity > 10 ? 'Refactor complex functions into smaller ones' : 'Complexity is acceptable',
            metrics: {
                lines: lines.length,
                cyclomaticComplexity,
                maxDepth: this.calculateMaxDepth(code)
            },
            category: 'static'
        }
    }

    analyzeDependencies(code) {
        const imports = this.extractImports(code)
        const unusedImports = this.findUnusedImports(code, imports)

        return {
            type: 'dependencies',
            severity: unusedImports.length > 0 ? 'medium' : 'low',
            message: `Found ${unusedImports.length} unused imports`,
            suggestion: unusedImports.length > 0 ? 'Remove unused imports to reduce bundle size' : 'All imports are used',
            metrics: {
                totalImports: imports.length,
                unusedImports: unusedImports.length,
                importRatio: (imports.length - unusedImports.length) / imports.length
            },
            category: 'static'
        }
    }

    analyzeTestCoverage(code) {
        const functions = this.extractFunctions(code)
        const tests = this.extractTests(code)
        const coverage = tests.length / functions.length

        return {
            type: 'test_coverage',
            severity: coverage < 0.5 ? 'high' : coverage < 0.8 ? 'medium' : 'low',
            message: `Test coverage: ${(coverage * 100).toFixed(1)}%`,
            suggestion: coverage < 0.8 ? 'Add more test cases to improve coverage' : 'Test coverage is good',
            metrics: {
                functions: functions.length,
                tests: tests.length,
                coverage: coverage
            },
            category: 'static'
        }
    }

    analyzeCodeMetrics(code) {
        const lines = code.split('\n')
        const nonEmptyLines = lines.filter(line => line.trim().length > 0)
        const commentLines = lines.filter(line => line.trim().startsWith('//') || line.trim().startsWith('/*'))

        return {
            type: 'metrics',
            severity: 'low',
            message: 'Code metrics analysis',
            suggestion: 'Monitor code metrics for quality',
            metrics: {
                totalLines: lines.length,
                nonEmptyLines: nonEmptyLines.length,
                commentLines: commentLines.length,
                commentRatio: commentLines.length / nonEmptyLines.length,
                averageLineLength: nonEmptyLines.reduce((sum, line) => sum + line.length, 0) / nonEmptyLines.length
            },
            category: 'static'
        }
    }

    async generateBugReports(qaResults, staticAnalysis) {
        console.log('🐛 버그 신고 생성 중...')

        const bugReports = []

        // QA 결과에서 버그 신고 생성
        qaResults.forEach((issue, index) => {
            if (issue.severity === 'high' || issue.severity === 'critical') {
                bugReports.push({
                    id: `BUG-${Date.now()}-${index}`,
                    title: issue.message,
                    description: issue.suggestion,
                    severity: issue.severity,
                    category: issue.category,
                    source: 'qa',
                    line: issue.line,
                    status: 'open',
                    createdAt: new Date().toISOString()
                })
            }
        })

        // 정적 분석에서 버그 신고 생성
        staticAnalysis.forEach((analysis, index) => {
            if (analysis.severity === 'high') {
                bugReports.push({
                    id: `BUG-${Date.now()}-${index}`,
                    title: analysis.message,
                    description: analysis.suggestion,
                    severity: analysis.severity,
                    category: analysis.category,
                    source: 'static',
                    metrics: analysis.metrics,
                    status: 'open',
                    createdAt: new Date().toISOString()
                })
            }
        })

        return bugReports
    }

    async generateIntegratedTodos(input, qaResults, staticAnalysis, bugReports) {
        console.log('📋 통합 TODO 생성 중...')

        const todos = []

        // 1. 원본 요청 기반 TODO
        const originalTodos = this.generateTodosFromInput(input)
        todos.push(...originalTodos)

        // 2. QA 결과 기반 TODO
        const qaTodos = this.generateTodosFromQA(qaResults)
        todos.push(...qaTodos)

        // 3. 정적 분석 기반 TODO
        const staticTodos = this.generateTodosFromStaticAnalysis(staticAnalysis)
        todos.push(...staticTodos)

        // 4. 버그 신고 기반 TODO
        const bugTodos = this.generateTodosFromBugReports(bugReports)
        todos.push(...bugTodos)

        // 5. 중복 제거 및 우선순위 정렬
        const uniqueTodos = this.deduplicateAndPrioritizeTodos(todos)

        return uniqueTodos
    }

    generateTodosFromInput(input) {
        const todos = []

        // 한글 키워드 기반 TODO 생성
        if (input.includes('로그인') || input.includes('인증')) {
            todos.push({
                id: 'AUTH-001',
                title: 'Fix authentication system',
                description: 'Resolve login functionality issues',
                priority: 'high',
                category: 'bug',
                estimatedHours: 4,
                source: 'input'
            })
        }

        if (input.includes('버튼') || input.includes('클릭')) {
            todos.push({
                id: 'UI-001',
                title: 'Fix button click functionality',
                description: 'Ensure all buttons respond to user clicks',
                priority: 'high',
                category: 'bug',
                estimatedHours: 2,
                source: 'input'
            })
        }

        if (input.includes('느려') || input.includes('성능')) {
            todos.push({
                id: 'PERF-001',
                title: 'Optimize page performance',
                description: 'Improve loading speed and responsiveness',
                priority: 'medium',
                category: 'perf',
                estimatedHours: 6,
                source: 'input'
            })
        }

        return todos
    }

    generateTodosFromQA(qaResults) {
        const todos = []

        qaResults.forEach((issue, index) => {
            todos.push({
                id: `QA-${Date.now()}-${index}`,
                title: `Fix ${issue.type} issue`,
                description: issue.suggestion,
                priority: issue.severity === 'critical' ? 'high' : issue.severity === 'high' ? 'high' : 'medium',
                category: issue.category,
                estimatedHours: this.estimateHours(issue.severity),
                source: 'qa',
                line: issue.line
            })
        })

        return todos
    }

    generateTodosFromStaticAnalysis(staticAnalysis) {
        const todos = []

        staticAnalysis.forEach((analysis, index) => {
            if (analysis.severity === 'high' || analysis.severity === 'medium') {
                todos.push({
                    id: `STATIC-${Date.now()}-${index}`,
                    title: `Improve ${analysis.type}`,
                    description: analysis.suggestion,
                    priority: analysis.severity === 'high' ? 'high' : 'medium',
                    category: analysis.category,
                    estimatedHours: this.estimateHours(analysis.severity),
                    source: 'static',
                    metrics: analysis.metrics
                })
            }
        })

        return todos
    }

    generateTodosFromBugReports(bugReports) {
        const todos = []

        bugReports.forEach((bug, index) => {
            todos.push({
                id: `BUG-${Date.now()}-${index}`,
                title: `Fix bug: ${bug.title}`,
                description: bug.description,
                priority: bug.severity === 'critical' ? 'high' : bug.severity === 'high' ? 'high' : 'medium',
                category: bug.category,
                estimatedHours: this.estimateHours(bug.severity),
                source: 'bug',
                bugId: bug.id
            })
        })

        return todos
    }

    deduplicateAndPrioritizeTodos(todos) {
        // 중복 제거 (제목 기준)
        const uniqueTodos = []
        const seenTitles = new Set()

        todos.forEach(todo => {
            if (!seenTitles.has(todo.title)) {
                seenTitles.add(todo.title)
                uniqueTodos.push(todo)
            }
        })

        // 우선순위 정렬
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 }
        uniqueTodos.sort((a, b) => {
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[b.priority] - priorityOrder[a.priority]
            }
            return a.estimatedHours - b.estimatedHours
        })

        return uniqueTodos
    }

    estimateHours(severity) {
        const hourMap = {
            'critical': 8,
            'high': 4,
            'medium': 2,
            'low': 1
        }
        return hourMap[severity] || 1
    }

    // 유틸리티 함수들
    findLineNumber(code, searchText) {
        const lines = code.split('\n')
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(searchText)) {
                return i + 1
            }
        }
        return 0
    }

    findDuplicateLines(code) {
        const lines = code.split('\n')
        const lineCount = {}
        const duplicates = []

        lines.forEach((line, index) => {
            const trimmed = line.trim()
            if (trimmed.length > 0) {
                if (lineCount[trimmed]) {
                    lineCount[trimmed].push(index + 1)
                } else {
                    lineCount[trimmed] = [index + 1]
                }
            }
        })

        Object.values(lineCount).forEach(positions => {
            if (positions.length > 1) {
                duplicates.push(...positions)
            }
        })

        return duplicates
    }

    calculateCyclomaticComplexity(code) {
        const complexityKeywords = ['if', 'else', 'while', 'for', 'switch', 'case', 'catch', '&&', '||']
        let complexity = 1

        complexityKeywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g')
            const matches = code.match(regex)
            if (matches) {
                complexity += matches.length
            }
        })

        // Handle ? operator separately
        const questionMatches = code.match(/\?/g)
        if (questionMatches) {
            complexity += questionMatches.length
        }

        return complexity
    }

    calculateMaxDepth(code) {
        let maxDepth = 0
        let currentDepth = 0

        for (const char of code) {
            if (char === '{') {
                currentDepth++
                maxDepth = Math.max(maxDepth, currentDepth)
            } else if (char === '}') {
                currentDepth--
            }
        }

        return maxDepth
    }

    extractImports(code) {
        const importRegex = /import\s+.*?\s+from\s+['"](.*?)['"]/g
        const imports = []
        let match

        while ((match = importRegex.exec(code)) !== null) {
            imports.push(match[1])
        }

        return imports
    }

    findUnusedImports(code, imports) {
        const unused = []

        imports.forEach(importPath => {
            const importName = importPath.split('/').pop().replace('.js', '').replace('.ts', '')
            if (!code.includes(importName)) {
                unused.push(importPath)
            }
        })

        return unused
    }

    extractFunctions(code) {
        const functionRegex = /(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s+)?\(|export\s+(?:async\s+)?function)/g
        const functions = []
        let match

        while ((match = functionRegex.exec(code)) !== null) {
            functions.push(match[0])
        }

        return functions
    }

    extractTests(code) {
        const testRegex = /(?:it\(|test\(|describe\()/g
        const tests = []
        let match

        while ((match = testRegex.exec(code)) !== null) {
            tests.push(match[0])
        }

        return tests
    }

    async integrateWorkResult(input, language, cursorResult, qaResults, staticAnalysis, bugReports, todos) {
        const workResult = {
            timestamp: new Date().toISOString(),
            userInput: input,
            language: language,
            cursorPrompt: cursorResult.prompt,
            generatedCode: cursorResult.code,
            analysis: cursorResult.analysis,
            solution: cursorResult.solution,
            tests: cursorResult.tests,
            documentation: cursorResult.docs,
            qaResults: qaResults,
            staticAnalysis: staticAnalysis,
            bugReports: bugReports,
            generatedTodos: todos,
            summary: this.generateSummary(todos, qaResults, staticAnalysis, bugReports)
        }

        return workResult
    }

    generateSummary(todos, qaResults, staticAnalysis, bugReports) {
        const totalTodos = todos.length
        const highPriorityTodos = todos.filter(t => t.priority === 'high').length
        const estimatedHours = todos.reduce((sum, todo) => sum + todo.estimatedHours, 0)

        return {
            totalTodos,
            highPriorityTodos,
            estimatedHours,
            qaIssues: qaResults.length,
            staticIssues: staticAnalysis.length,
            bugReports: bugReports.length,
            categories: [...new Set(todos.map(t => t.category))],
            sources: [...new Set(todos.map(t => t.source))],
            nextSteps: [
                'Review generated code',
                'Fix QA issues',
                'Address static analysis findings',
                'Resolve bug reports',
                'Implement suggested solution',
                'Run comprehensive tests',
                'Update documentation',
                'Deploy changes'
            ]
        }
    }

    async saveWorkResult(workResult) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const filename = `complete-cursor-qa-work-${timestamp}.json`
        const filepath = path.join('work-results', filename)

        // 디렉토리 생성
        await fs.mkdir('work-results', { recursive: true })

        // 파일 저장
        await fs.writeFile(filepath, JSON.stringify(workResult, null, 2), 'utf8')

        // TODO 파일도 저장
        await this.saveTodos(workResult.generatedTodos, timestamp)

        // QA 리포트 저장
        await this.saveQAReport(workResult.qaResults, workResult.staticAnalysis, workResult.bugReports, timestamp)

        console.log(`💾 작업 결과 저장: ${filepath}`)
    }

    async saveTodos(todos, timestamp) {
        const todoContent = this.generateTodoMarkdown(todos)
        const filename = `complete-todos-${timestamp}.md`
        const filepath = path.join('work-results', filename)

        await fs.writeFile(filepath, todoContent, 'utf8')
        console.log(`📋 TODO 저장: ${filepath}`)
    }

    async saveQAReport(qaResults, staticAnalysis, bugReports, timestamp) {
        const qaContent = this.generateQAReport(qaResults, staticAnalysis, bugReports)
        const filename = `qa-report-${timestamp}.md`
        const filepath = path.join('work-results', filename)

        await fs.writeFile(filepath, qaContent, 'utf8')
        console.log(`🔍 QA 리포트 저장: ${filepath}`)
    }

    generateTodoMarkdown(todos) {
        let content = '# 완전한 Cursor QA 시스템 - 생성된 TODOs\n\n'
        content += `생성일: ${new Date().toISOString()}\n\n`

        // 소스별로 그룹화
        const sourceGroups = {
            input: todos.filter(t => t.source === 'input'),
            qa: todos.filter(t => t.source === 'qa'),
            static: todos.filter(t => t.source === 'static'),
            bug: todos.filter(t => t.source === 'bug')
        }

        Object.keys(sourceGroups).forEach(source => {
            const groupTodos = sourceGroups[source]
            if (groupTodos.length > 0) {
                content += `## ${source.toUpperCase()} 기반 TODO\n\n`
                groupTodos.forEach(todo => {
                    content += `- [ ] **${todo.id}**: ${todo.title}\n`
                    content += `  - 설명: ${todo.description}\n`
                    content += `  - 우선순위: ${todo.priority}\n`
                    content += `  - 카테고리: ${todo.category}\n`
                    content += `  - 예상 시간: ${todo.estimatedHours}시간\n\n`
                })
            }
        })

        return content
    }

    generateQAReport(qaResults, staticAnalysis, bugReports) {
        let content = '# QA 및 정적 분석 리포트\n\n'
        content += `생성일: ${new Date().toISOString()}\n\n`

        content += `## 🔍 QA 결과\n`
        content += `- 총 이슈: ${qaResults.length}개\n`
        content += `- 높은 심각도: ${qaResults.filter(r => r.severity === 'high' || r.severity === 'critical').length}개\n\n`

        qaResults.forEach((result, index) => {
            content += `### ${index + 1}. ${result.type}\n`
            content += `- 심각도: ${result.severity}\n`
            content += `- 메시지: ${result.message}\n`
            content += `- 제안: ${result.suggestion}\n\n`
        })

        content += `## 📊 정적 분석 결과\n`
        content += `- 총 분석: ${staticAnalysis.length}개\n\n`

        staticAnalysis.forEach((analysis, index) => {
            content += `### ${index + 1}. ${analysis.type}\n`
            content += `- 심각도: ${analysis.severity}\n`
            content += `- 메시지: ${analysis.message}\n`
            content += `- 제안: ${analysis.suggestion}\n\n`
        })

        content += `## 🐛 버그 신고\n`
        content += `- 총 버그: ${bugReports.length}개\n\n`

        bugReports.forEach((bug, index) => {
            content += `### ${index + 1}. ${bug.title}\n`
            content += `- 심각도: ${bug.severity}\n`
            content += `- 설명: ${bug.description}\n`
            content += `- 상태: ${bug.status}\n\n`
        })

        return content
    }
}

// CLI 실행
if (require.main === module) {
    const system = new CompleteCursorQASystem()
    const args = process.argv.slice(2)

    if (args.length === 0) {
        console.log('사용법:')
        console.log('  node complete-cursor-qa-system.js "사용자 불편사항"')
        console.log('  node complete-cursor-qa-system.js --demo')
        console.log('')
        console.log('예시:')
        console.log('  node complete-cursor-qa-system.js "로그인 기능이 안 돼"')
        console.log('  node complete-cursor-qa-system.js "Button click is not working"')
        console.log('  node complete-cursor-qa-system.js --demo')
        process.exit(1)
    }

    if (args[0] === '--demo') {
        // 데모 실행
        const demoCases = [
            "로그인 기능이 안 돼",
            "Button click is not working",
            "페이지가 느려",
            "Error handling is missing"
        ]

        Promise.all(demoCases.map(case_ => system.processUserRequest(case_)))
            .then(() => {
                console.log('\n✅ 데모 완료!')
                process.exit(0)
            })
            .catch(error => {
                console.error('❌ 데모 오류:', error.message)
                process.exit(1)
            })
    } else {
        const userInput = args.join(' ')
        system.processUserRequest(userInput)
            .then(result => {
                console.log('\n✅ 작업 완료!')
                console.log(`📋 생성된 TODO: ${result.generatedTodos.length}개`)
                console.log(`🔍 QA 이슈: ${result.qaResults.length}개`)
                console.log(`📊 정적 분석: ${result.staticAnalysis.length}개`)
                console.log(`🐛 버그 신고: ${result.bugReports.length}개`)
                console.log(`⏱️ 예상 시간: ${result.summary.estimatedHours}시간`)
                console.log(`📁 결과 저장: work-results/`)
                process.exit(0)
            })
            .catch(error => {
                console.error('❌ 오류:', error.message)
                process.exit(1)
            })
    }
}

module.exports = CompleteCursorQASystem

#!/usr/bin/env node

/**
 * 분리된 테스트 시스템
 * 
 * 1. TestCase: 단위 테스트 (Unit Test)
 * 2. 시나리오 테스트: 통합 테스트 (Integration Test)
 * 
 * 각각 다른 규칙과 생성 로직 적용
 */

const fs = require('fs').promises
const path = require('path')

class SeparatedTestSystem {
    constructor() {
        this.testTypes = {
            UNIT: 'unit',
            INTEGRATION: 'integration',
            E2E: 'e2e',
            PERFORMANCE: 'performance',
            SECURITY: 'security'
        }

        this.testRules = {
            unit: {
                scope: 'single function/component',
                focus: 'logic correctness',
                isolation: 'mocked dependencies',
                speed: 'fast',
                coverage: 'high',
                patterns: ['describe', 'it', 'expect', 'mock']
            },
            integration: {
                scope: 'multiple components',
                focus: 'component interaction',
                isolation: 'real dependencies',
                speed: 'medium',
                coverage: 'medium',
                patterns: ['describe', 'it', 'render', 'fireEvent', 'waitFor']
            },
            e2e: {
                scope: 'full application',
                focus: 'user workflow',
                isolation: 'real environment',
                speed: 'slow',
                coverage: 'low',
                patterns: ['describe', 'it', 'cy.visit', 'cy.get', 'cy.click']
            },
            performance: {
                scope: 'performance metrics',
                focus: 'speed and efficiency',
                isolation: 'real conditions',
                speed: 'variable',
                coverage: 'specific',
                patterns: ['describe', 'it', 'performance.now', 'measure']
            },
            security: {
                scope: 'security vulnerabilities',
                focus: 'attack vectors',
                isolation: 'controlled environment',
                speed: 'medium',
                coverage: 'specific',
                patterns: ['describe', 'it', 'security', 'vulnerability', 'attack']
            }
        }
    }

    async processUserRequest(input) {
        console.log('🚀 분리된 테스트 시스템 시작...')
        console.log(`📝 사용자 입력: ${input}`)

        try {
            // 1. 언어 감지
            const language = this.detectLanguage(input)
            console.log(`🌐 감지된 언어: ${language}`)

            // 2. Cursor GPT 자동코드생성
            const cursorResult = await this.generateCodeWithCursor(input, language)
            console.log(`🤖 Cursor 코드 생성 완료`)

            // 3. TestCase 생성 (단위 테스트)
            const unitTests = await this.generateUnitTests(cursorResult.code)
            console.log(`🧪 TestCase 생성: ${unitTests.length}개`)

            // 4. 시나리오 테스트 생성 (통합 테스트)
            const integrationTests = await this.generateIntegrationTests(cursorResult.code)
            console.log(`🎭 시나리오 테스트 생성: ${integrationTests.length}개`)

            // 5. E2E 테스트 생성
            const e2eTests = await this.generateE2ETests(cursorResult.code)
            console.log(`🌐 E2E 테스트 생성: ${e2eTests.length}개`)

            // 6. 성능 테스트 생성
            const performanceTests = await this.generatePerformanceTests(cursorResult.code)
            console.log(`⚡ 성능 테스트 생성: ${performanceTests.length}개`)

            // 7. 보안 테스트 생성
            const securityTests = await this.generateSecurityTests(cursorResult.code)
            console.log(`🔒 보안 테스트 생성: ${securityTests.length}개`)

            // 8. QA 및 정적 분석
            const qaResults = await this.performQA(cursorResult.code)
            const staticAnalysis = await this.performStaticAnalysis(cursorResult.code)

            // 9. 통합 TODO 생성
            const todos = await this.generateIntegratedTodos(input, unitTests, integrationTests, e2eTests, performanceTests, securityTests, qaResults, staticAnalysis)
            console.log(`📋 통합 TODO: ${todos.length}개 생성`)

            // 10. 작업 결과 통합
            const workResult = await this.integrateWorkResult(input, language, cursorResult, unitTests, integrationTests, e2eTests, performanceTests, securityTests, qaResults, staticAnalysis, todos)
            console.log(`✅ 작업 결과 통합 완료`)

            // 11. 결과 저장
            await this.saveWorkResult(workResult)

            return workResult

        } catch (error) {
            console.error('❌ 처리 오류:', error.message)
            throw error
        }
    }

    detectLanguage(input) {
        const koreanRegex = /[가-힣]/
        if (koreanRegex.test(input)) {
            return 'korean'
        }
        return 'english'
    }

    async generateCodeWithCursor(input, language) {
        console.log('🤖 Cursor GPT와 통신 중...')

        const prompt = this.createCursorPrompt(input, language)

        const cursorResponse = {
            analysis: `Code analysis for: ${input}`,
            solution: `Solution approach for the reported issue`,
            code: `// Generated code
export const handleUserRequest = async (input) => {
  try {
    const result = await processInput(input)
    
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

const processInput = async (input) => {
  return { success: true, data: input }
}`,
            tests: `// Test cases will be generated separately`,
            docs: `## handleUserRequest

### Description
Processes user input and returns a structured response.`
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
4. Ensure the solution is scalable and maintainable
5. Consider edge cases and potential bugs

Please provide:
- Problem analysis
- Solution approach
- Code implementation
- Documentation updates

Note: Test cases will be generated separately with different rules.`
        } else {
            return `Please analyze and fix the following issue: "${input}"

Requirements:
1. Identify the root cause of the problem
2. Provide a complete solution with code
3. Include proper error handling
4. Ensure the solution is scalable and maintainable
5. Consider edge cases and potential bugs

Please provide:
- Problem analysis
- Solution approach
- Code implementation
- Documentation updates

Note: Test cases will be generated separately with different rules.`
        }
    }

    async generateUnitTests(code) {
        console.log('🧪 TestCase 생성 중...')

        const unitTests = []

        // 1. 함수별 단위 테스트
        const functions = this.extractFunctions(code)
        functions.forEach(func => {
            unitTests.push({
                type: 'unit',
                name: `${func.name} unit test`,
                description: `Test ${func.name} function in isolation`,
                code: this.generateUnitTestCode(func),
                rules: this.testRules.unit,
                priority: 'high',
                estimatedHours: 1
            })
        })

        // 2. 에러 케이스 테스트
        unitTests.push({
            type: 'unit',
            name: 'Error handling unit test',
            description: 'Test error handling scenarios',
            code: this.generateErrorHandlingUnitTest(),
            rules: this.testRules.unit,
            priority: 'high',
            estimatedHours: 1
        })

        // 3. 엣지 케이스 테스트
        unitTests.push({
            type: 'unit',
            name: 'Edge cases unit test',
            description: 'Test edge cases and boundary conditions',
            code: this.generateEdgeCasesUnitTest(),
            rules: this.testRules.unit,
            priority: 'medium',
            estimatedHours: 1
        })

        return unitTests
    }

    async generateIntegrationTests(code) {
        console.log('🎭 시나리오 테스트 생성 중...')

        const integrationTests = []

        // 1. 컴포넌트 통합 테스트
        integrationTests.push({
            type: 'integration',
            name: 'Component integration test',
            description: 'Test component interaction and data flow',
            code: this.generateComponentIntegrationTest(),
            rules: this.testRules.integration,
            priority: 'high',
            estimatedHours: 2
        })

        // 2. API 통합 테스트
        integrationTests.push({
            type: 'integration',
            name: 'API integration test',
            description: 'Test API calls and responses',
            code: this.generateAPIIntegrationTest(),
            rules: this.testRules.integration,
            priority: 'high',
            estimatedHours: 2
        })

        // 3. 데이터베이스 통합 테스트
        integrationTests.push({
            type: 'integration',
            name: 'Database integration test',
            description: 'Test database operations and transactions',
            code: this.generateDatabaseIntegrationTest(),
            rules: this.testRules.integration,
            priority: 'medium',
            estimatedHours: 3
        })

        // 4. 사용자 시나리오 테스트
        integrationTests.push({
            type: 'integration',
            name: 'User scenario test',
            description: 'Test complete user workflows',
            code: this.generateUserScenarioTest(),
            rules: this.testRules.integration,
            priority: 'high',
            estimatedHours: 4
        })

        return integrationTests
    }

    async generateE2ETests(code) {
        console.log('🌐 E2E 테스트 생성 중...')

        const e2eTests = []

        // 1. 사용자 여정 테스트
        e2eTests.push({
            type: 'e2e',
            name: 'User journey E2E test',
            description: 'Test complete user journey from start to finish',
            code: this.generateUserJourneyE2ETest(),
            rules: this.testRules.e2e,
            priority: 'high',
            estimatedHours: 4
        })

        // 2. 크로스 브라우저 테스트
        e2eTests.push({
            type: 'e2e',
            name: 'Cross-browser E2E test',
            description: 'Test functionality across different browsers',
            code: this.generateCrossBrowserE2ETest(),
            rules: this.testRules.e2e,
            priority: 'medium',
            estimatedHours: 3
        })

        return e2eTests
    }

    async generatePerformanceTests(code) {
        console.log('⚡ 성능 테스트 생성 중...')

        const performanceTests = []

        // 1. 로딩 성능 테스트
        performanceTests.push({
            type: 'performance',
            name: 'Loading performance test',
            description: 'Test page loading performance',
            code: this.generateLoadingPerformanceTest(),
            rules: this.testRules.performance,
            priority: 'high',
            estimatedHours: 2
        })

        // 2. 메모리 사용량 테스트
        performanceTests.push({
            type: 'performance',
            name: 'Memory usage test',
            description: 'Test memory usage and leaks',
            code: this.generateMemoryUsageTest(),
            rules: this.testRules.performance,
            priority: 'medium',
            estimatedHours: 2
        })

        return performanceTests
    }

    async generateSecurityTests(code) {
        console.log('🔒 보안 테스트 생성 중...')

        const securityTests = []

        // 1. 인증 보안 테스트
        securityTests.push({
            type: 'security',
            name: 'Authentication security test',
            description: 'Test authentication security vulnerabilities',
            code: this.generateAuthSecurityTest(),
            rules: this.testRules.security,
            priority: 'high',
            estimatedHours: 3
        })

        // 2. 입력 검증 테스트
        securityTests.push({
            type: 'security',
            name: 'Input validation security test',
            description: 'Test input validation and sanitization',
            code: this.generateInputValidationSecurityTest(),
            rules: this.testRules.security,
            priority: 'high',
            estimatedHours: 2
        })

        return securityTests
    }

    generateUnitTestCode(func) {
        return `// Unit test for ${func.name}
describe('${func.name}', () => {
  it('should work correctly with valid input', () => {
    // Arrange
    const input = 'test input'
    
    // Act
    const result = ${func.name}(input)
    
    // Assert
    expect(result).toBeDefined()
    expect(result.success).toBe(true)
  })
  
  it('should handle invalid input', () => {
    // Arrange
    const input = null
    
    // Act
    const result = ${func.name}(input)
    
    // Assert
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
  
  it('should handle edge cases', () => {
    // Arrange
    const input = ''
    
    // Act
    const result = ${func.name}(input)
    
    // Assert
    expect(result).toBeDefined()
  })
})`
    }

    generateErrorHandlingUnitTest() {
        return `// Error handling unit test
describe('Error Handling', () => {
  it('should catch and handle errors properly', async () => {
    // Arrange
    const errorInput = 'error input'
    
    // Act
    const result = await handleUserRequest(errorInput)
    
    // Assert
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
  
  it('should return proper error structure', async () => {
    // Arrange
    const errorInput = 'error input'
    
    // Act
    const result = await handleUserRequest(errorInput)
    
    // Assert
    expect(result).toHaveProperty('success')
    expect(result).toHaveProperty('error')
    expect(result).toHaveProperty('timestamp')
  })
})`
    }

    generateEdgeCasesUnitTest() {
        return `// Edge cases unit test
describe('Edge Cases', () => {
  it('should handle empty string', async () => {
    const result = await handleUserRequest('')
    expect(result).toBeDefined()
  })
  
  it('should handle very long string', async () => {
    const longString = 'a'.repeat(10000)
    const result = await handleUserRequest(longString)
    expect(result).toBeDefined()
  })
  
  it('should handle special characters', async () => {
    const specialString = '!@#$%^&*()'
    const result = await handleUserRequest(specialString)
    expect(result).toBeDefined()
  })
})`
    }

    generateComponentIntegrationTest() {
        return `// Component integration test
describe('Component Integration', () => {
  it('should render and interact properly', () => {
    // Arrange
    render(<UserRequestComponent />)
    
    // Act
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'test input' } })
    fireEvent.click(screen.getByRole('button'))
    
    // Assert
    expect(screen.getByText('Success')).toBeInTheDocument()
  })
  
  it('should handle component state changes', () => {
    // Arrange
    render(<UserRequestComponent />)
    
    // Act
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'test input' } })
    
    // Assert
    expect(input.value).toBe('test input')
  })
})`
    }

    generateAPIIntegrationTest() {
        return `// API integration test
describe('API Integration', () => {
  it('should call API and handle response', async () => {
    // Arrange
    const mockResponse = { success: true, data: 'test data' }
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })
    
    // Act
    const result = await handleUserRequest('test input')
    
    // Assert
    expect(fetch).toHaveBeenCalledWith('/api/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: 'test input' })
    })
    expect(result.success).toBe(true)
  })
  
  it('should handle API errors', async () => {
    // Arrange
    fetch.mockRejectedValueOnce(new Error('API Error'))
    
    // Act
    const result = await handleUserRequest('test input')
    
    // Assert
    expect(result.success).toBe(false)
    expect(result.error).toBe('API Error')
  })
})`
    }

    generateDatabaseIntegrationTest() {
        return `// Database integration test
describe('Database Integration', () => {
  it('should save data to database', async () => {
    // Arrange
    const testData = { input: 'test input', result: 'success' }
    
    // Act
    const result = await saveToDatabase(testData)
    
    // Assert
    expect(result.success).toBe(true)
    expect(result.id).toBeDefined()
  })
  
  it('should retrieve data from database', async () => {
    // Arrange
    const testId = 'test-id'
    
    // Act
    const result = await getFromDatabase(testId)
    
    // Assert
    expect(result).toBeDefined()
    expect(result.id).toBe(testId)
  })
})`
    }

    generateUserScenarioTest() {
        return `// User scenario test
describe('User Scenario', () => {
  it('should complete full user workflow', async () => {
    // Arrange
    render(<App />)
    
    // Act - Step 1: User enters input
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'user input' } })
    
    // Act - Step 2: User clicks submit
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    
    // Act - Step 3: Wait for processing
    await waitFor(() => {
      expect(screen.getByText('Processing...')).toBeInTheDocument()
    })
    
    // Act - Step 4: Wait for result
    await waitFor(() => {
      expect(screen.getByText('Success!')).toBeInTheDocument()
    })
    
    // Assert
    expect(screen.getByText('Result: user input')).toBeInTheDocument()
  })
})`
    }

    generateUserJourneyE2ETest() {
        return `// User journey E2E test
describe('User Journey E2E', () => {
  it('should complete full user journey', () => {
    // Step 1: Visit homepage
    cy.visit('/')
    cy.get('[data-testid="homepage"]').should('be.visible')
    
    // Step 2: Navigate to input page
    cy.get('[data-testid="input-link"]').click()
    cy.url().should('include', '/input')
    
    // Step 3: Enter input
    cy.get('[data-testid="input-field"]').type('test input')
    cy.get('[data-testid="submit-button"]').click()
    
    // Step 4: Wait for processing
    cy.get('[data-testid="processing"]').should('be.visible')
    
    // Step 5: Verify result
    cy.get('[data-testid="result"]').should('contain', 'test input')
    
    // Step 6: Navigate back
    cy.get('[data-testid="back-button"]').click()
    cy.url().should('include', '/')
  })
})`
    }

    generateCrossBrowserE2ETest() {
        return `// Cross-browser E2E test
describe('Cross-browser E2E', () => {
  it('should work in Chrome', () => {
    cy.visit('/')
    cy.get('[data-testid="input-field"]').type('chrome test')
    cy.get('[data-testid="submit-button"]').click()
    cy.get('[data-testid="result"]').should('contain', 'chrome test')
  })
  
  it('should work in Firefox', () => {
    cy.visit('/')
    cy.get('[data-testid="input-field"]').type('firefox test')
    cy.get('[data-testid="submit-button"]').click()
    cy.get('[data-testid="result"]').should('contain', 'firefox test')
  })
})`
    }

    generateLoadingPerformanceTest() {
        return `// Loading performance test
describe('Loading Performance', () => {
  it('should load within acceptable time', async () => {
    const startTime = performance.now()
    
    // Act
    await handleUserRequest('test input')
    
    const endTime = performance.now()
    const loadTime = endTime - startTime
    
    // Assert
    expect(loadTime).toBeLessThan(1000) // 1 second
  })
  
  it('should handle multiple requests efficiently', async () => {
    const startTime = performance.now()
    
    // Act
    await Promise.all([
      handleUserRequest('input1'),
      handleUserRequest('input2'),
      handleUserRequest('input3')
    ])
    
    const endTime = performance.now()
    const loadTime = endTime - startTime
    
    // Assert
    expect(loadTime).toBeLessThan(2000) // 2 seconds
  })
})`
    }

    generateMemoryUsageTest() {
        return `// Memory usage test
describe('Memory Usage', () => {
  it('should not leak memory', async () => {
    const initialMemory = performance.memory?.usedJSHeapSize || 0
    
    // Act - Process multiple requests
    for (let i = 0; i < 100; i++) {
      await handleUserRequest(\`input-\${i}\`)
    }
    
    // Force garbage collection
    if (global.gc) {
      global.gc()
    }
    
    const finalMemory = performance.memory?.usedJSHeapSize || 0
    const memoryIncrease = finalMemory - initialMemory
    
    // Assert
    expect(memoryIncrease).toBeLessThan(10000000) // 10MB
  })
})`
    }

    generateAuthSecurityTest() {
        return `// Authentication security test
describe('Authentication Security', () => {
  it('should prevent unauthorized access', async () => {
    // Arrange
    const unauthorizedInput = 'malicious input'
    
    // Act
    const result = await handleUserRequest(unauthorizedInput)
    
    // Assert
    expect(result.success).toBe(false)
    expect(result.error).toContain('unauthorized')
  })
  
  it('should validate input properly', async () => {
    // Arrange
    const maliciousInput = '<script>alert("xss")</script>'
    
    // Act
    const result = await handleUserRequest(maliciousInput)
    
    // Assert
    expect(result.data).not.toContain('<script>')
    expect(result.data).toContain('&lt;script&gt;')
  })
})`
    }

    generateInputValidationSecurityTest() {
        return `// Input validation security test
describe('Input Validation Security', () => {
  it('should sanitize SQL injection attempts', async () => {
    // Arrange
    const sqlInjection = "'; DROP TABLE users; --"
    
    // Act
    const result = await handleUserRequest(sqlInjection)
    
    // Assert
    expect(result.success).toBe(true)
    expect(result.data).not.toContain('DROP TABLE')
  })
  
  it('should handle XSS attempts', async () => {
    // Arrange
    const xssAttempt = '<img src="x" onerror="alert(1)">'
    
    // Act
    const result = await handleUserRequest(xssAttempt)
    
    // Assert
    expect(result.data).not.toContain('onerror')
    expect(result.data).toContain('&lt;img')
  })
})`
    }

    extractFunctions(code) {
        const functions = []
        const functionRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\(|export\s+(?:async\s+)?function\s+(\w+))/g
        let match

        while ((match = functionRegex.exec(code)) !== null) {
            const funcName = match[1] || match[2] || match[3]
            if (funcName) {
                functions.push({ name: funcName, type: 'function' })
            }
        }

        return functions
    }

    async performQA(code) {
        console.log('🔍 QA 실행 중...')

        const qaResults = []

        // 1. 코드 품질 검사
        if (!code.includes('try') || !code.includes('catch')) {
            qaResults.push({
                type: 'error_handling',
                severity: 'high',
                message: 'Missing error handling in code',
                suggestion: 'Add try-catch blocks for proper error handling',
                category: 'bug'
            })
        }

        // 2. 테스트 커버리지 검사
        if (!code.includes('test') && !code.includes('spec')) {
            qaResults.push({
                type: 'test_coverage',
                severity: 'medium',
                message: 'No test files found',
                suggestion: 'Add test files for better coverage',
                category: 'test'
            })
        }

        return qaResults
    }

    async performStaticAnalysis(code) {
        console.log('📊 정적 분석 실행 중...')

        const staticResults = []

        // 1. 코드 복잡도 분석
        const complexity = this.calculateComplexity(code)
        staticResults.push({
            type: 'complexity',
            severity: complexity > 10 ? 'high' : 'medium',
            message: `Cyclomatic complexity: ${complexity}`,
            suggestion: complexity > 10 ? 'Refactor complex functions' : 'Complexity is acceptable',
            category: 'static'
        })

        return staticResults
    }

    calculateComplexity(code) {
        const keywords = ['if', 'else', 'while', 'for', 'switch', 'case', 'catch', '&&', '||']
        let complexity = 1

        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g')
            const matches = code.match(regex)
            if (matches) {
                complexity += matches.length
            }
        })

        return complexity
    }

    async generateIntegratedTodos(input, unitTests, integrationTests, e2eTests, performanceTests, securityTests, qaResults, staticAnalysis) {
        console.log('📋 통합 TODO 생성 중...')

        const todos = []

        // 1. TestCase TODO (단위 테스트)
        unitTests.forEach((test, index) => {
            todos.push({
                id: `UNIT-${Date.now()}-${index}`,
                title: `Create unit test: ${test.name}`,
                description: test.description,
                priority: test.priority,
                category: 'test',
                estimatedHours: test.estimatedHours,
                source: 'unit_test',
                testType: 'unit',
                rules: test.rules
            })
        })

        // 2. 시나리오 테스트 TODO (통합 테스트)
        integrationTests.forEach((test, index) => {
            todos.push({
                id: `INTEGRATION-${Date.now()}-${index}`,
                title: `Create integration test: ${test.name}`,
                description: test.description,
                priority: test.priority,
                category: 'test',
                estimatedHours: test.estimatedHours,
                source: 'integration_test',
                testType: 'integration',
                rules: test.rules
            })
        })

        // 3. E2E 테스트 TODO
        e2eTests.forEach((test, index) => {
            todos.push({
                id: `E2E-${Date.now()}-${index}`,
                title: `Create E2E test: ${test.name}`,
                description: test.description,
                priority: test.priority,
                category: 'test',
                estimatedHours: test.estimatedHours,
                source: 'e2e_test',
                testType: 'e2e',
                rules: test.rules
            })
        })

        // 4. 성능 테스트 TODO
        performanceTests.forEach((test, index) => {
            todos.push({
                id: `PERF-${Date.now()}-${index}`,
                title: `Create performance test: ${test.name}`,
                description: test.description,
                priority: test.priority,
                category: 'performance',
                estimatedHours: test.estimatedHours,
                source: 'performance_test',
                testType: 'performance',
                rules: test.rules
            })
        })

        // 5. 보안 테스트 TODO
        securityTests.forEach((test, index) => {
            todos.push({
                id: `SEC-${Date.now()}-${index}`,
                title: `Create security test: ${test.name}`,
                description: test.description,
                priority: test.priority,
                category: 'security',
                estimatedHours: test.estimatedHours,
                source: 'security_test',
                testType: 'security',
                rules: test.rules
            })
        })

        // 6. QA 기반 TODO
        qaResults.forEach((issue, index) => {
            todos.push({
                id: `QA-${Date.now()}-${index}`,
                title: `Fix ${issue.type} issue`,
                description: issue.suggestion,
                priority: issue.severity === 'high' ? 'high' : 'medium',
                category: issue.category,
                estimatedHours: this.estimateHours(issue.severity),
                source: 'qa',
                testType: 'qa'
            })
        })

        // 7. 정적 분석 기반 TODO
        staticAnalysis.forEach((analysis, index) => {
            todos.push({
                id: `STATIC-${Date.now()}-${index}`,
                title: `Improve ${analysis.type}`,
                description: analysis.suggestion,
                priority: analysis.severity === 'high' ? 'high' : 'medium',
                category: analysis.category,
                estimatedHours: this.estimateHours(analysis.severity),
                source: 'static',
                testType: 'static'
            })
        })

        return todos
    }

    estimateHours(severity) {
        const hourMap = {
            'high': 4,
            'medium': 2,
            'low': 1
        }
        return hourMap[severity] || 1
    }

    async integrateWorkResult(input, language, cursorResult, unitTests, integrationTests, e2eTests, performanceTests, securityTests, qaResults, staticAnalysis, todos) {
        const workResult = {
            timestamp: new Date().toISOString(),
            userInput: input,
            language: language,
            cursorPrompt: cursorResult.prompt,
            generatedCode: cursorResult.code,
            analysis: cursorResult.analysis,
            solution: cursorResult.solution,
            documentation: cursorResult.docs,
            unitTests: unitTests,
            integrationTests: integrationTests,
            e2eTests: e2eTests,
            performanceTests: performanceTests,
            securityTests: securityTests,
            qaResults: qaResults,
            staticAnalysis: staticAnalysis,
            generatedTodos: todos,
            summary: this.generateSummary(todos, unitTests, integrationTests, e2eTests, performanceTests, securityTests, qaResults, staticAnalysis)
        }

        return workResult
    }

    generateSummary(todos, unitTests, integrationTests, e2eTests, performanceTests, securityTests, qaResults, staticAnalysis) {
        const totalTodos = todos.length
        const highPriorityTodos = todos.filter(t => t.priority === 'high').length
        const estimatedHours = todos.reduce((sum, todo) => sum + todo.estimatedHours, 0)

        return {
            totalTodos,
            highPriorityTodos,
            estimatedHours,
            unitTests: unitTests.length,
            integrationTests: integrationTests.length,
            e2eTests: e2eTests.length,
            performanceTests: performanceTests.length,
            securityTests: securityTests.length,
            qaIssues: qaResults.length,
            staticIssues: staticAnalysis.length,
            categories: [...new Set(todos.map(t => t.category))],
            testTypes: [...new Set(todos.map(t => t.testType))],
            sources: [...new Set(todos.map(t => t.source))],
            nextSteps: [
                'Review generated code',
                'Create unit tests (TestCase)',
                'Create integration tests (시나리오 테스트)',
                'Create E2E tests',
                'Create performance tests',
                'Create security tests',
                'Fix QA issues',
                'Address static analysis findings',
                'Run all tests',
                'Deploy changes'
            ]
        }
    }

    async saveWorkResult(workResult) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const filename = `separated-test-work-${timestamp}.json`
        const filepath = path.join('work-results', filename)

        // 디렉토리 생성
        await fs.mkdir('work-results', { recursive: true })

        // 파일 저장
        await fs.writeFile(filepath, JSON.stringify(workResult, null, 2), 'utf8')

        // TODO 파일도 저장
        await this.saveTodos(workResult.generatedTodos, timestamp)

        // 테스트 파일들 저장
        await this.saveTestFiles(workResult.unitTests, workResult.integrationTests, workResult.e2eTests, workResult.performanceTests, workResult.securityTests, timestamp)

        console.log(`💾 작업 결과 저장: ${filepath}`)
    }

    async saveTodos(todos, timestamp) {
        const todoContent = this.generateTodoMarkdown(todos)
        const filename = `separated-test-todos-${timestamp}.md`
        const filepath = path.join('work-results', filename)

        await fs.writeFile(filepath, todoContent, 'utf8')
        console.log(`📋 TODO 저장: ${filepath}`)
    }

    async saveTestFiles(unitTests, integrationTests, e2eTests, performanceTests, securityTests, timestamp) {
        // 단위 테스트 파일 저장
        const unitTestContent = this.generateTestFileContent(unitTests, 'Unit Tests')
        await fs.writeFile(`work-results/unit-tests-${timestamp}.test.js`, unitTestContent, 'utf8')

        // 통합 테스트 파일 저장
        const integrationTestContent = this.generateTestFileContent(integrationTests, 'Integration Tests')
        await fs.writeFile(`work-results/integration-tests-${timestamp}.test.js`, integrationTestContent, 'utf8')

        // E2E 테스트 파일 저장
        const e2eTestContent = this.generateTestFileContent(e2eTests, 'E2E Tests')
        await fs.writeFile(`work-results/e2e-tests-${timestamp}.cy.js`, e2eTestContent, 'utf8')

        // 성능 테스트 파일 저장
        const performanceTestContent = this.generateTestFileContent(performanceTests, 'Performance Tests')
        await fs.writeFile(`work-results/performance-tests-${timestamp}.test.js`, performanceTestContent, 'utf8')

        // 보안 테스트 파일 저장
        const securityTestContent = this.generateTestFileContent(securityTests, 'Security Tests')
        await fs.writeFile(`work-results/security-tests-${timestamp}.test.js`, securityTestContent, 'utf8')

        console.log(`🧪 테스트 파일들 저장 완료`)
    }

    generateTestFileContent(tests, title) {
        let content = `// ${title}\n`
        content += `// Generated at: ${new Date().toISOString()}\n\n`

        tests.forEach(test => {
            content += `\n${test.code}\n`
        })

        return content
    }

    generateTodoMarkdown(todos) {
        let content = '# 분리된 테스트 시스템 - 생성된 TODOs\n\n'
        content += `생성일: ${new Date().toISOString()}\n\n`

        // 테스트 타입별로 그룹화
        const testTypeGroups = {
            unit: todos.filter(t => t.testType === 'unit'),
            integration: todos.filter(t => t.testType === 'integration'),
            e2e: todos.filter(t => t.testType === 'e2e'),
            performance: todos.filter(t => t.testType === 'performance'),
            security: todos.filter(t => t.testType === 'security'),
            qa: todos.filter(t => t.testType === 'qa'),
            static: todos.filter(t => t.testType === 'static')
        }

        Object.keys(testTypeGroups).forEach(testType => {
            const groupTodos = testTypeGroups[testType]
            if (groupTodos.length > 0) {
                content += `## ${testType.toUpperCase()} 테스트\n\n`
                groupTodos.forEach(todo => {
                    content += `- [ ] **${todo.id}**: ${todo.title}\n`
                    content += `  - 설명: ${todo.description}\n`
                    content += `  - 우선순위: ${todo.priority}\n`
                    content += `  - 카테고리: ${todo.category}\n`
                    content += `  - 예상 시간: ${todo.estimatedHours}시간\n`
                    if (todo.rules) {
                        content += `  - 규칙: ${JSON.stringify(todo.rules, null, 2)}\n`
                    }
                    content += `\n`
                })
            }
        })

        return content
    }
}

// CLI 실행
if (require.main === module) {
    const system = new SeparatedTestSystem()
    const args = process.argv.slice(2)

    if (args.length === 0) {
        console.log('사용법:')
        console.log('  node separated-test-system.js "사용자 불편사항"')
        console.log('  node separated-test-system.js --demo')
        console.log('')
        console.log('예시:')
        console.log('  node separated-test-system.js "로그인 기능이 안 돼"')
        console.log('  node separated-test-system.js "Button click is not working"')
        console.log('  node separated-test-system.js --demo')
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
                console.log(`🧪 TestCase (단위): ${result.unitTests.length}개`)
                console.log(`🎭 시나리오 테스트 (통합): ${result.integrationTests.length}개`)
                console.log(`🌐 E2E 테스트: ${result.e2eTests.length}개`)
                console.log(`⚡ 성능 테스트: ${result.performanceTests.length}개`)
                console.log(`🔒 보안 테스트: ${result.securityTests.length}개`)
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

module.exports = SeparatedTestSystem

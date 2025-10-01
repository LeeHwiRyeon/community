#!/usr/bin/env node

/**
 * 자동화 콘솔 테스트 시스템
 * 
 * 1. 자동화 시스템들을 콘솔에서 실행
 * 2. 실시간 상태 모니터링
 * 3. 자동 테스트 시나리오 실행
 * 4. 결과 분석 및 리포트 생성
 */

const { spawn } = require('child_process')
const EventEmitter = require('events')
const fs = require('fs').promises
const path = require('path')

class AutomatedConsoleTest extends EventEmitter {
    constructor() {
        super()
        this.testResults = []
        this.isRunning = false
        this.processes = new Map()
        this.stats = {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            startTime: Date.now(),
            systems: {
                todo: { running: false, tests: 0, passed: 0 },
                qa: { running: false, tests: 0, passed: 0 },
                test: { running: false, tests: 0, passed: 0 },
                manager: { running: false, tests: 0, passed: 0 }
            }
        }
    }

    async start() {
        console.log('🚀 자동화 콘솔 테스트 시스템 시작...')
        console.log('='.repeat(60))

        this.isRunning = true

        // 1. 자동화 시스템들 시작
        await this.startAutomatedSystems()

        // 2. 실시간 모니터링 시작
        this.startRealtimeMonitoring()

        // 3. 자동 테스트 시나리오 실행
        await this.runAutomatedTestScenarios()

        console.log('✅ 자동화 콘솔 테스트가 시작되었습니다!')
    }

    async startAutomatedSystems() {
        const systems = [
            { name: 'TODO Generator', script: 'auto-todo-generator.js', args: [] },
            { name: 'Manager System', script: 'manager-centric-system.js', args: [] },
            { name: 'Cursor QA Demo', script: 'complete-cursor-qa-system.js', args: ['--demo'] },
            { name: 'Test System Demo', script: 'separated-test-system.js', args: ['--demo'] },
            { name: 'Queue System', script: 'queue-based-system.js', args: [] }
        ]

        console.log('🔧 자동화 시스템들 시작 중...')

        for (const system of systems) {
            try {
                const childProcess = spawn('node', [`scripts/${system.script}`, ...system.args], {
                    stdio: 'pipe',
                    cwd: process.cwd(),
                    detached: false
                })

                let output = ''
                let errorOutput = ''

                childProcess.stdout.on('data', (data) => {
                    output += data.toString()
                    this.handleSystemOutput(system.name, data.toString())
                })

                childProcess.stderr.on('data', (data) => {
                    errorOutput += data.toString()
                    this.handleSystemError(system.name, data.toString())
                })

                childProcess.on('close', (code) => {
                    this.handleSystemClose(system.name, code, output, errorOutput)
                })

                childProcess.on('error', (error) => {
                    this.handleSystemError(system.name, error.message)
                })

                this.processes.set(system.name, {
                    process: childProcess,
                    output,
                    errorOutput,
                    startTime: Date.now(),
                    status: 'running'
                })

                console.log(`✅ ${system.name} 시작됨 (PID: ${childProcess.pid})`)

                // 시스템별 상태 업데이트
                const systemKey = this.getSystemKey(system.name)
                if (systemKey) {
                    this.stats.systems[systemKey].running = true
                }

            } catch (error) {
                console.error(`❌ ${system.name} 시작 실패:`, error.message)
            }
        }
    }

    getSystemKey(systemName) {
        const keyMap = {
            'TODO Generator': 'todo',
            'Manager System': 'manager',
            'Cursor QA Demo': 'qa',
            'Test System Demo': 'test',
            'Queue System': 'queue'
        }
        return keyMap[systemName]
    }

    handleSystemOutput(systemName, output) {
        // 실시간 출력 처리
        const lines = output.split('\n').filter(line => line.trim())

        for (const line of lines) {
            if (line.includes('✅') || line.includes('완료')) {
                this.stats.totalTests++
                this.stats.passedTests++

                const systemKey = this.getSystemKey(systemName)
                if (systemKey && this.stats.systems[systemKey]) {
                    this.stats.systems[systemKey].tests++
                    this.stats.systems[systemKey].passed++
                }

                this.emit('testPassed', { system: systemName, output: line })
            } else if (line.includes('❌') || line.includes('실패')) {
                this.stats.totalTests++
                this.stats.failedTests++

                const systemKey = this.getSystemKey(systemName)
                if (systemKey && this.stats.systems[systemKey]) {
                    this.stats.systems[systemKey].tests++
                }

                this.emit('testFailed', { system: systemName, output: line })
            }
        }
    }

    handleSystemError(systemName, error) {
        console.error(`❌ ${systemName} 오류:`, error)
        this.emit('systemError', { system: systemName, error })
    }

    handleSystemClose(systemName, code, output, errorOutput) {
        const processInfo = this.processes.get(systemName)
        if (processInfo) {
            const duration = Date.now() - processInfo.startTime
            processInfo.status = 'closed'
            processInfo.exitCode = code
            processInfo.duration = duration

            console.log(`🔚 ${systemName} 종료됨 (코드: ${code}, 시간: ${duration}ms)`)

            // 결과 저장
            this.testResults.push({
                system: systemName,
                exitCode: code,
                duration: duration,
                output: output,
                error: errorOutput,
                success: code === 0,
                timestamp: new Date().toISOString()
            })

            const systemKey = this.getSystemKey(systemName)
            if (systemKey) {
                this.stats.systems[systemKey].running = false
            }
        }
    }

    startRealtimeMonitoring() {
        // 3초마다 상태 출력
        setInterval(() => {
            if (this.isRunning) {
                this.printRealtimeStatus()
            }
        }, 3000)

        // 10초마다 상세 리포트
        setInterval(() => {
            if (this.isRunning) {
                this.printDetailedReport()
            }
        }, 10000)
    }

    printRealtimeStatus() {
        const uptime = Date.now() - this.stats.startTime
        const uptimeSeconds = Math.floor(uptime / 1000)

        console.log('\n📊 실시간 자동화 상태:')
        console.log(`⏱️  가동 시간: ${uptimeSeconds}초`)
        console.log(`📈 총 테스트: ${this.stats.totalTests}개`)
        console.log(`✅ 성공: ${this.stats.passedTests}개`)
        console.log(`❌ 실패: ${this.stats.failedTests}개`)

        if (this.stats.totalTests > 0) {
            const successRate = ((this.stats.passedTests / this.stats.totalTests) * 100).toFixed(1)
            console.log(`📊 성공률: ${successRate}%`)
        }

        console.log(`🔧 실행 중인 시스템: ${Array.from(this.processes.values()).filter(p => p.status === 'running').length}개`)

        // 시스템별 상태
        Object.entries(this.stats.systems).forEach(([key, system]) => {
            const status = system.running ? '🔄' : '💤'
            console.log(`  ${status} ${key.toUpperCase()}: ${system.tests}개 테스트 (${system.passed}개 성공)`)
        })
    }

    printDetailedReport() {
        console.log('\n📋 상세 자동화 리포트:')
        console.log('='.repeat(50))

        this.testResults.forEach(result => {
            const status = result.success ? '✅' : '❌'
            console.log(`${status} ${result.system}: ${result.duration}ms (코드: ${result.exitCode})`)
        })

        // 성능 분석
        if (this.testResults.length > 0) {
            const avgDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0) / this.testResults.length
            const fastest = Math.min(...this.testResults.map(r => r.duration))
            const slowest = Math.max(...this.testResults.map(r => r.duration))

            console.log(`\n⚡ 성능 분석:`)
            console.log(`  평균 처리 시간: ${avgDuration.toFixed(0)}ms`)
            console.log(`  최고 속도: ${fastest}ms`)
            console.log(`  최저 속도: ${slowest}ms`)
        }
    }

    async runAutomatedTestScenarios() {
        console.log('\n🧪 자동 테스트 시나리오 실행 중...')

        const scenarios = [
            {
                name: '기본 기능 테스트',
                tests: [
                    () => this.testBasicFunctionality(),
                    () => this.testErrorHandling(),
                    () => this.testPerformance()
                ]
            },
            {
                name: '통합 테스트',
                tests: [
                    () => this.testSystemIntegration(),
                    () => this.testDataFlow(),
                    () => this.testConcurrency()
                ]
            },
            {
                name: '부하 테스트',
                tests: [
                    () => this.testLoadHandling(),
                    () => this.testMemoryUsage(),
                    () => this.testResourceManagement()
                ]
            }
        ]

        for (const scenario of scenarios) {
            console.log(`\n🎯 ${scenario.name} 시작...`)

            for (const test of scenario.tests) {
                try {
                    await test()
                    console.log(`  ✅ 테스트 통과`)
                } catch (error) {
                    console.log(`  ❌ 테스트 실패: ${error.message}`)
                }
            }
        }
    }

    async testBasicFunctionality() {
        // 기본 기능 테스트
        const runningSystems = Array.from(this.processes.values()).filter(p => p.status === 'running')
        if (runningSystems.length === 0) {
            throw new Error('실행 중인 시스템이 없습니다')
        }

        // 각 시스템이 정상적으로 출력을 생성하는지 확인
        for (const [name, processInfo] of this.processes) {
            if (processInfo.status === 'running' && processInfo.output.length === 0) {
                throw new Error(`${name}에서 출력이 없습니다`)
            }
        }
    }

    async testErrorHandling() {
        // 오류 처리 테스트
        const errorCount = Array.from(this.processes.values()).reduce((count, p) => {
            return count + (p.errorOutput ? p.errorOutput.split('\n').length : 0)
        }, 0)

        if (errorCount > 10) {
            throw new Error(`너무 많은 오류가 발생했습니다: ${errorCount}개`)
        }
    }

    async testPerformance() {
        // 성능 테스트
        const avgDuration = this.testResults.length > 0
            ? this.testResults.reduce((sum, r) => sum + r.duration, 0) / this.testResults.length
            : 0

        if (avgDuration > 30000) { // 30초 이상
            throw new Error(`평균 처리 시간이 너무 깁니다: ${avgDuration}ms`)
        }
    }

    async testSystemIntegration() {
        // 시스템 통합 테스트
        const runningCount = Array.from(this.processes.values()).filter(p => p.status === 'running').length
        if (runningCount < 2) {
            throw new Error('충분한 시스템이 실행되지 않았습니다')
        }
    }

    async testDataFlow() {
        // 데이터 흐름 테스트
        const totalOutput = Array.from(this.processes.values()).reduce((total, p) => {
            return total + (p.output ? p.output.length : 0)
        }, 0)

        if (totalOutput < 1000) {
            throw new Error('충분한 데이터가 생성되지 않았습니다')
        }
    }

    async testConcurrency() {
        // 동시성 테스트
        const concurrentSystems = Array.from(this.processes.values()).filter(p => p.status === 'running').length
        if (concurrentSystems < 3) {
            throw new Error('충분한 동시 실행이 이루어지지 않았습니다')
        }
    }

    async testLoadHandling() {
        // 부하 처리 테스트
        const totalTests = this.stats.totalTests
        if (totalTests < 5) {
            throw new Error('충분한 테스트가 실행되지 않았습니다')
        }
    }

    async testMemoryUsage() {
        // 메모리 사용량 테스트
        const memUsage = process.memoryUsage()
        if (memUsage.heapUsed > 100 * 1024 * 1024) { // 100MB 이상
            throw new Error(`메모리 사용량이 너무 높습니다: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`)
        }
    }

    async testResourceManagement() {
        // 리소스 관리 테스트
        const processCount = this.processes.size
        if (processCount === 0) {
            throw new Error('프로세스가 관리되지 않고 있습니다')
        }
    }

    async stop() {
        console.log('\n🛑 자동화 콘솔 테스트 종료 중...')
        this.isRunning = false

        // 모든 프로세스 종료
        for (const [name, processInfo] of this.processes) {
            if (processInfo.status === 'running') {
                console.log(`🔄 ${name} 종료 중...`)
                processInfo.process.kill('SIGTERM')
            }
        }

        // 최종 리포트 생성
        await this.generateFinalReport()

        console.log('✅ 자동화 콘솔 테스트가 완료되었습니다!')
    }

    async generateFinalReport() {
        const report = {
            timestamp: new Date().toISOString(),
            duration: Date.now() - this.stats.startTime,
            summary: {
                totalTests: this.stats.totalTests,
                passedTests: this.stats.passedTests,
                failedTests: this.stats.failedTests,
                successRate: this.stats.totalTests > 0 ? ((this.stats.passedTests / this.stats.totalTests) * 100).toFixed(1) : 0
            },
            systems: this.stats.systems,
            results: this.testResults,
            performance: {
                averageDuration: this.testResults.length > 0 ? this.testResults.reduce((sum, r) => sum + r.duration, 0) / this.testResults.length : 0,
                fastestTest: this.testResults.length > 0 ? Math.min(...this.testResults.map(r => r.duration)) : 0,
                slowestTest: this.testResults.length > 0 ? Math.max(...this.testResults.map(r => r.duration)) : 0
            }
        }

        const filename = `reports/automated-console-test-${Date.now()}.json`
        await fs.writeFile(filename, JSON.stringify(report, null, 2))
        console.log(`📄 최종 리포트 저장: ${filename}`)
    }
}

// 실행
if (require.main === module) {
    const test = new AutomatedConsoleTest()

    // 시그널 핸들러
    process.on('SIGINT', async () => {
        await test.stop()
        process.exit(0)
    })

    // 60초 후 자동 종료
    setTimeout(async () => {
        await test.stop()
        process.exit(0)
    }, 60000)

    test.start().catch(console.error)
}

module.exports = AutomatedConsoleTest

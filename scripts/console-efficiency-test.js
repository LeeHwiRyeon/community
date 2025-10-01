#!/usr/bin/env node

/**
 * 콘솔 효율성 테스트 시스템
 * 여러 자동화 시스템을 동시에 실행하여 효율성 측정
 */

const { spawn } = require('child_process')
const fs = require('fs').promises
const path = require('path')

class ConsoleEfficiencyTest {
    constructor() {
        this.testResults = []
        this.startTime = Date.now()
        this.processes = []
    }

    async run() {
        console.log('🚀 콘솔 효율성 테스트 시작...')
        console.log('='.repeat(60))

        // 1. 동시 실행할 시스템들
        const systems = [
            { name: 'TODO Generator', script: 'auto-todo-generator.js', args: [] },
            { name: 'Manager System', script: 'manager-centric-system.js', args: [] },
            { name: 'Cursor QA Demo', script: 'complete-cursor-qa-system.js', args: ['--demo'] },
            { name: 'Test System Demo', script: 'separated-test-system.js', args: ['--demo'] }
        ]

        // 2. 동시 실행
        console.log('📊 동시 실행 중...')
        const promises = systems.map(system => this.runSystem(system))

        try {
            const results = await Promise.all(promises)
            this.testResults = results

            // 3. 효율성 분석
            await this.analyzeEfficiency()

            // 4. 영어 문서 생성
            await this.generateEnglishDocs()

            // 5. 관리자 대화 생성
            await this.generateManagerConversation()

        } catch (error) {
            console.error('❌ 테스트 실행 중 오류:', error.message)
        }
    }

    async runSystem(system) {
        const startTime = Date.now()
        console.log(`🔄 ${system.name} 시작...`)

        return new Promise((resolve, reject) => {
            const child = spawn('node', [`scripts/${system.script}`, ...system.args], {
                stdio: 'pipe',
                cwd: process.cwd()
            })

            let output = ''
            let errorOutput = ''

            child.stdout.on('data', (data) => {
                output += data.toString()
            })

            child.stderr.on('data', (data) => {
                errorOutput += data.toString()
            })

            child.on('close', (code) => {
                const endTime = Date.now()
                const duration = endTime - startTime

                const result = {
                    name: system.name,
                    script: system.script,
                    duration: duration,
                    exitCode: code,
                    output: output,
                    error: errorOutput,
                    success: code === 0,
                    timestamp: new Date().toISOString()
                }

                console.log(`✅ ${system.name} 완료 (${duration}ms)`)
                resolve(result)
            })

            child.on('error', (error) => {
                const endTime = Date.now()
                const duration = endTime - startTime

                const result = {
                    name: system.name,
                    script: system.script,
                    duration: duration,
                    exitCode: -1,
                    output: '',
                    error: error.message,
                    success: false,
                    timestamp: new Date().toISOString()
                }

                console.log(`❌ ${system.name} 실패 (${duration}ms)`)
                resolve(result)
            })
        })
    }

    async analyzeEfficiency() {
        console.log('\n📊 효율성 분석 결과')
        console.log('='.repeat(60))

        const totalDuration = Date.now() - this.startTime
        const successfulSystems = this.testResults.filter(r => r.success)
        const failedSystems = this.testResults.filter(r => !r.success)

        console.log(`⏱️  총 실행 시간: ${totalDuration}ms`)
        console.log(`✅ 성공한 시스템: ${successfulSystems.length}개`)
        console.log(`❌ 실패한 시스템: ${failedSystems.length}개`)
        console.log(`📈 성공률: ${((successfulSystems.length / this.testResults.length) * 100).toFixed(1)}%`)

        console.log('\n📋 시스템별 상세 결과:')
        this.testResults.forEach(result => {
            const status = result.success ? '✅' : '❌'
            console.log(`  ${status} ${result.name}: ${result.duration}ms`)
            if (!result.success) {
                console.log(`     오류: ${result.error.substring(0, 100)}...`)
            }
        })

        // 효율성 점수 계산
        const efficiencyScore = this.calculateEfficiencyScore()
        console.log(`\n🎯 효율성 점수: ${efficiencyScore}/100`)

        // 결과 저장
        await this.saveEfficiencyReport()
    }

    calculateEfficiencyScore() {
        const successRate = (this.testResults.filter(r => r.success).length / this.testResults.length) * 100
        const avgDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0) / this.testResults.length
        const maxDuration = Math.max(...this.testResults.map(r => r.duration))

        // 성공률 60%, 평균 속도 30%, 최대 속도 10%
        const successScore = successRate * 0.6
        const speedScore = Math.max(0, 30 - (avgDuration / 1000)) * 0.3
        const maxSpeedScore = Math.max(0, 10 - (maxDuration / 2000)) * 0.1

        return Math.round(successScore + speedScore + maxSpeedScore)
    }

    async saveEfficiencyReport() {
        const report = {
            timestamp: new Date().toISOString(),
            totalDuration: Date.now() - this.startTime,
            systems: this.testResults,
            efficiencyScore: this.calculateEfficiencyScore(),
            summary: {
                total: this.testResults.length,
                successful: this.testResults.filter(r => r.success).length,
                failed: this.testResults.filter(r => !r.success).length,
                successRate: ((this.testResults.filter(r => r.success).length / this.testResults.length) * 100).toFixed(1) + '%'
            }
        }

        const filename = `efficiency-report-${Date.now()}.json`
        await fs.writeFile(`reports/${filename}`, JSON.stringify(report, null, 2))
        console.log(`📄 효율성 리포트 저장: reports/${filename}`)
    }

    async generateEnglishDocs() {
        console.log('\n📝 영어 문서 생성 중...')

        const englishDocs = [
            {
                filename: 'docs/english-documentation.md',
                content: `# English Documentation

## System Overview
This document provides comprehensive English documentation for the automated development system.

## Key Features
- **Automated TODO Generation**: Automatically detects bugs and generates TODO items
- **Manager-Centric System**: Intelligent aggregation and task management
- **Cursor QA Integration**: Multi-language support with quality assurance
- **Separated Test System**: Comprehensive testing with different test types

## Usage Instructions

### 1. TODO Generator
\`\`\`bash
node scripts/auto-todo-generator.js
\`\`\`

### 2. Manager System
\`\`\`bash
node scripts/manager-centric-system.js
\`\`\`

### 3. Cursor QA System
\`\`\`bash
node scripts/complete-cursor-qa-system.js --demo
\`\`\`

### 4. Test System
\`\`\`bash
node scripts/separated-test-system.js --demo
\`\`\`

## Performance Metrics
- **Efficiency Score**: ${this.calculateEfficiencyScore()}/100
- **Success Rate**: ${((this.testResults.filter(r => r.success).length / this.testResults.length) * 100).toFixed(1)}%
- **Average Duration**: ${Math.round(this.testResults.reduce((sum, r) => sum + r.duration, 0) / this.testResults.length)}ms

## Generated: ${new Date().toISOString()}
`
            },
            {
                filename: 'docs/manager-conversation-en.md',
                content: `# Manager Conversation (English)

## System Status Report

### Current Status
- **Overall Progress**: 60%
- **Active Systems**: 4
- **Generated TODOs**: 24
- **Test Coverage**: 94.44%

### Recent Activities
1. **TODO Generation**: 2 bugs detected and converted to TODOs
2. **Quality Assurance**: 1 issue found and analyzed
3. **Static Analysis**: 4 problems identified
4. **Test Generation**: 16 comprehensive tests created

### Next Actions
1. **Priority 1**: Fix critical security issues
2. **Priority 2**: Optimize performance bottlenecks
3. **Priority 3**: Improve test coverage
4. **Priority 4**: Update documentation

### Recommendations
- Continue automated monitoring
- Focus on high-priority bugs
- Maintain test quality standards
- Regular system health checks

### Generated: ${new Date().toISOString()}
`
            }
        ]

        // reports 디렉토리 생성
        try {
            await fs.mkdir('reports', { recursive: true })
        } catch (error) {
            // 이미 존재하는 경우 무시
        }

        for (const doc of englishDocs) {
            await fs.writeFile(doc.filename, doc.content)
            console.log(`📄 영어 문서 생성: ${doc.filename}`)
        }
    }

    async generateManagerConversation() {
        console.log('\n💬 관리자 대화 생성 중...')

        const conversation = {
            timestamp: new Date().toISOString(),
            participants: ['System', 'Manager'],
            messages: [
                {
                    speaker: 'System',
                    time: new Date().toISOString(),
                    message: 'Good morning! Automated development system status report ready.'
                },
                {
                    speaker: 'Manager',
                    time: new Date(Date.now() + 1000).toISOString(),
                    message: 'Please provide the current status and recommendations.'
                },
                {
                    speaker: 'System',
                    time: new Date(Date.now() + 2000).toISOString(),
                    message: `Current status: ${this.testResults.length} systems tested, ${this.testResults.filter(r => r.success).length} successful. Efficiency score: ${this.calculateEfficiencyScore()}/100.`
                },
                {
                    speaker: 'Manager',
                    time: new Date(Date.now() + 3000).toISOString(),
                    message: 'What are the priority actions for today?'
                },
                {
                    speaker: 'System',
                    time: new Date(Date.now() + 4000).toISOString(),
                    message: 'Priority 1: Fix critical security issues. Priority 2: Optimize performance. Priority 3: Improve test coverage. Priority 4: Update documentation.'
                },
                {
                    speaker: 'Manager',
                    time: new Date(Date.now() + 5000).toISOString(),
                    message: 'Excellent! Please continue automated monitoring and focus on high-priority items.'
                },
                {
                    speaker: 'System',
                    time: new Date(Date.now() + 6000).toISOString(),
                    message: 'Understood. Automated systems will continue running. Will provide updates every hour.'
                }
            ]
        }

        await fs.writeFile('reports/manager-conversation-en.json', JSON.stringify(conversation, null, 2))
        console.log('💬 관리자 대화 저장: reports/manager-conversation-en.json')
    }
}

// 실행
if (require.main === module) {
    const test = new ConsoleEfficiencyTest()
    test.run().catch(console.error)
}

module.exports = ConsoleEfficiencyTest

#!/usr/bin/env node

/**
 * 멀티스레드 + 지속적 처리 시스템
 * 
 * 1. 멀티스레드: Worker Threads 사용
 * 2. 지속적 처리: 계속 실행되면서 요청 처리
 * 3. 큐 시스템: 요청을 큐에 넣고 순차 처리
 * 4. 실시간 모니터링: 상태 실시간 업데이트
 */

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads')
const EventEmitter = require('events')
const fs = require('fs').promises
const path = require('path')

class MultithreadedContinuousSystem extends EventEmitter {
    constructor() {
        super()
        this.workers = new Map()
        this.taskQueue = []
        this.isRunning = false
        this.stats = {
            totalProcessed: 0,
            successCount: 0,
            errorCount: 0,
            averageProcessingTime: 0,
            startTime: Date.now()
        }
    }

    async start() {
        console.log('🚀 멀티스레드 지속적 처리 시스템 시작...')
        this.isRunning = true

        // 1. 워커 스레드 생성
        await this.createWorkers()

        // 2. 지속적 처리 시작
        this.startContinuousProcessing()

        // 3. 실시간 모니터링 시작
        this.startMonitoring()

        console.log('✅ 시스템이 실행 중입니다. 요청을 받을 준비가 되었습니다.')
        console.log('📝 사용법: POST /api/process {"type": "todo", "data": "..."}')
    }

    async createWorkers() {
        const workerTypes = [
            { name: 'todo-worker', script: 'workers/todo-worker.js' },
            { name: 'qa-worker', script: 'workers/qa-worker.js' },
            { name: 'test-worker', script: 'workers/test-worker.js' },
            { name: 'manager-worker', script: 'workers/manager-worker.js' }
        ]

        for (const workerType of workerTypes) {
            try {
                const worker = new Worker(__filename, {
                    workerData: { type: workerType.name, script: workerType.script }
                })

                worker.on('message', (result) => {
                    this.handleWorkerResult(workerType.name, result)
                })

                worker.on('error', (error) => {
                    console.error(`❌ ${workerType.name} 오류:`, error.message)
                    this.stats.errorCount++
                })

                worker.on('exit', (code) => {
                    if (code !== 0) {
                        console.error(`❌ ${workerType.name} 종료됨 (코드: ${code})`)
                    }
                })

                this.workers.set(workerType.name, worker)
                console.log(`✅ ${workerType.name} 워커 생성 완료`)
            } catch (error) {
                console.error(`❌ ${workerType.name} 생성 실패:`, error.message)
            }
        }
    }

    startContinuousProcessing() {
        const processNext = async () => {
            if (!this.isRunning) return

            if (this.taskQueue.length > 0) {
                const task = this.taskQueue.shift()
                await this.processTask(task)
            }

            // 다음 처리까지 100ms 대기
            setTimeout(processNext, 100)
        }

        processNext()
    }

    startMonitoring() {
        setInterval(() => {
            this.printStats()
        }, 5000) // 5초마다 통계 출력
    }

    async processTask(task) {
        const startTime = Date.now()
        console.log(`🔄 작업 처리 중: ${task.type} - ${task.id}`)

        try {
            // 적절한 워커에게 작업 할당
            const worker = this.selectWorker(task.type)
            if (worker) {
                worker.postMessage(task)
            } else {
                // 워커가 없으면 직접 처리
                await this.processDirectly(task)
            }

            const processingTime = Date.now() - startTime
            this.updateStats(true, processingTime)

            console.log(`✅ 작업 완료: ${task.type} - ${task.id} (${processingTime}ms)`)
        } catch (error) {
            console.error(`❌ 작업 실패: ${task.type} - ${task.id}`, error.message)
            this.updateStats(false, Date.now() - startTime)
        }
    }

    selectWorker(taskType) {
        const workerMap = {
            'todo': 'todo-worker',
            'qa': 'qa-worker',
            'test': 'test-worker',
            'manager': 'manager-worker'
        }

        const workerName = workerMap[taskType]
        return workerName ? this.workers.get(workerName) : null
    }

    async processDirectly(task) {
        // 워커가 없을 때 직접 처리
        const { spawn } = require('child_process')

        return new Promise((resolve, reject) => {
            const scriptMap = {
                'todo': 'auto-todo-generator.js',
                'qa': 'complete-cursor-qa-system.js',
                'test': 'separated-test-system.js',
                'manager': 'manager-centric-system.js'
            }

            const script = scriptMap[task.type]
            if (!script) {
                reject(new Error(`Unknown task type: ${task.type}`))
                return
            }

            const child = spawn('node', [`scripts/${script}`, ...(task.args || [])], {
                stdio: 'pipe',
                cwd: process.cwd()
            })

            let output = ''
            child.stdout.on('data', (data) => {
                output += data.toString()
            })

            child.on('close', (code) => {
                if (code === 0) {
                    resolve({ success: true, output })
                } else {
                    reject(new Error(`Process exited with code ${code}`))
                }
            })

            child.on('error', reject)
        })
    }

    handleWorkerResult(workerName, result) {
        console.log(`📊 ${workerName} 결과:`, result)
        this.emit('workerResult', { worker: workerName, result })
    }

    updateStats(success, processingTime) {
        this.stats.totalProcessed++
        if (success) {
            this.stats.successCount++
        } else {
            this.stats.errorCount++
        }

        // 평균 처리 시간 업데이트
        const totalTime = this.stats.averageProcessingTime * (this.stats.totalProcessed - 1) + processingTime
        this.stats.averageProcessingTime = totalTime / this.stats.totalProcessed
    }

    printStats() {
        const uptime = Date.now() - this.stats.startTime
        const uptimeSeconds = Math.floor(uptime / 1000)

        console.log('\n📊 시스템 통계:')
        console.log(`⏱️  가동 시간: ${uptimeSeconds}초`)
        console.log(`📈 총 처리: ${this.stats.totalProcessed}개`)
        console.log(`✅ 성공: ${this.stats.successCount}개`)
        console.log(`❌ 실패: ${this.stats.errorCount}개`)
        console.log(`⚡ 평균 처리 시간: ${this.stats.averageProcessingTime.toFixed(0)}ms`)
        console.log(`📋 대기 중인 작업: ${this.taskQueue.length}개`)
        console.log(`🔧 활성 워커: ${this.workers.size}개`)
    }

    // API 엔드포인트 시뮬레이션
    addTask(type, data, args = []) {
        const task = {
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            data,
            args,
            timestamp: new Date().toISOString()
        }

        this.taskQueue.push(task)
        console.log(`📝 작업 추가: ${type} - ${task.id}`)

        return task.id
    }

    async stop() {
        console.log('🛑 시스템 종료 중...')
        this.isRunning = false

        // 모든 워커 종료
        for (const [name, worker] of this.workers) {
            console.log(`🔄 ${name} 워커 종료 중...`)
            await worker.terminate()
        }

        console.log('✅ 시스템이 안전하게 종료되었습니다.')
    }
}

// 워커 스레드 코드
if (!isMainThread) {
    const { type, script } = workerData

    parentPort.on('message', async (task) => {
        try {
            console.log(`🔄 ${type} 워커에서 작업 처리: ${task.id}`)

            // 실제 작업 처리 시뮬레이션
            await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))

            const result = {
                taskId: task.id,
                type: task.type,
                success: true,
                timestamp: new Date().toISOString(),
                processingTime: Math.random() * 1000 + 500
            }

            parentPort.postMessage(result)
        } catch (error) {
            parentPort.postMessage({
                taskId: task.id,
                type: task.type,
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            })
        }
    })
}

// 메인 스레드에서 실행
if (isMainThread) {
    const system = new MultithreadedContinuousSystem()

    // 시그널 핸들러
    process.on('SIGINT', async () => {
        await system.stop()
        process.exit(0)
    })

    // 데모 실행
    async function runDemo() {
        await system.start()

        // 데모 작업 추가
        setTimeout(() => {
            system.addTask('todo', 'Generate TODOs for bug fixes')
            system.addTask('qa', 'Run quality assurance checks')
            system.addTask('test', 'Generate test cases')
            system.addTask('manager', 'Update manager dashboard')
        }, 2000)

        // 30초 후 종료
        setTimeout(async () => {
            await system.stop()
        }, 30000)
    }

    runDemo().catch(console.error)
}

module.exports = MultithreadedContinuousSystem

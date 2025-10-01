#!/usr/bin/env node

/**
 * 큐 기반 지속적 처리 시스템
 * 
 * 1. 큐 시스템: Redis 또는 메모리 큐 사용
 * 2. 지속적 처리: 계속 실행되면서 큐에서 작업 가져옴
 * 3. 우선순위 처리: 작업 우선순위에 따라 처리
 * 4. 실시간 대시보드: WebSocket으로 실시간 상태 전송
 */

const EventEmitter = require('events')
const fs = require('fs').promises
const path = require('path')

class QueueBasedSystem extends EventEmitter {
    constructor() {
        super()
        this.taskQueue = []
        this.priorityQueue = []
        this.isRunning = false
        this.workers = []
        this.maxWorkers = 4
        this.stats = {
            totalProcessed: 0,
            successCount: 0,
            errorCount: 0,
            queueSize: 0,
            activeWorkers: 0,
            startTime: Date.now()
        }
    }

    async start() {
        console.log('🚀 큐 기반 지속적 처리 시스템 시작...')
        this.isRunning = true

        // 1. 워커 풀 생성
        this.createWorkerPool()

        // 2. 큐 처리 시작
        this.startQueueProcessing()

        // 3. 실시간 모니터링
        this.startRealtimeMonitoring()

        console.log('✅ 시스템이 실행 중입니다. 큐에서 작업을 처리합니다.')
    }

    createWorkerPool() {
        for (let i = 0; i < this.maxWorkers; i++) {
            this.workers.push({
                id: i,
                busy: false,
                currentTask: null,
                processedCount: 0
            })
        }
        console.log(`🔧 ${this.maxWorkers}개 워커 풀 생성 완료`)
    }

    startQueueProcessing() {
        const processQueue = async () => {
            if (!this.isRunning) return

            // 1. 우선순위 큐에서 작업 가져오기
            if (this.priorityQueue.length > 0) {
                const task = this.priorityQueue.shift()
                await this.assignTask(task)
            }
            // 2. 일반 큐에서 작업 가져오기
            else if (this.taskQueue.length > 0) {
                const task = this.taskQueue.shift()
                await this.assignTask(task)
            }

            // 다음 처리까지 50ms 대기
            setTimeout(processQueue, 50)
        }

        processQueue()
    }

    startRealtimeMonitoring() {
        // 5초마다 통계 출력
        setInterval(() => {
            this.printRealtimeStats()
        }, 5000)

        // 1초마다 큐 상태 체크
        setInterval(() => {
            this.updateQueueStats()
        }, 1000)
    }

    async assignTask(task) {
        // 사용 가능한 워커 찾기
        const availableWorker = this.workers.find(w => !w.busy)

        if (availableWorker) {
            availableWorker.busy = true
            availableWorker.currentTask = task

            // 비동기로 작업 처리
            this.processTask(availableWorker, task)
        } else {
            // 모든 워커가 바쁘면 큐에 다시 추가
            this.addTaskToQueue(task)
        }
    }

    async processTask(worker, task) {
        const startTime = Date.now()
        console.log(`🔄 워커 ${worker.id}에서 작업 처리: ${task.type} - ${task.id}`)

        try {
            // 실제 작업 처리
            const result = await this.executeTask(task)

            const processingTime = Date.now() - startTime
            this.updateWorkerStats(worker, true, processingTime)

            console.log(`✅ 워커 ${worker.id} 작업 완료: ${task.type} - ${task.id} (${processingTime}ms)`)

            // 결과 이벤트 발생
            this.emit('taskCompleted', {
                workerId: worker.id,
                task,
                result,
                processingTime
            })

        } catch (error) {
            const processingTime = Date.now() - startTime
            this.updateWorkerStats(worker, false, processingTime)

            console.error(`❌ 워커 ${worker.id} 작업 실패: ${task.type} - ${task.id}`, error.message)

            // 오류 이벤트 발생
            this.emit('taskFailed', {
                workerId: worker.id,
                task,
                error: error.message,
                processingTime
            })
        } finally {
            // 워커 해제
            worker.busy = false
            worker.currentTask = null
        }
    }

    async executeTask(task) {
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
            let errorOutput = ''

            child.stdout.on('data', (data) => {
                output += data.toString()
            })

            child.stderr.on('data', (data) => {
                errorOutput += data.toString()
            })

            child.on('close', (code) => {
                if (code === 0) {
                    resolve({ success: true, output, errorOutput })
                } else {
                    reject(new Error(`Process exited with code ${code}: ${errorOutput}`))
                }
            })

            child.on('error', reject)
        })
    }

    updateWorkerStats(worker, success, processingTime) {
        this.stats.totalProcessed++
        if (success) {
            this.stats.successCount++
        } else {
            this.stats.errorCount++
        }
        worker.processedCount++
    }

    updateQueueStats() {
        this.stats.queueSize = this.taskQueue.length + this.priorityQueue.length
        this.stats.activeWorkers = this.workers.filter(w => w.busy).length
    }

    printRealtimeStats() {
        const uptime = Date.now() - this.stats.startTime
        const uptimeSeconds = Math.floor(uptime / 1000)

        console.log('\n📊 실시간 시스템 상태:')
        console.log(`⏱️  가동 시간: ${uptimeSeconds}초`)
        console.log(`📈 총 처리: ${this.stats.totalProcessed}개`)
        console.log(`✅ 성공: ${this.stats.successCount}개`)
        console.log(`❌ 실패: ${this.stats.errorCount}개`)
        console.log(`📋 큐 크기: ${this.stats.queueSize}개`)
        console.log(`🔧 활성 워커: ${this.stats.activeWorkers}/${this.maxWorkers}개`)

        // 워커별 상태
        this.workers.forEach(worker => {
            const status = worker.busy ? '🔄' : '💤'
            const task = worker.currentTask ? ` (${worker.currentTask.type})` : ''
            console.log(`  ${status} 워커 ${worker.id}: ${worker.processedCount}개 처리${task}`)
        })
    }

    // 작업 추가 메서드들
    addTask(type, data, args = [], priority = 'normal') {
        const task = {
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            data,
            args,
            priority,
            timestamp: new Date().toISOString()
        }

        if (priority === 'high') {
            this.priorityQueue.push(task)
            console.log(`📝 우선순위 작업 추가: ${type} - ${task.id}`)
        } else {
            this.taskQueue.push(task)
            console.log(`📝 일반 작업 추가: ${type} - ${task.id}`)
        }

        return task.id
    }

    addTaskToQueue(task) {
        if (task.priority === 'high') {
            this.priorityQueue.push(task)
        } else {
            this.taskQueue.push(task)
        }
    }

    // 큐 상태 조회
    getQueueStatus() {
        return {
            generalQueue: this.taskQueue.length,
            priorityQueue: this.priorityQueue.length,
            totalQueue: this.taskQueue.length + this.priorityQueue.length,
            activeWorkers: this.workers.filter(w => w.busy).length,
            totalWorkers: this.maxWorkers
        }
    }

    // 큐 비우기
    clearQueue() {
        this.taskQueue = []
        this.priorityQueue = []
        console.log('🗑️ 큐가 비워졌습니다.')
    }

    async stop() {
        console.log('🛑 시스템 종료 중...')
        this.isRunning = false

        // 모든 워커가 작업을 완료할 때까지 대기
        const waitForWorkers = () => {
            const busyWorkers = this.workers.filter(w => w.busy)
            if (busyWorkers.length > 0) {
                console.log(`⏳ ${busyWorkers.length}개 워커가 작업을 완료하는 중...`)
                setTimeout(waitForWorkers, 1000)
            } else {
                console.log('✅ 모든 워커가 안전하게 종료되었습니다.')
            }
        }

        waitForWorkers()
    }
}

// 데모 실행
async function runDemo() {
    const system = new QueueBasedSystem()

    // 이벤트 리스너
    system.on('taskCompleted', (data) => {
        console.log(`🎉 작업 완료 이벤트: 워커 ${data.workerId} - ${data.task.type}`)
    })

    system.on('taskFailed', (data) => {
        console.log(`💥 작업 실패 이벤트: 워커 ${data.workerId} - ${data.task.type}`)
    })

    // 시그널 핸들러
    process.on('SIGINT', async () => {
        await system.stop()
        process.exit(0)
    })

    await system.start()

    // 데모 작업들 추가
    setTimeout(() => {
        system.addTask('todo', 'Generate TODOs for bug fixes', [], 'high')
        system.addTask('qa', 'Run quality assurance checks', ['--demo'])
        system.addTask('test', 'Generate test cases', ['--demo'])
        system.addTask('manager', 'Update manager dashboard')
        system.addTask('todo', 'Generate additional TODOs', [], 'high')
    }, 2000)

    // 30초 후 종료
    setTimeout(async () => {
        await system.stop()
    }, 30000)
}

if (require.main === module) {
    runDemo().catch(console.error)
}

module.exports = QueueBasedSystem

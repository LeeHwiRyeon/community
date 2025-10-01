#!/usr/bin/env node

/**
 * 매니저 콘솔 인터페이스
 * 
 * 매니저가 자연어로 작업 요청을 입력하면 자동으로 Task를 생성하는 대화형 인터페이스
 */

const ManagerInputTaskGenerator = require('./manager-input-task-generator')
const fs = require('fs').promises
const path = require('path')

class ManagerConsoleInterface {
    constructor() {
        this.generator = new ManagerInputTaskGenerator()
        this.commands = {
            'help': this.showHelp.bind(this),
            'status': this.showStatus.bind(this),
            'list': this.listTasks.bind(this),
            'search': this.searchTasks.bind(this),
            'assign': this.assignTask.bind(this),
            'complete': this.completeTask.bind(this),
            'clear': this.clearScreen.bind(this),
            'exit': this.exit.bind(this),
            'quit': this.exit.bind(this)
        }
    }

    async start() {
        this.clearScreen()
        this.showWelcome()

        while (true) {
            try {
                const input = await this.generator.question('\n🎯 매니저 콘솔 > ')

                if (input.trim() === '') continue

                // 명령어 처리
                if (input.startsWith('/')) {
                    await this.handleCommand(input.substring(1))
                } else {
                    // 일반 입력은 Task 생성으로 처리
                    await this.handleTaskCreation(input)
                }

            } catch (error) {
                console.error('❌ 오류 발생:', error.message)
            }
        }
    }

    showWelcome() {
        console.log('🎯 매니저 콘솔 인터페이스')
        console.log('========================')
        console.log('')
        console.log('💡 사용법:')
        console.log('  - 자연어로 작업 요청을 입력하세요')
        console.log('  - 명령어는 /로 시작하세요 (예: /help)')
        console.log('  - 종료하려면 /exit 또는 /quit 입력')
        console.log('')
        console.log('📋 주요 명령어:')
        console.log('  /help     - 도움말 보기')
        console.log('  /status   - 시스템 상태 확인')
        console.log('  /list     - Task 목록 보기')
        console.log('  /search   - Task 검색')
        console.log('  /assign   - Task 할당')
        console.log('  /complete - Task 완료')
        console.log('  /clear    - 화면 지우기')
        console.log('')
    }

    async handleCommand(command) {
        const [cmd, ...args] = command.split(' ')

        if (this.commands[cmd]) {
            await this.commands[cmd](args)
        } else {
            console.log(`❌ 알 수 없는 명령어: ${cmd}`)
            console.log('💡 /help를 입력하여 사용 가능한 명령어를 확인하세요.')
        }
    }

    async handleTaskCreation(input) {
        console.log('\n🔍 입력 분석 중...')

        const task = await this.generator.analyzeInputAndCreateTask(input)

        if (task) {
            await this.generator.saveTask(task)
            await this.generator.displayTaskSummary(task)

            // 추가 작업 제안
            await this.suggestNextActions(task)
        }
    }

    async suggestNextActions(task) {
        console.log('\n💡 다음 작업 제안:')
        console.log('  /assign - Task 담당자 할당')
        console.log('  /list   - 전체 Task 목록 보기')
        console.log('  /status - 시스템 상태 확인')
    }

    async showHelp(args) {
        console.log('\n📚 도움말')
        console.log('==========')
        console.log('')
        console.log('🔧 명령어:')
        console.log('  /help     - 이 도움말을 표시합니다')
        console.log('  /status   - 현재 시스템 상태를 확인합니다')
        console.log('  /list     - 생성된 Task 목록을 표시합니다')
        console.log('  /search   - Task를 검색합니다')
        console.log('  /assign   - Task에 담당자를 할당합니다')
        console.log('  /complete - Task를 완료로 표시합니다')
        console.log('  /clear    - 화면을 지웁니다')
        console.log('  /exit     - 시스템을 종료합니다')
        console.log('')
        console.log('💬 자연어 입력:')
        console.log('  - 명령어가 아닌 모든 입력은 Task 생성으로 처리됩니다')
        console.log('  - 예: "로그인 버그 수정해줘"')
        console.log('  - 예: "새로운 사용자 관리 기능 추가"')
        console.log('  - 예: "성능 최적화 필요해"')
        console.log('')
    }

    async showStatus(args) {
        console.log('\n📊 시스템 상태')
        console.log('==============')

        try {
            // TODO 백로그 통계
            const todoContent = await fs.readFile(this.generator.todoBacklog, 'utf8')
            const taskCount = (todoContent.match(/\| AUTO-\d+ \|/g) || []).length
            const pendingCount = (todoContent.match(/\| AUTO-\d+ \| ⬜ \|/g) || []).length
            const completedCount = (todoContent.match(/\| AUTO-\d+ \| ✅ \|/g) || []).length

            console.log(`📋 총 Task 수: ${taskCount}`)
            console.log(`⏳ 대기 중: ${pendingCount}`)
            console.log(`✅ 완료: ${completedCount}`)
            console.log(`📈 완료율: ${taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0}%`)

            // 최근 생성된 Task
            const recentTasks = todoContent.split('\n')
                .filter(line => line.includes('AUTO-'))
                .slice(-5)

            if (recentTasks.length > 0) {
                console.log('\n🕒 최근 생성된 Task:')
                recentTasks.forEach(task => {
                    const parts = task.split('|').map(p => p.trim())
                    if (parts.length >= 4) {
                        console.log(`  ${parts[1]} ${parts[2]} ${parts[3]}`)
                    }
                })
            }

        } catch (error) {
            console.log('❌ 상태 정보를 가져올 수 없습니다.')
        }
    }

    async listTasks(args) {
        console.log('\n📋 Task 목록')
        console.log('============')

        try {
            const todoContent = await fs.readFile(this.generator.todoBacklog, 'utf8')
            const tasks = todoContent.split('\n')
                .filter(line => line.includes('AUTO-'))
                .map(line => {
                    const parts = line.split('|').map(p => p.trim())
                    return {
                        id: parts[1],
                        status: parts[2],
                        title: parts[3],
                        priority: parts[4],
                        category: parts[5],
                        assignee: parts[6],
                        hours: parts[7],
                        date: parts[8]
                    }
                })

            if (tasks.length === 0) {
                console.log('📝 생성된 Task가 없습니다.')
                return
            }

            // 필터링 옵션
            let filteredTasks = tasks
            if (args.length > 0) {
                const filter = args[0].toLowerCase()
                if (filter === 'pending') {
                    filteredTasks = tasks.filter(t => t.status === '⬜')
                } else if (filter === 'completed') {
                    filteredTasks = tasks.filter(t => t.status === '✅')
                } else if (filter === 'urgent') {
                    filteredTasks = tasks.filter(t => t.priority.includes('🔴'))
                }
            }

            console.log(`\n📊 표시된 Task: ${filteredTasks.length}개`)
            console.log('')

            filteredTasks.forEach(task => {
                console.log(`${task.id} | ${task.status} | ${task.title}`)
                console.log(`     우선순위: ${task.priority} | 카테고리: ${task.category} | 담당자: ${task.assignee} | 예상시간: ${task.hours}`)
                console.log('')
            })

        } catch (error) {
            console.log('❌ Task 목록을 가져올 수 없습니다.')
        }
    }

    async searchTasks(args) {
        if (args.length === 0) {
            console.log('❌ 검색어를 입력하세요. 예: /search 로그인')
            return
        }

        const searchTerm = args.join(' ').toLowerCase()
        console.log(`\n🔍 "${searchTerm}" 검색 결과`)
        console.log('========================')

        try {
            const todoContent = await fs.readFile(this.generator.todoBacklog, 'utf8')
            const tasks = todoContent.split('\n')
                .filter(line => line.includes('AUTO-') && line.toLowerCase().includes(searchTerm))

            if (tasks.length === 0) {
                console.log('📝 검색 결과가 없습니다.')
                return
            }

            tasks.forEach(task => {
                const parts = task.split('|').map(p => p.trim())
                if (parts.length >= 4) {
                    console.log(`${parts[1]} | ${parts[2]} | ${parts[3]}`)
                }
            })

        } catch (error) {
            console.log('❌ 검색을 수행할 수 없습니다.')
        }
    }

    async assignTask(args) {
        if (args.length < 2) {
            console.log('❌ 사용법: /assign <Task ID> <담당자명>')
            console.log('예: /assign AUTO-1 김개발')
            return
        }

        const taskId = args[0]
        const assignee = args.slice(1).join(' ')

        try {
            const todoContent = await fs.readFile(this.generator.todoBacklog, 'utf8')
            const updatedContent = todoContent.replace(
                new RegExp(`(\\| ${taskId} \\| [^|]+ \\| [^|]+ \\| [^|]+ \\| )[^|]+( \\|)`),
                `$1${assignee}$2`
            )

            await fs.writeFile(this.generator.todoBacklog, updatedContent, 'utf8')
            console.log(`✅ ${taskId} Task가 ${assignee}에게 할당되었습니다.`)

        } catch (error) {
            console.log('❌ Task 할당에 실패했습니다.')
        }
    }

    async completeTask(args) {
        if (args.length < 1) {
            console.log('❌ 사용법: /complete <Task ID>')
            console.log('예: /complete AUTO-1')
            return
        }

        const taskId = args[0]

        try {
            const todoContent = await fs.readFile(this.generator.todoBacklog, 'utf8')
            const updatedContent = todoContent.replace(
                new RegExp(`(\\| ${taskId} \\|) ⬜ (\\|)`),
                `$1 ✅ $2`
            )

            await fs.writeFile(this.generator.todoBacklog, updatedContent, 'utf8')
            console.log(`✅ ${taskId} Task가 완료로 표시되었습니다.`)

        } catch (error) {
            console.log('❌ Task 완료 처리에 실패했습니다.')
        }
    }

    clearScreen() {
        console.clear()
    }

    async exit(args) {
        console.log('\n👋 매니저 콘솔을 종료합니다.')
        console.log('📝 생성된 Task는 docs/todo-backlog.md에 저장되었습니다.')
        process.exit(0)
    }
}

// CLI 실행
if (require.main === module) {
    const interface = new ManagerConsoleInterface()
    interface.start().catch(console.error)
}

module.exports = ManagerConsoleInterface

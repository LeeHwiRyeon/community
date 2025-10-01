const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { spawn } = require('child_process');

class TaskResultCollector {
    constructor() {
        this.cursorApiUrl = 'http://localhost:3000/api/cursor';
        this.autoAgentPort = 55550;
        this.workflowResults = [];
        this.projectResults = [];
        this.isRunning = false;
        this.cursorServer = null;
    }

    async start() {
        console.log('🚀 작업 결과 수거기 시작...');
        console.log('=====================================');
        this.isRunning = true;

        // 1. Cursor 서버 시작
        await this.startCursorServer();
        await new Promise(resolve => setTimeout(resolve, 3000));

        while (this.isRunning) {
            try {
                // 2. 워크플로우 상태 확인
                await this.checkWorkflowStatus();

                // 3. 완료된 작업 결과 수거
                await this.collectCompletedResults();

                // 4. 프로젝트 생성 및 실행
                await this.generateAndExecuteProjects();

                // 5. 결과를 매니저에게 보고
                await this.reportToManager();

                // 6. 전체 로그 표시
                this.showCompleteLog();

                // 7. 다음 사이클 준비
                await this.prepareNextCycle();

            } catch (error) {
                console.error('❌ 작업 실행 오류:', error.message);
                break;
            }
        }
    }

    async startCursorServer() {
        console.log('🔌 Cursor 통합 서버 시작...');
        const serverPath = path.join(__dirname, 'core', 'cursor-integration-manager.js');

        this.cursorServer = spawn('node', [serverPath, '--port=3000', '--ws-port=3001'], {
            detached: true,
            stdio: 'pipe'
        });

        this.cursorServer.unref();
        console.log('✅ Cursor 서버 시작 완료');
    }

    async checkWorkflowStatus() {
        console.log('\n📊 워크플로우 상태 확인 중...');

        try {
            const response = await axios.get(`${this.cursorApiUrl}/workflows`);
            if (response.data.success) {
                const workflows = response.data.data;
                console.log(`📋 활성 워크플로우: ${workflows.length}개`);

                for (const workflow of workflows) {
                    if (workflow.status === 'active') {
                        console.log(`⏳ 진행 중: ${workflow.title} (ID: ${workflow.id.substring(0, 8)}...)`);
                    }
                }
            }
        } catch (error) {
            console.log('⚠️ 워크플로우 상태 확인 실패:', error.message);
        }
    }

    async collectCompletedResults() {
        console.log('\n📥 완료된 작업 결과 수거 중...');

        try {
            const response = await axios.get(`${this.cursorApiUrl}/workflows`);
            if (response.data.success) {
                const workflows = response.data.data;

                for (const workflow of workflows) {
                    if (workflow.status === 'completed' || workflow.metadata?.progress === 100) {
                        const result = {
                            workflowId: workflow.id,
                            title: workflow.title,
                            description: workflow.description,
                            priority: workflow.priority,
                            category: workflow.category,
                            completedAt: workflow.updatedAt,
                            tasks: workflow.tasks || [],
                            todos: workflow.todos || [],
                            progress: workflow.metadata?.progress || 0
                        };

                        this.workflowResults.push(result);
                        console.log(`✅ 결과 수거 완료: ${workflow.title}`);
                    }
                }
            }
        } catch (error) {
            console.log('⚠️ 결과 수거 실패:', error.message);
        }
    }

    async generateAndExecuteProjects() {
        console.log('\n🔄 프로젝트 생성 및 실행 중...');

        for (const result of this.workflowResults) {
            if (result.progress === 100) {
                const projectResult = await this.createProjectFromResult(result);
                this.projectResults.push(projectResult);
            }
        }
    }

    async createProjectFromResult(workflowResult) {
        console.log(`📁 프로젝트 생성: ${workflowResult.title}`);

        const projectName = `result-${Date.now()}-${workflowResult.workflowId.substring(0, 8)}`;
        const projectDir = path.join(__dirname, 'test-projects', projectName);

        // 프로젝트 디렉토리 생성
        if (!fs.existsSync(projectDir)) {
            fs.mkdirSync(projectDir, { recursive: true });
        }

        // navigation-test-project.html을 기반으로 새 프로젝트 생성
        const sourceFile = path.join(__dirname, 'navigation-test-project.html');
        const targetFile = path.join(projectDir, 'index.html');

        if (fs.existsSync(sourceFile)) {
            let content = fs.readFileSync(sourceFile, 'utf8');

            // 프로젝트별로 내용 수정
            content = content.replace('AutoAgent 네비게이션 테스트 프로젝트', `${projectName} - ${workflowResult.title}`);
            content = content.replace('AutoAgent Navigation Test Project', `${projectName} - ${workflowResult.title}`);

            // 워크플로우 결과 반영
            const resultFeatures = this.generateResultFeatures(workflowResult);
            content = content.replace('// 초기화', `// 초기화\n        ${resultFeatures}`);

            fs.writeFileSync(targetFile, content);
        }

        // package.json 생성
        const packageJson = {
            "name": projectName,
            "version": "1.0.0",
            "description": workflowResult.title,
            "main": "index.html",
            "scripts": {
                "start": "echo 'Project started'",
                "build": "echo 'Build completed'"
            },
            "workflow": {
                "id": workflowResult.workflowId,
                "priority": workflowResult.priority,
                "category": workflowResult.category,
                "completedAt": workflowResult.completedAt
            }
        };

        fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify(packageJson, null, 2));

        // README.md 생성
        const readme = `# ${projectName}\n\n${workflowResult.title}\n\n## 워크플로우 정보\n- ID: ${workflowResult.workflowId}\n- 우선순위: ${workflowResult.priority}\n- 카테고리: ${workflowResult.category}\n- 완료 시간: ${workflowResult.completedAt}\n\n## 작업 목록\n${workflowResult.tasks.map(task => `- ${task.title}`).join('\n')}\n\n## TODO 목록\n${workflowResult.todos.map(todo => `- ${todo.title}`).join('\n')}`;

        fs.writeFileSync(path.join(projectDir, 'README.md'), readme);

        // 프로젝트 실행
        await this.runProject(projectName, projectDir);

        return {
            projectName: projectName,
            projectDir: projectDir,
            title: workflowResult.title,
            workflowId: workflowResult.workflowId,
            priority: workflowResult.priority,
            category: workflowResult.category,
            completedAt: workflowResult.completedAt,
            status: 'created'
        };
    }

    generateResultFeatures(workflowResult) {
        const features = [
            `console.log('🚀 ${workflowResult.title} 프로젝트 로드 완료!');`,
            `console.log('📋 워크플로우 ID: ${workflowResult.workflowId}');`,
            `console.log('🎯 우선순위: ${workflowResult.priority}');`,
            `console.log('📂 카테고리: ${workflowResult.category}');`,
            `console.log('✅ 완료 시간: ${workflowResult.completedAt}');`,
            `console.log('📊 작업 수: ${workflowResult.tasks.length}개');`,
            `console.log('📋 TODO 수: ${workflowResult.todos.length}개');`
        ];

        return features.join('\n        ');
    }

    async runProject(projectName, projectDir) {
        console.log(`🚀 프로젝트 실행 중: ${projectName}`);

        try {
            // Windows에서 브라우저로 열기
            const indexPath = path.join(projectDir, 'index.html');
            const openCommand = process.platform === 'win32' ? 'start' :
                process.platform === 'darwin' ? 'open' : 'xdg-open';

            const child = spawn(openCommand, [indexPath], {
                cwd: projectDir,
                detached: true,
                stdio: 'ignore',
                shell: true
            });
            child.unref();

            console.log(`✅ ${projectName} 실행 완료 (PID: ${child.pid})`);

        } catch (error) {
            console.error(`❌ ${projectName} 실행 오류:`, error.message);
        }
    }

    async reportToManager() {
        console.log('\n📤 매니저에게 결과 보고 중...');

        const report = {
            timestamp: new Date().toISOString(),
            workflowResults: this.workflowResults.length,
            projectResults: this.projectResults.length,
            totalTasks: this.workflowResults.reduce((sum, wf) => sum + wf.tasks.length, 0),
            totalTodos: this.workflowResults.reduce((sum, wf) => sum + wf.todos.length, 0),
            completionRate: this.workflowResults.length > 0 ?
                (this.workflowResults.filter(wf => wf.progress === 100).length / this.workflowResults.length * 100).toFixed(1) : 0
        };

        // 보고서를 파일로 저장
        const reportPath = path.join(__dirname, 'work-results', 'task-result-report.json');
        if (!fs.existsSync(path.dirname(reportPath))) {
            fs.mkdirSync(path.dirname(reportPath), { recursive: true });
        }
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        console.log(`✅ 매니저 보고서 생성: ${reportPath}`);
        console.log(`📊 워크플로우 결과: ${report.workflowResults}개`);
        console.log(`📁 프로젝트 결과: ${report.projectResults}개`);
        console.log(`📋 총 작업: ${report.totalTasks}개`);
        console.log(`📝 총 TODO: ${report.totalTodos}개`);
        console.log(`📈 완료율: ${report.completionRate}%`);
    }

    showCompleteLog() {
        console.log('\n📊 전체 작업 로그');
        console.log('=====================================');
        console.log(`📋 워크플로우 결과: ${this.workflowResults.length}개`);
        console.log(`📁 프로젝트 결과: ${this.projectResults.length}개`);

        console.log('\n📋 워크플로우 결과 목록:');
        this.workflowResults.forEach((result, index) => {
            console.log(`${index + 1}. ${result.title}`);
            console.log(`   ID: ${result.workflowId}`);
            console.log(`   우선순위: ${result.priority} | 카테고리: ${result.category}`);
            console.log(`   작업: ${result.tasks.length}개 | TODO: ${result.todos.length}개`);
            console.log(`   완료 시간: ${result.completedAt}`);
            console.log('');
        });

        console.log('\n📁 프로젝트 결과 목록:');
        this.projectResults.forEach((project, index) => {
            console.log(`${index + 1}. ${project.projectName} - ${project.title}`);
            console.log(`   워크플로우 ID: ${project.workflowId}`);
            console.log(`   우선순위: ${project.priority} | 카테고리: ${project.category}`);
            console.log(`   완료 시간: ${project.completedAt}`);
            console.log('');
        });

        console.log('=====================================');
    }

    async prepareNextCycle() {
        console.log('\n🔄 다음 사이클 준비 중...');

        // 10초 대기 후 다음 사이클
        console.log('⏳ 10초 후 다음 사이클 시작...');
        await new Promise(resolve => setTimeout(resolve, 10000));
    }

    stop() {
        this.isRunning = false;
        if (this.cursorServer) {
            this.cursorServer.kill();
        }
        console.log('🛑 작업 결과 수거기 중지됨');
    }
}

if (require.main === module) {
    const collector = new TaskResultCollector();
    collector.start().catch(console.error);

    // 프로세스 종료 시 정리
    process.on('SIGINT', () => {
        console.log('\nSIGINT 수신, 작업 결과 수거기 중지...');
        collector.stop();
        process.exit(0);
    });
}

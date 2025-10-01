const AdvancedTaskManager = require('./advanced-task-manager');

/**
 * 통합 오너 요청 처리 시스템
 * 
 * 기능:
 * 1. 중복 요청 감지 및 병합
 * 2. 관련 작업 그룹화
 * 3. 작업자 대기열 관리
 * 4. 타이밍 최적화
 * 5. 의존성 관리
 */
class IntegratedOwnerRequest {
    constructor() {
        this.taskManager = new AdvancedTaskManager();
        this.todoFile = 'work-results/owner-todos.md';
        this.documentFile = 'work-results/owner-requests.md';
        this.processedCount = 0;

        this.initializeFiles();
    }

    /**
     * 파일 초기화
     */
    initializeFiles() {
        // TODO 파일 초기화
        if (!require('fs').existsSync(this.todoFile)) {
            const todoContent = `# 오너 요청 TODO 목록 (고급 관리)

> **생성일**: ${new Date().toLocaleString('ko-KR')}  
> **상태**: 활성  
> **관리 시스템**: 통합 고급 Task 관리

## 📋 대기 중인 작업들

`;
            require('fs').writeFileSync(this.todoFile, todoContent);
        }

        // 문서 파일 초기화
        if (!require('fs').existsSync(this.documentFile)) {
            const docContent = `# 오너 요청 처리 문서 (고급 관리)

> **생성일**: ${new Date().toLocaleString('ko-KR')}  
> **상태**: 활성  
> **관리 시스템**: 통합 고급 Task 관리

## 📝 요청 처리 내역

`;
            require('fs').writeFileSync(this.documentFile, docContent);
        }
    }

    /**
     * 오너 요청 처리
     */
    async processOwnerRequest(content) {
        console.log('📥 오너 요청 수신:', content);

        const requestId = this.generateRequestId();

        try {
            // 1. 고급 Task 관리 시스템으로 처리
            const result = await this.taskManager.processRequest(content, requestId);

            // 2. 결과에 따른 후처리
            if (result.status === 'merged') {
                await this.handleMergedRequest(result, content);
            } else if (result.groupId) {
                await this.handleGroupedRequest(result, content);
            } else {
                await this.handleNewRequest(result, content);
            }

            // 3. 문서 업데이트
            await this.updateDocument(result, content);

            // 4. TODO 업데이트
            await this.updateTodo(result, content);

            this.processedCount++;

            console.log(`✅ 요청 처리 완료: ${requestId}`);
            console.log(`📊 총 처리된 요청: ${this.processedCount}개`);

            // 5. 시스템 상태 표시
            this.taskManager.showSystemStatus();

            return result;

        } catch (error) {
            console.error(`❌ 요청 처리 실패 (${requestId}):`, error);
            return { id: requestId, status: 'failed', error: error.message };
        }
    }

    /**
     * 병합된 요청 처리
     */
    async handleMergedRequest(result, content) {
        console.log(`🔗 중복 요청이 기존 Task에 병합됨: ${result.mergedWith}`);
        console.log(`📊 유사도: ${(result.similarity * 100).toFixed(1)}%`);
    }

    /**
     * 그룹화된 요청 처리
     */
    async handleGroupedRequest(result, content) {
        console.log(`📁 Task가 그룹에 추가됨: ${result.groupId}`);
        console.log(`📊 그룹 내 Task 수: ${this.taskManager.taskGroups.get(result.groupId)?.tasks.length || 0}개`);
    }

    /**
     * 새 요청 처리
     */
    async handleNewRequest(result, content) {
        console.log(`✨ 새 Task 생성됨: ${result.id}`);
        if (result.assignedTo) {
            console.log(`👤 작업자 할당: ${result.assignedTo}`);
        }
    }

    /**
     * 문서 업데이트
     */
    async updateDocument(result, content) {
        const timestamp = new Date().toLocaleString('ko-KR');
        const status = result.status === 'merged' ? '병합됨' :
            result.groupId ? '그룹화됨' : '새로 생성됨';

        const docEntry = `
### 요청 #${result.id}
- **수신 시간**: ${timestamp}
- **처리 상태**: ${status}
- **우선순위**: ${result.priority || 'N/A'}
- **카테고리**: ${result.category || 'N/A'}
- **예상 시간**: ${result.estimatedTime || 'N/A'}

**내용**:
${content}

${result.status === 'merged' ? `**병합된 Task**: ${result.mergedWith} (유사도: ${(result.similarity * 100).toFixed(1)}%)` : ''}
${result.groupId ? `**그룹**: ${result.groupId}` : ''}
${result.assignedTo ? `**할당된 작업자**: ${result.assignedTo}` : ''}

---

`;

        require('fs').appendFileSync(this.documentFile, docEntry);
        console.log(`📄 문서 업데이트 완료: ${result.id}`);
    }

    /**
     * TODO 업데이트
     */
    async updateTodo(result, content) {
        const timestamp = new Date().toLocaleString('ko-KR');
        const status = result.status === 'merged' ? '병합됨' :
            result.groupId ? '그룹화됨' : '새로 생성됨';

        const todoEntry = `
## ${result.category || 'general'} - ${result.id}
- **처리 상태**: ${status}
- **우선순위**: ${result.priority || 'N/A'}
- **예상 시간**: ${result.estimatedTime || 'N/A'}
- **수신 시간**: ${timestamp}

### 작업 내용
${content}

### 진행 상황
- [x] 요청 분석 완료
- [x] 중복/그룹화 검사 완료
- [x] Task 생성/병합 완료
${result.assignedTo ? '- [x] 작업자 할당 완료' : '- [ ] 작업자 할당 대기 중'}
- [ ] 작업 실행 중
- [ ] 완료

${result.status === 'merged' ? `### 병합 정보
- **병합된 Task**: ${result.mergedWith}
- **유사도**: ${(result.similarity * 100).toFixed(1)}%` : ''}

${result.groupId ? `### 그룹 정보
- **그룹 ID**: ${result.groupId}
- **그룹명**: ${this.taskManager.getGroupDisplayName(result.groupId)}` : ''}

---

`;

        require('fs').appendFileSync(this.todoFile, todoEntry);
        console.log(`📋 TODO 업데이트 완료: ${result.id}`);
    }

    /**
     * 요청 ID 생성
     */
    generateRequestId() {
        return 'REQ_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }

    /**
     * 시스템 상태 확인
     */
    showSystemStatus() {
        this.taskManager.showSystemStatus();
    }

    /**
     * 작업자 상태 확인
     */
    showWorkerStatus() {
        const workerStatus = this.taskManager.getWorkerStatus();
        console.log('\n👥 작업자 상태');
        console.log('==============');
        console.log(`총 작업자: ${workerStatus.total}명`);
        console.log(`사용 가능: ${workerStatus.available}명`);
        console.log(`작업 중: ${workerStatus.busy}명`);

        workerStatus.workers.forEach(worker => {
            const status = worker.status === 'available' ? '✅' : '🔄';
            const currentTask = worker.currentTask ? ` (${worker.currentTask})` : '';
            console.log(`${status} ${worker.name}: ${worker.status}${currentTask}`);
        });
    }

    /**
     * 그룹 상태 확인
     */
    showGroupStatus() {
        const groupStatus = this.taskManager.getGroupStatus();
        console.log('\n📂 Task 그룹 상태');
        console.log('==================');
        console.log(`총 그룹: ${groupStatus.totalGroups}개`);

        groupStatus.groups.forEach(group => {
            console.log(`📁 ${group.name}: ${group.taskCount}개 Task`);
            console.log(`   키워드: ${group.keywords.join(', ')}`);
        });
    }

    /**
     * 실행 가능한 Task 확인
     */
    showExecutableTasks() {
        const executable = this.taskManager.getExecutableTasks();
        console.log('\n🎯 실행 가능한 Task');
        console.log('===================');
        console.log(`총 ${executable.length}개`);

        executable.forEach((task, index) => {
            console.log(`${index + 1}. ${task.title}`);
            console.log(`   ID: ${task.id} | 우선순위: ${task.priority}`);
            console.log(`   카테고리: ${task.category} | 예상시간: ${task.estimatedTime}`);
            console.log('');
        });
    }
}

// CLI 실행
if (require.main === module) {
    const processor = new IntegratedOwnerRequest();

    console.log('🚀 통합 오너 요청 처리 시스템 시작');
    console.log('==================================');
    console.log('사용법: node integrated-owner-request.js "요청 내용"');
    console.log('');

    // 명령행 인수 처리
    const args = process.argv.slice(2);
    if (args.length > 0) {
        const content = args.join(' ');
        processor.processOwnerRequest(content).then(() => {
            console.log('\n🎉 처리 완료!');
        });
    } else {
        console.log('❌ 요청 내용을 입력해주세요.');
        console.log('예시: node integrated-owner-request.js "버그 수정해줘"');
    }
}

module.exports = IntegratedOwnerRequest;

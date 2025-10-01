const fs = require('fs');
const path = require('path');

/**
 * 테스트 요청 생성 및 확인 시스템
 * 문자 인코딩 문제 해결
 */
class TestRequestFix {
    constructor() {
        this.taskFile = 'work-results/owner-tasks.json';
        this.todoFile = 'work-results/owner-todos.md';
        this.documentFile = 'work-results/owner-requests.md';
    }

    /**
     * 새로운 테스트 요청 생성
     */
    async createTestRequest(content) {
        console.log('🧪 테스트 요청 생성:', content);

        const requestId = this.generateRequestId();
        const timestamp = new Date().toISOString();

        // Task 생성
        const task = {
            id: requestId,
            title: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
            description: content,
            category: this.analyzeCategory(content),
            priority: this.analyzePriority(content),
            estimatedTime: this.estimateTime(content),
            status: 'pending',
            createdAt: timestamp,
            owner: '오너',
            assignedTo: '매니저',
            tags: this.extractTags(content),
            dependencies: [],
            subtasks: this.generateSubtasks(content),
            duplicates: []
        };

        // Task 파일에 저장
        await this.saveTaskToFile(task);

        // TODO 생성
        await this.createTodo(task);

        // 문서 생성
        await this.createDocument(task);

        console.log('✅ 테스트 요청 생성 완료:', requestId);
        return task;
    }

    /**
     * Task 파일에 저장
     */
    async saveTaskToFile(task) {
        try {
            let taskData = { tasks: [], lastUpdated: new Date().toISOString(), totalCount: 0 };

            if (fs.existsSync(this.taskFile)) {
                const content = fs.readFileSync(this.taskFile, 'utf8');
                taskData = JSON.parse(content);
            }

            taskData.tasks.push(task);
            taskData.totalCount = taskData.tasks.length;
            taskData.lastUpdated = new Date().toISOString();

            fs.writeFileSync(this.taskFile, JSON.stringify(taskData, null, 2), 'utf8');
            console.log('📄 Task 파일 저장 완료');
        } catch (error) {
            console.error('❌ Task 저장 오류:', error);
        }
    }

    /**
     * TODO 생성
     */
    async createTodo(task) {
        const timestamp = new Date().toLocaleString('ko-KR');
        const todoEntry = `
## ${task.category} - ${task.id}
- **우선순위**: ${task.priority}
- **예상 시간**: ${task.estimatedTime}
- **수신 시간**: ${timestamp}

### 작업 내용
${task.description}

### 진행 상황
- [x] 요청 분석 완료
- [x] Task 생성 완료
- [ ] 작업 계획 수립
- [ ] 실행 중
- [ ] 완료

### 하위 작업
${task.subtasks.map(subtask => `- [ ] ${subtask}`).join('\n')}

---

`;

        fs.appendFileSync(this.todoFile, todoEntry, 'utf8');
        console.log('📋 TODO 생성 완료');
    }

    /**
     * 문서 생성
     */
    async createDocument(task) {
        const timestamp = new Date().toLocaleString('ko-KR');
        const docEntry = `
### 요청 #${task.id}
- **수신 시간**: ${timestamp}
- **우선순위**: ${task.priority}
- **카테고리**: ${task.category}
- **예상 시간**: ${task.estimatedTime}
- **상태**: ${task.status}

**내용**:
${task.description}

**하위 작업**:
${task.subtasks.map(subtask => `- ${subtask}`).join('\n')}

---

`;

        fs.appendFileSync(this.documentFile, docEntry, 'utf8');
        console.log('📄 문서 생성 완료');
    }

    /**
     * 분석 함수들
     */
    analyzePriority(content) {
        const urgentKeywords = ['긴급', '즉시', '빨리', 'ASAP', 'urgent'];
        const highKeywords = ['중요', '우선', '먼저', 'priority'];

        const lowerContent = content.toLowerCase();

        if (urgentKeywords.some(keyword => lowerContent.includes(keyword))) {
            return 'urgent';
        } else if (highKeywords.some(keyword => lowerContent.includes(keyword))) {
            return 'high';
        } else {
            return 'medium';
        }
    }

    analyzeCategory(content) {
        const categories = {
            'bug-fix': ['버그', '오류', '에러', '수정', 'bug', 'error', 'fix'],
            'feature': ['기능', '추가', '새로운', '개발', 'feature', 'new'],
            'ui': ['UI', '인터페이스', '화면', '디자인', '버튼', '메뉴'],
            'testing': ['테스트', '검증', 'test', 'verify'],
            'database': ['데이터베이스', 'DB', '테이블', '쿼리'],
            'api': ['API', '엔드포인트', '서버', '통신']
        };

        const lowerContent = content.toLowerCase();

        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => lowerContent.includes(keyword))) {
                return category;
            }
        }

        return 'general';
    }

    estimateTime(content) {
        const length = content.length;
        if (length < 50) return '1-2시간';
        if (length < 100) return '2-4시간';
        return '4-8시간';
    }

    extractTags(content) {
        const tags = [];
        const tagPatterns = [/#(\w+)/g, /@(\w+)/g, /\[(\w+)\]/g];

        tagPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                tags.push(...matches.map(match => match.replace(/[#@\[\]]/g, '')));
            }
        });

        return [...new Set(tags)];
    }

    generateSubtasks(content) {
        const subtasks = [];

        if (content.includes('개발') || content.includes('코딩')) {
            subtasks.push('코드 작성', '테스트', '리뷰');
        } else if (content.includes('문서')) {
            subtasks.push('문서 작성', '검토');
        } else if (content.includes('배포')) {
            subtasks.push('빌드', '배포', '검증');
        } else {
            subtasks.push('분석', '계획', '실행', '검증');
        }

        return subtasks;
    }

    generateRequestId() {
        return 'TEST_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }

    /**
     * 현재 상태 확인
     */
    showStatus() {
        console.log('\n📊 현재 시스템 상태');
        console.log('==================');

        try {
            if (fs.existsSync(this.taskFile)) {
                const taskData = JSON.parse(fs.readFileSync(this.taskFile, 'utf8'));
                console.log(`📋 총 Task 수: ${taskData.tasks.length}개`);
                console.log(`📅 마지막 업데이트: ${taskData.lastUpdated}`);

                const statusCounts = {
                    pending: taskData.tasks.filter(t => t.status === 'pending').length,
                    in_progress: taskData.tasks.filter(t => t.status === 'in_progress').length,
                    completed: taskData.tasks.filter(t => t.status === 'completed').length
                };

                console.log(`⏳ 대기 중: ${statusCounts.pending}개`);
                console.log(`🔄 진행 중: ${statusCounts.in_progress}개`);
                console.log(`✅ 완료: ${statusCounts.completed}개`);
            } else {
                console.log('❌ Task 파일이 없습니다.');
            }
        } catch (error) {
            console.error('❌ 상태 확인 오류:', error);
        }
    }
}

// CLI 실행
if (require.main === module) {
    const fixer = new TestRequestFix();

    const args = process.argv.slice(2);
    if (args.length > 0) {
        const content = args.join(' ');
        fixer.createTestRequest(content).then(() => {
            fixer.showStatus();
        });
    } else {
        console.log('❌ 요청 내용을 입력해주세요.');
        console.log('사용법: node test-request-fix.js "요청 내용"');
    }
}

module.exports = TestRequestFix;

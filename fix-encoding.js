const fs = require('fs');
const path = require('path');

/**
 * 문자 인코딩 문제 해결
 * UTF-8 BOM 추가 및 파일 재생성
 */
class EncodingFixer {
    constructor() {
        this.files = [
            'work-results/owner-todos.md',
            'work-results/owner-requests.md',
            'work-results/owner-tasks.json'
        ];
    }

    /**
     * 모든 파일의 인코딩 수정
     */
    async fixAllFiles() {
        console.log('🔧 문자 인코딩 수정 시작...');

        for (const file of this.files) {
            await this.fixFile(file);
        }

        console.log('✅ 모든 파일 인코딩 수정 완료!');
    }

    /**
     * 개별 파일 인코딩 수정
     */
    async fixFile(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                console.log(`⚠️  파일이 존재하지 않음: ${filePath}`);
                return;
            }

            // 파일 읽기 (현재 인코딩)
            const content = fs.readFileSync(filePath, 'utf8');

            // UTF-8 BOM 추가
            const bom = '\uFEFF';
            const newContent = bom + content;

            // 파일 다시 쓰기
            fs.writeFileSync(filePath, newContent, 'utf8');

            console.log(`✅ 수정 완료: ${filePath}`);
        } catch (error) {
            console.error(`❌ 수정 실패 (${filePath}):`, error);
        }
    }

    /**
     * 새로운 테스트 요청 생성 (인코딩 수정)
     */
    async createTestRequest(content) {
        console.log('🧪 새로운 테스트 요청 생성:', content);

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

        // Task 파일에 저장 (UTF-8 BOM 포함)
        await this.saveTaskToFile(task);

        // TODO 생성 (UTF-8 BOM 포함)
        await this.createTodo(task);

        // 문서 생성 (UTF-8 BOM 포함)
        await this.createDocument(task);

        console.log('✅ 테스트 요청 생성 완료:', requestId);
        return task;
    }

    /**
     * Task 파일에 저장 (UTF-8 BOM 포함)
     */
    async saveTaskToFile(task) {
        try {
            let taskData = { tasks: [], lastUpdated: new Date().toISOString(), totalCount: 0 };

            if (fs.existsSync('work-results/owner-tasks.json')) {
                const content = fs.readFileSync('work-results/owner-tasks.json', 'utf8');
                taskData = JSON.parse(content);
            }

            taskData.tasks.push(task);
            taskData.totalCount = taskData.tasks.length;
            taskData.lastUpdated = new Date().toISOString();

            const bom = '\uFEFF';
            const jsonContent = bom + JSON.stringify(taskData, null, 2);
            fs.writeFileSync('work-results/owner-tasks.json', jsonContent, 'utf8');
            console.log('📄 Task 파일 저장 완료 (UTF-8 BOM)');
        } catch (error) {
            console.error('❌ Task 저장 오류:', error);
        }
    }

    /**
     * TODO 생성 (UTF-8 BOM 포함)
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

        const bom = '\uFEFF';
        const content = bom + todoEntry;
        fs.appendFileSync('work-results/owner-todos.md', content, 'utf8');
        console.log('📋 TODO 생성 완료 (UTF-8 BOM)');
    }

    /**
     * 문서 생성 (UTF-8 BOM 포함)
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

        const bom = '\uFEFF';
        const content = bom + docEntry;
        fs.appendFileSync('work-results/owner-requests.md', content, 'utf8');
        console.log('📄 문서 생성 완료 (UTF-8 BOM)');
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
            'testing': ['테스트', '검증', 'test', 'verify', '케이스', 'case'],
            'bug-fix': ['버그', '오류', '에러', '수정', 'bug', 'error', 'fix'],
            'feature': ['기능', '추가', '새로운', '개발', 'feature', 'new'],
            'ui': ['UI', '인터페이스', '화면', '디자인', '버튼', '메뉴'],
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

        if (content.includes('테스트') || content.includes('케이스')) {
            subtasks.push('테스트 케이스 작성', '테스트 실행', '결과 검증');
        } else if (content.includes('개발') || content.includes('코딩')) {
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
        return 'FIX_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }

    /**
     * 현재 상태 확인
     */
    showStatus() {
        console.log('\n📊 현재 시스템 상태');
        console.log('==================');

        try {
            if (fs.existsSync('work-results/owner-tasks.json')) {
                const taskData = JSON.parse(fs.readFileSync('work-results/owner-tasks.json', 'utf8'));
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

                // 최근 Task들 표시
                const recentTasks = taskData.tasks.slice(-3);
                console.log('\n📝 최근 Task들:');
                recentTasks.forEach((task, index) => {
                    console.log(`${index + 1}. ${task.title} (${task.category})`);
                });
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
    const fixer = new EncodingFixer();

    const args = process.argv.slice(2);
    if (args.length > 0) {
        const content = args.join(' ');
        fixer.createTestRequest(content).then(() => {
            fixer.showStatus();
        });
    } else {
        console.log('❌ 요청 내용을 입력해주세요.');
        console.log('사용법: node fix-encoding.js "요청 내용"');
    }
}

module.exports = EncodingFixer;

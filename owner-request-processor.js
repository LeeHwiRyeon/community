const fs = require('fs');
const path = require('path');

/**
 * 오너 요청 처리 시스템
 * 
 * 기능:
 * 1. 제목 없이 내용만 받아서 처리
 * 2. 받은 순서대로 큐에 추가
 * 3. 내용 분석하여 문서 업데이트
 * 4. TODO 자동 생성
 * 5. Task 정리 및 생성
 */
class OwnerRequestProcessor {
    constructor() {
        this.requestQueue = [];
        this.processedCount = 0;
        this.todoFile = 'work-results/owner-todos.md';
        this.taskFile = 'work-results/owner-tasks.json';
        this.documentFile = 'work-results/owner-requests.md';

        this.initializeFiles();
    }

    /**
     * 파일 초기화
     */
    initializeFiles() {
        // TODO 파일 초기화
        if (!fs.existsSync(this.todoFile)) {
            const todoContent = `# 오너 요청 TODO 목록

> **생성일**: ${new Date().toLocaleString('ko-KR')}  
> **상태**: 활성

## 📋 대기 중인 작업들

`;
            fs.writeFileSync(this.todoFile, todoContent);
        }

        // Task 파일 초기화
        if (!fs.existsSync(this.taskFile)) {
            const taskContent = {
                tasks: [],
                lastUpdated: new Date().toISOString(),
                totalCount: 0
            };
            fs.writeFileSync(this.taskFile, JSON.stringify(taskContent, null, 2));
        }

        // 문서 파일 초기화
        if (!fs.existsSync(this.documentFile)) {
            const docContent = `# 오너 요청 처리 문서

> **생성일**: ${new Date().toLocaleString('ko-KR')}  
> **상태**: 활성

## 📝 요청 처리 내역

`;
            fs.writeFileSync(this.documentFile, docContent);
        }
    }

    /**
     * 오너 요청 처리
     */
    async processOwnerRequest(content) {
        console.log('📥 오너 요청 수신:', content);

        // 1. 큐에 추가 (순서대로)
        const requestId = this.generateRequestId();
        const request = {
            id: requestId,
            content: content.trim(),
            receivedAt: new Date().toISOString(),
            status: 'pending',
            priority: this.analyzePriority(content),
            category: this.analyzeCategory(content),
            estimatedTime: this.estimateTime(content)
        };

        this.requestQueue.push(request);
        console.log(`✅ 요청이 큐에 추가되었습니다. (ID: ${requestId}, 순서: ${this.requestQueue.length})`);

        // 2. 즉시 처리 시작
        await this.processRequest(request);

        return request;
    }

    /**
     * 요청 처리
     */
    async processRequest(request) {
        console.log(`🔄 요청 처리 중: ${request.id}`);

        try {
            // 1. 문서 업데이트
            await this.updateDocument(request);

            // 2. TODO 생성
            await this.createTodo(request);

            // 3. Task 생성
            await this.createTask(request);

            // 4. 상태 업데이트
            request.status = 'completed';
            request.completedAt = new Date().toISOString();

            this.processedCount++;

            console.log(`✅ 요청 처리 완료: ${request.id}`);
            console.log(`📊 총 처리된 요청: ${this.processedCount}개`);

        } catch (error) {
            console.error(`❌ 요청 처리 실패 (${request.id}):`, error);
            request.status = 'failed';
            request.error = error.message;
        }
    }

    /**
     * 문서 업데이트
     */
    async updateDocument(request) {
        const timestamp = new Date().toLocaleString('ko-KR');
        const docEntry = `
### 요청 #${request.id}
- **수신 시간**: ${timestamp}
- **우선순위**: ${request.priority}
- **카테고리**: ${request.category}
- **예상 시간**: ${request.estimatedTime}
- **상태**: ${request.status}

**내용**:
${request.content}

---

`;

        fs.appendFileSync(this.documentFile, docEntry);
        console.log(`📄 문서 업데이트 완료: ${request.id}`);
    }

    /**
     * TODO 생성
     */
    async createTodo(request) {
        const timestamp = new Date().toLocaleString('ko-KR');
        const todoEntry = `
## ${request.category} - ${request.id}
- **우선순위**: ${request.priority}
- **예상 시간**: ${request.estimatedTime}
- **수신 시간**: ${timestamp}

### 작업 내용
${request.content}

### 진행 상황
- [ ] 요청 분석 완료
- [ ] 작업 계획 수립
- [ ] 실행 중
- [ ] 완료

---

`;

        fs.appendFileSync(this.todoFile, todoEntry);
        console.log(`📋 TODO 생성 완료: ${request.id}`);
    }

    /**
     * Task 생성
     */
    async createTask(request) {
        const taskData = {
            id: request.id,
            title: this.generateTaskTitle(request.content),
            description: request.content,
            category: request.category,
            priority: request.priority,
            estimatedTime: request.estimatedTime,
            status: 'pending',
            createdAt: request.receivedAt,
            owner: '오너',
            assignedTo: '매니저',
            tags: this.extractTags(request.content),
            dependencies: [],
            subtasks: this.generateSubtasks(request.content)
        };

        // 기존 Task 파일 읽기
        const existingData = JSON.parse(fs.readFileSync(this.taskFile, 'utf8'));
        existingData.tasks.push(taskData);
        existingData.totalCount++;
        existingData.lastUpdated = new Date().toISOString();

        fs.writeFileSync(this.taskFile, JSON.stringify(existingData, null, 2));
        console.log(`🎯 Task 생성 완료: ${request.id}`);
    }

    /**
     * 우선순위 분석
     */
    analyzePriority(content) {
        const urgentKeywords = ['긴급', '즉시', '빨리', 'ASAP', 'urgent', 'emergency'];
        const highKeywords = ['중요', '우선', '먼저', 'priority', 'important'];
        const lowKeywords = ['나중에', '여유있을때', 'low', 'later'];

        const lowerContent = content.toLowerCase();

        if (urgentKeywords.some(keyword => lowerContent.includes(keyword))) {
            return 'urgent';
        } else if (highKeywords.some(keyword => lowerContent.includes(keyword))) {
            return 'high';
        } else if (lowKeywords.some(keyword => lowerContent.includes(keyword))) {
            return 'low';
        } else {
            return 'medium';
        }
    }

    /**
     * 카테고리 분석
     */
    analyzeCategory(content) {
        const categories = {
            'bug-fix': ['버그', '오류', '에러', '수정', 'bug', 'error', 'fix'],
            'feature': ['기능', '추가', '새로운', '개발', 'feature', 'new'],
            'refactor': ['리팩토링', '개선', '최적화', 'refactor', 'optimize'],
            'documentation': ['문서', '가이드', '설명', 'documentation', 'guide'],
            'testing': ['테스트', '검증', 'test', 'verify'],
            'deployment': ['배포', '운영', 'deploy', 'production'],
            'maintenance': ['유지보수', '관리', 'maintenance', 'manage']
        };

        const lowerContent = content.toLowerCase();

        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => lowerContent.includes(keyword))) {
                return category;
            }
        }

        return 'general';
    }

    /**
     * 예상 시간 추정
     */
    estimateTime(content) {
        const length = content.length;
        const complexity = this.analyzeComplexity(content);

        if (complexity === 'high') {
            return '4-8시간';
        } else if (complexity === 'medium') {
            return '2-4시간';
        } else {
            return '1-2시간';
        }
    }

    /**
     * 복잡도 분석
     */
    analyzeComplexity(content) {
        const complexKeywords = ['시스템', '아키텍처', '데이터베이스', 'API', '통합', '복잡'];
        const simpleKeywords = ['간단', '쉬운', '빠른', '단순'];

        const lowerContent = content.toLowerCase();

        if (complexKeywords.some(keyword => lowerContent.includes(keyword))) {
            return 'high';
        } else if (simpleKeywords.some(keyword => lowerContent.includes(keyword))) {
            return 'low';
        } else {
            return 'medium';
        }
    }

    /**
     * Task 제목 생성
     */
    generateTaskTitle(content) {
        const words = content.split(' ').slice(0, 5);
        return words.join(' ') + (content.split(' ').length > 5 ? '...' : '');
    }

    /**
     * 태그 추출
     */
    extractTags(content) {
        const tags = [];
        const tagPatterns = [
            /#(\w+)/g,
            /@(\w+)/g,
            /\[(\w+)\]/g
        ];

        tagPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                tags.push(...matches.map(match => match.replace(/[#@\[\]]/g, '')));
            }
        });

        return [...new Set(tags)]; // 중복 제거
    }

    /**
     * 하위 작업 생성
     */
    generateSubtasks(content) {
        const subtasks = [];

        // 일반적인 하위 작업들
        if (content.includes('개발') || content.includes('코딩')) {
            subtasks.push('코드 작성');
            subtasks.push('테스트');
            subtasks.push('리뷰');
        }

        if (content.includes('문서')) {
            subtasks.push('문서 작성');
            subtasks.push('검토');
        }

        if (content.includes('배포')) {
            subtasks.push('빌드');
            subtasks.push('배포');
            subtasks.push('검증');
        }

        return subtasks.length > 0 ? subtasks : ['분석', '계획', '실행', '검증'];
    }

    /**
     * 요청 ID 생성
     */
    generateRequestId() {
        return 'REQ_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }

    /**
     * 큐 상태 확인
     */
    getQueueStatus() {
        return {
            totalRequests: this.requestQueue.length,
            processedCount: this.processedCount,
            pendingCount: this.requestQueue.filter(r => r.status === 'pending').length,
            completedCount: this.requestQueue.filter(r => r.status === 'completed').length,
            failedCount: this.requestQueue.filter(r => r.status === 'failed').length
        };
    }

    /**
     * 큐 내용 출력
     */
    showQueue() {
        console.log('\n📋 현재 요청 큐 상태');
        console.log('==================');

        if (this.requestQueue.length === 0) {
            console.log('큐가 비어있습니다.');
            return;
        }

        this.requestQueue.forEach((request, index) => {
            console.log(`${index + 1}. [${request.status.toUpperCase()}] ${request.id}`);
            console.log(`   내용: ${request.content.substring(0, 50)}...`);
            console.log(`   우선순위: ${request.priority} | 카테고리: ${request.category}`);
            console.log('');
        });
    }
}

// CLI 실행
if (require.main === module) {
    const processor = new OwnerRequestProcessor();

    console.log('🚀 오너 요청 처리 시스템 시작');
    console.log('=============================');
    console.log('사용법: node owner-request-processor.js "요청 내용"');
    console.log('');

    // 명령행 인수 처리
    const args = process.argv.slice(2);
    if (args.length > 0) {
        const content = args.join(' ');
        processor.processOwnerRequest(content).then(() => {
            processor.showQueue();
        });
    } else {
        console.log('❌ 요청 내용을 입력해주세요.');
        console.log('예시: node owner-request-processor.js "버그 수정해줘"');
    }
}

module.exports = OwnerRequestProcessor;

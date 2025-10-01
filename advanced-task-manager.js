const fs = require('fs');
const path = require('path');

/**
 * 고급 Task 관리 시스템
 * 
 * 기능:
 * 1. 중복 요청 감지 및 병합
 * 2. 관련 작업 그룹화
 * 3. 작업자 대기열 관리
 * 4. 타이밍 최적화
 * 5. 의존성 관리
 */
class AdvancedTaskManager {
    constructor() {
        this.taskFile = 'work-results/owner-tasks.json';
        this.duplicateThreshold = 0.8; // 중복 감지 임계값
        this.groupingKeywords = {
            'authentication': ['로그인', '인증', 'auth', 'login', 'password', '비밀번호'],
            'ui': ['UI', '인터페이스', '화면', '디자인', '버튼', '메뉴'],
            'database': ['데이터베이스', 'DB', '테이블', '쿼리', '데이터'],
            'api': ['API', '엔드포인트', '서버', '통신', '요청'],
            'security': ['보안', '암호화', '권한', '접근', '보호'],
            'performance': ['성능', '속도', '최적화', '캐시', '로딩'],
            'testing': ['테스트', '검증', '디버깅', '오류', '버그']
        };

        this.workerQueue = [];
        this.taskGroups = new Map();
        this.dependencies = new Map();

        this.initializeSystem();
    }

    /**
     * 시스템 초기화
     */
    initializeSystem() {
        // 작업자 대기열 초기화
        this.workerQueue = [
            { id: 'worker1', name: '개발자1', status: 'available', currentTask: null },
            { id: 'worker2', name: '개발자2', status: 'available', currentTask: null },
            { id: 'worker3', name: '디자이너', status: 'available', currentTask: null },
            { id: 'worker4', name: '테스터', status: 'available', currentTask: null }
        ];

        console.log('🚀 고급 Task 관리 시스템 초기화 완료');
    }

    /**
     * 새로운 요청 처리
     */
    async processRequest(content, requestId) {
        console.log(`\n📥 새 요청 처리: ${requestId}`);
        console.log(`내용: ${content}`);

        // 1. 중복 요청 검사
        const duplicateInfo = await this.checkDuplicates(content);
        if (duplicateInfo.isDuplicate) {
            console.log(`⚠️  중복 요청 감지: ${duplicateInfo.similarTaskId}`);
            return await this.handleDuplicateRequest(content, requestId, duplicateInfo);
        }

        // 2. 그룹화 가능성 검사
        const groupInfo = await this.findRelatedGroup(content);
        if (groupInfo.shouldGroup) {
            console.log(`🔗 관련 그룹 발견: ${groupInfo.groupId}`);
            return await this.addToGroup(content, requestId, groupInfo);
        }

        // 3. 새 Task 생성
        return await this.createNewTask(content, requestId);
    }

    /**
     * 중복 요청 검사
     */
    async checkDuplicates(content) {
        try {
            if (!fs.existsSync(this.taskFile)) {
                return { isDuplicate: false };
            }

            const taskData = JSON.parse(fs.readFileSync(this.taskFile, 'utf8'));
            const tasks = taskData.tasks || [];

            for (const task of tasks) {
                const similarity = this.calculateSimilarity(content, task.description);
                if (similarity >= this.duplicateThreshold) {
                    return {
                        isDuplicate: true,
                        similarTaskId: task.id,
                        similarity: similarity,
                        similarTask: task
                    };
                }
            }

            return { isDuplicate: false };
        } catch (error) {
            console.error('❌ 중복 검사 오류:', error);
            return { isDuplicate: false };
        }
    }

    /**
     * 유사도 계산 (간단한 Jaccard 유사도)
     */
    calculateSimilarity(text1, text2) {
        const words1 = new Set(text1.toLowerCase().split(/\s+/));
        const words2 = new Set(text2.toLowerCase().split(/\s+/));

        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);

        return intersection.size / union.size;
    }

    /**
     * 중복 요청 처리
     */
    async handleDuplicateRequest(content, requestId, duplicateInfo) {
        const { similarTaskId, similarity } = duplicateInfo;

        // 중복 요청을 기존 Task에 추가
        const duplicateEntry = {
            requestId,
            content,
            similarity,
            addedAt: new Date().toISOString(),
            status: 'merged'
        };

        await this.addDuplicateToTask(similarTaskId, duplicateEntry);

        console.log(`✅ 중복 요청이 기존 Task에 병합됨: ${similarTaskId}`);

        return {
            id: requestId,
            status: 'merged',
            mergedWith: similarTaskId,
            similarity: similarity
        };
    }

    /**
     * 관련 그룹 찾기
     */
    async findRelatedGroup(content) {
        const contentLower = content.toLowerCase();

        for (const [groupId, keywords] of Object.entries(this.groupingKeywords)) {
            const matchCount = keywords.filter(keyword =>
                contentLower.includes(keyword.toLowerCase())
            ).length;

            if (matchCount >= 2) { // 2개 이상 키워드 매치
                return {
                    shouldGroup: true,
                    groupId: groupId,
                    matchCount: matchCount,
                    matchedKeywords: keywords.filter(keyword =>
                        contentLower.includes(keyword.toLowerCase())
                    )
                };
            }
        }

        return { shouldGroup: false };
    }

    /**
     * 그룹에 추가
     */
    async addToGroup(content, requestId, groupInfo) {
        const { groupId, matchedKeywords } = groupInfo;

        if (!this.taskGroups.has(groupId)) {
            this.taskGroups.set(groupId, {
                id: groupId,
                name: this.getGroupDisplayName(groupId),
                tasks: [],
                status: 'active',
                createdAt: new Date().toISOString(),
                keywords: matchedKeywords
            });
        }

        const group = this.taskGroups.get(groupId);
        const task = {
            id: requestId,
            content,
            status: 'pending',
            priority: this.analyzePriority(content),
            category: this.analyzeCategory(content),
            estimatedTime: this.estimateTime(content),
            createdAt: new Date().toISOString(),
            groupId: groupId
        };

        group.tasks.push(task);

        console.log(`✅ Task가 그룹에 추가됨: ${groupId}`);
        console.log(`📊 그룹 내 Task 수: ${group.tasks.length}개`);

        return task;
    }

    /**
     * 새 Task 생성
     */
    async createNewTask(content, requestId) {
        const task = {
            id: requestId,
            title: this.generateTaskTitle(content),
            description: content,
            category: this.analyzeCategory(content),
            priority: this.analyzePriority(content),
            estimatedTime: this.estimateTime(content),
            status: 'pending',
            createdAt: new Date().toISOString(),
            owner: '오너',
            assignedTo: null,
            tags: this.extractTags(content),
            dependencies: [],
            subtasks: this.generateSubtasks(content),
            duplicates: [],
            groupId: null
        };

        // Task 파일에 저장
        await this.saveTaskToFile(task);

        // 작업자 할당
        const assignedWorker = await this.assignWorker(task);
        if (assignedWorker) {
            task.assignedTo = assignedWorker.name;
            task.assignedAt = new Date().toISOString();
        }

        console.log(`✅ 새 Task 생성 완료: ${requestId}`);
        if (assignedWorker) {
            console.log(`👤 작업자 할당: ${assignedWorker.name}`);
        }

        return task;
    }

    /**
     * 작업자 할당
     */
    async assignWorker(task) {
        // 우선순위에 따른 작업자 선택
        const availableWorkers = this.workerQueue.filter(w => w.status === 'available');

        if (availableWorkers.length === 0) {
            console.log('⚠️  사용 가능한 작업자가 없습니다. 대기열에 추가됩니다.');
            return null;
        }

        // 카테고리별 전문 작업자 우선 할당
        let selectedWorker = null;

        if (task.category === 'ui' || task.category === 'design') {
            selectedWorker = availableWorkers.find(w => w.name.includes('디자이너'));
        } else if (task.category === 'testing') {
            selectedWorker = availableWorkers.find(w => w.name.includes('테스터'));
        } else {
            selectedWorker = availableWorkers.find(w => w.name.includes('개발자'));
        }

        if (!selectedWorker) {
            selectedWorker = availableWorkers[0]; // 기본 작업자
        }

        // 작업자 상태 업데이트
        selectedWorker.status = 'busy';
        selectedWorker.currentTask = task.id;

        return selectedWorker;
    }

    /**
     * 작업자 대기열 관리
     */
    getWorkerStatus() {
        const status = {
            total: this.workerQueue.length,
            available: this.workerQueue.filter(w => w.status === 'available').length,
            busy: this.workerQueue.filter(w => w.status === 'busy').length,
            workers: this.workerQueue.map(w => ({
                name: w.name,
                status: w.status,
                currentTask: w.currentTask
            }))
        };

        return status;
    }

    /**
     * Task 그룹 상태
     */
    getGroupStatus() {
        const groups = Array.from(this.taskGroups.values());
        return {
            totalGroups: groups.length,
            groups: groups.map(group => ({
                id: group.id,
                name: group.name,
                taskCount: group.tasks.length,
                status: group.status,
                keywords: group.keywords
            }))
        };
    }

    /**
     * 의존성 관리
     */
    addDependency(taskId, dependsOn) {
        if (!this.dependencies.has(taskId)) {
            this.dependencies.set(taskId, []);
        }

        this.dependencies.get(taskId).push(dependsOn);
        console.log(`🔗 의존성 추가: ${taskId} → ${dependsOn}`);
    }

    /**
     * 실행 가능한 Task 찾기
     */
    getExecutableTasks() {
        const allTasks = this.getAllTasks();
        const executable = [];

        for (const task of allTasks) {
            if (task.status === 'pending') {
                const deps = this.dependencies.get(task.id) || [];
                const allDepsCompleted = deps.every(depId => {
                    const depTask = allTasks.find(t => t.id === depId);
                    return depTask && depTask.status === 'completed';
                });

                if (allDepsCompleted) {
                    executable.push(task);
                }
            }
        }

        return executable;
    }

    /**
     * 모든 Task 가져오기
     */
    getAllTasks() {
        try {
            if (!fs.existsSync(this.taskFile)) {
                return [];
            }

            const taskData = JSON.parse(fs.readFileSync(this.taskFile, 'utf8'));
            return taskData.tasks || [];
        } catch (error) {
            console.error('❌ Task 로드 오류:', error);
            return [];
        }
    }

    /**
     * Task 파일에 저장
     */
    async saveTaskToFile(task) {
        try {
            let taskData = { tasks: [], lastUpdated: new Date().toISOString(), totalCount: 0 };

            if (fs.existsSync(this.taskFile)) {
                taskData = JSON.parse(fs.readFileSync(this.taskFile, 'utf8'));
            }

            taskData.tasks.push(task);
            taskData.totalCount = taskData.tasks.length;
            taskData.lastUpdated = new Date().toISOString();

            fs.writeFileSync(this.taskFile, JSON.stringify(taskData, null, 2));
        } catch (error) {
            console.error('❌ Task 저장 오류:', error);
        }
    }

    /**
     * 중복을 기존 Task에 추가
     */
    async addDuplicateToTask(taskId, duplicateEntry) {
        try {
            const taskData = JSON.parse(fs.readFileSync(this.taskFile, 'utf8'));
            const task = taskData.tasks.find(t => t.id === taskId);

            if (task) {
                if (!task.duplicates) {
                    task.duplicates = [];
                }
                task.duplicates.push(duplicateEntry);

                fs.writeFileSync(this.taskFile, JSON.stringify(taskData, null, 2));
            }
        } catch (error) {
            console.error('❌ 중복 추가 오류:', error);
        }
    }

    /**
     * 유틸리티 함수들
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
            'ui': ['UI', '인터페이스', '화면', '디자인', '버튼'],
            'bug-fix': ['버그', '오류', '에러', '수정', 'bug'],
            'feature': ['기능', '추가', '새로운', '개발'],
            'testing': ['테스트', '검증', 'test'],
            'database': ['데이터베이스', 'DB', '테이블'],
            'api': ['API', '엔드포인트', '서버']
        };

        const lowerContent = content.toLowerCase();

        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => lowerContent.includes(keyword.toLowerCase()))) {
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

    generateTaskTitle(content) {
        const words = content.split(' ').slice(0, 5);
        return words.join(' ') + (content.split(' ').length > 5 ? '...' : '');
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

    getGroupDisplayName(groupId) {
        const names = {
            'authentication': '인증 시스템',
            'ui': '사용자 인터페이스',
            'database': '데이터베이스',
            'api': 'API 개발',
            'security': '보안',
            'performance': '성능 최적화',
            'testing': '테스트'
        };
        return names[groupId] || groupId;
    }

    /**
     * 시스템 상태 출력
     */
    showSystemStatus() {
        console.log('\n🔍 고급 Task 관리 시스템 상태');
        console.log('===============================');

        // 작업자 상태
        const workerStatus = this.getWorkerStatus();
        console.log('\n👥 작업자 상태:');
        console.log(`   총 작업자: ${workerStatus.total}명`);
        console.log(`   사용 가능: ${workerStatus.available}명`);
        console.log(`   작업 중: ${workerStatus.busy}명`);

        workerStatus.workers.forEach(worker => {
            const status = worker.status === 'available' ? '✅' : '🔄';
            console.log(`   ${status} ${worker.name}: ${worker.status}`);
        });

        // 그룹 상태
        const groupStatus = this.getGroupStatus();
        console.log('\n📂 Task 그룹:');
        console.log(`   총 그룹: ${groupStatus.totalGroups}개`);

        groupStatus.groups.forEach(group => {
            console.log(`   📁 ${group.name}: ${group.taskCount}개 Task`);
        });

        // 실행 가능한 Task
        const executable = this.getExecutableTasks();
        console.log('\n🎯 실행 가능한 Task:');
        console.log(`   ${executable.length}개`);

        executable.forEach(task => {
            console.log(`   - ${task.title} (${task.priority})`);
        });
    }
}

module.exports = AdvancedTaskManager;

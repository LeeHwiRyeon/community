const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * 이진데이터 기반 Task 관리 시스템
 * UTF-8 버그 수정 및 효율적 데이터 관리
 */
class BinaryTaskManager {
    constructor() {
        this.dataDir = 'work-results';
        this.binaryFile = path.join(this.dataDir, 'tasks.bin');
        this.indexFile = path.join(this.dataDir, 'index.json');
        this.configFile = path.join(this.dataDir, 'config.json');

        // 이진 데이터 버퍼
        this.taskBuffer = Buffer.alloc(0);
        this.taskIndex = new Map();
        this.config = this.loadConfig();

        // 초기화
        this.initialize();
    }

    /**
     * 시스템 초기화
     */
    initialize() {
        // 디렉토리 생성
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }

        // 기존 데이터 로드
        this.loadBinaryData();
        this.loadIndex();

        console.log('🚀 이진데이터 Task 관리 시스템 초기화 완료');
        console.log(`📊 로드된 Task 수: ${this.taskIndex.size}개`);
    }

    /**
     * 설정 로드
     */
    loadConfig() {
        const defaultConfig = {
            version: '1.0.0',
            encoding: 'utf8',
            compression: false,
            lastUpdated: new Date().toISOString(),
            totalTasks: 0,
            nextId: 1
        };

        if (fs.existsSync(this.configFile)) {
            try {
                const data = fs.readFileSync(this.configFile, 'utf8');
                return { ...defaultConfig, ...JSON.parse(data) };
            } catch (error) {
                console.warn('⚠️ 설정 파일 로드 실패, 기본값 사용:', error.message);
            }
        }

        return defaultConfig;
    }

    /**
     * 설정 저장
     */
    saveConfig() {
        this.config.lastUpdated = new Date().toISOString();
        this.config.totalTasks = this.taskIndex.size;

        try {
            fs.writeFileSync(this.configFile, JSON.stringify(this.config, null, 2), 'utf8');
        } catch (error) {
            console.error('❌ 설정 저장 실패:', error);
        }
    }

    /**
     * 이진데이터 로드
     */
    loadBinaryData() {
        if (fs.existsSync(this.binaryFile)) {
            try {
                this.taskBuffer = fs.readFileSync(this.binaryFile);
                console.log(`📁 이진데이터 로드 완료: ${this.taskBuffer.length} bytes`);
            } catch (error) {
                console.error('❌ 이진데이터 로드 실패:', error);
                this.taskBuffer = Buffer.alloc(0);
            }
        }
    }

    /**
     * 인덱스 로드
     */
    loadIndex() {
        if (fs.existsSync(this.indexFile)) {
            try {
                const data = fs.readFileSync(this.indexFile, 'utf8');
                const indexData = JSON.parse(data);
                this.taskIndex = new Map(indexData.entries);
                this.config.nextId = indexData.nextId || this.taskIndex.size + 1;
                console.log(`📋 인덱스 로드 완료: ${this.taskIndex.size}개 항목`);
            } catch (error) {
                console.error('❌ 인덱스 로드 실패:', error);
                this.taskIndex = new Map();
            }
        }
    }

    /**
     * Task 생성 (UTF-8 안전)
     */
    createTask(content, priority = 'medium', category = 'general') {
        const taskId = this.generateTaskId();
        const timestamp = new Date().toISOString();

        // UTF-8 안전한 문자열 처리
        const safeContent = this.sanitizeString(content);
        const safeTitle = safeContent.substring(0, 50) + (safeContent.length > 50 ? '...' : '');

        const task = {
            id: taskId,
            title: safeTitle,
            description: safeContent,
            category: this.analyzeCategory(safeContent, category),
            priority: this.analyzePriority(safeContent, priority),
            estimatedTime: this.estimateTime(safeContent),
            status: 'pending',
            createdAt: timestamp,
            owner: '오너',
            assignedTo: '매니저',
            tags: this.extractTags(safeContent),
            dependencies: [],
            subtasks: this.generateSubtasks(safeContent),
            duplicates: [],
            processingTime: 0,
            completedAt: null
        };

        // 이진데이터로 저장
        this.saveTaskToBinary(task);

        // 인덱스 업데이트
        this.updateIndex(task);

        // 설정 저장
        this.saveConfig();

        console.log(`✅ Task 생성 완료: ${taskId}`);
        return task;
    }

    /**
     * UTF-8 안전 문자열 처리
     */
    sanitizeString(str) {
        if (typeof str !== 'string') {
            str = String(str);
        }

        // UTF-8 인코딩으로 정규화
        try {
            return Buffer.from(str, 'utf8').toString('utf8');
        } catch (error) {
            console.warn('⚠️ 문자열 정규화 실패, 원본 사용:', error.message);
            return str;
        }
    }

    /**
     * Task를 이진데이터로 저장
     */
    saveTaskToBinary(task) {
        try {
            // Task를 JSON으로 직렬화
            const taskJson = JSON.stringify(task);

            // UTF-8로 인코딩
            const taskBuffer = Buffer.from(taskJson, 'utf8');

            // 헤더 생성 (길이 + 체크섬)
            const length = taskBuffer.length;
            const checksum = crypto.createHash('md5').update(taskBuffer).digest('hex');
            const header = Buffer.alloc(8 + 32); // 8바이트 길이 + 32바이트 MD5

            header.writeUInt32BE(length, 0);
            header.writeUInt32BE(0, 4); // 예약 공간
            header.write(checksum, 8, 'hex');

            // 전체 데이터 조합
            const fullData = Buffer.concat([header, taskBuffer]);

            // 기존 버퍼에 추가
            this.taskBuffer = Buffer.concat([this.taskBuffer, fullData]);

            // 파일에 저장
            fs.writeFileSync(this.binaryFile, this.taskBuffer);

            console.log(`💾 Task 이진데이터 저장: ${task.id} (${length} bytes)`);

        } catch (error) {
            console.error('❌ Task 이진데이터 저장 실패:', error);
        }
    }

    /**
     * 인덱스 업데이트
     */
    updateIndex(task) {
        const indexEntry = {
            id: task.id,
            offset: this.taskBuffer.length - this.getTaskSize(task),
            size: this.getTaskSize(task),
            status: task.status,
            priority: task.priority,
            category: task.category,
            createdAt: task.createdAt,
            lastModified: new Date().toISOString()
        };

        this.taskIndex.set(task.id, indexEntry);

        // 인덱스 파일 저장
        this.saveIndex();
    }

    /**
     * Task 크기 계산
     */
    getTaskSize(task) {
        const taskJson = JSON.stringify(task);
        const taskBuffer = Buffer.from(taskJson, 'utf8');
        return 8 + 32 + taskBuffer.length; // 헤더 + 데이터
    }

    /**
     * 인덱스 저장
     */
    saveIndex() {
        try {
            const indexData = {
                version: '1.0.0',
                nextId: this.config.nextId,
                totalTasks: this.taskIndex.size,
                lastUpdated: new Date().toISOString(),
                entries: Array.from(this.taskIndex.entries())
            };

            fs.writeFileSync(this.indexFile, JSON.stringify(indexData, null, 2), 'utf8');
        } catch (error) {
            console.error('❌ 인덱스 저장 실패:', error);
        }
    }

    /**
     * Task 로드 (이진데이터에서)
     */
    loadTask(taskId) {
        const indexEntry = this.taskIndex.get(taskId);
        if (!indexEntry) {
            return null;
        }

        try {
            const offset = indexEntry.offset;
            const size = indexEntry.size;

            // 헤더 읽기
            const length = this.taskBuffer.readUInt32BE(offset);
            const storedChecksum = this.taskBuffer.toString('hex', offset + 8, offset + 40);

            // 데이터 읽기
            const taskData = this.taskBuffer.slice(offset + 40, offset + 40 + length);

            // 체크섬 검증 (선택적) - 저장된 체크섬과 실제 데이터 체크섬 비교
            const actualChecksum = crypto.createHash('md5').update(taskData).digest('hex');
            if (storedChecksum !== actualChecksum) {
                console.warn(`⚠️ 체크섬 불일치: ${taskId}`);
                console.warn(`   저장된 체크섬: ${storedChecksum}`);
                console.warn(`   실제 체크섬: ${actualChecksum}`);
                console.warn(`   데이터 길이: ${taskData.length} bytes`);
                // 체크섬이 맞지 않아도 데이터를 읽어보기 시도
            }

            // JSON 파싱
            const taskJson = taskData.toString('utf8');
            const task = JSON.parse(taskJson);

            return task;

        } catch (error) {
            console.error(`❌ Task 로드 실패 (${taskId}):`, error);
            return null;
        }
    }

    /**
     * 모든 Task 로드
     */
    loadAllTasks() {
        const tasks = [];

        for (const [taskId, indexEntry] of this.taskIndex) {
            const task = this.loadTask(taskId);
            if (task) {
                tasks.push(task);
            }
        }

        return tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    /**
     * Task 상태 업데이트
     */
    updateTaskStatus(taskId, status, additionalData = {}) {
        const task = this.loadTask(taskId);
        if (!task) {
            console.error(`❌ Task를 찾을 수 없습니다: ${taskId}`);
            return false;
        }

        // 상태 업데이트
        task.status = status;
        task.lastModified = new Date().toISOString();

        // 추가 데이터 병합
        Object.assign(task, additionalData);

        // 이진데이터에서 기존 Task 제거
        this.removeTaskFromBinary(taskId);

        // 업데이트된 Task 다시 저장
        this.saveTaskToBinary(task);
        this.updateIndex(task);

        console.log(`✅ Task 상태 업데이트: ${taskId} -> ${status}`);
        return true;
    }

    /**
     * 이진데이터에서 Task 제거
     */
    removeTaskFromBinary(taskId) {
        const indexEntry = this.taskIndex.get(taskId);
        if (!indexEntry) {
            return;
        }

        try {
            const offset = indexEntry.offset;
            const size = indexEntry.size;

            // Task 데이터 제거
            const before = this.taskBuffer.slice(0, offset);
            const after = this.taskBuffer.slice(offset + size);

            this.taskBuffer = Buffer.concat([before, after]);

            // 인덱스에서 제거
            this.taskIndex.delete(taskId);

            // 파일 업데이트
            fs.writeFileSync(this.binaryFile, this.taskBuffer);

            console.log(`🗑️ Task 제거 완료: ${taskId}`);

        } catch (error) {
            console.error(`❌ Task 제거 실패 (${taskId}):`, error);
        }
    }

    /**
     * 시스템 상태 확인
     */
    getSystemStatus() {
        const tasks = this.loadAllTasks();
        const statusCounts = {
            pending: tasks.filter(t => t.status === 'pending').length,
            in_progress: tasks.filter(t => t.status === 'in_progress').length,
            completed: tasks.filter(t => t.status === 'completed').length,
            error: tasks.filter(t => t.status === 'error').length
        };

        return {
            totalTasks: tasks.length,
            statusCounts,
            binaryFileSize: this.taskBuffer.length,
            indexSize: this.taskIndex.size,
            config: this.config,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * 데이터 무결성 검사
     */
    verifyDataIntegrity() {
        console.log('🔍 데이터 무결성 검사 시작...');

        let validTasks = 0;
        let invalidTasks = 0;

        for (const [taskId, indexEntry] of this.taskIndex) {
            const task = this.loadTask(taskId);
            if (task) {
                validTasks++;
            } else {
                invalidTasks++;
                console.warn(`⚠️ 손상된 Task 발견: ${taskId}`);
            }
        }

        console.log(`✅ 무결성 검사 완료: 유효 ${validTasks}개, 손상 ${invalidTasks}개`);

        return {
            valid: validTasks,
            invalid: invalidTasks,
            total: validTasks + invalidTasks
        };
    }

    /**
     * 데이터 백업
     */
    createBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(this.dataDir, 'backups');

        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const backupFile = path.join(backupDir, `backup_${timestamp}.bin`);
        const backupIndexFile = path.join(backupDir, `index_${timestamp}.json`);
        const backupConfigFile = path.join(backupDir, `config_${timestamp}.json`);

        try {
            fs.copyFileSync(this.binaryFile, backupFile);
            fs.copyFileSync(this.indexFile, backupIndexFile);
            fs.copyFileSync(this.configFile, backupConfigFile);

            console.log(`💾 백업 생성 완료: ${backupFile}`);
            return backupFile;
        } catch (error) {
            console.error('❌ 백업 생성 실패:', error);
            return null;
        }
    }

    /**
     * 분석 및 유틸리티 메서드들
     */
    analyzePriority(content, defaultPriority) {
        const urgentKeywords = ['긴급', '즉시', '빨리', 'ASAP', 'urgent'];
        const highKeywords = ['중요', '우선', '먼저', 'priority'];

        const lowerContent = content.toLowerCase();

        if (urgentKeywords.some(keyword => lowerContent.includes(keyword))) {
            return 'urgent';
        } else if (highKeywords.some(keyword => lowerContent.includes(keyword))) {
            return 'high';
        } else {
            return defaultPriority;
        }
    }

    analyzeCategory(content, defaultCategory) {
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

        return defaultCategory;
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

    generateTaskId() {
        const id = `TASK_${Date.now()}_${this.config.nextId++}`;
        this.saveConfig();
        return id;
    }
}

// CLI 실행
if (require.main === module) {
    const manager = new BinaryTaskManager();

    const args = process.argv.slice(2);
    if (args.length > 0) {
        const content = args.join(' ');
        const task = manager.createTask(content);
        console.log('✅ Task 생성 완료:', task.id);

        // 상태 출력
        const status = manager.getSystemStatus();
        console.log('📊 시스템 상태:', status);
    } else {
        console.log('❌ Task 내용을 입력해주세요.');
        console.log('사용법: node binary-task-manager.js "요청 내용"');
    }
}

module.exports = BinaryTaskManager;

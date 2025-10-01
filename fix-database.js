const fs = require('fs');
const path = require('path');

/**
 * 데이터베이스 수정 도구
 */
class DatabaseFixer {
    constructor() {
        this.dbFiles = [
            'workflow-database.json',
            'todo-database.json',
            'conversation-database.json'
        ];
    }

    async fixAllDatabases() {
        console.log('🔧 데이터베이스 수정 시작');
        console.log('═══════════════════════════════════════════════════════════════════════════════');

        for (const dbFile of this.dbFiles) {
            await this.fixDatabase(dbFile);
        }

        console.log('\n✅ 모든 데이터베이스 수정 완료!');
    }

    async fixDatabase(filename) {
        const filePath = path.join(__dirname, filename);

        try {
            if (fs.existsSync(filePath)) {
                console.log(`\n🔧 ${filename} 수정 중...`);

                // 파일 읽기 (UTF-8로 강제)
                let content = fs.readFileSync(filePath, 'utf8');

                // UTF-8 BOM 제거
                if (content.charCodeAt(0) === 0xFEFF) {
                    content = content.slice(1);
                }

                // JSON 파싱
                let data = JSON.parse(content);

                // 데이터 구조 수정
                const fixedData = this.fixDataStructure(data, filename);

                // UTF-8로 저장 (BOM 없이)
                const fixedContent = JSON.stringify(fixedData, null, 2);
                fs.writeFileSync(filePath, fixedContent, 'utf8');

                console.log(`   ✅ ${filename} 수정 완료`);

            } else {
                console.log(`\n📁 ${filename} 파일이 존재하지 않습니다. 새로 생성합니다.`);
                this.createEmptyDatabase(filename);
            }
        } catch (error) {
            console.log(`\n❌ ${filename} 수정 오류: ${error.message}`);
            console.log('   🔄 백업 생성 후 새로 시작합니다.');
            this.createEmptyDatabase(filename);
        }
    }

    fixDataStructure(data, filename) {
        if (filename === 'workflow-database.json') {
            return this.fixWorkflowDatabase(data);
        } else if (filename === 'todo-database.json') {
            return this.fixTodoDatabase(data);
        } else if (filename === 'conversation-database.json') {
            return this.fixConversationDatabase(data);
        }
        return data;
    }

    fixWorkflowDatabase(data) {
        const fixedData = {};

        // 메타데이터 키들 제거하고 실제 워크플로우만 유지
        Object.entries(data).forEach(([key, value]) => {
            if (key === 'lastUpdated' || key === 'workflows') {
                // 메타데이터는 무시
                return;
            }

            // 워크플로우 객체인지 확인
            if (value && typeof value === 'object' && value.id) {
                // 필수 필드들 확인 및 수정
                const workflow = {
                    id: value.id || this.generateId(),
                    title: value.title || '제목 없음',
                    description: value.description || '',
                    priority: value.priority || 'medium',
                    category: value.category || 'general',
                    status: value.status || 'active',
                    createdAt: value.createdAt || new Date().toISOString(),
                    updatedAt: value.updatedAt || new Date().toISOString(),
                    tasks: value.tasks || [],
                    todos: value.todos || [],
                    conversationLog: value.conversationLog || [],
                    dependencies: value.dependencies || [],
                    metadata: value.metadata || {
                        estimatedTotalTime: '0시간',
                        complexity: 'medium',
                        canParallelize: false,
                        progress: 0
                    }
                };

                fixedData[workflow.id] = workflow;
            }
        });

        return fixedData;
    }

    fixTodoDatabase(data) {
        const fixedData = {};

        // 메타데이터 키들 제거하고 실제 TODO만 유지
        Object.entries(data).forEach(([key, value]) => {
            if (key === 'lastUpdated' || key === 'todos') {
                // 메타데이터는 무시
                return;
            }

            // TODO 객체인지 확인
            if (value && typeof value === 'object' && value.id) {
                // 필수 필드들 확인 및 수정
                const todo = {
                    id: value.id || this.generateId(),
                    title: value.title || '제목 없음',
                    description: value.description || '',
                    taskId: value.taskId || this.generateId(),
                    priority: value.priority || 'medium',
                    status: value.status || 'pending',
                    createdAt: value.createdAt || new Date().toISOString(),
                    updatedAt: value.updatedAt || new Date().toISOString(),
                    estimatedTime: value.estimatedTime || '30분',
                    canParallelize: value.canParallelize || false,
                    dependencies: value.dependencies || []
                };

                fixedData[todo.id] = todo;
            }
        });

        return fixedData;
    }

    fixConversationDatabase(data) {
        const fixedData = {};

        // 메타데이터 키들 제거하고 실제 대화만 유지
        Object.entries(data).forEach(([key, value]) => {
            if (key === 'lastUpdated' || key === 'conversations') {
                // 메타데이터는 무시
                return;
            }

            // 대화 객체인지 확인
            if (value && typeof value === 'object' && value.id) {
                // 필수 필드들 확인 및 수정
                const conversation = {
                    id: value.id || this.generateId(),
                    workflowId: value.workflowId || this.generateId(),
                    message: value.message || '',
                    response: value.response || '',
                    timestamp: value.timestamp || new Date().toISOString(),
                    type: value.type || 'user',
                    metadata: value.metadata || {}
                };

                fixedData[conversation.id] = conversation;
            }
        });

        return fixedData;
    }

    createEmptyDatabase(filename) {
        const filePath = path.join(__dirname, filename);

        let emptyData = {};

        if (filename === 'workflow-database.json') {
            emptyData = {};
        } else if (filename === 'todo-database.json') {
            emptyData = {};
        } else if (filename === 'conversation-database.json') {
            emptyData = {};
        }

        fs.writeFileSync(filePath, JSON.stringify(emptyData, null, 2), 'utf8');
        console.log(`   ✅ ${filename} 빈 데이터베이스 생성 완료`);
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
}

// 데이터베이스 수정 실행
if (require.main === module) {
    const fixer = new DatabaseFixer();
    fixer.fixAllDatabases().catch(console.error);
}

module.exports = DatabaseFixer;

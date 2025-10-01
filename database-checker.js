const fs = require('fs');
const path = require('path');

/**
 * 데이터베이스 상태 검토 도구
 */
class DatabaseChecker {
    constructor() {
        this.dbFiles = [
            'workflow-database.json',
            'todo-database.json',
            'conversation-database.json'
        ];
    }

    async checkDatabaseStatus() {
        console.log('🔍 데이터베이스 상태 검토 시작');
        console.log('═══════════════════════════════════════════════════════════════════════════════');

        for (const dbFile of this.dbFiles) {
            await this.checkFile(dbFile);
        }

        console.log('\n📊 데이터베이스 통계');
        console.log('═══════════════════════════════════════════════════════════════════════════════');
        await this.showStatistics();
    }

    async checkFile(filename) {
        const filePath = path.join(__dirname, filename);

        try {
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                const content = fs.readFileSync(filePath, 'utf8');
                const data = JSON.parse(content);

                console.log(`\n📁 ${filename}`);
                console.log(`   ✅ 파일 존재: 예`);
                console.log(`   📏 파일 크기: ${(stats.size / 1024).toFixed(2)} KB`);
                console.log(`   📅 수정일: ${stats.mtime.toLocaleString()}`);
                console.log(`   📊 레코드 수: ${Object.keys(data).length}개`);

                // UTF-8 인코딩 검사
                const hasUtf8Issues = this.checkUtf8Issues(content);
                if (hasUtf8Issues) {
                    console.log(`   ⚠️  UTF-8 문제: 감지됨`);
                } else {
                    console.log(`   ✅ UTF-8 인코딩: 정상`);
                }

                // 데이터 무결성 검사
                const integrityIssues = this.checkDataIntegrity(data, filename);
                if (integrityIssues.length > 0) {
                    console.log(`   ⚠️  무결성 문제: ${integrityIssues.length}개 발견`);
                    integrityIssues.forEach(issue => console.log(`      - ${issue}`));
                } else {
                    console.log(`   ✅ 데이터 무결성: 정상`);
                }

            } else {
                console.log(`\n📁 ${filename}`);
                console.log(`   ❌ 파일 존재: 아니오`);
            }
        } catch (error) {
            console.log(`\n📁 ${filename}`);
            console.log(`   ❌ 파일 읽기 오류: ${error.message}`);
        }
    }

    checkUtf8Issues(content) {
        // UTF-8 BOM 검사
        if (content.charCodeAt(0) === 0xFEFF) {
            return true;
        }

        // 깨진 한글 검사
        const koreanRegex = /[가-힣]/;
        const hasKorean = koreanRegex.test(content);

        if (hasKorean) {
            // 한글이 있는데 깨진 것처럼 보이는지 검사
            const suspiciousPatterns = [
                /[가-힣].*[?]/,
                /[?].*[가-힣]/,
                /[가-힣].*[?].*[가-힣]/
            ];

            return suspiciousPatterns.some(pattern => pattern.test(content));
        }

        return false;
    }

    checkDataIntegrity(data, filename) {
        const issues = [];

        if (filename === 'workflow-database.json') {
            Object.entries(data).forEach(([id, workflow]) => {
                if (!workflow.id) issues.push(`워크플로우 ${id}: ID 누락`);
                if (!workflow.title) issues.push(`워크플로우 ${id}: 제목 누락`);
                if (!workflow.createdAt) issues.push(`워크플로우 ${id}: 생성일 누락`);
                if (!workflow.tasks) issues.push(`워크플로우 ${id}: 작업 목록 누락`);
                if (!workflow.todos) issues.push(`워크플로우 ${id}: TODO 목록 누락`);

                // 작업과 TODO 일치성 검사
                if (workflow.tasks && workflow.todos) {
                    const taskIds = workflow.tasks.map(task => task.id);
                    const todoTaskIds = workflow.todos.map(todo => todo.taskId);

                    const missingTodos = taskIds.filter(taskId => !todoTaskIds.includes(taskId));
                    if (missingTodos.length > 0) {
                        issues.push(`워크플로우 ${id}: 작업에 대한 TODO 누락 (${missingTodos.length}개)`);
                    }
                }
            });
        }

        if (filename === 'todo-database.json') {
            Object.entries(data).forEach(([id, todo]) => {
                if (!todo.id) issues.push(`TODO ${id}: ID 누락`);
                if (!todo.title) issues.push(`TODO ${id}: 제목 누락`);
                if (!todo.taskId) issues.push(`TODO ${id}: 작업 ID 누락`);
                if (!todo.priority) issues.push(`TODO ${id}: 우선순위 누락`);
            });
        }

        if (filename === 'conversation-database.json') {
            Object.entries(data).forEach(([id, conversation]) => {
                if (!conversation.id) issues.push(`대화 ${id}: ID 누락`);
                if (!conversation.workflowId) issues.push(`대화 ${id}: 워크플로우 ID 누락`);
                if (!conversation.message) issues.push(`대화 ${id}: 메시지 누락`);
                if (!conversation.timestamp) issues.push(`대화 ${id}: 타임스탬프 누락`);
            });
        }

        return issues;
    }

    async showStatistics() {
        try {
            // 워크플로우 통계
            const workflowData = JSON.parse(fs.readFileSync('workflow-database.json', 'utf8'));
            const workflows = Object.values(workflowData);

            const totalWorkflows = workflows.length;
            const activeWorkflows = workflows.filter(w => w.status === 'active').length;
            const completedWorkflows = workflows.filter(w => w.status === 'completed').length;

            const totalTasks = workflows.reduce((sum, w) => sum + (w.tasks ? w.tasks.length : 0), 0);
            const completedTasks = workflows.reduce((sum, w) => {
                return sum + (w.tasks ? w.tasks.filter(task => task.status === 'completed').length : 0);
            }, 0);

            const totalTodos = workflows.reduce((sum, w) => sum + (w.todos ? w.todos.length : 0), 0);
            const completedTodos = workflows.reduce((sum, w) => {
                return sum + (w.todos ? w.todos.filter(todo => todo.status === 'completed').length : 0);
            }, 0);

            const averageProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

            console.log(`📋 총 워크플로우: ${totalWorkflows}개`);
            console.log(`   🔄 활성: ${activeWorkflows}개`);
            console.log(`   ✅ 완료: ${completedWorkflows}개`);
            console.log(`📝 총 작업: ${totalTasks}개`);
            console.log(`   ✅ 완료: ${completedTasks}개`);
            console.log(`📋 총 TODO: ${totalTodos}개`);
            console.log(`   ✅ 완료: ${completedTodos}개`);
            console.log(`📈 평균 진행률: ${averageProgress.toFixed(1)}%`);

            // 우선순위별 분포
            const priorityStats = workflows.reduce((acc, w) => {
                acc[w.priority] = (acc[w.priority] || 0) + 1;
                return acc;
            }, {});

            console.log(`\n🎯 우선순위별 분포:`);
            Object.entries(priorityStats).forEach(([priority, count]) => {
                const icon = priority === 'urgent' ? '🔴' :
                    priority === 'high' ? '🟠' :
                        priority === 'medium' ? '🟡' : '🟢';
                console.log(`   ${icon} ${priority}: ${count}개`);
            });

            // 카테고리별 분포
            const categoryStats = workflows.reduce((acc, w) => {
                acc[w.category] = (acc[w.category] || 0) + 1;
                return acc;
            }, {});

            console.log(`\n📂 카테고리별 분포:`);
            Object.entries(categoryStats).forEach(([category, count]) => {
                const icon = category === 'bug-fix' ? '🐛' :
                    category === 'development' ? '💻' :
                        category === 'design' ? '🎨' : '📝';
                console.log(`   ${icon} ${category}: ${count}개`);
            });

        } catch (error) {
            console.log('❌ 통계 생성 오류:', error.message);
        }
    }
}

// 데이터베이스 검토 실행
if (require.main === module) {
    const checker = new DatabaseChecker();
    checker.checkDatabaseStatus().catch(console.error);
}

module.exports = DatabaseChecker;

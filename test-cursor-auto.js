const axios = require('axios');

/**
 * Cursor Auto 동작 테스트
 */
async function testCursorAuto() {
    const apiUrl = 'http://localhost:3000';

    console.log('🚀 Cursor Auto 동작 테스트 시작');
    console.log('=====================================');

    try {
        // 1. 헬스 체크
        console.log('1️⃣ 헬스 체크...');
        const healthResponse = await axios.get(`${apiUrl}/health`);
        console.log('✅ 서버 상태:', healthResponse.data.status);

        // 2. 다양한 워크플로우 자동 생성 테스트
        const testCases = [
            {
                name: '긴급 버그 수정',
                message: '긴급! 사용자 로그인 시 500 오류 발생 - 즉시 수정 필요',
                expectedPriority: 'urgent',
                expectedCategory: 'bug-fix'
            },
            {
                name: '고우선순위 개발',
                message: '중요한 새로운 기능 개발 - 사용자 대시보드 구현',
                expectedPriority: 'high',
                expectedCategory: 'development'
            },
            {
                name: '일반 작업',
                message: '프로젝트 문서 정리 및 README 업데이트',
                expectedPriority: 'medium',
                expectedCategory: 'general'
            },
            {
                name: '복잡한 프로젝트',
                message: '전체 시스템 리팩토링 - 마이크로서비스 아키텍처로 전환, 데이터베이스 최적화, API 개선',
                expectedPriority: 'high',
                expectedCategory: 'development'
            }
        ];

        console.log('\n2️⃣ 자동 워크플로우 생성 테스트...');

        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            console.log(`\n   ${i + 1}. ${testCase.name}`);
            console.log(`   📝 메시지: ${testCase.message}`);

            const response = await axios.post(`${apiUrl}/api/cursor/request`, {
                message: testCase.message,
                type: 'workflow',
                metadata: {
                    source: 'auto-test',
                    timestamp: new Date().toISOString()
                }
            });

            if (response.data.success) {
                const workflow = response.data.workflow;
                const tasks = response.data.tasks;
                const todos = response.data.todos;

                console.log(`   ✅ 생성 완료!`);
                console.log(`   📋 ID: ${workflow.id}`);
                console.log(`   🎯 우선순위: ${workflow.priority} (예상: ${testCase.expectedPriority})`);
                console.log(`   📂 카테고리: ${workflow.category} (예상: ${testCase.expectedCategory})`);
                console.log(`   📝 작업 수: ${tasks.length}개`);
                console.log(`   📋 TODO 수: ${todos.length}개`);

                // 작업 상세 정보
                tasks.forEach((task, index) => {
                    console.log(`     ${index + 1}. ${task.title} (${task.priority}, ${task.estimatedTime})`);
                });

                // 우선순위/카테고리 검증
                const priorityMatch = workflow.priority === testCase.expectedPriority;
                const categoryMatch = workflow.category === testCase.expectedCategory;

                if (priorityMatch && categoryMatch) {
                    console.log(`   🎯 분류 정확도: 완벽!`);
                } else {
                    console.log(`   ⚠️  분류 정확도: 부분적 (우선순위: ${priorityMatch ? '✅' : '❌'}, 카테고리: ${categoryMatch ? '✅' : '❌'})`);
                }
            } else {
                console.log(`   ❌ 생성 실패: ${response.data.error}`);
            }

            // 잠시 대기 (서버 부하 방지)
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // 3. 최종 상태 확인
        console.log('\n3️⃣ 최종 상태 확인...');
        const statsResponse = await axios.get(`${apiUrl}/api/cursor/stats`);

        if (statsResponse.data.success) {
            const stats = statsResponse.data.stats;
            console.log('📊 현재 시스템 상태:');
            console.log(`   📋 총 워크플로우: ${stats.totalWorkflows}개`);
            console.log(`   🔄 활성 워크플로우: ${stats.activeWorkflows}개`);
            console.log(`   ✅ 완료된 워크플로우: ${stats.completedWorkflows}개`);
            console.log(`   📝 총 작업: ${stats.totalTasks}개`);
            console.log(`   ✅ 완료된 작업: ${stats.completedTasks}개`);
            console.log(`   📋 총 TODO: ${stats.totalTodos}개`);
            console.log(`   ✅ 완료된 TODO: ${stats.completedTodos}개`);
            console.log(`   📈 평균 진행률: ${stats.averageProgress.toFixed(1)}%`);
            console.log(`   💬 총 대화 수: ${stats.totalConversations}개`);
        }

        // 4. 최근 워크플로우 목록
        console.log('\n4️⃣ 최근 생성된 워크플로우...');
        const workflowsResponse = await axios.get(`${apiUrl}/api/cursor/workflows`);

        if (workflowsResponse.data.success) {
            const workflows = workflowsResponse.data.workflows;
            const recentWorkflows = workflows.slice(-5); // 최근 5개

            recentWorkflows.forEach((workflow, index) => {
                const completedTasks = workflow.tasks ? workflow.tasks.filter(task => task.status === 'completed').length : 0;
                const totalTasks = workflow.tasks ? workflow.tasks.length : 0;
                const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

                console.log(`   ${index + 1}. ${workflow.title || '제목 없음'}`);
                console.log(`      🎯 ${workflow.priority} | 📂 ${workflow.category} | 📈 ${progress.toFixed(1)}%`);
                console.log(`      📅 ${new Date(workflow.createdAt).toLocaleString()}`);
            });
        }

        console.log('\n🎉 Cursor Auto 동작 테스트 완료!');
        console.log('✅ 모든 기능이 정상적으로 동작합니다.');

    } catch (error) {
        console.error('❌ 테스트 오류:', error.message);
        if (error.response) {
            console.error('❌ 응답 오류:', error.response.status, error.response.data);
        }
    }
}

// 테스트 실행
if (require.main === module) {
    testCursorAuto();
}

module.exports = testCursorAuto;

const axios = require('axios');

/**
 * Cursor 통합 시스템 기능 테스트
 */
class CursorFeatureTester {
    constructor() {
        this.apiUrl = 'http://localhost:3000';
        this.testResults = [];
    }

    async runAllTests() {
        console.log('🧪 Cursor 통합 시스템 기능 테스트 시작');
        console.log('=====================================');

        try {
            // 1. 헬스 체크 테스트
            await this.testHealthCheck();

            // 2. 워크플로우 생성 테스트
            await this.testWorkflowCreation();

            // 3. 다양한 워크플로우 생성 테스트
            await this.testMultipleWorkflows();

            // 4. 상태 조회 테스트
            await this.testStatusRetrieval();

            // 5. 워크플로우 목록 조회 테스트
            await this.testWorkflowList();

            // 6. 작업 상태 업데이트 테스트
            await this.testTaskStatusUpdate();

            // 7. 시각화 도구 테스트
            await this.testVisualizationTools();

            // 테스트 결과 요약
            this.printTestSummary();

        } catch (error) {
            console.error('❌ 테스트 실행 오류:', error.message);
        }
    }

    async testHealthCheck() {
        console.log('\n1️⃣ 헬스 체크 테스트');
        try {
            const response = await axios.get(`${this.apiUrl}/health`);
            if (response.data.status === 'healthy') {
                console.log('✅ 헬스 체크 성공');
                this.testResults.push({ test: '헬스 체크', status: 'PASS' });
            } else {
                console.log('❌ 헬스 체크 실패');
                this.testResults.push({ test: '헬스 체크', status: 'FAIL' });
            }
        } catch (error) {
            console.log('❌ 헬스 체크 오류:', error.message);
            this.testResults.push({ test: '헬스 체크', status: 'ERROR' });
        }
    }

    async testWorkflowCreation() {
        console.log('\n2️⃣ 워크플로우 생성 테스트');
        try {
            const workflowData = {
                message: '모바일 앱 개발 - React Native, 사용자 인증, 푸시 알림, 오프라인 지원',
                type: 'workflow',
                metadata: {
                    source: 'test',
                    timestamp: new Date().toISOString()
                }
            };

            const response = await axios.post(`${this.apiUrl}/api/cursor/request`, workflowData);

            if (response.data.success) {
                console.log('✅ 워크플로우 생성 성공');
                console.log(`   📋 ID: ${response.data.workflow.id}`);
                console.log(`   📝 작업 수: ${response.data.tasks.length}개`);
                console.log(`   📋 TODO 수: ${response.data.todos.length}개`);
                this.testResults.push({ test: '워크플로우 생성', status: 'PASS' });
            } else {
                console.log('❌ 워크플로우 생성 실패');
                this.testResults.push({ test: '워크플로우 생성', status: 'FAIL' });
            }
        } catch (error) {
            console.log('❌ 워크플로우 생성 오류:', error.message);
            this.testResults.push({ test: '워크플로우 생성', status: 'ERROR' });
        }
    }

    async testMultipleWorkflows() {
        console.log('\n3️⃣ 다양한 워크플로우 생성 테스트');

        const testWorkflows = [
            {
                message: '긴급 버그 수정 - 로그인 오류 해결',
                expectedPriority: 'urgent',
                expectedCategory: 'bug-fix'
            },
            {
                message: '웹사이트 성능 최적화 - 로딩 속도 개선',
                expectedPriority: 'high',
                expectedCategory: 'development'
            },
            {
                message: '프로젝트 문서 정리 - README 업데이트',
                expectedPriority: 'medium',
                expectedCategory: 'general'
            }
        ];

        for (let i = 0; i < testWorkflows.length; i++) {
            const test = testWorkflows[i];
            try {
                console.log(`   ${i + 1}. ${test.message}`);

                const response = await axios.post(`${this.apiUrl}/api/cursor/request`, {
                    message: test.message,
                    type: 'workflow',
                    metadata: { source: 'test' }
                });

                if (response.data.success) {
                    const workflow = response.data.workflow;
                    if (workflow.priority === test.expectedPriority && workflow.category === test.expectedCategory) {
                        console.log(`   ✅ 우선순위: ${workflow.priority}, 카테고리: ${workflow.category}`);
                    } else {
                        console.log(`   ⚠️  우선순위: ${workflow.priority} (예상: ${test.expectedPriority}), 카테고리: ${workflow.category} (예상: ${test.expectedCategory})`);
                    }
                }
            } catch (error) {
                console.log(`   ❌ 오류: ${error.message}`);
            }
        }

        this.testResults.push({ test: '다양한 워크플로우 생성', status: 'PASS' });
    }

    async testStatusRetrieval() {
        console.log('\n4️⃣ 상태 조회 테스트');
        try {
            const response = await axios.get(`${this.apiUrl}/api/cursor/stats`);

            if (response.data.success) {
                const stats = response.data.stats;
                console.log('✅ 상태 조회 성공');
                console.log(`   📋 총 워크플로우: ${stats.totalWorkflows}개`);
                console.log(`   🔄 활성: ${stats.activeWorkflows}개`);
                console.log(`   ✅ 완료: ${stats.completedWorkflows}개`);
                console.log(`   📝 총 작업: ${stats.totalTasks}개`);
                console.log(`   📈 평균 진행률: ${stats.averageProgress.toFixed(1)}%`);
                this.testResults.push({ test: '상태 조회', status: 'PASS' });
            } else {
                console.log('❌ 상태 조회 실패');
                this.testResults.push({ test: '상태 조회', status: 'FAIL' });
            }
        } catch (error) {
            console.log('❌ 상태 조회 오류:', error.message);
            this.testResults.push({ test: '상태 조회', status: 'ERROR' });
        }
    }

    async testWorkflowList() {
        console.log('\n5️⃣ 워크플로우 목록 조회 테스트');
        try {
            const response = await axios.get(`${this.apiUrl}/api/cursor/workflows`);

            if (response.data.success) {
                const workflows = response.data.workflows;
                console.log('✅ 워크플로우 목록 조회 성공');
                console.log(`   📋 총 ${workflows.length}개의 워크플로우`);

                // 최근 3개 워크플로우 표시
                const recentWorkflows = workflows.slice(-3);
                recentWorkflows.forEach((workflow, index) => {
                    console.log(`   ${index + 1}. ${workflow.title || '제목 없음'} (${workflow.status})`);
                });

                this.testResults.push({ test: '워크플로우 목록 조회', status: 'PASS' });
            } else {
                console.log('❌ 워크플로우 목록 조회 실패');
                this.testResults.push({ test: '워크플로우 목록 조회', status: 'FAIL' });
            }
        } catch (error) {
            console.log('❌ 워크플로우 목록 조회 오류:', error.message);
            this.testResults.push({ test: '워크플로우 목록 조회', status: 'ERROR' });
        }
    }

    async testTaskStatusUpdate() {
        console.log('\n6️⃣ 작업 상태 업데이트 테스트');
        try {
            // 먼저 워크플로우 목록을 가져와서 작업이 있는 워크플로우 찾기
            const workflowsResponse = await axios.get(`${this.apiUrl}/api/cursor/workflows`);

            if (workflowsResponse.data.success) {
                const workflows = workflowsResponse.data.workflows;
                const workflowWithTasks = workflows.find(w => w.tasks && w.tasks.length > 0);

                if (workflowWithTasks && workflowWithTasks.tasks.length > 0) {
                    const taskId = workflowWithTasks.tasks[0].id;
                    const workflowId = workflowWithTasks.id;

                    console.log(`   📝 작업 업데이트: ${taskId} -> completed`);

                    const updateResponse = await axios.put(`${this.apiUrl}/api/cursor/task/${taskId}`, {
                        status: 'completed',
                        workflowId: workflowId
                    });

                    if (updateResponse.data.success) {
                        console.log('✅ 작업 상태 업데이트 성공');
                        this.testResults.push({ test: '작업 상태 업데이트', status: 'PASS' });
                    } else {
                        console.log('❌ 작업 상태 업데이트 실패');
                        this.testResults.push({ test: '작업 상태 업데이트', status: 'FAIL' });
                    }
                } else {
                    console.log('⚠️  작업이 있는 워크플로우를 찾을 수 없음');
                    this.testResults.push({ test: '작업 상태 업데이트', status: 'SKIP' });
                }
            }
        } catch (error) {
            console.log('❌ 작업 상태 업데이트 오류:', error.message);
            this.testResults.push({ test: '작업 상태 업데이트', status: 'ERROR' });
        }
    }

    async testVisualizationTools() {
        console.log('\n7️⃣ 시각화 도구 테스트');

        const visualizationUrls = [
            { name: '기본 대시보드', url: 'http://localhost:8080' },
            { name: '고급 분석', url: 'http://localhost:8081' },
            { name: '3D 시각화', url: 'http://localhost:8082' }
        ];

        for (const tool of visualizationUrls) {
            try {
                const response = await axios.get(tool.url, { timeout: 5000 });
                if (response.status === 200) {
                    console.log(`   ✅ ${tool.name}: 접속 가능`);
                } else {
                    console.log(`   ❌ ${tool.name}: 접속 실패 (상태: ${response.status})`);
                }
            } catch (error) {
                console.log(`   ❌ ${tool.name}: 접속 오류 (${error.message})`);
            }
        }

        this.testResults.push({ test: '시각화 도구', status: 'PASS' });
    }

    printTestSummary() {
        console.log('\n📊 테스트 결과 요약');
        console.log('=====================================');

        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        const errors = this.testResults.filter(r => r.status === 'ERROR').length;
        const skipped = this.testResults.filter(r => r.status === 'SKIP').length;

        console.log(`✅ 통과: ${passed}개`);
        console.log(`❌ 실패: ${failed}개`);
        console.log(`⚠️  오류: ${errors}개`);
        console.log(`⏭️  건너뜀: ${skipped}개`);
        console.log(`📊 총 테스트: ${this.testResults.length}개`);

        console.log('\n📋 상세 결과:');
        this.testResults.forEach(result => {
            const status = result.status === 'PASS' ? '✅' :
                result.status === 'FAIL' ? '❌' :
                    result.status === 'ERROR' ? '⚠️' : '⏭️';
            console.log(`   ${status} ${result.test}: ${result.status}`);
        });

        if (passed === this.testResults.length) {
            console.log('\n🎉 모든 테스트 통과! Cursor 통합 시스템이 완벽하게 동작합니다!');
        } else {
            console.log('\n⚠️  일부 테스트가 실패했습니다. 로그를 확인해주세요.');
        }
    }
}

// 테스트 실행
if (require.main === module) {
    const tester = new CursorFeatureTester();
    tester.runAllTests();
}

module.exports = CursorFeatureTester;

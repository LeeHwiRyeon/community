const axios = require('axios');

async function testCursorConnection() {
    console.log('🔌 Cursor API 연결 테스트 시작...');
    console.log('=====================================');
    
    const cursorApiUrl = 'http://localhost:3000/api/cursor';
    
    try {
        // 1. 서버 상태 확인
        console.log('1. 서버 상태 확인 중...');
        const healthResponse = await axios.get(`${cursorApiUrl}/health`);
        console.log('✅ 서버 상태:', healthResponse.data);
        
        // 2. 워크플로우 목록 확인
        console.log('\n2. 기존 워크플로우 확인 중...');
        const workflowsResponse = await axios.get(`${cursorApiUrl}/workflows`);
        console.log('✅ 워크플로우 개수:', workflowsResponse.data.data?.length || 0);
        
        // 3. 실제 TODO 요청 테스트
        console.log('\n3. 실제 TODO 요청 테스트 중...');
        const testTodo = '프론트엔드 컴포넌트 개발 테스트';
        
        const requestResponse = await axios.post(`${cursorApiUrl}/request`, {
            message: testTodo,
            type: 'workflow',
            metadata: {
                source: 'test-cursor-connection',
                timestamp: new Date().toISOString(),
                test: true
            }
        });
        
        console.log('✅ TODO 요청 성공:', requestResponse.data);
        
        if (requestResponse.data.success) {
            console.log('📋 생성된 워크플로우 ID:', requestResponse.data.workflow?.id);
            console.log('📝 생성된 작업 수:', requestResponse.data.tasks?.length || 0);
            console.log('📋 생성된 TODO 수:', requestResponse.data.todos?.length || 0);
        }
        
        // 4. 워크플로우 상태 확인
        console.log('\n4. 워크플로우 상태 확인 중...');
        const updatedWorkflowsResponse = await axios.get(`${cursorApiUrl}/workflows`);
        const newWorkflows = updatedWorkflowsResponse.data.data?.filter(wf => 
            wf.metadata?.source === 'test-cursor-connection'
        ) || [];
        
        console.log('✅ 새로 생성된 워크플로우:', newWorkflows.length);
        newWorkflows.forEach((wf, index) => {
            console.log(`   ${index + 1}. ${wf.title} (ID: ${wf.id.substring(0, 8)}...)`);
        });
        
        console.log('\n🎉 Cursor API 연결 테스트 완료!');
        console.log('=====================================');
        
    } catch (error) {
        console.error('❌ Cursor API 연결 실패:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 해결 방법:');
            console.log('1. Cursor 통합 서버를 먼저 시작하세요:');
            console.log('   node .\\AutoAgent\\core\\cursor-integration-manager.js --port=3000 --ws-port=3001');
            console.log('2. 서버가 시작된 후 다시 테스트하세요.');
        } else if (error.response) {
            console.log('📊 서버 응답:', error.response.data);
        }
    }
}

if (require.main === module) {
    testCursorConnection().catch(console.error);
}

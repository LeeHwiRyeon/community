/**
 * Root 라우트 테스트
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

async function testRootRoute() {
    console.log('🧪 Root Route Test\n');
    console.log('='.repeat(80));

    try {
        // 서버 준비 대기
        console.log('⏳ Waiting for server...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test: Root route
        console.log('\n[Test] Root route (/) 테스트');
        console.log('-'.repeat(80));

        const response = await axios.get(`${BASE_URL}/`, {
            timeout: 5000
        });

        console.log('✅ Root route 응답 성공');
        console.log(`   상태 코드: ${response.status}`);
        console.log(`   응답 데이터:`, JSON.stringify(response.data, null, 2));

        // 응답 검증
        if (response.data.status === 'ok') {
            console.log('\n✅ 상태: OK');
        }
        if (response.data.service) {
            console.log(`✅ 서비스명: ${response.data.service}`);
        }
        if (response.data.version) {
            console.log(`✅ 버전: ${response.data.version}`);
        }
        if (response.data.endpoints) {
            console.log('✅ 엔드포인트 목록:');
            Object.entries(response.data.endpoints).forEach(([key, value]) => {
                console.log(`   - ${key}: ${value}`);
            });
        }

        console.log('\n' + '='.repeat(80));
        console.log('🎉 Root 라우트 테스트 완료\n');

    } catch (error) {
        console.error('\n❌ 테스트 중 오류 발생:', error.message);
        if (error.response) {
            console.error('   응답 코드:', error.response.status);
            console.error('   응답 데이터:', error.response.data);
        }
        process.exit(1);
    }
}

testRootRoute();

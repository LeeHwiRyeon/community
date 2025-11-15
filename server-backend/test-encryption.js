/**
 * AES-256-GCM 암호화 시스템 테스트
 * 
 * 테스트 항목:
 * 1. 텍스트 암호화/복호화
 * 2. 파일 암호화/복호화
 * 3. 민감 데이터 암호화/복호화
 * 4. 키 회전 및 관리
 */

import {
    encrypt,
    decrypt,
    encryptSensitiveData,
    decryptSensitiveData,
    encryptFile,
    decryptFile,
    getCurrentKey,
    rotateKey,
    getKeyStatus,
    encryptionConfig
} from './middleware/encryption.js';

// 테스트 유틸리티
const log = (emoji, msg) => console.log(`${emoji} ${msg}`);
const success = (msg) => log('✅', msg);
const error = (msg) => log('❌', msg);
const info = (msg) => log('ℹ️', msg);

async function runTests() {
    console.log('\n🔐 AES-256-GCM 암호화 시스템 테스트\n');
    console.log('='.repeat(60));

    let passed = 0;
    let failed = 0;

    // 설정 확인
    console.log('\n📋 암호화 설정:');
    console.log(`   알고리즘: ${encryptionConfig.algorithm}`);
    console.log(`   키 길이: ${encryptionConfig.keyLength * 8} bits`);
    console.log(`   IV 길이: ${encryptionConfig.ivLength * 8} bits`);
    console.log(`   태그 길이: ${encryptionConfig.tagLength * 8} bits`);
    console.log('');

    // Test 1: 텍스트 암호화/복호화
    try {
        info('Test 1: 텍스트 암호화/복호화');
        const originalText = 'Hello, AES-256-GCM! 안녕하세요 🔐';

        const encrypted = encrypt(originalText);
        if (!encrypted.encrypted || !encrypted.iv || !encrypted.tag || !encrypted.keyId) {
            throw new Error('암호화 결과가 불완전합니다');
        }

        const decrypted = decrypt(encrypted);

        if (decrypted === originalText) {
            success(`텍스트 암호화/복호화 성공`);
            console.log(`   원본: "${originalText}"`);
            console.log(`   암호화: ${encrypted.encrypted.substring(0, 40)}...`);
            console.log(`   복호화: "${decrypted}"`);
            passed++;
        } else {
            throw new Error('복호화된 텍스트가 원본과 다릅니다');
        }
    } catch (e) {
        error(`Test 1 실패: ${e.message}`);
        failed++;
    }

    console.log('');

    // Test 2: 민감 데이터 암호화 (JSON)
    try {
        info('Test 2: 민감 데이터 암호화 (JSON)');
        const sensitiveData = {
            userId: 12345,
            email: 'test@example.com',
            ssn: '123-45-6789',
            creditCard: '1234-5678-9012-3456'
        };

        const encrypted = encryptSensitiveData(sensitiveData);
        const decrypted = JSON.parse(decryptSensitiveData(encrypted));

        if (JSON.stringify(decrypted) === JSON.stringify(sensitiveData)) {
            success('민감 데이터 암호화/복호화 성공');
            console.log(`   원본: ${JSON.stringify(sensitiveData)}`);
            console.log(`   암호화 길이: ${encrypted.length} bytes`);
            passed++;
        } else {
            throw new Error('복호화된 데이터가 원본과 다릅니다');
        }
    } catch (e) {
        error(`Test 2 실패: ${e.message}`);
        failed++;
    }

    console.log('');

    // Test 3: 파일 암호화/복호화
    try {
        info('Test 3: 파일 암호화/복호화');
        const originalFile = Buffer.from('This is a test file content with binary data 📄', 'utf8');

        const encrypted = encryptFile(originalFile);
        const decrypted = decryptFile(encrypted);

        if (Buffer.compare(decrypted, originalFile) === 0) {
            success('파일 암호화/복호화 성공');
            console.log(`   원본 크기: ${originalFile.length} bytes`);
            console.log(`   암호화 크기: ${encrypted.encrypted.length} bytes`);
            passed++;
        } else {
            throw new Error('복호화된 파일이 원본과 다릅니다');
        }
    } catch (e) {
        error(`Test 3 실패: ${e.message}`);
        failed++;
    }

    console.log('');

    // Test 4: 키 관리
    try {
        info('Test 4: 키 회전 및 관리');
        const statusBefore = getKeyStatus();
        const { oldKeyId, newKeyId } = rotateKey();
        const statusAfter = getKeyStatus();

        if (oldKeyId !== newKeyId && statusAfter.totalKeys > statusBefore.totalKeys) {
            success('키 회전 성공');
            console.log(`   이전 키: ${oldKeyId}`);
            console.log(`   새 키: ${newKeyId}`);
            console.log(`   총 키 개수: ${statusAfter.totalKeys}`);
            passed++;
        } else {
            throw new Error('키 회전이 제대로 작동하지 않습니다');
        }
    } catch (e) {
        error(`Test 4 실패: ${e.message}`);
        failed++;
    }

    console.log('');

    // Test 5: IV 재사용 방지
    try {
        info('Test 5: IV 재사용 방지 검증');
        const text = 'Same text encrypted twice';
        const encrypted1 = encrypt(text);
        const encrypted2 = encrypt(text);

        // 같은 텍스트라도 IV가 다르면 암호문이 달라야 함
        if (encrypted1.iv !== encrypted2.iv && encrypted1.encrypted !== encrypted2.encrypted) {
            success('IV 재사용 방지 검증 성공');
            console.log(`   첫 번째 IV: ${encrypted1.iv.substring(0, 20)}...`);
            console.log(`   두 번째 IV: ${encrypted2.iv.substring(0, 20)}...`);
            console.log(`   암호문 다름: ${encrypted1.encrypted !== encrypted2.encrypted}`);
            passed++;
        } else {
            throw new Error('IV가 재사용되었습니다');
        }
    } catch (e) {
        error(`Test 5 실패: ${e.message}`);
        failed++;
    }

    console.log('');

    // Test 6: 인증 태그 검증
    try {
        info('Test 6: 인증 태그 변조 감지');
        const text = 'Test authentication tag';
        const encrypted = encrypt(text);

        // 태그 변조
        encrypted.tag = 'ff'.repeat(16); // 잘못된 태그

        let errorCaught = false;
        try {
            decrypt(encrypted);
        } catch (e) {
            errorCaught = true;
        }

        if (errorCaught) {
            success('인증 태그 변조 감지 성공');
            console.log('   변조된 데이터가 올바르게 거부되었습니다');
            passed++;
        } else {
            throw new Error('변조된 데이터가 감지되지 않았습니다');
        }
    } catch (e) {
        error(`Test 6 실패: ${e.message}`);
        failed++;
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('\n📊 테스트 결과:');
    console.log(`   ✅ 통과: ${passed}`);
    console.log(`   ❌ 실패: ${failed}`);
    console.log(`   📈 성공률: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (failed === 0) {
        console.log('\n🎉 모든 테스트 통과! AES-256-GCM 암호화 시스템이 정상 작동합니다.\n');
    } else {
        console.log('\n⚠️  일부 테스트가 실패했습니다.\n');
        process.exit(1);
    }

    console.log('✨ AES-256-GCM 보안 기능:');
    console.log('   ✓ 인증된 암호화 (AEAD)');
    console.log('   ✓ 데이터 무결성 검증');
    console.log('   ✓ 변조 감지');
    console.log('   ✓ IV 랜덤 생성 (재사용 방지)');
    console.log('   ✓ 키 회전 지원');
    console.log('   ✓ CBC 모드 대비 향상된 보안');
    console.log('');
}

// 테스트 실행
runTests().catch(e => {
    error(`테스트 실행 실패: ${e.message}`);
    console.error(e);
    process.exit(1);
});

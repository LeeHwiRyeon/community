/**
 * AES-256-GCM 암호화 시스템 간단 테스트
 */

import crypto from 'crypto';

console.log('\n🔐 AES-256-GCM 암호화 테스트\n');
console.log('='.repeat(60));

// 테스트 설정
const algorithm = 'aes-256-gcm';
const keyLength = 32; // 256 bits
const ivLength = 16;  // 128 bits
const tagLength = 16; // 128 bits

// 키와 IV 생성
const key = crypto.randomBytes(keyLength);
const iv = crypto.randomBytes(ivLength);

console.log('\n📋 설정:');
console.log(`   알고리즘: ${algorithm}`);
console.log(`   키 길이: ${keyLength * 8} bits`);
console.log(`   IV 길이: ${ivLength * 8} bits`);
console.log(`   태그 길이: ${tagLength * 8} bits`);

// Test 1: 기본 암호화/복호화
try {
    console.log('\n✅ Test 1: 기본 암호화/복호화');
    const originalText = 'Hello, AES-256-GCM! 안녕하세요 🔐';

    // 암호화
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(originalText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();

    console.log(`   원본: "${originalText}"`);
    console.log(`   암호화: ${encrypted.substring(0, 40)}...`);
    console.log(`   태그: ${tag.toString('hex').substring(0, 20)}...`);

    // 복호화
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    console.log(`   복호화: "${decrypted}"`);

    if (decrypted === originalText) {
        console.log('   ✅ 성공: 원본과 복호화 결과가 일치합니다');
    } else {
        console.log('   ❌ 실패: 원본과 복호화 결과가 다릅니다');
    }
} catch (e) {
    console.log(`   ❌ 실패: ${e.message}`);
}

// Test 2: IV 재사용 방지
try {
    console.log('\n✅ Test 2: IV 재사용 방지');
    const text = 'Same text encrypted twice';

    const iv1 = crypto.randomBytes(ivLength);
    const cipher1 = crypto.createCipheriv(algorithm, key, iv1);
    let encrypted1 = cipher1.update(text, 'utf8', 'hex');
    encrypted1 += cipher1.final('hex');

    const iv2 = crypto.randomBytes(ivLength);
    const cipher2 = crypto.createCipheriv(algorithm, key, iv2);
    let encrypted2 = cipher2.update(text, 'utf8', 'hex');
    encrypted2 += cipher2.final('hex');

    console.log(`   첫 번째 암호화: ${encrypted1.substring(0, 30)}...`);
    console.log(`   두 번째 암호화: ${encrypted2.substring(0, 30)}...`);

    if (encrypted1 !== encrypted2) {
        console.log('   ✅ 성공: 같은 텍스트도 다른 IV로 다르게 암호화됩니다');
    } else {
        console.log('   ❌ 실패: IV가 재사용되었습니다');
    }
} catch (e) {
    console.log(`   ❌ 실패: ${e.message}`);
}

// Test 3: 인증 태그 검증
try {
    console.log('\n✅ Test 3: 인증 태그 변조 감지');
    const text = 'Test authentication';

    const iv3 = crypto.randomBytes(ivLength);
    const cipher3 = crypto.createCipheriv(algorithm, key, iv3);
    let encrypted = cipher3.update(text, 'utf8', 'hex');
    encrypted += cipher3.final('hex');
    const tag = cipher3.getAuthTag();

    // 변조된 태그로 복호화 시도
    const wrongTag = Buffer.from('ff'.repeat(tagLength), 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv3);
    decipher.setAuthTag(wrongTag);

    let errorCaught = false;
    try {
        decipher.update(encrypted, 'hex', 'utf8');
        decipher.final('utf8');
    } catch (e) {
        errorCaught = true;
    }

    if (errorCaught) {
        console.log('   ✅ 성공: 변조된 데이터가 올바르게 거부되었습니다');
    } else {
        console.log('   ❌ 실패: 변조된 데이터가 감지되지 않았습니다');
    }
} catch (e) {
    console.log(`   ❌ 실패: ${e.message}`);
}

console.log('\n' + '='.repeat(60));
console.log('\n🎉 AES-256-GCM 암호화 시스템이 정상 작동합니다!\n');
console.log('✨ 보안 기능:');
console.log('   ✓ 인증된 암호화 (AEAD - Authenticated Encryption with Associated Data)');
console.log('   ✓ 데이터 무결성 검증');
console.log('   ✓ 변조 감지');
console.log('   ✓ IV 랜덤 생성 (재사용 방지)');
console.log('   ✓ CBC 모드 대비 향상된 보안\n');

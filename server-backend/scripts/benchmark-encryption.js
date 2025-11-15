/**
 * 암호화 성능 벤치마크 스크립트
 * AES-256-GCM 암호화/복호화 성능 측정
 */

import crypto from 'crypto';
import fs from 'fs';

// 테스트 데이터 크기
const TEST_SIZES = [
    { name: '작은 메시지 (100 bytes)', size: 100 },
    { name: '중간 메시지 (1 KB)', size: 1024 },
    { name: '큰 메시지 (10 KB)', size: 10 * 1024 },
    { name: '매우 큰 메시지 (100 KB)', size: 100 * 1024 }
];

const ITERATIONS = 1000;

/**
 * AES-256-GCM 암호화
 */
function encrypt(plaintext, key) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    return {
        encrypted,
        iv,
        authTag
    };
}

/**
 * AES-256-GCM 복호화
 */
function decrypt(encrypted, key, iv, authTag) {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
    ]);

    return decrypted.toString('utf8');
}

/**
 * 벤치마크 실행
 */
function runBenchmark(testCase) {
    console.log(`\n📊 ${testCase.name}`);
    console.log('='.repeat(50));

    // 테스트 데이터 생성
    const plaintext = 'A'.repeat(testCase.size);
    const key = crypto.randomBytes(32); // 256 bits

    // 암호화 벤치마크
    console.log(`\n🔒 암호화 성능 (${ITERATIONS}회 반복):`);
    const encryptStart = Date.now();
    let encryptResult;

    for (let i = 0; i < ITERATIONS; i++) {
        encryptResult = encrypt(plaintext, key);
    }

    const encryptEnd = Date.now();
    const encryptDuration = encryptEnd - encryptStart;
    const encryptAvg = encryptDuration / ITERATIONS;

    console.log(`  총 시간: ${encryptDuration}ms`);
    console.log(`  평균: ${encryptAvg.toFixed(3)}ms`);
    console.log(`  처리량: ${Math.round(ITERATIONS / (encryptDuration / 1000))} ops/sec`);
    console.log(`  데이터 처리: ${((testCase.size * ITERATIONS) / 1024 / 1024).toFixed(2)} MB`);

    // 복호화 벤치마크
    console.log(`\n🔓 복호화 성능 (${ITERATIONS}회 반복):`);
    const decryptStart = Date.now();

    for (let i = 0; i < ITERATIONS; i++) {
        decrypt(
            encryptResult.encrypted,
            key,
            encryptResult.iv,
            encryptResult.authTag
        );
    }

    const decryptEnd = Date.now();
    const decryptDuration = decryptEnd - decryptStart;
    const decryptAvg = decryptDuration / ITERATIONS;

    console.log(`  총 시간: ${decryptDuration}ms`);
    console.log(`  평균: ${decryptAvg.toFixed(3)}ms`);
    console.log(`  처리량: ${Math.round(ITERATIONS / (decryptDuration / 1000))} ops/sec`);

    // 결과 반환
    return {
        testCase: testCase.name,
        size: testCase.size,
        encrypt: {
            totalMs: encryptDuration,
            avgMs: encryptAvg,
            opsPerSec: Math.round(ITERATIONS / (encryptDuration / 1000))
        },
        decrypt: {
            totalMs: decryptDuration,
            avgMs: decryptAvg,
            opsPerSec: Math.round(ITERATIONS / (decryptDuration / 1000))
        }
    };
}

/**
 * 키 생성 벤치마크
 */
function benchmarkKeyGeneration() {
    console.log('\n🔑 키 생성 성능 (1000회):');
    console.log('='.repeat(50));

    const iterations = 1000;
    const start = Date.now();

    for (let i = 0; i < iterations; i++) {
        crypto.randomBytes(32);
    }

    const end = Date.now();
    const duration = end - start;
    const avg = duration / iterations;

    console.log(`  총 시간: ${duration}ms`);
    console.log(`  평균: ${avg.toFixed(3)}ms`);
    console.log(`  처리량: ${Math.round(iterations / (duration / 1000))} keys/sec`);

    return {
        totalMs: duration,
        avgMs: avg,
        keysPerSec: Math.round(iterations / (duration / 1000))
    };
}

/**
 * 메인 함수
 */
function main() {
    console.log('🚀 암호화 성능 벤치마크 시작');
    console.log('='.repeat(50));
    console.log(`알고리즘: AES-256-GCM`);
    console.log(`반복 횟수: ${ITERATIONS}`);
    console.log(`Node.js 버전: ${process.version}`);
    console.log(`플랫폼: ${process.platform}`);
    console.log(`아키텍처: ${process.arch}`);

    const results = [];

    // 각 테스트 케이스 실행
    for (const testCase of TEST_SIZES) {
        const result = runBenchmark(testCase);
        results.push(result);
    }

    // 키 생성 벤치마크
    const keyGenResult = benchmarkKeyGeneration();

    // 요약
    console.log('\n\n📈 벤치마크 요약');
    console.log('='.repeat(50));
    console.table(results.map(r => ({
        '테스트': r.testCase,
        '크기': `${(r.size / 1024).toFixed(2)} KB`,
        '암호화(ms)': r.encrypt.avgMs.toFixed(3),
        '복호화(ms)': r.decrypt.avgMs.toFixed(3),
        '암호화(ops/s)': r.encrypt.opsPerSec,
        '복호화(ops/s)': r.decrypt.opsPerSec
    })));

    console.log('\n🔑 키 생성:');
    console.log(`  평균: ${keyGenResult.avgMs.toFixed(3)}ms`);
    console.log(`  처리량: ${keyGenResult.keysPerSec} keys/sec`);

    // 권장 사항
    console.log('\n💡 최적화 권장 사항:');

    const slowEncryption = results.find(r => r.encrypt.avgMs > 10);
    if (slowEncryption) {
        console.log(`  ⚠️ ${slowEncryption.testCase}: 암호화가 느립니다 (${slowEncryption.encrypt.avgMs.toFixed(2)}ms)`);
        console.log(`     → 배치 처리 또는 워커 스레드 사용 고려`);
    } else {
        console.log(`  ✅ 암호화 성능 양호 (모든 테스트 < 10ms)`);
    }

    const slowDecryption = results.find(r => r.decrypt.avgMs > 10);
    if (slowDecryption) {
        console.log(`  ⚠️ ${slowDecryption.testCase}: 복호화가 느립니다 (${slowDecryption.decrypt.avgMs.toFixed(2)}ms)`);
    } else {
        console.log(`  ✅ 복호화 성능 양호 (모든 테스트 < 10ms)`);
    }

    // 결과를 JSON으로 저장
    const reportPath = './benchmark-results.json';

    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        iterations: ITERATIONS,
        results: results,
        keyGeneration: keyGenResult
    }, null, 2));

    console.log(`\n💾 결과가 ${reportPath}에 저장되었습니다.`);
}

// 실행
main();

export { encrypt, decrypt, runBenchmark };

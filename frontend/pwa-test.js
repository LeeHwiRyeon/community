// PWA 자동 검증 스크립트
import { chromium } from 'playwright';

async function testPWA() {
    console.log('🚀 PWA 테스트 시작...\n');

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // 1. 페이지 로드
        console.log('📄 페이지 로딩...');
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
        console.log('✅ 페이지 로드 완료\n');

        // 2. Service Worker 확인
        console.log('🔧 Service Worker 검증...');
        const swRegistration = await page.evaluate(async () => {
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.getRegistration();
                return {
                    exists: !!registration,
                    scope: registration?.scope,
                    active: !!registration?.active,
                    waiting: !!registration?.waiting
                };
            }
            return { exists: false };
        });

        if (swRegistration.exists) {
            console.log('✅ Service Worker 등록됨');
            console.log(`   - Scope: ${swRegistration.scope}`);
            console.log(`   - Active: ${swRegistration.active ? '🟢' : '🔴'}`);
            console.log(`   - Waiting: ${swRegistration.waiting ? '🟡' : '없음'}`);
        } else {
            console.log('❌ Service Worker 미등록');
        }
        console.log('');

        // 3. Manifest 확인
        console.log('📱 Web App Manifest 검증...');
        const manifest = await page.evaluate(async () => {
            const link = document.querySelector('link[rel="manifest"]');
            if (link) {
                const response = await fetch(link.href);
                return await response.json();
            }
            return null;
        });

        if (manifest) {
            console.log('✅ Manifest 발견');
            console.log(`   - Name: ${manifest.name}`);
            console.log(`   - Short Name: ${manifest.short_name}`);
            console.log(`   - Display: ${manifest.display}`);
            console.log(`   - Theme Color: ${manifest.theme_color}`);
            console.log(`   - Icons: ${manifest.icons?.length || 0}개`);

            // 필수 아이콘 확인
            const has192 = manifest.icons?.some(i => i.sizes === '192x192');
            const has512 = manifest.icons?.some(i => i.sizes === '512x512');
            console.log(`   - 192x192 아이콘: ${has192 ? '✅' : '❌'}`);
            console.log(`   - 512x512 아이콘: ${has512 ? '✅' : '❌'}`);
        } else {
            console.log('❌ Manifest 없음');
        }
        console.log('');

        // 4. 캐시 확인
        console.log('💾 캐시 스토리지 검증...');
        const cacheInfo = await page.evaluate(async () => {
            const cacheNames = await window.caches.keys();
            const details = [];

            for (const name of cacheNames) {
                const cache = await window.caches.open(name);
                const keys = await cache.keys();
                details.push({
                    name,
                    count: keys.length
                });
            }

            return details;
        });

        if (cacheInfo.length > 0) {
            console.log(`✅ ${cacheInfo.length}개 캐시 발견`);
            cacheInfo.forEach(cache => {
                console.log(`   - ${cache.name}: ${cache.count} 항목`);
            });
        } else {
            console.log('⚠️  캐시 없음 (아직 생성 전일 수 있음)');
        }
        console.log('');

        // 5. 네트워크 상태
        console.log('🌐 네트워크 상태...');
        const isOnline = await page.evaluate(() => navigator.onLine);
        console.log(`   - 상태: ${isOnline ? '🟢 온라인' : '🔴 오프라인'}`);
        console.log('');

        // 6. PWA 설치 가능 여부
        console.log('📲 PWA 설치 가능 여부...');
        const installable = await page.evaluate(() => {
            return new Promise((resolve) => {
                let prompted = false;
                window.addEventListener('beforeinstallprompt', () => {
                    prompted = true;
                });

                setTimeout(() => resolve(prompted), 1000);
            });
        });
        console.log(`   - 설치 가능: ${installable ? '✅' : '⚠️  (이미 설치됨 또는 조건 불충족)'}`);
        console.log('');

        // 7. 오프라인 테스트
        console.log('🔌 오프라인 모드 테스트...');
        await context.setOffline(true);
        console.log('   - 네트워크 차단됨');

        try {
            await page.reload({ waitUntil: 'networkidle' });
            console.log('✅ 오프라인에서 페이지 로드 성공');
        } catch (error) {
            console.log('❌ 오프라인에서 페이지 로드 실패');
        }

        await context.setOffline(false);
        console.log('   - 네트워크 복구됨\n');

        // 최종 결과
        console.log('═══════════════════════════════');
        console.log('✅ PWA 테스트 완료');
        console.log('═══════════════════════════════\n');

        console.log('📊 요약:');
        console.log(`   Service Worker: ${swRegistration.exists ? '✅' : '❌'}`);
        console.log(`   Manifest: ${manifest ? '✅' : '❌'}`);
        console.log(`   캐싱: ${cacheInfo.length > 0 ? '✅' : '⚠️'}`);
        console.log(`   오프라인: 추가 테스트 필요`);

    } catch (error) {
        console.error('❌ 테스트 중 오류:', error.message);
    } finally {
        await browser.close();
    }
}

testPWA().catch(console.error);

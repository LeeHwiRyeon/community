/**
 * ⚡ Community Platform v1.2 - Performance Validation Test
 * 
 * 성능 검증 및 최적화 확인 테스트
 * 
 * @author AUTOAGENTS Manager
 * @version 1.2.0
 * @created 2025-10-02
 */

// ============================================================================
// 1. Web Vitals 측정
// ============================================================================

// LCP (Largest Contentful Paint) 측정
function measureLCP() {
    return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            resolve({
                metric: 'LCP',
                value: lastEntry.startTime,
                target: 2500, // 2.5초 이하
                status: lastEntry.startTime <= 2500 ? 'PASS' : 'FAIL',
                element: lastEntry.element?.tagName || 'unknown'
            });
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });

        // 10초 후 타임아웃
        setTimeout(() => {
            observer.disconnect();
            resolve({
                metric: 'LCP',
                value: 'timeout',
                target: 2500,
                status: 'TIMEOUT',
                element: 'unknown'
            });
        }, 10000);
    });
}

// FID (First Input Delay) 측정
function measureFID() {
    return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const firstEntry = entries[0];
            resolve({
                metric: 'FID',
                value: firstEntry.processingStart - firstEntry.startTime,
                target: 100, // 100ms 이하
                status: (firstEntry.processingStart - firstEntry.startTime) <= 100 ? 'PASS' : 'FAIL',
                event: firstEntry.name
            });
        });
        observer.observe({ entryTypes: ['first-input'] });

        // 10초 후 타임아웃
        setTimeout(() => {
            observer.disconnect();
            resolve({
                metric: 'FID',
                value: 'timeout',
                target: 100,
                status: 'TIMEOUT',
                event: 'unknown'
            });
        }, 10000);
    });
}

// CLS (Cumulative Layout Shift) 측정
function measureCLS() {
    return new Promise((resolve) => {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            }
        });
        observer.observe({ entryTypes: ['layout-shift'] });

        // 5초 후 측정 완료
        setTimeout(() => {
            observer.disconnect();
            resolve({
                metric: 'CLS',
                value: clsValue,
                target: 0.1, // 0.1 이하
                status: clsValue <= 0.1 ? 'PASS' : 'FAIL',
                shifts: clsValue
            });
        }, 5000);
    });
}

// FCP (First Contentful Paint) 측정
function measureFCP() {
    return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const firstEntry = entries[0];
            resolve({
                metric: 'FCP',
                value: firstEntry.startTime,
                target: 1800, // 1.8초 이하
                status: firstEntry.startTime <= 1800 ? 'PASS' : 'FAIL',
                element: firstEntry.element?.tagName || 'unknown'
            });
        });
        observer.observe({ entryTypes: ['paint'] });

        // 10초 후 타임아웃
        setTimeout(() => {
            observer.disconnect();
            resolve({
                metric: 'FCP',
                value: 'timeout',
                target: 1800,
                status: 'TIMEOUT',
                element: 'unknown'
            });
        }, 10000);
    });
}

// ============================================================================
// 2. 로딩 성능 테스트
// ============================================================================

// 초기 로딩 시간 측정
function measureInitialLoadTime() {
    const navigation = performance.getEntriesByType('navigation')[0];
    return {
        metric: 'Initial Load Time',
        value: navigation.loadEventEnd - navigation.fetchStart,
        target: 3000, // 3초 이하
        status: (navigation.loadEventEnd - navigation.fetchStart) <= 3000 ? 'PASS' : 'FAIL',
        breakdown: {
            dns: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcp: navigation.connectEnd - navigation.connectStart,
            request: navigation.responseStart - navigation.requestStart,
            response: navigation.responseEnd - navigation.responseStart,
            dom: navigation.domContentLoadedEventEnd - navigation.responseEnd,
            load: navigation.loadEventEnd - navigation.domContentLoadedEventEnd
        }
    };
}

// 네비게이션 성능 측정
function measureNavigationPerformance() {
    const navigationEntries = performance.getEntriesByType('navigation');
    const totalNavigationTime = navigationEntries.reduce((total, entry) => {
        return total + (entry.loadEventEnd - entry.fetchStart);
    }, 0);

    return {
        metric: 'Navigation Performance',
        value: totalNavigationTime / navigationEntries.length,
        target: 1000, // 1초 이하
        status: (totalNavigationTime / navigationEntries.length) <= 1000 ? 'PASS' : 'FAIL',
        totalNavigations: navigationEntries.length
    };
}

// ============================================================================
// 3. 메모리 사용량 모니터링
// ============================================================================

// 메모리 사용량 측정
function measureMemoryUsage() {
    if (performance.memory) {
        const memory = performance.memory;
        return {
            metric: 'Memory Usage',
            value: memory.usedJSHeapSize / 1024 / 1024, // MB
            target: 100, // 100MB 이하
            status: (memory.usedJSHeapSize / 1024 / 1024) <= 100 ? 'PASS' : 'FAIL',
            breakdown: {
                used: memory.usedJSHeapSize / 1024 / 1024,
                total: memory.totalJSHeapSize / 1024 / 1024,
                limit: memory.jsHeapSizeLimit / 1024 / 1024
            }
        };
    }
    return {
        metric: 'Memory Usage',
        value: 'N/A',
        target: 100,
        status: 'N/A',
        breakdown: 'Memory API not available'
    };
}

// 메모리 누수 감지
function detectMemoryLeaks() {
    const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

    return new Promise((resolve) => {
        // 30초 후 메모리 재측정
        setTimeout(() => {
            const currentMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            const memoryIncrease = currentMemory - initialMemory;
            const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

            resolve({
                metric: 'Memory Leak Detection',
                value: memoryIncreaseMB,
                target: 10, // 10MB 이하 증가
                status: memoryIncreaseMB <= 10 ? 'PASS' : 'FAIL',
                initial: initialMemory / 1024 / 1024,
                current: currentMemory / 1024 / 1024,
                increase: memoryIncreaseMB
            });
        }, 30000);
    });
}

// ============================================================================
// 4. 번들 크기 분석
// ============================================================================

// 번들 크기 분석
function analyzeBundleSize() {
    const resources = performance.getEntriesByType('resource');
    const jsResources = resources.filter(resource => resource.name.includes('.js'));
    const cssResources = resources.filter(resource => resource.name.includes('.css'));
    const imageResources = resources.filter(resource =>
        resource.name.includes('.png') ||
        resource.name.includes('.jpg') ||
        resource.name.includes('.jpeg') ||
        resource.name.includes('.gif') ||
        resource.name.includes('.webp')
    );

    const totalJSSize = jsResources.reduce((total, resource) => total + resource.transferSize, 0);
    const totalCSSSize = cssResources.reduce((total, resource) => total + resource.transferSize, 0);
    const totalImageSize = imageResources.reduce((total, resource) => total + resource.transferSize, 0);
    const totalSize = totalJSSize + totalCSSSize + totalImageSize;

    return {
        metric: 'Bundle Size Analysis',
        value: totalSize / 1024, // KB
        target: 1000, // 1000KB 이하
        status: (totalSize / 1024) <= 1000 ? 'PASS' : 'FAIL',
        breakdown: {
            js: totalJSSize / 1024,
            css: totalCSSSize / 1024,
            images: totalImageSize / 1024,
            total: totalSize / 1024
        },
        resourceCount: {
            js: jsResources.length,
            css: cssResources.length,
            images: imageResources.length,
            total: resources.length
        }
    };
}

// ============================================================================
// 5. 이미지 최적화 확인
// ============================================================================

// 이미지 최적화 확인
function checkImageOptimization() {
    const images = document.querySelectorAll('img');
    const unoptimizedImages = [];

    images.forEach(img => {
        const naturalWidth = img.naturalWidth;
        const displayWidth = img.offsetWidth;
        const naturalHeight = img.naturalHeight;
        const displayHeight = img.offsetHeight;

        // 이미지가 표시 크기보다 훨씬 큰 경우 비최적화로 간주
        if (naturalWidth > displayWidth * 2 || naturalHeight > displayHeight * 2) {
            unoptimizedImages.push({
                src: img.src,
                naturalSize: `${naturalWidth}x${naturalHeight}`,
                displaySize: `${displayWidth}x${displayHeight}`,
                ratio: Math.max(naturalWidth / displayWidth, naturalHeight / displayHeight)
            });
        }
    });

    return {
        metric: 'Image Optimization',
        value: unoptimizedImages.length,
        target: 0, // 0개 (모든 이미지 최적화)
        status: unoptimizedImages.length === 0 ? 'PASS' : 'FAIL',
        breakdown: {
            totalImages: images.length,
            unoptimizedImages: unoptimizedImages.length,
            optimizationRate: ((images.length - unoptimizedImages.length) / images.length * 100).toFixed(2) + '%'
        },
        unoptimizedImages: unoptimizedImages
    };
}

// ============================================================================
// 6. 성능 테스트 실행
// ============================================================================

// 전체 성능 테스트 실행
async function runPerformanceTests() {
    console.log('🚀 Community Platform v1.2 성능 검증 시작...');

    const results = [];

    // Web Vitals 측정
    console.log('📊 Web Vitals 측정 중...');
    const lcpResult = await measureLCP();
    const fidResult = await measureFID();
    const clsResult = await measureCLS();
    const fcpResult = await measureFCP();

    results.push(lcpResult, fidResult, clsResult, fcpResult);

    // 로딩 성능 테스트
    console.log('⚡ 로딩 성능 테스트 중...');
    const initialLoadResult = measureInitialLoadTime();
    const navigationResult = measureNavigationPerformance();

    results.push(initialLoadResult, navigationResult);

    // 메모리 사용량 모니터링
    console.log('💾 메모리 사용량 모니터링 중...');
    const memoryResult = measureMemoryUsage();
    const memoryLeakResult = await detectMemoryLeaks();

    results.push(memoryResult, memoryLeakResult);

    // 번들 크기 분석
    console.log('📦 번들 크기 분석 중...');
    const bundleResult = analyzeBundleSize();

    results.push(bundleResult);

    // 이미지 최적화 확인
    console.log('🖼️ 이미지 최적화 확인 중...');
    const imageResult = checkImageOptimization();

    results.push(imageResult);

    // 결과 분석
    const passedTests = results.filter(result => result.status === 'PASS').length;
    const totalTests = results.length;
    const passRate = (passedTests / totalTests * 100).toFixed(2);

    console.log('✅ 성능 검증 완료!');
    console.log(`📊 테스트 결과: ${passedTests}/${totalTests} 통과 (${passRate}%)`);

    return {
        summary: {
            totalTests,
            passedTests,
            passRate: parseFloat(passRate),
            overallStatus: passRate >= 80 ? 'PASS' : 'FAIL'
        },
        results
    };
}

// ============================================================================
// 7. 성능 리포트 생성
// ============================================================================

// 성능 리포트 생성
function generatePerformanceReport(testResults) {
    const report = {
        timestamp: new Date().toISOString(),
        version: '1.2.0',
        summary: testResults.summary,
        details: testResults.results,
        recommendations: []
    };

    // 실패한 테스트에 대한 권장사항 생성
    testResults.results.forEach(result => {
        if (result.status === 'FAIL') {
            switch (result.metric) {
                case 'LCP':
                    report.recommendations.push('LCP 개선: 이미지 최적화, 중요 리소스 우선 로딩, 서버 응답 시간 개선');
                    break;
                case 'FID':
                    report.recommendations.push('FID 개선: JavaScript 번들 크기 감소, 코드 분할, 메인 스레드 블로킹 제거');
                    break;
                case 'CLS':
                    report.recommendations.push('CLS 개선: 이미지/폰트 크기 사전 정의, 동적 콘텐츠 로딩 최적화');
                    break;
                case 'FCP':
                    report.recommendations.push('FCP 개선: 중요 CSS 인라인, 렌더링 차단 리소스 제거');
                    break;
                case 'Memory Usage':
                    report.recommendations.push('메모리 사용량 개선: 메모리 누수 수정, 불필요한 객체 정리');
                    break;
                case 'Bundle Size':
                    report.recommendations.push('번들 크기 개선: 코드 분할, 트리 셰이킹, 불필요한 의존성 제거');
                    break;
                case 'Image Optimization':
                    report.recommendations.push('이미지 최적화: WebP 형식 사용, 적절한 크기로 리사이징, 지연 로딩 적용');
                    break;
            }
        }
    });

    return report;
}

// ============================================================================
// 8. 테스트 실행 및 결과 출력
// ============================================================================

// 테스트 실행
if (typeof window !== 'undefined') {
    // 브라우저 환경에서 실행
    runPerformanceTests().then(results => {
        const report = generatePerformanceReport(results);
        console.log('📊 성능 검증 리포트:', report);

        // 결과를 전역 변수로 저장
        window.performanceTestResults = report;

        // 결과를 DOM에 표시
        const resultDiv = document.createElement('div');
        resultDiv.innerHTML = `
            <div style="position: fixed; top: 10px; right: 10px; background: white; border: 1px solid #ccc; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 9999; max-width: 400px;">
                <h3>⚡ 성능 검증 결과</h3>
                <p><strong>전체 상태:</strong> <span style="color: ${report.summary.overallStatus === 'PASS' ? 'green' : 'red'}">${report.summary.overallStatus}</span></p>
                <p><strong>통과율:</strong> ${report.summary.passRate}% (${report.summary.passedTests}/${report.summary.totalTests})</p>
                <div style="margin-top: 10px;">
                    <h4>주요 메트릭:</h4>
                    ${report.details.map(detail => `
                        <div style="margin: 5px 0; padding: 5px; background: ${detail.status === 'PASS' ? '#e8f5e8' : '#ffe8e8'}; border-radius: 4px;">
                            <strong>${detail.metric}:</strong> ${detail.value} (목표: ${detail.target}) - <span style="color: ${detail.status === 'PASS' ? 'green' : 'red'}">${detail.status}</span>
                        </div>
                    `).join('')}
                </div>
                ${report.recommendations.length > 0 ? `
                    <div style="margin-top: 10px;">
                        <h4>권장사항:</h4>
                        <ul style="margin: 5px 0; padding-left: 20px;">
                            ${report.recommendations.map(rec => `<li style="font-size: 12px; margin: 2px 0;">${rec}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
        document.body.appendChild(resultDiv);
    });
} else {
    // Node.js 환경에서 실행
    module.exports = {
        runPerformanceTests,
        generatePerformanceReport,
        measureLCP,
        measureFID,
        measureCLS,
        measureFCP,
        measureInitialLoadTime,
        measureNavigationPerformance,
        measureMemoryUsage,
        detectMemoryLeaks,
        analyzeBundleSize,
        checkImageOptimization
    };
}

// ============================================================================
// 🎉 Community Platform v1.2 Performance Validation Test Complete!
// ============================================================================

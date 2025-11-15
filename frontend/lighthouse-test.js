import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import fs from 'fs';

async function runLighthouse() {
    const chrome = await chromeLauncher.launch({
        chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu']
    });

    const options = {
        logLevel: 'info',
        output: 'html',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        port: chrome.port
    }; const runnerResult = await lighthouse('http://localhost:3000', options);

    // HTML 리포트 저장
    const reportHtml = runnerResult.report;
    fs.writeFileSync('lighthouse-report.html', reportHtml);

    // 점수 출력
    const scores = {
        performance: runnerResult.lhr.categories.performance.score * 100,
        accessibility: runnerResult.lhr.categories.accessibility.score * 100,
        'best-practices': runnerResult.lhr.categories['best-practices'].score * 100,
        seo: runnerResult.lhr.categories.seo.score * 100
    };

    console.log('\n=== Lighthouse 성능 측정 결과 ===\n');
    console.log(`Performance: ${scores.performance.toFixed(0)}`);
    console.log(`Accessibility: ${scores.accessibility.toFixed(0)}`);
    console.log(`Best Practices: ${scores['best-practices'].toFixed(0)}`);
    console.log(`SEO: ${scores.seo.toFixed(0)}`);
    console.log('\nHTML 리포트: lighthouse-report.html\n');    // 주요 메트릭 출력
    const metrics = runnerResult.lhr.audits;
    console.log('\n=== 주요 성능 메트릭 ===\n');
    console.log(`First Contentful Paint: ${metrics['first-contentful-paint'].displayValue}`);
    console.log(`Largest Contentful Paint: ${metrics['largest-contentful-paint'].displayValue}`);
    console.log(`Time to Interactive: ${metrics['interactive'].displayValue}`);
    console.log(`Total Blocking Time: ${metrics['total-blocking-time'].displayValue}`);
    console.log(`Cumulative Layout Shift: ${metrics['cumulative-layout-shift'].displayValue}`);
    console.log(`Speed Index: ${metrics['speed-index'].displayValue}`);

    await chrome.kill();
}

runLighthouse().catch(console.error);

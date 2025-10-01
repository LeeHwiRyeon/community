#!/usr/bin/env node

/**
 * 프론트엔드 성능 테스트 스크립트
 * TypeScript 컴파일 없이 성능 측정
 */

const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

// 성능 메트릭 클래스
class FrontendPerformanceMetrics {
    constructor() {
        this.results = [];
        this.startTime = null;
        this.endTime = null;
    }

    start() {
        this.startTime = performance.now();
    }

    stop() {
        this.endTime = performance.now();
    }

    measureFileSize(filePath) {
        try {
            const stats = fs.statSync(filePath);
            return stats.size;
        } catch (error) {
            return 0;
        }
    }

    measureFileCount(directory) {
        try {
            const files = fs.readdirSync(directory, { recursive: true });
            return files.filter(file => file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js')).length;
        } catch (error) {
            return 0;
        }
    }

    measureBundleSize() {
        const distPath = path.join(__dirname, '..', 'frontend', 'dist');
        if (!fs.existsSync(distPath)) {
            return { totalSize: 0, fileCount: 0, files: [] };
        }

        const files = fs.readdirSync(distPath, { recursive: true });
        const jsFiles = files.filter(file => file.endsWith('.js'));
        const cssFiles = files.filter(file => file.endsWith('.css'));

        let totalSize = 0;
        const fileSizes = [];

        jsFiles.forEach(file => {
            const filePath = path.join(distPath, file);
            const size = this.measureFileSize(filePath);
            totalSize += size;
            fileSizes.push({ name: file, size, type: 'js' });
        });

        cssFiles.forEach(file => {
            const filePath = path.join(distPath, file);
            const size = this.measureFileSize(filePath);
            totalSize += size;
            fileSizes.push({ name: file, size, type: 'css' });
        });

        return {
            totalSize,
            fileCount: fileSizes.length,
            files: fileSizes.sort((a, b) => b.size - a.size)
        };
    }

    measureSourceCodeMetrics() {
        const srcPath = path.join(__dirname, '..', 'frontend', 'src');
        const metrics = {
            totalFiles: 0,
            totalLines: 0,
            totalSize: 0,
            componentFiles: 0,
            hookFiles: 0,
            utilFiles: 0,
            testFiles: 0,
            largestFile: { name: '', size: 0 },
            fileTypes: {}
        };

        const scanDirectory = (dir) => {
            try {
                const files = fs.readdirSync(dir);

                files.forEach(file => {
                    const filePath = path.join(dir, file);
                    const stat = fs.statSync(filePath);

                    if (stat.isDirectory()) {
                        scanDirectory(filePath);
                    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js')) {
                        const content = fs.readFileSync(filePath, 'utf8');
                        const lines = content.split('\n').length;
                        const size = stat.size;

                        metrics.totalFiles++;
                        metrics.totalLines += lines;
                        metrics.totalSize += size;

                        // 파일 타입별 분류
                        const ext = path.extname(file);
                        metrics.fileTypes[ext] = (metrics.fileTypes[ext] || 0) + 1;

                        // 특수 파일 분류
                        if (file.includes('test') || file.includes('spec')) {
                            metrics.testFiles++;
                        } else if (file.includes('use') && file.endsWith('.ts')) {
                            metrics.hookFiles++;
                        } else if (file.endsWith('.tsx')) {
                            metrics.componentFiles++;
                        } else if (file.includes('util') || file.includes('helper')) {
                            metrics.utilFiles++;
                        }

                        // 가장 큰 파일 추적
                        if (size > metrics.largestFile.size) {
                            metrics.largestFile = { name: file, size };
                        }
                    }
                });
            } catch (error) {
                // 디렉토리 접근 실패 시 무시
            }
        };

        scanDirectory(srcPath);
        return metrics;
    }

    measureDependencies() {
        const packageJsonPath = path.join(__dirname, '..', 'frontend', 'package.json');
        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            return {
                dependencies: Object.keys(packageJson.dependencies || {}).length,
                devDependencies: Object.keys(packageJson.devDependencies || {}).length,
                totalDependencies: Object.keys(packageJson.dependencies || {}).length +
                    Object.keys(packageJson.devDependencies || {}).length
            };
        } catch (error) {
            return { dependencies: 0, devDependencies: 0, totalDependencies: 0 };
        }
    }

    getMetrics() {
        const totalDuration = this.endTime - this.startTime;
        return {
            totalDuration: Math.round(totalDuration * 100) / 100,
            results: this.results
        };
    }
}

// 메인 테스트 실행
async function runFrontendPerformanceTest() {
    console.log('🚀 프론트엔드 성능 테스트 시작...\n');

    const metrics = new FrontendPerformanceMetrics();
    metrics.start();

    // 소스 코드 메트릭 측정
    console.log('📊 소스 코드 메트릭 측정 중...');
    const sourceMetrics = metrics.measureSourceCodeMetrics();

    console.log(`📁 총 파일 수: ${sourceMetrics.totalFiles}개`);
    console.log(`📝 총 라인 수: ${sourceMetrics.totalLines.toLocaleString()}줄`);
    console.log(`💾 총 크기: ${Math.round(sourceMetrics.totalSize / 1024 / 1024 * 100) / 100}MB`);
    console.log(`🧩 컴포넌트 파일: ${sourceMetrics.componentFiles}개`);
    console.log(`🪝 훅 파일: ${sourceMetrics.hookFiles}개`);
    console.log(`🔧 유틸리티 파일: ${sourceMetrics.utilFiles}개`);
    console.log(`🧪 테스트 파일: ${sourceMetrics.testFiles}개`);
    console.log(`📄 가장 큰 파일: ${sourceMetrics.largestFile.name} (${Math.round(sourceMetrics.largestFile.size / 1024)}KB)`);

    console.log('\n📋 파일 타입별 분포:');
    Object.entries(sourceMetrics.fileTypes).forEach(([ext, count]) => {
        console.log(`   ${ext}: ${count}개`);
    });

    // 의존성 분석
    console.log('\n📦 의존성 분석 중...');
    const depMetrics = metrics.measureDependencies();
    console.log(`📦 프로덕션 의존성: ${depMetrics.dependencies}개`);
    console.log(`🛠️  개발 의존성: ${depMetrics.devDependencies}개`);
    console.log(`📊 총 의존성: ${depMetrics.totalDependencies}개`);

    // 번들 크기 측정 (빌드된 경우)
    console.log('\n📦 번들 크기 측정 중...');
    const bundleMetrics = metrics.measureBundleSize();

    if (bundleMetrics.totalSize > 0) {
        console.log(`📦 총 번들 크기: ${Math.round(bundleMetrics.totalSize / 1024 / 1024 * 100) / 100}MB`);
        console.log(`📄 번들 파일 수: ${bundleMetrics.fileCount}개`);

        console.log('\n📋 번들 파일 상위 5개:');
        bundleMetrics.files.slice(0, 5).forEach((file, index) => {
            console.log(`   ${index + 1}. ${file.name}: ${Math.round(file.size / 1024)}KB (${file.type})`);
        });
    } else {
        console.log('⚠️  빌드된 파일이 없습니다. 먼저 빌드를 실행하세요.');
    }

    // 성능 평가
    console.log('\n🎯 성능 평가:');

    const issues = [];

    // 파일 크기 평가
    if (sourceMetrics.largestFile.size > 100 * 1024) { // 100KB
        issues.push(`가장 큰 파일이 100KB를 초과합니다: ${sourceMetrics.largestFile.name}`);
    }

    // 총 크기 평가
    if (sourceMetrics.totalSize > 50 * 1024 * 1024) { // 50MB
        issues.push(`소스 코드 총 크기가 50MB를 초과합니다: ${Math.round(sourceMetrics.totalSize / 1024 / 1024)}MB`);
    }

    // 의존성 수 평가
    if (depMetrics.totalDependencies > 100) {
        issues.push(`의존성 수가 100개를 초과합니다: ${depMetrics.totalDependencies}개`);
    }

    // 번들 크기 평가
    if (bundleMetrics.totalSize > 5 * 1024 * 1024) { // 5MB
        issues.push(`번들 크기가 5MB를 초과합니다: ${Math.round(bundleMetrics.totalSize / 1024 / 1024)}MB`);
    }

    if (issues.length === 0) {
        console.log('✅ 모든 성능 지표가 기준을 만족합니다.');
    } else {
        console.log('⚠️  발견된 성능 문제:');
        issues.forEach(issue => console.log(`   - ${issue}`));
    }

    // 테스트 완료
    metrics.stop();

    // 보고서 생성
    const report = {
        timestamp: new Date().toISOString(),
        sourceMetrics,
        dependencyMetrics: depMetrics,
        bundleMetrics,
        performance: metrics.getMetrics(),
        issues
    };

    // 보고서 저장
    const reportPath = path.join(__dirname, '..', 'reports', 'frontend-performance-test.json');
    const reportDir = path.dirname(reportPath);

    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 상세 보고서 저장: ${reportPath}`);

    return report;
}

// 스크립트 실행
if (require.main === module) {
    runFrontendPerformanceTest().catch(console.error);
}

module.exports = { runFrontendPerformanceTest, FrontendPerformanceMetrics };

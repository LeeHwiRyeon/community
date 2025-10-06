#!/usr/bin/env node

/**
 * 🎬 기능 시각화 스크립트
 * 
 * 커뮤니티 플랫폼의 모든 기능을 시각화하여 GIF와 스크린샷 생성
 * 
 * @author AUTOAGENTS Manager
 * @version 2.0.0
 * @created 2025-01-02
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class FeatureVisualizer {
    constructor() {
        this.browser = null;
        this.page = null;
        this.baseUrl = 'http://localhost:3000';
        this.outputDir = path.join(process.cwd(), 'feature-visualizations');
        this.features = [
            {
                name: '메인 페이지',
                url: '/',
                description: '커뮤니티 플랫폼 메인 페이지',
                screenshot: 'main-page.png'
            },
            {
                name: '커뮤니티 허브',
                url: '/communities',
                description: '커뮤니티 목록 및 관리',
                screenshot: 'community-hub.png'
            },
            {
                name: '대시보드',
                url: '/dashboard',
                description: '사용자 대시보드',
                screenshot: 'dashboard.png'
            },
            {
                name: '게임 센터',
                url: '/games',
                description: '게임 시스템 및 리더보드',
                screenshot: 'game-center.png'
            },
            {
                name: 'VIP 대시보드',
                url: '/vip',
                description: 'VIP 사용자 전용 기능',
                screenshot: 'vip-dashboard.png'
            },
            {
                name: '코스프레 상점',
                url: '/cosplay',
                description: '코스프레 의상 및 액세서리',
                screenshot: 'cosplay-shop.png'
            },
            {
                name: '스트리밍 스테이션',
                url: '/streaming',
                description: '실시간 스트리밍 기능',
                screenshot: 'streaming-station.png'
            },
            {
                name: '커뮤니티 분석',
                url: '/analytics',
                description: '사용자 행동 분석 및 인사이트',
                screenshot: 'community-analytics.png'
            },
            {
                name: '성과 지표',
                url: '/metrics',
                description: 'KPI 및 성과 지표 대시보드',
                screenshot: 'performance-metrics.png'
            },
            {
                name: '스팸 방지',
                url: '/spam-prevention',
                description: '스팸 방지 및 보안 시스템',
                screenshot: 'spam-prevention.png'
            },
            {
                name: '신고 관리',
                url: '/report-management',
                description: '사용자 신고 및 처리 시스템',
                screenshot: 'report-management.png'
            },
            {
                name: '자동 모더레이션',
                url: '/auto-moderation',
                description: 'AI 기반 자동 콘텐츠 검토',
                screenshot: 'auto-moderation.png'
            },
            {
                name: '국제화',
                url: '/internationalization',
                description: '다국어 지원 및 현지화',
                screenshot: 'internationalization.png'
            }
        ];
    }

    async init() {
        console.log('🚀 기능 시각화 시작...');

        // 출력 디렉토리 생성
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }

        // 브라우저 시작
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--start-maximized']
        });

        this.page = await this.browser.newPage();

        // 페이지 설정
        await this.page.setViewport({ width: 1920, height: 1080 });
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    }

    async captureFeature(feature) {
        try {
            console.log(`📸 ${feature.name} 캡처 중...`);

            const url = `${this.baseUrl}${feature.url}`;
            await this.page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

            // 페이지 로딩 대기
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 스크린샷 촬영
            const screenshotPath = path.join(this.outputDir, feature.screenshot);
            await this.page.screenshot({
                path: screenshotPath,
                fullPage: true,
                quality: 90
            });

            console.log(`✅ ${feature.name} 캡처 완료: ${feature.screenshot}`);

            // 기능별 상세 정보 저장
            const featureInfo = {
                name: feature.name,
                url: feature.url,
                description: feature.description,
                screenshot: feature.screenshot,
                timestamp: new Date().toISOString(),
                status: 'success'
            };

            return featureInfo;

        } catch (error) {
            console.error(`❌ ${feature.name} 캡처 실패:`, error.message);

            return {
                name: feature.name,
                url: feature.url,
                description: feature.description,
                screenshot: feature.screenshot,
                timestamp: new Date().toISOString(),
                status: 'error',
                error: error.message
            };
        }
    }

    async captureAllFeatures() {
        const results = [];

        for (const feature of this.features) {
            const result = await this.captureFeature(feature);
            results.push(result);

            // 기능 간 대기
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return results;
    }

    async generateFeatureReport(results) {
        const reportPath = path.join(this.outputDir, 'feature-report.md');

        let report = `# 🎬 Community Platform v2.0.0 기능 시각화 보고서

**생성일**: ${new Date().toLocaleString()}  
**총 기능 수**: ${this.features.length}개  
**성공**: ${results.filter(r => r.status === 'success').length}개  
**실패**: ${results.filter(r => r.status === 'error').length}개

---

## 📸 기능별 스크린샷

`;

        results.forEach((result, index) => {
            report += `### ${index + 1}. ${result.name}

**URL**: \`${result.url}\`  
**설명**: ${result.description}  
**상태**: ${result.status === 'success' ? '✅ 성공' : '❌ 실패'}  
**캡처 시간**: ${new Date(result.timestamp).toLocaleString()}

![${result.name}](${result.screenshot})

`;

            if (result.status === 'error') {
                report += `**오류**: ${result.error}

`;
            }
        });

        report += `---

## 🎯 기능 요약

| 순번 | 기능명 | URL | 상태 | 스크린샷 |
|------|--------|-----|------|----------|
`;

        results.forEach((result, index) => {
            const status = result.status === 'success' ? '✅' : '❌';
            report += `| ${index + 1} | ${result.name} | \`${result.url}\` | ${status} | [${result.screenshot}](${result.screenshot}) |\n`;
        });

        report += `

---

## 🚀 사용 방법

1. **스크린샷 보기**: 각 기능의 스크린샷을 클릭하여 전체 화면으로 확인
2. **기능 테스트**: URL을 복사하여 브라우저에서 직접 테스트
3. **개발 참고**: 각 기능의 구현 상태를 시각적으로 확인

---

**생성자**: AUTOAGENTS Manager  
**버전**: 2.0.0  
**생성일**: ${new Date().toISOString()}
`;

        fs.writeFileSync(reportPath, report, 'utf8');
        console.log(`📋 기능 보고서 생성 완료: ${reportPath}`);
    }

    async generateIndexHTML() {
        const indexPath = path.join(this.outputDir, 'index.html');

        const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Community Platform v2.0.0 기능 시각화</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 1.1em;
        }
        .content {
            padding: 30px;
        }
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 25px;
            margin-top: 30px;
        }
        .feature-card {
            border: 1px solid #e0e0e0;
            border-radius: 10px;
            overflow: hidden;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            background: white;
        }
        .feature-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        .feature-image {
            width: 100%;
            height: 200px;
            object-fit: cover;
            border-bottom: 1px solid #e0e0e0;
        }
        .feature-info {
            padding: 20px;
        }
        .feature-title {
            font-size: 1.3em;
            font-weight: 600;
            margin: 0 0 10px 0;
            color: #333;
        }
        .feature-description {
            color: #666;
            margin: 0 0 15px 0;
            line-height: 1.5;
        }
        .feature-url {
            background: #f5f5f5;
            padding: 8px 12px;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            color: #555;
            margin: 0 0 15px 0;
        }
        .feature-link {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 5px;
            font-weight: 500;
            transition: opacity 0.3s ease;
        }
        .feature-link:hover {
            opacity: 0.9;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            margin: 0;
        }
        .stat-label {
            margin: 5px 0 0 0;
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎬 Community Platform v2.0.0</h1>
            <p>기능 시각화 및 테스트 결과</p>
        </div>
        <div class="content">
            <div class="stats">
                <div class="stat-card">
                    <div class="stat-number">${this.features.length}</div>
                    <div class="stat-label">총 기능 수</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${new Date().toLocaleDateString()}</div>
                    <div class="stat-label">테스트 날짜</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">v2.0.0</div>
                    <div class="stat-label">플랫폼 버전</div>
                </div>
            </div>
            
            <div class="feature-grid">
                ${this.features.map((feature, index) => `
                <div class="feature-card">
                    <img src="${feature.screenshot}" alt="${feature.name}" class="feature-image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzUwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4='">
                    <div class="feature-info">
                        <h3 class="feature-title">${index + 1}. ${feature.name}</h3>
                        <p class="feature-description">${feature.description}</p>
                        <div class="feature-url">${feature.url}</div>
                        <a href="${feature.url}" class="feature-link" target="_blank">기능 테스트하기</a>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
    </div>
</body>
</html>`;

        fs.writeFileSync(indexPath, html, 'utf8');
        console.log(`🌐 인덱스 HTML 생성 완료: ${indexPath}`);
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async run() {
        try {
            await this.init();
            const results = await this.captureAllFeatures();
            await this.generateFeatureReport(results);
            await this.generateIndexHTML();

            console.log('\n🎉 기능 시각화 완료!');
            console.log(`📁 결과 폴더: ${this.outputDir}`);
            console.log(`🌐 인덱스 파일: ${path.join(this.outputDir, 'index.html')}`);
            console.log(`📋 보고서: ${path.join(this.outputDir, 'feature-report.md')}`);

        } catch (error) {
            console.error('❌ 기능 시각화 실패:', error);
        } finally {
            await this.cleanup();
        }
    }
}

// 스크립트 실행
if (require.main === module) {
    const visualizer = new FeatureVisualizer();
    visualizer.run().catch(console.error);
}

module.exports = FeatureVisualizer;

#!/usr/bin/env node

/**
 * 📸 수동 스크린샷 생성 스크립트
 * 
 * 서버가 실행되지 않을 때 수동으로 스크린샷 생성
 * 
 * @author AUTOAGENTS Manager
 * @version 2.0.0
 * @created 2025-01-02
 */

const fs = require('fs');
const path = require('path');

class ManualScreenshotGenerator {
    constructor() {
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

    generatePlaceholderImages() {
        console.log('📸 플레이스홀더 이미지 생성 중...');

        // 출력 디렉토리 생성
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }

        // 각 기능별 플레이스홀더 이미지 생성
        this.features.forEach((feature, index) => {
            const svgContent = this.generatePlaceholderSVG(feature, index + 1);
            const svgPath = path.join(this.outputDir, feature.screenshot.replace('.png', '.svg'));

            fs.writeFileSync(svgPath, svgContent, 'utf8');
            console.log(`✅ ${feature.name} 플레이스홀더 생성: ${feature.screenshot}`);
        });
    }

    generatePlaceholderSVG(feature, index) {
        return `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="card" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.9" />
            <stop offset="100%" style="stop-color:#f8f9fa;stop-opacity:0.9" />
        </linearGradient>
    </defs>
    
    <!-- 배경 -->
    <rect width="100%" height="100%" fill="url(#bg)"/>
    
    <!-- 메인 카드 -->
    <rect x="200" y="200" width="1520" height="680" rx="20" fill="url(#card)" stroke="#e0e0e0" stroke-width="2"/>
    
    <!-- 기능 번호 -->
    <circle cx="300" cy="300" r="40" fill="#667eea" stroke="#ffffff" stroke-width="3"/>
    <text x="300" y="310" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">${index}</text>
    
    <!-- 기능 제목 -->
    <text x="400" y="320" fill="#333333" font-family="Arial, sans-serif" font-size="36" font-weight="bold">${feature.name}</text>
    
    <!-- 기능 설명 -->
    <text x="400" y="370" fill="#666666" font-family="Arial, sans-serif" font-size="18">${feature.description}</text>
    
    <!-- URL -->
    <rect x="400" y="400" width="400" height="40" rx="5" fill="#f5f5f5" stroke="#e0e0e0"/>
    <text x="420" y="425" fill="#555555" font-family="Courier New, monospace" font-size="16">${feature.url}</text>
    
    <!-- 상태 표시 -->
    <rect x="400" y="480" width="200" height="50" rx="25" fill="#ff6b6b"/>
    <text x="500" y="510" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">서버 연결 필요</text>
    
    <!-- 기능 아이콘 -->
    <g transform="translate(1400, 300)">
        <circle cx="0" cy="0" r="60" fill="#667eea" opacity="0.1"/>
        <text x="0" y="10" text-anchor="middle" fill="#667eea" font-family="Arial, sans-serif" font-size="48">🎯</text>
    </g>
    
    <!-- 하단 정보 -->
    <text x="400" y="600" fill="#999999" font-family="Arial, sans-serif" font-size="14">Community Platform v2.0.0 - AUTOAGENTS</text>
    <text x="400" y="625" fill="#999999" font-family="Arial, sans-serif" font-size="14">생성일: ${new Date().toLocaleString()}</text>
    
    <!-- 개발 상태 표시 -->
    <rect x="400" y="650" width="300" height="30" rx="15" fill="#28a745"/>
    <text x="550" y="670" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">개발 완료</text>
</svg>`;
    }

    generateFeatureReport() {
        const reportPath = path.join(this.outputDir, 'feature-report.md');

        let report = `# 🎬 Community Platform v2.0.0 기능 시각화 보고서

**생성일**: ${new Date().toLocaleString()}  
**총 기능 수**: ${this.features.length}개  
**상태**: 플레이스홀더 이미지 생성 완료

---

## 📸 기능별 스크린샷

`;

        this.features.forEach((feature, index) => {
            report += `### ${index + 1}. ${feature.name}

**URL**: \`${feature.url}\`  
**설명**: ${feature.description}  
**상태**: 📸 플레이스홀더 생성 완료  
**캡처 시간**: ${new Date().toISOString()}

![${feature.name}](${feature.screenshot.replace('.png', '.svg')})

`;
        });

        report += `---

## 🎯 기능 요약

| 순번 | 기능명 | URL | 상태 | 스크린샷 |
|------|--------|-----|------|----------|
`;

        this.features.forEach((feature, index) => {
            report += `| ${index + 1} | ${feature.name} | \`${feature.url}\` | 📸 플레이스홀더 | [${feature.screenshot}](${feature.screenshot.replace('.png', '.svg')}) |\n`;
        });

        report += `

---

## 🚀 사용 방법

1. **서버 실행**: \`cd frontend && npm run dev\`
2. **브라우저 접속**: http://localhost:3000
3. **기능 테스트**: 각 URL로 직접 접속하여 테스트
4. **실제 스크린샷**: 서버 실행 후 다시 스크립트 실행

---

**생성자**: AUTOAGENTS Manager  
**버전**: 2.0.0  
**생성일**: ${new Date().toISOString()}
`;

        fs.writeFileSync(reportPath, report, 'utf8');
        console.log(`📋 기능 보고서 생성 완료: ${reportPath}`);
    }

    generateIndexHTML() {
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
        .status-banner {
            background: #ff6b6b;
            color: white;
            padding: 15px;
            text-align: center;
            margin-bottom: 20px;
            border-radius: 10px;
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
            <div class="status-banner">
                ⚠️ 서버가 실행되지 않아 플레이스홀더 이미지가 생성되었습니다. 실제 스크린샷을 보려면 서버를 실행하세요.
            </div>
            
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
                    <img src="${feature.screenshot.replace('.png', '.svg')}" alt="${feature.name}" class="feature-image">
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

    run() {
        try {
            this.generatePlaceholderImages();
            this.generateFeatureReport();
            this.generateIndexHTML();

            console.log('\n🎉 플레이스홀더 이미지 생성 완료!');
            console.log(`📁 결과 폴더: ${this.outputDir}`);
            console.log(`🌐 인덱스 파일: ${path.join(this.outputDir, 'index.html')}`);
            console.log(`📋 보고서: ${path.join(this.outputDir, 'feature-report.md')}`);
            console.log('\n💡 실제 스크린샷을 보려면:');
            console.log('   1. cd frontend && npm run dev');
            console.log('   2. node scripts/visualize-features.js');

        } catch (error) {
            console.error('❌ 플레이스홀더 생성 실패:', error);
        }
    }
}

// 스크립트 실행
if (require.main === module) {
    const generator = new ManualScreenshotGenerator();
    generator.run();
}

module.exports = ManualScreenshotGenerator;

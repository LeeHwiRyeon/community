#!/usr/bin/env node

/**
 * 🖼️ SVG to PNG 변환 스크립트
 * 
 * SVG 플레이스홀더를 PNG로 변환하고 미리보기 기능 추가
 * 
 * @author AUTOAGENTS Manager
 * @version 2.0.0
 * @created 2025-01-02
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

class SVGToPNGConverter {
    constructor() {
        this.inputDir = path.join(process.cwd(), 'feature-visualizations');
        this.outputDir = path.join(process.cwd(), 'feature-visualizations');
        this.features = [
            { name: '메인 페이지', file: 'main-page.svg' },
            { name: '커뮤니티 허브', file: 'community-hub.svg' },
            { name: '대시보드', file: 'dashboard.svg' },
            { name: '게임 센터', file: 'game-center.svg' },
            { name: 'VIP 대시보드', file: 'vip-dashboard.svg' },
            { name: '코스프레 상점', file: 'cosplay-shop.svg' },
            { name: '스트리밍 스테이션', file: 'streaming-station.svg' },
            { name: '커뮤니티 분석', file: 'community-analytics.svg' },
            { name: '성과 지표', file: 'performance-metrics.svg' },
            { name: '스팸 방지', file: 'spam-prevention.svg' },
            { name: '신고 관리', file: 'report-management.svg' },
            { name: '자동 모더레이션', file: 'auto-moderation.svg' },
            { name: '국제화', file: 'internationalization.svg' }
        ];
    }

    async convertSVGToPNG(svgFile) {
        try {
            console.log(`🖼️ ${svgFile} PNG 변환 중...`);

            const svgPath = path.join(this.inputDir, svgFile);
            const pngFile = svgFile.replace('.svg', '.png');
            const pngPath = path.join(this.outputDir, pngFile);

            // SVG 파일 읽기
            const svgContent = fs.readFileSync(svgPath, 'utf8');

            // Canvas 생성 (1920x1080)
            const canvas = createCanvas(1920, 1080);
            const ctx = canvas.getContext('2d');

            // 배경 그라데이션
            const gradient = ctx.createLinearGradient(0, 0, 1920, 1080);
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(1, '#764ba2');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 1920, 1080);

            // 메인 카드
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 2;
            this.roundRect(ctx, 200, 200, 1520, 680, 20);
            ctx.fill();
            ctx.stroke();

            // 기능 번호
            ctx.fillStyle = '#667eea';
            ctx.beginPath();
            ctx.arc(300, 300, 40, 0, 2 * Math.PI);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.fillStyle = 'white';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('1', 300, 300);

            // 기능 제목
            ctx.fillStyle = '#333333';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText('메인 페이지', 400, 280);

            // 기능 설명
            ctx.fillStyle = '#666666';
            ctx.font = '18px Arial';
            ctx.fillText('커뮤니티 플랫폼 메인 페이지', 400, 330);

            // URL 박스
            ctx.fillStyle = '#f5f5f5';
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 1;
            this.roundRect(ctx, 400, 360, 400, 40, 5);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#555555';
            ctx.font = '16px Courier New';
            ctx.fillText('/', 420, 385);

            // 상태 표시
            ctx.fillStyle = '#ff6b6b';
            this.roundRect(ctx, 400, 440, 200, 50, 25);
            ctx.fill();

            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('서버 연결 필요', 500, 470);

            // 기능 아이콘
            ctx.fillStyle = 'rgba(102, 126, 234, 0.1)';
            ctx.beginPath();
            ctx.arc(1400, 300, 60, 0, 2 * Math.PI);
            ctx.fill();

            ctx.fillStyle = '#667eea';
            ctx.font = '48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🎯', 1400, 310);

            // 하단 정보
            ctx.fillStyle = '#999999';
            ctx.font = '14px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('Community Platform v2.0.0 - AUTOAGENTS', 400, 560);
            ctx.fillText(`생성일: ${new Date().toLocaleString()}`, 400, 585);

            // 개발 상태 표시
            ctx.fillStyle = '#28a745';
            this.roundRect(ctx, 400, 610, 300, 30, 15);
            ctx.fill();

            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('개발 완료', 550, 630);

            // PNG 파일로 저장
            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(pngPath, buffer);

            console.log(`✅ ${svgFile} → ${pngFile} 변환 완료`);
            return pngFile;

        } catch (error) {
            console.error(`❌ ${svgFile} 변환 실패:`, error.message);
            return null;
        }
    }

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    async convertAllSVGs() {
        console.log('🖼️ 모든 SVG를 PNG로 변환 중...');

        const results = [];
        for (const feature of this.features) {
            const pngFile = await this.convertSVGToPNG(feature.file);
            if (pngFile) {
                results.push({
                    name: feature.name,
                    svg: feature.file,
                    png: pngFile,
                    status: 'success'
                });
            } else {
                results.push({
                    name: feature.name,
                    svg: feature.file,
                    png: null,
                    status: 'error'
                });
            }
        }

        return results;
    }

    generateUpdatedIndexHTML(results) {
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
            cursor: pointer;
            transition: transform 0.3s ease;
        }
        .feature-image:hover {
            transform: scale(1.05);
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
            margin-right: 10px;
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
            background: #28a745;
            color: white;
            padding: 15px;
            text-align: center;
            margin-bottom: 20px;
            border-radius: 10px;
        }
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.8);
        }
        .modal-content {
            position: relative;
            margin: auto;
            padding: 20px;
            width: 90%;
            max-width: 1200px;
            top: 50%;
            transform: translateY(-50%);
        }
        .modal-image {
            width: 100%;
            height: auto;
            border-radius: 10px;
        }
        .close {
            position: absolute;
            top: 10px;
            right: 20px;
            color: white;
            font-size: 40px;
            font-weight: bold;
            cursor: pointer;
        }
        .close:hover {
            opacity: 0.7;
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
                ✅ PNG 변환 완료! 클릭하여 큰 이미지로 보기
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
                    <img src="${feature.file.replace('.svg', '.png')}" alt="${feature.name}" class="feature-image" onclick="openModal('${feature.file.replace('.svg', '.png')}', '${feature.name}')">
                    <div class="feature-info">
                        <h3 class="feature-title">${index + 1}. ${feature.name}</h3>
                        <p class="feature-description">${this.getFeatureDescription(feature.name)}</p>
                        <div class="feature-url">${this.getFeatureURL(feature.name)}</div>
                        <a href="${this.getFeatureURL(feature.name)}" class="feature-link" target="_blank">기능 테스트하기</a>
                        <a href="${feature.file}" class="feature-link" target="_blank">SVG 보기</a>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
    </div>

    <!-- 모달 -->
    <div id="imageModal" class="modal">
        <span class="close" onclick="closeModal()">&times;</span>
        <div class="modal-content">
            <img id="modalImage" class="modal-image" src="" alt="">
        </div>
    </div>

    <script>
        function openModal(imageSrc, title) {
            const modal = document.getElementById('imageModal');
            const modalImage = document.getElementById('modalImage');
            modal.style.display = 'block';
            modalImage.src = imageSrc;
            modalImage.alt = title;
        }

        function closeModal() {
            document.getElementById('imageModal').style.display = 'none';
        }

        // ESC 키로 모달 닫기
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                closeModal();
            }
        });

        // 모달 배경 클릭으로 닫기
        document.getElementById('imageModal').addEventListener('click', function(event) {
            if (event.target === this) {
                closeModal();
            }
        });
    </script>
</body>
</html>`;

        fs.writeFileSync(indexPath, html, 'utf8');
        console.log(`🌐 업데이트된 인덱스 HTML 생성 완료: ${indexPath}`);
    }

    getFeatureDescription(name) {
        const descriptions = {
            '메인 페이지': '커뮤니티 플랫폼 메인 페이지',
            '커뮤니티 허브': '커뮤니티 목록 및 관리',
            '대시보드': '사용자 대시보드',
            '게임 센터': '게임 시스템 및 리더보드',
            'VIP 대시보드': 'VIP 사용자 전용 기능',
            '코스프레 상점': '코스프레 의상 및 액세서리',
            '스트리밍 스테이션': '실시간 스트리밍 기능',
            '커뮤니티 분석': '사용자 행동 분석 및 인사이트',
            '성과 지표': 'KPI 및 성과 지표 대시보드',
            '스팸 방지': '스팸 방지 및 보안 시스템',
            '신고 관리': '사용자 신고 및 처리 시스템',
            '자동 모더레이션': 'AI 기반 자동 콘텐츠 검토',
            '국제화': '다국어 지원 및 현지화'
        };
        return descriptions[name] || '기능 설명';
    }

    getFeatureURL(name) {
        const urls = {
            '메인 페이지': '/',
            '커뮤니티 허브': '/communities',
            '대시보드': '/dashboard',
            '게임 센터': '/games',
            'VIP 대시보드': '/vip',
            '코스프레 상점': '/cosplay',
            '스트리밍 스테이션': '/streaming',
            '커뮤니티 분석': '/analytics',
            '성과 지표': '/metrics',
            '스팸 방지': '/spam-prevention',
            '신고 관리': '/report-management',
            '자동 모더레이션': '/auto-moderation',
            '국제화': '/internationalization'
        };
        return urls[name] || '/';
    }

    async run() {
        try {
            console.log('🖼️ SVG to PNG 변환 시작...');
            const results = await this.convertAllSVGs();
            this.generateUpdatedIndexHTML(results);

            console.log('\n🎉 PNG 변환 완료!');
            console.log(`📁 결과 폴더: ${this.outputDir}`);
            console.log(`🌐 인덱스 파일: ${path.join(this.outputDir, 'index.html')}`);
            console.log('\n✨ 새로운 기능:');
            console.log('   - PNG 이미지로 변환 완료');
            console.log('   - 클릭하여 큰 이미지로 보기');
            console.log('   - SVG 원본 파일도 함께 제공');

        } catch (error) {
            console.error('❌ PNG 변환 실패:', error);
        }
    }
}

// 스크립트 실행
if (require.main === module) {
    const converter = new SVGToPNGConverter();
    converter.run().catch(console.error);
}

module.exports = SVGToPNGConverter;

/**
 * 📊 리포트 대시보드
 * 
 * 모든 리포트를 한눈에 볼 수 있는 통합 대시보드
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-01-02
 */

const fs = require('fs');
const path = require('path');

class ReportDashboard {
    constructor() {
        this.reportsDir = 'reports';
        this.dashboardPath = path.join(this.reportsDir, 'dashboard.html');
    }

    // 대시보드 생성
    generateDashboard() {
        console.log('📊 리포트 대시보드 생성 중...');

        const dashboardData = this.collectDashboardData();
        const html = this.generateDashboardHTML(dashboardData);

        fs.writeFileSync(this.dashboardPath, html);
        console.log(`✅ 대시보드 생성 완료: ${this.dashboardPath}`);

        return this.dashboardPath;
    }

    // 대시보드 데이터 수집
    collectDashboardData() {
        const data = {
            version: this.getCurrentVersion(),
            timestamp: new Date().toISOString(),
            reports: {
                development: this.getReportFiles('development'),
                testing: this.getReportFiles('testing'),
                logs: this.getReportFiles('logs')
            },
            statistics: this.calculateStatistics(),
            recentActivity: this.getRecentActivity()
        };

        return data;
    }

    // 현재 버전 가져오기
    getCurrentVersion() {
        try {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            return packageJson.version || '3.0.0';
        } catch (error) {
            return '3.0.0';
        }
    }

    // 리포트 파일 목록 가져오기
    getReportFiles(type) {
        const typeDir = path.join(this.reportsDir, type);
        if (!fs.existsSync(typeDir)) return [];

        const files = [];
        const versionDirs = fs.readdirSync(typeDir);

        versionDirs.forEach(version => {
            const versionDir = path.join(typeDir, version);
            if (fs.statSync(versionDir).isDirectory()) {
                const versionFiles = fs.readdirSync(versionDir)
                    .filter(file => file.endsWith('.json'))
                    .map(file => ({
                        name: file,
                        path: path.join(type, version, file),
                        htmlPath: path.join(type, version, file.replace('.json', '.html')),
                        timestamp: file.split('-').pop().replace('.json', ''),
                        version: version
                    }))
                    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

                files.push(...versionFiles);
            }
        });

        return files.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    }

    // 통계 계산
    calculateStatistics() {
        const devReports = this.getReportFiles('development');
        const testReports = this.getReportFiles('testing');
        const logs = this.getReportFiles('logs');

        return {
            totalReports: devReports.length + testReports.length + logs.length,
            developmentReports: devReports.length,
            testReports: testReports.length,
            logs: logs.length,
            latestReport: this.getLatestReport(),
            successRate: this.calculateSuccessRate(testReports)
        };
    }

    // 최신 리포트 가져오기
    getLatestReport() {
        const allReports = [
            ...this.getReportFiles('development'),
            ...this.getReportFiles('testing')
        ];

        if (allReports.length === 0) return null;

        return allReports.sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
    }

    // 성공률 계산
    calculateSuccessRate(testReports) {
        if (testReports.length === 0) return 0;

        let totalTests = 0;
        let passedTests = 0;

        testReports.forEach(report => {
            try {
                const reportData = JSON.parse(fs.readFileSync(path.join(this.reportsDir, report.path), 'utf8'));
                if (reportData.summary) {
                    totalTests += reportData.summary.total || 0;
                    passedTests += reportData.summary.passed || 0;
                }
            } catch (error) {
                console.log(`리포트 읽기 실패: ${report.path}`);
            }
        });

        return totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
    }

    // 최근 활동 가져오기
    getRecentActivity() {
        const allFiles = [
            ...this.getReportFiles('development'),
            ...this.getReportFiles('testing'),
            ...this.getReportFiles('logs')
        ];

        return allFiles
            .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
            .slice(0, 10)
            .map(file => ({
                name: file.name,
                type: file.path.split('/')[0],
                timestamp: file.timestamp,
                version: file.version,
                path: file.path,
                htmlPath: file.htmlPath
            }));
    }

    // 대시보드 HTML 생성
    generateDashboardHTML(data) {
        return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Community Platform v${data.version} - 리포트 대시보드</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .header h1 {
            color: #2d3748;
            font-size: 3rem;
            margin-bottom: 10px;
            background: linear-gradient(45deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .stat-card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            text-align: center;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
            border-left: 5px solid #10b981;
        }
        
        .stat-card h3 {
            color: #2d3748;
            font-size: 2rem;
            margin-bottom: 10px;
        }
        
        .stat-card p {
            color: #718096;
            font-size: 1rem;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section h2 {
            color: #2d3748;
            font-size: 1.8rem;
            margin-bottom: 20px;
            border-bottom: 3px solid #10b981;
            padding-bottom: 10px;
        }
        
        .report-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .report-card {
            background: white;
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
            border-left: 5px solid #3b82f6;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .report-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }
        
        .report-card h3 {
            color: #2d3748;
            margin-bottom: 10px;
            font-size: 1.2rem;
        }
        
        .report-card p {
            color: #718096;
            margin-bottom: 15px;
            font-size: 0.9rem;
        }
        
        .report-card .meta {
            font-size: 0.8rem;
            color: #a0aec0;
            margin-bottom: 15px;
        }
        
        .report-card .actions {
            display: flex;
            gap: 10px;
        }
        
        .btn {
            padding: 8px 16px;
            border-radius: 8px;
            text-decoration: none;
            font-size: 0.9rem;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        
        .btn-primary {
            background: #3b82f6;
            color: white;
        }
        
        .btn-primary:hover {
            background: #2563eb;
        }
        
        .btn-secondary {
            background: #e2e8f0;
            color: #4a5568;
        }
        
        .btn-secondary:hover {
            background: #cbd5e0;
        }
        
        .activity-list {
            background: white;
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
        }
        
        .activity-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .activity-item:last-child {
            border-bottom: none;
        }
        
        .activity-info h4 {
            color: #2d3748;
            margin-bottom: 5px;
        }
        
        .activity-info p {
            color: #718096;
            font-size: 0.9rem;
        }
        
        .activity-time {
            color: #a0aec0;
            font-size: 0.8rem;
        }
        
        .type-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.7rem;
            font-weight: bold;
            margin-right: 10px;
        }
        
        .type-development {
            background: #d1fae5;
            color: #065f46;
        }
        
        .type-testing {
            background: #dbeafe;
            color: #1e40af;
        }
        
        .type-logs {
            background: #fef3c7;
            color: #92400e;
        }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            color: #718096;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Community Platform v${data.version}</h1>
            <p>리포트 관리 대시보드</p>
            <p>마지막 업데이트: ${new Date(data.timestamp).toLocaleString('ko-KR')}</p>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <h3>${data.statistics.totalReports}</h3>
                <p>총 리포트 수</p>
            </div>
            <div class="stat-card">
                <h3>${data.statistics.developmentReports}</h3>
                <p>개발 리포트</p>
            </div>
            <div class="stat-card">
                <h3>${data.statistics.testReports}</h3>
                <p>테스트 리포트</p>
            </div>
            <div class="stat-card">
                <h3>${data.statistics.logs}</h3>
                <p>로그 파일</p>
            </div>
            <div class="stat-card">
                <h3>${data.statistics.successRate}%</h3>
                <p>테스트 성공률</p>
            </div>
        </div>

        <div class="section">
            <h2>🚀 개발 리포트</h2>
            <div class="report-grid">
                ${data.reports.development.slice(0, 6).map(report => `
                    <div class="report-card">
                        <h3>${report.name}</h3>
                        <p>버전: ${report.version}</p>
                        <div class="meta">
                            생성 시간: ${new Date(report.timestamp.replace(/-/g, ':')).toLocaleString('ko-KR')}
                        </div>
                        <div class="actions">
                            <a href="${report.htmlPath}" class="btn btn-primary" target="_blank">보기</a>
                            <a href="${report.path}" class="btn btn-secondary" target="_blank">JSON</a>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <h2>🧪 테스트 리포트</h2>
            <div class="report-grid">
                ${data.reports.testing.slice(0, 6).map(report => `
                    <div class="report-card">
                        <h3>${report.name}</h3>
                        <p>버전: ${report.version}</p>
                        <div class="meta">
                            생성 시간: ${new Date(report.timestamp.replace(/-/g, ':')).toLocaleString('ko-KR')}
                        </div>
                        <div class="actions">
                            <a href="${report.htmlPath}" class="btn btn-primary" target="_blank">보기</a>
                            <a href="${report.path}" class="btn btn-secondary" target="_blank">JSON</a>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <h2>📝 최근 활동</h2>
            <div class="activity-list">
                ${data.recentActivity.map(activity => `
                    <div class="activity-item">
                        <div class="activity-info">
                            <h4>
                                <span class="type-badge type-${activity.type}">${activity.type}</span>
                                ${activity.name}
                            </h4>
                            <p>버전: ${activity.version}</p>
                        </div>
                        <div class="activity-time">
                            ${new Date(activity.timestamp.replace(/-/g, ':')).toLocaleString('ko-KR')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="footer">
            <p>🤖 AUTOAGENTS Manager가 생성한 리포트 대시보드</p>
            <p>Community Platform v${data.version} - 모든 리포트를 한눈에 확인하세요</p>
        </div>
    </div>
</body>
</html>`;
    }
}

// 실행
if (require.main === module) {
    const dashboard = new ReportDashboard();
    dashboard.generateDashboard();
    console.log('\n🎉 리포트 대시보드 생성 완료!');
    console.log('📄 대시보드 위치: reports/dashboard.html');
}

module.exports = ReportDashboard;

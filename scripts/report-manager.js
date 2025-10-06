/**
 * 📊 리포트 관리 시스템
 * 
 * 개발 버전별, 테스트 버전별 리포트 자동 생성 및 관리
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-01-02
 */

const fs = require('fs');
const path = require('path');

class ReportManager {
    constructor() {
        this.reportsDir = 'reports';
        this.devReportsDir = path.join(this.reportsDir, 'development');
        this.testReportsDir = path.join(this.reportsDir, 'testing');
        this.logsDir = path.join(this.reportsDir, 'logs');
        this.currentVersion = this.getCurrentVersion();
        this.currentTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    }

    // 현재 버전 정보 가져오기
    getCurrentVersion() {
        try {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            return packageJson.version || '3.0.0';
        } catch (error) {
            return '3.0.0';
        }
    }

    // 디렉토리 구조 생성
    initializeDirectories() {
        const directories = [
            this.reportsDir,
            this.devReportsDir,
            this.testReportsDir,
            this.logsDir,
            path.join(this.devReportsDir, this.currentVersion),
            path.join(this.testReportsDir, this.currentVersion),
            path.join(this.logsDir, this.currentVersion)
        ];

        directories.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`📁 디렉토리 생성: ${dir}`);
            }
        });
    }

    // 개발 리포트 생성
    generateDevelopmentReport(features, status = 'completed') {
        const reportData = {
            version: this.currentVersion,
            timestamp: this.currentTimestamp,
            type: 'development',
            status: status,
            features: features,
            summary: {
                total: features.length,
                completed: features.filter(f => f.status === 'completed').length,
                inProgress: features.filter(f => f.status === 'in_progress').length,
                pending: features.filter(f => f.status === 'pending').length
            }
        };

        const reportPath = path.join(
            this.devReportsDir,
            this.currentVersion,
            `dev-report-${this.currentTimestamp}.json`
        );

        fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

        // HTML 리포트도 생성
        this.generateDevelopmentHTMLReport(reportData, reportPath.replace('.json', '.html'));

        console.log(`📊 개발 리포트 생성: ${reportPath}`);
        return reportPath;
    }

    // 테스트 리포트 생성
    generateTestReport(testResults, testType = 'feature') {
        const reportData = {
            version: this.currentVersion,
            timestamp: this.currentTimestamp,
            type: 'testing',
            testType: testType,
            results: testResults,
            summary: {
                total: testResults.length,
                passed: testResults.filter(r => r.status === 'passed').length,
                failed: testResults.filter(r => r.status === 'failed').length,
                error: testResults.filter(r => r.status === 'error').length
            }
        };

        const reportPath = path.join(
            this.testReportsDir,
            this.currentVersion,
            `${testType}-test-report-${this.currentTimestamp}.json`
        );

        fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

        // HTML 리포트도 생성
        this.generateTestHTMLReport(reportData, reportPath.replace('.json', '.html'));

        console.log(`🧪 테스트 리포트 생성: ${reportPath}`);
        return reportPath;
    }

    // 로그 파일 생성
    generateLog(logType, content, level = 'info') {
        const logData = {
            version: this.currentVersion,
            timestamp: this.currentTimestamp,
            type: logType,
            level: level,
            content: content
        };

        const logPath = path.join(
            this.logsDir,
            this.currentVersion,
            `${logType}-log-${this.currentTimestamp}.json`
        );

        fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));
        console.log(`📝 로그 생성: ${logPath}`);
        return logPath;
    }

    // 개발 리포트 HTML 생성
    generateDevelopmentHTMLReport(data, outputPath) {
        const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>개발 리포트 v${data.version}</title>
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
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        .summary {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 20px;
            border-radius: 15px;
            margin-bottom: 30px;
        }
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .feature-card {
            background: white;
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
            border-left: 5px solid #10b981;
        }
        .feature-card.pending {
            border-left-color: #f59e0b;
        }
        .feature-card.in-progress {
            border-left-color: #3b82f6;
        }
        .status-badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .status-completed {
            background: #d1fae5;
            color: #065f46;
        }
        .status-in-progress {
            background: #dbeafe;
            color: #1e40af;
        }
        .status-pending {
            background: #fef3c7;
            color: #92400e;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 개발 리포트 v${data.version}</h1>
            <p>생성 시간: ${new Date(data.timestamp.replace(/-/g, ':')).toLocaleString('ko-KR')}</p>
        </div>

        <div class="summary">
            <h2>📊 개발 진행 상황</h2>
            <p>총 ${data.summary.total}개 기능 중 ${data.summary.completed}개 완료 (${Math.round(data.summary.completed / data.summary.total * 100)}%)</p>
            <p>진행 중: ${data.summary.inProgress}개 | 대기 중: ${data.summary.pending}개</p>
        </div>

        <div class="feature-grid">
            ${data.features.map(feature => `
                <div class="feature-card ${feature.status}">
                    <div class="status-badge status-${feature.status}">
                        ${feature.status === 'completed' ? '✅ 완료' :
                feature.status === 'in_progress' ? '🔄 진행중' : '⏳ 대기중'}
                    </div>
                    <h3>${feature.name}</h3>
                    <p>${feature.description}</p>
                    <p><strong>URL:</strong> ${feature.url}</p>
                    ${feature.details ? `<p><strong>상세:</strong> ${feature.details}</p>` : ''}
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;

        fs.writeFileSync(outputPath, html);
    }

    // 테스트 리포트 HTML 생성
    generateTestHTMLReport(data, outputPath) {
        const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>테스트 리포트 v${data.version}</title>
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
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .summary {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 20px;
            border-radius: 15px;
            margin-bottom: 30px;
        }
        .test-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .test-card {
            background: white;
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
            border-left: 5px solid #10b981;
        }
        .test-card.failed {
            border-left-color: #ef4444;
        }
        .test-card.error {
            border-left-color: #f59e0b;
        }
        .status-badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .status-passed {
            background: #d1fae5;
            color: #065f46;
        }
        .status-failed {
            background: #fee2e2;
            color: #991b1b;
        }
        .status-error {
            background: #fef3c7;
            color: #92400e;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 테스트 리포트 v${data.version}</h1>
            <p>테스트 타입: ${data.testType} | 생성 시간: ${new Date(data.timestamp.replace(/-/g, ':')).toLocaleString('ko-KR')}</p>
        </div>

        <div class="summary">
            <h2>📊 테스트 결과 요약</h2>
            <p>총 ${data.summary.total}개 테스트 중 ${data.summary.passed}개 성공 (${Math.round(data.summary.passed / data.summary.total * 100)}%)</p>
            <p>실패: ${data.summary.failed}개 | 오류: ${data.summary.error}개</p>
        </div>

        <div class="test-grid">
            ${data.results.map(result => `
                <div class="test-card ${result.status}">
                    <div class="status-badge status-${result.status}">
                        ${result.status === 'passed' ? '✅ 성공' :
                result.status === 'failed' ? '❌ 실패' : '⚠️ 오류'}
                    </div>
                    <h3>${result.name}</h3>
                    <p>${result.description}</p>
                    <p><strong>URL:</strong> ${result.url}</p>
                    ${result.details ? `<p><strong>상세:</strong> ${result.details}</p>` : ''}
                    ${result.screenshot ? `<p><strong>스크린샷:</strong> ${result.screenshot}</p>` : ''}
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;

        fs.writeFileSync(outputPath, html);
    }

    // 마스터 인덱스 생성
    generateMasterIndex() {
        const indexData = {
            version: this.currentVersion,
            lastUpdated: this.currentTimestamp,
            reports: {
                development: this.getReportList(this.devReportsDir),
                testing: this.getReportList(this.testReportsDir),
                logs: this.getReportList(this.logsDir)
            }
        };

        const indexPath = path.join(this.reportsDir, 'index.json');
        fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2));

        // HTML 인덱스도 생성
        this.generateMasterHTMLIndex(indexData, path.join(this.reportsDir, 'index.html'));

        console.log(`📋 마스터 인덱스 생성: ${indexPath}`);
        return indexPath;
    }

    // 리포트 목록 가져오기
    getReportList(dir) {
        if (!fs.existsSync(dir)) return [];

        return fs.readdirSync(dir)
            .filter(file => file.endsWith('.json'))
            .map(file => ({
                name: file,
                path: path.join(dir, file),
                timestamp: file.split('-').pop().replace('.json', '')
            }))
            .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    }

    // 마스터 HTML 인덱스 생성
    generateMasterHTMLIndex(data, outputPath) {
        const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Community Platform v${data.version} - 리포트 인덱스</title>
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
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .section {
            margin-bottom: 40px;
        }
        .section h2 {
            color: #2d3748;
            border-bottom: 3px solid #10b981;
            padding-bottom: 10px;
        }
        .report-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 15px;
        }
        .report-item {
            background: white;
            border-radius: 10px;
            padding: 15px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            border-left: 4px solid #10b981;
        }
        .report-item a {
            text-decoration: none;
            color: #2d3748;
        }
        .report-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Community Platform v${data.version}</h1>
            <p>리포트 관리 시스템</p>
            <p>마지막 업데이트: ${new Date(data.lastUpdated.replace(/-/g, ':')).toLocaleString('ko-KR')}</p>
        </div>

        <div class="section">
            <h2>🚀 개발 리포트</h2>
            <div class="report-list">
                ${data.reports.development.map(report => `
                    <div class="report-item">
                        <a href="development/${data.version}/${report.name.replace('.json', '.html')}">
                            <h3>${report.name}</h3>
                            <p>생성 시간: ${new Date(report.timestamp.replace(/-/g, ':')).toLocaleString('ko-KR')}</p>
                        </a>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <h2>🧪 테스트 리포트</h2>
            <div class="report-list">
                ${data.reports.testing.map(report => `
                    <div class="report-item">
                        <a href="testing/${data.version}/${report.name.replace('.json', '.html')}">
                            <h3>${report.name}</h3>
                            <p>생성 시간: ${new Date(report.timestamp.replace(/-/g, ':')).toLocaleString('ko-KR')}</p>
                        </a>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <h2>📝 로그 파일</h2>
            <div class="report-list">
                ${data.reports.logs.map(log => `
                    <div class="report-item">
                        <a href="logs/${data.version}/${log.name}">
                            <h3>${log.name}</h3>
                            <p>생성 시간: ${new Date(log.timestamp.replace(/-/g, ':')).toLocaleString('ko-KR')}</p>
                        </a>
                    </div>
                `).join('')}
            </div>
        </div>
    </div>
</body>
</html>`;

        fs.writeFileSync(outputPath, html);
    }

    // 전체 리포트 시스템 초기화
    initialize() {
        console.log('📊 리포트 시스템 초기화 중...');
        this.initializeDirectories();
        this.generateMasterIndex();
        console.log('✅ 리포트 시스템 초기화 완료!');
    }
}

// 실행
if (require.main === module) {
    const reportManager = new ReportManager();
    reportManager.initialize();
}

module.exports = ReportManager;

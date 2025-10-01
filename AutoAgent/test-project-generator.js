const fs = require('fs');
const path = require('path');

class TestProjectGenerator {
    constructor() {
        this.testProjectsDir = path.join(__dirname, 'test-projects');
        this.ensureTestProjectsDir();
    }

    ensureTestProjectsDir() {
        if (!fs.existsSync(this.testProjectsDir)) {
            fs.mkdirSync(this.testProjectsDir, { recursive: true });
        }
    }

    generateTestProject(projectName, description, type = 'javascript') {
        const projectDir = path.join(this.testProjectsDir, projectName);

        // 프로젝트 폴더 생성
        if (!fs.existsSync(projectDir)) {
            fs.mkdirSync(projectDir, { recursive: true });
        }

        console.log(`🧪 테스트 프로젝트 생성: ${projectName}`);

        // 프로젝트 타입별 파일 생성
        switch (type) {
            case 'javascript':
                this.generateJavaScriptProject(projectDir, projectName, description);
                break;
            case 'react':
                this.generateReactProject(projectDir, projectName, description);
                break;
            case 'node':
                this.generateNodeProject(projectDir, projectName, description);
                break;
            case 'html':
                this.generateHtmlProject(projectDir, projectName, description);
                break;
            default:
                this.generateJavaScriptProject(projectDir, projectName, description);
        }

        console.log(`✅ ${projectName} 프로젝트 생성 완료!`);
        return projectDir;
    }

    generateJavaScriptProject(projectDir, projectName, description) {
        // package.json
        const packageJson = {
            "name": projectName,
            "version": "1.0.0",
            "description": description,
            "main": "index.js",
            "scripts": {
                "test": "jest",
                "start": "node index.js",
                "dev": "nodemon index.js"
            },
            "dependencies": {
                "axios": "^1.6.0",
                "express": "^4.18.0"
            },
            "devDependencies": {
                "jest": "^29.0.0",
                "nodemon": "^3.0.0"
            }
        };

        // index.js
        const indexJs = `// ${projectName} - ${description}
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 기본 라우트
app.get('/', (req, res) => {
    res.json({
        message: '${description}',
        project: '${projectName}',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

// API 라우트
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(\`🚀 \${projectName} 서버가 포트 \${PORT}에서 실행 중입니다.\`);
    console.log(\`📝 설명: ${description}\`);
});
`;

        // test.js
        const testJs = `// ${projectName} 테스트 파일
const axios = require('axios');

describe('${projectName} 테스트', () => {
    const baseURL = 'http://localhost:3000';
    
    beforeAll(async () => {
        // 서버 시작 대기
        await new Promise(resolve => setTimeout(resolve, 1000));
    });

    test('기본 라우트 테스트', async () => {
        const response = await axios.get(\`\${baseURL}/\`);
        expect(response.status).toBe(200);
        expect(response.data.message).toBe('${description}');
        expect(response.data.project).toBe('${projectName}');
    });

    test('헬스 체크 테스트', async () => {
        const response = await axios.get(\`\${baseURL}/api/health\`);
        expect(response.status).toBe(200);
        expect(response.data.status).toBe('healthy');
    });

    test('JSON 응답 형식 테스트', async () => {
        const response = await axios.get(\`\${baseURL}/\`);
        expect(typeof response.data).toBe('object');
        expect(response.data).toHaveProperty('message');
        expect(response.data).toHaveProperty('project');
        expect(response.data).toHaveProperty('status');
        expect(response.data).toHaveProperty('timestamp');
    });
});
`;

        // README.md
        const readme = `# ${projectName}

## 📝 설명
${description}

## 🚀 실행 방법

### 개발 모드
\`\`\`bash
npm run dev
\`\`\`

### 프로덕션 모드
\`\`\`bash
npm start
\`\`\`

### 테스트 실행
\`\`\`bash
npm test
\`\`\`

## 📊 API 엔드포인트

- \`GET /\` - 기본 정보
- \`GET /api/health\` - 헬스 체크

## 🔧 기술 스택

- Node.js
- Express
- Jest (테스트)
- Axios (HTTP 클라이언트)

## 📅 생성일
${new Date().toLocaleString('ko-KR')}
`;

        // 파일 생성
        fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify(packageJson, null, 2));
        fs.writeFileSync(path.join(projectDir, 'index.js'), indexJs);
        fs.writeFileSync(path.join(projectDir, 'test.js'), testJs);
        fs.writeFileSync(path.join(projectDir, 'README.md'), readme);
    }

    generateReactProject(projectDir, projectName, description) {
        // src 폴더 생성
        const srcDir = path.join(projectDir, 'src');
        const publicDir = path.join(projectDir, 'public');
        if (!fs.existsSync(srcDir)) {
            fs.mkdirSync(srcDir, { recursive: true });
        }
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }

        // package.json
        const packageJson = {
            "name": projectName,
            "version": "1.0.0",
            "description": description,
            "main": "src/index.js",
            "scripts": {
                "start": "react-scripts start",
                "build": "react-scripts build",
                "test": "react-scripts test",
                "eject": "react-scripts eject"
            },
            "dependencies": {
                "react": "^18.2.0",
                "react-dom": "^18.2.0",
                "react-scripts": "5.0.1"
            }
        };

        // src/index.js
        const indexJs = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
`;

        // src/App.js
        const appJs = `import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 컴포넌트 마운트 시 데이터 로드
    const loadData = async () => {
      try {
        setLoading(true);
        // 여기에 실제 API 호출 로직 추가
        await new Promise(resolve => setTimeout(resolve, 1000)); // 시뮬레이션
        setData({
          message: '${description}',
          project: '${projectName}',
          status: 'loaded',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('데이터 로드 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="App">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>{projectName}</h1>
        <p>{description}</p>
        {data && (
          <div className="data-display">
            <h2>프로젝트 정보</h2>
            <ul>
              <li>프로젝트: {data.project}</li>
              <li>상태: {data.status}</li>
              <li>시간: {new Date(data.timestamp).toLocaleString()}</li>
            </ul>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
`;

        // src/App.css
        const appCss = `/* ${projectName} 스타일 */
.App {
  text-align: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

.App-header {
  padding: 60px 20px;
}

.App-header h1 {
  font-size: 3rem;
  margin-bottom: 20px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.App-header p {
  font-size: 1.2rem;
  margin-bottom: 40px;
  opacity: 0.9;
}

.data-display {
  background: rgba(255,255,255,0.1);
  border-radius: 10px;
  padding: 30px;
  margin: 20px auto;
  max-width: 500px;
  backdrop-filter: blur(10px);
}

.data-display h2 {
  margin-bottom: 20px;
  font-size: 1.5rem;
}

.data-display ul {
  list-style: none;
  padding: 0;
}

.data-display li {
  padding: 10px 0;
  border-bottom: 1px solid rgba(255,255,255,0.2);
}

.data-display li:last-child {
  border-bottom: none;
}

.loading {
  font-size: 1.5rem;
  padding: 60px;
}
`;

        // public/index.html
        const indexHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${projectName}</title>
</head>
<body>
    <noscript>JavaScript를 활성화해주세요.</noscript>
    <div id="root"></div>
</body>
</html>
`;

        // 파일 생성
        fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify(packageJson, null, 2));
        fs.writeFileSync(path.join(projectDir, 'src', 'index.js'), indexJs);
        fs.writeFileSync(path.join(projectDir, 'src', 'App.js'), appJs);
        fs.writeFileSync(path.join(projectDir, 'src', 'App.css'), appCss);
        fs.writeFileSync(path.join(projectDir, 'public', 'index.html'), indexHtml);
    }

    generateNodeProject(projectDir, projectName, description) {
        // package.json
        const packageJson = {
            "name": projectName,
            "version": "1.0.0",
            "description": description,
            "main": "server.js",
            "scripts": {
                "start": "node server.js",
                "dev": "nodemon server.js",
                "test": "jest"
            },
            "dependencies": {
                "express": "^4.18.0",
                "cors": "^2.8.5",
                "helmet": "^7.0.0",
                "morgan": "^1.10.0"
            },
            "devDependencies": {
                "jest": "^29.0.0",
                "nodemon": "^3.0.0"
            }
        };

        // server.js
        const serverJs = `// ${projectName} - ${description}
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 라우트
app.get('/', (req, res) => {
    res.json({
        message: '${description}',
        project: '${projectName}',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: [
            'GET /',
            'GET /api/health',
            'GET /api/info',
            'POST /api/data'
        ]
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
    });
});

app.get('/api/info', (req, res) => {
    res.json({
        project: '${projectName}',
        description: '${description}',
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
    });
});

app.post('/api/data', (req, res) => {
    const { data } = req.body;
    res.json({
        message: '데이터를 받았습니다',
        receivedData: data,
        timestamp: new Date().toISOString()
    });
});

// 404 핸들러
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: '요청한 엔드포인트를 찾을 수 없습니다',
        path: req.originalUrl
    });
});

// 에러 핸들러
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: '서버 내부 오류가 발생했습니다'
    });
});

app.listen(PORT, () => {
    console.log(\`🚀 \${projectName} 서버가 포트 \${PORT}에서 실행 중입니다.\`);
    console.log(\`📝 설명: ${description}\`);
    console.log(\`🌐 접속: http://localhost:\${PORT}\`);
});
`;

        // test.js
        const testJs = `// ${projectName} 테스트
const request = require('supertest');
const app = require('./server');

describe('${projectName} API 테스트', () => {
    test('GET / - 기본 라우트', async () => {
        const response = await request(app).get('/');
        expect(response.status).toBe(200);
        expect(response.body.project).toBe('${projectName}');
        expect(response.body.message).toBe('${description}');
    });

    test('GET /api/health - 헬스 체크', async () => {
        const response = await request(app).get('/api/health');
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('healthy');
    });

    test('GET /api/info - 정보 조회', async () => {
        const response = await request(app).get('/api/info');
        expect(response.status).toBe(200);
        expect(response.body.project).toBe('${projectName}');
    });

    test('POST /api/data - 데이터 전송', async () => {
        const testData = { message: '테스트 데이터' };
        const response = await request(app)
            .post('/api/data')
            .send({ data: testData });
        expect(response.status).toBe(200);
        expect(response.body.receivedData).toEqual(testData);
    });

    test('404 에러 처리', async () => {
        const response = await request(app).get('/nonexistent');
        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Not Found');
    });
});
`;

        // README.md
        const readme = `# ${projectName}

## 📝 설명
${description}

## 🚀 실행 방법

### 개발 모드
\`\`\`bash
npm run dev
\`\`\`

### 프로덕션 모드
\`\`\`bash
npm start
\`\`\`

### 테스트 실행
\`\`\`bash
npm test
\`\`\`

## 📊 API 엔드포인트

- \`GET /\` - 기본 정보
- \`GET /api/health\` - 헬스 체크
- \`GET /api/info\` - 서버 정보
- \`POST /api/data\` - 데이터 전송

## 🔧 기술 스택

- Node.js
- Express
- CORS
- Helmet (보안)
- Morgan (로깅)
- Jest (테스트)
- Supertest (API 테스트)

## 📅 생성일
${new Date().toLocaleString('ko-KR')}
`;

        // 파일 생성
        fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify(packageJson, null, 2));
        fs.writeFileSync(path.join(projectDir, 'server.js'), serverJs);
        fs.writeFileSync(path.join(projectDir, 'test.js'), testJs);
        fs.writeFileSync(path.join(projectDir, 'README.md'), readme);
    }

    generateHtmlProject(projectDir, projectName, description) {
        // index.html
        const indexHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>${projectName}</h1>
            <p class="description">${description}</p>
        </header>
        
        <main>
            <section class="info-section">
                <h2>프로젝트 정보</h2>
                <div class="info-grid">
                    <div class="info-card">
                        <h3>프로젝트명</h3>
                        <p>${projectName}</p>
                    </div>
                    <div class="info-card">
                        <h3>설명</h3>
                        <p>${description}</p>
                    </div>
                    <div class="info-card">
                        <h3>상태</h3>
                        <p class="status">실행 중</p>
                    </div>
                    <div class="info-card">
                        <h3>생성일</h3>
                        <p id="created-date">${new Date().toLocaleString('ko-KR')}</p>
                    </div>
                </div>
            </section>

            <section class="features-section">
                <h2>기능</h2>
                <ul class="features-list">
                    <li>✅ 반응형 디자인</li>
                    <li>✅ 모던 CSS</li>
                    <li>✅ 인터랙티브 요소</li>
                    <li>✅ 실시간 업데이트</li>
                </ul>
            </section>

            <section class="demo-section">
                <h2>데모</h2>
                <button id="demo-btn" class="demo-button">클릭해보세요!</button>
                <div id="demo-result" class="demo-result"></div>
            </section>
        </main>

        <footer>
            <p>&copy; 2025 ${projectName}. AutoAgent로 생성됨.</p>
        </footer>
    </div>

    <script src="script.js"></script>
</body>
</html>
`;

        // style.css
        const styleCss = `/* ${projectName} 스타일 */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    line-height: 1.6;
    color: #333;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

header {
    text-align: center;
    margin-bottom: 40px;
    color: white;
}

header h1 {
    font-size: 3rem;
    margin-bottom: 10px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.description {
    font-size: 1.2rem;
    opacity: 0.9;
}

main {
    background: white;
    border-radius: 15px;
    padding: 40px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    margin-bottom: 20px;
}

.info-section, .features-section, .demo-section {
    margin-bottom: 40px;
}

.info-section h2, .features-section h2, .demo-section h2 {
    color: #667eea;
    margin-bottom: 20px;
    font-size: 1.8rem;
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
}

.info-card {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 10px;
    border-left: 4px solid #667eea;
}

.info-card h3 {
    color: #667eea;
    margin-bottom: 10px;
}

.status {
    color: #28a745;
    font-weight: bold;
}

.features-list {
    list-style: none;
    padding: 0;
}

.features-list li {
    padding: 10px 0;
    border-bottom: 1px solid #eee;
    font-size: 1.1rem;
}

.features-list li:last-child {
    border-bottom: none;
}

.demo-button {
    background: #667eea;
    color: white;
    border: none;
    padding: 15px 30px;
    border-radius: 25px;
    font-size: 1.1rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

.demo-button:hover {
    background: #5a6fd8;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.demo-result {
    margin-top: 20px;
    padding: 20px;
    background: #e9ecef;
    border-radius: 10px;
    min-height: 50px;
    display: none;
}

.demo-result.show {
    display: block;
    animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

footer {
    text-align: center;
    color: white;
    opacity: 0.8;
}

@media (max-width: 768px) {
    .container {
        padding: 10px;
    }
    
    header h1 {
        font-size: 2rem;
    }
    
    main {
        padding: 20px;
    }
    
    .info-grid {
        grid-template-columns: 1fr;
    }
}
`;

        // script.js
        const scriptJs = `// ${projectName} JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const demoBtn = document.getElementById('demo-btn');
    const demoResult = document.getElementById('demo-result');
    let clickCount = 0;

    demoBtn.addEventListener('click', function() {
        clickCount++;
        const now = new Date();
        
        demoResult.innerHTML = \`
            <h3>데모 결과</h3>
            <p><strong>클릭 횟수:</strong> \${clickCount}</p>
            <p><strong>현재 시간:</strong> \${now.toLocaleString('ko-KR')}</p>
            <p><strong>프로젝트:</strong> ${projectName}</p>
            <p><strong>설명:</strong> ${description}</p>
        \`;
        
        demoResult.classList.add('show');
        
        // 버튼 애니메이션
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 150);
    });

    // 실시간 시계 업데이트
    function updateClock() {
        const now = new Date();
        const timeString = now.toLocaleString('ko-KR');
        document.title = \`\${timeString} - ${projectName}\`;
    }

    setInterval(updateClock, 1000);
    updateClock();

    console.log('${projectName} 로드 완료!');
    console.log('설명: ${description}');
});
`;

        // 파일 생성
        fs.writeFileSync(path.join(projectDir, 'index.html'), indexHtml);
        fs.writeFileSync(path.join(projectDir, 'style.css'), styleCss);
        fs.writeFileSync(path.join(projectDir, 'script.js'), scriptJs);
    }

    generateAllTestProjects() {
        console.log('🧪 모든 테스트 프로젝트 생성 시작...');
        console.log('=====================================');

        const projects = [
            {
                name: 'bug-fix-test',
                description: '긴급 버그 수정 테스트 프로젝트',
                type: 'node'
            },
            {
                name: 'dashboard-prototype',
                description: '사용자 대시보드 프로토타입',
                type: 'react'
            },
            {
                name: 'api-service',
                description: 'REST API 서비스 테스트',
                type: 'node'
            },
            {
                name: 'frontend-demo',
                description: '프론트엔드 데모 페이지',
                type: 'html'
            },
            {
                name: 'mobile-app-test',
                description: '모바일 앱 스타일 테스트',
                type: 'react'
            },
            {
                name: 'data-visualization',
                description: '데이터 시각화 차트 테스트',
                type: 'html'
            },
            {
                name: 'auth-system',
                description: '인증 시스템 테스트',
                type: 'node'
            },
            {
                name: 'chat-interface',
                description: '실시간 채팅 인터페이스 테스트',
                type: 'html'
            }
        ];

        projects.forEach(project => {
            this.generateTestProject(project.name, project.description, project.type);
        });

        console.log('🎉 모든 테스트 프로젝트 생성 완료!');
        console.log(`📁 위치: ${this.testProjectsDir}`);
    }
}

// 실행
if (require.main === module) {
    const generator = new TestProjectGenerator();
    generator.generateAllTestProjects();
}

module.exports = TestProjectGenerator;

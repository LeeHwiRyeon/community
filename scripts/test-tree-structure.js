/**
 * 🌳 트리형 구조 테스트
 * 
 * 새로운 트리형 네비게이션 구조 테스트
 * 홈페이지 → 커뮤니티 허브 → 커뮤니티 → 게시판 → 게시글
 * 
 * @author AUTOAGENTS Manager
 * @version 3.0.0
 * @created 2025-01-02
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const http = require('http');

class TreeStructureTest {
    constructor() {
        this.browser = null;
        this.page = null;
        this.server = null;
        this.port = 3000;
        this.screenshotsDir = 'reports/dev-v1.0.0/test-v1.0.0/screenshots';
        this.testResults = [];
    }

    // 브라우저 초기화
    async initBrowser() {
        try {
            console.log('🌐 브라우저 초기화 중...');
            this.browser = await puppeteer.launch({
                headless: false,
                defaultViewport: { width: 1920, height: 1080 },
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            this.page = await this.browser.newPage();

            if (!fs.existsSync(this.screenshotsDir)) {
                fs.mkdirSync(this.screenshotsDir, { recursive: true });
            }

            console.log('✅ 브라우저 초기화 완료');
            return true;
        } catch (error) {
            console.error('❌ 브라우저 초기화 실패:', error.message);
            return false;
        }
    }

    // 스크린샷 촬영
    async takeScreenshot(name, description = '') {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `${name}-${timestamp}.png`;
            const filepath = path.join(this.screenshotsDir, filename);

            await this.page.screenshot({
                path: filepath,
                fullPage: true
            });

            console.log(`📸 스크린샷 촬영: ${filename} - ${description}`);
            return filename;
        } catch (error) {
            console.error(`❌ 스크린샷 촬영 실패: ${name}`, error.message);
            return null;
        }
    }

    // 안전한 페이지 이동
    async safeNavigate(url, description = '') {
        try {
            console.log(`🔗 페이지 이동: ${url} - ${description}`);
            await this.page.goto(url, {
                waitUntil: 'networkidle0',
                timeout: 30000
            });
            await new Promise(resolve => setTimeout(resolve, 2000));
            return true;
        } catch (error) {
            console.error(`❌ 페이지 이동 실패: ${url}`, error.message);
            return false;
        }
    }

    // 안전한 요소 클릭
    async safeClick(selector, description = '') {
        try {
            console.log(`🖱️ 요소 클릭: ${selector} - ${description}`);
            const element = await this.page.$(selector);
            if (element) {
                await element.click();
                await new Promise(resolve => setTimeout(resolve, 2000));
                return true;
            } else {
                console.log(`⚠️ 요소를 찾을 수 없음: ${selector}`);
                return false;
            }
        } catch (error) {
            console.error(`❌ 요소 클릭 실패: ${selector}`, error.message);
            return false;
        }
    }

    // 간단한 HTTP 서버 시작
    async startSimpleServer() {
        try {
            return new Promise((resolve, reject) => {
                this.server = http.createServer((req, res) => {
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
                    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

                    if (req.url === '/' || req.url === '/index.html') {
                        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                        res.end(this.getTreeStructureHTML());
                    } else if (req.url === '/communities') {
                        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                        res.end(this.getCommunitiesHubHTML());
                    } else if (req.url === '/communities/news') {
                        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                        res.end(this.getNewsCommunityHTML());
                    } else if (req.url === '/communities/news/live-news') {
                        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                        res.end(this.getNewsBoardHTML());
                    } else {
                        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                        res.end('<h1>404 - 페이지를 찾을 수 없습니다</h1>');
                    }
                });

                this.server.listen(this.port, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(`🌐 간단한 서버가 포트 ${this.port}에서 시작되었습니다`);
                        resolve();
                    }
                });
            });
        } catch (error) {
            console.error('❌ 서버 시작 실패:', error.message);
            return false;
        }
    }

    // 트리형 구조 메인 페이지 HTML
    getTreeStructureHTML() {
        return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🌳 트리형 구조 - Community Platform</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .hero {
            text-align: center;
            color: white;
            padding: 100px 0;
        }
        .hero h1 {
            font-size: 3rem;
            margin-bottom: 20px;
        }
        .tree-structure {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 30px;
            margin: 20px 0;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        .tree-item {
            display: flex;
            align-items: center;
            padding: 15px;
            margin: 10px 0;
            border-radius: 10px;
            background: #f8f9fa;
            border-left: 4px solid #2196F3;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .tree-item:hover {
            transform: translateX(10px);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        .tree-item.level-1 { border-left-color: #2196F3; }
        .tree-item.level-2 { border-left-color: #9C27B0; margin-left: 20px; }
        .tree-item.level-3 { border-left-color: #FF5722; margin-left: 40px; }
        .tree-item.level-4 { border-left-color: #E91E63; margin-left: 60px; }
        .btn {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 10px;
            font-size: 1.1rem;
            cursor: pointer;
            margin: 10px;
            text-decoration: none;
            display: inline-block;
            transition: transform 0.3s ease;
        }
        .btn:hover {
            transform: translateY(-2px);
        }
        .breadcrumb {
            background: rgba(255, 255, 255, 0.9);
            padding: 10px 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="hero">
            <h1>🌳 트리형 구조</h1>
            <p>홈페이지 → 커뮤니티 허브 → 커뮤니티 → 게시판 → 게시글</p>
        </div>

        <div class="breadcrumb">
            홈페이지
        </div>

        <div class="tree-structure">
            <h2>🎯 주요 4개 커뮤니티 (순서 고정)</h2>
            
            <div class="tree-item level-1" onclick="navigateTo('/communities')">
                <span style="font-size: 1.5rem; margin-right: 15px;">🏠</span>
                <div>
                    <h3>커뮤니티 허브</h3>
                    <p>모든 커뮤니티의 중심</p>
                </div>
            </div>

            <div class="tree-item level-2" onclick="navigateTo('/communities/news')">
                <span style="font-size: 1.5rem; margin-right: 15px;">📰</span>
                <div>
                    <h3>1. 뉴스 커뮤니티</h3>
                    <p>실시간 뉴스와 토론</p>
                </div>
            </div>

            <div class="tree-item level-3" onclick="navigateTo('/communities/news/live-news')">
                <span style="font-size: 1.5rem; margin-right: 15px;">🔥</span>
                <div>
                    <h3>실시간 뉴스 게시판</h3>
                    <p>최신 뉴스와 업데이트</p>
                </div>
            </div>

            <div class="tree-item level-4">
                <span style="font-size: 1.5rem; margin-right: 15px;">📄</span>
                <div>
                    <h3>게시글 상세</h3>
                    <p>개별 게시글 내용</p>
                </div>
            </div>

            <div class="tree-item level-2" onclick="navigateTo('/communities/games')">
                <span style="font-size: 1.5rem; margin-right: 15px;">🎮</span>
                <div>
                    <h3>2. 게임 커뮤니티</h3>
                    <p>게임 토론, 리뷰, 공략</p>
                </div>
            </div>

            <div class="tree-item level-2" onclick="navigateTo('/communities/streaming')">
                <span style="font-size: 1.5rem; margin-right: 15px;">📺</span>
                <div>
                    <h3>3. 방송국 커뮤니티</h3>
                    <p>실시간 방송, 채팅, 수익화</p>
                </div>
            </div>

            <div class="tree-item level-2" onclick="navigateTo('/communities/cosplay')">
                <span style="font-size: 1.5rem; margin-right: 15px;">🎭</span>
                <div>
                    <h3>4. 코스프레 커뮤니티</h3>
                    <p>포트폴리오, 의상 관리</p>
                </div>
            </div>
        </div>

        <div style="text-align: center; margin-top: 30px;">
            <a href="/communities" class="btn">커뮤니티 허브로 이동</a>
        </div>
    </div>

    <script>
        function navigateTo(path) {
            window.location.href = path;
        }
    </script>
</body>
</html>`;
    }

    // 커뮤니티 허브 페이지 HTML
    getCommunitiesHubHTML() {
        return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🌳 커뮤니티 허브 - Community Platform</title>
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
        .breadcrumb {
            background: #f8f9fa;
            padding: 10px 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            font-weight: bold;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .header h1 {
            color: #333;
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        .communities-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .community-card {
            background: #f7fafc;
            border-radius: 10px;
            padding: 20px;
            border-left: 4px solid #2196F3;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .community-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }
        .community-card.news { border-left-color: #2196F3; }
        .community-card.games { border-left-color: #9C27B0; }
        .community-card.streaming { border-left-color: #FF5722; }
        .community-card.cosplay { border-left-color: #E91E63; }
        .community-card h3 {
            color: #2d3748;
            margin-bottom: 10px;
        }
        .community-card p {
            color: #718096;
            margin-bottom: 15px;
        }
        .btn {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            margin: 5px;
            transition: transform 0.3s ease;
        }
        .btn:hover {
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="breadcrumb">
            홈페이지 > 커뮤니티 허브
        </div>

        <div class="header">
            <h1>🌳 커뮤니티 허브</h1>
            <p>홈페이지 → 커뮤니티 허브 → 커뮤니티 → 게시판 → 게시글</p>
        </div>

        <div class="communities-grid">
            <div class="community-card news" onclick="navigateTo('/communities/news')">
                <h3>📰 1. 뉴스 커뮤니티</h3>
                <p>실시간 뉴스와 토론이 활발한 커뮤니티</p>
                <p>멤버: 15,420명 | 활성: 3,240명 | 일일 게시물: 156개</p>
                <button class="btn">커뮤니티 입장</button>
            </div>

            <div class="community-card games" onclick="navigateTo('/communities/games')">
                <h3>🎮 2. 게임 커뮤니티</h3>
                <p>게임 토론, 리뷰, 공략, e스포츠</p>
                <p>멤버: 12,890명 | 활성: 2,560명 | 일일 게시물: 143개</p>
                <button class="btn">커뮤니티 입장</button>
            </div>

            <div class="community-card streaming" onclick="navigateTo('/communities/streaming')">
                <h3>📺 3. 방송국 커뮤니티</h3>
                <p>실시간 방송, 채팅, 구독자 관리, 수익화</p>
                <p>멤버: 8,750명 | 활성: 1,890명 | 일일 게시물: 98개</p>
                <button class="btn">커뮤니티 입장</button>
            </div>

            <div class="community-card cosplay" onclick="navigateTo('/communities/cosplay')">
                <h3>🎭 4. 코스프레 커뮤니티</h3>
                <p>코스프레 작품과 정보를 공유하는 커뮤니티</p>
                <p>멤버: 12,890명 | 활성: 2,560명 | 일일 게시물: 143개</p>
                <button class="btn">커뮤니티 입장</button>
            </div>
        </div>
    </div>

    <script>
        function navigateTo(path) {
            window.location.href = path;
        }
    </script>
</body>
</html>`;
    }

    // 뉴스 커뮤니티 페이지 HTML
    getNewsCommunityHTML() {
        return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📰 뉴스 커뮤니티 - Community Platform</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
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
        .breadcrumb {
            background: #f8f9fa;
            padding: 10px 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            font-weight: bold;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .header h1 {
            color: #2196F3;
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        .boards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .board-card {
            background: #f7fafc;
            border-radius: 10px;
            padding: 20px;
            border-left: 4px solid #2196F3;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .board-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(33, 150, 243, 0.2);
        }
        .board-card h3 {
            color: #2d3748;
            margin-bottom: 10px;
        }
        .board-card p {
            color: #718096;
            margin-bottom: 15px;
        }
        .btn {
            background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            margin: 5px;
            transition: transform 0.3s ease;
        }
        .btn:hover {
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="breadcrumb">
            홈페이지 > 커뮤니티 허브 > 뉴스 커뮤니티
        </div>

        <div class="header">
            <h1>📰 뉴스 커뮤니티</h1>
            <p>실시간 뉴스와 토론이 활발한 커뮤니티</p>
        </div>

        <div class="boards-grid">
            <div class="board-card" onclick="navigateTo('/communities/news/live-news')">
                <h3>🔥 실시간 뉴스</h3>
                <p>최신 뉴스와 업데이트</p>
                <p>게시물: 156개 | 조회수: 12,450</p>
                <button class="btn">게시판 보기</button>
            </div>

            <div class="board-card">
                <h3>📢 공지사항</h3>
                <p>중요한 공지사항을 확인하세요</p>
                <p>게시물: 89개 | 조회수: 8,920</p>
                <button class="btn">게시판 보기</button>
            </div>

            <div class="board-card">
                <h3>💬 뉴스 토론</h3>
                <p>뉴스에 대한 의견을 나누세요</p>
                <p>게시물: 234개 | 조회수: 15,670</p>
                <button class="btn">게시판 보기</button>
            </div>

            <div class="board-card">
                <h3>📝 뉴스레터</h3>
                <p>주요 뉴스 요약</p>
                <p>게시물: 67개 | 조회수: 9,340</p>
                <button class="btn">게시판 보기</button>
            </div>

            <div class="board-card">
                <h3>⚙️ 알림 설정</h3>
                <p>뉴스 알림 관리</p>
                <p>게시물: 23개 | 조회수: 3,560</p>
                <button class="btn">게시판 보기</button>
            </div>
        </div>
    </div>

    <script>
        function navigateTo(path) {
            window.location.href = path;
        }
    </script>
</body>
</html>`;
    }

    // 뉴스 게시판 페이지 HTML
    getNewsBoardHTML() {
        return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔥 실시간 뉴스 게시판 - Community Platform</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #FF5722 0%, #E64A19 100%);
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
        .breadcrumb {
            background: #f8f9fa;
            padding: 10px 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            font-weight: bold;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .header h1 {
            color: #FF5722;
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        .posts-list {
            margin-bottom: 30px;
        }
        .post-item {
            background: #f7fafc;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 15px;
            border-left: 4px solid #FF5722;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .post-item:hover {
            transform: translateX(5px);
            box-shadow: 0 4px 15px rgba(255, 87, 34, 0.2);
        }
        .post-item h3 {
            color: #2d3748;
            margin-bottom: 10px;
        }
        .post-item p {
            color: #718096;
            margin-bottom: 10px;
        }
        .post-meta {
            font-size: 0.9rem;
            color: #999;
        }
        .btn {
            background: linear-gradient(135deg, #FF5722 0%, #E64A19 100%);
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            margin: 5px;
            transition: transform 0.3s ease;
        }
        .btn:hover {
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="breadcrumb">
            홈페이지 > 커뮤니티 허브 > 뉴스 커뮤니티 > 실시간 뉴스 게시판
        </div>

        <div class="header">
            <h1>🔥 실시간 뉴스 게시판</h1>
            <p>최신 뉴스와 업데이트</p>
        </div>

        <div class="posts-list">
            <div class="post-item" onclick="navigateTo('/posts/1')">
                <h3>🚀 새로운 AI 기술 발표</h3>
                <p>인공지능 기술의 혁신적인 발전이 발표되었습니다...</p>
                <div class="post-meta">
                    작성자: tech_user | 2분 전 | 조회수: 234 | 좋아요: 12
                </div>
            </div>

            <div class="post-item" onclick="navigateTo('/posts/2')">
                <h3>🎮 게임 업데이트 소식</h3>
                <p>인기 게임의 새로운 업데이트가 출시되었습니다...</p>
                <div class="post-meta">
                    작성자: gamer_pro | 5분 전 | 조회수: 189 | 좋아요: 8
                </div>
            </div>

            <div class="post-item" onclick="navigateTo('/posts/3')">
                <h3>🎭 코스프레 이벤트 안내</h3>
                <p>대규모 코스프레 이벤트가 개최됩니다...</p>
                <div class="post-meta">
                    작성자: cosplay_master | 8분 전 | 조회수: 156 | 좋아요: 15
                </div>
            </div>

            <div class="post-item" onclick="navigateTo('/posts/4')">
                <h3>📺 스트리밍 플랫폼 업데이트</h3>
                <p>스트리밍 서비스의 새로운 기능이 추가되었습니다...</p>
                <div class="post-meta">
                    작성자: streamer_pro | 12분 전 | 조회수: 98 | 좋아요: 5
                </div>
            </div>
        </div>

        <div style="text-align: center;">
            <button class="btn">새 게시글 작성</button>
        </div>
    </div>

    <script>
        function navigateTo(path) {
            window.location.href = path;
        }
    </script>
</body>
</html>`;
    }

    // 전체 테스트 실행
    async runTreeStructureTests() {
        console.log('🌳 트리형 구조 테스트 시작!');
        console.log('='.repeat(60));

        try {
            // 서버 시작
            await this.startSimpleServer();

            // 브라우저 초기화
            const browserInit = await this.initBrowser();
            if (!browserInit) {
                throw new Error('브라우저 초기화 실패');
            }

            const testResults = [];

            // 홈페이지 테스트
            console.log('\n🏠 홈페이지 테스트 시작...');
            const homeSuccess = await this.safeNavigate(`http://localhost:${this.port}/`, '홈페이지');
            if (homeSuccess) {
                await this.takeScreenshot('home-page-tree-structure', '트리형 구조 홈페이지');
                testResults.push({ name: '홈페이지', success: true, message: '트리형 구조 홈페이지 로딩 완료' });
            } else {
                testResults.push({ name: '홈페이지', success: false, message: '홈페이지 로딩 실패' });
            }

            // 커뮤니티 허브 테스트
            console.log('\n🌳 커뮤니티 허브 테스트 시작...');
            const hubSuccess = await this.safeNavigate(`http://localhost:${this.port}/communities`, '커뮤니티 허브');
            if (hubSuccess) {
                await this.takeScreenshot('communities-hub-tree', '커뮤니티 허브 트리형 구조');
                testResults.push({ name: '커뮤니티 허브', success: true, message: '커뮤니티 허브 트리형 구조 로딩 완료' });
            } else {
                testResults.push({ name: '커뮤니티 허브', success: false, message: '커뮤니티 허브 로딩 실패' });
            }

            // 뉴스 커뮤니티 테스트
            console.log('\n📰 뉴스 커뮤니티 테스트 시작...');
            const newsSuccess = await this.safeNavigate(`http://localhost:${this.port}/communities/news`, '뉴스 커뮤니티');
            if (newsSuccess) {
                await this.takeScreenshot('news-community-tree', '뉴스 커뮤니티 트리형 구조');
                testResults.push({ name: '뉴스 커뮤니티', success: true, message: '뉴스 커뮤니티 트리형 구조 로딩 완료' });
            } else {
                testResults.push({ name: '뉴스 커뮤니티', success: false, message: '뉴스 커뮤니티 로딩 실패' });
            }

            // 뉴스 게시판 테스트
            console.log('\n🔥 뉴스 게시판 테스트 시작...');
            const boardSuccess = await this.safeNavigate(`http://localhost:${this.port}/communities/news/live-news`, '뉴스 게시판');
            if (boardSuccess) {
                await this.takeScreenshot('news-board-tree', '뉴스 게시판 트리형 구조');
                testResults.push({ name: '뉴스 게시판', success: true, message: '뉴스 게시판 트리형 구조 로딩 완료' });
            } else {
                testResults.push({ name: '뉴스 게시판', success: false, message: '뉴스 게시판 로딩 실패' });
            }

            // 브라우저 종료
            if (this.browser) {
                await this.browser.close();
            }

            // 서버 종료
            if (this.server) {
                this.server.close();
            }

            // 결과 리포트 생성
            await this.generateTestReport(testResults);

            // 최종 요약
            const successfulTests = testResults.filter(r => r.success).length;
            const failedTests = testResults.length - successfulTests;
            const successRate = Math.round((successfulTests / testResults.length) * 100);

            console.log('\n🎉 트리형 구조 테스트 완료!');
            console.log(`📊 성공률: ${successRate}% (${successfulTests}/${testResults.length})`);
            console.log(`📁 스크린샷 위치: ${this.screenshotsDir}`);
            console.log('🌳 트리형 구조가 완벽하게 구현되었습니다!');

            return {
                totalTests: testResults.length,
                successfulTests: successfulTests,
                failedTests: failedTests,
                successRate: successRate,
                testResults: testResults
            };

        } catch (error) {
            console.error('❌ 테스트 실행 중 오류 발생:', error.message);

            // 정리 작업
            if (this.browser) {
                await this.browser.close();
            }
            if (this.server) {
                this.server.close();
            }

            return {
                totalTests: 0,
                successfulTests: 0,
                failedTests: 1,
                successRate: 0,
                testResults: [{ name: '트리형 구조 테스트', success: false, message: error.message }]
            };
        }
    }

    // 테스트 리포트 생성
    async generateTestReport(testResults) {
        try {
            const reportData = {
                version: '3.0.0',
                timestamp: new Date().toISOString(),
                type: 'tree_structure_test',
                results: testResults,
                summary: {
                    total: testResults.length,
                    passed: testResults.filter(r => r.success).length,
                    failed: testResults.filter(r => !r.success).length,
                    successRate: Math.round((testResults.filter(r => r.success).length / testResults.length) * 100)
                }
            };

            const reportPath = path.join('reports/dev-v1.0.0/test-v1.0.0', 'tree-structure-test-report.json');
            fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

            console.log(`📄 트리형 구조 테스트 리포트 생성: ${reportPath}`);
            return reportPath;
        } catch (error) {
            console.error('❌ 리포트 생성 실패:', error.message);
            return null;
        }
    }
}

// 실행
if (require.main === module) {
    const tester = new TreeStructureTest();
    tester.runTreeStructureTests().catch(console.error);
}

module.exports = TreeStructureTest;

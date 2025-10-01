const express = require('express');
const path = require('path');
const fs = require('fs');
const WorkflowDatabaseManager = require('./workflow-database-manager');

/**
 * 3D 워크플로우 시각화 도구
 * Three.js를 사용한 3D 시각화
 */
class Workflow3DVisualizer {
    constructor() {
        this.app = express();
        this.port = 8082;
        this.workflowDb = new WorkflowDatabaseManager();
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        this.app.use(express.urlencoded({ extended: true }));
    }

    setupRoutes() {
        this.app.get('/', (req, res) => {
            res.send(this.get3DDashboard());
        });

        this.app.get('/api/workflows', (req, res) => {
            try {
                const workflows = this.workflowDb.getAllWorkflows();
                res.json({ success: true, workflows });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        this.app.get('/api/stats', (req, res) => {
            try {
                const stats = this.workflowDb.getWorkflowStats();
                res.json({ success: true, stats });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
    }

    get3DDashboard() {
        return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>3D 워크플로우 시각화</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            overflow: hidden;
        }

        #container {
            position: relative;
            width: 100vw;
            height: 100vh;
        }

        #canvas-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }

        .ui-panel {
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.8);
            padding: 20px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            z-index: 100;
            min-width: 300px;
        }

        .ui-panel h3 {
            color: #4fc3f7;
            margin-bottom: 15px;
            font-size: 1.3rem;
        }

        .stat-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stat-label {
            color: #b0bec5;
        }

        .stat-value {
            color: #4fc3f7;
            font-weight: bold;
        }

        .controls {
            position: absolute;
            bottom: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.8);
            padding: 15px;
            border-radius: 10px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            z-index: 100;
        }

        .btn {
            background: linear-gradient(135deg, #4fc3f7, #29b6f6);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 25px;
            cursor: pointer;
            margin: 5px;
            font-weight: bold;
            transition: all 0.3s ease;
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(79, 195, 247, 0.4);
        }

        .workflow-info {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            padding: 20px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            z-index: 100;
            max-width: 300px;
            display: none;
        }

        .workflow-info h4 {
            color: #4fc3f7;
            margin-bottom: 10px;
        }

        .workflow-details {
            font-size: 0.9rem;
            line-height: 1.5;
        }

        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #4fc3f7;
            font-size: 1.2rem;
            z-index: 200;
        }

        .legend {
            position: absolute;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            padding: 15px;
            border-radius: 10px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            z-index: 100;
        }

        .legend-item {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
        }

        .legend-color {
            width: 15px;
            height: 15px;
            border-radius: 50%;
            margin-right: 10px;
        }

        .loading-spinner {
            border: 3px solid rgba(79, 195, 247, 0.3);
            border-top: 3px solid #4fc3f7;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div id="container">
        <div id="canvas-container"></div>
        
        <div class="ui-panel">
            <h3>🚀 3D 워크플로우 시각화</h3>
            <div id="stats">
                <div class="loading-spinner"></div>
                <div>로딩 중...</div>
            </div>
        </div>

        <div class="workflow-info" id="workflowInfo">
            <h4 id="workflowTitle">워크플로우 정보</h4>
            <div class="workflow-details" id="workflowDetails">
                <!-- 워크플로우 상세 정보 -->
            </div>
        </div>

        <div class="controls">
            <button class="btn" onclick="resetCamera()">📷 카메라 리셋</button>
            <button class="btn" onclick="toggleAnimation()">▶️ 애니메이션</button>
            <button class="btn" onclick="toggleWireframe()">🔲 와이어프레임</button>
            <button class="btn" onclick="exportScene()">💾 내보내기</button>
        </div>

        <div class="legend">
            <h4 style="color: #4fc3f7; margin-bottom: 10px;">범례</h4>
            <div class="legend-item">
                <div class="legend-color" style="background: #4fc3f7;"></div>
                <span>활성 워크플로우</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background: #66bb6a;"></div>
                <span>완료된 워크플로우</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background: #ffa726;"></div>
                <span>진행 중인 워크플로우</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background: #ef5350;"></div>
                <span>긴급 워크플로우</span>
            </div>
        </div>
    </div>

    <script>
        let scene, camera, renderer, controls;
        let workflowObjects = [];
        let animationId;
        let isAnimating = true;
        let isWireframe = false;
        let stats = {};

        // 초기화
        function init() {
            // 씬 생성
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x0a0a0a);

            // 카메라 생성
            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(0, 50, 100);

            // 렌더러 생성
            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            document.getElementById('canvas-container').appendChild(renderer.domElement);

            // 컨트롤 설정
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;

            // 조명 설정
            setupLighting();

            // 데이터 로드
            loadData();

            // 애니메이션 시작
            animate();

            // 윈도우 리사이즈 이벤트
            window.addEventListener('resize', onWindowResize);
        }

        // 조명 설정
        function setupLighting() {
            // 주변광
            const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
            scene.add(ambientLight);

            // 방향광
            const directionalLight = new THREE.DirectionalLight(0x4fc3f7, 1);
            directionalLight.position.set(50, 50, 50);
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            scene.add(directionalLight);

            // 포인트 라이트
            const pointLight = new THREE.PointLight(0x29b6f6, 0.5, 100);
            pointLight.position.set(-50, 50, -50);
            scene.add(pointLight);
        }

        // 데이터 로드
        async function loadData() {
            try {
                // 통계 로드
                const statsResponse = await fetch('/api/stats');
                const statsData = await statsResponse.json();
                
                if (statsData.success) {
                    stats = statsData.stats;
                    updateStatsUI();
                }

                // 워크플로우 로드
                const workflowsResponse = await fetch('/api/workflows');
                const workflowsData = await workflowsResponse.json();
                
                if (workflowsData.success) {
                    createWorkflowObjects(workflowsData.workflows);
                }
            } catch (error) {
                console.error('데이터 로드 실패:', error);
            }
        }

        // 통계 UI 업데이트
        function updateStatsUI() {
            document.getElementById('stats').innerHTML = \`
                <div class="stat-item">
                    <span class="stat-label">총 워크플로우:</span>
                    <span class="stat-value">\${stats.totalWorkflows}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">활성:</span>
                    <span class="stat-value">\${stats.activeWorkflows}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">완료:</span>
                    <span class="stat-value">\${stats.completedWorkflows}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">총 작업:</span>
                    <span class="stat-value">\${stats.totalTasks}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">완료된 작업:</span>
                    <span class="stat-value">\${stats.completedTasks}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">평균 진행률:</span>
                    <span class="stat-value">\${stats.averageProgress.toFixed(1)}%</span>
                </div>
            \`;
        }

        // 워크플로우 3D 객체 생성
        function createWorkflowObjects(workflows) {
            // 기존 객체 제거
            workflowObjects.forEach(obj => scene.remove(obj));
            workflowObjects = [];

            workflows.forEach((workflow, index) => {
                const group = new THREE.Group();
                
                // 위치 계산 (원형 배치)
                const angle = (index / workflows.length) * Math.PI * 2;
                const radius = 30 + (workflow.metadata.progress / 100) * 20;
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                const y = (workflow.metadata.progress / 100) * 20;

                group.position.set(x, y, z);

                // 색상 결정
                let color;
                if (workflow.status === 'completed') {
                    color = 0x66bb6a; // 녹색
                } else if (workflow.priority === 'urgent') {
                    color = 0xef5350; // 빨간색
                } else if (workflow.metadata.progress > 0) {
                    color = 0xffa726; // 주황색
                } else {
                    color = 0x4fc3f7; // 파란색
                }

                // 메인 구체 생성
                const geometry = new THREE.SphereGeometry(2 + (workflow.tasks.length * 0.5), 16, 16);
                const material = new THREE.MeshPhongMaterial({ 
                    color: color,
                    transparent: true,
                    opacity: 0.8,
                    wireframe: isWireframe
                });
                const sphere = new THREE.Mesh(geometry, material);
                sphere.castShadow = true;
                sphere.receiveShadow = true;
                group.add(sphere);

                // 진행률 링 생성
                const ringGeometry = new THREE.RingGeometry(3, 4, 16);
                const ringMaterial = new THREE.MeshBasicMaterial({ 
                    color: color,
                    transparent: true,
                    opacity: 0.3,
                    side: THREE.DoubleSide
                });
                const ring = new THREE.Mesh(ringGeometry, ringMaterial);
                ring.rotation.x = Math.PI / 2;
                group.add(ring);

                // 작업을 작은 구체로 표시
                workflow.tasks.forEach((task, taskIndex) => {
                    const taskGeometry = new THREE.SphereGeometry(0.3, 8, 8);
                    const taskMaterial = new THREE.MeshPhongMaterial({ 
                        color: task.status === 'completed' ? 0x66bb6a : 0x4fc3f7,
                        transparent: true,
                        opacity: 0.7
                    });
                    const taskSphere = new THREE.Mesh(taskGeometry, taskMaterial);
                    
                    const taskAngle = (taskIndex / workflow.tasks.length) * Math.PI * 2;
                    const taskRadius = 4;
                    taskSphere.position.set(
                        Math.cos(taskAngle) * taskRadius,
                        Math.sin(taskAngle) * taskRadius,
                        0
                    );
                    group.add(taskSphere);
                });

                // 클릭 이벤트
                sphere.userData = { workflow: workflow };
                group.userData = { workflow: workflow };

                // 호버 효과
                sphere.addEventListener = function(event, callback) {
                    if (event === 'click') {
                        sphere.onClick = callback;
                    }
                };

                workflowObjects.push(group);
                scene.add(group);
            });

            // 중앙에 통계 구체 추가
            createCenterSphere();
        }

        // 중앙 통계 구체 생성
        function createCenterSphere() {
            const centerGeometry = new THREE.SphereGeometry(5, 32, 32);
            const centerMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x4fc3f7,
                transparent: true,
                opacity: 0.6,
                wireframe: true
            });
            const centerSphere = new THREE.Mesh(centerGeometry, centerMaterial);
            centerSphere.position.set(0, 0, 0);
            scene.add(centerSphere);

            // 중앙 구체 애니메이션
            centerSphere.userData = { rotationSpeed: 0.01 };
        }

        // 애니메이션 루프
        function animate() {
            animationId = requestAnimationFrame(animate);

            if (isAnimating) {
                // 워크플로우 객체들 회전
                workflowObjects.forEach((group, index) => {
                    group.rotation.y += 0.005;
                    group.rotation.x += 0.002;
                    
                    // 부드러운 떠다니는 효과
                    group.position.y += Math.sin(Date.now() * 0.001 + index) * 0.01;
                });

                // 중앙 구체 회전
                const centerSphere = scene.children.find(child => child.userData.rotationSpeed);
                if (centerSphere) {
                    centerSphere.rotation.y += centerSphere.userData.rotationSpeed;
                }
            }

            controls.update();
            renderer.render(scene, camera);
        }

        // 윈도우 리사이즈
        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        // 마우스 클릭 이벤트
        function onMouseClick(event) {
            const mouse = new THREE.Vector2();
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera);

            const intersects = raycaster.intersectObjects(scene.children, true);
            
            if (intersects.length > 0) {
                const clickedObject = intersects[0].object;
                if (clickedObject.userData && clickedObject.userData.workflow) {
                    showWorkflowInfo(clickedObject.userData.workflow);
                }
            }
        }

        // 워크플로우 정보 표시
        function showWorkflowInfo(workflow) {
            const completedTasks = workflow.tasks.filter(task => task.status === 'completed').length;
            const totalTasks = workflow.tasks.length;
            const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

            document.getElementById('workflowTitle').textContent = workflow.title || '제목 없음';
            document.getElementById('workflowDetails').innerHTML = \`
                <div><strong>상태:</strong> \${workflow.status}</div>
                <div><strong>우선순위:</strong> \${workflow.priority}</div>
                <div><strong>카테고리:</strong> \${workflow.category}</div>
                <div><strong>진행률:</strong> \${progress.toFixed(1)}% (\${completedTasks}/\${totalTasks})</div>
                <div><strong>작업 수:</strong> \${totalTasks}개</div>
                <div><strong>생성일:</strong> \${new Date(workflow.createdAt).toLocaleString()}</div>
                <div><strong>설명:</strong> \${workflow.description || '설명 없음'}</div>
            \`;

            document.getElementById('workflowInfo').style.display = 'block';
        }

        // 컨트롤 함수들
        function resetCamera() {
            camera.position.set(0, 50, 100);
            controls.reset();
        }

        function toggleAnimation() {
            isAnimating = !isAnimating;
        }

        function toggleWireframe() {
            isWireframe = !isWireframe;
            workflowObjects.forEach(group => {
                group.children.forEach(child => {
                    if (child.material) {
                        child.material.wireframe = isWireframe;
                    }
                });
            });
        }

        function exportScene() {
            const exporter = new THREE.ObjectExporter();
            const result = exporter.parse(scene);
            const blob = new Blob([result], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'workflow-scene.json';
            a.click();
        }

        // 이벤트 리스너
        window.addEventListener('click', onMouseClick);

        // 초기화 실행
        init();
    </script>
</body>
</html>
        `;
    }

    start() {
        this.app.listen(this.port, () => {
            console.log('🎨 3D 워크플로우 시각화 도구 시작됨!');
            console.log(`🌐 웹 브라우저에서 http://localhost:${this.port} 접속`);
            console.log('=====================================');
            console.log('🎯 3D 기능:');
            console.log('  - Three.js 기반 3D 시각화');
            console.log('  - 인터랙티브 3D 씬');
            console.log('  - 마우스로 회전/줌/팬');
            console.log('  - 워크플로우별 3D 객체');
            console.log('  - 실시간 애니메이션');
            console.log('  - 클릭으로 상세 정보 표시');
            console.log('  - 와이어프레임 모드');
            console.log('  - 씬 내보내기');
            console.log('=====================================');
        });
    }
}

// 서버 시작
if (require.main === module) {
    const visualizer = new Workflow3DVisualizer();
    visualizer.start();
}

module.exports = Workflow3DVisualizer;

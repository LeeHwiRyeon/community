const fs = require('fs');
const path = require('path');

/**
 * 오너 요청 모니터링 시스템
 * 
 * 기능:
 * 1. 실시간 큐 상태 모니터링
 * 2. 요청 처리 현황 표시
 * 3. 파일 변경 감시
 * 4. 통계 정보 제공
 */
class OwnerRequestMonitor {
    constructor() {
        this.todoFile = 'work-results/owner-todos.md';
        this.taskFile = 'work-results/owner-tasks.json';
        this.documentFile = 'work-results/owner-requests.md';
        this.isMonitoring = false;
    }

    /**
     * 모니터링 시작
     */
    start() {
        console.log('🔍 오너 요청 모니터링 시작...');
        console.log('=============================');

        this.isMonitoring = true;

        // 초기 상태 표시
        this.showStatus();

        // 5초마다 상태 업데이트
        this.monitorInterval = setInterval(() => {
            if (this.isMonitoring) {
                this.showStatus();
            }
        }, 5000);

        // 파일 변경 감시
        this.watchFiles();

        console.log('\n💡 모니터링 중... (Ctrl+C로 종료)');
    }

    /**
     * 모니터링 중지
     */
    stop() {
        this.isMonitoring = false;
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
        }
        console.log('\n🛑 모니터링 중지됨');
    }

    /**
     * 상태 표시
     */
    showStatus() {
        console.clear();
        console.log('🔍 오너 요청 모니터링 시스템');
        console.log('=============================');
        console.log(`⏰ ${new Date().toLocaleString('ko-KR')}`);
        console.log('');

        // 큐 상태
        this.showQueueStatus();

        // 최근 요청들
        this.showRecentRequests();

        // 통계
        this.showStatistics();

        console.log('\n💡 모니터링 중... (Ctrl+C로 종료)');
    }

    /**
     * 큐 상태 표시
     */
    showQueueStatus() {
        console.log('📋 큐 상태');
        console.log('----------');

        try {
            if (fs.existsSync(this.taskFile)) {
                const taskData = JSON.parse(fs.readFileSync(this.taskFile, 'utf8'));
                const tasks = taskData.tasks || [];

                const statusCounts = {
                    pending: tasks.filter(t => t.status === 'pending').length,
                    in_progress: tasks.filter(t => t.status === 'in_progress').length,
                    completed: tasks.filter(t => t.status === 'completed').length,
                    failed: tasks.filter(t => t.status === 'failed').length
                };

                console.log(`📥 대기 중: ${statusCounts.pending}개`);
                console.log(`🔄 진행 중: ${statusCounts.in_progress}개`);
                console.log(`✅ 완료: ${statusCounts.completed}개`);
                console.log(`❌ 실패: ${statusCounts.failed}개`);
                console.log(`📊 총 요청: ${tasks.length}개`);
            } else {
                console.log('📥 대기 중: 0개');
                console.log('🔄 진행 중: 0개');
                console.log('✅ 완료: 0개');
                console.log('❌ 실패: 0개');
                console.log('📊 총 요청: 0개');
            }
        } catch (error) {
            console.log('❌ 상태를 불러올 수 없습니다.');
        }

        console.log('');
    }

    /**
     * 최근 요청들 표시
     */
    showRecentRequests() {
        console.log('📝 최근 요청들');
        console.log('--------------');

        try {
            if (fs.existsSync(this.taskFile)) {
                const taskData = JSON.parse(fs.readFileSync(this.taskFile, 'utf8'));
                const tasks = taskData.tasks || [];

                // 최근 5개 요청만 표시
                const recentTasks = tasks.slice(-5).reverse();

                if (recentTasks.length === 0) {
                    console.log('요청이 없습니다.');
                } else {
                    recentTasks.forEach((task, index) => {
                        const statusIcon = this.getStatusIcon(task.status);
                        const time = new Date(task.createdAt).toLocaleString('ko-KR');
                        console.log(`${index + 1}. ${statusIcon} ${task.title}`);
                        console.log(`   ID: ${task.id} | ${time}`);
                        console.log(`   우선순위: ${task.priority} | 카테고리: ${task.category}`);
                        console.log('');
                    });
                }
            } else {
                console.log('요청이 없습니다.');
            }
        } catch (error) {
            console.log('❌ 최근 요청을 불러올 수 없습니다.');
        }

        console.log('');
    }

    /**
     * 통계 표시
     */
    showStatistics() {
        console.log('📊 통계');
        console.log('-------');

        try {
            if (fs.existsSync(this.taskFile)) {
                const taskData = JSON.parse(fs.readFileSync(this.taskFile, 'utf8'));
                const tasks = taskData.tasks || [];

                // 카테고리별 통계
                const categoryStats = {};
                tasks.forEach(task => {
                    categoryStats[task.category] = (categoryStats[task.category] || 0) + 1;
                });

                console.log('📂 카테고리별:');
                Object.entries(categoryStats).forEach(([category, count]) => {
                    console.log(`   ${category}: ${count}개`);
                });

                // 우선순위별 통계
                const priorityStats = {};
                tasks.forEach(task => {
                    priorityStats[task.priority] = (priorityStats[task.priority] || 0) + 1;
                });

                console.log('\n⚡ 우선순위별:');
                Object.entries(priorityStats).forEach(([priority, count]) => {
                    console.log(`   ${priority}: ${count}개`);
                });

                // 처리 시간 통계
                const completedTasks = tasks.filter(t => t.status === 'completed');
                if (completedTasks.length > 0) {
                    const avgTime = completedTasks.reduce((sum, task) => {
                        const created = new Date(task.createdAt);
                        const completed = new Date(task.completedAt || task.createdAt);
                        return sum + (completed - created);
                    }, 0) / completedTasks.length;

                    console.log(`\n⏱️  평균 처리 시간: ${Math.round(avgTime / 1000 / 60)}분`);
                }
            } else {
                console.log('통계 데이터가 없습니다.');
            }
        } catch (error) {
            console.log('❌ 통계를 불러올 수 없습니다.');
        }
    }

    /**
     * 상태 아이콘 반환
     */
    getStatusIcon(status) {
        const icons = {
            'pending': '⏳',
            'in_progress': '🔄',
            'completed': '✅',
            'failed': '❌'
        };
        return icons[status] || '❓';
    }

    /**
     * 파일 변경 감시
     */
    watchFiles() {
        const filesToWatch = [this.todoFile, this.taskFile, this.documentFile];

        filesToWatch.forEach(file => {
            if (fs.existsSync(file)) {
                fs.watchFile(file, (curr, prev) => {
                    if (this.isMonitoring) {
                        console.log(`\n📁 파일 변경 감지: ${path.basename(file)}`);
                        setTimeout(() => this.showStatus(), 1000);
                    }
                });
            }
        });
    }
}

// CLI 실행
if (require.main === module) {
    const monitor = new OwnerRequestMonitor();

    // Graceful shutdown
    process.on('SIGINT', () => {
        monitor.stop();
        process.exit(0);
    });

    monitor.start();
}

module.exports = OwnerRequestMonitor;

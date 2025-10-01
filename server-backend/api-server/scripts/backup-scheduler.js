const cron = require('node-cron');
const DatabaseBackup = require('./backup-database');
const { logger } = require('../utils/logger');

class BackupScheduler {
    constructor() {
        this.backup = new DatabaseBackup();
        this.isRunning = false;
        this.scheduledJobs = new Map();
    }

    // 백업 스케줄 시작
    startScheduler() {
        if (this.isRunning) {
            logger.warn('백업 스케줄러가 이미 실행 중입니다.');
            return;
        }

        this.isRunning = true;
        logger.info('🕐 백업 스케줄러 시작');

        // 매일 새벽 2시에 전체 백업
        this.scheduleBackup('daily', '0 2 * * *', '일일 백업');

        // 매 6시간마다 증분 백업 (새벽 2시 제외)
        this.scheduleBackup('incremental', '0 8,14,20 * * *', '증분 백업');

        // 매주 일요일 새벽 3시에 주간 백업
        this.scheduleBackup('weekly', '0 3 * * 0', '주간 백업');

        // 매월 1일 새벽 4시에 월간 백업
        this.scheduleBackup('monthly', '0 4 1 * *', '월간 백업');

        logger.info('✅ 모든 백업 스케줄이 설정되었습니다.');
    }

    // 백업 스케줄 등록
    scheduleBackup(type, cronExpression, description) {
        try {
            const job = cron.schedule(cronExpression, async () => {
                await this.executeBackup(type, description);
            }, {
                scheduled: true,
                timezone: 'Asia/Seoul'
            });

            this.scheduledJobs.set(type, job);
            logger.info(`📅 ${description} 스케줄 등록: ${cronExpression}`);

        } catch (error) {
            logger.error(`백업 스케줄 등록 실패 (${type}):`, error);
        }
    }

    // 백업 실행
    async executeBackup(type, description) {
        try {
            logger.info(`🔄 ${description} 시작`);

            const result = await this.backup.backupDatabase();

            logger.info(`✅ ${description} 완료:`, {
                type: type,
                backupPath: result.backupPath,
                fileSize: result.fileSize + ' MB',
                timestamp: result.timestamp
            });

            // 백업 성공 알림 (실제 환경에서는 이메일, 슬랙 등으로 전송)
            await this.sendBackupNotification(type, result, true);

        } catch (error) {
            logger.error(`❌ ${description} 실패:`, error);

            // 백업 실패 알림
            await this.sendBackupNotification(type, null, false, error.message);
        }
    }

    // 백업 알림 전송
    async sendBackupNotification(type, result, success, errorMessage = null) {
        try {
            const notification = {
                type: 'backup',
                backupType: type,
                success: success,
                timestamp: new Date().toISOString(),
                message: success
                    ? `${type} 백업이 성공적으로 완료되었습니다.`
                    : `${type} 백업이 실패했습니다: ${errorMessage}`,
                details: result
            };

            // 로그 파일에 기록
            logger.info('📧 백업 알림:', notification);

            // 실제 환경에서는 여기서 이메일, 슬랙, 웹훅 등으로 알림 전송
            // await this.sendEmail(notification);
            // await this.sendSlack(notification);
            // await this.sendWebhook(notification);

        } catch (error) {
            logger.error('백업 알림 전송 실패:', error);
        }
    }

    // 특정 백업 스케줄 중지
    stopSchedule(type) {
        const job = this.scheduledJobs.get(type);
        if (job) {
            job.stop();
            this.scheduledJobs.delete(type);
            logger.info(`⏹️ ${type} 백업 스케줄 중지`);
        }
    }

    // 모든 백업 스케줄 중지
    stopAllSchedules() {
        this.scheduledJobs.forEach((job, type) => {
            job.stop();
            logger.info(`⏹️ ${type} 백업 스케줄 중지`);
        });

        this.scheduledJobs.clear();
        this.isRunning = false;
        logger.info('🛑 모든 백업 스케줄이 중지되었습니다.');
    }

    // 백업 상태 확인
    getScheduleStatus() {
        const status = {
            isRunning: this.isRunning,
            activeSchedules: Array.from(this.scheduledJobs.keys()),
            totalSchedules: this.scheduledJobs.size,
            backupStatus: this.backup.getBackupStatus()
        };

        return status;
    }

    // 수동 백업 실행
    async runManualBackup(type = 'manual') {
        try {
            logger.info(`🔄 수동 백업 실행: ${type}`);
            await this.executeBackup(type, '수동 백업');
        } catch (error) {
            logger.error('수동 백업 실행 실패:', error);
            throw error;
        }
    }
}

// CLI 실행
if (require.main === module) {
    const scheduler = new BackupScheduler();

    const command = process.argv[2];

    switch (command) {
        case 'start':
            scheduler.startScheduler();
            // 프로세스 유지
            process.on('SIGINT', () => {
                logger.info('🛑 백업 스케줄러 종료 중...');
                scheduler.stopAllSchedules();
                process.exit(0);
            });
            break;

        case 'stop':
            scheduler.stopAllSchedules();
            process.exit(0);
            break;

        case 'status':
            const status = scheduler.getScheduleStatus();
            console.log('📊 백업 스케줄러 상태:', JSON.stringify(status, null, 2));
            break;

        case 'backup':
            scheduler.runManualBackup()
                .then(() => {
                    console.log('✅ 수동 백업 완료');
                    process.exit(0);
                })
                .catch(error => {
                    console.error('❌ 수동 백업 실패:', error);
                    process.exit(1);
                });
            break;

        default:
            console.log(`
🕐 백업 스케줄러

사용법:
  node backup-scheduler.js start    - 백업 스케줄러 시작
  node backup-scheduler.js stop     - 백업 스케줄러 중지
  node backup-scheduler.js status   - 스케줄러 상태 확인
  node backup-scheduler.js backup   - 수동 백업 실행

스케줄:
  - 일일 백업: 매일 새벽 2시
  - 증분 백업: 매 6시간 (8시, 14시, 20시)
  - 주간 백업: 매주 일요일 새벽 3시
  - 월간 백업: 매월 1일 새벽 4시
            `);
    }
}

module.exports = BackupScheduler;

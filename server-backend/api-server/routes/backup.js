const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const DatabaseBackup = require('../scripts/backup-database');
const BackupScheduler = require('../scripts/backup-scheduler');

const router = express.Router();

// 전역 백업 인스턴스
let backupInstance = null;
let schedulerInstance = null;

// 백업 인스턴스 초기화
const getBackupInstance = () => {
    if (!backupInstance) {
        backupInstance = new DatabaseBackup();
    }
    return backupInstance;
};

const getSchedulerInstance = () => {
    if (!schedulerInstance) {
        schedulerInstance = new BackupScheduler();
    }
    return schedulerInstance;
};

// 백업 상태 확인
router.get('/status', asyncHandler(async (req, res) => {
    try {
        const backup = getBackupInstance();
        const scheduler = getSchedulerInstance();

        const backupStatus = backup.getBackupStatus();
        const scheduleStatus = scheduler.getScheduleStatus();

        res.json({
            success: true,
            data: {
                backup: backupStatus,
                scheduler: scheduleStatus,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('백업 상태 확인 실패:', error);
        res.status(500).json({
            success: false,
            error: '백업 상태를 확인할 수 없습니다.'
        });
    }
}));

// 수동 백업 실행
router.post('/backup', asyncHandler(async (req, res) => {
    try {
        const backup = getBackupInstance();

        logger.info('수동 백업 요청');
        const result = await backup.backupDatabase();

        res.json({
            success: true,
            message: '백업이 성공적으로 완료되었습니다.',
            data: result
        });

    } catch (error) {
        logger.error('수동 백업 실행 실패:', error);
        res.status(500).json({
            success: false,
            error: '백업 실행에 실패했습니다.',
            details: error.message
        });
    }
}));

// 백업 스케줄러 시작
router.post('/scheduler/start', asyncHandler(async (req, res) => {
    try {
        const scheduler = getSchedulerInstance();
        scheduler.startScheduler();

        res.json({
            success: true,
            message: '백업 스케줄러가 시작되었습니다.'
        });

    } catch (error) {
        logger.error('백업 스케줄러 시작 실패:', error);
        res.status(500).json({
            success: false,
            error: '백업 스케줄러 시작에 실패했습니다.'
        });
    }
}));

// 백업 스케줄러 중지
router.post('/scheduler/stop', asyncHandler(async (req, res) => {
    try {
        const scheduler = getSchedulerInstance();
        scheduler.stopAllSchedules();

        res.json({
            success: true,
            message: '백업 스케줄러가 중지되었습니다.'
        });

    } catch (error) {
        logger.error('백업 스케줄러 중지 실패:', error);
        res.status(500).json({
            success: false,
            error: '백업 스케줄러 중지에 실패했습니다.'
        });
    }
}));

// 백업 파일 목록 조회
router.get('/files', asyncHandler(async (req, res) => {
    try {
        const backup = getBackupInstance();
        const status = backup.getBackupStatus();

        res.json({
            success: true,
            data: {
                totalBackups: status.totalBackups,
                totalSize: status.totalSize,
                latestBackup: status.latestBackup,
                backups: status.backups
            }
        });

    } catch (error) {
        logger.error('백업 파일 목록 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '백업 파일 목록을 조회할 수 없습니다.'
        });
    }
}));

// 백업 복원
router.post('/restore', asyncHandler(async (req, res) => {
    try {
        const { backupFileName } = req.body;

        if (!backupFileName) {
            return res.status(400).json({
                success: false,
                error: '복원할 백업 파일명이 필요합니다.'
            });
        }

        const backup = getBackupInstance();
        const result = await backup.restoreDatabase(backupFileName);

        res.json({
            success: true,
            message: '데이터베이스가 성공적으로 복원되었습니다.',
            data: result
        });

    } catch (error) {
        logger.error('백업 복원 실패:', error);
        res.status(500).json({
            success: false,
            error: '백업 복원에 실패했습니다.',
            details: error.message
        });
    }
}));

// 백업 파일 다운로드
router.get('/download/:filename', asyncHandler(async (req, res) => {
    try {
        const { filename } = req.params;
        const fs = require('fs');
        const path = require('path');

        const backupDir = process.env.BACKUP_PATH || 'D:/database/thenewspaper/Backups';
        const filePath = path.join(backupDir, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                error: '백업 파일을 찾을 수 없습니다.'
            });
        }

        res.download(filePath, filename, (err) => {
            if (err) {
                logger.error('백업 파일 다운로드 실패:', err);
                res.status(500).json({
                    success: false,
                    error: '파일 다운로드에 실패했습니다.'
                });
            }
        });

    } catch (error) {
        logger.error('백업 파일 다운로드 실패:', error);
        res.status(500).json({
            success: false,
            error: '파일 다운로드에 실패했습니다.'
        });
    }
}));

// 백업 파일 삭제
router.delete('/files/:filename', asyncHandler(async (req, res) => {
    try {
        const { filename } = req.params;
        const fs = require('fs');
        const path = require('path');

        const backupDir = process.env.BACKUP_PATH || 'D:/database/thenewspaper/Backups';
        const filePath = path.join(backupDir, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                error: '백업 파일을 찾을 수 없습니다.'
            });
        }

        fs.unlinkSync(filePath);

        res.json({
            success: true,
            message: '백업 파일이 삭제되었습니다.'
        });

    } catch (error) {
        logger.error('백업 파일 삭제 실패:', error);
        res.status(500).json({
            success: false,
            error: '파일 삭제에 실패했습니다.'
        });
    }
}));

module.exports = router;

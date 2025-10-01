const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const { logger } = require('../utils/logger');

const execAsync = promisify(exec);

// 백업 설정
const BACKUP_CONFIG = {
    sourceDb: process.env.DB_PATH || 'D:/database/thenewspaper/thenewspaperdata.db',
    backupDir: process.env.BACKUP_PATH || 'D:/database/thenewspaper/Backups',
    maxBackups: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
    compressionEnabled: process.env.BACKUP_COMPRESSION === 'true' || true
};

class DatabaseBackup {
    constructor() {
        this.ensureBackupDirectory();
    }

    // 백업 디렉토리 확인 및 생성
    ensureBackupDirectory() {
        if (!fs.existsSync(BACKUP_CONFIG.backupDir)) {
            fs.mkdirSync(BACKUP_CONFIG.backupDir, { recursive: true });
            logger.info(`백업 디렉토리 생성: ${BACKUP_CONFIG.backupDir}`);
        }
    }

    // 현재 시간 기반 백업 파일명 생성
    generateBackupFileName() {
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' +
            now.toTimeString().split(' ')[0].replace(/:/g, '-');
        return `backup_${timestamp}.db`;
    }

    // SQLite 데이터베이스 백업
    async backupDatabase() {
        try {
            const backupFileName = this.generateBackupFileName();
            const backupPath = path.join(BACKUP_CONFIG.backupDir, backupFileName);

            logger.info(`데이터베이스 백업 시작: ${BACKUP_CONFIG.sourceDb}`);

            // SQLite 백업 명령어 실행
            const backupCommand = `sqlite3 "${BACKUP_CONFIG.sourceDb}" ".backup '${backupPath}'"`;
            await execAsync(backupCommand);

            // 백업 파일 크기 확인
            const stats = fs.statSync(backupPath);
            const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

            logger.info(`백업 완료: ${backupPath} (${fileSizeMB} MB)`);

            // 압축 처리
            if (BACKUP_CONFIG.compressionEnabled) {
                await this.compressBackup(backupPath);
            }

            // 오래된 백업 파일 정리
            await this.cleanupOldBackups();

            return {
                success: true,
                backupPath: backupPath,
                fileSize: fileSizeMB,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            logger.error('데이터베이스 백업 실패:', error);
            throw error;
        }
    }

    // 백업 파일 압축
    async compressBackup(backupPath) {
        try {
            const compressedPath = backupPath + '.gz';
            const compressCommand = `gzip -c "${backupPath}" > "${compressedPath}"`;

            await execAsync(compressCommand);

            // 원본 파일 삭제
            fs.unlinkSync(backupPath);

            const stats = fs.statSync(compressedPath);
            const compressedSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

            logger.info(`백업 압축 완료: ${compressedPath} (${compressedSizeMB} MB)`);

            return compressedPath;
        } catch (error) {
            logger.warn('백업 압축 실패 (압축 없이 진행):', error.message);
            return backupPath;
        }
    }

    // 오래된 백업 파일 정리
    async cleanupOldBackups() {
        try {
            const files = fs.readdirSync(BACKUP_CONFIG.backupDir);
            const backupFiles = files
                .filter(file => file.startsWith('backup_') && (file.endsWith('.db') || file.endsWith('.db.gz')))
                .map(file => {
                    const filePath = path.join(BACKUP_CONFIG.backupDir, file);
                    const stats = fs.statSync(filePath);
                    return {
                        name: file,
                        path: filePath,
                        mtime: stats.mtime
                    };
                })
                .sort((a, b) => b.mtime - a.mtime);

            // 최대 보존 개수 초과 시 오래된 파일 삭제
            if (backupFiles.length > BACKUP_CONFIG.maxBackups) {
                const filesToDelete = backupFiles.slice(BACKUP_CONFIG.maxBackups);

                for (const file of filesToDelete) {
                    fs.unlinkSync(file.path);
                    logger.info(`오래된 백업 파일 삭제: ${file.name}`);
                }

                logger.info(`${filesToDelete.length}개의 오래된 백업 파일이 삭제되었습니다.`);
            }

        } catch (error) {
            logger.error('백업 파일 정리 실패:', error);
        }
    }

    // 백업 상태 확인
    getBackupStatus() {
        try {
            const files = fs.readdirSync(BACKUP_CONFIG.backupDir);
            const backupFiles = files
                .filter(file => file.startsWith('backup_') && (file.endsWith('.db') || file.endsWith('.db.gz')))
                .map(file => {
                    const filePath = path.join(BACKUP_CONFIG.backupDir, file);
                    const stats = fs.statSync(filePath);
                    return {
                        name: file,
                        size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
                        created: stats.mtime,
                        isCompressed: file.endsWith('.gz')
                    };
                })
                .sort((a, b) => b.created - a.created);

            const totalSize = backupFiles.reduce((sum, file) => {
                return sum + parseFloat(file.size);
            }, 0);

            return {
                totalBackups: backupFiles.length,
                totalSize: totalSize.toFixed(2) + ' MB',
                latestBackup: backupFiles[0] || null,
                backups: backupFiles
            };
        } catch (error) {
            logger.error('백업 상태 확인 실패:', error);
            return null;
        }
    }

    // 백업 복원
    async restoreDatabase(backupFileName) {
        try {
            const backupPath = path.join(BACKUP_CONFIG.backupDir, backupFileName);

            if (!fs.existsSync(backupPath)) {
                throw new Error(`백업 파일을 찾을 수 없습니다: ${backupFileName}`);
            }

            logger.info(`데이터베이스 복원 시작: ${backupFileName}`);

            // 현재 데이터베이스 백업 (안전장치)
            const safetyBackup = await this.backupDatabase();
            logger.info(`안전 백업 생성: ${safetyBackup.backupPath}`);

            // 복원 명령어 실행
            const restoreCommand = `sqlite3 "${BACKUP_CONFIG.sourceDb}" ".restore '${backupPath}'"`;
            await execAsync(restoreCommand);

            logger.info(`데이터베이스 복원 완료: ${backupFileName}`);

            return {
                success: true,
                restoredFrom: backupPath,
                safetyBackup: safetyBackup.backupPath,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            logger.error('데이터베이스 복원 실패:', error);
            throw error;
        }
    }
}

// CLI 실행
if (require.main === module) {
    const backup = new DatabaseBackup();

    const command = process.argv[2];

    switch (command) {
        case 'backup':
            backup.backupDatabase()
                .then(result => {
                    console.log('✅ 백업 완료:', result);
                    process.exit(0);
                })
                .catch(error => {
                    console.error('❌ 백업 실패:', error);
                    process.exit(1);
                });
            break;

        case 'status':
            const status = backup.getBackupStatus();
            console.log('📊 백업 상태:', JSON.stringify(status, null, 2));
            break;

        case 'restore':
            const backupFile = process.argv[3];
            if (!backupFile) {
                console.error('❌ 복원할 백업 파일명을 지정해주세요.');
                process.exit(1);
            }
            backup.restoreDatabase(backupFile)
                .then(result => {
                    console.log('✅ 복원 완료:', result);
                    process.exit(0);
                })
                .catch(error => {
                    console.error('❌ 복원 실패:', error);
                    process.exit(1);
                });
            break;

        default:
            console.log(`
🗄️ 데이터베이스 백업 도구

사용법:
  node backup-database.js backup     - 데이터베이스 백업
  node backup-database.js status     - 백업 상태 확인
  node backup-database.js restore <파일명> - 백업 복원

설정:
  소스 DB: ${BACKUP_CONFIG.sourceDb}
  백업 디렉토리: ${BACKUP_CONFIG.backupDir}
  최대 보존: ${BACKUP_CONFIG.maxBackups}개
  압축: ${BACKUP_CONFIG.compressionEnabled ? '활성화' : '비활성화'}
            `);
    }
}

module.exports = DatabaseBackup;

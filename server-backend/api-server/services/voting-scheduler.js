const cron = require('node-cron');
const VotingPoll = require('../models/VotingPoll');
const { logger } = require('../utils/logger');

class VotingScheduler {
    constructor() {
        this.jobs = new Map();
        this.isRunning = false;
    }

    // 스케줄러 시작
    start() {
        if (this.isRunning) {
            console.log('Voting scheduler is already running');
            return;
        }

        this.isRunning = true;
        console.log('🕐 Voting scheduler started');

        // 매분마다 투표 상태 확인 및 업데이트
        this.scheduleStatusCheck();

        // 매 시간마다 만료된 투표 정리
        this.scheduleCleanup();
    }

    // 스케줄러 중지
    stop() {
        this.isRunning = false;

        // 모든 작업 중지
        this.jobs.forEach((job, key) => {
            job.destroy();
            console.log(`Stopped voting job: ${key}`);
        });

        this.jobs.clear();
        console.log('🛑 Voting scheduler stopped');
    }

    // 투표 상태 확인 스케줄
    scheduleStatusCheck() {
        const job = cron.schedule('* * * * *', async () => {
            try {
                await this.checkAndUpdateVotingStatus();
            } catch (error) {
                console.error('Error in voting status check:', error);
            }
        }, {
            scheduled: false
        });

        this.jobs.set('statusCheck', job);
        job.start();
        console.log('📅 Voting status check scheduled: every minute');
    }

    // 정리 작업 스케줄
    scheduleCleanup() {
        const job = cron.schedule('0 * * * *', async () => {
            try {
                await this.cleanupExpiredVotes();
            } catch (error) {
                console.error('Error in voting cleanup:', error);
            }
        }, {
            scheduled: false
        });

        this.jobs.set('cleanup', job);
        job.start();
        console.log('📅 Voting cleanup scheduled: every hour');
    }

    // 투표 상태 확인 및 업데이트
    async checkAndUpdateVotingStatus() {
        const now = new Date();

        try {
            // 시작해야 할 투표들 찾기
            const pollsToStart = await VotingPoll.findAll({
                where: {
                    status: 'draft',
                    startDate: {
                        [require('sequelize').Op.lte]: now
                    }
                }
            });

            // 시작할 투표들을 활성화
            for (const poll of pollsToStart) {
                await poll.update({ status: 'active' });
                console.log(`✅ Poll started: ${poll.title} (${poll.id})`);

                // 투표 시작 알림 (추후 구현)
                this.notifyPollStarted(poll);
            }

            // 종료해야 할 투표들 찾기
            const pollsToEnd = await VotingPoll.findAll({
                where: {
                    status: 'active',
                    endDate: {
                        [require('sequelize').Op.lte]: now
                    }
                }
            });

            // 종료할 투표들을 마감
            for (const poll of pollsToEnd) {
                await poll.update({ status: 'ended' });
                console.log(`🏁 Poll ended: ${poll.title} (${poll.id})`);

                // 투표 종료 알림 (추후 구현)
                this.notifyPollEnded(poll);
            }

            // 예약된 투표들 확인
            const scheduledPolls = await VotingPoll.findAll({
                where: {
                    status: 'draft',
                    startDate: {
                        [require('sequelize').Op.gt]: now
                    }
                }
            });

            if (scheduledPolls.length > 0) {
                console.log(`📋 ${scheduledPolls.length} scheduled polls pending`);
            }

        } catch (error) {
            console.error('Error checking voting status:', error);
        }
    }

    // 만료된 투표 정리
    async cleanupExpiredVotes() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        try {
            // 30일 이상 된 종료된 투표들을 소프트 삭제
            const expiredPolls = await VotingPoll.findAll({
                where: {
                    status: 'ended',
                    updatedAt: {
                        [require('sequelize').Op.lt]: thirtyDaysAgo
                    }
                }
            });

            for (const poll of expiredPolls) {
                await poll.update({ deleted: true });
                console.log(`🗑️ Archived expired poll: ${poll.title} (${poll.id})`);
            }

            if (expiredPolls.length > 0) {
                console.log(`🧹 Cleaned up ${expiredPolls.length} expired polls`);
            }

        } catch (error) {
            console.error('Error cleaning up expired votes:', error);
        }
    }

    // 특정 투표에 대한 스케줄 작업 생성
    schedulePoll(pollId, startDate, endDate) {
        const jobKey = `poll_${pollId}`;

        // 기존 작업이 있다면 제거
        if (this.jobs.has(jobKey)) {
            this.jobs.get(jobKey).destroy();
        }

        const startJob = cron.schedule(this.getCronExpression(startDate), async () => {
            try {
                const poll = await VotingPoll.findByPk(pollId);
                if (poll && poll.status === 'draft') {
                    await poll.update({ status: 'active' });
                    console.log(`✅ Scheduled poll started: ${poll.title}`);
                    this.notifyPollStarted(poll);
                }
            } catch (error) {
                console.error(`Error starting scheduled poll ${pollId}:`, error);
            }
        }, {
            scheduled: false
        });

        const endJob = cron.schedule(this.getCronExpression(endDate), async () => {
            try {
                const poll = await VotingPoll.findByPk(pollId);
                if (poll && poll.status === 'active') {
                    await poll.update({ status: 'ended' });
                    console.log(`🏁 Scheduled poll ended: ${poll.title}`);
                    this.notifyPollEnded(poll);
                }
            } catch (error) {
                console.error(`Error ending scheduled poll ${pollId}:`, error);
            }
        }, {
            scheduled: false
        });

        this.jobs.set(`${jobKey}_start`, startJob);
        this.jobs.set(`${jobKey}_end`, endJob);

        startJob.start();
        endJob.start();

        console.log(`📅 Scheduled poll: ${pollId} (${startDate} - ${endDate})`);
    }

    // 특정 투표 스케줄 제거
    unschedulePoll(pollId) {
        const startKey = `poll_${pollId}_start`;
        const endKey = `poll_${pollId}_end`;

        if (this.jobs.has(startKey)) {
            this.jobs.get(startKey).destroy();
            this.jobs.delete(startKey);
        }

        if (this.jobs.has(endKey)) {
            this.jobs.get(endKey).destroy();
            this.jobs.delete(endKey);
        }

        console.log(`🗑️ Unscheduled poll: ${pollId}`);
    }

    // 날짜를 cron 표현식으로 변환
    getCronExpression(date) {
        const d = new Date(date);
        const minute = d.getMinutes();
        const hour = d.getHours();
        const day = d.getDate();
        const month = d.getMonth() + 1;
        const year = d.getFullYear();

        return `${minute} ${hour} ${day} ${month} *`;
    }

    // 투표 시작 알림
    notifyPollStarted(poll) {
        // TODO: 실제 알림 구현 (이메일, 푸시, 웹소켓 등)
        console.log(`🔔 Poll started notification: ${poll.title}`);
    }

    // 투표 종료 알림
    notifyPollEnded(poll) {
        // TODO: 실제 알림 구현 (이메일, 푸시, 웹소켓 등)
        console.log(`🔔 Poll ended notification: ${poll.title}`);
    }

    // 투표 상태 통계
    async getVotingStats() {
        try {
            const stats = await VotingPoll.findAll({
                attributes: [
                    'status',
                    [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
                ],
                where: { deleted: false },
                group: ['status']
            });

            return stats.reduce((acc, stat) => {
                acc[stat.status] = parseInt(stat.dataValues.count);
                return acc;
            }, {});
        } catch (error) {
            console.error('Error getting voting stats:', error);
            return {};
        }
    }

    // 예약된 투표 목록
    async getScheduledPolls() {
        try {
            const now = new Date();
            return await VotingPoll.findAll({
                where: {
                    status: 'draft',
                    startDate: {
                        [require('sequelize').Op.gt]: now
                    }
                },
                order: [['startDate', 'ASC']]
            });
        } catch (error) {
            console.error('Error getting scheduled polls:', error);
            return [];
        }
    }
}

// 싱글톤 인스턴스
const votingScheduler = new VotingScheduler();

module.exports = votingScheduler;

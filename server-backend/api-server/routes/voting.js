const express = require('express');
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { logger } = require('../utils/logger');
const VotingScheduler = require('../services/voting-scheduler');

const router = express.Router();

// VotingPoll 모델 정의
const VotingPoll = sequelize.define('VotingPoll', {
    id: {
        type: DataTypes.STRING(64),
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    type: {
        type: DataTypes.ENUM('single', 'multiple', 'rating', 'ranking'),
        allowNull: false,
        defaultValue: 'single'
    },
    status: {
        type: DataTypes.ENUM('draft', 'active', 'ended', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft'
    },
    allowAnonymous: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    allowMultipleVotes: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    maxSelections: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    maxVotesPerIP: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    totalVotes: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    postId: {
        type: DataTypes.STRING(64),
        allowNull: true
    },
    deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'voting_polls',
    timestamps: true
});

// VotingOption 모델 정의
const VotingOption = sequelize.define('VotingOption', {
    id: {
        type: DataTypes.STRING(64),
        primaryKey: true
    },
    pollId: {
        type: DataTypes.STRING(64),
        allowNull: false
    },
    text: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    imageUrl: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    voteCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'voting_options',
    timestamps: true
});

// VotingRecord 모델 정의 (투표 기록)
const VotingRecord = sequelize.define('VotingRecord', {
    id: {
        type: DataTypes.STRING(64),
        primaryKey: true
    },
    pollId: {
        type: DataTypes.STRING(64),
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true // 익명 투표의 경우 null
    },
    optionIds: {
        type: DataTypes.JSON, // 선택한 옵션 ID들의 배열
        allowNull: false
    },
    isAnonymous: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true
    }
}, {
    tableName: 'voting_records',
    timestamps: true
});

// 관계 설정
VotingPoll.hasMany(VotingOption, { foreignKey: 'pollId', as: 'options' });
VotingOption.belongsTo(VotingPoll, { foreignKey: 'pollId', as: 'poll' });
VotingPoll.hasMany(VotingRecord, { foreignKey: 'pollId', as: 'records' });
VotingRecord.belongsTo(VotingPoll, { foreignKey: 'pollId', as: 'poll' });

// 모든 투표 조회
router.get('/', async (req, res) => {
    try {
        const { status, type, postId, page = 1, limit = 10 } = req.query;

        const whereClause = { deleted: false };
        if (status) whereClause.status = status;
        if (type) whereClause.type = type;
        if (postId) whereClause.postId = postId;

        const polls = await VotingPoll.findAndCountAll({
            where: whereClause,
            include: [{
                model: VotingOption,
                as: 'options',
                order: [['order', 'ASC']]
            }],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        });

        res.json({
            success: true,
            data: {
                polls: polls.rows,
                total: polls.count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(polls.count / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching polls:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch polls',
            error: error.message
        });
    }
});

// 특정 투표 조회
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const poll = await VotingPoll.findOne({
            where: { id, deleted: false },
            include: [{
                model: VotingOption,
                as: 'options',
                order: [['order', 'ASC']]
            }]
        });

        if (!poll) {
            return res.status(404).json({
                success: false,
                message: 'Poll not found'
            });
        }

        res.json({
            success: true,
            data: poll
        });
    } catch (error) {
        console.error('Error fetching poll:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch poll',
            error: error.message
        });
    }
});

// 투표 생성
router.post('/', async (req, res) => {
    try {
        const {
            title,
            description,
            type = 'single',
            allowAnonymous = false,
            allowMultipleVotes = false,
            maxSelections,
            startDate,
            endDate,
            options,
            postId,
            createdBy
        } = req.body;

        if (!title || !options || !Array.isArray(options) || options.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Title and at least 2 options are required'
            });
        }

        const pollId = `poll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // 투표 생성
        const poll = await VotingPoll.create({
            id: pollId,
            title,
            description,
            type,
            allowAnonymous,
            allowMultipleVotes,
            maxSelections,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            postId,
            createdBy: createdBy || 1 // 기본값
        });

        // 투표 옵션 생성
        const votingOptions = await Promise.all(
            options.map((option, index) =>
                VotingOption.create({
                    id: `option_${Date.now()}_${index}`,
                    pollId,
                    text: option.text,
                    description: option.description,
                    imageUrl: option.imageUrl,
                    order: index
                })
            )
        );

        poll.options = votingOptions;

        // 스케줄이 있는 경우 스케줄러에 등록
        if (startDate || endDate) {
            VotingScheduler.schedulePoll(pollId, startDate, endDate);
        }

        res.status(201).json({
            success: true,
            data: poll
        });
    } catch (error) {
        console.error('Error creating poll:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create poll',
            error: error.message
        });
    }
});

// 투표하기
router.post('/:id/vote', async (req, res) => {
    try {
        const { id } = req.params;
        const { optionIds, userId, isAnonymous = false } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;

        if (!optionIds || !Array.isArray(optionIds) || optionIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one option must be selected'
            });
        }

        // 투표 존재 확인
        const poll = await VotingPoll.findOne({
            where: { id, deleted: false },
            include: [{
                model: VotingOption,
                as: 'options'
            }]
        });

        if (!poll) {
            return res.status(404).json({
                success: false,
                message: 'Poll not found'
            });
        }

        // 투표 상태 확인
        if (poll.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Poll is not active'
            });
        }

        // 투표 기간 확인
        const now = new Date();
        if (poll.startDate && now < poll.startDate) {
            return res.status(400).json({
                success: false,
                message: 'Poll has not started yet'
            });
        }
        if (poll.endDate && now > poll.endDate) {
            return res.status(400).json({
                success: false,
                message: 'Poll has ended'
            });
        }

        // 옵션 유효성 확인
        const validOptionIds = poll.options.map(option => option.id);
        const invalidOptions = optionIds.filter(id => !validOptionIds.includes(id));
        if (invalidOptions.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid option selected'
            });
        }

        // 다중 선택 제한 확인
        if (poll.type === 'multiple' && poll.maxSelections && optionIds.length > poll.maxSelections) {
            return res.status(400).json({
                success: false,
                message: `Maximum ${poll.maxSelections} options can be selected`
            });
        }

        // 중복 투표 확인
        if (!isAnonymous && userId) {
            // 실명 투표인 경우 사용자 ID로 확인
            const existingVote = await VotingRecord.findOne({
                where: { pollId: id, userId }
            });

            if (existingVote && !poll.allowMultipleVotes) {
                return res.status(400).json({
                    success: false,
                    message: 'You have already voted on this poll'
                });
            }
        } else if (isAnonymous) {
            // 익명 투표인 경우 IP 주소로 확인 (IP 제한이 있는 경우)
            const ipVoteCount = await VotingRecord.count({
                where: {
                    pollId: id,
                    ipAddress,
                    isAnonymous: true
                }
            });

            // IP당 최대 투표 수 제한 (설정에 따라)
            const maxVotesPerIP = poll.maxVotesPerIP || 0;
            if (maxVotesPerIP > 0 && ipVoteCount >= maxVotesPerIP) {
                return res.status(400).json({
                    success: false,
                    message: `Maximum ${maxVotesPerIP} votes per IP address allowed`
                });
            }
        }

        // 투표 기록 생성
        const recordId = `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await VotingRecord.create({
            id: recordId,
            pollId: id,
            userId: isAnonymous ? null : userId,
            optionIds,
            isAnonymous,
            ipAddress
        });

        // 투표 수 업데이트
        await Promise.all(
            optionIds.map(optionId =>
                VotingOption.increment('voteCount', {
                    where: { id: optionId }
                })
            )
        );

        // 총 투표 수 업데이트
        await VotingPoll.increment('totalVotes', {
            where: { id }
        });

        res.json({
            success: true,
            message: 'Vote recorded successfully'
        });
    } catch (error) {
        console.error('Error recording vote:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record vote',
            error: error.message
        });
    }
});

// 투표 결과 조회
router.get('/:id/results', async (req, res) => {
    try {
        const { id } = req.params;
        const { includeAnonymous = false } = req.query;

        const poll = await VotingPoll.findOne({
            where: { id, deleted: false },
            include: [{
                model: VotingOption,
                as: 'options',
                order: [['order', 'ASC']]
            }]
        });

        if (!poll) {
            return res.status(404).json({
                success: false,
                message: 'Poll not found'
            });
        }

        const totalVotes = poll.totalVotes;

        // 익명 투표 통계 계산
        let anonymousStats = null;
        if (poll.allowAnonymous && includeAnonymous === 'true') {
            const anonymousVotes = await VotingRecord.count({
                where: { pollId: id, isAnonymous: true }
            });

            const registeredVotes = await VotingRecord.count({
                where: { pollId: id, isAnonymous: false }
            });

            anonymousStats = {
                anonymousVotes,
                registeredVotes,
                anonymousPercentage: totalVotes > 0 ? ((anonymousVotes / totalVotes) * 100).toFixed(1) : 0,
                registeredPercentage: totalVotes > 0 ? ((registeredVotes / totalVotes) * 100).toFixed(1) : 0
            };
        }

        const results = poll.options.map(option => ({
            ...option.toJSON(),
            percentage: totalVotes > 0 ? ((option.voteCount / totalVotes) * 100).toFixed(1) : 0
        }));

        res.json({
            success: true,
            data: {
                poll: {
                    id: poll.id,
                    title: poll.title,
                    type: poll.type,
                    status: poll.status,
                    allowAnonymous: poll.allowAnonymous,
                    totalVotes
                },
                results,
                anonymousStats
            }
        });
    } catch (error) {
        console.error('Error fetching poll results:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch poll results',
            error: error.message
        });
    }
});

// 투표 수정
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const poll = await VotingPoll.findOne({
            where: { id, deleted: false }
        });

        if (!poll) {
            return res.status(404).json({
                success: false,
                message: 'Poll not found'
            });
        }

        // 투표가 활성화된 경우 일부 필드만 수정 가능
        if (poll.status === 'active') {
            const allowedFields = ['title', 'description'];
            const filteredData = {};
            Object.keys(updateData).forEach(key => {
                if (allowedFields.includes(key)) {
                    filteredData[key] = updateData[key];
                }
            });
            await poll.update(filteredData);
        } else {
            await poll.update(updateData);

            // 스케줄이 변경된 경우 스케줄러 업데이트
            if (updateData.startDate || updateData.endDate) {
                VotingScheduler.unschedulePoll(id);
                if (updateData.startDate || updateData.endDate) {
                    VotingScheduler.schedulePoll(id, updateData.startDate, updateData.endDate);
                }
            }
        }

        res.json({
            success: true,
            data: poll
        });
    } catch (error) {
        console.error('Error updating poll:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update poll',
            error: error.message
        });
    }
});

// 투표 삭제 (소프트 삭제)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const poll = await VotingPoll.findOne({
            where: { id, deleted: false }
        });

        if (!poll) {
            return res.status(404).json({
                success: false,
                message: 'Poll not found'
            });
        }

        await poll.update({ deleted: true });

        res.json({
            success: true,
            message: 'Poll deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting poll:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete poll',
            error: error.message
        });
    }
});

// 스케줄러 통계 조회
router.get('/scheduler/stats', async (req, res) => {
    try {
        const stats = await VotingScheduler.getVotingStats();
        const scheduledPolls = await VotingScheduler.getScheduledPolls();

        res.json({
            success: true,
            data: {
                stats,
                scheduledPolls: scheduledPolls.map(poll => ({
                    id: poll.id,
                    title: poll.title,
                    startDate: poll.startDate,
                    endDate: poll.endDate,
                    status: poll.status
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching scheduler stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch scheduler stats',
            error: error.message
        });
    }
});

// 스케줄러 상태 조회
router.get('/scheduler/status', async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                isRunning: VotingScheduler.isRunning,
                activeJobs: VotingScheduler.jobs.size,
                uptime: process.uptime()
            }
        });
    } catch (error) {
        console.error('Error fetching scheduler status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch scheduler status',
            error: error.message
        });
    }
});

module.exports = router;

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const VotingPoll = sequelize.define('VotingPoll', {
    id: {
        type: DataTypes.STRING(64),
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    type: {
        type: DataTypes.ENUM('single', 'multiple'),
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
        defaultValue: 1
    },
    maxVotesPerIP: {
        type: DataTypes.INTEGER,
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

module.exports = VotingPoll;


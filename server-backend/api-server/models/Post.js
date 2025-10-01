const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Post = sequelize.define('Post', {
    id: {
        type: DataTypes.STRING(64),
        primaryKey: true
    },
    boardId: {
        type: DataTypes.STRING(64),
        allowNull: false,
        field: 'board_id'
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    author: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    authorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'author_id'
    },
    views: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    category: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    thumb: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    mediaType: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'media_type'
    },
    streamUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'stream_url'
    },
    commentsCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'comments_count'
    },
    date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    preview: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'posts',
    timestamps: true,
    indexes: [
        {
            fields: ['boardId']
        },
        {
            fields: ['authorId']
        },
        {
            fields: ['deleted']
        },
        {
            fields: ['createdAt']
        }
    ]
});

module.exports = Post;


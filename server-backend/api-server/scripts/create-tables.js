const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');
const User = require('../models/User');

async function createTables() {
    try {
        console.log('🔄 Creating database tables...');

        // 데이터베이스 연결 확인
        await sequelize.authenticate();
        console.log('✅ Database connection established');

        // User 테이블 생성
        await User.sync({ force: false });
        console.log('✅ Users table created/synced');

        // Board 테이블 생성
        const Board = sequelize.define('Board', {
            id: {
                type: DataTypes.STRING(64),
                primaryKey: true
            },
            title: {
                type: DataTypes.STRING(200),
                allowNull: false
            },
            summary: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            category: {
                type: DataTypes.STRING(50),
                allowNull: true
            },
            order: {
                type: DataTypes.INTEGER,
                defaultValue: 1000
            },
            format: {
                type: DataTypes.STRING(50),
                defaultValue: 'discussion'
            },
            preview_format: {
                type: DataTypes.STRING(50),
                allowNull: true
            },
            deleted: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            }
        }, {
            tableName: 'boards',
            timestamps: true
        });

        await Board.sync({ force: false });
        console.log('✅ Boards table created/synced');

        // Post 테이블 생성
        const Post = sequelize.define('Post', {
            id: {
                type: DataTypes.STRING(64),
                primaryKey: true
            },
            board_id: {
                type: DataTypes.STRING(64),
                allowNull: false
            },
            title: {
                type: DataTypes.STRING(500),
                allowNull: false
            },
            content: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            author: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
            author_id: {
                type: DataTypes.INTEGER,
                allowNull: true
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
                type: DataTypes.STRING(200),
                allowNull: true
            },
            thumb: {
                type: DataTypes.STRING(500),
                allowNull: true
            },
            mediaType: {
                type: DataTypes.STRING(50),
                allowNull: true
            },
            stream_url: {
                type: DataTypes.STRING(500),
                allowNull: true
            },
            comments_count: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },
            date: {
                type: DataTypes.DATEONLY,
                allowNull: true
            },
            preview: {
                type: DataTypes.JSON,
                allowNull: true
            }
        }, {
            tableName: 'posts',
            timestamps: true
        });

        await Post.sync({ force: false });
        console.log('✅ Posts table created/synced');

        // Community 테이블 정의 및 생성
        const Community = sequelize.define('Community', {
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
            rank: {
                type: DataTypes.INTEGER,
                defaultValue: 1000
            },
            totalViews: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },
            deleted: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            }
        }, {
            tableName: 'communities',
            timestamps: true
        });
        await Community.sync({ force: false });
        console.log('✅ Communities table created/synced');

        // 샘플 데이터 생성
        const [sampleUser, created] = await User.findOrCreate({
            where: { username: 'admin' },
            defaults: {
                username: 'admin',
                email: 'admin@thenewspaper.com',
                password: process.env.ADMIN_PASSWORD || 'admin123',
                firstName: 'Admin',
                lastName: 'User',
                role: 'owner',
                status: 'active',
                emailVerified: true
            }
        });
        console.log(created ? '✅ Sample admin user created' : 'ℹ️ Admin user already exists');

        // 샘플 게시판 생성
        const sampleBoards = [
            {
                id: 'news',
                title: '오늘의 뉴스',
                summary: '최신 뉴스와 업데이트를 확인하세요',
                category: 'news',
                order: 1,
                format: 'article',
                preview_format: 'article'
            },
            {
                id: 'free',
                title: '자유게시판',
                summary: '자유롭게 이야기를 나누는 공간입니다',
                category: 'community',
                order: 2,
                format: 'discussion',
                preview_format: 'discussion'
            },
            {
                id: 'image',
                title: '이미지 게시판',
                summary: '이미지와 갤러리를 공유하세요',
                category: 'gallery',
                order: 3,
                format: 'gallery',
                preview_format: 'gallery'
            },
            {
                id: 'qna',
                title: 'Q&A',
                summary: '질문과 답변을 주고받는 공간입니다',
                category: 'qna',
                order: 4,
                format: 'discussion',
                preview_format: 'discussion'
            },
            {
                id: 'game',
                title: '게임 게시판',
                summary: '게임 관련 이야기를 나누세요',
                category: 'game',
                order: 5,
                format: 'discussion',
                preview_format: 'discussion'
            }
        ];

        for (const boardData of sampleBoards) {
            await Board.findOrCreate({
                where: { id: boardData.id },
                defaults: boardData
            });
        }
        console.log('✅ Sample boards created');

        // 샘플 게시물 생성
        const samplePosts = [
            {
                id: 'post_news_1',
                board_id: 'news',
                title: '새로운 업데이트가 출시되었습니다',
                content: '오늘 새로운 업데이트가 출시되었습니다. 많은 새로운 기능들이 추가되었으니 확인해보세요.',
                author: '관리자',
                author_id: 1,
                views: 150,
                category: '업데이트',
                date: new Date().toISOString().split('T')[0]
            },
            {
                id: 'post_free_1',
                board_id: 'free',
                title: '안녕하세요! 첫 게시물입니다',
                content: '안녕하세요! 커뮤니티에 처음 가입했습니다. 잘 부탁드립니다.',
                author: '신규회원',
                author_id: 1,
                views: 25,
                category: '인사',
                date: new Date().toISOString().split('T')[0]
            },
            {
                id: 'post_game_1',
                board_id: 'game',
                title: '게임 추천해주세요',
                content: '재미있는 게임 추천해주세요. 어떤 장르든 상관없습니다.',
                author: '게이머',
                author_id: 1,
                views: 45,
                category: '추천',
                date: new Date().toISOString().split('T')[0]
            }
        ];

        for (const postData of samplePosts) {
            await Post.findOrCreate({
                where: { id: postData.id },
                defaults: postData
            });
        }
        console.log('✅ Sample posts created');

        // 샘플 커뮤니티 생성
        const sampleCommunities = [
            {
                id: 'global-community',
                title: 'Community Hub',
                description: 'Sample data to demonstrate news, community chatter, broadcasts, and cosplay galleries.',
                rank: 1,
                totalViews: 18170
            },
            {
                id: 'news-community',
                title: 'News Community',
                description: 'Latest news and updates from the gaming world.',
                rank: 2,
                totalViews: 12500
            },
            {
                id: 'game-community',
                title: 'Game Community',
                description: 'Discussion about games, strategies, and gaming culture.',
                rank: 3,
                totalViews: 9800
            },
            {
                id: 'broadcast-community',
                title: 'Broadcast Community',
                description: 'Live streams, broadcasts, and content creator discussions.',
                rank: 4,
                totalViews: 7500
            },
            {
                id: 'cosplay-community',
                title: 'Cosplay Community',
                description: 'Cosplay galleries, tutorials, and community showcases.',
                rank: 5,
                totalViews: 6200
            }
        ];

        for (const communityData of sampleCommunities) {
            await Community.findOrCreate({
                where: { id: communityData.id },
                defaults: communityData
            });
        }
        console.log('✅ Sample communities created');

        // Board 테이블에 community_id 컬럼 추가 (기존 boards 테이블 업데이트)
        try {
            await sequelize.query(`
                       ALTER TABLE boards ADD COLUMN community_id VARCHAR(64) DEFAULT NULL;
                   `);
            console.log('✅ Added community_id column to boards table');
        } catch (error) {
            console.log('ℹ️ community_id column may already exist in boards table');
        }

        // 기존 게시판들을 커뮤니티에 연결
        const boards = await Board.findAll();
        const communities = await Community.findAll();

        for (const board of boards) {
            let communityId = 'global-community'; // 기본 커뮤니티

            // 게시판 ID에 따라 적절한 커뮤니티 할당
            if (board.id.includes('news')) {
                communityId = 'news-community';
            } else if (board.id.includes('game')) {
                communityId = 'game-community';
            } else if (board.id.includes('broadcast')) {
                communityId = 'broadcast-community';
            } else if (board.id.includes('cosplay') || board.id.includes('image')) {
                communityId = 'cosplay-community';
            }

            await board.update({ community_id: communityId });
        }
        console.log('✅ Connected boards to communities');

        // VotingPoll 테이블 정의 및 생성
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
                defaultValue: 0,
                field: 'max_votes_per_i_p'
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
        await VotingPoll.sync({ force: false });
        console.log('✅ VotingPolls table created/synced');

        // VotingOption 테이블 정의 및 생성
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
        await VotingOption.sync({ force: false });
        console.log('✅ VotingOptions table created/synced');

        // VotingRecord 테이블 정의 및 생성
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
                allowNull: true
            },
            optionIds: {
                type: DataTypes.JSON,
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
        await VotingRecord.sync({ force: false });
        console.log('✅ VotingRecords table created/synced');

        // maxVotesPerIP 컬럼 추가 (기존 테이블에 컬럼이 없는 경우)
        try {
            await sequelize.query('ALTER TABLE voting_polls ADD COLUMN maxVotesPerIP INTEGER DEFAULT 0;');
            console.log('✅ maxVotesPerIP column added to voting_polls table');
        } catch (error) {
            console.log('ℹ️ maxVotesPerIP column may already exist in voting_polls table');
        }

        // 샘플 투표 생성
        const samplePolls = [
            {
                id: 'poll_sample_1',
                title: '가장 선호하는 게임 장르는?',
                description: '여러분이 가장 좋아하는 게임 장르를 선택해주세요.',
                type: 'single',
                status: 'active',
                allowAnonymous: true,
                allowMultipleVotes: false,
                createdBy: 1,
                totalVotes: 0
            },
            {
                id: 'poll_sample_2',
                title: '이번 주말에 하고 싶은 활동들 (최대 3개 선택)',
                description: '이번 주말에 하고 싶은 활동을 여러 개 선택해주세요.',
                type: 'multiple',
                status: 'active',
                allowAnonymous: false,
                allowMultipleVotes: false,
                maxSelections: 3,
                createdBy: 1,
                totalVotes: 0
            }
        ];

        for (const pollData of samplePolls) {
            await VotingPoll.findOrCreate({
                where: { id: pollData.id },
                defaults: pollData
            });
        }
        console.log('✅ Sample polls created');

        // 샘플 투표 옵션 생성
        const sampleOptions = [
            // 첫 번째 투표 옵션들
            {
                id: 'option_sample_1_1',
                pollId: 'poll_sample_1',
                text: 'RPG',
                description: '롤플레이 게임',
                order: 0,
                voteCount: 0
            },
            {
                id: 'option_sample_1_2',
                pollId: 'poll_sample_1',
                text: 'FPS',
                description: '1인칭 슈팅 게임',
                order: 1,
                voteCount: 0
            },
            {
                id: 'option_sample_1_3',
                pollId: 'poll_sample_1',
                text: '전략',
                description: '전략 시뮬레이션 게임',
                order: 2,
                voteCount: 0
            },
            {
                id: 'option_sample_1_4',
                pollId: 'poll_sample_1',
                text: '액션',
                description: '액션 어드벤처 게임',
                order: 3,
                voteCount: 0
            },
            // 두 번째 투표 옵션들
            {
                id: 'option_sample_2_1',
                pollId: 'poll_sample_2',
                text: '게임하기',
                order: 0,
                voteCount: 0
            },
            {
                id: 'option_sample_2_2',
                pollId: 'poll_sample_2',
                text: '영화보기',
                order: 1,
                voteCount: 0
            },
            {
                id: 'option_sample_2_3',
                pollId: 'poll_sample_2',
                text: '운동하기',
                order: 2,
                voteCount: 0
            },
            {
                id: 'option_sample_2_4',
                pollId: 'poll_sample_2',
                text: '독서하기',
                order: 3,
                voteCount: 0
            },
            {
                id: 'option_sample_2_5',
                pollId: 'poll_sample_2',
                text: '친구들과 만나기',
                order: 4,
                voteCount: 0
            }
        ];

        for (const optionData of sampleOptions) {
            await VotingOption.findOrCreate({
                where: { id: optionData.id },
                defaults: optionData
            });
        }
        console.log('✅ Sample voting options created');

        // Comment 테이블 정의 및 생성
        const Comment = sequelize.define('Comment', {
            id: {
                type: DataTypes.STRING(64),
                primaryKey: true
            },
            postId: {
                type: DataTypes.STRING(64),
                allowNull: false
            },
            parentId: {
                type: DataTypes.STRING(64),
                allowNull: true
            },
            authorId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            authorName: {
                type: DataTypes.STRING(100),
                allowNull: false
            },
            content: {
                type: DataTypes.TEXT,
                allowNull: false
            },
            depth: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            path: {
                type: DataTypes.STRING(500),
                allowNull: true
            },
            likes: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },
            dislikes: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },
            replies: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },
            isEdited: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            editedAt: {
                type: DataTypes.DATE,
                allowNull: true
            },
            isDeleted: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            deletedAt: {
                type: DataTypes.DATE,
                allowNull: true
            },
            deletedBy: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            ipAddress: {
                type: DataTypes.STRING(45),
                allowNull: true
            },
            userAgent: {
                type: DataTypes.STRING(500),
                allowNull: true
            },
            metadata: {
                type: DataTypes.JSON,
                allowNull: true
            }
        }, {
            tableName: 'comments',
            timestamps: true
        });
        await Comment.sync({ force: false });
        console.log('✅ Comments table created/synced');

        // 샘플 댓글 생성
        const sampleComments = [
            {
                id: 'comment_sample_1',
                postId: 'post_news_1',
                parentId: null,
                authorId: 1,
                authorName: '관리자',
                content: '정말 유익한 기사네요! 공유하고 싶습니다.',
                depth: 0,
                path: 'comment_sample_1',
                likes: 5,
                dislikes: 0,
                replies: 2,
                isEdited: false,
                isDeleted: false
            },
            {
                id: 'comment_sample_2',
                postId: 'post_news_1',
                parentId: 'comment_sample_1',
                authorId: 1,
                authorName: '사용자1',
                content: '저도 그렇게 생각해요. 더 자세한 내용이 궁금합니다.',
                depth: 1,
                path: 'comment_sample_1/comment_sample_2',
                likes: 3,
                dislikes: 0,
                replies: 1,
                isEdited: false,
                isDeleted: false
            },
            {
                id: 'comment_sample_3',
                postId: 'post_news_1',
                parentId: 'comment_sample_1',
                authorId: 1,
                authorName: '사용자2',
                content: '관련 자료를 찾아서 공유해드릴게요!',
                depth: 1,
                path: 'comment_sample_1/comment_sample_3',
                likes: 2,
                dislikes: 0,
                replies: 0,
                isEdited: false,
                isDeleted: false
            },
            {
                id: 'comment_sample_4',
                postId: 'post_news_1',
                parentId: 'comment_sample_2',
                authorId: 1,
                authorName: '사용자3',
                content: '감사합니다! 기다리고 있겠습니다.',
                depth: 2,
                path: 'comment_sample_1/comment_sample_2/comment_sample_4',
                likes: 1,
                dislikes: 0,
                replies: 0,
                isEdited: false,
                isDeleted: false
            }
        ];

        for (const commentData of sampleComments) {
            await Comment.findOrCreate({
                where: { id: commentData.id },
                defaults: commentData
            });
        }
        console.log('✅ Sample comments created');

        // CommentReaction 테이블 정의 및 생성
        const CommentReaction = sequelize.define('CommentReaction', {
            id: {
                type: DataTypes.STRING(64),
                primaryKey: true
            },
            commentId: {
                type: DataTypes.STRING(64),
                allowNull: false
            },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            reactionType: {
                type: DataTypes.ENUM('like', 'dislike', 'love', 'laugh', 'angry', 'sad', 'wow'),
                allowNull: false
            },
            emoji: {
                type: DataTypes.STRING(10),
                allowNull: true
            },
            ipAddress: {
                type: DataTypes.STRING(45),
                allowNull: true
            },
            userAgent: {
                type: DataTypes.STRING(500),
                allowNull: true
            },
            isAnonymous: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            }
        }, {
            tableName: 'comment_reactions',
            timestamps: true
        });
        await CommentReaction.sync({ force: false });
        console.log('✅ Comment reactions table created/synced');

        // 샘플 댓글 반응 생성
        const sampleReactions = [
            {
                id: 'reaction_sample_1',
                commentId: 'comment_sample_1',
                userId: 1,
                reactionType: 'like',
                isAnonymous: false
            },
            {
                id: 'reaction_sample_2',
                commentId: 'comment_sample_1',
                userId: 1,
                reactionType: 'love',
                isAnonymous: false
            },
            {
                id: 'reaction_sample_3',
                commentId: 'comment_sample_2',
                userId: 1,
                reactionType: 'laugh',
                isAnonymous: false
            },
            {
                id: 'reaction_sample_4',
                commentId: 'comment_sample_2',
                userId: 1,
                reactionType: 'wow',
                isAnonymous: false
            }
        ];

        for (const reactionData of sampleReactions) {
            await CommentReaction.findOrCreate({
                where: { id: reactionData.id },
                defaults: reactionData
            });
        }
        console.log('✅ Sample comment reactions created');

        // ReadStatus 테이블 정의 및 생성
        const ReadStatus = sequelize.define('ReadStatus', {
            id: {
                type: DataTypes.STRING(64),
                primaryKey: true
            },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            postId: {
                type: DataTypes.STRING(64),
                allowNull: false
            },
            boardId: {
                type: DataTypes.STRING(64),
                allowNull: false
            },
            communityId: {
                type: DataTypes.STRING(64),
                allowNull: true
            },
            readAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW
            },
            readDuration: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            isFullyRead: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            scrollPosition: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            ipAddress: {
                type: DataTypes.STRING(45),
                allowNull: true
            },
            userAgent: {
                type: DataTypes.STRING(500),
                allowNull: true
            },
            deviceType: {
                type: DataTypes.ENUM('desktop', 'mobile', 'tablet'),
                allowNull: true
            },
            isAnonymous: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            }
        }, {
            tableName: 'read_status',
            timestamps: true
        });
        await ReadStatus.sync({ force: false });
        console.log('✅ Read status table created/synced');

        // 샘플 읽음 상태 생성
        const sampleReadStatuses = [
            {
                id: 'read_sample_1',
                userId: 1,
                postId: 'post_news_1',
                boardId: 'news',
                communityId: 'news-community',
                readAt: new Date(),
                readDuration: 45,
                isFullyRead: true,
                deviceType: 'desktop',
                isAnonymous: false
            },
            {
                id: 'read_sample_2',
                userId: 1,
                postId: 'post_free_1',
                boardId: 'free',
                communityId: 'global-community',
                readAt: new Date(Date.now() - 3600000), // 1시간 전
                readDuration: 30,
                isFullyRead: false,
                deviceType: 'mobile',
                isAnonymous: false
            }
        ];

        for (const readStatusData of sampleReadStatuses) {
            await ReadStatus.findOrCreate({
                where: { id: readStatusData.id },
                defaults: readStatusData
            });
        }
        console.log('✅ Sample read statuses created');

        // CommentReport 테이블 정의 및 생성
        const CommentReport = sequelize.define('CommentReport', {
            id: {
                type: DataTypes.STRING(64),
                primaryKey: true,
                comment: '신고 고유 ID'
            },
            commentId: {
                type: DataTypes.STRING(64),
                allowNull: false,
                field: 'comment_id',
                comment: '신고된 댓글 ID'
            },
            reporterId: {
                type: DataTypes.INTEGER,
                allowNull: true,
                field: 'reporter_id',
                comment: '신고자 ID (익명 신고 가능)'
            },
            reporterName: {
                type: DataTypes.STRING(100),
                allowNull: true,
                field: 'reporter_name',
                comment: '신고자 닉네임'
            },
            reportType: {
                type: DataTypes.ENUM(
                    'spam',           // 스팸
                    'harassment',     // 괴롭힘
                    'hate_speech',    // 혐오 발언
                    'inappropriate',  // 부적절한 내용
                    'violence',       // 폭력
                    'fake_news',      // 가짜 뉴스
                    'copyright',      // 저작권 침해
                    'privacy',        // 개인정보 침해
                    'other'           // 기타
                ),
                allowNull: false,
                field: 'report_type',
                comment: '신고 유형'
            },
            reason: {
                type: DataTypes.TEXT,
                allowNull: true,
                comment: '신고 사유 상세'
            },
            status: {
                type: DataTypes.ENUM('pending', 'reviewing', 'resolved', 'dismissed'),
                defaultValue: 'pending',
                comment: '신고 처리 상태'
            },
            adminNotes: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: 'admin_notes',
                comment: '관리자 처리 메모'
            },
            resolvedBy: {
                type: DataTypes.INTEGER,
                allowNull: true,
                field: 'resolved_by',
                comment: '처리한 관리자 ID'
            },
            resolvedAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: 'resolved_at',
                comment: '처리 완료 시간'
            },
            actionTaken: {
                type: DataTypes.ENUM(
                    'none',           // 조치 없음
                    'warning',        // 경고
                    'comment_hidden', // 댓글 숨김
                    'comment_deleted', // 댓글 삭제
                    'user_warned',    // 사용자 경고
                    'user_suspended', // 사용자 정지
                    'user_banned'     // 사용자 차단
                ),
                allowNull: true,
                field: 'action_taken',
                comment: '취해진 조치'
            },
            priority: {
                type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
                defaultValue: 'medium',
                comment: '신고 우선순위'
            },
            isAnonymous: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                field: 'is_anonymous',
                comment: '익명 신고 여부'
            },
            ipAddress: {
                type: DataTypes.STRING(45),
                allowNull: true,
                field: 'ip_address',
                comment: '신고자 IP 주소'
            },
            userAgent: {
                type: DataTypes.STRING(500),
                allowNull: true,
                field: 'user_agent',
                comment: '신고자 User Agent'
            },
            metadata: {
                type: DataTypes.JSON,
                allowNull: true,
                comment: '추가 메타데이터'
            }
        }, {
            tableName: 'comment_reports',
            timestamps: true,
            underscored: true,
            indexes: [
                { fields: ['comment_id'] },
                { fields: ['reporter_id'] },
                { fields: ['report_type'] },
                { fields: ['status'] },
                { fields: ['priority'] },
                { fields: ['created_at'] },
                { fields: ['resolved_at'] }
            ]
        });

        // CommentHistory 테이블 정의 및 생성
        const CommentHistory = sequelize.define('CommentHistory', {
            id: {
                type: DataTypes.STRING(64),
                primaryKey: true
            },
            commentId: {
                type: DataTypes.STRING(64),
                allowNull: false,
                field: 'comment_id'
            },
            version: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1
            },
            content: {
                type: DataTypes.TEXT,
                allowNull: false
            },
            previousContent: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: 'previous_content'
            },
            changeType: {
                type: DataTypes.ENUM('create', 'edit', 'delete', 'restore'),
                allowNull: false,
                field: 'change_type'
            },
            changeReason: {
                type: DataTypes.STRING(255),
                allowNull: true,
                field: 'change_reason'
            },
            editedBy: {
                type: DataTypes.INTEGER,
                allowNull: true,
                field: 'edited_by'
            },
            editedByName: {
                type: DataTypes.STRING(100),
                allowNull: true,
                field: 'edited_by_name'
            },
            ipAddress: {
                type: DataTypes.STRING(45),
                allowNull: true,
                field: 'ip_address'
            },
            userAgent: {
                type: DataTypes.STRING(500),
                allowNull: true,
                field: 'user_agent'
            },
            metadata: {
                type: DataTypes.JSON,
                allowNull: true
            },
            isVisible: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
                field: 'is_visible'
            }
        }, {
            tableName: 'comment_history',
            timestamps: true
        });
        await CommentReport.sync({ force: false });
        console.log('✅ Comment reports table created/synced');

        await CommentHistory.sync({ force: false });
        console.log('✅ Comment history table created/synced');

        // 샘플 댓글 신고 생성
        const sampleCommentReports = [
            {
                id: 'report_sample_1',
                commentId: 'comment_sample_1',
                reporterId: 1,
                reporterName: 'admin',
                reportType: 'spam',
                reason: '스팸성 댓글입니다.',
                status: 'pending',
                priority: 'medium',
                isAnonymous: false,
                ipAddress: '192.168.1.100',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                metadata: {
                    commentContent: '이건 스팸 댓글입니다.',
                    commentAuthor: 'spam_user'
                }
            },
            {
                id: 'report_sample_2',
                commentId: 'comment_sample_2',
                reporterId: null,
                reporterName: null,
                reportType: 'harassment',
                reason: '괴롭힘 댓글입니다.',
                status: 'resolved',
                priority: 'high',
                isAnonymous: true,
                ipAddress: '192.168.1.101',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                adminNotes: '신고가 확인되어 댓글을 숨김 처리했습니다.',
                resolvedBy: 1,
                resolvedAt: new Date(),
                actionTaken: 'comment_hidden',
                metadata: {
                    commentContent: '괴롭힘 댓글 내용',
                    commentAuthor: 'harassment_user'
                }
            },
            {
                id: 'report_sample_3',
                commentId: 'comment_sample_3',
                reporterId: 1,
                reporterName: 'admin',
                reportType: 'inappropriate',
                reason: '부적절한 내용이 포함되어 있습니다.',
                status: 'reviewing',
                priority: 'medium',
                isAnonymous: false,
                ipAddress: '192.168.1.102',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                metadata: {
                    commentContent: '부적절한 댓글 내용',
                    commentAuthor: 'inappropriate_user'
                }
            }
        ];

        for (const reportData of sampleCommentReports) {
            await CommentReport.findOrCreate({
                where: { id: reportData.id },
                defaults: reportData
            });
        }
        console.log('✅ Sample comment reports created');

        // 샘플 댓글 수정 이력 생성
        const sampleCommentHistories = [
            {
                id: 'comment_history_1',
                commentId: 'comment_sample_1',
                version: 1,
                content: '정말 좋은 글이네요! 공감합니다.',
                changeType: 'create',
                editedBy: 1,
                editedByName: 'admin',
                ipAddress: '127.0.0.1'
            },
            {
                id: 'comment_history_2',
                commentId: 'comment_sample_1',
                version: 2,
                content: '정말 좋은 글이네요! 완전 공감합니다. 더 많은 사람들이 봤으면 좋겠어요.',
                previousContent: '정말 좋은 글이네요! 공감합니다.',
                changeType: 'edit',
                changeReason: '내용 보완',
                editedBy: 1,
                editedByName: 'admin',
                ipAddress: '127.0.0.1'
            },
            {
                id: 'comment_history_3',
                commentId: 'comment_sample_2',
                version: 1,
                content: '흥미로운 관점이네요. 다른 의견도 있을 것 같은데요.',
                changeType: 'create',
                editedBy: 1,
                editedByName: 'admin',
                ipAddress: '127.0.0.1'
            }
        ];

        for (const historyData of sampleCommentHistories) {
            await CommentHistory.findOrCreate({
                where: { id: historyData.id },
                defaults: historyData
            });
        }
        console.log('✅ Sample comment histories created');

        console.log('🎉 Database setup completed successfully!');

    } catch (error) {
        console.error('❌ Database setup failed:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

createTables();

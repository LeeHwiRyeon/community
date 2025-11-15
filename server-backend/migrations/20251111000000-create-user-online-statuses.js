/**
 * Migration: Create user_online_statuses table
 * 온라인 상태 테이블 생성
 * 
 * @author AUTOAGENTS
 * @date 2025-11-11
 */

export const up = async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_online_statuses', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            unique: true,
            references: {
                model: 'users',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
        status: {
            type: Sequelize.ENUM('online', 'away', 'busy', 'offline'),
            defaultValue: 'offline',
            allowNull: false
        },
        last_seen_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
        },
        is_typing: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        current_room_id: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
        },
        updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
        }
    });

    // 인덱스 생성
    await queryInterface.addIndex('user_online_statuses', ['user_id'], {
        name: 'idx_user_online_statuses_user_id',
        unique: true
    });

    await queryInterface.addIndex('user_online_statuses', ['status'], {
        name: 'idx_user_online_statuses_status'
    });

    await queryInterface.addIndex('user_online_statuses', ['last_seen_at'], {
        name: 'idx_user_online_statuses_last_seen'
    });

    await queryInterface.addIndex('user_online_statuses', ['current_room_id'], {
        name: 'idx_user_online_statuses_room'
    });
};

export const down = async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_online_statuses');
};

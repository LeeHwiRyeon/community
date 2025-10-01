const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
            len: [3, 50],
            isAlphanumeric: true
        }
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            len: [6, 255]
        }
    },
    firstName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            len: [1, 50]
        }
    },
    lastName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            len: [1, 50]
        }
    },
    role: {
        type: DataTypes.ENUM('owner', 'admin', 'vip', 'streamer', 'cosplayer', 'manager', 'user'),
        allowNull: false,
        defaultValue: 'user'
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'suspended', 'pending'),
        allowNull: false,
        defaultValue: 'pending'
    },
    avatar: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        validate: {
            is: /^[\+]?[1-9][\d]{0,15}$/
        }
    },
    birthDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    gender: {
        type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
        allowNull: true
    },
    bio: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: [0, 1000]
        }
    },
    website: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
            isUrl: true
        }
    },
    socialLinks: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
    },
    preferences: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {
            language: 'ko',
            timezone: 'Asia/Seoul',
            notifications: {
                email: true,
                push: true,
                sms: false
            },
            privacy: {
                profileVisibility: 'public',
                showEmail: false,
                showPhone: false
            }
        }
    },
    lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    lastLoginIp: {
        type: DataTypes.STRING(45),
        allowNull: true
    },
    loginCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    isEmailVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    emailVerificationToken: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    passwordResetToken: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    passwordResetExpires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    twoFactorEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    twoFactorSecret: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    activityScore: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    subscriptionTier: {
        type: DataTypes.ENUM('free', 'basic', 'premium', 'vip'),
        allowNull: false,
        defaultValue: 'free'
    },
    subscriptionExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'users',
    indexes: [
        {
            unique: true,
            fields: ['email']
        },
        {
            unique: true,
            fields: ['username']
        },
        {
            fields: ['role']
        },
        {
            fields: ['status']
        },
        {
            fields: ['created_at']
        }
    ],
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                user.password = await bcrypt.hash(user.password, 12);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                user.password = await bcrypt.hash(user.password, 12);
            }
        }
    }
});

// 인스턴스 메서드들
User.prototype.validatePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.getPublicProfile = function () {
    const { password, twoFactorSecret, emailVerificationToken, passwordResetToken, ...publicProfile } = this.toJSON();
    return publicProfile;
};

User.prototype.getFullName = function () {
    return `${this.firstName} ${this.lastName}`.trim();
};

User.prototype.isActive = function () {
    return this.status === 'active';
};

User.prototype.canAccess = function (requiredRole) {
    const roleHierarchy = {
        'user': 1,
        'manager': 2,
        'cosplayer': 3,
        'streamer': 4,
        'vip': 5,
        'admin': 6,
        'owner': 7
    };

    const userLevel = roleHierarchy[this.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    return userLevel >= requiredLevel;
};

// 클래스 메서드들
User.findByEmail = function (email) {
    return this.findOne({ where: { email } });
};

User.findByUsername = function (username) {
    return this.findOne({ where: { username } });
};

User.findActiveUsers = function () {
    return this.findAll({ where: { status: 'active' } });
};

User.findByRole = function (role) {
    return this.findAll({ where: { role } });
};

module.exports = User;

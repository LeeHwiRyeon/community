const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// 커뮤니티 스키마
const communitySchema = {
    id: String,
    name: String,
    description: String,
    type: String, // 'public', 'private', 'secret', 'subcommunity'
    parentId: String, // 상위 커뮤니티 ID (서브커뮤니티용)
    level: Number, // 계층 레벨 (0: 최상위, 1: 서브커뮤니티)
    path: String, // 계층 경로 (예: "parent/subcommunity")
    category: String, // 'general', 'tech', 'gaming', 'business', 'education'
    tags: [String],
    settings: {
        allowGuestAccess: Boolean,
        requireApproval: Boolean,
        allowMemberInvite: Boolean,
        allowContentCreation: Boolean,
        allowFileUpload: Boolean,
        maxFileSize: Number,
        allowedFileTypes: [String],
        moderationLevel: String, // 'none', 'light', 'moderate', 'strict'
        autoModeration: Boolean,
        contentFiltering: Boolean,
        spamProtection: Boolean
    },
    appearance: {
        theme: String,
        primaryColor: String,
        secondaryColor: String,
        logo: String,
        banner: String,
        customCSS: String,
        layout: String // 'default', 'compact', 'spacious'
    },
    membership: {
        totalMembers: Number,
        activeMembers: Number,
        moderators: [String],
        admins: [String],
        bannedUsers: [String],
        pendingApprovals: [String],
        memberRoles: Object // { userId: role }
    },
    statistics: {
        totalPosts: Number,
        totalComments: Number,
        totalViews: Number,
        dailyActiveUsers: Number,
        weeklyActiveUsers: Number,
        monthlyActiveUsers: Number,
        growthRate: Number,
        engagementScore: Number
    },
    permissions: {
        roles: Object, // { roleName: { permissions: [] } }
        defaultRole: String,
        customPermissions: Object
    },
    features: {
        enableChat: Boolean,
        enableForums: Boolean,
        enableEvents: Boolean,
        enablePolls: Boolean,
        enableFileSharing: Boolean,
        enableLiveStreaming: Boolean,
        enableARVR: Boolean,
        enableGamification: Boolean
    },
    integrations: {
        discord: Object,
        slack: Object,
        facebook: Object,
        twitter: Object,
        youtube: Object,
        twitch: Object
    },
    status: String, // 'active', 'inactive', 'suspended', 'archived'
    visibility: String, // 'public', 'private', 'unlisted'
    createdAt: Date,
    updatedAt: Date,
    createdBy: String,
    lastActivity: Date
};

// 임시 저장소 (실제로는 데이터베이스 사용)
let communityStore = new Map();
let communityIdCounter = 1;

// 미들웨어: 인증 확인
const authenticateUser = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
    }
    // 실제로는 JWT 토큰 검증
    req.user = { id: 'user1', role: 'admin', permissions: ['*'] };
    next();
};

// 미들웨어: 권한 확인
const checkCommunityPermission = (permission) => {
    return (req, res, next) => {
        const communityId = req.params.id || req.body.communityId;
        const user = req.user;

        if (!communityId) {
            return res.status(400).json({ success: false, message: '커뮤니티 ID가 필요합니다.' });
        }

        const community = communityStore.get(communityId);
        if (!community) {
            return res.status(404).json({ success: false, message: '커뮤니티를 찾을 수 없습니다.' });
        }

        // 관리자는 모든 권한
        if (user.role === 'admin' || user.permissions.includes('*')) {
            return next();
        }

        // 커뮤니티별 권한 확인
        const userRole = community.membership.memberRoles[user.id];
        const rolePermissions = community.permissions.roles[userRole]?.permissions || [];

        if (rolePermissions.includes(permission) || rolePermissions.includes('*')) {
            return next();
        }

        res.status(403).json({ success: false, message: '권한이 없습니다.' });
    };
};

// 커뮤니티 목록 조회
router.get('/', authenticateUser, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            type,
            category,
            status = 'active',
            search,
            sortBy = 'lastActivity',
            sortOrder = 'desc',
            parentId,
            level
        } = req.query;

        let communities = Array.from(communityStore.values());

        // 필터링
        if (type) communities = communities.filter(c => c.type === type);
        if (category) communities = communities.filter(c => c.category === category);
        if (status) communities = communities.filter(c => c.status === status);
        if (parentId) communities = communities.filter(c => c.parentId === parentId);
        if (level !== undefined) communities = communities.filter(c => c.level === parseInt(level));

        // 검색
        if (search) {
            const searchTerm = search.toLowerCase();
            communities = communities.filter(c =>
                c.name.toLowerCase().includes(searchTerm) ||
                c.description.toLowerCase().includes(searchTerm) ||
                c.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }

        // 정렬
        communities.sort((a, b) => {
            const aVal = a[sortBy];
            const bVal = b[sortBy];
            if (sortOrder === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        // 페이지네이션
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedCommunities = communities.slice(startIndex, endIndex);

        res.json({
            success: true,
            data: {
                communities: paginatedCommunities,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: communities.length,
                    pages: Math.ceil(communities.length / limit)
                }
            }
        });
    } catch (error) {
        console.error('커뮤니티 목록 조회 오류:', error);
        res.status(500).json({ success: false, message: '커뮤니티 목록 조회 중 오류가 발생했습니다.' });
    }
});

// 커뮤니티 상세 조회
router.get('/:id', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const community = communityStore.get(id);

        if (!community) {
            return res.status(404).json({ success: false, message: '커뮤니티를 찾을 수 없습니다.' });
        }

        // 서브커뮤니티 목록 추가
        const subCommunities = Array.from(communityStore.values())
            .filter(c => c.parentId === id);

        res.json({
            success: true,
            data: {
                ...community,
                subCommunities
            }
        });
    } catch (error) {
        console.error('커뮤니티 상세 조회 오류:', error);
        res.status(500).json({ success: false, message: '커뮤니티 상세 조회 중 오류가 발생했습니다.' });
    }
});

// 커뮤니티 생성
router.post('/', authenticateUser, async (req, res) => {
    try {
        const {
            name,
            description,
            type = 'public',
            parentId,
            category = 'general',
            tags = [],
            settings = {},
            appearance = {},
            features = {},
            permissions = {}
        } = req.body;

        if (!name || !description) {
            return res.status(400).json({ success: false, message: '이름과 설명은 필수입니다.' });
        }

        // 상위 커뮤니티 확인
        let level = 0;
        let path = name;
        if (parentId) {
            const parentCommunity = communityStore.get(parentId);
            if (!parentCommunity) {
                return res.status(404).json({ success: false, message: '상위 커뮤니티를 찾을 수 없습니다.' });
            }
            level = parentCommunity.level + 1;
            path = `${parentCommunity.path}/${name}`;
        }

        const now = new Date();
        const newCommunity = {
            id: `community_${communityIdCounter++}`,
            name,
            description,
            type,
            parentId: parentId || null,
            level,
            path,
            category,
            tags,
            settings: {
                allowGuestAccess: true,
                requireApproval: false,
                allowMemberInvite: true,
                allowContentCreation: true,
                allowFileUpload: true,
                maxFileSize: 10 * 1024 * 1024, // 10MB
                allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
                moderationLevel: 'moderate',
                autoModeration: true,
                contentFiltering: true,
                spamProtection: true,
                ...settings
            },
            appearance: {
                theme: 'default',
                primaryColor: '#3182ce',
                secondaryColor: '#2d3748',
                logo: '',
                banner: '',
                customCSS: '',
                layout: 'default',
                ...appearance
            },
            membership: {
                totalMembers: 1,
                activeMembers: 1,
                moderators: [req.user.id],
                admins: [req.user.id],
                bannedUsers: [],
                pendingApprovals: [],
                memberRoles: { [req.user.id]: 'admin' }
            },
            statistics: {
                totalPosts: 0,
                totalComments: 0,
                totalViews: 0,
                dailyActiveUsers: 1,
                weeklyActiveUsers: 1,
                monthlyActiveUsers: 1,
                growthRate: 0,
                engagementScore: 0
            },
            permissions: {
                roles: {
                    admin: { permissions: ['*'] },
                    moderator: { permissions: ['moderate', 'manage_members', 'manage_content'] },
                    member: { permissions: ['create_content', 'comment', 'vote'] },
                    guest: { permissions: ['view'] }
                },
                defaultRole: 'member',
                customPermissions: {},
                ...permissions
            },
            features: {
                enableChat: true,
                enableForums: true,
                enableEvents: true,
                enablePolls: true,
                enableFileSharing: true,
                enableLiveStreaming: false,
                enableARVR: false,
                enableGamification: false,
                ...features
            },
            integrations: {
                discord: null,
                slack: null,
                facebook: null,
                twitter: null,
                youtube: null,
                twitch: null
            },
            status: 'active',
            visibility: 'public',
            createdAt: now,
            updatedAt: now,
            createdBy: req.user.id,
            lastActivity: now
        };

        communityStore.set(newCommunity.id, newCommunity);

        res.status(201).json({
            success: true,
            message: '커뮤니티가 생성되었습니다.',
            data: newCommunity
        });
    } catch (error) {
        console.error('커뮤니티 생성 오류:', error);
        res.status(500).json({ success: false, message: '커뮤니티 생성 중 오류가 발생했습니다.' });
    }
});

// 커뮤니티 수정
router.put('/:id', authenticateUser, checkCommunityPermission('manage_community'), async (req, res) => {
    try {
        const { id } = req.params;
        const existingCommunity = communityStore.get(id);

        if (!existingCommunity) {
            return res.status(404).json({ success: false, message: '커뮤니티를 찾을 수 없습니다.' });
        }

        const updates = req.body;
        const updatedCommunity = {
            ...existingCommunity,
            ...updates,
            id: existingCommunity.id, // ID는 변경 불가
            createdBy: existingCommunity.createdBy, // 생성자는 변경 불가
            createdAt: existingCommunity.createdAt, // 생성일은 변경 불가
            updatedAt: new Date()
        };

        communityStore.set(id, updatedCommunity);

        res.json({
            success: true,
            message: '커뮤니티가 수정되었습니다.',
            data: updatedCommunity
        });
    } catch (error) {
        console.error('커뮤니티 수정 오류:', error);
        res.status(500).json({ success: false, message: '커뮤니티 수정 중 오류가 발생했습니다.' });
    }
});

// 커뮤니티 삭제
router.delete('/:id', authenticateUser, checkCommunityPermission('delete_community'), async (req, res) => {
    try {
        const { id } = req.params;
        const community = communityStore.get(id);

        if (!community) {
            return res.status(404).json({ success: false, message: '커뮤니티를 찾을 수 없습니다.' });
        }

        // 서브커뮤니티가 있는지 확인
        const subCommunities = Array.from(communityStore.values())
            .filter(c => c.parentId === id);

        if (subCommunities.length > 0) {
            return res.status(400).json({
                success: false,
                message: '서브커뮤니티가 있는 커뮤니티는 삭제할 수 없습니다.'
            });
        }

        // 실제로는 soft delete
        community.status = 'archived';
        community.updatedAt = new Date();
        communityStore.set(id, community);

        res.json({
            success: true,
            message: '커뮤니티가 삭제되었습니다.'
        });
    } catch (error) {
        console.error('커뮤니티 삭제 오류:', error);
        res.status(500).json({ success: false, message: '커뮤니티 삭제 중 오류가 발생했습니다.' });
    }
});

// 커뮤니티 멤버 관리
router.post('/:id/members', authenticateUser, checkCommunityPermission('manage_members'), async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, role = 'member' } = req.body;

        const community = communityStore.get(id);
        if (!community) {
            return res.status(404).json({ success: false, message: '커뮤니티를 찾을 수 없습니다.' });
        }

        // 멤버 추가
        if (!community.membership.memberRoles[userId]) {
            community.membership.memberRoles[userId] = role;
            community.membership.totalMembers++;
            community.membership.activeMembers++;
            community.updatedAt = new Date();
            communityStore.set(id, community);

            res.json({
                success: true,
                message: '멤버가 추가되었습니다.',
                data: { userId, role }
            });
        } else {
            res.status(400).json({ success: false, message: '이미 멤버입니다.' });
        }
    } catch (error) {
        console.error('멤버 추가 오류:', error);
        res.status(500).json({ success: false, message: '멤버 추가 중 오류가 발생했습니다.' });
    }
});

// 커뮤니티 권한 관리
router.put('/:id/permissions', authenticateUser, checkCommunityPermission('manage_permissions'), async (req, res) => {
    try {
        const { id } = req.params;
        const { roles, defaultRole, customPermissions } = req.body;

        const community = communityStore.get(id);
        if (!community) {
            return res.status(404).json({ success: false, message: '커뮤니티를 찾을 수 없습니다.' });
        }

        community.permissions = {
            ...community.permissions,
            roles: roles || community.permissions.roles,
            defaultRole: defaultRole || community.permissions.defaultRole,
            customPermissions: customPermissions || community.permissions.customPermissions
        };
        community.updatedAt = new Date();
        communityStore.set(id, community);

        res.json({
            success: true,
            message: '권한이 업데이트되었습니다.',
            data: community.permissions
        });
    } catch (error) {
        console.error('권한 업데이트 오류:', error);
        res.status(500).json({ success: false, message: '권한 업데이트 중 오류가 발생했습니다.' });
    }
});

// 커뮤니티 통계
router.get('/:id/stats', authenticateUser, checkCommunityPermission('view_stats'), async (req, res) => {
    try {
        const { id } = req.params;
        const community = communityStore.get(id);

        if (!community) {
            return res.status(404).json({ success: false, message: '커뮤니티를 찾을 수 없습니다.' });
        }

        res.json({
            success: true,
            data: {
                membership: community.membership,
                statistics: community.statistics,
                activity: {
                    lastActivity: community.lastActivity,
                    growthRate: community.statistics.growthRate,
                    engagementScore: community.statistics.engagementScore
                }
            }
        });
    } catch (error) {
        console.error('커뮤니티 통계 조회 오류:', error);
        res.status(500).json({ success: false, message: '커뮤니티 통계 조회 중 오류가 발생했습니다.' });
    }
});

// 커뮤니티 계층 구조 조회
router.get('/:id/hierarchy', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const community = communityStore.get(id);

        if (!community) {
            return res.status(404).json({ success: false, message: '커뮤니티를 찾을 수 없습니다.' });
        }

        // 전체 계층 구조 조회
        const buildHierarchy = (communityId, level = 0) => {
            const currentCommunity = communityStore.get(communityId);
            if (!currentCommunity) return null;

            const subCommunities = Array.from(communityStore.values())
                .filter(c => c.parentId === communityId)
                .map(c => buildHierarchy(c.id, level + 1))
                .filter(Boolean);

            return {
                ...currentCommunity,
                level,
                subCommunities
            };
        };

        const hierarchy = buildHierarchy(id);

        res.json({
            success: true,
            data: hierarchy
        });
    } catch (error) {
        console.error('커뮤니티 계층 구조 조회 오류:', error);
        res.status(500).json({ success: false, message: '커뮤니티 계층 구조 조회 중 오류가 발생했습니다.' });
    }
});

module.exports = router;

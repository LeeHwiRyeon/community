const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Multer 설정 (파일 업로드)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads/community-content');
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
        files: 20
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|avi|mov|wmv|flv|webm|pdf|doc|docx|txt|md|zip|rar|7z/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('지원하지 않는 파일 형식입니다.'));
        }
    }
});

// 컨텐츠 스키마
const contentSchema = {
    id: String,
    communityId: String,
    authorId: String,
    authorName: String,
    authorAvatar: String,
    type: String, // 'post', 'image', 'video', 'audio', 'document', 'live', 'poll', 'event'
    title: String,
    content: String,
    media: [{
        type: String, // 'image', 'video', 'audio', 'document'
        url: String,
        thumbnail: String,
        duration: Number, // for video/audio
        size: Number,
        width: Number,
        height: Number,
        metadata: Object
    }],
    tags: [String],
    category: String,
    status: String, // 'draft', 'published', 'archived', 'deleted', 'featured', 'pinned'
    visibility: String, // 'public', 'private', 'members', 'premium'
    accessLevel: Number, // 0-10
    isLive: Boolean,
    liveData: {
        streamUrl: String,
        viewers: Number,
        startTime: Date,
        endTime: Date,
        isRecording: Boolean
    },
    pollData: {
        question: String,
        options: [String],
        allowMultiple: Boolean,
        endTime: Date,
        votes: Object // { optionId: [userId] }
    },
    eventData: {
        startTime: Date,
        endTime: Date,
        location: String,
        isOnline: Boolean,
        maxAttendees: Number,
        attendees: [String],
        description: String
    },
    engagement: {
        likes: [String],
        dislikes: [String],
        shares: [String],
        views: Number,
        comments: Number,
        bookmarks: [String],
        reports: [String]
    },
    seo: {
        title: String,
        description: String,
        keywords: [String],
        slug: String
    },
    moderation: {
        isModerated: Boolean,
        moderatedBy: String,
        moderatedAt: Date,
        reason: String,
        flags: [String]
    },
    analytics: {
        impressions: Number,
        clicks: Number,
        engagementRate: Number,
        shareRate: Number,
        commentRate: Number
    },
    createdAt: Date,
    updatedAt: Date,
    publishedAt: Date,
    expiresAt: Date
};

// 임시 저장소 (실제로는 데이터베이스 사용)
let contentStore = new Map();
let contentIdCounter = 1;

// 미들웨어: 인증 확인
const authenticateUser = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
    }
    // 실제로는 JWT 토큰 검증
    req.user = { id: 'user1', role: 'admin', username: 'admin', avatar: '' };
    next();
};

// 컨텐츠 목록 조회
router.get('/', authenticateUser, async (req, res) => {
    try {
        const {
            communityId,
            type,
            status = 'published',
            category,
            authorId,
            tags,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 20,
            featured,
            pinned,
            isLive
        } = req.query;

        let contents = Array.from(contentStore.values());

        // 필터링
        if (communityId) contents = contents.filter(c => c.communityId === communityId);
        if (type) contents = contents.filter(c => c.type === type);
        if (status) contents = contents.filter(c => c.status === status);
        if (category) contents = contents.filter(c => c.category === category);
        if (authorId) contents = contents.filter(c => c.authorId === authorId);
        if (featured !== undefined) contents = contents.filter(c => c.status === 'featured');
        if (pinned !== undefined) contents = contents.filter(c => c.status === 'pinned');
        if (isLive !== undefined) contents = contents.filter(c => c.isLive === (isLive === 'true'));

        // 태그 필터링
        if (tags) {
            const tagList = tags.split(',').map(t => t.trim());
            contents = contents.filter(c => tagList.some(tag => c.tags.includes(tag)));
        }

        // 검색
        if (search) {
            const searchTerm = search.toLowerCase();
            contents = contents.filter(c =>
                c.title.toLowerCase().includes(searchTerm) ||
                c.content.toLowerCase().includes(searchTerm) ||
                c.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }

        // 정렬
        contents.sort((a, b) => {
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
        const paginatedContents = contents.slice(startIndex, endIndex);

        res.json({
            success: true,
            data: {
                contents: paginatedContents,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: contents.length,
                    pages: Math.ceil(contents.length / limit)
                }
            }
        });
    } catch (error) {
        console.error('컨텐츠 목록 조회 오류:', error);
        res.status(500).json({ success: false, message: '컨텐츠 목록 조회 중 오류가 발생했습니다.' });
    }
});

// 컨텐츠 상세 조회
router.get('/:id', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const content = contentStore.get(id);

        if (!content) {
            return res.status(404).json({ success: false, message: '컨텐츠를 찾을 수 없습니다.' });
        }

        // 조회수 증가
        content.engagement.views = (content.engagement.views || 0) + 1;
        contentStore.set(id, content);

        res.json({
            success: true,
            data: content
        });
    } catch (error) {
        console.error('컨텐츠 상세 조회 오류:', error);
        res.status(500).json({ success: false, message: '컨텐츠 상세 조회 중 오류가 발생했습니다.' });
    }
});

// 컨텐츠 생성
router.post('/', authenticateUser, upload.array('media', 20), async (req, res) => {
    try {
        const {
            communityId,
            type = 'post',
            title,
            content,
            tags = [],
            category,
            visibility = 'public',
            accessLevel = 0,
            isLive = false,
            liveData = {},
            pollData = {},
            eventData = {},
            seo = {}
        } = req.body;

        if (!communityId || !title) {
            return res.status(400).json({
                success: false,
                message: '커뮤니티 ID와 제목은 필수입니다.'
            });
        }

        // 미디어 파일 처리
        const mediaFiles = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const mediaFile = await processMediaFile(file);
                mediaFiles.push(mediaFile);
            }
        }

        const now = new Date();
        const contentId = `content_${contentIdCounter++}`;

        const newContent = {
            id: contentId,
            communityId,
            authorId: req.user.id,
            authorName: req.user.username,
            authorAvatar: req.user.avatar,
            type,
            title,
            content: content || '',
            media: mediaFiles,
            tags: Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()),
            category,
            status: 'published',
            visibility,
            accessLevel,
            isLive,
            liveData: isLive ? {
                streamUrl: '',
                viewers: 0,
                startTime: now,
                endTime: null,
                isRecording: false,
                ...liveData
            } : null,
            pollData: type === 'poll' ? {
                question: '',
                options: [],
                allowMultiple: false,
                endTime: null,
                votes: {},
                ...pollData
            } : null,
            eventData: type === 'event' ? {
                startTime: null,
                endTime: null,
                location: '',
                isOnline: false,
                maxAttendees: 0,
                attendees: [],
                description: '',
                ...eventData
            } : null,
            engagement: {
                likes: [],
                dislikes: [],
                shares: [],
                views: 0,
                comments: 0,
                bookmarks: [],
                reports: []
            },
            seo: {
                title: seo.title || title,
                description: seo.description || content?.substring(0, 160) || '',
                keywords: seo.keywords || tags,
                slug: generateSlug(title),
                ...seo
            },
            moderation: {
                isModerated: false,
                moderatedBy: null,
                moderatedAt: null,
                reason: null,
                flags: []
            },
            analytics: {
                impressions: 0,
                clicks: 0,
                engagementRate: 0,
                shareRate: 0,
                commentRate: 0
            },
            createdAt: now,
            updatedAt: now,
            publishedAt: now,
            expiresAt: null
        };

        contentStore.set(contentId, newContent);

        res.status(201).json({
            success: true,
            message: '컨텐츠가 생성되었습니다.',
            data: newContent
        });
    } catch (error) {
        console.error('컨텐츠 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '컨텐츠 생성 중 오류가 발생했습니다.'
        });
    }
});

// 컨텐츠 수정
router.put('/:id', authenticateUser, upload.array('media', 20), async (req, res) => {
    try {
        const { id } = req.params;
        const existingContent = contentStore.get(id);

        if (!existingContent) {
            return res.status(404).json({ success: false, message: '컨텐츠를 찾을 수 없습니다.' });
        }

        // 작성자 또는 관리자만 수정 가능
        if (existingContent.authorId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: '수정 권한이 없습니다.' });
        }

        const updates = req.body;

        // 미디어 파일 처리
        const newMediaFiles = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const mediaFile = await processMediaFile(file);
                newMediaFiles.push(mediaFile);
            }
        }

        const updatedContent = {
            ...existingContent,
            ...updates,
            id: existingContent.id, // ID는 변경 불가
            authorId: existingContent.authorId, // 작성자는 변경 불가
            createdAt: existingContent.createdAt, // 생성일은 변경 불가
            updatedAt: new Date(),
            media: updates.media ? [...existingContent.media, ...newMediaFiles] : existingContent.media
        };

        contentStore.set(id, updatedContent);

        res.json({
            success: true,
            message: '컨텐츠가 수정되었습니다.',
            data: updatedContent
        });
    } catch (error) {
        console.error('컨텐츠 수정 오류:', error);
        res.status(500).json({ success: false, message: '컨텐츠 수정 중 오류가 발생했습니다.' });
    }
});

// 컨텐츠 삭제
router.delete('/:id', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const content = contentStore.get(id);

        if (!content) {
            return res.status(404).json({ success: false, message: '컨텐츠를 찾을 수 없습니다.' });
        }

        // 작성자 또는 관리자만 삭제 가능
        if (content.authorId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: '삭제 권한이 없습니다.' });
        }

        // 실제로는 soft delete
        content.status = 'deleted';
        content.updatedAt = new Date();
        contentStore.set(id, content);

        res.json({
            success: true,
            message: '컨텐츠가 삭제되었습니다.'
        });
    } catch (error) {
        console.error('컨텐츠 삭제 오류:', error);
        res.status(500).json({ success: false, message: '컨텐츠 삭제 중 오류가 발생했습니다.' });
    }
});

// 컨텐츠 상호작용 (좋아요, 공유, 북마크)
router.post('/:id/interact', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { action, value } = req.body; // action: 'like', 'dislike', 'share', 'bookmark'

        const content = contentStore.get(id);
        if (!content) {
            return res.status(404).json({ success: false, message: '컨텐츠를 찾을 수 없습니다.' });
        }

        const userId = req.user.id;
        const engagement = content.engagement;

        switch (action) {
            case 'like':
                if (engagement.likes.includes(userId)) {
                    engagement.likes = engagement.likes.filter(id => id !== userId);
                } else {
                    engagement.likes.push(userId);
                    engagement.dislikes = engagement.dislikes.filter(id => id !== userId);
                }
                break;
            case 'dislike':
                if (engagement.dislikes.includes(userId)) {
                    engagement.dislikes = engagement.dislikes.filter(id => id !== userId);
                } else {
                    engagement.dislikes.push(userId);
                    engagement.likes = engagement.likes.filter(id => id !== userId);
                }
                break;
            case 'share':
                if (!engagement.shares.includes(userId)) {
                    engagement.shares.push(userId);
                }
                break;
            case 'bookmark':
                if (engagement.bookmarks.includes(userId)) {
                    engagement.bookmarks = engagement.bookmarks.filter(id => id !== userId);
                } else {
                    engagement.bookmarks.push(userId);
                }
                break;
        }

        content.engagement = engagement;
        content.updatedAt = new Date();
        contentStore.set(id, content);

        res.json({
            success: true,
            message: `${action} 처리되었습니다.`,
            data: engagement
        });
    } catch (error) {
        console.error('컨텐츠 상호작용 오류:', error);
        res.status(500).json({ success: false, message: '컨텐츠 상호작용 처리 중 오류가 발생했습니다.' });
    }
});

// 라이브 스트리밍 시작
router.post('/:id/live/start', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { streamUrl } = req.body;

        const content = contentStore.get(id);
        if (!content) {
            return res.status(404).json({ success: false, message: '컨텐츠를 찾을 수 없습니다.' });
        }

        if (content.authorId !== req.user.id) {
            return res.status(403).json({ success: false, message: '라이브 스트리밍 권한이 없습니다.' });
        }

        content.isLive = true;
        content.liveData = {
            ...content.liveData,
            streamUrl,
            startTime: new Date(),
            viewers: 0,
            isRecording: true
        };
        content.updatedAt = new Date();
        contentStore.set(id, content);

        res.json({
            success: true,
            message: '라이브 스트리밍이 시작되었습니다.',
            data: content.liveData
        });
    } catch (error) {
        console.error('라이브 스트리밍 시작 오류:', error);
        res.status(500).json({ success: false, message: '라이브 스트리밍 시작 중 오류가 발생했습니다.' });
    }
});

// 라이브 스트리밍 종료
router.post('/:id/live/stop', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;

        const content = contentStore.get(id);
        if (!content) {
            return res.status(404).json({ success: false, message: '컨텐츠를 찾을 수 없습니다.' });
        }

        if (content.authorId !== req.user.id) {
            return res.status(403).json({ success: false, message: '라이브 스트리밍 권한이 없습니다.' });
        }

        content.isLive = false;
        content.liveData = {
            ...content.liveData,
            endTime: new Date(),
            isRecording: false
        };
        content.updatedAt = new Date();
        contentStore.set(id, content);

        res.json({
            success: true,
            message: '라이브 스트리밍이 종료되었습니다.',
            data: content.liveData
        });
    } catch (error) {
        console.error('라이브 스트리밍 종료 오류:', error);
        res.status(500).json({ success: false, message: '라이브 스트리밍 종료 중 오류가 발생했습니다.' });
    }
});

// 컨텐츠 통계
router.get('/:id/analytics', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const content = contentStore.get(id);

        if (!content) {
            return res.status(404).json({ success: false, message: '컨텐츠를 찾을 수 없습니다.' });
        }

        res.json({
            success: true,
            data: {
                engagement: content.engagement,
                analytics: content.analytics,
                liveData: content.liveData,
                createdAt: content.createdAt,
                updatedAt: content.updatedAt
            }
        });
    } catch (error) {
        console.error('컨텐츠 통계 조회 오류:', error);
        res.status(500).json({ success: false, message: '컨텐츠 통계 조회 중 오류가 발생했습니다.' });
    }
});

// 헬퍼 함수들
async function processMediaFile(file) {
    const filePath = file.path;
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const mediaType = getMediaType(fileExtension);

    let thumbnail = null;
    let duration = null;
    let width = null;
    let height = null;

    // 이미지/비디오 썸네일 생성
    if (mediaType === 'image' || mediaType === 'video') {
        try {
            const thumbnailPath = filePath.replace(fileExtension, '_thumb.jpg');
            await sharp(filePath)
                .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 80 })
                .toFile(thumbnailPath);
            thumbnail = thumbnailPath;
        } catch (error) {
            console.error('썸네일 생성 오류:', error);
        }
    }

    // 비디오 메타데이터 추출
    if (mediaType === 'video') {
        // 실제로는 ffprobe 등을 사용하여 메타데이터 추출
        duration = 0;
        width = 1920;
        height = 1080;
    }

    return {
        type: mediaType,
        url: filePath,
        thumbnail,
        duration,
        size: file.size,
        width,
        height,
        metadata: {
            originalName: file.originalname,
            mimetype: file.mimetype,
            uploadedAt: new Date()
        }
    };
}

function getMediaType(extension) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'];
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.aac'];
    const documentExtensions = ['.pdf', '.doc', '.docx', '.txt', '.md'];

    if (imageExtensions.includes(extension)) return 'image';
    if (videoExtensions.includes(extension)) return 'video';
    if (audioExtensions.includes(extension)) return 'audio';
    if (documentExtensions.includes(extension)) return 'document';
    return 'file';
}

function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
}

module.exports = router;

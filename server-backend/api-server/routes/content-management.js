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
        const uploadPath = path.join(__dirname, '../../uploads/content');
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
        fileSize: 50 * 1024 * 1024, // 50MB
        files: 10
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|avi|mov|pdf|doc|docx|txt|md/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('지원하지 않는 파일 형식입니다.'));
        }
    }
});

// 컨텐츠 스키마 (실제로는 데이터베이스 모델 사용)
const contentSchema = {
    id: String,
    title: String,
    content: String,
    type: String, // 'post', 'page', 'article', 'media'
    status: String, // 'draft', 'published', 'archived', 'deleted'
    author: String,
    category: String,
    tags: [String],
    featuredImage: String,
    attachments: [String],
    seoTitle: String,
    seoDescription: String,
    seoKeywords: [String],
    publishDate: Date,
    lastModified: Date,
    viewCount: Number,
    likeCount: Number,
    commentCount: Number,
    shareCount: Number,
    isFeatured: Boolean,
    isPinned: Boolean,
    allowComments: Boolean,
    allowSharing: Boolean,
    visibility: String, // 'public', 'private', 'members', 'premium'
    accessLevel: Number, // 0-10
    customFields: Object,
    version: Number,
    parentId: String, // for revisions
    language: String,
    translations: [String],
    createdAt: Date,
    updatedAt: Date
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
    req.user = { id: 'user1', role: 'admin' };
    next();
};

// 미들웨어: 권한 확인
const checkPermission = (permission) => {
    return (req, res, next) => {
        const userRole = req.user?.role;
        const permissions = {
            'admin': ['create', 'read', 'update', 'delete', 'publish', 'moderate'],
            'editor': ['create', 'read', 'update', 'publish'],
            'author': ['create', 'read', 'update'],
            'viewer': ['read']
        };

        if (permissions[userRole]?.includes(permission)) {
            next();
        } else {
            res.status(403).json({ success: false, message: '권한이 없습니다.' });
        }
    };
};

// 컨텐츠 목록 조회
router.get('/', authenticateUser, checkPermission('read'), async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            type,
            status,
            category,
            author,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            featured,
            pinned
        } = req.query;

        let contents = Array.from(contentStore.values());

        // 필터링
        if (type) contents = contents.filter(c => c.type === type);
        if (status) contents = contents.filter(c => c.status === status);
        if (category) contents = contents.filter(c => c.category === category);
        if (author) contents = contents.filter(c => c.author === author);
        if (featured !== undefined) contents = contents.filter(c => c.isFeatured === (featured === 'true'));
        if (pinned !== undefined) contents = contents.filter(c => c.isPinned === (pinned === 'true'));

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
router.get('/:id', authenticateUser, checkPermission('read'), async (req, res) => {
    try {
        const { id } = req.params;
        const content = contentStore.get(id);

        if (!content) {
            return res.status(404).json({ success: false, message: '컨텐츠를 찾을 수 없습니다.' });
        }

        // 조회수 증가
        content.viewCount = (content.viewCount || 0) + 1;
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
router.post('/', authenticateUser, checkPermission('create'), async (req, res) => {
    try {
        const {
            title,
            content,
            type = 'post',
            category,
            tags = [],
            seoTitle,
            seoDescription,
            seoKeywords = [],
            visibility = 'public',
            accessLevel = 0,
            customFields = {},
            language = 'ko',
            allowComments = true,
            allowSharing = true
        } = req.body;

        if (!title || !content) {
            return res.status(400).json({ success: false, message: '제목과 내용은 필수입니다.' });
        }

        const now = new Date();
        const newContent = {
            id: `content_${contentIdCounter++}`,
            title,
            content,
            type,
            status: 'draft',
            author: req.user.id,
            category,
            tags,
            seoTitle: seoTitle || title,
            seoDescription,
            seoKeywords,
            publishDate: null,
            lastModified: now,
            viewCount: 0,
            likeCount: 0,
            commentCount: 0,
            shareCount: 0,
            isFeatured: false,
            isPinned: false,
            allowComments,
            allowSharing,
            visibility,
            accessLevel,
            customFields,
            version: 1,
            parentId: null,
            language,
            translations: [],
            createdAt: now,
            updatedAt: now
        };

        contentStore.set(newContent.id, newContent);

        res.status(201).json({
            success: true,
            message: '컨텐츠가 생성되었습니다.',
            data: newContent
        });
    } catch (error) {
        console.error('컨텐츠 생성 오류:', error);
        res.status(500).json({ success: false, message: '컨텐츠 생성 중 오류가 발생했습니다.' });
    }
});

// 컨텐츠 수정
router.put('/:id', authenticateUser, checkPermission('update'), async (req, res) => {
    try {
        const { id } = req.params;
        const existingContent = contentStore.get(id);

        if (!existingContent) {
            return res.status(404).json({ success: false, message: '컨텐츠를 찾을 수 없습니다.' });
        }

        // 작성자 또는 관리자만 수정 가능
        if (existingContent.author !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: '수정 권한이 없습니다.' });
        }

        const updates = req.body;
        const updatedContent = {
            ...existingContent,
            ...updates,
            id: existingContent.id, // ID는 변경 불가
            author: existingContent.author, // 작성자는 변경 불가
            createdAt: existingContent.createdAt, // 생성일은 변경 불가
            lastModified: new Date(),
            version: existingContent.version + 1
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
router.delete('/:id', authenticateUser, checkPermission('delete'), async (req, res) => {
    try {
        const { id } = req.params;
        const content = contentStore.get(id);

        if (!content) {
            return res.status(404).json({ success: false, message: '컨텐츠를 찾을 수 없습니다.' });
        }

        // 작성자 또는 관리자만 삭제 가능
        if (content.author !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: '삭제 권한이 없습니다.' });
        }

        // 실제로는 soft delete
        content.status = 'deleted';
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

// 컨텐츠 상태 변경
router.patch('/:id/status', authenticateUser, checkPermission('publish'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['draft', 'published', 'archived', 'deleted'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: '유효하지 않은 상태입니다.' });
        }

        const content = contentStore.get(id);
        if (!content) {
            return res.status(404).json({ success: false, message: '컨텐츠를 찾을 수 없습니다.' });
        }

        content.status = status;
        if (status === 'published') {
            content.publishDate = new Date();
        }
        content.lastModified = new Date();
        contentStore.set(id, content);

        res.json({
            success: true,
            message: `컨텐츠 상태가 ${status}로 변경되었습니다.`,
            data: content
        });
    } catch (error) {
        console.error('컨텐츠 상태 변경 오류:', error);
        res.status(500).json({ success: false, message: '컨텐츠 상태 변경 중 오류가 발생했습니다.' });
    }
});

// 파일 업로드
router.post('/upload', authenticateUser, checkPermission('create'), upload.array('files', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: '업로드할 파일이 없습니다.' });
        }

        const uploadedFiles = [];
        const uploadDir = path.join(__dirname, '../../uploads/content');

        // 업로드 디렉토리 생성
        await fs.mkdir(uploadDir, { recursive: true });

        for (const file of req.files) {
            const filePath = path.join(uploadDir, file.filename);
            let thumbnailPath = null;

            // 이미지 파일인 경우 썸네일 생성
            if (file.mimetype.startsWith('image/')) {
                const thumbnailName = `thumb_${file.filename}`;
                thumbnailPath = path.join(uploadDir, thumbnailName);

                await sharp(filePath)
                    .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
                    .jpeg({ quality: 80 })
                    .toFile(thumbnailPath);
            }

            uploadedFiles.push({
                id: uuidv4(),
                originalName: file.originalname,
                filename: file.filename,
                path: filePath,
                thumbnailPath,
                mimetype: file.mimetype,
                size: file.size,
                uploadedAt: new Date()
            });
        }

        res.json({
            success: true,
            message: `${uploadedFiles.length}개 파일이 업로드되었습니다.`,
            data: uploadedFiles
        });
    } catch (error) {
        console.error('파일 업로드 오류:', error);
        res.status(500).json({ success: false, message: '파일 업로드 중 오류가 발생했습니다.' });
    }
});

// 컨텐츠 통계
router.get('/stats/overview', authenticateUser, checkPermission('read'), async (req, res) => {
    try {
        const contents = Array.from(contentStore.values());

        const stats = {
            total: contents.length,
            published: contents.filter(c => c.status === 'published').length,
            draft: contents.filter(c => c.status === 'draft').length,
            archived: contents.filter(c => c.status === 'archived').length,
            deleted: contents.filter(c => c.status === 'deleted').length,
            featured: contents.filter(c => c.isFeatured).length,
            pinned: contents.filter(c => c.isPinned).length,
            totalViews: contents.reduce((sum, c) => sum + (c.viewCount || 0), 0),
            totalLikes: contents.reduce((sum, c) => sum + (c.likeCount || 0), 0),
            totalComments: contents.reduce((sum, c) => sum + (c.commentCount || 0), 0),
            totalShares: contents.reduce((sum, c) => sum + (c.shareCount || 0), 0),
            byType: contents.reduce((acc, c) => {
                acc[c.type] = (acc[c.type] || 0) + 1;
                return acc;
            }, {}),
            byCategory: contents.reduce((acc, c) => {
                if (c.category) {
                    acc[c.category] = (acc[c.category] || 0) + 1;
                }
                return acc;
            }, {}),
            byAuthor: contents.reduce((acc, c) => {
                acc[c.author] = (acc[c.author] || 0) + 1;
                return acc;
            }, {}),
            recentActivity: contents
                .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
                .slice(0, 10)
                .map(c => ({
                    id: c.id,
                    title: c.title,
                    type: c.type,
                    status: c.status,
                    author: c.author,
                    lastModified: c.lastModified
                }))
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('컨텐츠 통계 조회 오류:', error);
        res.status(500).json({ success: false, message: '컨텐츠 통계 조회 중 오류가 발생했습니다.' });
    }
});

// 컨텐츠 검색
router.get('/search/advanced', authenticateUser, checkPermission('read'), async (req, res) => {
    try {
        const {
            query,
            type,
            status,
            category,
            author,
            dateFrom,
            dateTo,
            tags,
            sortBy = 'relevance',
            page = 1,
            limit = 20
        } = req.query;

        let contents = Array.from(contentStore.values());

        // 기본 필터링
        if (type) contents = contents.filter(c => c.type === type);
        if (status) contents = contents.filter(c => c.status === status);
        if (category) contents = contents.filter(c => c.category === category);
        if (author) contents = contents.filter(c => c.author === author);
        if (dateFrom) contents = contents.filter(c => new Date(c.createdAt) >= new Date(dateFrom));
        if (dateTo) contents = contents.filter(c => new Date(c.createdAt) <= new Date(dateTo));
        if (tags) {
            const tagList = tags.split(',').map(t => t.trim());
            contents = contents.filter(c => tagList.some(tag => c.tags.includes(tag)));
        }

        // 검색 쿼리 처리
        if (query) {
            const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
            contents = contents.filter(content => {
                const searchableText = `${content.title} ${content.content} ${content.seoDescription} ${content.tags.join(' ')}`.toLowerCase();
                return searchTerms.every(term => searchableText.includes(term));
            });

            // 관련도 점수 계산
            contents = contents.map(content => {
                let score = 0;
                const searchableText = `${content.title} ${content.content} ${content.seoDescription} ${content.tags.join(' ')}`.toLowerCase();

                searchTerms.forEach(term => {
                    // 제목에서 매치 (높은 점수)
                    if (content.title.toLowerCase().includes(term)) score += 10;
                    // 태그에서 매치 (중간 점수)
                    if (content.tags.some(tag => tag.toLowerCase().includes(term))) score += 5;
                    // 내용에서 매치 (낮은 점수)
                    if (content.content.toLowerCase().includes(term)) score += 1;
                });

                return { ...content, relevanceScore: score };
            });

            // 관련도 순으로 정렬
            if (sortBy === 'relevance') {
                contents.sort((a, b) => b.relevanceScore - a.relevanceScore);
            }
        }

        // 기타 정렬
        if (sortBy !== 'relevance') {
            contents.sort((a, b) => {
                const aVal = a[sortBy];
                const bVal = b[sortBy];
                return aVal > bVal ? -1 : 1;
            });
        }

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
                },
                searchInfo: {
                    query,
                    totalResults: contents.length,
                    searchTime: Date.now()
                }
            }
        });
    } catch (error) {
        console.error('고급 검색 오류:', error);
        res.status(500).json({ success: false, message: '검색 중 오류가 발생했습니다.' });
    }
});

// 컨텐츠 버전 관리
router.get('/:id/versions', authenticateUser, checkPermission('read'), async (req, res) => {
    try {
        const { id } = req.params;
        const content = contentStore.get(id);

        if (!content) {
            return res.status(404).json({ success: false, message: '컨텐츠를 찾을 수 없습니다.' });
        }

        // 실제로는 버전 히스토리를 데이터베이스에서 조회
        const versions = [
            {
                version: content.version,
                title: content.title,
                content: content.content,
                modifiedBy: content.author,
                modifiedAt: content.lastModified,
                isCurrent: true
            }
        ];

        res.json({
            success: true,
            data: versions
        });
    } catch (error) {
        console.error('컨텐츠 버전 조회 오류:', error);
        res.status(500).json({ success: false, message: '컨텐츠 버전 조회 중 오류가 발생했습니다.' });
    }
});

// 컨텐츠 복원
router.post('/:id/restore', authenticateUser, checkPermission('update'), async (req, res) => {
    try {
        const { id } = req.params;
        const { version } = req.body;

        const content = contentStore.get(id);
        if (!content) {
            return res.status(404).json({ success: false, message: '컨텐츠를 찾을 수 없습니다.' });
        }

        // 실제로는 특정 버전으로 복원
        content.status = 'draft';
        content.lastModified = new Date();
        contentStore.set(id, content);

        res.json({
            success: true,
            message: '컨텐츠가 복원되었습니다.',
            data: content
        });
    } catch (error) {
        console.error('컨텐츠 복원 오류:', error);
        res.status(500).json({ success: false, message: '컨텐츠 복원 중 오류가 발생했습니다.' });
    }
});

module.exports = router;

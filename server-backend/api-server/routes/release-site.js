const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const router = express.Router();

// Multer 설정 (릴리즈 파일 업로드)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../releases');
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${req.body.version}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB
        files: 10
    }
});

// 릴리즈 스키마
const releaseSchema = {
    id: String,
    version: String,
    versionType: String, // 'major', 'minor', 'patch', 'beta', 'alpha', 'rc'
    title: String,
    description: String,
    releaseNotes: String,
    changelog: [{
        type: String, // 'feature', 'bugfix', 'breaking', 'security', 'performance'
        description: String,
        category: String,
        priority: String // 'high', 'medium', 'low'
    }],
    files: [{
        name: String,
        url: String,
        size: Number,
        checksum: String,
        platform: String, // 'windows', 'macos', 'linux', 'android', 'ios', 'web'
        architecture: String, // 'x64', 'x86', 'arm64', 'universal'
        fileType: String, // 'executable', 'installer', 'archive', 'source'
        downloadCount: Number,
        uploadedAt: Date
    }],
    status: String, // 'draft', 'staging', 'released', 'deprecated', 'cancelled'
    releaseDate: Date,
    endOfLife: Date,
    isPrerelease: Boolean,
    isDraft: Boolean,
    isLatest: Boolean,
    isStable: Boolean,
    downloadCount: Number,
    installCount: Number,
    rating: Number,
    reviews: [{
        userId: String,
        userName: String,
        rating: Number,
        comment: String,
        createdAt: Date,
        isVerified: Boolean
    }],
    dependencies: {
        minOSVersion: String,
        minRAM: Number,
        minStorage: Number,
        requiredSoftware: [String],
        optionalSoftware: [String]
    },
    security: {
        isSigned: Boolean,
        signature: String,
        vulnerabilityScan: {
            status: String,
            lastScan: Date,
            issues: [String]
        }
    },
    deployment: {
        environments: [String], // 'development', 'staging', 'production'
        regions: [String],
        rolloutPercentage: Number,
        autoDeploy: Boolean,
        rollbackVersion: String
    },
    metrics: {
        downloads: {
            total: Number,
            daily: Number,
            weekly: Number,
            monthly: Number,
            byPlatform: Object,
            byRegion: Object
        },
        installations: {
            total: Number,
            successful: Number,
            failed: Number,
            byPlatform: Object
        },
        feedback: {
            bugReports: Number,
            featureRequests: Number,
            supportTickets: Number
        }
    },
    createdAt: Date,
    updatedAt: Date,
    createdBy: String,
    publishedBy: String,
    publishedAt: Date
};

// 임시 저장소 (실제로는 데이터베이스 사용)
let releaseStore = new Map();
let releaseIdCounter = 1;

// 미들웨어: 인증 확인
const authenticateUser = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ success: false, message: '인증이 필요합니다.' });
    }
    // 실제로는 JWT 토큰 검증
    req.user = { id: 'user1', role: 'admin', username: 'admin' };
    next();
};

// 릴리즈 목록 조회
router.get('/', async (req, res) => {
    try {
        const {
            status = 'released',
            platform,
            versionType,
            isLatest,
            isStable,
            isPrerelease,
            sortBy = 'releaseDate',
            sortOrder = 'desc',
            page = 1,
            limit = 20,
            search
        } = req.query;

        let releases = Array.from(releaseStore.values());

        // 필터링
        if (status) releases = releases.filter(r => r.status === status);
        if (platform) releases = releases.filter(r => r.files.some(f => f.platform === platform));
        if (versionType) releases = releases.filter(r => r.versionType === versionType);
        if (isLatest !== undefined) releases = releases.filter(r => r.isLatest === (isLatest === 'true'));
        if (isStable !== undefined) releases = releases.filter(r => r.isStable === (isStable === 'true'));
        if (isPrerelease !== undefined) releases = releases.filter(r => r.isPrerelease === (isPrerelease === 'true'));

        // 검색
        if (search) {
            const searchTerm = search.toLowerCase();
            releases = releases.filter(r =>
                r.version.toLowerCase().includes(searchTerm) ||
                r.title.toLowerCase().includes(searchTerm) ||
                r.description.toLowerCase().includes(searchTerm)
            );
        }

        // 정렬
        releases.sort((a, b) => {
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
        const paginatedReleases = releases.slice(startIndex, endIndex);

        res.json({
            success: true,
            data: {
                releases: paginatedReleases,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: releases.length,
                    pages: Math.ceil(releases.length / limit)
                }
            }
        });
    } catch (error) {
        console.error('릴리즈 목록 조회 오류:', error);
        res.status(500).json({ success: false, message: '릴리즈 목록 조회 중 오류가 발생했습니다.' });
    }
});

// 최신 릴리즈 조회
router.get('/latest', async (req, res) => {
    try {
        const { platform, stable = true } = req.query;

        let releases = Array.from(releaseStore.values())
            .filter(r => r.status === 'released');

        if (stable === 'true') {
            releases = releases.filter(r => r.isStable && !r.isPrerelease);
        }

        if (platform) {
            releases = releases.filter(r => r.files.some(f => f.platform === platform));
        }

        const latestRelease = releases.sort((a, b) =>
            new Date(b.releaseDate) - new Date(a.releaseDate)
        )[0];

        if (!latestRelease) {
            return res.status(404).json({ success: false, message: '릴리즈를 찾을 수 없습니다.' });
        }

        res.json({
            success: true,
            data: latestRelease
        });
    } catch (error) {
        console.error('최신 릴리즈 조회 오류:', error);
        res.status(500).json({ success: false, message: '최신 릴리즈 조회 중 오류가 발생했습니다.' });
    }
});

// 릴리즈 상세 조회
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const release = releaseStore.get(id);

        if (!release) {
            return res.status(404).json({ success: false, message: '릴리즈를 찾을 수 없습니다.' });
        }

        res.json({
            success: true,
            data: release
        });
    } catch (error) {
        console.error('릴리즈 상세 조회 오류:', error);
        res.status(500).json({ success: false, message: '릴리즈 상세 조회 중 오류가 발생했습니다.' });
    }
});

// 릴리즈 생성
router.post('/', authenticateUser, upload.array('files', 10), async (req, res) => {
    try {
        const {
            version,
            versionType = 'patch',
            title,
            description,
            releaseNotes,
            changelog = [],
            isPrerelease = false,
            isDraft = true,
            dependencies = {},
            security = {},
            deployment = {}
        } = req.body;

        if (!version || !title) {
            return res.status(400).json({
                success: false,
                message: '버전과 제목은 필수입니다.'
            });
        }

        // 파일 처리
        const files = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const fileInfo = await processReleaseFile(file);
                files.push(fileInfo);
            }
        }

        const now = new Date();
        const releaseId = `release_${releaseIdCounter++}`;

        const newRelease = {
            id: releaseId,
            version,
            versionType,
            title,
            description,
            releaseNotes,
            changelog: Array.isArray(changelog) ? changelog : JSON.parse(changelog),
            files,
            status: isDraft ? 'draft' : 'staging',
            releaseDate: isDraft ? null : now,
            endOfLife: null,
            isPrerelease,
            isDraft,
            isLatest: false,
            isStable: !isPrerelease && versionType === 'patch',
            downloadCount: 0,
            installCount: 0,
            rating: 0,
            reviews: [],
            dependencies: {
                minOSVersion: '',
                minRAM: 0,
                minStorage: 0,
                requiredSoftware: [],
                optionalSoftware: [],
                ...dependencies
            },
            security: {
                isSigned: false,
                signature: '',
                vulnerabilityScan: {
                    status: 'pending',
                    lastScan: null,
                    issues: []
                },
                ...security
            },
            deployment: {
                environments: ['development'],
                regions: ['global'],
                rolloutPercentage: 100,
                autoDeploy: false,
                rollbackVersion: null,
                ...deployment
            },
            metrics: {
                downloads: {
                    total: 0,
                    daily: 0,
                    weekly: 0,
                    monthly: 0,
                    byPlatform: {},
                    byRegion: {}
                },
                installations: {
                    total: 0,
                    successful: 0,
                    failed: 0,
                    byPlatform: {}
                },
                feedback: {
                    bugReports: 0,
                    featureRequests: 0,
                    supportTickets: 0
                }
            },
            createdAt: now,
            updatedAt: now,
            createdBy: req.user.id,
            publishedBy: null,
            publishedAt: null
        };

        releaseStore.set(releaseId, newRelease);

        res.status(201).json({
            success: true,
            message: '릴리즈가 생성되었습니다.',
            data: newRelease
        });
    } catch (error) {
        console.error('릴리즈 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '릴리즈 생성 중 오류가 발생했습니다.'
        });
    }
});

// 릴리즈 발행
router.post('/:id/publish', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const release = releaseStore.get(id);

        if (!release) {
            return res.status(404).json({ success: false, message: '릴리즈를 찾을 수 없습니다.' });
        }

        if (release.status === 'released') {
            return res.status(400).json({ success: false, message: '이미 발행된 릴리즈입니다.' });
        }

        // 이전 최신 릴리즈 업데이트
        if (release.isLatest) {
            const previousLatest = Array.from(releaseStore.values())
                .find(r => r.isLatest && r.id !== id);
            if (previousLatest) {
                previousLatest.isLatest = false;
                releaseStore.set(previousLatest.id, previousLatest);
            }
        }

        release.status = 'released';
        release.isDraft = false;
        release.releaseDate = new Date();
        release.publishedBy = req.user.id;
        release.publishedAt = new Date();
        release.updatedAt = new Date();

        releaseStore.set(id, release);

        // 자동 배포 실행
        if (release.deployment.autoDeploy) {
            await executeAutoDeploy(release);
        }

        res.json({
            success: true,
            message: '릴리즈가 발행되었습니다.',
            data: release
        });
    } catch (error) {
        console.error('릴리즈 발행 오류:', error);
        res.status(500).json({ success: false, message: '릴리즈 발행 중 오류가 발생했습니다.' });
    }
});

// 다운로드 처리
router.get('/:id/download/:fileId', async (req, res) => {
    try {
        const { id, fileId } = req.params;
        const release = releaseStore.get(id);

        if (!release) {
            return res.status(404).json({ success: false, message: '릴리즈를 찾을 수 없습니다.' });
        }

        const file = release.files.find(f => f.name === fileId);
        if (!file) {
            return res.status(404).json({ success: false, message: '파일을 찾을 수 없습니다.' });
        }

        // 다운로드 수 증가
        file.downloadCount = (file.downloadCount || 0) + 1;
        release.downloadCount = (release.downloadCount || 0) + 1;
        releaseStore.set(id, release);

        // 파일 다운로드
        res.download(file.url, file.name);
    } catch (error) {
        console.error('파일 다운로드 오류:', error);
        res.status(500).json({ success: false, message: '파일 다운로드 중 오류가 발생했습니다.' });
    }
});

// 릴리즈 통계
router.get('/:id/stats', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const release = releaseStore.get(id);

        if (!release) {
            return res.status(404).json({ success: false, message: '릴리즈를 찾을 수 없습니다.' });
        }

        res.json({
            success: true,
            data: {
                metrics: release.metrics,
                downloadCount: release.downloadCount,
                installCount: release.installCount,
                rating: release.rating,
                reviews: release.reviews,
                createdAt: release.createdAt,
                releaseDate: release.releaseDate
            }
        });
    } catch (error) {
        console.error('릴리즈 통계 조회 오류:', error);
        res.status(500).json({ success: false, message: '릴리즈 통계 조회 중 오류가 발생했습니다.' });
    }
});

// 사용자 리뷰 추가
router.post('/:id/reviews', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;

        const release = releaseStore.get(id);
        if (!release) {
            return res.status(404).json({ success: false, message: '릴리즈를 찾을 수 없습니다.' });
        }

        const review = {
            userId: req.user.id,
            userName: req.user.username,
            rating: parseInt(rating),
            comment: comment || '',
            createdAt: new Date(),
            isVerified: false
        };

        release.reviews.push(review);

        // 평점 재계산
        const totalRating = release.reviews.reduce((sum, r) => sum + r.rating, 0);
        release.rating = totalRating / release.reviews.length;

        release.updatedAt = new Date();
        releaseStore.set(id, release);

        res.json({
            success: true,
            message: '리뷰가 추가되었습니다.',
            data: review
        });
    } catch (error) {
        console.error('리뷰 추가 오류:', error);
        res.status(500).json({ success: false, message: '리뷰 추가 중 오류가 발생했습니다.' });
    }
});

// 자동 배포 실행
async function executeAutoDeploy(release) {
    try {
        console.log(`자동 배포 시작: ${release.version}`);

        // 실제로는 CI/CD 파이프라인 실행
        // 예: GitHub Actions, Jenkins, GitLab CI 등

        for (const environment of release.deployment.environments) {
            console.log(`배포 환경: ${environment}`);
            // 배포 스크립트 실행
            // await execAsync(`deploy.sh ${release.version} ${environment}`);
        }

        console.log(`자동 배포 완료: ${release.version}`);
    } catch (error) {
        console.error('자동 배포 오류:', error);
    }
}

// 릴리즈 파일 처리
async function processReleaseFile(file) {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const platform = getPlatformFromFilename(file.originalname);
    const architecture = getArchitectureFromFilename(file.originalname);

    // 체크섬 계산 (실제로는 crypto 모듈 사용)
    const checksum = await calculateChecksum(file.path);

    return {
        name: file.originalname,
        url: file.path,
        size: file.size,
        checksum,
        platform,
        architecture,
        fileType: getFileType(fileExtension),
        downloadCount: 0,
        uploadedAt: new Date()
    };
}

function getPlatformFromFilename(filename) {
    const lower = filename.toLowerCase();
    if (lower.includes('win') || lower.includes('windows')) return 'windows';
    if (lower.includes('mac') || lower.includes('osx') || lower.includes('darwin')) return 'macos';
    if (lower.includes('linux')) return 'linux';
    if (lower.includes('android')) return 'android';
    if (lower.includes('ios') || lower.includes('iphone')) return 'ios';
    return 'web';
}

function getArchitectureFromFilename(filename) {
    const lower = filename.toLowerCase();
    if (lower.includes('x64') || lower.includes('amd64')) return 'x64';
    if (lower.includes('x86') || lower.includes('i386')) return 'x86';
    if (lower.includes('arm64') || lower.includes('aarch64')) return 'arm64';
    if (lower.includes('universal')) return 'universal';
    return 'x64';
}

function getFileType(extension) {
    const executableExtensions = ['.exe', '.app', '.deb', '.rpm', '.dmg'];
    const installerExtensions = ['.msi', '.pkg', '.dmg'];
    const archiveExtensions = ['.zip', '.tar.gz', '.7z', '.rar'];

    if (executableExtensions.includes(extension)) return 'executable';
    if (installerExtensions.includes(extension)) return 'installer';
    if (archiveExtensions.includes(extension)) return 'archive';
    return 'source';
}

async function calculateChecksum(filePath) {
    // 실제로는 crypto 모듈을 사용하여 SHA256 계산
    return 'sha256:' + Math.random().toString(36).substring(2, 15);
}

module.exports = router;

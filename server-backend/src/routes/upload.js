const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');

const router = express.Router();

// 업로드 디렉토리 생성
const uploadDir = path.join(__dirname, '../../uploads');
const thumbnailDir = path.join(uploadDir, 'thumbnails');

// 디렉토리 생성 함수
const ensureDir = async (dir) => {
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
};

// multer 설정
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        await ensureDir(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    // 허용된 파일 타입
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'text/csv',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('지원되지 않는 파일 형식입니다.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

// 썸네일 생성 함수
const generateThumbnail = async (filePath, filename) => {
    try {
        await ensureDir(thumbnailDir);

        const thumbnailPath = path.join(thumbnailDir, `thumb_${filename}`);

        await sharp(filePath)
            .resize(300, 300, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);

        return `/uploads/thumbnails/thumb_${filename}`;
    } catch (error) {
        console.error('썸네일 생성 실패:', error);
        return null;
    }
};

// 파일 정보 저장
const saveFileInfo = async (fileInfo) => {
    const filesInfoPath = path.join(uploadDir, 'files.json');

    try {
        let files = [];
        try {
            const data = await fs.readFile(filesInfoPath, 'utf8');
            files = JSON.parse(data);
        } catch {
            // 파일이 없으면 빈 배열로 시작
        }

        files.push(fileInfo);
        await fs.writeFile(filesInfoPath, JSON.stringify(files, null, 2));
    } catch (error) {
        console.error('파일 정보 저장 실패:', error);
    }
};

// 파일 정보 삭제
const deleteFileInfo = async (fileId) => {
    const filesInfoPath = path.join(uploadDir, 'files.json');

    try {
        let files = [];
        try {
            const data = await fs.readFile(filesInfoPath, 'utf8');
            files = JSON.parse(data);
        } catch {
            return false;
        }

        const updatedFiles = files.filter(file => file.id !== fileId);
        await fs.writeFile(filesInfoPath, JSON.stringify(updatedFiles, null, 2));
        return true;
    } catch (error) {
        console.error('파일 정보 삭제 실패:', error);
        return false;
    }
};

// 파일 업로드
router.post('/', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '파일이 선택되지 않았습니다.' });
        }

        const fileId = req.body.fileId || uuidv4();
        const filename = req.file.filename;
        const originalName = req.file.originalname;
        const filePath = req.file.path;
        const fileSize = req.file.size;
        const mimeType = req.file.mimetype;

        // 썸네일 생성 (이미지인 경우)
        let thumbnailUrl = null;
        if (mimeType.startsWith('image/')) {
            thumbnailUrl = await generateThumbnail(filePath, filename);
        }

        // 파일 정보 저장
        const fileInfo = {
            id: fileId,
            originalName: originalName,
            filename: filename,
            filePath: filePath,
            url: `/uploads/${filename}`,
            thumbnail: thumbnailUrl,
            size: fileSize,
            mimeType: mimeType,
            uploadedBy: req.user.id,
            uploadedAt: new Date().toISOString()
        };

        await saveFileInfo(fileInfo);

        res.json({
            success: true,
            file: {
                id: fileId,
                name: originalName,
                url: fileInfo.url,
                thumbnail: thumbnailUrl,
                size: fileSize,
                type: mimeType,
                uploadedAt: fileInfo.uploadedAt
            }
        });

    } catch (error) {
        console.error('파일 업로드 오류:', error);

        // 업로드된 파일이 있으면 삭제
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('파일 삭제 실패:', unlinkError);
            }
        }

        res.status(500).json({
            error: '파일 업로드 중 오류가 발생했습니다.',
            details: error.message
        });
    }
});

// 파일 다운로드
router.get('/:fileId', async (req, res) => {
    try {
        const filesInfoPath = path.join(uploadDir, 'files.json');
        const data = await fs.readFile(filesInfoPath, 'utf8');
        const files = JSON.parse(data);

        const file = files.find(f => f.id === req.params.fileId);
        if (!file) {
            return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
        }

        const filePath = path.join(uploadDir, file.filename);

        // 파일 존재 확인
        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({ error: '파일이 서버에 존재하지 않습니다.' });
        }

        res.download(filePath, file.originalName);
    } catch (error) {
        console.error('파일 다운로드 오류:', error);
        res.status(500).json({ error: '파일 다운로드 중 오류가 발생했습니다.' });
    }
});

// 파일 삭제
router.delete('/:fileId', auth, async (req, res) => {
    try {
        const filesInfoPath = path.join(uploadDir, 'files.json');
        const data = await fs.readFile(filesInfoPath, 'utf8');
        const files = JSON.parse(data);

        const file = files.find(f => f.id === req.params.fileId);
        if (!file) {
            return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
        }

        // 권한 확인 (업로드한 사용자만 삭제 가능)
        if (file.uploadedBy !== req.user.id) {
            return res.status(403).json({ error: '파일을 삭제할 권한이 없습니다.' });
        }

        // 파일 삭제
        const filePath = path.join(uploadDir, file.filename);
        try {
            await fs.unlink(filePath);
        } catch (error) {
            console.error('파일 삭제 실패:', error);
        }

        // 썸네일 삭제
        if (file.thumbnail) {
            const thumbnailPath = path.join(uploadDir, 'thumbnails', path.basename(file.thumbnail));
            try {
                await fs.unlink(thumbnailPath);
            } catch (error) {
                console.error('썸네일 삭제 실패:', error);
            }
        }

        // 파일 정보 삭제
        await deleteFileInfo(req.params.fileId);

        res.json({ success: true, message: '파일이 삭제되었습니다.' });
    } catch (error) {
        console.error('파일 삭제 오류:', error);
        res.status(500).json({ error: '파일 삭제 중 오류가 발생했습니다.' });
    }
});

// 파일 목록 조회
router.get('/', auth, async (req, res) => {
    try {
        const filesInfoPath = path.join(uploadDir, 'files.json');
        const data = await fs.readFile(filesInfoPath, 'utf8');
        const files = JSON.parse(data);

        // 사용자가 업로드한 파일만 필터링
        const userFiles = files.filter(file => file.uploadedBy === req.user.id);

        res.json({
            success: true,
            files: userFiles.map(file => ({
                id: file.id,
                name: file.originalName,
                url: file.url,
                thumbnail: file.thumbnail,
                size: file.size,
                type: file.mimeType,
                uploadedAt: file.uploadedAt
            }))
        });
    } catch (error) {
        console.error('파일 목록 조회 오류:', error);
        res.status(500).json({ error: '파일 목록 조회 중 오류가 발생했습니다.' });
    }
});

// 정적 파일 서빙
router.use('/uploads', express.static(uploadDir));

module.exports = router;

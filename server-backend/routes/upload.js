const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

/**
 * 파일 업로드 라우트
 */
module.exports = (db, redis) => {
    const router = express.Router();

    // 업로드 디렉토리 생성
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Multer 설정
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const uniqueName = `${uuidv4()}-${file.originalname}`;
            cb(null, uniqueName);
        }
    });

    const fileFilter = (req, file, cb) => {
        // 허용된 파일 타입
        const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt|mp4|mp3|zip/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('허용되지 않는 파일 형식입니다.'));
        }
    };

    const upload = multer({
        storage: storage,
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB
            files: 5 // 최대 5개 파일
        },
        fileFilter: fileFilter
    });

    /**
     * 파일 업로드
     */
    router.post('/', upload.array('files', 5), async (req, res) => {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: '업로드할 파일이 없습니다.'
                });
            }

            const { postId, commentId, userId } = req.body;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: '사용자 ID는 필수입니다.'
                });
            }

            const uploadedFiles = [];

            for (const file of req.files) {
                const attachmentId = uuidv4();
                const filePath = path.relative(path.join(__dirname, '..'), file.path);

                // 데이터베이스에 첨부파일 정보 저장
                await db.execute(
                    'INSERT INTO attachments (id, post_id, comment_id, user_id, filename, original_name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                        attachmentId,
                        postId || null,
                        commentId || null,
                        userId,
                        file.filename,
                        file.originalname,
                        filePath,
                        file.size,
                        file.mimetype
                    ]
                );

                uploadedFiles.push({
                    id: attachmentId,
                    filename: file.filename,
                    originalName: file.originalname,
                    filePath: filePath,
                    fileSize: file.size,
                    mimeType: file.mimetype,
                    url: `/uploads/${file.filename}`
                });
            }

            res.json({
                success: true,
                message: '파일이 업로드되었습니다.',
                data: {
                    files: uploadedFiles,
                    count: uploadedFiles.length
                }
            });

        } catch (error) {
            console.error('파일 업로드 오류:', error);

            // 업로드된 파일들 정리
            if (req.files) {
                req.files.forEach(file => {
                    try {
                        fs.unlinkSync(file.path);
                    } catch (unlinkError) {
                        console.error('파일 삭제 오류:', unlinkError);
                    }
                });
            }

            res.status(500).json({
                success: false,
                message: '파일 업로드 중 오류가 발생했습니다.'
            });
        }
    });

    /**
     * 첨부파일 목록 조회
     */
    router.get('/', async (req, res) => {
        try {
            const { postId, commentId, userId } = req.query;

            let query = 'SELECT * FROM attachments WHERE 1=1';
            const params = [];

            if (postId) {
                query += ' AND post_id = ?';
                params.push(postId);
            }

            if (commentId) {
                query += ' AND comment_id = ?';
                params.push(commentId);
            }

            if (userId) {
                query += ' AND user_id = ?';
                params.push(userId);
            }

            query += ' ORDER BY created_at DESC';

            const [attachments] = await db.execute(query, params);

            // URL 추가
            const attachmentsWithUrl = attachments.map(attachment => ({
                ...attachment,
                url: `/uploads/${attachment.filename}`
            }));

            res.json({
                success: true,
                data: attachmentsWithUrl
            });

        } catch (error) {
            console.error('첨부파일 목록 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    });

    /**
     * 첨부파일 삭제
     */
    router.delete('/:attachmentId', async (req, res) => {
        try {
            const { attachmentId } = req.params;

            // 첨부파일 정보 조회
            const [attachments] = await db.execute(
                'SELECT * FROM attachments WHERE id = ?',
                [attachmentId]
            );

            if (attachments.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '첨부파일을 찾을 수 없습니다.'
                });
            }

            const attachment = attachments[0];

            // 파일 삭제
            const filePath = path.join(__dirname, '..', attachment.file_path);
            try {
                fs.unlinkSync(filePath);
            } catch (unlinkError) {
                console.warn('파일 삭제 실패:', unlinkError.message);
            }

            // 데이터베이스에서 삭제
            await db.execute(
                'DELETE FROM attachments WHERE id = ?',
                [attachmentId]
            );

            res.json({
                success: true,
                message: '첨부파일이 삭제되었습니다.'
            });

        } catch (error) {
            console.error('첨부파일 삭제 오류:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    });

    /**
     * 파일 다운로드
     */
    router.get('/download/:filename', (req, res) => {
        try {
            const { filename } = req.params;
            const filePath = path.join(uploadDir, filename);

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    success: false,
                    message: '파일을 찾을 수 없습니다.'
                });
            }

            res.download(filePath, (err) => {
                if (err) {
                    console.error('파일 다운로드 오류:', err);
                    res.status(500).json({
                        success: false,
                        message: '파일 다운로드 중 오류가 발생했습니다.'
                    });
                }
            });

        } catch (error) {
            console.error('파일 다운로드 오류:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    });

    return router;
};

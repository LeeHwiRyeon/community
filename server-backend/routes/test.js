/**
 * 테스트 라우트
 * CSRF 토큰 시스템 수동 테스트를 위한 엔드포인트
 */

const express = require('express');
const router = express.Router();

/**
 * CSRF 보호가 필요한 테스트 엔드포인트
 * @route POST /api/test/protected
 * @access Public (CSRF 토큰 필요)
 */
router.post('/protected', (req, res) => {
    res.json({
        success: true,
        message: 'CSRF 검증 통과',
        data: req.body
    });
});

/**
 * CSRF 보호가 필요 없는 안전한 메서드
 * @route GET /api/test/safe
 * @access Public
 */
router.get('/safe', (req, res) => {
    res.json({
        success: true,
        message: 'GET 요청은 CSRF 검증 불필요'
    });
});

/**
 * PUT 테스트 엔드포인트
 * @route PUT /api/test/protected
 * @access Public (CSRF 토큰 필요)
 */
router.put('/protected', (req, res) => {
    res.json({
        success: true,
        message: 'PUT 요청 CSRF 검증 통과',
        data: req.body
    });
});

/**
 * DELETE 테스트 엔드포인트
 * @route DELETE /api/test/protected
 * @access Public (CSRF 토큰 필요)
 */
router.delete('/protected', (req, res) => {
    res.json({
        success: true,
        message: 'DELETE 요청 CSRF 검증 통과'
    });
});

module.exports = router;

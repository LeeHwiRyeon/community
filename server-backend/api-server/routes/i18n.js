const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

// 지원 언어 목록
const SUPPORTED_LANGUAGES = [
    { code: 'ko', name: '한국어', nativeName: '한국어', flag: '🇰🇷' },
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'ja', name: '日本語', nativeName: '日本語', flag: '🇯🇵' },
    { code: 'zh-CN', name: '中文 (简体)', nativeName: '中文 (简体)', flag: '🇨🇳' },
    { code: 'zh-TW', name: '中文 (繁體)', nativeName: '中文 (繁體)', flag: '🇹🇼' },
    { code: 'es', name: 'Español', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'ru', name: 'Русский', nativeName: 'Русский', flag: '🇷🇺' },
    { code: 'ar', name: 'العربية', nativeName: 'العربية', flag: '🇸🇦' }
];

// 번역 파일 경로
const LOCALES_PATH = path.join(__dirname, '../../../frontend/public/locales');

/**
 * @route GET /api/i18n/languages
 * @desc 지원 언어 목록 조회
 * @access Public
 */
router.get('/languages', async (req, res) => {
    try {
        logger.info('지원 언어 목록 조회');

        res.status(200).json({
            success: true,
            message: '지원 언어 목록을 성공적으로 조회했습니다.',
            data: SUPPORTED_LANGUAGES
        });
    } catch (error) {
        logger.error('지원 언어 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '지원 언어 목록 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * @route GET /api/i18n/translations/:language/:namespace
 * @desc 특정 언어의 네임스페이스 번역 조회
 * @access Public
 */
router.get('/translations/:language/:namespace', async (req, res) => {
    try {
        const { language, namespace } = req.params;

        // 지원 언어 확인
        if (!SUPPORTED_LANGUAGES.find(lang => lang.code === language)) {
            return res.status(400).json({
                success: false,
                message: '지원하지 않는 언어입니다.'
            });
        }

        // 번역 파일 경로
        const translationPath = path.join(LOCALES_PATH, language, `${namespace}.json`);

        try {
            const translationData = await fs.readFile(translationPath, 'utf8');
            const translations = JSON.parse(translationData);

            logger.info(`번역 조회: ${language}/${namespace}`);

            res.status(200).json({
                success: true,
                message: '번역을 성공적으로 조회했습니다.',
                data: {
                    language,
                    namespace,
                    translations
                }
            });
        } catch (fileError) {
            // 파일이 없는 경우 빈 객체 반환
            logger.warn(`번역 파일 없음: ${language}/${namespace}`);

            res.status(200).json({
                success: true,
                message: '번역 파일이 없습니다.',
                data: {
                    language,
                    namespace,
                    translations: {}
                }
            });
        }
    } catch (error) {
        logger.error('번역 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '번역 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * @route POST /api/i18n/translations/:language/:namespace
 * @desc 특정 언어의 네임스페이스 번역 저장
 * @access Private (Admin)
 */
router.post('/translations/:language/:namespace', async (req, res) => {
    try {
        const { language, namespace } = req.params;
        const { translations } = req.body;

        // 지원 언어 확인
        if (!SUPPORTED_LANGUAGES.find(lang => lang.code === language)) {
            return res.status(400).json({
                success: false,
                message: '지원하지 않는 언어입니다.'
            });
        }

        // 번역 데이터 유효성 검사
        if (!translations || typeof translations !== 'object') {
            return res.status(400).json({
                success: false,
                message: '유효하지 않은 번역 데이터입니다.'
            });
        }

        // 번역 파일 디렉토리 생성
        const languageDir = path.join(LOCALES_PATH, language);
        await fs.mkdir(languageDir, { recursive: true });

        // 번역 파일 저장
        const translationPath = path.join(languageDir, `${namespace}.json`);
        await fs.writeFile(translationPath, JSON.stringify(translations, null, 2), 'utf8');

        logger.info(`번역 저장: ${language}/${namespace}`);

        res.status(200).json({
            success: true,
            message: '번역이 성공적으로 저장되었습니다.',
            data: {
                language,
                namespace,
                keyCount: Object.keys(translations).length
            }
        });
    } catch (error) {
        logger.error('번역 저장 오류:', error);
        res.status(500).json({
            success: false,
            message: '번역 저장 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * @route GET /api/i18n/translations/:language
 * @desc 특정 언어의 모든 번역 조회
 * @access Public
 */
router.get('/translations/:language', async (req, res) => {
    try {
        const { language } = req.params;

        // 지원 언어 확인
        if (!SUPPORTED_LANGUAGES.find(lang => lang.code === language)) {
            return res.status(400).json({
                success: false,
                message: '지원하지 않는 언어입니다.'
            });
        }

        const languageDir = path.join(LOCALES_PATH, language);
        const allTranslations = {};

        try {
            const files = await fs.readdir(languageDir);
            const jsonFiles = files.filter(file => file.endsWith('.json'));

            for (const file of jsonFiles) {
                const namespace = file.replace('.json', '');
                const filePath = path.join(languageDir, file);
                const translationData = await fs.readFile(filePath, 'utf8');
                allTranslations[namespace] = JSON.parse(translationData);
            }

            logger.info(`모든 번역 조회: ${language}`);

            res.status(200).json({
                success: true,
                message: '모든 번역을 성공적으로 조회했습니다.',
                data: {
                    language,
                    translations: allTranslations
                }
            });
        } catch (dirError) {
            logger.warn(`번역 디렉토리 없음: ${language}`);

            res.status(200).json({
                success: true,
                message: '번역 디렉토리가 없습니다.',
                data: {
                    language,
                    translations: {}
                }
            });
        }
    } catch (error) {
        logger.error('모든 번역 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '모든 번역 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * @route GET /api/i18n/stats
 * @desc 번역 통계 조회
 * @access Public
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = {};

        for (const language of SUPPORTED_LANGUAGES) {
            const languageDir = path.join(LOCALES_PATH, language.code);
            stats[language.code] = {};

            try {
                const files = await fs.readdir(languageDir);
                const jsonFiles = files.filter(file => file.endsWith('.json'));

                for (const file of jsonFiles) {
                    const namespace = file.replace('.json', '');
                    const filePath = path.join(languageDir, file);
                    const translationData = await fs.readFile(filePath, 'utf8');
                    const translations = JSON.parse(translationData);

                    stats[language.code][namespace] = {
                        keyCount: Object.keys(translations).length,
                        lastModified: (await fs.stat(filePath)).mtime.toISOString()
                    };
                }
            } catch (dirError) {
                // 디렉토리가 없는 경우 빈 통계
                stats[language.code] = {};
            }
        }

        logger.info('번역 통계 조회');

        res.status(200).json({
            success: true,
            message: '번역 통계를 성공적으로 조회했습니다.',
            data: stats
        });
    } catch (error) {
        logger.error('번역 통계 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '번역 통계 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * @route POST /api/i18n/translate
 * @desc 자동 번역 (외부 API 연동)
 * @access Private (Admin)
 */
router.post('/translate', async (req, res) => {
    try {
        const { text, sourceLanguage, targetLanguage } = req.body;

        if (!text || !sourceLanguage || !targetLanguage) {
            return res.status(400).json({
                success: false,
                message: '번역할 텍스트, 원본 언어, 대상 언어가 필요합니다.'
            });
        }

        // 지원 언어 확인
        if (!SUPPORTED_LANGUAGES.find(lang => lang.code === sourceLanguage) ||
            !SUPPORTED_LANGUAGES.find(lang => lang.code === targetLanguage)) {
            return res.status(400).json({
                success: false,
                message: '지원하지 않는 언어입니다.'
            });
        }

        // 실제로는 Google Translate API나 다른 번역 서비스 사용
        // 여기서는 시뮬레이션
        const translations = {
            'ko': { 'en': 'Hello', 'ja': 'こんにちは', 'zh-CN': '你好' },
            'en': { 'ko': '안녕하세요', 'ja': 'こんにちは', 'zh-CN': '你好' },
            'ja': { 'ko': '안녕하세요', 'en': 'Hello', 'zh-CN': '你好' },
            'zh-CN': { 'ko': '안녕하세요', 'en': 'Hello', 'ja': 'こんにちは' }
        };

        const translatedText = translations[sourceLanguage]?.[targetLanguage] || text;

        logger.info(`자동 번역: ${sourceLanguage} -> ${targetLanguage}`);

        res.status(200).json({
            success: true,
            message: '번역이 완료되었습니다.',
            data: {
                originalText: text,
                translatedText,
                sourceLanguage,
                targetLanguage,
                confidence: 0.95 // 번역 신뢰도
            }
        });
    } catch (error) {
        logger.error('자동 번역 오류:', error);
        res.status(500).json({
            success: false,
            message: '자동 번역 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

/**
 * @route GET /api/i18n/missing-keys
 * @desc 누락된 번역 키 조회
 * @access Private (Admin)
 */
router.get('/missing-keys', async (req, res) => {
    try {
        const { language } = req.query;

        if (!language) {
            return res.status(400).json({
                success: false,
                message: '언어 코드가 필요합니다.'
            });
        }

        // 지원 언어 확인
        if (!SUPPORTED_LANGUAGES.find(lang => lang.code === language)) {
            return res.status(400).json({
                success: false,
                message: '지원하지 않는 언어입니다.'
            });
        }

        // 기본 언어(한국어)의 모든 키를 기준으로 누락된 키 찾기
        const baseLanguage = 'ko';
        const baseLanguageDir = path.join(LOCALES_PATH, baseLanguage);
        const targetLanguageDir = path.join(LOCALES_PATH, language);

        const missingKeys = {};

        try {
            const baseFiles = await fs.readdir(baseLanguageDir);
            const baseJsonFiles = baseFiles.filter(file => file.endsWith('.json'));

            for (const file of baseJsonFiles) {
                const namespace = file.replace('.json', '');
                const baseFilePath = path.join(baseLanguageDir, file);
                const baseTranslationData = await fs.readFile(baseFilePath, 'utf8');
                const baseTranslations = JSON.parse(baseTranslationData);

                const targetFilePath = path.join(targetLanguageDir, file);
                let targetTranslations = {};

                try {
                    const targetTranslationData = await fs.readFile(targetFilePath, 'utf8');
                    targetTranslations = JSON.parse(targetTranslationData);
                } catch (targetFileError) {
                    // 대상 언어 파일이 없는 경우
                }

                const missing = [];
                for (const key of Object.keys(baseTranslations)) {
                    if (!targetTranslations[key]) {
                        missing.push({
                            key,
                            baseValue: baseTranslations[key]
                        });
                    }
                }

                if (missing.length > 0) {
                    missingKeys[namespace] = missing;
                }
            }
        } catch (baseDirError) {
            logger.warn(`기본 언어 디렉토리 없음: ${baseLanguage}`);
        }

        logger.info(`누락된 번역 키 조회: ${language}`);

        res.status(200).json({
            success: true,
            message: '누락된 번역 키를 성공적으로 조회했습니다.',
            data: {
                language,
                missingKeys,
                totalMissing: Object.values(missingKeys).reduce((sum, keys) => sum + keys.length, 0)
            }
        });
    } catch (error) {
        logger.error('누락된 번역 키 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '누락된 번역 키 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

module.exports = router;

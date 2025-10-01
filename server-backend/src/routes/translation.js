import express from 'express';
import { translationService } from '../middleware/translation.js';
import { authenticateToken } from '../auth/jwt.js';

const router = express.Router();

/**
 * POST /api/translate
 * Translate text from one language to another
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { text, sourceLang = 'auto', targetLang = 'en', cache = true } = req.body;

        if (!text || typeof text !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Text is required and must be a string'
            });
        }

        if (text.trim().length === 0) {
            return res.json({
                success: true,
                translatedText: text,
                sourceLang: sourceLang,
                targetLang: targetLang
            });
        }

        const translatedText = await translationService.translate(text, targetLang, sourceLang);

        res.json({
            success: true,
            translatedText,
            sourceLang: sourceLang === 'auto' ? await translationService.detectLanguage(text) : sourceLang,
            targetLang
        });
    } catch (error) {
        console.error('Translation API error:', error);
        res.status(500).json({
            success: false,
            error: 'Translation failed',
            message: error.message
        });
    }
});

/**
 * POST /api/translate/detect
 * Detect language of input text
 */
router.post('/detect', authenticateToken, async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || typeof text !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Text is required and must be a string'
            });
        }

        if (text.trim().length === 0) {
            return res.json({
                success: true,
                language: 'en',
                confidence: 0
            });
        }

        const language = await translationService.detectLanguage(text);

        res.json({
            success: true,
            language,
            confidence: 1.0 // Google Translate doesn't provide confidence scores
        });
    } catch (error) {
        console.error('Language detection API error:', error);
        res.status(500).json({
            success: false,
            error: 'Language detection failed',
            message: error.message
        });
    }
});

/**
 * POST /api/translate/batch
 * Translate multiple texts in batch
 */
router.post('/batch', authenticateToken, async (req, res) => {
    try {
        const { texts, sourceLang = 'auto', targetLang = 'en', cache = true } = req.body;

        if (!Array.isArray(texts)) {
            return res.status(400).json({
                success: false,
                error: 'Texts must be an array'
            });
        }

        if (texts.length === 0) {
            return res.json({
                success: true,
                translatedTexts: [],
                sourceLang,
                targetLang
            });
        }

        // Limit batch size to prevent abuse
        if (texts.length > 100) {
            return res.status(400).json({
                success: false,
                error: 'Batch size cannot exceed 100 texts'
            });
        }

        const translatedTexts = await Promise.all(
            texts.map(text =>
                typeof text === 'string' && text.trim().length > 0
                    ? translationService.translate(text, targetLang, sourceLang)
                    : text
            )
        );

        res.json({
            success: true,
            translatedTexts,
            sourceLang,
            targetLang
        });
    } catch (error) {
        console.error('Batch translation API error:', error);
        res.status(500).json({
            success: false,
            error: 'Batch translation failed',
            message: error.message
        });
    }
});

/**
 * GET /api/translate/supported-languages
 * Get list of supported languages
 */
router.get('/supported-languages', (req, res) => {
    const supportedLanguages = [
        { code: 'ko', name: 'Korean', nativeName: '한국어' },
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'ja', name: 'Japanese', nativeName: '日本語' },
        { code: 'zh', name: 'Chinese', nativeName: '中文' },
        { code: 'es', name: 'Spanish', nativeName: 'Español' },
        { code: 'fr', name: 'French', nativeName: 'Français' },
        { code: 'de', name: 'German', nativeName: 'Deutsch' },
        { code: 'ru', name: 'Russian', nativeName: 'Русский' },
        { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
        { code: 'it', name: 'Italian', nativeName: 'Italiano' }
    ];

    res.json({
        success: true,
        languages: supportedLanguages
    });
});

/**
 * GET /api/translate/status
 * Get translation service status
 */
router.get('/status', (req, res) => {
    const isEnabled = process.env.TRANSLATION_ENABLED === 'true';
    const hasGoogleConfig = !!(process.env.GOOGLE_CLOUD_PROJECT_ID && process.env.GOOGLE_CLOUD_KEY_FILE);
    const hasLibreConfig = !!process.env.LIBRETRANSLATE_URL;

    res.json({
        success: true,
        enabled: isEnabled,
        services: {
            google: hasGoogleConfig,
            libre: hasLibreConfig
        },
        providers: hasGoogleConfig ? ['google', 'libre'] : ['libre']
    });
});

export default router;

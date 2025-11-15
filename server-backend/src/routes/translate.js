import express from 'express';
import { body, validationResult } from 'express-validator';
import { TranslationService } from '../middleware/translation.js';

const router = express.Router();
const translationService = new TranslationService();

// Translate text
router.post('/', [
    body('text').notEmpty().withMessage('Text is required'),
    body('target_lang').optional().isIn(['en', 'ko']).withMessage('Invalid target language'),
    body('source_lang').optional().isIn(['en', 'ko', 'auto']).withMessage('Invalid source language')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { text, target_lang = 'en', source_lang = 'auto' } = req.body;

        // Detect language if auto
        const detectedLang = source_lang === 'auto' ?
            await translationService.detectLanguage(text) : source_lang;

        // Translate text
        const translatedText = await translationService.translateWithGoogle(
            text,
            target_lang,
            detectedLang
        );

        res.json({
            success: true,
            data: {
                original_text: text,
                translated_text: translatedText,
                source_language: detectedLang,
                target_language: target_lang,
                confidence: 0.95 // Mock confidence score
            }
        });
    } catch (error) {
        console.error('Translation error:', error);
        res.status(500).json({ error: 'Translation failed' });
    }
});

// Detect language
router.post('/detect', [
    body('text').notEmpty().withMessage('Text is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { text } = req.body;
        const detectedLang = await translationService.detectLanguage(text);

        res.json({
            success: true,
            data: {
                text,
                detected_language: detectedLang,
                confidence: 0.95 // Mock confidence score
            }
        });
    } catch (error) {
        console.error('Language detection error:', error);
        res.status(500).json({ error: 'Language detection failed' });
    }
});

// Batch translate
router.post('/batch', [
    body('texts').isArray().withMessage('Texts must be an array'),
    body('target_lang').optional().isIn(['en', 'ko']).withMessage('Invalid target language'),
    body('source_lang').optional().isIn(['en', 'ko', 'auto']).withMessage('Invalid source language')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { texts, target_lang = 'en', source_lang = 'auto' } = req.body;

        if (!Array.isArray(texts) || texts.length === 0) {
            return res.status(400).json({ error: 'Texts array cannot be empty' });
        }

        if (texts.length > 100) {
            return res.status(400).json({ error: 'Maximum 100 texts allowed per batch' });
        }

        const results = [];

        for (const text of texts) {
            try {
                const detectedLang = source_lang === 'auto' ?
                    await translationService.detectLanguage(text) : source_lang;

                const translatedText = await translationService.translateWithGoogle(
                    text,
                    target_lang,
                    detectedLang
                );

                results.push({
                    original_text: text,
                    translated_text: translatedText,
                    source_language: detectedLang,
                    target_language: target_lang,
                    success: true
                });
            } catch (error) {
                results.push({
                    original_text: text,
                    translated_text: text, // Fallback to original
                    source_language: 'unknown',
                    target_language: target_lang,
                    success: false,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            data: {
                results,
                total: texts.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length
            }
        });
    } catch (error) {
        console.error('Batch translation error:', error);
        res.status(500).json({ error: 'Batch translation failed' });
    }
});

// Get supported languages
router.get('/languages', (req, res) => {
    res.json({
        success: true,
        data: {
            supported_languages: [
                { code: 'en', name: 'English', native_name: 'English' },
                { code: 'ko', name: 'Korean', native_name: '한국어' }
            ],
            auto_detect: true
        }
    });
});

// Get translation statistics
router.get('/stats', async (req, res) => {
    try {
        // Mock statistics - in real implementation, this would come from database
        res.json({
            success: true,
            data: {
                total_translations: 1250,
                languages_used: {
                    'en': 800,
                    'ko': 450
                },
                daily_average: 45,
                most_common_pairs: [
                    { from: 'ko', to: 'en', count: 300 },
                    { from: 'en', to: 'ko', count: 150 }
                ]
            }
        });
    } catch (error) {
        console.error('Translation stats error:', error);
        res.status(500).json({ error: 'Failed to fetch translation statistics' });
    }
});

export default router;

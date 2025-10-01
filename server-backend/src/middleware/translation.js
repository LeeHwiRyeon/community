import axios from 'axios';

class TranslationService {
    constructor() {
        // Simplified constructor without Google Cloud and Redis for now
        console.log('TranslationService initialized (simplified mode)');
    }

    /**
     * Detect language of input text (simplified)
     * @param {string} text - Text to detect language
     * @returns {Promise<string>} - Detected language code
     */
    async detectLanguage(text) {
        // Simple language detection based on character patterns
        const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text);
        const hasEnglish = /[a-zA-Z]/.test(text);

        if (hasKorean) return 'ko';
        if (hasEnglish) return 'en';
        return 'en'; // Default to English
    }

    /**
     * Translate text using LibreTranslate (simplified)
     * @param {string} text - Text to translate
     * @param {string} targetLang - Target language code
     * @param {string} sourceLang - Source language code (optional)
     * @returns {Promise<string>} - Translated text
     */
    async translateWithGoogle(text, targetLang, sourceLang = null) {
        // For now, just return the original text
        return text;
    }

    /**
     * Translate text using LibreTranslate (free alternative)
     * @param {string} text - Text to translate
     * @param {string} targetLang - Target language code
     * @param {string} sourceLang - Source language code
     * @returns {Promise<string>} - Translated text
     */
    async translateWithLibreTranslate(text, targetLang, sourceLang) {
        try {
            const response = await axios.post(process.env.LIBRETRANSLATE_URL || 'https://libretranslate.com/translate', {
                q: text,
                source: sourceLang,
                target: targetLang,
                format: 'text'
            });

            return response.data.translatedText;
        } catch (error) {
            console.error('LibreTranslate error:', error);
            throw error;
        }
    }

    /**
     * Get cached translation (simplified - no cache for now)
     * @param {string} text - Original text
     * @param {string} targetLang - Target language
     * @returns {Promise<string|null>} - Cached translation or null
     */
    async getCachedTranslation(text, targetLang) {
        return null; // No caching for now
    }

    /**
     * Cache translation result (simplified - no cache for now)
     * @param {string} text - Original text
     * @param {string} targetLang - Target language
     * @param {string} translation - Translated text
     * @returns {Promise<void>}
     */
    async cacheTranslation(text, targetLang, translation) {
        // No caching for now
    }

    /**
     * Main translation method with fallback and caching
     * @param {string} text - Text to translate
     * @param {string} targetLang - Target language code
     * @param {string} sourceLang - Source language code (optional)
     * @returns {Promise<string>} - Translated text
     */
    async translate(text, targetLang, sourceLang = null) {
        if (!text || text.trim().length === 0) {
            return text;
        }

        // Check cache first
        const cached = await this.getCachedTranslation(text, targetLang);
        if (cached) {
            return cached;
        }

        let translation = text;
        let error = null;

        try {
            // Try Google Translate first
            translation = await this.translateWithGoogle(text, targetLang, sourceLang);
        } catch (googleError) {
            error = googleError;
            console.warn('Google Translate failed, trying LibreTranslate:', googleError.message);

            try {
                // Fallback to LibreTranslate
                const detectedSourceLang = sourceLang || await this.detectLanguage(text);
                translation = await this.translateWithLibreTranslate(text, targetLang, detectedSourceLang);
            } catch (libreError) {
                console.error('All translation services failed:', libreError.message);
                // Return original text if all translation services fail
                return text;
            }
        }

        // Cache the result
        await this.cacheTranslation(text, targetLang, translation);

        return translation;
    }

    /**
     * Translate Korean input to English for processing
     * @param {string} koreanText - Korean text
     * @returns {Promise<string>} - English text
     */
    async translateKoreanToEnglish(koreanText) {
        return await this.translate(koreanText, 'en', 'ko');
    }

    /**
     * Translate English output to Korean for display
     * @param {string} englishText - English text
     * @returns {Promise<string>} - Korean text
     */
    async translateEnglishToKorean(englishText) {
        return await this.translate(englishText, 'ko', 'en');
    }
}

// Create singleton instance
const translationService = new TranslationService();

/**
 * Middleware to translate Korean input to English
 */
const translateInputMiddleware = async (req, res, next) => {
    try {
        // Check if translation is enabled
        if (process.env.TRANSLATION_ENABLED !== 'true') {
            return next();
        }

        // Translate request body if it contains Korean text
        if (req.body && typeof req.body === 'object') {
            const translatedBody = await translateObject(req.body, 'ko', 'en');
            req.body = translatedBody;
        }

        // Translate query parameters
        if (req.query && typeof req.query === 'object') {
            const translatedQuery = await translateObject(req.query, 'ko', 'en');
            req.query = translatedQuery;
        }

        next();
    } catch (error) {
        console.error('Input translation error:', error);
        next(); // Continue without translation on error
    }
};

/**
 * Middleware to translate English output to Korean
 */
const translateOutputMiddleware = async (req, res, next) => {
    try {
        // Check if translation is enabled
        if (process.env.TRANSLATION_ENABLED !== 'true') {
            return next();
        }

        // Store original json method
        const originalJson = res.json;

        // Override json method to translate response
        res.json = function (data) {
            if (data && typeof data === 'object') {
                translateObject(data, 'en', 'ko').then(translatedData => {
                    originalJson.call(this, translatedData);
                }).catch(error => {
                    console.error('Output translation error:', error);
                    originalJson.call(this, data); // Return original data on error
                });
            } else {
                originalJson.call(this, data);
            }
        };

        next();
    } catch (error) {
        console.error('Output translation middleware error:', error);
        next(); // Continue without translation on error
    }
};

/**
 * Recursively translate object properties
 * @param {any} obj - Object to translate
 * @param {string} sourceLang - Source language
 * @param {string} targetLang - Target language
 * @returns {Promise<any>} - Translated object
 */
async function translateObject(obj, sourceLang, targetLang) {
    if (typeof obj === 'string') {
        // Only translate if text contains Korean characters (for ko->en) or English (for en->ko)
        const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(obj);
        const hasEnglish = /[a-zA-Z]/.test(obj);

        if ((sourceLang === 'ko' && hasKorean) || (sourceLang === 'en' && hasEnglish)) {
            return await translationService.translate(obj, targetLang, sourceLang);
        }
        return obj;
    }

    if (Array.isArray(obj)) {
        return Promise.all(obj.map(item => translateObject(item, sourceLang, targetLang)));
    }

    if (obj && typeof obj === 'object') {
        const translatedObj = {};
        for (const [key, value] of Object.entries(obj)) {
            // Skip certain fields that shouldn't be translated
            if (['id', 'userId', 'postId', 'createdAt', 'updatedAt', 'email', 'password', 'token'].includes(key)) {
                translatedObj[key] = value;
            } else {
                translatedObj[key] = await translateObject(value, sourceLang, targetLang);
            }
        }
        return translatedObj;
    }

    return obj;
}

export {
    translationService,
    translateInputMiddleware,
    translateOutputMiddleware
};

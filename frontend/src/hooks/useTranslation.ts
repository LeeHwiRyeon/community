import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface TranslationOptions {
    sourceLang?: string;
    targetLang?: string;
    cache?: boolean;
}

interface TranslationResult {
    translatedText: string;
    isLoading: boolean;
    error: string | null;
}

/**
 * Custom hook for handling translations in the frontend
 * Provides Korean ↔ English translation functionality
 */
export const useTranslation = () => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Translate text using the backend translation service
     * @param text - Text to translate
     * @param options - Translation options
     * @returns Promise with translated text
     */
    const translate = useCallback(async (
        text: string,
        options: TranslationOptions = {}
    ): Promise<string> => {
        if (!text || text.trim().length === 0) {
            return text;
        }

        const {
            sourceLang = 'auto',
            targetLang = 'en',
            cache = true
        } = options;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': user?.token ? `Bearer ${user.token}` : ''
                },
                body: JSON.stringify({
                    text,
                    sourceLang,
                    targetLang,
                    cache
                })
            });

            if (!response.ok) {
                throw new Error(`Translation failed: ${response.statusText}`);
            }

            const data = await response.json();
            return data.translatedText || text;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Translation failed';
            setError(errorMessage);
            console.error('Translation error:', err);
            return text; // Return original text on error
        } finally {
            setIsLoading(false);
        }
    }, [user?.token]);

    /**
     * Translate Korean text to English
     * @param koreanText - Korean text to translate
     * @returns Promise with English text
     */
    const translateKoreanToEnglish = useCallback(async (koreanText: string): Promise<string> => {
        return translate(koreanText, { sourceLang: 'ko', targetLang: 'en' });
    }, [translate]);

    /**
     * Translate English text to Korean
     * @param englishText - English text to translate
     * @returns Promise with Korean text
     */
    const translateEnglishToKorean = useCallback(async (englishText: string): Promise<string> => {
        return translate(englishText, { sourceLang: 'en', targetLang: 'ko' });
    }, [translate]);

    /**
     * Detect language of input text
     * @param text - Text to detect language for
     * @returns Promise with detected language code
     */
    const detectLanguage = useCallback(async (text: string): Promise<string> => {
        try {
            const response = await fetch('/api/translate/detect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': user?.token ? `Bearer ${user.token}` : ''
                },
                body: JSON.stringify({ text })
            });

            if (!response.ok) {
                throw new Error(`Language detection failed: ${response.statusText}`);
            }

            const data = await response.json();
            return data.language || 'en';
        } catch (err) {
            console.error('Language detection error:', err);
            return 'en'; // Default to English
        }
    }, [user?.token]);

    /**
     * Batch translate multiple texts
     * @param texts - Array of texts to translate
     * @param options - Translation options
     * @returns Promise with array of translated texts
     */
    const batchTranslate = useCallback(async (
        texts: string[],
        options: TranslationOptions = {}
    ): Promise<string[]> => {
        if (!texts || texts.length === 0) {
            return texts;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/translate/batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': user?.token ? `Bearer ${user.token}` : ''
                },
                body: JSON.stringify({
                    texts,
                    ...options
                })
            });

            if (!response.ok) {
                throw new Error(`Batch translation failed: ${response.statusText}`);
            }

            const data = await response.json();
            return data.translatedTexts || texts;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Batch translation failed';
            setError(errorMessage);
            console.error('Batch translation error:', err);
            return texts; // Return original texts on error
        } finally {
            setIsLoading(false);
        }
    }, [user?.token]);

    return {
        translate,
        translateKoreanToEnglish,
        translateEnglishToKorean,
        detectLanguage,
        batchTranslate,
        isLoading,
        error
    };
};

/**
 * Hook for automatic translation of form inputs
 * Automatically translates Korean input to English for processing
 */
export const useAutoTranslation = (enabled: boolean = true) => {
    const { translateKoreanToEnglish } = useTranslation();
    const [translatedValues, setTranslatedValues] = useState<Record<string, string>>({});

    /**
     * Translate form field value
     * @param fieldName - Name of the form field
     * @param value - Value to translate
     */
    const translateField = useCallback(async (fieldName: string, value: string) => {
        if (!enabled || !value || value.trim().length === 0) {
            setTranslatedValues(prev => ({ ...prev, [fieldName]: value }));
            return;
        }

        // Check if value contains Korean characters
        const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(value);
        if (!hasKorean) {
            setTranslatedValues(prev => ({ ...prev, [fieldName]: value }));
            return;
        }

        try {
            const translated = await translateKoreanToEnglish(value);
            setTranslatedValues(prev => ({ ...prev, [fieldName]: translated }));
        } catch (error) {
            console.error(`Translation error for field ${fieldName}:`, error);
            setTranslatedValues(prev => ({ ...prev, [fieldName]: value }));
        }
    }, [enabled, translateKoreanToEnglish]);

    /**
     * Get translated value for a field
     * @param fieldName - Name of the form field
     * @returns Translated value or original value
     */
    const getTranslatedValue = useCallback((fieldName: string) => {
        return translatedValues[fieldName] || '';
    }, [translatedValues]);

    /**
     * Clear translated values
     */
    const clearTranslatedValues = useCallback(() => {
        setTranslatedValues({});
    }, []);

    return {
        translateField,
        getTranslatedValue,
        clearTranslatedValues,
        translatedValues
    };
};

export default useTranslation;

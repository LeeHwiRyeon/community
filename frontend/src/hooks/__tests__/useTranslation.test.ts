import { renderHook, act } from '@testing-library/react';
import { useTranslation, useAutoTranslation } from '../useTranslation';

// Mock fetch
global.fetch = jest.fn();

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
    console.error = jest.fn();
});

afterAll(() => {
    console.error = originalConsoleError;
});

describe('useTranslation', () => {
    beforeEach(() => {
        (fetch as jest.Mock).mockClear();
    });

    it('should initialize with default values', () => {
        const { result } = renderHook(() => useTranslation());

        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe(null);
    });

    it('should translate text successfully', async () => {
        const mockResponse = {
            success: true,
            translatedText: 'Hello',
            sourceLang: 'ko',
            targetLang: 'en'
        };

        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        });

        const { result } = renderHook(() => useTranslation());

        let translatedText: string;
        await act(async () => {
            translatedText = await result.current.translate('안녕하세요', {
                sourceLang: 'ko',
                targetLang: 'en'
            });
        });

        expect(translatedText!).toBe('Hello');
        expect(fetch).toHaveBeenCalledWith('/api/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': ''
            },
            body: JSON.stringify({
                text: '안녕하세요',
                sourceLang: 'ko',
                targetLang: 'en',
                cache: true
            })
        });
    });

    it('should handle translation errors', async () => {
        (fetch as jest.Mock).mockRejectedValueOnce(new Error('Translation failed'));

        const { result } = renderHook(() => useTranslation());

        let translatedText: string;
        await act(async () => {
            translatedText = await result.current.translate('안녕하세요');
        });

        expect(translatedText!).toBe('안녕하세요'); // Should return original text on error
        expect(result.current.error).toBe('Translation failed');
    });

    it('should handle empty text', async () => {
        const { result } = renderHook(() => useTranslation());

        let translatedText: string;
        await act(async () => {
            translatedText = await result.current.translate('');
        });

        expect(translatedText!).toBe('');
        expect(fetch).not.toHaveBeenCalled();
    });

    it('should translate Korean to English', async () => {
        const mockResponse = {
            success: true,
            translatedText: 'Hello',
            sourceLang: 'ko',
            targetLang: 'en'
        };

        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        });

        const { result } = renderHook(() => useTranslation());

        let translatedText: string;
        await act(async () => {
            translatedText = await result.current.translateKoreanToEnglish('안녕하세요');
        });

        expect(translatedText!).toBe('Hello');
    });

    it('should translate English to Korean', async () => {
        const mockResponse = {
            success: true,
            translatedText: '안녕하세요',
            sourceLang: 'en',
            targetLang: 'ko'
        };

        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        });

        const { result } = renderHook(() => useTranslation());

        let translatedText: string;
        await act(async () => {
            translatedText = await result.current.translateEnglishToKorean('Hello');
        });

        expect(translatedText!).toBe('안녕하세요');
    });

    it('should detect language', async () => {
        const mockResponse = {
            success: true,
            language: 'ko',
            confidence: 1.0
        };

        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        });

        const { result } = renderHook(() => useTranslation());

        let language: string;
        await act(async () => {
            language = await result.current.detectLanguage('안녕하세요');
        });

        expect(language!).toBe('ko');
    });

    it('should handle batch translation', async () => {
        const mockResponse = {
            success: true,
            translatedTexts: ['Hello', 'World'],
            sourceLang: 'ko',
            targetLang: 'en'
        };

        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        });

        const { result } = renderHook(() => useTranslation());

        let translatedTexts: string[];
        await act(async () => {
            translatedTexts = await result.current.batchTranslate(['안녕', '세상']);
        });

        expect(translatedTexts!).toEqual(['Hello', 'World']);
    });
});

describe('useAutoTranslation', () => {
    it('should initialize with empty translated values', () => {
        const { result } = renderHook(() => useAutoTranslation());

        expect(result.current.translatedValues).toEqual({});
    });

    it('should translate field with Korean text', async () => {
        const mockResponse = {
            success: true,
            translatedText: 'Hello',
            sourceLang: 'ko',
            targetLang: 'en'
        };

        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        });

        const { result } = renderHook(() => useAutoTranslation());

        await act(async () => {
            await result.current.translateField('title', '안녕하세요');
        });

        expect(result.current.translatedValues.title).toBe('Hello');
    });

    it('should not translate field with English text', async () => {
        const { result } = renderHook(() => useAutoTranslation());

        await act(async () => {
            await result.current.translateField('title', 'Hello');
        });

        expect(result.current.translatedValues.title).toBe('Hello');
    });

    it('should not translate when disabled', async () => {
        const { result } = renderHook(() => useAutoTranslation(false));

        await act(async () => {
            await result.current.translateField('title', '안녕하세요');
        });

        expect(result.current.translatedValues.title).toBe('안녕하세요');
    });

    it('should get translated value for field', () => {
        const { result } = renderHook(() => useAutoTranslation());

        act(() => {
            result.current.translatedValues.title = 'Hello';
        });

        expect(result.current.getTranslatedValue('title')).toBe('Hello');
    });

    it('should clear translated values', () => {
        const { result } = renderHook(() => useAutoTranslation());

        act(() => {
            result.current.translatedValues.title = 'Hello';
            result.current.translatedValues.content = 'World';
        });

        act(() => {
            result.current.clearTranslatedValues();
        });

        expect(result.current.translatedValues).toEqual({});
    });
});

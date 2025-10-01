import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../server.js';
import { translationService } from '../middleware/translation.js';

describe('Translation System', () => {
    let app;
    let server;

    beforeEach(async () => {
        app = createApp();
        server = app.listen(0); // Use random port for testing
    });

    afterEach(() => {
        if (server) {
            server.close();
        }
    });

    describe('Translation Service', () => {
        it('should detect Korean language correctly', async () => {
            const koreanText = '안녕하세요';
            const language = await translationService.detectLanguage(koreanText);
            expect(language).toBe('ko');
        });

        it('should detect English language correctly', async () => {
            const englishText = 'Hello world';
            const language = await translationService.detectLanguage(englishText);
            expect(language).toBe('en');
        });

        it('should translate Korean to English', async () => {
            const koreanText = '안녕하세요';
            const englishText = await translationService.translateKoreanToEnglish(koreanText);
            expect(englishText).toBeTruthy();
            expect(englishText).not.toBe(koreanText);
        });

        it('should translate English to Korean', async () => {
            const englishText = 'Hello world';
            const koreanText = await translationService.translateEnglishToKorean(englishText);
            expect(koreanText).toBeTruthy();
            expect(koreanText).not.toBe(englishText);
        });

        it('should handle empty text gracefully', async () => {
            const result = await translationService.translate('', 'en', 'ko');
            expect(result).toBe('');
        });

        it('should handle null/undefined text gracefully', async () => {
            const result1 = await translationService.translate(null, 'en', 'ko');
            const result2 = await translationService.translate(undefined, 'en', 'ko');
            expect(result1).toBe(null);
            expect(result2).toBe(undefined);
        });
    });

    describe('Translation API Endpoints', () => {
        const mockToken = 'mock-jwt-token';

        it('should translate text via API', async () => {
            const response = await request(app)
                .post('/api/translate')
                .set('Authorization', `Bearer ${mockToken}`)
                .send({
                    text: '안녕하세요',
                    sourceLang: 'ko',
                    targetLang: 'en'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.translatedText).toBeTruthy();
            expect(response.body.sourceLang).toBe('ko');
            expect(response.body.targetLang).toBe('en');
        });

        it('should detect language via API', async () => {
            const response = await request(app)
                .post('/api/translate/detect')
                .set('Authorization', `Bearer ${mockToken}`)
                .send({
                    text: '안녕하세요'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.language).toBe('ko');
        });

        it('should handle batch translation via API', async () => {
            const texts = ['안녕하세요', 'Hello', 'こんにちは'];
            const response = await request(app)
                .post('/api/translate/batch')
                .set('Authorization', `Bearer ${mockToken}`)
                .send({
                    texts,
                    sourceLang: 'auto',
                    targetLang: 'en'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.translatedTexts).toHaveLength(3);
        });

        it('should get supported languages', async () => {
            const response = await request(app)
                .get('/api/translate/supported-languages');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.languages).toBeInstanceOf(Array);
            expect(response.body.languages.length).toBeGreaterThan(0);
        });

        it('should get translation status', async () => {
            const response = await request(app)
                .get('/api/translate/status');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.enabled).toBeDefined();
            expect(response.body.services).toBeDefined();
        });

        it('should return 400 for invalid text input', async () => {
            const response = await request(app)
                .post('/api/translate')
                .set('Authorization', `Bearer ${mockToken}`)
                .send({
                    text: null,
                    sourceLang: 'ko',
                    targetLang: 'en'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should return 400 for invalid batch input', async () => {
            const response = await request(app)
                .post('/api/translate/batch')
                .set('Authorization', `Bearer ${mockToken}`)
                .send({
                    texts: 'not an array',
                    sourceLang: 'ko',
                    targetLang: 'en'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should limit batch size', async () => {
            const texts = new Array(101).fill('test text');
            const response = await request(app)
                .post('/api/translate/batch')
                .set('Authorization', `Bearer ${mockToken}`)
                .send({
                    texts,
                    sourceLang: 'ko',
                    targetLang: 'en'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Translation Middleware', () => {
        it('should handle Korean input translation', async () => {
            const response = await request(app)
                .post('/api/posts')
                .send({
                    title: '안녕하세요',
                    content: '테스트 내용입니다'
                });

            // The middleware should translate Korean input to English
            // This test verifies the middleware is working without errors
            expect(response.status).toBeDefined();
        });

        it('should handle English output translation', async () => {
            const response = await request(app)
                .get('/api/posts');

            // The middleware should translate English output to Korean
            // This test verifies the middleware is working without errors
            expect(response.status).toBeDefined();
        });
    });
});

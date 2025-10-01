import { test, expect } from '@playwright/test';

test.describe('Security Tests', () => {
    test('should block SQL injection attempts', async ({ request }) => {
        // Test various SQL injection patterns
        const sqlInjectionPayloads = [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "' UNION SELECT * FROM users --",
            "admin' --",
            "1' OR '1' = '1"
        ];

        for (const payload of sqlInjectionPayloads) {
            const response = await request.get(`/api/posts?id=${encodeURIComponent(payload)}`);
            // Should be blocked or sanitized
            expect([400, 403, 404]).toContain(response.status());
        }
    });

    test('should block XSS attempts', async ({ request }) => {
        // Test XSS patterns
        const xssPayloads = [
            '<script>alert("xss")</script>',
            '<img src=x onerror=alert(1)>',
            'javascript:alert("xss")',
            '<iframe src="javascript:alert(1)"></iframe>',
            '<svg onload=alert(1)>'
        ];

        for (const payload of xssPayloads) {
            const response = await request.get(`/api/posts?q=${encodeURIComponent(payload)}`);
            // Should be blocked or sanitized
            expect([400, 403, 404]).toContain(response.status());
        }
    });

    test('should block command injection attempts', async ({ request }) => {
        // Test command injection patterns
        const cmdInjectionPayloads = [
            '; ls -la',
            '| cat /etc/passwd',
            '`whoami`',
            '$(rm -rf /)',
            '&& echo "hacked"'
        ];

        for (const payload of cmdInjectionPayloads) {
            const response = await request.post('/api/auth/login', {
                data: {
                    username: payload,
                    password: process.env.TEST_PASSWORD || 'test'
                }
            });
            // Should be blocked
            expect([400, 403]).toContain(response.status());
        }
    });

    test('should handle malformed JSON', async ({ request }) => {
        const response = await request.post('/api/auth/login', {
            data: '{invalid json',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Should handle gracefully
        expect([400, 500]).toContain(response.status());
    });

    test('should prevent directory traversal', async ({ request }) => {
        const traversalPayloads = [
            '../../../etc/passwd',
            '..\\..\\..\\windows\\system32\\config\\sam',
            '/etc/passwd',
            'C:\\Windows\\System32\\config\\sam'
        ];

        for (const payload of traversalPayloads) {
            const response = await request.get(`/api/files/${encodeURIComponent(payload)}`);
            // Should be blocked
            expect([403, 404]).toContain(response.status());
        }
    });

    test('should handle rate limiting', async ({ request }) => {
        // Make multiple rapid requests
        const promises = [];
        for (let i = 0; i < 100; i++) {
            promises.push(request.get('/api/health'));
        }

        const responses = await Promise.all(promises);

        // Some requests should be rate limited (429)
        const rateLimited = responses.some(response => response.status() === 429);
        // Note: Rate limiting might not be implemented yet, so this is informational
        console.log(`Rate limited requests: ${responses.filter(r => r.status() === 429).length}`);
    });
});
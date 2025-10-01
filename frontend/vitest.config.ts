import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        coverage: {
            provider: 'c8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'src/test/',
                '**/*.d.ts',
                '**/*.config.*',
                '**/coverage/**',
                '**/dist/**',
                '**/build/**'
            ],
            thresholds: {
                global: {
                    branches: 90,
                    functions: 90,
                    lines: 90,
                    statements: 90
                }
            }
        },
        include: [
            'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
        ],
        exclude: [
            'node_modules',
            'dist',
            '.idea',
            '.git',
            '.cache'
        ]
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src')
        }
    }
});
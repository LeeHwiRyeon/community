import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    build: {
        // 빌드 최적화
        target: 'esnext',
        minify: 'esbuild',
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    ui: ['@mui/material'],
                    router: ['react-router-dom']
                },
                // 에셋 파일명 최적화
                assetFileNames: 'assets/[name].[hash].[ext]',
                chunkFileNames: 'assets/[name].[hash].js',
                entryFileNames: 'assets/[name].[hash].js',
            }
        },
        chunkSizeWarningLimit: 1000
    },
    server: {
        port: 5002,
        open: true,
        proxy: {
            '/api': {
                target: 'http://localhost:50000',
                changeOrigin: true
            }
        }
    },
    // 개발 서버 최적화
    optimizeDeps: {
        include: ['react', 'react-dom', '@mui/material'],
    },
    // CSS 최적화
    css: {
        devSourcemap: true,
    },
})

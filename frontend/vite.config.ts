import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    build: {
        // 빌드 최적화
        target: 'esnext',
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
            },
        },
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    ui: ['@chakra-ui/react', 'framer-motion'],
                    router: ['react-router-dom'],
                    query: ['@tanstack/react-query'],
                    charts: ['chart.js', 'react-chartjs-2']
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
        port: 3000,
        open: true,
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true
            }
        }
    },
    // 개발 서버 최적화
    optimizeDeps: {
        include: ['react', 'react-dom', '@chakra-ui/react'],
    },
    // CSS 최적화
    css: {
        devSourcemap: true,
    },
})

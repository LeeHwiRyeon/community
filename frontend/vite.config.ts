import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react({
        babel: {
            plugins: [['babel-plugin-react-compiler', {}]]
        }
    })],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    ui: ['@chakra-ui/react', 'framer-motion'],
                    router: ['react-router-dom'],
                    query: ['@tanstack/react-query'],
                    charts: ['chart.js', 'react-chartjs-2']
                }
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
    }
})

import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react({
            // React Fast Refresh 최적화
            fastRefresh: true,
            // JSX 런타임 최적화
            jsxRuntime: 'automatic',
            // Babel 설정 완전 제거 (중복 방지)
            babel: {
                plugins: []
            }
        }),

        // PWA 지원
        VitePWA({
            registerType: 'autoUpdate',
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,webp,svg,woff2}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/api\./,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'api-cache',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 5 // 5분
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: /\.(?:png|jpg|jpeg|webp|svg|gif)$/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'images-cache',
                            expiration: {
                                maxEntries: 200,
                                maxAgeSeconds: 60 * 60 * 24 * 7 // 7일
                            }
                        }
                    }
                ]
            },
            manifest: {
                name: 'Community Platform',
                short_name: 'Community',
                description: 'AI-powered Community Platform with Enhanced Content Management',
                theme_color: '#2196F3',
                background_color: '#ffffff',
                display: 'standalone',
                orientation: 'portrait',
                scope: '/',
                start_url: '/',
                icons: [
                    {
                        src: '/images/icon-192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: '/images/icon-512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            }
        }),

        // 번들 분석기 (프로덕션 빌드 시)
        process.env.ANALYZE && visualizer({
            filename: 'dist/stats.html',
            open: true,
            gzipSize: true,
            brotliSize: true
        })
    ],

    // 개발 서버 설정
    server: {
        port: 3000,
        host: true,
        // HMR 최적화
        hmr: {
            overlay: true
        },
        // HTTP 설정 (개발용)
        https: false,
        // 프록시 설정 (백엔드 API)
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
                secure: false
            }
        }
    },

    // 빌드 최적화 설정
    build: {
        // 출력 디렉토리
        outDir: 'dist',

        // 소스맵 생성 (프로덕션에서는 비활성화)
        sourcemap: process.env.NODE_ENV === 'development',

        // 청크 크기 경고 임계값 (KB)
        chunkSizeWarningLimit: 1000,

        // Rollup 옵션
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html')
            },

            output: {
                // 청크 분할 최적화
                manualChunks: {
                    // React 관련 라이브러리
                    'react-vendor': ['react', 'react-dom'],

                    // Material-UI 관련
                    'mui-vendor': [
                        '@mui/material',
                        '@mui/icons-material',
                        '@mui/system',
                        '@emotion/react',
                        '@emotion/styled'
                    ],

                    // 차트 라이브러리
                    'chart-vendor': ['recharts'],

                    // 가상화 라이브러리
                    'virtualization-vendor': [
                        'react-window',
                        'react-window-infinite-loader',
                        'react-virtualized-auto-sizer'
                    ],

                    // 유틸리티 라이브러리
                    'utils-vendor': ['lodash', 'date-fns']
                },

                // 파일명 패턴
                chunkFileNames: (chunkInfo) => {
                    const facadeModuleId = chunkInfo.facadeModuleId
                        ? chunkInfo.facadeModuleId.split('/').pop().replace(/\.[^/.]+$/, '')
                        : 'chunk';
                    return `js/${facadeModuleId}-[hash].js`;
                },
                entryFileNames: 'js/[name]-[hash].js',
                assetFileNames: (assetInfo) => {
                    const info = assetInfo.name.split('.');
                    const ext = info[info.length - 1];
                    if (/\.(css)$/.test(assetInfo.name)) {
                        return `css/[name]-[hash].${ext}`;
                    }
                    if (/\.(png|jpe?g|webp|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
                        return `images/[name]-[hash].${ext}`;
                    }
                    if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
                        return `fonts/[name]-[hash].${ext}`;
                    }
                    return `assets/[name]-[hash].${ext}`;
                }
            }
        },

        // 압축 최적화
        minify: 'esbuild',

        // CSS 코드 스플리팅
        cssCodeSplit: true,

        // 빌드 대상
        target: ['es2020', 'chrome80', 'firefox78', 'safari14', 'edge88'],

        // 폴리필 제거 (모던 브라우저 타겟)
        polyfillModulePreload: false
    },

    // 의존성 최적화
    optimizeDeps: {
        // 사전 번들링할 의존성
        include: [
            'react',
            'react-dom',
            '@mui/material',
            '@mui/icons-material',
            'recharts',
            'react-window',
            'react-window-infinite-loader'
        ],

        // 제외할 의존성
        exclude: [
            // 개발 전용 도구들
        ]
    },

    // 경로 별칭
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            '@components': resolve(__dirname, 'src/components'),
            '@pages': resolve(__dirname, 'src/pages'),
            '@utils': resolve(__dirname, 'src/utils'),
            '@hooks': resolve(__dirname, 'src/hooks'),
            '@types': resolve(__dirname, 'src/types'),
            '@assets': resolve(__dirname, 'src/assets')
        }
    },

    // CSS 설정
    css: {
        // PostCSS 설정
        postcss: {
            plugins: [
                // Autoprefixer는 package.json의 browserslist 설정 사용
            ]
        },

        // CSS 모듈 설정
        modules: {
            localsConvention: 'camelCase',
            generateScopedName: process.env.NODE_ENV === 'development'
                ? '[name]__[local]__[hash:base64:5]'
                : '[hash:base64:8]'
        },

        // CSS 전처리기 설정
        preprocessorOptions: {
            scss: {
                additionalData: `@import "@/styles/variables.scss";`
            }
        }
    },

    // 환경 변수 설정
    define: {
        __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
        __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
        __DEV__: JSON.stringify(process.env.NODE_ENV === 'development')
    },

    // ESBuild 설정
    esbuild: {
        // 프로덕션에서 console.log 제거
        drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],

        // JSX 최적화
        jsxFactory: 'React.createElement',
        jsxFragment: 'React.Fragment'
    },

    // 미리보기 서버 설정
    preview: {
        port: 3000,
        host: true,
        strictPort: true
    },

    // 실험적 기능
    experimental: {
        // 빌드 최적화
        renderBuiltUrl(filename, { hostType }) {
            if (hostType === 'js') {
                return { js: `/${filename}` };
            } else {
                return { relative: true };
            }
        }
    }
});
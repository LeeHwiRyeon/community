/**
 * 🚀 Community Platform v1.2 - Production Vite Configuration
 * 
 * 프로덕션 환경을 위한 Vite 빌드 설정
 * 
 * @author AUTOAGENTS Manager
 * @version 1.2.0
 * @created 2025-10-02
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { compression } from 'vite-plugin-compression2';

// ============================================================================
// 프로덕션 빌드 설정
// ============================================================================

export default defineConfig({
    plugins: [
        react({
            // React 19 최적화
            jsxRuntime: 'automatic',
            jsxImportSource: '@emotion/react',
            babel: {
                plugins: [
                    ['@emotion/babel-plugin', { sourceMap: false }],
                    ['@babel/plugin-proposal-decorators', { legacy: true }],
                    ['@babel/plugin-proposal-class-properties', { loose: true }]
                ]
            }
        }),

        // 번들 분석기 (선택적)
        process.env.ANALYZE === 'true' && visualizer({
            filename: 'dist/bundle-analysis.html',
            open: true,
            gzipSize: true,
            brotliSize: true
        }),

        // 압축 플러그인
        compression({
            algorithm: 'gzip',
            threshold: 1024,
            minRatio: 0.8,
            exclude: [/\.(br)$ /i]
        }),

        compression({
            algorithm: 'brotliCompress',
            threshold: 1024,
            minRatio: 0.8,
            exclude: [/\.(gz)$ /i]
        })
    ].filter(Boolean),

    // ============================================================================
    // 빌드 설정
    // ============================================================================

    build: {
        // 출력 디렉토리
        outDir: 'dist',

        // 소스맵 (프로덕션에서는 비활성화)
        sourcemap: false,

        // 최소화 설정
        minify: 'terser',
        terserOptions: {
            compress: {
                // 콘솔 로그 제거
                drop_console: true,
                drop_debugger: true,
                // 사용하지 않는 코드 제거
                pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
                // 불필요한 코드 제거
                unused: true,
                // 데드 코드 제거
                dead_code: true
            },
            mangle: {
                // 변수명 압축
                toplevel: true,
                safari10: true
            },
            format: {
                // 주석 제거
                comments: false
            }
        },

        // 청크 크기 경고 임계값
        chunkSizeWarningLimit: 1000,

        // 롤업 옵션
        rollupOptions: {
            // 진입점
            input: {
                main: resolve(__dirname, 'index.html')
            },

            // 출력 설정
            output: {
                // 청크 파일명 패턴
                chunkFileNames: 'assets/js/[name]-[hash].js',
                entryFileNames: 'assets/js/[name]-[hash].js',
                assetFileNames: (assetInfo) => {
                    const info = assetInfo.name?.split('.') || [];
                    const ext = info[info.length - 1];
                    if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name || '')) {
                        return `assets/media/[name]-[hash].${ext}`;
                    }
                    if (/\.(png|jpe?g|gif|svg|webp|avif)(\?.*)?$/i.test(assetInfo.name || '')) {
                        return `assets/images/[name]-[hash].${ext}`;
                    }
                    if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name || '')) {
                        return `assets/fonts/[name]-[hash].${ext}`;
                    }
                    if (/\.css$/i.test(assetInfo.name || '')) {
                        return `assets/css/[name]-[hash].${ext}`;
                    }
                    return `assets/[name]-[hash].${ext}`;
                },

                // 수동 청크 분할
                manualChunks: {
                    // React 관련 라이브러리
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],

                    // MUI 관련 라이브러리
                    'mui-vendor': [
                        '@mui/material',
                        '@mui/icons-material',
                        '@mui/lab',
                        '@emotion/react',
                        '@emotion/styled'
                    ],

                    // 상태 관리
                    'state-vendor': ['@reduxjs/toolkit', 'react-redux'],

                    // 유틸리티 라이브러리
                    'utils-vendor': [
                        'lodash',
                        'date-fns',
                        'axios',
                        'socket.io-client'
                    ],

                    // 차트 및 시각화
                    'chart-vendor': [
                        'recharts',
                        'd3',
                        'three',
                        '@react-three/fiber'
                    ],

                    // 에디터 및 위지윅
                    'editor-vendor': [
                        '@tiptap/react',
                        '@tiptap/starter-kit',
                        '@tiptap/extension-image',
                        '@tiptap/extension-link'
                    ]
                }
            },

            // 외부 의존성 (CDN에서 로드)
            external: [],

            // 트리 셰이킹
            treeshake: {
                moduleSideEffects: false,
                propertyReadSideEffects: false,
                tryCatchDeoptimization: false
            }
        },

        // CSS 코드 분할
        cssCodeSplit: true,

        // 에셋 인라인 임계값
        assetsInlineLimit: 4096,

        // 빈 청크 제거
        emptyOutDir: true,

        // 타겟 브라우저
        target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14']
    },

    // ============================================================================
    // 개발 서버 설정 (프로덕션에서는 사용하지 않음)
    // ============================================================================

    server: {
        port: 5173,
        host: true,
        open: false,
        cors: true,
        strictPort: true
    },

    // ============================================================================
    // 경로 별칭 설정
    // ============================================================================

    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            '@components': resolve(__dirname, 'src/components'),
            '@pages': resolve(__dirname, 'src/pages'),
            '@utils': resolve(__dirname, 'src/utils'),
            '@hooks': resolve(__dirname, 'src/hooks'),
            '@types': resolve(__dirname, 'src/types'),
            '@assets': resolve(__dirname, 'src/assets'),
            '@styles': resolve(__dirname, 'src/styles'),
            '@services': resolve(__dirname, 'src/services'),
            '@store': resolve(__dirname, 'src/store'),
            '@config': resolve(__dirname, 'src/config')
        }
    },

    // ============================================================================
    // CSS 설정
    // ============================================================================

    css: {
        // PostCSS 설정
        postcss: {
            plugins: [
                require('autoprefixer')({
                    overrideBrowserslist: [
                        '> 1%',
                        'last 2 versions',
                        'not dead',
                        'not ie 11'
                    ]
                }),
                require('postcss-preset-env')({
                    stage: 3,
                    features: {
                        'nesting-rules': true,
                        'custom-properties': true,
                        'custom-media-queries': true
                    }
                })
            ]
        },

        // CSS 모듈 설정
        modules: {
            localsConvention: 'camelCase',
            generateScopedName: '[name]__[local]___[hash:base64:5]'
        },

        // CSS 전처리기 설정
        preprocessorOptions: {
            scss: {
                additionalData: `
          @import "@/styles/variables.scss";
          @import "@/styles/mixins.scss";
        `
            }
        }
    },

    // ============================================================================
    // 환경 변수 설정
    // ============================================================================

    envPrefix: 'VITE_',

    define: {
        // 전역 상수 정의
        __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
        __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
        __PRODUCTION__: JSON.stringify(true),
        __DEVELOPMENT__: JSON.stringify(false)
    },

    // ============================================================================
    // 최적화 설정
    // ============================================================================

    optimizeDeps: {
        // 사전 번들링할 의존성
        include: [
            'react',
            'react-dom',
            'react-router-dom',
            '@mui/material',
            '@mui/icons-material',
            '@reduxjs/toolkit',
            'react-redux',
            'axios',
            'lodash',
            'date-fns'
        ],

        // 제외할 의존성
        exclude: [
            '@vite/client',
            '@vite/env'
        ],

        // 강제 사전 번들링
        force: true
    },

    // ============================================================================
    // 실험적 기능
    // ============================================================================

    experimental: {
        // 렌더링 최적화
        renderBuiltUrl: (filename: string, { hostType }: { hostType: 'js' | 'css' | 'html' }) => {
            if (hostType === 'js') {
                return { js: `https://cdn.community-platform.com/${filename}` };
            } else if (hostType === 'css') {
                return { css: `https://cdn.community-platform.com/${filename}` };
            } else {
                return { html: `https://cdn.community-platform.com/${filename}` };
            }
        }
    },

    // ============================================================================
    // 로깅 설정
    // ============================================================================

    logLevel: 'warn',

    // ============================================================================
    // 캐시 설정
    // ============================================================================

    cacheDir: 'node_modules/.vite',

    // ============================================================================
    // 워커 설정
    // ============================================================================

    worker: {
        format: 'es',
        plugins: []
    },

    // ============================================================================
    // JSON 설정
    // ============================================================================

    json: {
        namedExports: true,
        stringify: false
    },

    // ============================================================================
    // 에셋 설정
    // ============================================================================

    assetsInclude: [
        '**/*.gltf',
        '**/*.glb',
        '**/*.fbx',
        '**/*.obj',
        '**/*.mtl',
        '**/*.dae',
        '**/*.3ds',
        '**/*.blend'
    ],

    // ============================================================================
    // 플러그인 설정
    // ============================================================================

    plugins: [
        // PWA 플러그인
        // pwa({
        //   registerType: 'autoUpdate',
        //   workbox: {
        //     globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        //     runtimeCaching: [
        //       {
        //         urlPattern: /^https:\/\/api\./,
        //         handler: 'NetworkFirst',
        //         options: {
        //           cacheName: 'api-cache',
        //           expiration: {
        //             maxEntries: 100,
        //             maxAgeSeconds: 60 * 60 * 24 // 24 hours
        //           }
        //         }
        //       }
        //     ]
        //   },
        //   manifest: {
        //     name: 'Community Platform v1.2',
        //     short_name: 'Community',
        //     description: '차세대 혁신 CMS 플랫폼',
        //     theme_color: '#1976d2',
        //     background_color: '#ffffff',
        //     display: 'standalone',
        //     orientation: 'portrait',
        //     scope: '/',
        //     start_url: '/',
        //     icons: [
        //       {
        //         src: 'pwa-192x192.png',
        //         sizes: '192x192',
        //         type: 'image/png'
        //       },
        //       {
        //         src: 'pwa-512x512.png',
        //         sizes: '512x512',
        //         type: 'image/png'
        //       }
        //     ]
        //   }
        // })
    ]
});

// ============================================================================
// 🎉 Community Platform v1.2 Production Vite Configuration Complete!
// ============================================================================

// Service Worker for Mobile-Optimized Community Hub PWA
const CACHE_NAME = 'community-hub-mobile-v2.0.0';
const STATIC_CACHE = 'static-mobile-v2.0.0';
const DYNAMIC_CACHE = 'dynamic-mobile-v2.0.0';
const IMAGE_CACHE = 'images-mobile-v2.0.0';

// 정적 자산 캐시할 파일들
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.ico',
    '/favicon-16x16.png',
    '/favicon-32x32.png',
    '/apple-touch-icon.png',
    '/android-chrome-192x192.png',
    '/android-chrome-512x512.png',
    '/splash-iphone.png',
    '/splash-ipad.png',
    '/screenshot-desktop.png',
    '/screenshot-mobile.png'
];

// 모바일 최적화된 이미지 캐시 전략
const IMAGE_CACHE_PATTERNS = [
    /\.(jpg|jpeg|png|gif|webp|svg)$/i,
    /\/api\/images\//,
    /\/uploads\//
];

// API 엔드포인트들
const API_ENDPOINTS = [
    '/api/users',
    '/api/news',
    '/api/posts',
    '/api/analytics',
    '/api/system',
    '/realtime'
];

// 설치 이벤트
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');

    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('Service Worker: Static assets cached');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Service Worker: Cache failed', error);
            })
    );
});

// 활성화 이벤트
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');

    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated');
                return self.clients.claim();
            })
    );
});

// fetch 이벤트
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // API 요청 처리
    if (API_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint))) {
        event.respondWith(handleApiRequest(request));
        return;
    }

    // 정적 자산 처리
    if (request.method === 'GET') {
        event.respondWith(handleStaticRequest(request));
        return;
    }

    // 기타 요청은 네트워크로
    event.respondWith(fetch(request));
});

// API 요청 처리
async function handleApiRequest(request) {
    try {
        // 네트워크 우선, 실패 시 캐시
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            // 성공한 응답을 동적 캐시에 저장
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('Service Worker: Network failed, trying cache', error);

        // 네트워크 실패 시 캐시에서 찾기
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // 캐시에도 없으면 오프라인 응답
        return new Response(
            JSON.stringify({
                error: 'Offline',
                message: '인터넷 연결을 확인해주세요.',
                timestamp: new Date().toISOString()
            }),
            {
                status: 503,
                statusText: 'Service Unavailable',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }
}

// 정적 자산 요청 처리
async function handleStaticRequest(request) {
    try {
        // 캐시 우선
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // 캐시에 없으면 네트워크에서 가져와서 캐시에 저장
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('Service Worker: Static asset fetch failed', error);

        // 오프라인 페이지 반환
        if (request.destination === 'document') {
            return new Response(`
                <!DOCTYPE html>
                <html lang="ko">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>오프라인 - Community Hub</title>
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            background: #1a1a1a;
                            color: #fff;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            height: 100vh;
                            margin: 0;
                            text-align: center;
                        }
                        .offline-container {
                            max-width: 400px;
                            padding: 20px;
                        }
                        .offline-icon {
                            font-size: 4em;
                            margin-bottom: 20px;
                        }
                        .offline-title {
                            font-size: 1.5em;
                            margin-bottom: 10px;
                        }
                        .offline-message {
                            color: #a0a0a0;
                            margin-bottom: 20px;
                        }
                        .retry-btn {
                            background: #9feaf9;
                            color: #1a1a1a;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 1em;
                        }
                        .retry-btn:hover {
                            background: #7dd3fc;
                        }
                    </style>
                </head>
                <body>
                    <div class="offline-container">
                        <div class="offline-icon">📱</div>
                        <h1 class="offline-title">오프라인 모드</h1>
                        <p class="offline-message">
                            인터넷 연결을 확인하고 다시 시도해주세요.
                        </p>
                        <button class="retry-btn" onclick="window.location.reload()">
                            다시 시도
                        </button>
                    </div>
                </body>
                </html>
            `, {
                headers: {
                    'Content-Type': 'text/html'
                }
            });
        }

        throw error;
    }
}

// 백그라운드 동기화
self.addEventListener('sync', event => {
    console.log('Service Worker: Background sync', event.tag);

    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

// 백그라운드 동기화 실행
async function doBackgroundSync() {
    try {
        // 오프라인 중에 저장된 데이터 동기화
        console.log('Service Worker: Performing background sync');

        // 여기에 오프라인 데이터 동기화 로직 추가
        // 예: IndexedDB에서 데이터를 읽어서 서버에 전송

    } catch (error) {
        console.error('Service Worker: Background sync failed', error);
    }
}

// 푸시 알림
self.addEventListener('push', event => {
    console.log('Service Worker: Push received', event);

    const options = {
        body: event.data ? event.data.text() : '새로운 알림이 있습니다.',
        icon: '/android-chrome-192x192.png',
        badge: '/favicon-32x32.png',
        vibrate: [200, 100, 200],
        data: {
            url: '/cursor-integrated-dashboard.html'
        },
        actions: [
            {
                action: 'open',
                title: '열기',
                icon: '/shortcut-overview.png'
            },
            {
                action: 'close',
                title: '닫기'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('Community Hub', options)
    );
});

// 알림 클릭
self.addEventListener('notificationclick', event => {
    console.log('Service Worker: Notification clicked', event);

    event.notification.close();

    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.openWindow('/cursor-integrated-dashboard.html')
        );
    }
});

// 메시지 처리
self.addEventListener('message', event => {
    console.log('Service Worker: Message received', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(DYNAMIC_CACHE)
                .then(cache => cache.addAll(event.data.urls))
        );
    }
});

// 오류 처리
self.addEventListener('error', event => {
    console.error('Service Worker: Error', event.error);
});

self.addEventListener('unhandledrejection', event => {
    console.error('Service Worker: Unhandled rejection', event.reason);
});

console.log('Service Worker: Loaded');


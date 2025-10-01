// Browser Compatibility Utilities
interface BrowserInfo {
    name: string;
    version: string;
    isSupported: boolean;
    features: {
        serviceWorker: boolean;
        webPush: boolean;
        webShare: boolean;
        webRTC: boolean;
        webGL: boolean;
        webAssembly: boolean;
        intersectionObserver: boolean;
        resizeObserver: boolean;
        customElements: boolean;
        cssGrid: boolean;
        cssFlexbox: boolean;
        cssVariables: boolean;
        es6Modules: boolean;
        fetch: boolean;
        promises: boolean;
        asyncAwait: boolean;
    };
}

interface FeatureDetection {
    serviceWorker: () => boolean;
    webPush: () => boolean;
    webShare: () => boolean;
    webRTC: () => boolean;
    webGL: () => boolean;
    webAssembly: () => boolean;
    intersectionObserver: () => boolean;
    resizeObserver: () => boolean;
    customElements: () => boolean;
    cssGrid: () => boolean;
    cssFlexbox: () => boolean;
    cssVariables: () => boolean;
    es6Modules: () => boolean;
    fetch: () => boolean;
    promises: () => boolean;
    asyncAwait: () => boolean;
}

// Feature detection functions
const featureDetection: FeatureDetection = {
    serviceWorker: () => 'serviceWorker' in navigator,
    webPush: () => 'PushManager' in window,
    webShare: () => 'share' in navigator,
    webRTC: () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    webGL: () => {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch (e) {
            return false;
        }
    },
    webAssembly: () => typeof WebAssembly === 'object',
    intersectionObserver: () => 'IntersectionObserver' in window,
    resizeObserver: () => 'ResizeObserver' in window,
    customElements: () => 'customElements' in window,
    cssGrid: () => {
        const element = document.createElement('div');
        element.style.display = 'grid';
        return element.style.display === 'grid';
    },
    cssFlexbox: () => {
        const element = document.createElement('div');
        element.style.display = 'flex';
        return element.style.display === 'flex';
    },
    cssVariables: () => {
        const element = document.createElement('div');
        element.style.setProperty('--test', 'value');
        return element.style.getPropertyValue('--test') === 'value';
    },
    es6Modules: () => {
        try {
            new Function('import("")');
            return true;
        } catch (e) {
            return false;
        }
    },
    fetch: () => 'fetch' in window,
    promises: () => typeof Promise !== 'undefined',
    asyncAwait: () => {
        try {
            new Function('async () => {}');
            return true;
        } catch (e) {
            return false;
        }
    }
};

// Browser detection
const detectBrowser = (): { name: string; version: string } => {
    const userAgent = navigator.userAgent;

    // Chrome
    if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) {
        const match = userAgent.match(/Chrome\/(\d+)/);
        return {
            name: 'Chrome',
            version: match ? match[1] : 'unknown'
        };
    }

    // Firefox
    if (userAgent.includes('Firefox')) {
        const match = userAgent.match(/Firefox\/(\d+)/);
        return {
            name: 'Firefox',
            version: match ? match[1] : 'unknown'
        };
    }

    // Safari
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        const match = userAgent.match(/Version\/(\d+)/);
        return {
            name: 'Safari',
            version: match ? match[1] : 'unknown'
        };
    }

    // Edge
    if (userAgent.includes('Edge')) {
        const match = userAgent.match(/Edge\/(\d+)/);
        return {
            name: 'Edge',
            version: match ? match[1] : 'unknown'
        };
    }

    // Internet Explorer
    if (userAgent.includes('Trident')) {
        const match = userAgent.match(/rv:(\d+)/);
        return {
            name: 'Internet Explorer',
            version: match ? match[1] : 'unknown'
        };
    }

    return {
        name: 'Unknown',
        version: 'unknown'
    };
};

// Check if browser is supported
const isBrowserSupported = (browserInfo: { name: string; version: string }): boolean => {
    const { name, version } = browserInfo;
    const versionNum = parseInt(version);

    // Minimum supported versions
    const minVersions: { [key: string]: number } = {
        'Chrome': 70,
        'Firefox': 65,
        'Safari': 12,
        'Edge': 79,
        'Internet Explorer': 11
    };

    return minVersions[name] ? versionNum >= minVersions[name] : false;
};

// Get browser compatibility info
export const getBrowserInfo = (): BrowserInfo => {
    const browser = detectBrowser();
    const features = Object.keys(featureDetection).reduce((acc, key) => {
        acc[key as keyof typeof featureDetection] = featureDetection[key as keyof typeof featureDetection]();
        return acc;
    }, {} as BrowserInfo['features']);

    return {
        name: browser.name,
        version: browser.version,
        isSupported: isBrowserSupported(browser),
        features
    };
};

// Polyfills for older browsers
export const loadPolyfills = async (): Promise<void> => {
    const browserInfo = getBrowserInfo();

    // Load polyfills based on feature detection
    const polyfills: Promise<void>[] = [];

    // Fetch polyfill
    if (!browserInfo.features.fetch) {
        polyfills.push(
            import('whatwg-fetch').then(() => {
                console.log('Fetch polyfill loaded');
            })
        );
    }

    // Promise polyfill
    if (!browserInfo.features.promises) {
        polyfills.push(
            import('es6-promise/auto').then(() => {
                console.log('Promise polyfill loaded');
            })
        );
    }

    // IntersectionObserver polyfill
    if (!browserInfo.features.intersectionObserver) {
        polyfills.push(
            import('intersection-observer').then(() => {
                console.log('IntersectionObserver polyfill loaded');
            })
        );
    }

    // CSS Grid polyfill
    if (!browserInfo.features.cssGrid) {
        polyfills.push(
            import('css-polyfills').then(() => {
                console.log('CSS Grid polyfill loaded');
            })
        );
    }

    await Promise.all(polyfills);
};

// Browser-specific optimizations
export const applyBrowserOptimizations = (): void => {
    const browserInfo = getBrowserInfo();

    // Safari-specific optimizations
    if (browserInfo.name === 'Safari') {
        // Disable smooth scrolling on Safari (performance issue)
        document.documentElement.style.scrollBehavior = 'auto';

        // Add Safari-specific CSS class
        document.documentElement.classList.add('safari');
    }

    // Internet Explorer optimizations
    if (browserInfo.name === 'Internet Explorer') {
        // Add IE-specific CSS class
        document.documentElement.classList.add('ie');

        // Disable animations on IE
        document.documentElement.style.setProperty('--animation-duration', '0s');
    }

    // Firefox optimizations
    if (browserInfo.name === 'Firefox') {
        // Add Firefox-specific CSS class
        document.documentElement.classList.add('firefox');
    }

    // Chrome optimizations
    if (browserInfo.name === 'Chrome') {
        // Add Chrome-specific CSS class
        document.documentElement.classList.add('chrome');
    }
};

// Check for required features and show warning if needed
export const checkRequiredFeatures = (): boolean => {
    const browserInfo = getBrowserInfo();
    const requiredFeatures = ['fetch', 'promises', 'cssFlexbox'];

    const missingFeatures = requiredFeatures.filter(feature =>
        !browserInfo.features[feature as keyof BrowserInfo['features']]
    );

    if (missingFeatures.length > 0) {
        console.warn('Missing required features:', missingFeatures);

        // Show user warning
        const warning = document.createElement('div');
        warning.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #ff6b6b;
            color: white;
            padding: 10px;
            text-align: center;
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;
        warning.textContent = `Your browser is missing required features: ${missingFeatures.join(', ')}. Some functionality may not work properly.`;
        document.body.appendChild(warning);

        return false;
    }

    return true;
};

// Initialize browser compatibility
export const initBrowserCompatibility = async (): Promise<void> => {
    console.log('Initializing browser compatibility...');

    // Get browser info
    const browserInfo = getBrowserInfo();
    console.log('Browser info:', browserInfo);

    // Check if browser is supported
    if (!browserInfo.isSupported) {
        console.warn('Browser is not supported:', browserInfo.name, browserInfo.version);
        // Could show upgrade message to user
    }

    // Load polyfills
    await loadPolyfills();

    // Apply browser-specific optimizations
    applyBrowserOptimizations();

    // Check required features
    checkRequiredFeatures();

    console.log('Browser compatibility initialization complete');
};

export default {
    getBrowserInfo,
    loadPolyfills,
    applyBrowserOptimizations,
    checkRequiredFeatures,
    initBrowserCompatibility
};

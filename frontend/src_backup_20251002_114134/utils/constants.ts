/**
 * Application constants and configuration
 */

// API Configuration
export const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:50000/api',
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
} as const;

// Storage Keys
export const STORAGE_KEYS = {
    TOKEN: 'auth_token',
    USER: 'user_data',
    THEME: 'theme_preference',
    LANGUAGE: 'language_preference',
    SETTINGS: 'user_settings',
    CACHE: 'app_cache',
    ANALYTICS: 'analytics_data',
    ACTIONS: 'action_history',
    SCHEDULER: 'scheduled_actions',
    TEMPLATES: 'action_templates',
    BULK_ACTIONS: 'bulk_actions',
    VALIDATION: 'validation_rules',
    EXPORT: 'export_settings',
    PAGINATION: 'pagination_settings',
    UNDO_REDO: 'undo_redo_stack',
} as const;

// Theme Configuration
export const THEME_CONFIG = {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system',
    COLORS: {
        PRIMARY: '#3182ce',
        SECONDARY: '#805ad5',
        SUCCESS: '#38a169',
        WARNING: '#d69e2e',
        ERROR: '#e53e3e',
        INFO: '#3182ce',
    },
} as const;

// Language Configuration
export const LANGUAGE_CONFIG = {
    DEFAULT: 'en',
    SUPPORTED: ['en', 'ko'],
    FALLBACK: 'en',
} as const;

// Pagination Configuration
export const PAGINATION_CONFIG = {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,
    PAGE_SIZE_OPTIONS: [5, 10, 20, 50, 100],
    INFINITE_SCROLL_THRESHOLD: 100,
    VIRTUAL_SCROLL_ITEM_HEIGHT: 60,
} as const;

// Action Configuration
export const ACTION_CONFIG = {
    MAX_ACTIONS_PER_BATCH: 100,
    MAX_SCHEDULED_ACTIONS: 1000,
    MAX_TEMPLATES: 500,
    MAX_UNDO_REDO_STACK: 50,
    ACTION_TIMEOUT: 30000,
    BULK_ACTION_DELAY: 1000,
} as const;

// Validation Configuration
export const VALIDATION_CONFIG = {
    MIN_PASSWORD_LENGTH: 8,
    MAX_PASSWORD_LENGTH: 128,
    MIN_USERNAME_LENGTH: 3,
    MAX_USERNAME_LENGTH: 30,
    MIN_EMAIL_LENGTH: 5,
    MAX_EMAIL_LENGTH: 254,
    MIN_TITLE_LENGTH: 1,
    MAX_TITLE_LENGTH: 200,
    MIN_DESCRIPTION_LENGTH: 0,
    MAX_DESCRIPTION_LENGTH: 1000,
    MIN_COMMENT_LENGTH: 1,
    MAX_COMMENT_LENGTH: 500,
    MIN_TAG_LENGTH: 2,
    MAX_TAG_LENGTH: 20,
    MAX_TAGS_PER_ITEM: 10,
} as const;

// File Upload Configuration
export const FILE_UPLOAD_CONFIG = {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_FILES_PER_UPLOAD: 10,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain', 'application/msword'],
    ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg'],
    ALLOWED_AUDIO_TYPES: ['audio/mp3', 'audio/wav', 'audio/ogg'],
    UPLOAD_TIMEOUT: 300000, // 5 minutes
} as const;

// Notification Configuration
export const NOTIFICATION_CONFIG = {
    MAX_NOTIFICATIONS: 100,
    AUTO_DISMISS_DELAY: 5000,
    PERSISTENT_TYPES: ['error', 'warning'],
    SOUND_ENABLED: true,
    VIBRATION_ENABLED: true,
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
    DEFAULT_TTL: 300000, // 5 minutes
    MAX_CACHE_SIZE: 50 * 1024 * 1024, // 50MB
    CACHE_STRATEGIES: {
        NETWORK_FIRST: 'network-first',
        CACHE_FIRST: 'cache-first',
        STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
    },
} as const;

// Error Configuration
export const ERROR_CONFIG = {
    MAX_ERROR_MESSAGES: 10,
    ERROR_REPORTING_ENABLED: true,
    ERROR_REPORTING_URL: '/api/errors',
} as const;

// Performance Configuration
export const PERFORMANCE_CONFIG = {
    DEBOUNCE_DELAY: 300,
    THROTTLE_DELAY: 1000,
    LAZY_LOAD_THRESHOLD: 100,
    VIRTUAL_SCROLL_BUFFER: 5,
    IMAGE_LAZY_LOAD_THRESHOLD: 200,
} as const;

// Security Configuration
export const SECURITY_CONFIG = {
    TOKEN_REFRESH_THRESHOLD: 300000, // 5 minutes
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 900000, // 15 minutes
    PASSWORD_RESET_EXPIRY: 3600000, // 1 hour
    SESSION_TIMEOUT: 86400000, // 24 hours
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
    ANALYTICS_ENABLED: true,
    SOUND_EFFECTS_ENABLED: true,
    ANIMATIONS_ENABLED: true,
    KEYBOARD_SHORTCUTS_ENABLED: true,
    BULK_ACTIONS_ENABLED: true,
    SCHEDULER_ENABLED: true,
    TEMPLATES_ENABLED: true,
    EXPORT_ENABLED: true,
    UNDO_REDO_ENABLED: true,
    VALIDATION_ENABLED: true,
    VIRTUAL_SCROLLING_ENABLED: true,
    INFINITE_SCROLL_ENABLED: true,
    CACHING_ENABLED: true,
    OFFLINE_MODE_ENABLED: false,
    PWA_ENABLED: false,
} as const;

// Status Codes
export const STATUS_CODES = {
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
} as const;

// HTTP Methods
export const HTTP_METHODS = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    PATCH: 'PATCH',
    DELETE: 'DELETE',
    HEAD: 'HEAD',
    OPTIONS: 'OPTIONS',
} as const;

// Content Types
export const CONTENT_TYPES = {
    JSON: 'application/json',
    FORM_DATA: 'multipart/form-data',
    URL_ENCODED: 'application/x-www-form-urlencoded',
    TEXT: 'text/plain',
    HTML: 'text/html',
    XML: 'application/xml',
} as const;

// Date Formats
export const DATE_FORMATS = {
    ISO: 'YYYY-MM-DDTHH:mm:ss.sssZ',
    DATE: 'YYYY-MM-DD',
    TIME: 'HH:mm:ss',
    DATETIME: 'YYYY-MM-DD HH:mm:ss',
    DISPLAY: 'MMM DD, YYYY',
    DISPLAY_DATETIME: 'MMM DD, YYYY HH:mm',
} as const;

// Regular Expressions
export const REGEX_PATTERNS = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+[\]{};':"\\|,.<>/?~`]).{8,}$/,
    USERNAME: /^[a-zA-Z0-9_-]{3,30}$/,
    URL: /^https?:\/\/.+/,
    PHONE: /^\+?[\d\s-()]+$/,
    ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
    NUMERIC: /^\d+$/,
    DECIMAL: /^\d+\.?\d*$/,
} as const;

// Keyboard Shortcuts
export const KEYBOARD_SHORTCUTS = {
    HELP: 'Ctrl+H',
    SAVE: 'Ctrl+S',
    COPY: 'Ctrl+C',
    PASTE: 'Ctrl+V',
    CUT: 'Ctrl+X',
    UNDO: 'Ctrl+Z',
    REDO: 'Ctrl+Y',
    SELECT_ALL: 'Ctrl+A',
    FIND: 'Ctrl+F',
    REPLACE: 'Ctrl+H',
    NEW: 'Ctrl+N',
    OPEN: 'Ctrl+O',
    CLOSE: 'Ctrl+W',
    QUIT: 'Ctrl+Q',
    REFRESH: 'F5',
    FULLSCREEN: 'F11',
    ESCAPE: 'Escape',
    ENTER: 'Enter',
    TAB: 'Tab',
    SHIFT_TAB: 'Shift+Tab',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    HOME: 'Home',
    END: 'End',
    PAGE_UP: 'PageUp',
    PAGE_DOWN: 'PageDown',
    BACKSPACE: 'Backspace',
    SPACE: ' ',
} as const;

// Animation Durations
export const ANIMATION_DURATIONS = {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
    VERY_SLOW: 1000,
} as const;

// Z-Index Layers
export const Z_INDEX = {
    DROPDOWN: 1000,
    STICKY: 1020,
    FIXED: 1030,
    MODAL_BACKDROP: 1040,
    MODAL: 1050,
    POPOVER: 1060,
    TOOLTIP: 1070,
    TOAST: 1080,
} as const;

// Breakpoints
export const BREAKPOINTS = {
    XS: '0px',
    SM: '576px',
    MD: '768px',
    LG: '992px',
    XL: '1200px',
    XXL: '1400px',
} as const;

// Default Values
export const DEFAULT_VALUES = {
    PAGE_SIZE: 10,
    CURRENT_PAGE: 1,
    SORT_BY: 'created_at',
    SORT_ORDER: 'desc',
    SEARCH_QUERY: '',
    FILTER_STATUS: 'all',
    FILTER_CATEGORY: 'all',
    FILTER_PRIORITY: 'all',
    NOTIFICATIONS_ENABLED: true,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Network error. Please check your connection.',
    SERVER_ERROR: 'Server error. Please try again later.',
    VALIDATION_ERROR: 'Please check your input and try again.',
    TIMEOUT_ERROR: 'Request timed out. Please try again.',
    UNKNOWN_ERROR: 'An unknown error occurred.',
    INVALID_CREDENTIALS: 'Invalid username or password.',
    ACCOUNT_LOCKED: 'Your account has been locked. Please contact support.',
    TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
    FILE_TOO_LARGE: 'File size exceeds the maximum limit.',
    INVALID_FILE_TYPE: 'Invalid file type.',
    UPLOAD_FAILED: 'File upload failed. Please try again.',
    EXPORT_FAILED: 'Export failed. Please try again.',
    IMPORT_FAILED: 'Import failed. Please check your file format.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
    SAVED: 'Changes saved successfully.',
    UPDATED: 'Item updated successfully.',
    DELETED: 'Item deleted successfully.',
    UPLOADED: 'File uploaded successfully.',
    EXPORTED: 'Data exported successfully.',
    IMPORTED: 'Data imported successfully.',
    COPIED: 'Copied to clipboard.',
    SENT: 'Message sent successfully.',
    SUBMITTED: 'Form submitted successfully.',
    LOGGED_IN: 'Logged in successfully.',
    LOGGED_OUT: 'Logged out successfully.',
    PASSWORD_CHANGED: 'Password changed successfully.',
    PROFILE_UPDATED: 'Profile updated successfully.',
    SETTINGS_SAVED: 'Settings saved successfully.',
} as const;

// Loading States
export const LOADING_STATES = {
    IDLE: 'idle',
    LOADING: 'loading',
} as const;

// Sort Orders
export const SORT_ORDERS = {
    ASC: 'asc',
    DESC: 'desc',
} as const;

// Filter Types
export const FILTER_TYPES = {
    ALL: 'all',
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    PENDING: 'pending',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    ON_HOLD: 'on_hold',
} as const;

// Priority Levels
export const PRIORITY_LEVELS = {
    CRITICAL: 1,
    HIGH: 2,
    MEDIUM: 3,
    LOW: 4,
    VERY_LOW: 5,
} as const;

// Status Types
export const STATUS_TYPES = {
    IN_PROGRESS: 'in_progress',
} as const;

// Category Types
export const CATEGORY_TYPES = {
    FEATURE: 'feature',
    BUG: 'bug',
    IMPROVEMENT: 'improvement',
    DOCUMENTATION: 'documentation',
    TESTING: 'testing',
    REFACTORING: 'refactoring',
    DEPLOYMENT: 'deployment',
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
    TODO_ASSIGNED: 'todo_assigned',
    TODO_COMPLETED: 'todo_completed',
    TODO_UPDATED: 'todo_updated',
    COMMENT_ADDED: 'comment_added',
    MENTION: 'mention',
} as const;

// Action Types
export const ACTION_TYPES = {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    LIKE: 'like',
    SHARE: 'share',
    FOLLOW: 'follow',
    BOOKMARK: 'bookmark',
    COMMENT: 'comment',
    VOTE: 'vote',
    REPORT: 'report',
    ARCHIVE: 'archive',
    RESTORE: 'restore',
    MOVE: 'move',
    IMPORT: 'import',
} as const;

// Export Types
export const EXPORT_TYPES = {
    CSV: 'csv',
    XLSX: 'xlsx',
    PDF: 'pdf',
    TXT: 'txt',
} as const;

// Import Types
export const IMPORT_TYPES = {
} as const;

// Template Types
export const TEMPLATE_TYPES = {
    SOCIAL: 'social',
    CONTENT: 'content',
    NAVIGATION: 'navigation',
    AUTOMATION: 'automation',
    CUSTOM: 'custom',
} as const;

// Scheduler Types
export const SCHEDULER_TYPES = {
    ONCE: 'once',
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    INTERVAL: 'interval',
} as const;

// Validation Types
export const VALIDATION_TYPES = {
    REQUIRED: 'required',
    MIN_LENGTH: 'minLength',
    MAX_LENGTH: 'maxLength',
    MIN_VALUE: 'minValue',
    MAX_VALUE: 'maxValue',
    PATTERN: 'pattern',
} as const;

// Validation Severity
export const VALIDATION_SEVERITY = {
} as const;

// Cache Strategies
export const CACHE_STRATEGIES = {
    NETWORK_ONLY: 'network-only',
    CACHE_ONLY: 'cache-only',
} as const;

// Storage Types
export const STORAGE_TYPES = {
    LOCAL: 'local',
    SESSION: 'session',
    INDEXED: 'indexed',
    MEMORY: 'memory',
} as const;

// Event Types
export const EVENT_TYPES = {
    CLICK: 'click',
    CHANGE: 'change',
    SUBMIT: 'submit',
    FOCUS: 'focus',
    BLUR: 'blur',
    KEYDOWN: 'keydown',
    KEYUP: 'keyup',
    MOUSEDOWN: 'mousedown',
    MOUSEUP: 'mouseup',
    MOUSEOVER: 'mouseover',
    MOUSEOUT: 'mouseout',
    SCROLL: 'scroll',
    RESIZE: 'resize',
    LOAD: 'load',
    UNLOAD: 'unload',
} as const;

// Media Types
export const MEDIA_TYPES = {
    IMAGE: 'image',
    VIDEO: 'video',
    AUDIO: 'audio',
    DOCUMENT: 'document',
    OTHER: 'other',
} as const;

// Permission Types
export const PERMISSION_TYPES = {
    WRITE: 'write',
    ADMIN: 'admin',
    MODERATE: 'moderate',
    UPLOAD: 'upload',
    DOWNLOAD: 'download',
} as const;

// Role Types
export const ROLE_TYPES = {
    MODERATOR: 'moderator',
    GUEST: 'guest',
    BANNED: 'banned',
} as const;

// Gender Types
export const GENDER_TYPES = {
    MALE: 'male',
    FEMALE: 'female',
    PREFER_NOT_TO_SAY: 'prefer_not_to_say',
} as const;

// Time Zones
export const TIME_ZONES = {
    UTC: 'UTC',
    EST: 'America/New_York',
    PST: 'America/Los_Angeles',
    CST: 'America/Chicago',
    MST: 'America/Denver',
    GMT: 'Europe/London',
    CET: 'Europe/Paris',
    JST: 'Asia/Tokyo',
    KST: 'Asia/Seoul',
    CST_CHINA: 'Asia/Shanghai',
} as const;

// Currency Codes
export const CURRENCY_CODES = {
    USD: 'USD',
    EUR: 'EUR',
    GBP: 'GBP',
    JPY: 'JPY',
    KRW: 'KRW',
    CNY: 'CNY',
    CAD: 'CAD',
    AUD: 'AUD',
    CHF: 'CHF',
    SEK: 'SEK',
    NOK: 'NOK',
    DKK: 'DKK',
    PLN: 'PLN',
    CZK: 'CZK',
    HUF: 'HUF',
    RON: 'RON',
    BGN: 'BGN',
    HRK: 'HRK',
    RSD: 'RSD',
    MKD: 'MKD',
    BAM: 'BAM',
} as const;

// Country Codes
export const COUNTRY_CODES = {
    US: 'US',
    CA: 'CA',
    GB: 'GB',
    DE: 'DE',
    FR: 'FR',
    IT: 'IT',
    ES: 'ES',
    NL: 'NL',
    BE: 'BE',
    AT: 'AT',
    CH: 'CH',
    SE: 'SE',
    NO: 'NO',
    DK: 'DK',
    FI: 'FI',
    PL: 'PL',
    CZ: 'CZ',
    HU: 'HU',
    RO: 'RO',
    BG: 'BG',
    HR: 'HR',
    RS: 'RS',
    MK: 'MK',
    AL: 'AL',
    BA: 'BA',
    ME: 'ME',
    SI: 'SI',
    SK: 'SK',
    LT: 'LT',
    LV: 'LV',
    EE: 'EE',
    IE: 'IE',
    PT: 'PT',
    LU: 'LU',
    CY: 'CY',
    MT: 'MT',
    GR: 'GR',
    JP: 'JP',
    KR: 'KR',
    CN: 'CN',
    AU: 'AU',
    NZ: 'NZ',
    BR: 'BR',
    AR: 'AR',
    CL: 'CL',
    CO: 'CO',
    MX: 'MX',
    PE: 'PE',
    VE: 'VE',
    ZA: 'ZA',
    EG: 'EG',
    NG: 'NG',
    KE: 'KE',
    GH: 'GH',
    MA: 'MA',
    TN: 'TN',
    DZ: 'DZ',
    LY: 'LY',
    SD: 'SD',
    ET: 'ET',
    UG: 'UG',
    TZ: 'TZ',
    ZW: 'ZW',
    BW: 'BW',
    NA: 'NA',
    SZ: 'SZ',
    LS: 'LS',
    MG: 'MG',
    MU: 'MU',
    SC: 'SC',
    KM: 'KM',
    DJ: 'DJ',
    SO: 'SO',
    ER: 'ER',
    SS: 'SS',
    CF: 'CF',
    TD: 'TD',
    NE: 'NE',
    ML: 'ML',
    BF: 'BF',
    CI: 'CI',
    LR: 'LR',
    SL: 'SL',
    GN: 'GN',
    GW: 'GW',
    GM: 'GM',
    SN: 'SN',
    MR: 'MR',
} as const;

// Language Codes
export const LANGUAGE_CODES = {
    EN: 'en',
    RU: 'ru',
    JA: 'ja',
    KO: 'ko',
    ZH: 'zh',
    HI: 'hi',
    TH: 'th',
    VI: 'vi',
    ID: 'id',
    MS: 'ms',
    TL: 'tl',
    SV: 'sv',
    DA: 'da',
    CS: 'cs',
    SR: 'sr',
    SQ: 'sq',
    BS: 'bs',
    GA: 'ga',
    EL: 'el',
    TR: 'tr',
    HE: 'he',
    FA: 'fa',
    UR: 'ur',
    BN: 'bn',
    TA: 'ta',
    TE: 'te',
    KN: 'kn',
    GU: 'gu',
    PA: 'pa',
    OR: 'or',
    AS: 'as',
    MY: 'my',
    LO: 'lo',
    KA: 'ka',
    AM: 'am',
    TI: 'ti',
    OM: 'om',
    SW: 'sw',
    HA: 'ha',
    YO: 'yo',
    IG: 'ig',
    FUL: 'ful',
    WOL: 'wol',
    ZUL: 'zul',
    XHO: 'xho',
    AF: 'af',
    NSO: 'nso',
    TS: 'ts',
    NR: 'nr',
    ST: 'st',
    NBL: 'nbl',
    VEN: 'ven',
} as const;

// File Extensions
export const FILE_EXTENSIONS = {
    CODE: ['.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.scss', '.sass', '.less', '.json', '.xml', '.yaml', '.yml'],
} as const;

// MIME Types
export const MIME_TYPES = {
    IMAGE: {
        JPEG: 'image/jpeg',
        PNG: 'image/png',
        GIF: 'image/gif',
        WEBP: 'image/webp',
        SVG: 'image/svg+xml',
        BMP: 'image/bmp',
        ICO: 'image/x-icon',
    },
    VIDEO: {
        MP4: 'video/mp4',
        WEBM: 'video/webm',
        OGG: 'video/ogg',
        AVI: 'video/x-msvideo',
        MOV: 'video/quicktime',
        WMV: 'video/x-ms-wmv',
        FLV: 'video/x-flv',
        MKV: 'video/x-matroska',
    },
    AUDIO: {
        MP3: 'audio/mpeg',
        WAV: 'audio/wav',
        AAC: 'audio/aac',
        FLAC: 'audio/flac',
        M4A: 'audio/mp4',
        WMA: 'audio/x-ms-wma',
    },
    DOCUMENT: {
        DOC: 'application/msword',
        DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        XLS: 'application/vnd.ms-excel',
        PPT: 'application/vnd.ms-powerpoint',
        PPTX: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        RTF: 'application/rtf',
    },
    ARCHIVE: {
        ZIP: 'application/zip',
        RAR: 'application/x-rar-compressed',
        '7Z': 'application/x-7z-compressed',
        TAR: 'application/x-tar',
        GZ: 'application/gzip',
        BZ2: 'application/x-bzip2',
    },
    CODE: {
        JS: 'application/javascript',
        JSX: 'text/jsx',
        TSX: 'text/tsx',
        CSS: 'text/css',
        SCSS: 'text/scss',
        SASS: 'text/sass',
        LESS: 'text/less',
        YAML: 'application/x-yaml',
        YML: 'application/x-yaml',
    },
} as const;

// Environment Variables
export const ENV_VARS = {
    NODE_ENV: 'NODE_ENV',
    VITE_API_BASE_URL: 'VITE_API_BASE_URL',
    VITE_APP_TITLE: 'VITE_APP_TITLE',
    VITE_APP_VERSION: 'VITE_APP_VERSION',
    VITE_APP_DESCRIPTION: 'VITE_APP_DESCRIPTION',
    VITE_APP_AUTHOR: 'VITE_APP_AUTHOR',
    VITE_APP_KEYWORDS: 'VITE_APP_KEYWORDS',
    VITE_APP_URL: 'VITE_APP_URL',
    VITE_APP_LOGO: 'VITE_APP_LOGO',
    VITE_APP_FAVICON: 'VITE_APP_FAVICON',
    VITE_APP_THEME_COLOR: 'VITE_APP_THEME_COLOR',
    VITE_APP_BACKGROUND_COLOR: 'VITE_APP_BACKGROUND_COLOR',
    VITE_APP_DISPLAY: 'VITE_APP_DISPLAY',
    VITE_APP_ORIENTATION: 'VITE_APP_ORIENTATION',
    VITE_APP_SCOPE: 'VITE_APP_SCOPE',
    VITE_APP_START_URL: 'VITE_APP_START_URL',
    VITE_APP_ICONS: 'VITE_APP_ICONS',
    VITE_APP_SCREENSHOTS: 'VITE_APP_SCREENSHOTS',
    VITE_APP_CATEGORIES: 'VITE_APP_CATEGORIES',
    VITE_APP_LANG: 'VITE_APP_LANG',
    VITE_APP_DIR: 'VITE_APP_DIR',
    VITE_APP_PREFER_RELATED_APPLICATIONS: 'VITE_APP_PREFER_RELATED_APPLICATIONS',
    VITE_APP_RELATED_APPLICATIONS: 'VITE_APP_RELATED_APPLICATIONS',
    VITE_APP_SHORT_NAME: 'VITE_APP_SHORT_NAME',
} as const;

// Default Configuration
export const DEFAULT_CONFIG = {
    API_BASE_URL: 'http://localhost:50000/api',
    APP_TITLE: 'Community Hub',
    APP_VERSION: '1.0.0',
    APP_DESCRIPTION: 'A modern community platform for collaboration and engagement',
    APP_AUTHOR: 'Community Hub Team',
    APP_KEYWORDS: 'community, collaboration, engagement, social, platform',
    APP_URL: 'http://localhost:3000',
    APP_LOGO: '/logo.png',
    APP_FAVICON: '/favicon.ico',
    APP_THEME_COLOR: '#3182ce',
    APP_BACKGROUND_COLOR: '#ffffff',
    APP_DISPLAY: 'standalone',
    APP_ORIENTATION: 'portrait-primary',
    APP_SCOPE: '/',
    APP_START_URL: '/',
    APP_ICONS: [
        {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
        },
        {
        },
    ],
    APP_SCREENSHOTS: [],
    APP_CATEGORIES: ['social', 'productivity', 'business'],
    APP_LANG: 'en',
    APP_DIR: 'ltr',
    APP_PREFER_RELATED_APPLICATIONS: false,
    APP_RELATED_APPLICATIONS: [],
    APP_SHORT_NAME: 'Community Hub',
} as const;

// Export all constants as a single object
export const CONSTANTS = {
    API_CONFIG,
    STORAGE_KEYS,
    THEME_CONFIG,
    LANGUAGE_CONFIG,
    PAGINATION_CONFIG,
    ACTION_CONFIG,
    VALIDATION_CONFIG,
    FILE_UPLOAD_CONFIG,
    NOTIFICATION_CONFIG,
    CACHE_CONFIG,
    ERROR_CONFIG,
    PERFORMANCE_CONFIG,
    SECURITY_CONFIG,
    FEATURE_FLAGS,
    STATUS_CODES,
    HTTP_METHODS,
    CONTENT_TYPES,
    DATE_FORMATS,
    REGEX_PATTERNS,
    KEYBOARD_SHORTCUTS,
    ANIMATION_DURATIONS,
    Z_INDEX,
    BREAKPOINTS,
    DEFAULT_VALUES,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    LOADING_STATES,
    SORT_ORDERS,
    FILTER_TYPES,
    PRIORITY_LEVELS,
    STATUS_TYPES,
    CATEGORY_TYPES,
    NOTIFICATION_TYPES,
    ACTION_TYPES,
    EXPORT_TYPES,
    IMPORT_TYPES,
    TEMPLATE_TYPES,
    SCHEDULER_TYPES,
    VALIDATION_TYPES,
    VALIDATION_SEVERITY,
    CACHE_STRATEGIES,
    STORAGE_TYPES,
    EVENT_TYPES,
    MEDIA_TYPES,
    PERMISSION_TYPES,
    ROLE_TYPES,
    GENDER_TYPES,
    TIME_ZONES,
    CURRENCY_CODES,
    COUNTRY_CODES,
    LANGUAGE_CODES,
    FILE_EXTENSIONS,
    MIME_TYPES,
    ENV_VARS,
    DEFAULT_CONFIG,
} as const;

export default CONSTANTS;

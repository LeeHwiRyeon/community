import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// 지원 언어 목록
export const SUPPORTED_LANGUAGES = [
    { code: 'ko', name: '한국어', nativeName: '한국어', flag: '🇰🇷' },
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'ja', name: '日本語', nativeName: '日本語', flag: '🇯🇵' },
    { code: 'zh-CN', name: '中文 (简体)', nativeName: '中文 (简体)', flag: '🇨🇳' },
    { code: 'zh-TW', name: '中文 (繁體)', nativeName: '中文 (繁體)', flag: '🇹🇼' },
    { code: 'es', name: 'Español', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'ru', name: 'Русский', nativeName: 'Русский', flag: '🇷🇺' },
    { code: 'ar', name: 'العربية', nativeName: 'العربية', flag: '🇸🇦' }
];

export const DEFAULT_LANGUAGE = 'ko';
export const FALLBACK_LANGUAGE = 'en';
export const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        lng: DEFAULT_LANGUAGE,
        fallbackLng: FALLBACK_LANGUAGE,
        supportedLngs: SUPPORTED_LANGUAGES.map(lang => lang.code),
        ns: ['common', 'navigation', 'forms', 'errors', 'messages'],
        defaultNS: 'common',
        backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json'
        },
        detection: {
            order: ['localStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage']
        },
        interpolation: {
            escapeValue: false
        },
        debug: process.env.NODE_ENV === 'development'
    });

export const changeLanguage = async (languageCode: string) => {
    await i18n.changeLanguage(languageCode);
    document.documentElement.lang = languageCode;

    if (RTL_LANGUAGES.includes(languageCode)) {
        document.documentElement.dir = 'rtl';
    } else {
        document.documentElement.dir = 'ltr';
    }
};

export default i18n;
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationKO from './locales/ko.json';
import translationEN from './locales/en.json';
import translationJA from './locales/ja.json';
import translationZH from './locales/zh.json';

// 번역 리소스
const resources = {
    ko: {
        translation: translationKO
    },
    en: {
        translation: translationEN
    },
    ja: {
        translation: translationJA
    },
    zh: {
        translation: translationZH
    }
};

i18n
    // LanguageDetector를 사용하여 사용자 언어 자동 감지
    .use(LanguageDetector)
    // react-i18next 모듈 연결
    .use(initReactI18next)
    // 초기화
    .init({
        resources,
        fallbackLng: 'ko', // 기본 언어
        debug: false, // 개발 중 디버그 모드 (프로덕션에서는 false)

        // 언어 감지 옵션
        detection: {
            order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
            caches: ['localStorage'],
            lookupLocalStorage: 'i18nextLng',
        },

        // 보간 설정
        interpolation: {
            escapeValue: false, // React는 이미 XSS로부터 안전함
        },

        // 네임스페이스 설정 (필요시 확장 가능)
        ns: ['translation'],
        defaultNS: 'translation',

        // 로딩 시 동작
        react: {
            useSuspense: true, // Suspense 사용
        },

        // 키가 없을 때 동작
        saveMissing: false,
        missingKeyHandler: (lng, ns, key, fallbackValue) => {
            if (process.env.NODE_ENV === 'development') {
                console.warn(`Missing translation: ${lng}.${ns}.${key}`);
            }
        },
    });

export default i18n;

/**
 * 지원 언어 목록
 */
export const supportedLanguages = [
    { code: 'ko', name: '한국어', flag: '🇰🇷', nativeName: '한국어' },
    { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
    { code: 'ja', name: '日本語', flag: '🇯🇵', nativeName: '日本語' },
    { code: 'zh', name: '中文', flag: '🇨🇳', nativeName: '简体中文' }
];

/**
 * RTL 언어 체크
 */
export const isRTL = (language: string): boolean => {
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    return rtlLanguages.includes(language);
};

/**
 * 언어 변경
 */
export const changeLanguage = async (language: string): Promise<void> => {
    await i18n.changeLanguage(language);

    // HTML dir 속성 설정
    document.documentElement.dir = isRTL(language) ? 'rtl' : 'ltr';
    document.documentElement.lang = language;

    // localStorage에 저장
    localStorage.setItem('i18nextLng', language);
};
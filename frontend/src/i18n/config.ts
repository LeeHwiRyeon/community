import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationKO from './locales/ko.json';
import translationEN from './locales/en.json';

// 번역 리소스
const resources = {
    ko: {
        translation: translationKO
    },
    en: {
        translation: translationEN
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
                console.warn(`Missing translation key: ${key} for language: ${lng}`);
            }
        },
    });

export default i18n;

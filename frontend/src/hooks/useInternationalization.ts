/**
 * 🌍 국제화 훅
 * 
 * 다국어 지원, 언어 감지, 번역 관리 훅
 * 
 * @author AUTOAGENTS Manager
 * @version 2.0.0
 * @created 2025-01-02
 */

import { useState, useEffect, useCallback } from 'react';

// 타입 정의
interface LanguageConfig {
    code: string;
    name: string;
    nativeName: string;
    flag: string;
    rtl: boolean;
    enabled: boolean;
    completionRate: number;
    quality: number;
}

interface TranslationData {
    [key: string]: string;
}

interface I18nConfig {
    defaultLanguage: string;
    fallbackLanguage: string;
    autoDetect: boolean;
    enableRTL: boolean;
    enablePluralization: boolean;
    enableContext: boolean;
    enableQualityCheck: boolean;
    enableAutoTranslation: boolean;
    translationAPI: string;
    qualityThreshold: number;
}

interface TranslationContext {
    category?: string;
    count?: number;
    gender?: 'male' | 'female' | 'other';
    formality?: 'formal' | 'informal';
    region?: string;
}

export const useInternationalization = () => {
    const [currentLanguage, setCurrentLanguage] = useState<string>('ko');
    const [availableLanguages, setAvailableLanguages] = useState<LanguageConfig[]>([]);
    const [translations, setTranslations] = useState<Record<string, TranslationData>>({});
    const [config, setConfig] = useState<I18nConfig>({
        defaultLanguage: 'ko',
        fallbackLanguage: 'en',
        autoDetect: true,
        enableRTL: false,
        enablePluralization: true,
        enableContext: true,
        enableQualityCheck: true,
        enableAutoTranslation: true,
        translationAPI: 'google',
        qualityThreshold: 80
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 언어 감지
    const detectLanguage = useCallback(() => {
        if (!config.autoDetect) return config.defaultLanguage;

        // 브라우저 언어 감지
        const browserLanguage = navigator.language || navigator.languages?.[0];
        const languageCode = browserLanguage.split('-')[0];

        // 지원되는 언어인지 확인
        const supportedLanguage = availableLanguages.find(lang =>
            lang.code === languageCode || lang.code === browserLanguage
        );

        return supportedLanguage ? supportedLanguage.code : config.defaultLanguage;
    }, [availableLanguages, config]);

    // 언어 변경
    const changeLanguage = useCallback((languageCode: string) => {
        const language = availableLanguages.find(lang => lang.code === languageCode);
        if (!language || !language.enabled) {
            console.warn(`Language ${languageCode} is not available or disabled`);
            return;
        }

        setCurrentLanguage(languageCode);

        // RTL 지원
        if (config.enableRTL) {
            document.documentElement.dir = language.rtl ? 'rtl' : 'ltr';
        }

        // 언어 코드를 HTML에 설정
        document.documentElement.lang = languageCode;

        // 로컬 스토리지에 저장
        localStorage.setItem('preferredLanguage', languageCode);

        // 번역 데이터 로드
        loadTranslations(languageCode);
    }, [availableLanguages, config]);

    // 번역 데이터 로드
    const loadTranslations = useCallback(async (languageCode: string) => {
        try {
            setLoading(true);
            setError(null);

            // 실제로는 API에서 번역 데이터를 가져옴
            const mockTranslations: TranslationData = {
                'common.welcome': languageCode === 'ko' ? '환영합니다' :
                    languageCode === 'en' ? 'Welcome' :
                        languageCode === 'ja' ? 'ようこそ' :
                            languageCode === 'zh-CN' ? '欢迎' :
                                languageCode === 'es' ? 'Bienvenido' :
                                    languageCode === 'fr' ? 'Bienvenue' :
                                        languageCode === 'de' ? 'Willkommen' :
                                            languageCode === 'ar' ? 'أهلاً وسهلاً' :
                                                languageCode === 'hi' ? 'स्वागत है' : 'Welcome',

                'common.login': languageCode === 'ko' ? '로그인' :
                    languageCode === 'en' ? 'Login' :
                        languageCode === 'ja' ? 'ログイン' :
                            languageCode === 'zh-CN' ? '登录' :
                                languageCode === 'es' ? 'Iniciar sesión' :
                                    languageCode === 'fr' ? 'Se connecter' :
                                        languageCode === 'de' ? 'Anmelden' :
                                            languageCode === 'ar' ? 'تسجيل الدخول' :
                                                languageCode === 'hi' ? 'लॉग इन करें' : 'Login',

                'common.logout': languageCode === 'ko' ? '로그아웃' :
                    languageCode === 'en' ? 'Logout' :
                        languageCode === 'ja' ? 'ログアウト' :
                            languageCode === 'zh-CN' ? '登出' :
                                languageCode === 'es' ? 'Cerrar sesión' :
                                    languageCode === 'fr' ? 'Se déconnecter' :
                                        languageCode === 'de' ? 'Abmelden' :
                                            languageCode === 'ar' ? 'تسجيل الخروج' :
                                                languageCode === 'hi' ? 'लॉग आउट करें' : 'Logout',

                'common.save': languageCode === 'ko' ? '저장' :
                    languageCode === 'en' ? 'Save' :
                        languageCode === 'ja' ? '保存' :
                            languageCode === 'zh-CN' ? '保存' :
                                languageCode === 'es' ? 'Guardar' :
                                    languageCode === 'fr' ? 'Enregistrer' :
                                        languageCode === 'de' ? 'Speichern' :
                                            languageCode === 'ar' ? 'حفظ' :
                                                languageCode === 'hi' ? 'सहेजें' : 'Save',

                'common.cancel': languageCode === 'ko' ? '취소' :
                    languageCode === 'en' ? 'Cancel' :
                        languageCode === 'ja' ? 'キャンセル' :
                            languageCode === 'zh-CN' ? '取消' :
                                languageCode === 'es' ? 'Cancelar' :
                                    languageCode === 'fr' ? 'Annuler' :
                                        languageCode === 'de' ? 'Abbrechen' :
                                            languageCode === 'ar' ? 'إلغاء' :
                                                languageCode === 'hi' ? 'रद्द करें' : 'Cancel',

                'common.delete': languageCode === 'ko' ? '삭제' :
                    languageCode === 'en' ? 'Delete' :
                        languageCode === 'ja' ? '削除' :
                            languageCode === 'zh-CN' ? '删除' :
                                languageCode === 'es' ? 'Eliminar' :
                                    languageCode === 'fr' ? 'Supprimer' :
                                        languageCode === 'de' ? 'Löschen' :
                                            languageCode === 'ar' ? 'حذف' :
                                                languageCode === 'hi' ? 'हटाएं' : 'Delete',

                'common.edit': languageCode === 'ko' ? '편집' :
                    languageCode === 'en' ? 'Edit' :
                        languageCode === 'ja' ? '編集' :
                            languageCode === 'zh-CN' ? '编辑' :
                                languageCode === 'es' ? 'Editar' :
                                    languageCode === 'fr' ? 'Modifier' :
                                        languageCode === 'de' ? 'Bearbeiten' :
                                            languageCode === 'ar' ? 'تحرير' :
                                                languageCode === 'hi' ? 'संपादित करें' : 'Edit',

                'common.confirm': languageCode === 'ko' ? '확인' :
                    languageCode === 'en' ? 'Confirm' :
                        languageCode === 'ja' ? '確認' :
                            languageCode === 'zh-CN' ? '确认' :
                                languageCode === 'es' ? 'Confirmar' :
                                    languageCode === 'fr' ? 'Confirmer' :
                                        languageCode === 'de' ? 'Bestätigen' :
                                            languageCode === 'ar' ? 'تأكيد' :
                                                languageCode === 'hi' ? 'पुष्टि करें' : 'Confirm',

                'common.loading': languageCode === 'ko' ? '로딩 중...' :
                    languageCode === 'en' ? 'Loading...' :
                        languageCode === 'ja' ? '読み込み中...' :
                            languageCode === 'zh-CN' ? '加载中...' :
                                languageCode === 'es' ? 'Cargando...' :
                                    languageCode === 'fr' ? 'Chargement...' :
                                        languageCode === 'de' ? 'Laden...' :
                                            languageCode === 'ar' ? 'جاري التحميل...' :
                                                languageCode === 'hi' ? 'लोड हो रहा है...' : 'Loading...',

                'common.error': languageCode === 'ko' ? '오류가 발생했습니다' :
                    languageCode === 'en' ? 'An error occurred' :
                        languageCode === 'ja' ? 'エラーが発生しました' :
                            languageCode === 'zh-CN' ? '发生错误' :
                                languageCode === 'es' ? 'Ocurrió un error' :
                                    languageCode === 'fr' ? 'Une erreur s\'est produite' :
                                        languageCode === 'de' ? 'Ein Fehler ist aufgetreten' :
                                            languageCode === 'ar' ? 'حدث خطأ' :
                                                languageCode === 'hi' ? 'एक त्रुटि हुई' : 'An error occurred'
            };

            setTranslations(prev => ({
                ...prev,
                [languageCode]: mockTranslations
            }));

        } catch (err) {
            setError(`Failed to load translations for ${languageCode}`);
            console.error('Translation load error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // 번역 함수
    const t = useCallback((key: string, context?: TranslationContext): string => {
        const translation = translations[currentLanguage]?.[key];

        if (translation) {
            // 컨텍스트 기반 번역 처리
            if (context && config.enableContext) {
                return processContextualTranslation(translation, context);
            }
            return translation;
        }

        // 폴백 언어로 시도
        const fallbackTranslation = translations[config.fallbackLanguage]?.[key];
        if (fallbackTranslation) {
            console.warn(`Translation missing for key "${key}" in language "${currentLanguage}", using fallback`);
            return fallbackTranslation;
        }

        // 번역이 없으면 키 자체를 반환
        console.warn(`Translation missing for key "${key}"`);
        return key;
    }, [translations, currentLanguage, config]);

    // 컨텍스트 기반 번역 처리
    const processContextualTranslation = (translation: string, context: TranslationContext): string => {
        let processedTranslation = translation;

        // 복수형 처리
        if (context.count !== undefined && config.enablePluralization) {
            processedTranslation = processPluralization(processedTranslation, context.count, currentLanguage);
        }

        // 성별 처리
        if (context.gender && config.enableContext) {
            processedTranslation = processGender(processedTranslation, context.gender, currentLanguage);
        }

        // 격식도 처리
        if (context.formality && config.enableContext) {
            processedTranslation = processFormality(processedTranslation, context.formality, currentLanguage);
        }

        return processedTranslation;
    };

    // 복수형 처리
    const processPluralization = (text: string, count: number, language: string): string => {
        // 간단한 복수형 처리 예시
        if (language === 'en') {
            if (count === 1) {
                return text.replace(/\{count\}/g, count.toString());
            } else {
                return text.replace(/\{count\}/g, count.toString()).replace(/s$/, 's');
            }
        }

        // 한국어는 복수형이 없음
        if (language === 'ko') {
            return text.replace(/\{count\}/g, count.toString());
        }

        return text.replace(/\{count\}/g, count.toString());
    };

    // 성별 처리
    const processGender = (text: string, gender: 'male' | 'female' | 'other', language: string): string => {
        // 언어별 성별 처리 로직
        if (language === 'ar') {
            // 아랍어는 성별에 따라 다른 형태 사용
            switch (gender) {
                case 'male':
                    return text.replace(/ة$/, ''); // 여성형 어미 제거
                case 'female':
                    return text + 'ة'; // 여성형 어미 추가
                default:
                    return text;
            }
        }

        return text;
    };

    // 격식도 처리
    const processFormality = (text: string, formality: 'formal' | 'informal', language: string): string => {
        // 언어별 격식도 처리 로직
        if (language === 'ko') {
            // 한국어는 격식도에 따라 다른 어미 사용
            switch (formality) {
                case 'formal':
                    return text.replace(/다$/, '습니다').replace(/어$/, '습니다');
                case 'informal':
                    return text.replace(/습니다$/, '다').replace(/습니다$/, '어');
                default:
                    return text;
            }
        }

        if (language === 'ja') {
            // 일본어는 격식도에 따라 다른 표현 사용
            switch (formality) {
                case 'formal':
                    return text.replace(/だ$/, 'です').replace(/である$/, 'であります');
                case 'informal':
                    return text.replace(/です$/, 'だ').replace(/であります$/, 'である');
                default:
                    return text;
            }
        }

        return text;
    };

    // 자동 번역
    const autoTranslate = useCallback(async (text: string, targetLanguage: string): Promise<string> => {
        if (!config.enableAutoTranslation) {
            throw new Error('Auto translation is disabled');
        }

        try {
            // 실제로는 번역 API 호출
            const mockTranslations: Record<string, string> = {
                'ko': text,
                'en': text === '환영합니다' ? 'Welcome' : text,
                'ja': text === '환영합니다' ? 'ようこそ' : text,
                'zh-CN': text === '환영합니다' ? '欢迎' : text,
                'es': text === '환영합니다' ? 'Bienvenido' : text,
                'fr': text === '환영합니다' ? 'Bienvenue' : text,
                'de': text === '환영합니다' ? 'Willkommen' : text,
                'ar': text === '환영합니다' ? 'أهلاً وسهلاً' : text,
                'hi': text === '환영합니다' ? 'स्वागत है' : text
            };

            return mockTranslations[targetLanguage] || text;
        } catch (err) {
            console.error('Auto translation error:', err);
            throw err;
        }
    }, [config]);

    // 언어 목록 로드
    const loadLanguages = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const mockLanguages: LanguageConfig[] = [
                { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', rtl: false, enabled: true, completionRate: 100, quality: 98 },
                { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false, enabled: true, completionRate: 100, quality: 100 },
                { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', rtl: false, enabled: true, completionRate: 95, quality: 96 },
                { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳', rtl: false, enabled: true, completionRate: 92, quality: 94 },
                { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', flag: '🇹🇼', rtl: false, enabled: true, completionRate: 88, quality: 92 },
                { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false, enabled: true, completionRate: 85, quality: 90 },
                { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false, enabled: true, completionRate: 82, quality: 88 },
                { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', rtl: false, enabled: true, completionRate: 78, quality: 86 },
                { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true, enabled: true, completionRate: 75, quality: 84 },
                { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', rtl: false, enabled: true, completionRate: 70, quality: 82 }
            ];

            setAvailableLanguages(mockLanguages);

            // 저장된 언어 선호도 확인
            const savedLanguage = localStorage.getItem('preferredLanguage');
            if (savedLanguage && mockLanguages.find(lang => lang.code === savedLanguage)) {
                setCurrentLanguage(savedLanguage);
            } else {
                // 자동 감지
                const detectedLanguage = detectLanguage();
                setCurrentLanguage(detectedLanguage);
            }

        } catch (err) {
            setError('Failed to load languages');
            console.error('Language load error:', err);
        } finally {
            setLoading(false);
        }
    }, [detectLanguage]);

    // 초기화
    useEffect(() => {
        loadLanguages();
    }, [loadLanguages]);

    // 언어 변경 시 번역 로드
    useEffect(() => {
        if (currentLanguage && availableLanguages.length > 0) {
            loadTranslations(currentLanguage);
        }
    }, [currentLanguage, availableLanguages, loadTranslations]);

    // 현재 언어 정보
    const currentLanguageInfo = availableLanguages.find(lang => lang.code === currentLanguage);

    return {
        // 상태
        currentLanguage,
        currentLanguageInfo,
        availableLanguages,
        translations,
        config,
        loading,
        error,

        // 함수
        t,
        changeLanguage,
        autoTranslate,
        loadTranslations,
        loadLanguages,
        setConfig,

        // 유틸리티
        isRTL: currentLanguageInfo?.rtl || false,
        isLanguageSupported: (code: string) => availableLanguages.some(lang => lang.code === code),
        getLanguageName: (code: string) => availableLanguages.find(lang => lang.code === code)?.nativeName || code,
        getLanguageFlag: (code: string) => availableLanguages.find(lang => lang.code === code)?.flag || '🌐'
    };
};

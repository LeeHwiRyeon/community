import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface HighContrastContextType {
    isHighContrast: boolean;
    toggleHighContrast: () => void;
    setHighContrast: (enabled: boolean) => void;
}

const HighContrastContext = createContext<HighContrastContextType | undefined>(undefined);

interface HighContrastProviderProps {
    children: ReactNode;
}

export const HighContrastProvider: React.FC<HighContrastProviderProps> = ({ children }) => {
    const [isHighContrast, setIsHighContrast] = useState(false);

    // 로컬 스토리지에서 고대비 설정 불러오기
    useEffect(() => {
        const saved = localStorage.getItem('highContrast');
        if (saved !== null) {
            setIsHighContrast(JSON.parse(saved));
        } else {
            // 시스템 설정 확인
            const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
            setIsHighContrast(prefersHighContrast);
        }
    }, []);

    // 고대비 설정 변경 시 로컬 스토리지에 저장
    useEffect(() => {
        localStorage.setItem('highContrast', JSON.stringify(isHighContrast));

        // CSS 변수 업데이트
        const root = document.documentElement;
        if (isHighContrast) {
            root.style.setProperty('--chakra-colors-gray-50', '#ffffff');
            root.style.setProperty('--chakra-colors-gray-100', '#f7f7f7');
            root.style.setProperty('--chakra-colors-gray-200', '#e5e5e5');
            root.style.setProperty('--chakra-colors-gray-300', '#d4d4d4');
            root.style.setProperty('--chakra-colors-gray-400', '#a3a3a3');
            root.style.setProperty('--chakra-colors-gray-500', '#737373');
            root.style.setProperty('--chakra-colors-gray-600', '#525252');
            root.style.setProperty('--chakra-colors-gray-700', '#404040');
            root.style.setProperty('--chakra-colors-gray-800', '#262626');
            root.style.setProperty('--chakra-colors-gray-900', '#171717');

            root.style.setProperty('--chakra-colors-blue-500', '#0066cc');
            root.style.setProperty('--chakra-colors-blue-600', '#0052a3');
            root.style.setProperty('--chakra-colors-red-500', '#cc0000');
            root.style.setProperty('--chakra-colors-red-600', '#a30000');
            root.style.setProperty('--chakra-colors-green-500', '#00aa00');
            root.style.setProperty('--chakra-colors-green-600', '#008800');
            root.style.setProperty('--chakra-colors-yellow-500', '#ffaa00');
            root.style.setProperty('--chakra-colors-yellow-600', '#cc8800');

            // 고대비 테마 클래스 추가
            document.body.classList.add('high-contrast');
        } else {
            // 기본 색상으로 복원
            root.style.removeProperty('--chakra-colors-gray-50');
            root.style.removeProperty('--chakra-colors-gray-100');
            root.style.removeProperty('--chakra-colors-gray-200');
            root.style.removeProperty('--chakra-colors-gray-300');
            root.style.removeProperty('--chakra-colors-gray-400');
            root.style.removeProperty('--chakra-colors-gray-500');
            root.style.removeProperty('--chakra-colors-gray-600');
            root.style.removeProperty('--chakra-colors-gray-700');
            root.style.removeProperty('--chakra-colors-gray-800');
            root.style.removeProperty('--chakra-colors-gray-900');

            root.style.removeProperty('--chakra-colors-blue-500');
            root.style.removeProperty('--chakra-colors-blue-600');
            root.style.removeProperty('--chakra-colors-red-500');
            root.style.removeProperty('--chakra-colors-red-600');
            root.style.removeProperty('--chakra-colors-green-500');
            root.style.removeProperty('--chakra-colors-green-600');
            root.style.removeProperty('--chakra-colors-yellow-500');
            root.style.removeProperty('--chakra-colors-yellow-600');

            // 고대비 테마 클래스 제거
            document.body.classList.remove('high-contrast');
        }
    }, [isHighContrast]);

    const toggleHighContrast = () => {
        setIsHighContrast(prev => !prev);
    };

    const setHighContrast = (enabled: boolean) => {
        setIsHighContrast(enabled);
    };

    return (
        <HighContrastContext.Provider value={{
            isHighContrast,
            toggleHighContrast,
            setHighContrast
        }}>
            {children}
        </HighContrastContext.Provider>
    );
};

export const useHighContrast = (): HighContrastContextType => {
    const context = useContext(HighContrastContext);
    if (context === undefined) {
        throw new Error('useHighContrast must be used within a HighContrastProvider');
    }
    return context;
};

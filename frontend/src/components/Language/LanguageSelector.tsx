import React, { useState } from 'react';
import {
    Box,
    Button,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    MenuItemOption,
    MenuGroup,
    MenuDivider,
    Text,
    HStack,
    VStack,
    useToast,
    Spinner,
    Badge,
    IconButton,
    Tooltip
} from '@chakra-ui/react';
import { ChevronDownIcon, GlobeIcon } from '@chakra-ui/icons';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, changeLanguage, getCurrentLanguage } from '../../i18n/i18n';

interface LanguageSelectorProps {
    variant?: 'button' | 'menu' | 'compact';
    showFlags?: boolean;
    showNativeNames?: boolean;
    showStats?: boolean;
    onLanguageChange?: (languageCode: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
    variant = 'button',
    showFlags = true,
    showNativeNames = true,
    showStats = false,
    onLanguageChange
}) => {
    const { t, i18n } = useTranslation();
    const [isChanging, setIsChanging] = useState(false);
    const toast = useToast();
    const currentLanguage = getCurrentLanguage();

    const handleLanguageChange = async (languageCode: string) => {
        if (languageCode === i18n.language) return;

        setIsChanging(true);
        try {
            const success = await changeLanguage(languageCode);
            if (success) {
                toast({
                    title: t('language.changed', {
                        language: SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode)?.nativeName
                    }),
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });

                if (onLanguageChange) {
                    onLanguageChange(languageCode);
                }
            } else {
                throw new Error('Language change failed');
            }
        } catch (error) {
            toast({
                title: t('language.changeError'),
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsChanging(false);
        }
    };

    const getLanguageStats = (languageCode: string) => {
        // 실제로는 번역 완성도 통계를 가져옴
        const stats = {
            'ko': 100,
            'en': 95,
            'ja': 85,
            'zh-CN': 80,
            'zh-TW': 75,
            'es': 70,
            'fr': 65,
            'de': 60,
            'ru': 55,
            'ar': 50
        };
        return stats[languageCode] || 0;
    };

    if (variant === 'compact') {
        return (
            <Tooltip label={t('language.select')} placement="bottom">
                <IconButton
                    aria-label={t('language.select')}
                    icon={<GlobeIcon />}
                    variant="ghost"
                    size="sm"
                    onClick={() => {/* 간단한 언어 변경 로직 */ }}
                />
            </Tooltip>
        );
    }

    if (variant === 'menu') {
        return (
            <Menu>
                <MenuButton as={Button} rightIcon={<ChevronDownIcon />} variant="outline">
                    <HStack spacing={2}>
                        {showFlags && <Text fontSize="lg">{currentLanguage?.flag}</Text>}
                        <Text>{currentLanguage?.nativeName}</Text>
                        {isChanging && <Spinner size="sm" />}
                    </HStack>
                </MenuButton>
                <MenuList maxH="400px" overflowY="auto">
                    <MenuGroup title={t('language.select')}>
                        {SUPPORTED_LANGUAGES.map((language) => (
                            <MenuItem
                                key={language.code}
                                onClick={() => handleLanguageChange(language.code)}
                                isDisabled={isChanging}
                            >
                                <HStack spacing={3} width="100%">
                                    {showFlags && <Text fontSize="lg">{language.flag}</Text>}
                                    <VStack align="start" spacing={0} flex={1}>
                                        <Text fontWeight="medium">{language.nativeName}</Text>
                                        {showNativeNames && language.name !== language.nativeName && (
                                            <Text fontSize="sm" color="gray.500">{language.name}</Text>
                                        )}
                                    </VStack>
                                    {showStats && (
                                        <Badge
                                            colorScheme={getLanguageStats(language.code) >= 80 ? 'green' :
                                                getLanguageStats(language.code) >= 60 ? 'yellow' : 'red'}
                                            variant="subtle"
                                        >
                                            {getLanguageStats(language.code)}%
                                        </Badge>
                                    )}
                                    {language.code === i18n.language && (
                                        <Badge colorScheme="blue" variant="solid">
                                            {t('language.current')}
                                        </Badge>
                                    )}
                                </HStack>
                            </MenuItem>
                        ))}
                    </MenuGroup>
                    <MenuDivider />
                    <MenuItem onClick={() => {/* 언어 설정 페이지로 이동 */ }}>
                        <Text color="blue.500">{t('language.settings')}</Text>
                    </MenuItem>
                </MenuList>
            </Menu>
        );
    }

    // 기본 버튼 형태
    return (
        <Box>
            <Text fontSize="sm" color="gray.600" mb={2}>
                {t('language.current')}: {currentLanguage?.nativeName}
            </Text>
            <VStack spacing={2} align="stretch">
                {SUPPORTED_LANGUAGES.slice(0, 5).map((language) => (
                    <Button
                        key={language.code}
                        variant={language.code === i18n.language ? 'solid' : 'outline'}
                        colorScheme={language.code === i18n.language ? 'blue' : 'gray'}
                        onClick={() => handleLanguageChange(language.code)}
                        isDisabled={isChanging}
                        size="sm"
                    >
                        <HStack spacing={2}>
                            {showFlags && <Text fontSize="lg">{language.flag}</Text>}
                            <Text>{language.nativeName}</Text>
                            {isChanging && language.code !== i18n.language && <Spinner size="xs" />}
                        </HStack>
                    </Button>
                ))}
                {SUPPORTED_LANGUAGES.length > 5 && (
                    <Button variant="ghost" size="sm" color="blue.500">
                        {t('language.showMore')} ({SUPPORTED_LANGUAGES.length - 5})
                    </Button>
                )}
            </VStack>
        </Box>
    );
};

export default LanguageSelector;

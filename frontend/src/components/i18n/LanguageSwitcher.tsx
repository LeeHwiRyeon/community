/**
 * LanguageSwitcher Component
 * 언어 전환 컴포넌트
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Typography,
    Divider,
    Tooltip
} from '@mui/material';
import {
    Language as LanguageIcon,
    Check as CheckIcon
} from '@mui/icons-material';
import { supportedLanguages, changeLanguage } from '../../i18n/config';
import './LanguageSwitcher.css';

interface LanguageSwitcherProps {
    variant?: 'icon' | 'text' | 'both';
    showFlag?: boolean;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
    variant = 'icon',
    showFlag = true
}) => {
    const { t, i18n } = useTranslation();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const currentLanguage = i18n.language || 'ko';
    const currentLangData = supportedLanguages.find(lang => lang.code === currentLanguage);

    /**
     * 메뉴 열기
     */
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    /**
     * 메뉴 닫기
     */
    const handleClose = () => {
        setAnchorEl(null);
    };

    /**
     * 언어 선택
     */
    const handleLanguageSelect = async (languageCode: string) => {
        await changeLanguage(languageCode);
        handleClose();
    };

    /**
     * 버튼 렌더링
     */
    const renderButton = () => {
        if (variant === 'icon') {
            return (
                <Tooltip title={t('common.language')}>
                    <IconButton
                        onClick={handleClick}
                        className="language-switcher-button"
                        aria-label="change language"
                        aria-controls={open ? 'language-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={open ? 'true' : undefined}
                    >
                        {showFlag && currentLangData ? (
                            <span className="language-flag">{currentLangData.flag}</span>
                        ) : (
                            <LanguageIcon />
                        )}
                    </IconButton>
                </Tooltip>
            );
        }

        if (variant === 'text') {
            return (
                <button
                    onClick={handleClick}
                    className="language-switcher-text-button"
                    aria-label="change language"
                >
                    {showFlag && currentLangData && (
                        <span className="language-flag">{currentLangData.flag}</span>
                    )}
                    <span>{currentLangData?.nativeName || currentLanguage.toUpperCase()}</span>
                </button>
            );
        }

        return (
            <button
                onClick={handleClick}
                className="language-switcher-both-button"
                aria-label="change language"
            >
                {showFlag && currentLangData ? (
                    <span className="language-flag">{currentLangData.flag}</span>
                ) : (
                    <LanguageIcon />
                )}
                <span>{currentLangData?.nativeName || currentLanguage.toUpperCase()}</span>
            </button>
        );
    };

    return (
        <div className="language-switcher">
            {renderButton()}

            <Menu
                id="language-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'language-button',
                }}
                className="language-menu"
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <div className="language-menu-header">
                    <Typography variant="subtitle2" className="language-menu-title">
                        {t('common.language')}
                    </Typography>
                </div>

                <Divider />

                {supportedLanguages.map((language) => (
                    <MenuItem
                        key={language.code}
                        onClick={() => handleLanguageSelect(language.code)}
                        selected={currentLanguage === language.code}
                        className="language-menu-item"
                    >
                        {showFlag && (
                            <ListItemIcon className="language-menu-flag">
                                <span className="language-flag-large">{language.flag}</span>
                            </ListItemIcon>
                        )}

                        <ListItemText
                            primary={language.nativeName}
                            secondary={language.name !== language.nativeName ? language.name : undefined}
                            className="language-menu-text"
                        />

                        {currentLanguage === language.code && (
                            <CheckIcon className="language-check-icon" fontSize="small" />
                        )}
                    </MenuItem>
                ))}

                <Divider />

                <div className="language-menu-footer">
                    <Typography variant="caption" color="text.secondary">
                        {supportedLanguages.length} {t('common.language')}s
                    </Typography>
                </div>
            </Menu>
        </div>
    );
};

export default LanguageSwitcher;

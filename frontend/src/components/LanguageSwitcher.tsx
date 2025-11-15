import React from 'react';
import {
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Tooltip,
    Box,
    Typography
} from '@mui/material';
import {
    Language as LanguageIcon,
    Check as CheckIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface LanguageSwitcherProps {
    size?: 'small' | 'medium' | 'large';
    edge?: 'start' | 'end' | false;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
    size = 'medium',
    edge = false
}) => {
    const { i18n, t } = useTranslation();
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const languages = [
        { code: 'ko', name: '한국어', nativeName: '한국어' },
        { code: 'en', name: 'English', nativeName: 'English' }
    ];

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLanguageChange = (languageCode: string) => {
        i18n.changeLanguage(languageCode);
        handleClose();
    };

    const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

    return (
        <>
            <Tooltip title={t('common.language')}>
                <IconButton
                    size={size}
                    edge={edge}
                    color="inherit"
                    onClick={handleClick}
                    aria-label={t('common.language')}
                    aria-controls={open ? 'language-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                >
                    <LanguageIcon />
                </IconButton>
            </Tooltip>
            <Menu
                id="language-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    sx: {
                        minWidth: 200,
                        mt: 1
                    }
                }}
            >
                <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                        {t('common.language')}
                    </Typography>
                </Box>
                {languages.map((language) => (
                    <MenuItem
                        key={language.code}
                        onClick={() => handleLanguageChange(language.code)}
                        selected={i18n.language === language.code}
                        sx={{
                            py: 1.5,
                            '&.Mui-selected': {
                                backgroundColor: 'action.selected',
                                '&:hover': {
                                    backgroundColor: 'action.hover',
                                }
                            }
                        }}
                    >
                        <ListItemText
                            primary={language.nativeName}
                            secondary={language.name}
                            primaryTypographyProps={{
                                fontWeight: i18n.language === language.code ? 600 : 400
                            }}
                        />
                        {i18n.language === language.code && (
                            <ListItemIcon sx={{ minWidth: 'auto', ml: 2 }}>
                                <CheckIcon fontSize="small" color="primary" />
                            </ListItemIcon>
                        )}
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};

export default LanguageSwitcher;

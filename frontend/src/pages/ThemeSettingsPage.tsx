import React from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Card,
    CardContent,
    Button,
    Divider,
    Stack,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    FormLabel,
    Alert,
    Chip
} from '@mui/material';
import {
    Brightness4,
    Brightness7,
    BrightnessAuto,
    Palette as PaletteIcon,
    CheckCircle
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

const ThemeSettingsPage: React.FC = () => {
    const { mode, setTheme } = useTheme();
    const { t } = useTranslation();

    const handleThemeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newMode = event.target.value as 'light' | 'dark';
        setTheme(newMode);
    };

    const themePreview = [
        {
            name: t('theme.light'),
            value: 'light',
            icon: <Brightness7 sx={{ fontSize: 40 }} />,
            description: t('theme.lightDescription'),
            colors: {
                primary: '#3b82f6',
                background: '#f8fafc',
                surface: '#ffffff',
                text: '#0f172a'
            }
        },
        {
            name: t('theme.dark'),
            value: 'dark',
            icon: <Brightness4 sx={{ fontSize: 40 }} />,
            description: t('theme.darkDescription'),
            colors: {
                primary: '#60a5fa',
                background: '#0f172a',
                surface: '#1e293b',
                text: '#f1f5f9'
            }
        }
    ];

    const features = [
        {
            title: t('theme.features.autoDetection'),
            description: t('theme.features.autoDetectionDesc'),
            icon: <BrightnessAuto color="primary" />
        },
        {
            title: t('theme.features.consistentDesign'),
            description: t('theme.features.consistentDesignDesc'),
            icon: <PaletteIcon color="primary" />
        },
        {
            title: t('theme.features.instantApply'),
            description: t('theme.features.instantApplyDesc'),
            icon: <CheckCircle color="primary" />
        }
    ];

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
            <Container maxWidth="lg">
                {/* Header */}
                <Box mb={4}>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        {t('theme.title')}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {t('theme.description')}
                    </Typography>
                </Box>

                {/* Current Theme Status */}
                <Alert severity="info" sx={{ mb: 4 }}>
                    {t('theme.currentTheme', { mode: mode === 'light' ? t('theme.light') : t('theme.dark') })}
                </Alert>

                {/* Theme Selection */}
                <Paper sx={{ p: 4, mb: 4 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {t('theme.title')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        {t('theme.description')}
                    </Typography>

                    <Divider sx={{ my: 3 }} />

                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        {themePreview.map((theme) => (
                            <Card
                                key={theme.value}
                                sx={{
                                    flex: '1 1 calc(50% - 12px)',
                                    minWidth: 280,
                                    border: mode === theme.value ? 2 : 1,
                                    borderColor: mode === theme.value ? 'primary.main' : 'divider',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                        boxShadow: 3
                                    }
                                }}
                                onClick={() => setTheme(theme.value as 'light' | 'dark')}
                            >
                                <CardContent>
                                    <Box display="flex" alignItems="center" mb={2}>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: 60,
                                                height: 60,
                                                borderRadius: '50%',
                                                bgcolor: 'background.default',
                                                mr: 2
                                            }}
                                        >
                                            {theme.icon}
                                        </Box>
                                        <Box flex={1}>
                                            <Typography variant="h6" fontWeight="bold">
                                                {theme.name}
                                                {mode === theme.value && (
                                                    <Chip
                                                        label={t('theme.applyTheme')}
                                                        size="small"
                                                        color="primary"
                                                        sx={{ ml: 1 }}
                                                    />
                                                )}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {theme.description}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Color Palette Preview */}
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" gutterBottom>
                                            {t('theme.colorPalette')}
                                        </Typography>
                                        <Stack direction="row" spacing={1} mt={1}>
                                            <Box
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: 1,
                                                    bgcolor: theme.colors.primary,
                                                    border: '2px solid',
                                                    borderColor: 'divider'
                                                }}
                                                title="Primary"
                                            />
                                            <Box
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: 1,
                                                    bgcolor: theme.colors.background,
                                                    border: '2px solid',
                                                    borderColor: 'divider'
                                                }}
                                                title="Background"
                                            />
                                            <Box
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: 1,
                                                    bgcolor: theme.colors.surface,
                                                    border: '2px solid',
                                                    borderColor: 'divider'
                                                }}
                                                title="Surface"
                                            />
                                            <Box
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: 1,
                                                    bgcolor: theme.colors.text,
                                                    border: '2px solid',
                                                    borderColor: 'divider'
                                                }}
                                                title="Text"
                                            />
                                        </Stack>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                </Paper>

                {/* Features */}
                <Paper sx={{ p: 4, mb: 4 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {t('theme.features.title')}
                    </Typography>

                    <Divider sx={{ my: 3 }} />

                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        {features.map((feature, index) => (
                            <Box
                                key={index}
                                sx={{
                                    flex: '1 1 calc(33.333% - 16px)',
                                    minWidth: 200,
                                    textAlign: 'center'
                                }}
                            >
                                <Box mb={2}>{feature.icon}</Box>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    {feature.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {feature.description}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>

                {/* Additional Info */}
                <Paper sx={{ p: 4 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {t('theme.additionalInfo.title')}
                    </Typography>

                    <Stack spacing={2} mt={2}>
                        <Box>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                {t('theme.additionalInfo.localStorage')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {t('theme.additionalInfo.localStorageDesc')}
                            </Typography>
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                {t('theme.additionalInfo.systemDetection')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {t('theme.additionalInfo.systemDetectionDesc')}
                            </Typography>
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                {t('theme.additionalInfo.accessibility')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {t('theme.additionalInfo.accessibilityDesc')}
                            </Typography>
                        </Box>
                    </Stack>
                </Paper>

                {/* Quick Actions */}
                <Box mt={4} display="flex" justifyContent="center" gap={2}>
                    <Button
                        variant={mode === 'light' ? 'contained' : 'outlined'}
                        startIcon={<Brightness7 />}
                        onClick={() => setTheme('light')}
                    >
                        {t('theme.light')}
                    </Button>
                    <Button
                        variant={mode === 'dark' ? 'contained' : 'outlined'}
                        startIcon={<Brightness4 />}
                        onClick={() => setTheme('dark')}
                    >
                        {t('theme.dark')}
                    </Button>
                </Box>
            </Container>
        </Box>
    );
};

export default ThemeSettingsPage;

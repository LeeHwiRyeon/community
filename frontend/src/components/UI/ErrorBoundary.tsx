import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    Container,
    Alert,
    Stack,
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo,
        });
    }

    private handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    private handleReload = () => {
        window.location.reload();
    };

    private handleGoHome = () => {
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <Container maxWidth="md" sx={{ py: 8 }}>
                    <Card sx={{ textAlign: 'center', boxShadow: 3 }}>
                        <CardContent sx={{ p: 4 }}>
                            <ErrorOutlineIcon
                                sx={{ fontSize: 80, color: 'error.main', mb: 2 }}
                            />

                            <Typography variant="h4" gutterBottom fontWeight="bold">
                                앗! 문제가 발생했습니다
                            </Typography>

                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                예상치 못한 오류가 발생했습니다. 불편을 드려 죄송합니다.
                            </Typography>

                            {this.state.error && (
                                <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                        오류 메시지:
                                    </Typography>
                                    <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                                        {this.state.error.toString()}
                                    </Typography>
                                </Alert>
                            )}

                            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                                <Alert severity="warning" sx={{ mb: 3, textAlign: 'left', maxHeight: 200, overflow: 'auto' }}>
                                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                        스택 추적 (개발 모드):
                                    </Typography>
                                    <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>
                                        {this.state.errorInfo.componentStack}
                                    </Typography>
                                </Alert>
                            )}

                            <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                spacing={2}
                                justifyContent="center"
                                sx={{ mt: 4 }}
                            >
                                <Button
                                    variant="contained"
                                    startIcon={<RefreshIcon />}
                                    onClick={this.handleReload}
                                    size="large"
                                >
                                    페이지 새로고침
                                </Button>

                                <Button
                                    variant="outlined"
                                    startIcon={<HomeIcon />}
                                    onClick={this.handleGoHome}
                                    size="large"
                                >
                                    홈으로 이동
                                </Button>

                                {process.env.NODE_ENV === 'development' && (
                                    <Button
                                        variant="text"
                                        onClick={this.handleReset}
                                        size="large"
                                    >
                                        에러 초기화 (개발용)
                                    </Button>
                                )}
                            </Stack>

                            <Box sx={{ mt: 4 }}>
                                <Typography variant="body2" color="text.secondary">
                                    문제가 지속되면 관리자에게 문의해주세요.
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Container>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

interface SnackbarMessage {
    message: string;
    severity: AlertColor;
    key: number;
}

interface SnackbarContextType {
    showSnackbar: (message: string, severity?: AlertColor) => void;
    showSuccess: (message: string) => void;
    showError: (message: string) => void;
    showWarning: (message: string) => void;
    showInfo: (message: string) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export const useSnackbar = (): SnackbarContextType => {
    const context = useContext(SnackbarContext);
    if (!context) {
        throw new Error('useSnackbar must be used within SnackbarProvider');
    }
    return context;
};

interface SnackbarProviderProps {
    children: React.ReactNode;
}

export const SnackbarProvider: React.FC<SnackbarProviderProps> = ({ children }) => {
    const [snackPack, setSnackPack] = useState<readonly SnackbarMessage[]>([]);
    const [open, setOpen] = useState(false);
    const [messageInfo, setMessageInfo] = useState<SnackbarMessage | undefined>(undefined);

    React.useEffect(() => {
        if (snackPack.length && !messageInfo) {
            // 새 메시지 표시
            setMessageInfo({ ...snackPack[0] });
            setSnackPack((prev) => prev.slice(1));
            setOpen(true);
        } else if (snackPack.length && messageInfo && open) {
            // 이미 표시 중이면 닫기
            setOpen(false);
        }
    }, [snackPack, messageInfo, open]);

    const showSnackbar = useCallback(
        (message: string, severity: AlertColor = 'info') => {
            setSnackPack((prev) => [
                ...prev,
                { message, severity, key: new Date().getTime() },
            ]);
        },
        []
    );

    const showSuccess = useCallback(
        (message: string) => {
            showSnackbar(message, 'success');
        },
        [showSnackbar]
    );

    const showError = useCallback(
        (message: string) => {
            showSnackbar(message, 'error');
        },
        [showSnackbar]
    );

    const showWarning = useCallback(
        (message: string) => {
            showSnackbar(message, 'warning');
        },
        [showSnackbar]
    );

    const showInfo = useCallback(
        (message: string) => {
            showSnackbar(message, 'info');
        },
        [showSnackbar]
    );

    const handleClose = (
        event: React.SyntheticEvent | Event,
        reason?: string
    ) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    };

    const handleExited = () => {
        setMessageInfo(undefined);
    };

    return (
        <SnackbarContext.Provider
            value={{
                showSnackbar,
                showSuccess,
                showError,
                showWarning,
                showInfo,
            }}
        >
            {children}
            <Snackbar
                key={messageInfo ? messageInfo.key : undefined}
                open={open}
                autoHideDuration={6000}
                onClose={handleClose}
                TransitionProps={{ onExited: handleExited }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleClose}
                    severity={messageInfo?.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {messageInfo?.message}
                </Alert>
            </Snackbar>
        </SnackbarContext.Provider>
    );
};

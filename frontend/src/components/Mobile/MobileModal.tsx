import React, { useEffect } from 'react';
import { Box, BoxProps, IconButton, Text, VStack } from '@chakra-ui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface MobileModalProps extends BoxProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    showCloseButton?: boolean;
}

const MobileModal: React.FC<MobileModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    showCloseButton = true,
    ...props
}) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <Box className="mobile-modal" onClick={onClose}>
            <Box
                className="mobile-modal-content"
                onClick={(e) => e.stopPropagation()}
                {...props}
            >
                {(title || showCloseButton) && (
                    <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={4}
                    >
                        {title && (
                            <Text fontSize="lg" fontWeight="semibold">
                                {title}
                            </Text>
                        )}
                        {showCloseButton && (
                            <IconButton
                                aria-label="닫기"
                                icon={<XMarkIcon />}
                                size="sm"
                                variant="ghost"
                                onClick={onClose}
                            />
                        )}
                    </Box>
                )}
                {children}
            </Box>
        </Box>
    );
};

export default MobileModal;

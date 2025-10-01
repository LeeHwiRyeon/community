import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
    Box,
    Button,
    VStack,
    Text,
    Heading,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    useColorModeValue
} from '@chakra-ui/react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Global Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the entire app
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error,
            errorInfo: null
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error to console and external service
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // Log to external error tracking service
        this.logErrorToService(error, errorInfo);

        this.setState({
            error,
            errorInfo
        });
    }

    private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
        // In a real application, you would send this to an error tracking service
        // like Sentry, LogRocket, or Bugsnag
        try {
            // Example: Send to error tracking service
            // errorTrackingService.captureException(error, {
            //   extra: errorInfo,
            //   tags: {
            //     component: 'ErrorBoundary'
            //   }
            // });

            console.log('Error logged to service:', {
                message: error.message,
                stack: error.stack,
                componentStack: errorInfo.componentStack
            });
        } catch (loggingError) {
            console.error('Failed to log error to service:', loggingError);
        }
    };

    private handleRetry = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    private handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return <DefaultErrorFallback
                error={this.state.error}
                onRetry={this.handleRetry}
                onReload={this.handleReload}
            />;
        }

        return this.props.children;
    }
}

/**
 * Default Error Fallback Component
 */
interface ErrorFallbackProps {
    error: Error | null;
    onRetry: () => void;
    onReload: () => void;
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
    error,
    onRetry,
    onReload
}) => {
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    return (
        <Box
            minH="100vh"
            display="flex"
            alignItems="center"
            justifyContent="center"
            p={4}
            bg={bgColor}
        >
            <Box
                maxW="md"
                w="full"
                p={6}
                borderWidth={1}
                borderRadius="lg"
                borderColor={borderColor}
                boxShadow="lg"
            >
                <VStack spacing={4} align="stretch">
                    <Alert status="error" borderRadius="md">
                        <AlertIcon />
                        <Box>
                            <AlertTitle>Something went wrong!</AlertTitle>
                            <AlertDescription>
                                An unexpected error occurred. Please try again or reload the page.
                            </AlertDescription>
                        </Box>
                    </Alert>

                    <VStack spacing={3} align="stretch">
                        <Heading size="md" color="red.500">
                            Error Details
                        </Heading>

                        {error && (
                            <Box
                                p={3}
                                bg="red.50"
                                borderRadius="md"
                                borderLeft="4px solid"
                                borderLeftColor="red.500"
                            >
                                <Text fontSize="sm" fontWeight="bold" color="red.700">
                                    {error.name}: {error.message}
                                </Text>
                                {process.env.NODE_ENV === 'development' && error.stack && (
                                    <Text
                                        fontSize="xs"
                                        color="red.600"
                                        mt={2}
                                        fontFamily="mono"
                                        whiteSpace="pre-wrap"
                                        overflow="auto"
                                        maxH="200px"
                                    >
                                        {error.stack}
                                    </Text>
                                )}
                            </Box>
                        )}

                        <VStack spacing={2} align="stretch">
                            <Button
                                colorScheme="blue"
                                onClick={onRetry}
                                size="md"
                            >
                                Try Again
                            </Button>

                            <Button
                                variant="outline"
                                onClick={onReload}
                                size="md"
                            >
                                Reload Page
                            </Button>
                        </VStack>
                    </VStack>
                </VStack>
            </Box>
        </Box>
    );
};

/**
 * Hook for error boundary functionality
 */
export const useErrorHandler = () => {
    const handleError = (error: Error, errorInfo?: ErrorInfo) => {
        console.error('Error caught by useErrorHandler:', error, errorInfo);

        // Log to external service
        // errorTrackingService.captureException(error, {
        //   extra: errorInfo,
        //   tags: {
        //     hook: 'useErrorHandler'
        //   }
        // });
    };

    return { handleError };
};

export default ErrorBoundary;

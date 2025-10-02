import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Mock component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
        throw new Error('Test error');
    }
    return <div>No error</div>;
};

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
    console.error = jest.fn();
});

afterAll(() => {
    console.error = originalConsoleError;
});

describe('ErrorBoundary', () => {
    it('should render children when there is no error', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={false} />
            </ErrorBoundary>
        );

        expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should render error fallback when there is an error', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Something went wrong!')).toBeInTheDocument();
        expect(screen.getByText('An unexpected error occurred. Please try again or reload the page.')).toBeInTheDocument();
    });

    it('should show error details in development mode', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';

        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Error: Test error')).toBeInTheDocument();

        process.env.NODE_ENV = originalEnv;
    });

    it('should not show error details in production mode', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.queryByText('Error: Test error')).not.toBeInTheDocument();

        process.env.NODE_ENV = originalEnv;
    });

    it('should call onError callback when provided', () => {
        const onError = jest.fn();

        render(
            <ErrorBoundary onError={onError}>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(onError).toHaveBeenCalledWith(
            expect.any(Error),
            expect.objectContaining({
                componentStack: expect.any(String)
            })
        );
    });

    it('should render custom fallback when provided', () => {
        const customFallback = <div>Custom error fallback</div>;

        render(
            <ErrorBoundary fallback={customFallback}>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Custom error fallback')).toBeInTheDocument();
    });

    it('should handle retry button click', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        const retryButton = screen.getByText('Try Again');
        fireEvent.click(retryButton);

        // Error should be cleared and children should render
        expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should handle reload button click', () => {
        const reloadSpy = jest.spyOn(window.location, 'reload').mockImplementation(() => { });

        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        const reloadButton = screen.getByText('Reload Page');
        fireEvent.click(reloadButton);

        expect(reloadSpy).toHaveBeenCalled();

        reloadSpy.mockRestore();
    });
});

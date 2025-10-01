/**
 * Custom hook for screen capture functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface ScreenCaptureOptions {
    video?: boolean;
    audio?: boolean;
    width?: number;
    height?: number;
    frameRate?: number;
    cursor?: 'always' | 'motion' | 'never';
    displaySurface?: 'monitor' | 'window' | 'browser';
    logicalSurface?: boolean;
    systemAudio?: 'include' | 'exclude' | 'auto';
    surfaceSwitching?: 'include' | 'exclude' | 'auto';
    selfBrowserSurface?: 'include' | 'exclude' | 'auto';
}

export interface UseScreenCaptureOptions {
    onStart?: () => void;
    onStop?: () => void;
    onError?: (error: Error) => void;
    onFrame?: (canvas: HTMLCanvasElement) => void;
}

export function useScreenCapture(
    options: UseScreenCaptureOptions = {}
): {
    isSupported: boolean;
    isActive: boolean;
    stream: MediaStream | null;
    videoRef: React.RefObject<HTMLVideoElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    start: (screenCaptureOptions?: ScreenCaptureOptions) => Promise<void>;
    stop: () => void;
    capture: () => string | null;
    captureBlob: () => Blob | null;
    setResolution: (width: number, height: number) => void;
    setFrameRate: (frameRate: number) => void;
    setCursor: (cursor: 'always' | 'motion' | 'never') => void;
    setDisplaySurface: (displaySurface: 'monitor' | 'window' | 'browser') => void;
    toggleAudio: () => void;
    toggleVideo: () => void;
} {
    const { onStart, onStop, onError, onFrame } = options;
    const [isSupported, setIsSupported] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [screenCaptureOptions, setScreenCaptureOptions] = useState<ScreenCaptureOptions>({
        video: true,
        audio: false,
        width: 1920,
        height: 1080,
        frameRate: 30,
        cursor: 'motion',
        displaySurface: 'monitor',
        logicalSurface: true,
        systemAudio: 'auto',
        surfaceSwitching: 'auto',
        selfBrowserSurface: 'auto',
    });

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>();

    useEffect(() => {
        const supported = 'mediaDevices' in navigator && 'getDisplayMedia' in navigator.mediaDevices;
        setIsSupported(supported);
    }, []);

    const start = useCallback(async (newScreenCaptureOptions?: ScreenCaptureOptions) => {
        if (!isSupported) return;

        try {
            const options = { ...screenCaptureOptions, ...newScreenCaptureOptions };
            setScreenCaptureOptions(options);

            const constraints: MediaStreamConstraints = {
                video: options.video ? {
                    width: options.width,
                    height: options.height,
                    frameRate: options.frameRate,
                    cursor: options.cursor,
                    displaySurface: options.displaySurface,
                    logicalSurface: options.logicalSurface,
                    systemAudio: options.systemAudio,
                    surfaceSwitching: options.surfaceSwitching,
                    selfBrowserSurface: options.selfBrowserSurface,
                } : false,
                audio: options.audio ? {
                    systemAudio: options.systemAudio,
                } : false,
            };

            const mediaStream = await navigator.mediaDevices.getDisplayMedia(constraints);
            setStream(mediaStream);
            setIsActive(true);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.play();
            }

            onStart?.();
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            onError?.(err);
        }
    }, [isSupported, screenCaptureOptions, onStart, onError]);

    const stop = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            setIsActive(false);

            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }

            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }

            onStop?.();
        }
    }, [stream, onStop]);

    const capture = useCallback((): string | null => {
        if (!videoRef.current || !canvasRef.current) return null;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return null;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        return canvas.toDataURL('image/png');
    }, []);

    const captureBlob = useCallback((): Blob | null => {
        if (!videoRef.current || !canvasRef.current) return null;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return null;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        return new Promise<Blob | null>((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/png');
        });
    }, []);

    const setResolution = useCallback((width: number, height: number) => {
        setScreenCaptureOptions(prev => ({ ...prev, width, height }));
    }, []);

    const setFrameRate = useCallback((frameRate: number) => {
        setScreenCaptureOptions(prev => ({ ...prev, frameRate }));
    }, []);

    const setCursor = useCallback((cursor: 'always' | 'motion' | 'never') => {
        setScreenCaptureOptions(prev => ({ ...prev, cursor }));
    }, []);

    const setDisplaySurface = useCallback((displaySurface: 'monitor' | 'window' | 'browser') => {
        setScreenCaptureOptions(prev => ({ ...prev, displaySurface }));
    }, []);

    const toggleAudio = useCallback(() => {
        setScreenCaptureOptions(prev => ({ ...prev, audio: !prev.audio }));
    }, []);

    const toggleVideo = useCallback(() => {
        setScreenCaptureOptions(prev => ({ ...prev, video: !prev.video }));
    }, []);

    // Capture frames for processing
    useEffect(() => {
        if (isActive && videoRef.current && canvasRef.current && onFrame) {
            const captureFrame = () => {
                if (videoRef.current && canvasRef.current) {
                    const video = videoRef.current;
                    const canvas = canvasRef.current;
                    const context = canvas.getContext('2d');

                    if (context) {
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        context.drawImage(video, 0, 0);
                        onFrame(canvas);
                    }
                }

                animationFrameRef.current = requestAnimationFrame(captureFrame);
            };

            captureFrame();
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isActive, onFrame]);

    return {
        isSupported,
        isActive,
        stream,
        videoRef,
        canvasRef,
        start,
        stop,
        capture,
        captureBlob,
        setResolution,
        setFrameRate,
        setCursor,
        setDisplaySurface,
        toggleAudio,
        toggleVideo,
    };
}

export default useScreenCapture;

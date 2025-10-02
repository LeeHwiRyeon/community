/**
 * Custom hook for camera functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface CameraOptions {
    video?: boolean;
    audio?: boolean;
    width?: number;
    height?: number;
    facingMode?: 'user' | 'environment';
    aspectRatio?: number;
    frameRate?: number;
    sampleRate?: number;
    sampleSize?: number;
    echoCancellation?: boolean;
    noiseSuppression?: boolean;
    autoGainControl?: boolean;
}

export interface UseCameraOptions {
    onStart?: () => void;
    onStop?: () => void;
    onError?: (error: Error) => void;
    onFrame?: (canvas: HTMLCanvasElement) => void;
}

export function useCamera(
    options: UseCameraOptions = {}
): {
    isSupported: boolean;
    isActive: boolean;
    stream: MediaStream | null;
    videoRef: React.RefObject<HTMLVideoElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    start: (cameraOptions?: CameraOptions) => Promise<void>;
    stop: () => void;
    capture: () => string | null;
    captureBlob: () => Blob | null;
    setResolution: (width: number, height: number) => void;
    setFrameRate: (frameRate: number) => void;
    setFacingMode: (facingMode: 'user' | 'environment') => void;
    toggleAudio: () => void;
    toggleVideo: () => void;
} {
    const { onStart, onStop, onError, onFrame } = options;
    const [isSupported, setIsSupported] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [cameraOptions, setCameraOptions] = useState<CameraOptions>({
        video: true,
        audio: false,
        width: 640,
        height: 480,
        facingMode: 'user',
        aspectRatio: 16 / 9,
        frameRate: 30,
        sampleRate: 44100,
        sampleSize: 16,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
    });

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>();

    useEffect(() => {
        const supported = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
        setIsSupported(supported);
    }, []);

    const start = useCallback(async (newCameraOptions?: CameraOptions) => {
        if (!isSupported) return;

        try {
            const options = { ...cameraOptions, ...newCameraOptions };
            setCameraOptions(options);

            const constraints: MediaStreamConstraints = {
                video: options.video ? {
                    width: options.width,
                    height: options.height,
                    facingMode: options.facingMode,
                    aspectRatio: options.aspectRatio,
                    frameRate: options.frameRate,
                } : false,
                audio: options.audio ? {
                    sampleRate: options.sampleRate,
                    sampleSize: options.sampleSize,
                    echoCancellation: options.echoCancellation,
                    noiseSuppression: options.noiseSuppression,
                    autoGainControl: options.autoGainControl,
                } : false,
            };

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
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
    }, [isSupported, cameraOptions, onStart, onError]);

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
        setCameraOptions(prev => ({ ...prev, width, height }));
    }, []);

    const setFrameRate = useCallback((frameRate: number) => {
        setCameraOptions(prev => ({ ...prev, frameRate }));
    }, []);

    const setFacingMode = useCallback((facingMode: 'user' | 'environment') => {
        setCameraOptions(prev => ({ ...prev, facingMode }));
    }, []);

    const toggleAudio = useCallback(() => {
        setCameraOptions(prev => ({ ...prev, audio: !prev.audio }));
    }, []);

    const toggleVideo = useCallback(() => {
        setCameraOptions(prev => ({ ...prev, video: !prev.video }));
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
        setFacingMode,
        toggleAudio,
        toggleVideo,
    };
}

export default useCamera;

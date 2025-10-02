/**
 * Custom hook for device orientation
 */

import { useState, useEffect, useCallback } from 'react';

export interface DeviceOrientation {
    alpha: number | null;
    beta: number | null;
    gamma: number | null;
    absolute: boolean;
    compassHeading: number | null;
    compassAccuracy: number | null;
}

export interface UseDeviceOrientationOptions {
    onOrientationChange?: (orientation: DeviceOrientation) => void;
    onError?: (error: Error) => void;
}

export function useDeviceOrientation(
    options: UseDeviceOrientationOptions = {}
): DeviceOrientation & {
    requestPermission: () => Promise<boolean>;
    isSupported: boolean;
    isPermissionGranted: boolean;
} {
    const { onOrientationChange, onError } = options;
    const [orientation, setOrientation] = useState<DeviceOrientation>({
        alpha: null,
        beta: null,
        gamma: null,
        absolute: false,
        compassHeading: null,
        compassAccuracy: null,
    });
    const [isSupported, setIsSupported] = useState(false);
    const [isPermissionGranted, setIsPermissionGranted] = useState(false);

    const handleOrientationChange = useCallback((event: DeviceOrientationEvent) => {
        const newOrientation: DeviceOrientation = {
            alpha: event.alpha,
            beta: event.beta,
            gamma: event.gamma,
            absolute: event.absolute || false,
            compassHeading: event.alpha,
            compassAccuracy: event.webkitCompassAccuracy || null,
        };

        setOrientation(newOrientation);
        onOrientationChange?.(newOrientation);
    }, [onOrientationChange]);

    const handleError = useCallback((error: Error) => {
        onError?.(error);
    }, [onError]);

    const requestPermission = useCallback(async (): Promise<boolean> => {
        if (!isSupported) return false;

        try {
            if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
                const permission = await (DeviceOrientationEvent as any).requestPermission();
                setIsPermissionGranted(permission === 'granted');
                return permission === 'granted';
            } else {
                setIsPermissionGranted(true);
                return true;
            }
        } catch (error) {
            handleError(error instanceof Error ? error : new Error(String(error)));
            return false;
        }
    }, [isSupported, handleError]);

    useEffect(() => {
        const checkSupport = () => {
            const supported = 'DeviceOrientationEvent' in window;
            setIsSupported(supported);

            if (supported) {
                setIsPermissionGranted(true);
            }
        };

        checkSupport();

        if (isSupported && isPermissionGranted) {
            window.addEventListener('deviceorientation', handleOrientationChange);
        }

        return () => {
            window.removeEventListener('deviceorientation', handleOrientationChange);
        };
    }, [isSupported, isPermissionGranted, handleOrientationChange]);

    return {
        ...orientation,
        requestPermission,
        isSupported,
        isPermissionGranted,
    };
}

export default useDeviceOrientation;

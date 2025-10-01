/**
 * Custom hook for device motion
 */

import { useState, useEffect, useCallback } from 'react';

export interface DeviceMotion {
    acceleration: {
        x: number | null;
        y: number | null;
        z: number | null;
    };
    accelerationIncludingGravity: {
        x: number | null;
        y: number | null;
        z: number | null;
    };
    rotationRate: {
        alpha: number | null;
        beta: number | null;
        gamma: number | null;
    };
    interval: number | null;
}

export interface UseDeviceMotionOptions {
    onMotionChange?: (motion: DeviceMotion) => void;
    onError?: (error: Error) => void;
}

export function useDeviceMotion(
    options: UseDeviceMotionOptions = {}
): DeviceMotion & {
    requestPermission: () => Promise<boolean>;
    isSupported: boolean;
    isPermissionGranted: boolean;
} {
    const { onMotionChange, onError } = options;
    const [motion, setMotion] = useState<DeviceMotion>({
        acceleration: { x: null, y: null, z: null },
        accelerationIncludingGravity: { x: null, y: null, z: null },
        rotationRate: { alpha: null, beta: null, gamma: null },
        interval: null,
    });
    const [isSupported, setIsSupported] = useState(false);
    const [isPermissionGranted, setIsPermissionGranted] = useState(false);

    const handleMotionChange = useCallback((event: DeviceMotionEvent) => {
        const newMotion: DeviceMotion = {
            acceleration: {
                x: event.acceleration?.x || null,
                y: event.acceleration?.y || null,
                z: event.acceleration?.z || null,
            },
            accelerationIncludingGravity: {
                x: event.accelerationIncludingGravity?.x || null,
                y: event.accelerationIncludingGravity?.y || null,
                z: event.accelerationIncludingGravity?.z || null,
            },
            rotationRate: {
                alpha: event.rotationRate?.alpha || null,
                beta: event.rotationRate?.beta || null,
                gamma: event.rotationRate?.gamma || null,
            },
            interval: event.interval || null,
        };

        setMotion(newMotion);
        onMotionChange?.(newMotion);
    }, [onMotionChange]);

    const handleError = useCallback((error: Error) => {
        onError?.(error);
    }, [onError]);

    const requestPermission = useCallback(async (): Promise<boolean> => {
        if (!isSupported) return false;

        try {
            if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
                const permission = await (DeviceMotionEvent as any).requestPermission();
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
            const supported = 'DeviceMotionEvent' in window;
            setIsSupported(supported);

            if (supported) {
                setIsPermissionGranted(true);
            }
        };

        checkSupport();

        if (isSupported && isPermissionGranted) {
            window.addEventListener('devicemotion', handleMotionChange);
        }

        return () => {
            window.removeEventListener('devicemotion', handleMotionChange);
        };
    }, [isSupported, isPermissionGranted, handleMotionChange]);

    return {
        ...motion,
        requestPermission,
        isSupported,
        isPermissionGranted,
    };
}

export default useDeviceMotion;

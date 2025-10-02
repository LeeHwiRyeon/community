/**
 * Custom hook for geolocation
 */

import { useState, useEffect, useCallback } from 'react';

export interface GeolocationPosition {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude?: number;
    altitudeAccuracy?: number;
    heading?: number;
    speed?: number;
    timestamp: number;
}

export interface UseGeolocationOptions {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
    onSuccess?: (position: GeolocationPosition) => void;
    onError?: (error: GeolocationPositionError) => void;
}

export function useGeolocation(
    options: UseGeolocationOptions = {}
): {
    position: GeolocationPosition | null;
    error: GeolocationPositionError | null;
    isLoading: boolean;
    getCurrentPosition: () => void;
    watchPosition: () => number;
    clearWatch: (watchId: number) => void;
    clearError: () => void;
} {
    const {
        enableHighAccuracy = true,
        timeout = 10000,
        maximumAge = 60000,
        onSuccess,
        onError,
    } = options;

    const [position, setPosition] = useState<GeolocationPosition | null>(null);
    const [error, setError] = useState<GeolocationPositionError | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const getCurrentPosition = useCallback(() => {
        if (!navigator.geolocation) {
            const error = new GeolocationPositionError();
            // error.code = 4 // GEOLOCATION_UNSUPPORTED;
            error.message = 'Geolocation is not supported by this browser';
            setError(error);
            onError?.(error);
            return;
        }

        setIsLoading(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const position: GeolocationPosition = {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    altitude: pos.coords.altitude || undefined,
                    altitudeAccuracy: pos.coords.altitudeAccuracy || undefined,
                    heading: pos.coords.heading || undefined,
                    speed: pos.coords.speed || undefined,
                    timestamp: pos.timestamp,
                };

                setPosition(position);
                setIsLoading(false);
                onSuccess?.(position);
            },
            (err) => {
                setError(err);
                setIsLoading(false);
                onError?.(err);
            },
            {
                enableHighAccuracy,
                timeout,
                maximumAge,
            }
        );
    }, [enableHighAccuracy, timeout, maximumAge, onSuccess, onError]);

    const watchPosition = useCallback(() => {
        if (!navigator.geolocation) {
            const error = new GeolocationPositionError();
            // error.code = 4 // GEOLOCATION_UNSUPPORTED;
            error.message = 'Geolocation is not supported by this browser';
            setError(error);
            onError?.(error);
            return -1;
        }

        setIsLoading(true);
        setError(null);

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const position: GeolocationPosition = {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    altitude: pos.coords.altitude || undefined,
                    altitudeAccuracy: pos.coords.altitudeAccuracy || undefined,
                    heading: pos.coords.heading || undefined,
                    speed: pos.coords.speed || undefined,
                    timestamp: pos.timestamp,
                };

                setPosition(position);
                setIsLoading(false);
                onSuccess?.(position);
            },
            (err) => {
                setError(err);
                setIsLoading(false);
                onError?.(err);
            },
            {
                enableHighAccuracy,
                timeout,
                maximumAge,
            }
        );

        return watchId;
    }, [enableHighAccuracy, timeout, maximumAge, onSuccess, onError]);

    const clearWatch = useCallback((watchId: number) => {
        navigator.geolocation.clearWatch(watchId);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        position,
        error,
        isLoading,
        getCurrentPosition,
        watchPosition,
        clearWatch,
        clearError,
    };
}

export default useGeolocation;

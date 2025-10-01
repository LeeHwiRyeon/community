/**
 * Custom hook for microphone functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface MicrophoneOptions {
    audio?: boolean;
    sampleRate?: number;
    sampleSize?: number;
    echoCancellation?: boolean;
    noiseSuppression?: boolean;
    autoGainControl?: boolean;
    latency?: number;
    channelCount?: number;
    volume?: number;
}

export interface UseMicrophoneOptions {
    onStart?: () => void;
    onStop?: () => void;
    onError?: (error: Error) => void;
    onData?: (data: Float32Array) => void;
    onVolumeChange?: (volume: number) => void;
}

export function useMicrophone(
    options: UseMicrophoneOptions = {}
): {
    isSupported: boolean;
    isActive: boolean;
    stream: MediaStream | null;
    volume: number;
    isMuted: boolean;
    start: (microphoneOptions?: MicrophoneOptions) => Promise<void>;
    stop: () => void;
    mute: () => void;
    unmute: () => void;
    toggleMute: () => void;
    setVolume: (volume: number) => void;
    setSampleRate: (sampleRate: number) => void;
    setChannelCount: (channelCount: number) => void;
    setLatency: (latency: number) => void;
} {
    const { onStart, onStop, onError, onData, onVolumeChange } = options;
    const [isSupported, setIsSupported] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [volume, setVolume] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [microphoneOptions, setMicrophoneOptions] = useState<MicrophoneOptions>({
        audio: true,
        sampleRate: 44100,
        sampleSize: 16,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        latency: 0,
        channelCount: 1,
        volume: 1,
    });

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Float32Array | null>(null);
    const animationFrameRef = useRef<number>();

    useEffect(() => {
        const supported = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
        setIsSupported(supported);
    }, []);

    const start = useCallback(async (newMicrophoneOptions?: MicrophoneOptions) => {
        if (!isSupported) return;

        try {
            const options = { ...microphoneOptions, ...newMicrophoneOptions };
            setMicrophoneOptions(options);

            const constraints: MediaStreamConstraints = {
                audio: {
                    sampleRate: options.sampleRate,
                    sampleSize: options.sampleSize,
                    echoCancellation: options.echoCancellation,
                    noiseSuppression: options.noiseSuppression,
                    autoGainControl: options.autoGainControl,
                    latency: options.latency,
                    channelCount: options.channelCount,
                    volume: options.volume,
                },
            };

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);
            setIsActive(true);

            // Set up audio context for analysis
            audioContextRef.current = new AudioContext();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            analyserRef.current.smoothingTimeConstant = 0.8;

            const source = audioContextRef.current.createMediaStreamSource(mediaStream);
            source.connect(analyserRef.current);

            dataArrayRef.current = new Float32Array(analyserRef.current.frequencyBinCount);

            onStart?.();
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            onError?.(err);
        }
    }, [isSupported, microphoneOptions, onStart, onError]);

    const stop = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            setIsActive(false);

            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }

            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }

            onStop?.();
        }
    }, [stream, onStop]);

    const mute = useCallback(() => {
        if (stream) {
            stream.getAudioTracks().forEach(track => {
                track.enabled = false;
            });
            setIsMuted(true);
        }
    }, [stream]);

    const unmute = useCallback(() => {
        if (stream) {
            stream.getAudioTracks().forEach(track => {
                track.enabled = true;
            });
            setIsMuted(false);
        }
    }, [stream]);

    const toggleMute = useCallback(() => {
        if (isMuted) {
            unmute();
        } else {
            mute();
        }
    }, [isMuted, mute, unmute]);

    const setVolumeCallback = useCallback((newVolume: number) => {
        setVolume(newVolume);
        setMicrophoneOptions(prev => ({ ...prev, volume: newVolume }));
    }, []);

    const setSampleRate = useCallback((sampleRate: number) => {
        setMicrophoneOptions(prev => ({ ...prev, sampleRate }));
    }, []);

    const setChannelCount = useCallback((channelCount: number) => {
        setMicrophoneOptions(prev => ({ ...prev, channelCount }));
    }, []);

    const setLatency = useCallback((latency: number) => {
        setMicrophoneOptions(prev => ({ ...prev, latency }));
    }, []);

    // Monitor audio data and volume
    useEffect(() => {
        if (isActive && analyserRef.current && dataArrayRef.current) {
            const monitorAudio = () => {
                if (analyserRef.current && dataArrayRef.current) {
                    analyserRef.current.getFloatFrequencyData(dataArrayRef.current);

                    // Calculate volume
                    let sum = 0;
                    for (let i = 0; i < dataArrayRef.current.length; i++) {
                        sum += Math.abs(dataArrayRef.current[i]);
                    }
                    const averageVolume = sum / dataArrayRef.current.length;
                    setVolume(averageVolume);
                    onVolumeChange?.(averageVolume);

                    // Send data for processing
                    onData?.(dataArrayRef.current);
                }

                animationFrameRef.current = requestAnimationFrame(monitorAudio);
            };

            monitorAudio();
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isActive, onData, onVolumeChange]);

    return {
        isSupported,
        isActive,
        stream,
        volume,
        isMuted,
        start,
        stop,
        mute,
        unmute,
        toggleMute,
        setVolume: setVolumeCallback,
        setSampleRate,
        setChannelCount,
        setLatency,
    };
}

export default useMicrophone;

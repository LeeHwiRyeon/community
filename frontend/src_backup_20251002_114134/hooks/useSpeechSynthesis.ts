/**
 * Custom hook for speech synthesis
 */

import { useState, useEffect, useCallback } from 'react';

export interface SpeechSynthesisOptions {
    text: string;
    voice?: SpeechSynthesisVoice;
    rate?: number;
    pitch?: number;
    volume?: number;
    lang?: string;
}

export interface UseSpeechSynthesisOptions {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: Error) => void;
    onPause?: () => void;
    onResume?: () => void;
    onBoundary?: (event: SpeechSynthesisEvent) => void;
}

export function useSpeechSynthesis(
    options: UseSpeechSynthesisOptions = {}
): {
    isSupported: boolean;
    isSpeaking: boolean;
    isPaused: boolean;
    voices: SpeechSynthesisVoice[];
    currentVoice: SpeechSynthesisVoice | null;
    speak: (options: SpeechSynthesisOptions) => void;
    pause: () => void;
    resume: () => void;
    stop: () => void;
    setVoice: (voice: SpeechSynthesisVoice) => void;
    setRate: (rate: number) => void;
    setPitch: (pitch: number) => void;
    setVolume: (volume: number) => void;
    setLang: (lang: string) => void;
} {
    const { onStart, onEnd, onError, onPause, onResume, onBoundary } = options;
    const [isSupported, setIsSupported] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [currentVoice, setCurrentVoice] = useState<SpeechSynthesisVoice | null>(null);
    const [rate, setRate] = useState(1);
    const [pitch, setPitch] = useState(1);
    const [volume, setVolume] = useState(1);
    const [lang, setLang] = useState('en-US');

    useEffect(() => {
        const supported = 'speechSynthesis' in window;
        setIsSupported(supported);

        if (supported) {
            const loadVoices = () => {
                const availableVoices = speechSynthesis.getVoices();
                setVoices(availableVoices);

                if (availableVoices.length > 0 && !currentVoice) {
                    const defaultVoice = availableVoices.find(voice => voice.default) || availableVoices[0];
                    setCurrentVoice(defaultVoice);
                }
            };

            loadVoices();
            speechSynthesis.addEventListener('voiceschanged', loadVoices);

            return () => {
                speechSynthesis.removeEventListener('voiceschanged', loadVoices);
            };
        }
    }, [currentVoice]);

    const speak = useCallback((options: SpeechSynthesisOptions) => {
        if (!isSupported) return;

        const utterance = new SpeechSynthesisUtterance(options.text);

        utterance.voice = options.voice || currentVoice;
        utterance.rate = options.rate || rate;
        utterance.pitch = options.pitch || pitch;
        utterance.volume = options.volume || volume;
        utterance.lang = options.lang || lang;

        utterance.onstart = () => {
            setIsSpeaking(true);
            setIsPaused(false);
            onStart?.();
        };

        utterance.onend = () => {
            setIsSpeaking(false);
            setIsPaused(false);
            onEnd?.();
        };

        utterance.onerror = (event) => {
            setIsSpeaking(false);
            setIsPaused(false);
            const error = new Error(`Speech synthesis error: ${event.error}`);
            onError?.(error);
        };

        utterance.onpause = () => {
            setIsPaused(true);
            onPause?.();
        };

        utterance.onresume = () => {
            setIsPaused(false);
            onResume?.();
        };

        utterance.onboundary = (event) => {
            onBoundary?.(event);
        };

        speechSynthesis.speak(utterance);
    }, [isSupported, currentVoice, rate, pitch, volume, lang, onStart, onEnd, onError, onPause, onResume, onBoundary]);

    const pause = useCallback(() => {
        if (isSupported && isSpeaking) {
            speechSynthesis.pause();
        }
    }, [isSupported, isSpeaking]);

    const resume = useCallback(() => {
        if (isSupported && isPaused) {
            speechSynthesis.resume();
        }
    }, [isSupported, isPaused]);

    const stop = useCallback(() => {
        if (isSupported) {
            speechSynthesis.cancel();
            setIsSpeaking(false);
            setIsPaused(false);
        }
    }, [isSupported]);

    const setVoiceCallback = useCallback((voice: SpeechSynthesisVoice) => {
        setCurrentVoice(voice);
    }, []);

    const setRateCallback = useCallback((newRate: number) => {
        setRate(newRate);
    }, []);

    const setPitchCallback = useCallback((newPitch: number) => {
        setPitch(newPitch);
    }, []);

    const setVolumeCallback = useCallback((newVolume: number) => {
        setVolume(newVolume);
    }, []);

    const setLangCallback = useCallback((newLang: string) => {
        setLang(newLang);
    }, []);

    return {
        isSupported,
        isSpeaking,
        isPaused,
        voices,
        currentVoice,
        speak,
        pause,
        resume,
        stop,
        setVoice: setVoiceCallback,
        setRate: setRateCallback,
        setPitch: setPitchCallback,
        setVolume: setVolumeCallback,
        setLang: setLangCallback,
    };
}

export default useSpeechSynthesis;

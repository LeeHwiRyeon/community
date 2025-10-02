/**
 * Custom hook for speech recognition
 */

import { useState, useEffect, useCallback } from 'react';

export interface SpeechRecognitionOptions {
    continuous?: boolean;
    interimResults?: boolean;
    lang?: string;
    maxAlternatives?: number;
    serviceURI?: string;
    grammars?: SpeechGrammarList;
}

export interface UseSpeechRecognitionOptions {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: Error) => void;
    onResult?: (result: SpeechRecognitionResultList) => void;
    onNoMatch?: () => void;
    onSoundStart?: () => void;
    onSoundEnd?: () => void;
    onSpeechStart?: () => void;
    onSpeechEnd?: () => void;
    onAudioStart?: () => void;
    onAudioEnd?: () => void;
}

export function useSpeechRecognition(
    options: UseSpeechRecognitionOptions = {}
): {
    isSupported: boolean;
    isListening: boolean;
    isPaused: boolean;
    transcript: string;
    interimTranscript: string;
    finalTranscript: string;
    confidence: number;
    start: (recognitionOptions?: SpeechRecognitionOptions) => void;
    stop: () => void;
    abort: () => void;
    pause: () => void;
    resume: () => void;
    setLang: (lang: string) => void;
    setContinuous: (continuous: boolean) => void;
    setInterimResults: (interimResults: boolean) => void;
    setMaxAlternatives: (maxAlternatives: number) => void;
} {
    const {
        onStart,
        onEnd,
        onError,
        onResult,
        onNoMatch,
        onSoundStart,
        onSoundEnd,
        onSpeechStart,
        onSpeechEnd,
        onAudioStart,
        onAudioEnd,
    } = options;

    const [isSupported, setIsSupported] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [finalTranscript, setFinalTranscript] = useState('');
    const [confidence, setConfidence] = useState(0);
    const [lang, setLang] = useState('en-US');
    const [continuous, setContinuous] = useState(true);
    const [interimResults, setInterimResults] = useState(true);
    const [maxAlternatives, setMaxAlternatives] = useState(1);

    const recognitionRef = useRef<SpeechRecognition | null>(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
        const supported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

        setIsSupported(supported);

        if (supported) {
            recognitionRef.current = new SpeechRecognition();
            const recognition = recognitionRef.current;

            recognition.continuous = continuous;
            recognition.interimResults = interimResults;
            recognition.lang = lang;
            recognition.maxAlternatives = maxAlternatives;

            recognition.onstart = () => {
                setIsListening(true);
                setIsPaused(false);
                onStart?.();
            };

            recognition.onend = () => {
                setIsListening(false);
                setIsPaused(false);
                onEnd?.();
            };

            recognition.onerror = (event) => {
                setIsListening(false);
                setIsPaused(false);
                const error = new Error(`Speech recognition error: ${event.error}`);
                onError?.(error);
            };

            recognition.onresult = (event) => {
                let interim = '';
                let final = '';
                let confidence = 0;

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i];
                    const transcript = result[0].transcript;

                    if (result.isFinal) {
                        final += transcript;
                        confidence = result[0].confidence;
                    } else {
                        interim += transcript;
                    }
                }

                setTranscript(final + interim);
                setInterimTranscript(interim);
                setFinalTranscript(final);
                setConfidence(confidence);
                onResult?.(event.results);
            };

            recognition.onnomatch = () => {
                onNoMatch?.();
            };

            recognition.onsoundstart = () => {
                onSoundStart?.();
            };

            recognition.onsoundend = () => {
                onSoundEnd?.();
            };

            recognition.onspeechstart = () => {
                onSpeechStart?.();
            };

            recognition.onspeechend = () => {
                onSpeechEnd?.();
            };

            recognition.onaudiostart = () => {
                onAudioStart?.();
            };

            recognition.onaudioend = () => {
                onAudioEnd?.();
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [continuous, interimResults, lang, maxAlternatives, onStart, onEnd, onError, onResult, onNoMatch, onSoundStart, onSoundEnd, onSpeechStart, onSpeechEnd, onAudioStart, onAudioEnd]);

    const start = useCallback((recognitionOptions?: SpeechRecognitionOptions) => {
        if (!isSupported || !recognitionRef.current) return;

        const recognition = recognitionRef.current;

        if (recognitionOptions) {
            recognition.continuous = recognitionOptions.continuous ?? continuous;
            recognition.interimResults = recognitionOptions.interimResults ?? interimResults;
            recognition.lang = recognitionOptions.lang ?? lang;
            recognition.maxAlternatives = recognitionOptions.maxAlternatives ?? maxAlternatives;
        }

        recognition.start();
    }, [isSupported, continuous, interimResults, lang, maxAlternatives]);

    const stop = useCallback(() => {
        if (isSupported && recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, [isSupported]);

    const abort = useCallback(() => {
        if (isSupported && recognitionRef.current) {
            recognitionRef.current.abort();
        }
    }, [isSupported]);

    const pause = useCallback(() => {
        if (isSupported && recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsPaused(true);
        }
    }, [isSupported, isListening]);

    const resume = useCallback(() => {
        if (isSupported && recognitionRef.current && isPaused) {
            recognitionRef.current.start();
            setIsPaused(false);
        }
    }, [isSupported, isPaused]);

    const setLangCallback = useCallback((newLang: string) => {
        setLang(newLang);
        if (recognitionRef.current) {
            recognitionRef.current.lang = newLang;
        }
    }, []);

    const setContinuousCallback = useCallback((newContinuous: boolean) => {
        setContinuous(newContinuous);
        if (recognitionRef.current) {
            recognitionRef.current.continuous = newContinuous;
        }
    }, []);

    const setInterimResultsCallback = useCallback((newInterimResults: boolean) => {
        setInterimResults(newInterimResults);
        if (recognitionRef.current) {
            recognitionRef.current.interimResults = newInterimResults;
        }
    }, []);

    const setMaxAlternativesCallback = useCallback((newMaxAlternatives: number) => {
        setMaxAlternatives(newMaxAlternatives);
        if (recognitionRef.current) {
            recognitionRef.current.maxAlternatives = newMaxAlternatives;
        }
    }, []);

    return {
        isSupported,
        isListening,
        isPaused,
        transcript,
        interimTranscript,
        finalTranscript,
        confidence,
        start,
        stop,
        abort,
        pause,
        resume,
        setLang: setLangCallback,
        setContinuous: setContinuousCallback,
        setInterimResults: setInterimResultsCallback,
        setMaxAlternatives: setMaxAlternativesCallback,
    };
}

export default useSpeechRecognition;

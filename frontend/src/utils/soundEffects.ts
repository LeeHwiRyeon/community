// Sound Effects System for Action Feedback
// Uses Web Audio API for high-quality sound generation

interface SoundConfig {
    frequency: number;
    duration: number;
    volume: number;
    type: OscillatorType;
    envelope?: {
        attack: number;
        decay: number;
        sustain: number;
        release: number;
    };
}

class SoundEffectGenerator {
    private audioContext: AudioContext | null = null;
    private isEnabled: boolean = true;

    constructor() {
        // Initialize audio context on first user interaction
        this.initializeAudioContext();
    }

    private async initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
            this.isEnabled = false;
        }
    }

    private async ensureAudioContext() {
        if (!this.audioContext) {
            await this.initializeAudioContext();
        }
        return this.audioContext;
    }

    // Generate a simple beep sound
    private async generateBeep(config: SoundConfig): Promise<void> {
        if (!this.isEnabled) return;

        const audioContext = await this.ensureAudioContext();
        if (!audioContext) return;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(config.frequency, audioContext.currentTime);
        oscillator.type = config.type;

        // Apply envelope if provided
        if (config.envelope) {
            const { attack, decay, sustain, release } = config.envelope;
            const now = audioContext.currentTime;

            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(config.volume, now + attack);
            gainNode.gain.linearRampToValueAtTime(sustain * config.volume, now + attack + decay);
            gainNode.gain.setValueAtTime(sustain * config.volume, now + config.duration - release);
            gainNode.gain.linearRampToValueAtTime(0, now + config.duration);
        } else {
            gainNode.gain.setValueAtTime(config.volume, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0, audioContext.currentTime + config.duration);
        }

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + config.duration);
    }

    // Action-specific sound effects
    async playPostCreateSound(): Promise<void> {
        await this.generateBeep({
            frequency: 800,
            duration: 0.2,
            volume: 0.3,
            type: 'sine',
            envelope: {
                attack: 0.01,
                decay: 0.05,
                sustain: 0.7,
                release: 0.1
            }
        });
    }

    async playCommentAddSound(): Promise<void> {
        await this.generateBeep({
            frequency: 600,
            duration: 0.15,
            volume: 0.25,
            type: 'triangle',
            envelope: {
                attack: 0.01,
                decay: 0.03,
                sustain: 0.8,
                release: 0.08
            }
        });
    }

    async playLikeSound(): Promise<void> {
        await this.generateBeep({
            frequency: 1000,
            duration: 0.1,
            volume: 0.2,
            type: 'sine',
            envelope: {
                attack: 0.005,
                decay: 0.02,
                sustain: 0.9,
                release: 0.05
            }
        });
    }

    async playShareSound(): Promise<void> {
        await this.generateBeep({
            frequency: 1200,
            duration: 0.25,
            volume: 0.3,
            type: 'sawtooth',
            envelope: {
                attack: 0.01,
                decay: 0.05,
                sustain: 0.6,
                release: 0.15
            }
        });
    }

    async playFollowSound(): Promise<void> {
        await this.generateBeep({
            frequency: 700,
            duration: 0.3,
            volume: 0.25,
            type: 'sine',
            envelope: {
                attack: 0.02,
                decay: 0.08,
                sustain: 0.7,
                release: 0.15
            }
        });
    }

    async playBookmarkSound(): Promise<void> {
        await this.generateBeep({
            frequency: 900,
            duration: 0.18,
            volume: 0.22,
            type: 'square',
            envelope: {
                attack: 0.01,
                decay: 0.04,
                sustain: 0.8,
                release: 0.1
            }
        });
    }

    async playPageNextSound(): Promise<void> {
        await this.generateBeep({
            frequency: 500,
            duration: 0.2,
            volume: 0.3,
            type: 'sine',
            envelope: {
                attack: 0.01,
                decay: 0.05,
                sustain: 0.7,
                release: 0.1
            }
        });
    }

    async playPagePrevSound(): Promise<void> {
        await this.generateBeep({
            frequency: 400,
            duration: 0.2,
            volume: 0.3,
            type: 'sine',
            envelope: {
                attack: 0.01,
                decay: 0.05,
                sustain: 0.7,
                release: 0.1
            }
        });
    }

    async playSuccessSound(): Promise<void> {
        // Play a pleasant success chord
        const audioContext = await this.ensureAudioContext();
        if (!audioContext) return;

        const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
        const duration = 0.5;
        const volume = 0.2;

        frequencies.forEach((freq, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
            oscillator.type = 'sine';

            const now = audioContext.currentTime + (index * 0.05);
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, now + duration);

            oscillator.start(now);
            oscillator.stop(now + duration);
        });
    }

    async playErrorSound(): Promise<void> {
        // Play a harsh error sound
        const audioContext = await this.ensureAudioContext();
        if (!audioContext) return;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(100, audioContext.currentTime + 0.3);
        oscillator.type = 'sawtooth';

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }

    // Toggle sound on/off
    toggleSound(): void {
        this.isEnabled = !this.isEnabled;
        localStorage.setItem('soundEnabled', this.isEnabled.toString());
    }

    // Check if sound is enabled
    isSoundEnabled(): boolean {
        return this.isEnabled;
    }

    // Load sound preference from localStorage
    loadSoundPreference(): void {
        const saved = localStorage.getItem('soundEnabled');
        if (saved !== null) {
            this.isEnabled = saved === 'true';
        }
    }
}

// Create singleton instance
export const soundEffects = new SoundEffectGenerator();

// Load preferences on initialization
soundEffects.loadSoundPreference();

// Action sound mapping
export const actionSounds = {
    POST_CREATE: () => soundEffects.playPostCreateSound(),
    COMMENT_ADD: () => soundEffects.playCommentAddSound(),
    LIKE_ADD: () => soundEffects.playLikeSound(),
    SHARE_ACTION: () => soundEffects.playShareSound(),
    FOLLOW_USER: () => soundEffects.playFollowSound(),
    BOOKMARK_ADD: () => soundEffects.playBookmarkSound(),
    PAGE_NEXT: () => soundEffects.playPageNextSound(),
    PAGE_PREV: () => soundEffects.playPagePrevSound(),
    SUCCESS: () => soundEffects.playSuccessSound(),
    ERROR: () => soundEffects.playErrorSound()
};

// Play sound for action type
export const playActionSound = async (actionType: string): Promise<void> => {
    const soundFunction = actionSounds[actionType as keyof typeof actionSounds];
    if (soundFunction) {
        await soundFunction();
    }
};

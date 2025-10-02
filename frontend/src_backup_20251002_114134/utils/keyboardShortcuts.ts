// Keyboard Shortcuts System for Action Generator
// Provides hotkey functionality for all action types

import { executeAction, ACTION_REGISTRY } from './actionGenerators';
import { playActionSound, soundEffects } from './soundEffects';
import { animationUtils } from './animations';

export interface KeyboardShortcut {
    key: string;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
    action: keyof typeof ACTION_REGISTRY;
    description: string;
    category: 'actions' | 'navigation' | 'system';
}

// Define all keyboard shortcuts
export const keyboardShortcuts: KeyboardShortcut[] = [
    // Action shortcuts
    {
        key: 'p',
        ctrlKey: true,
        action: 'createPost',
        description: 'Create new post',
        category: 'actions'
    },
    {
        key: 'c',
        ctrlKey: true,
        action: 'createComment',
        description: 'Add comment',
        category: 'actions'
    },
    {
        key: 'l',
        ctrlKey: true,
        action: 'createLike',
        description: 'Add like',
        category: 'actions'
    },
    {
        key: 's',
        ctrlKey: true,
        action: 'createShare',
        description: 'Share content',
        category: 'actions'
    },
    {
        key: 'f',
        ctrlKey: true,
        action: 'createFollow',
        description: 'Follow user',
        category: 'actions'
    },
    {
        key: 'b',
        ctrlKey: true,
        action: 'createBookmark',
        description: 'Add bookmark',
        category: 'actions'
    },

    // Navigation shortcuts
    {
        key: 'ArrowRight',
        action: 'nextPage',
        description: 'Next page',
        category: 'navigation'
    },
    {
        key: 'ArrowLeft',
        action: 'previousPage',
        description: 'Previous page',
        category: 'navigation'
    },
    {
        key: 'PageDown',
        action: 'nextPage',
        description: 'Next page (Page Down)',
        category: 'navigation'
    },
    {
        key: 'PageUp',
        action: 'previousPage',
        description: 'Previous page (Page Up)',
        category: 'navigation'
    },

    // Number shortcuts for quick page jumping
    {
        key: '1',
        ctrlKey: true,
        action: 'nextPage', // Will be handled specially for page jumping
        description: 'Jump to page 1',
        category: 'navigation'
    },
    {
        key: '2',
        ctrlKey: true,
        action: 'nextPage',
        description: 'Jump to page 2',
        category: 'navigation'
    },
    {
        key: '3',
        ctrlKey: true,
        action: 'nextPage',
        description: 'Jump to page 3',
        category: 'navigation'
    },
    {
        key: '4',
        ctrlKey: true,
        action: 'nextPage',
        description: 'Jump to page 4',
        category: 'navigation'
    },
    {
        key: '5',
        ctrlKey: true,
        action: 'nextPage',
        description: 'Jump to page 5',
        category: 'navigation'
    },

    // System shortcuts
    {
        key: 'h',
        ctrlKey: true,
        action: 'createPost', // Will be handled specially for help
        description: 'Show help',
        category: 'system'
    },
    {
        key: 'Escape',
        action: 'createPost', // Will be handled specially for clear
        description: 'Clear current action',
        category: 'system'
    }
];

class KeyboardShortcutManager {
    private isEnabled: boolean = true;
    private activeShortcuts: Map<string, KeyboardShortcut> = new Map();
    private helpVisible: boolean = false;
    private onActionExecute?: (actionType: string, result: any) => void;
    private onPageJump?: (page: number) => void;
    private onHelpToggle?: (visible: boolean) => void;
    private onClear?: () => void;

    constructor() {
        this.initializeShortcuts();
        this.bindKeyboardEvents();
    }

    private initializeShortcuts() {
        keyboardShortcuts.forEach(shortcut => {
            const key = this.createShortcutKey(shortcut);
            this.activeShortcuts.set(key, shortcut);
        });
    }

    private createShortcutKey(shortcut: KeyboardShortcut): string {
        const modifiers = [];
        if (shortcut.ctrlKey) modifiers.push('ctrl');
        if (shortcut.shiftKey) modifiers.push('shift');
        if (shortcut.altKey) modifiers.push('alt');
        if (shortcut.metaKey) modifiers.push('meta');

        return modifiers.length > 0
            ? `${modifiers.join('+')}+${shortcut.key.toLowerCase()}`
            : shortcut.key.toLowerCase();
    }

    private bindKeyboardEvents() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    private async handleKeyDown(event: KeyboardEvent) {
        if (!this.isEnabled) return;

        // Don't trigger shortcuts when typing in input fields
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
            return;
        }

        const shortcutKey = this.createShortcutKey({
            key: event.key,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            altKey: event.altKey,
            metaKey: event.metaKey
        });

        const shortcut = this.activeShortcuts.get(shortcutKey);
        if (!shortcut) return;

        event.preventDefault();
        event.stopPropagation();

        await this.executeShortcut(shortcut, event);
    }

    private async executeShortcut(shortcut: KeyboardShortcut, event: KeyboardEvent) {
        try {
            // Handle special cases
            if (shortcut.key === 'h' && shortcut.ctrlKey) {
                this.toggleHelp();
                return;
            }

            if (shortcut.key === 'Escape') {
                this.handleClear();
                return;
            }

            // Handle number shortcuts for page jumping
            if (shortcut.ctrlKey && /^[1-5]$/.test(shortcut.key)) {
                const pageNumber = parseInt(shortcut.key);
                this.handlePageJump(pageNumber);
                return;
            }

            // Execute regular action
            const result = executeAction(shortcut.action);

            // Play sound effect
            if (soundEffects.isSoundEnabled()) {
                await playActionSound(result.actionType);
            }

            // Show success notification
            animationUtils.showSuccessNotification(
                `${shortcut.description} executed via keyboard shortcut`,
                2000
            );

            // Notify parent component
            if (this.onActionExecute) {
                this.onActionExecute(shortcut.action, result);
            }

            console.log(`Keyboard shortcut executed: ${shortcut.description}`, result);
        } catch (error) {
            console.error('Error executing keyboard shortcut:', error);

            // Play error sound
            if (soundEffects.isSoundEnabled()) {
                await playActionSound('ERROR');
            }

            // Show error notification
            animationUtils.showErrorNotification(
                `Failed to execute ${shortcut.description}`,
                3000
            );
        }
    }

    private toggleHelp() {
        this.helpVisible = !this.helpVisible;
        if (this.onHelpToggle) {
            this.onHelpToggle(this.helpVisible);
        }
    }

    private handlePageJump(pageNumber: number) {
        if (this.onPageJump) {
            this.onPageJump(pageNumber);
        }
    }

    private handleClear() {
        if (this.onClear) {
            this.onClear();
        }
    }

    // Public methods
    setEnabled(enabled: boolean) {
        this.isEnabled = enabled;
    }

    isShortcutEnabled(): boolean {
        return this.isEnabled;
    }

    setCallbacks(callbacks: {
        onActionExecute?: (actionType: string, result: any) => void;
        onPageJump?: (page: number) => void;
        onHelpToggle?: (visible: boolean) => void;
        onClear?: () => void;
    }) {
        this.onActionExecute = callbacks.onActionExecute;
        this.onPageJump = callbacks.onPageJump;
        this.onHelpToggle = callbacks.onHelpToggle;
        this.onClear = callbacks.onClear;
    }

    getShortcutsByCategory(category: string): KeyboardShortcut[] {
        return keyboardShortcuts.filter(shortcut => shortcut.category === category);
    }

    getAllShortcuts(): KeyboardShortcut[] {
        return [...keyboardShortcuts];
    }

    getShortcutDescription(action: keyof typeof ACTION_REGISTRY): string | null {
        const shortcut = keyboardShortcuts.find(s => s.action === action);
        return shortcut ? shortcut.description : null;
    }

    getShortcutKey(action: keyof typeof ACTION_REGISTRY): string | null {
        const shortcut = keyboardShortcuts.find(s => s.action === action);
        return shortcut ? this.createShortcutKey(shortcut) : null;
    }

    destroy() {
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    }
}

// Create singleton instance
export const keyboardShortcutManager = new KeyboardShortcutManager();

// Helper function to format shortcut display
export const formatShortcutDisplay = (shortcut: KeyboardShortcut): string => {
    const parts = [];

    if (shortcut.ctrlKey) parts.push('Ctrl');
    if (shortcut.shiftKey) parts.push('Shift');
    if (shortcut.altKey) parts.push('Alt');
    if (shortcut.metaKey) parts.push('Cmd');

    parts.push(shortcut.key.toUpperCase());

    return parts.join(' + ');
};

// Helper function to check if a key combination is a shortcut
export const isShortcutKey = (event: KeyboardEvent): boolean => {
    const shortcutKey = keyboardShortcutManager['createShortcutKey']({
        key: event.key,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey
    });

    return keyboardShortcutManager['activeShortcuts'].has(shortcutKey);
};

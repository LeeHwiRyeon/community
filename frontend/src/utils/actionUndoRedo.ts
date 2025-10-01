// Action Undo/Redo System
// Comprehensive undo/redo functionality for all actions

import { ActionResult } from './actionGenerators';
import { analyticsManager } from './analytics';

export interface UndoableAction extends ActionResult {
    undoData?: any;
    redoData?: any;
    canUndo: boolean;
    canRedo: boolean;
    undoFunction?: () => Promise<boolean>;
    redoFunction?: () => Promise<boolean>;
    timestamp: number;
    sessionId: string;
}

export interface UndoRedoState {
    undoStack: UndoableAction[];
    redoStack: UndoableAction[];
    maxStackSize: number;
    isUndoing: boolean;
    isRedoing: boolean;
    currentIndex: number;
}

export interface UndoRedoCallbacks {
    onUndo?: (action: UndoableAction) => void;
    onRedo?: (action: UndoableAction) => void;
    onStackChange?: (state: UndoRedoState) => void;
    onError?: (error: Error, action: UndoableAction) => void;
}

class ActionUndoRedoManager {
    private state: UndoRedoState = {
        undoStack: [],
        redoStack: [],
        maxStackSize: 50,
        isUndoing: false,
        isRedoing: false,
        currentIndex: -1
    };

    private callbacks: UndoRedoCallbacks = {};
    private actionHandlers: Map<string, (action: UndoableAction) => Promise<boolean>> = new Map();
    private undoHandlers: Map<string, (action: UndoableAction) => Promise<boolean>> = new Map();

    constructor() {
        this.loadStoredData();
        this.initializeDefaultHandlers();
    }

    private loadStoredData() {
        try {
            const stored = localStorage.getItem('undo_redo_state');
            if (stored) {
                const parsed = JSON.parse(stored);
                this.state = {
                    ...this.state,
                    ...parsed,
                    isUndoing: false,
                    isRedoing: false
                };
            }
        } catch (error) {
            console.warn('Failed to load undo/redo state:', error);
        }
    }

    private saveStoredData() {
        try {
            const stateToSave = {
                undoStack: this.state.undoStack.slice(-this.state.maxStackSize),
                redoStack: this.state.redoStack.slice(-this.state.maxStackSize),
                maxStackSize: this.state.maxStackSize,
                currentIndex: this.state.currentIndex
            };
            localStorage.setItem('undo_redo_state', JSON.stringify(stateToSave));
        } catch (error) {
            console.warn('Failed to save undo/redo state:', error);
        }
    }

    private initializeDefaultHandlers() {
        // Post creation undo/redo
        this.setActionHandler('createPost', async (action) => {
            // Simulate post creation
            console.log('Creating post:', action.data);
            return true;
        });

        this.setUndoHandler('createPost', async (action) => {
            // Simulate post deletion
            console.log('Undoing post creation:', action.data);
            return true;
        });

        // Comment creation undo/redo
        this.setActionHandler('createComment', async (action) => {
            console.log('Creating comment:', action.data);
            return true;
        });

        this.setUndoHandler('createComment', async (action) => {
            console.log('Undoing comment creation:', action.data);
            return true;
        });

        // Like action undo/redo
        this.setActionHandler('createLike', async (action) => {
            console.log('Adding like:', action.data);
            return true;
        });

        this.setUndoHandler('createLike', async (action) => {
            console.log('Undoing like:', action.data);
            return true;
        });

        // Share action undo/redo
        this.setActionHandler('createShare', async (action) => {
            console.log('Sharing content:', action.data);
            return true;
        });

        this.setUndoHandler('createShare', async (action) => {
            console.log('Undoing share:', action.data);
            return true;
        });

        // Follow action undo/redo
        this.setActionHandler('createFollow', async (action) => {
            console.log('Following user:', action.data);
            return true;
        });

        this.setUndoHandler('createFollow', async (action) => {
            console.log('Undoing follow:', action.data);
            return true;
        });

        // Bookmark action undo/redo
        this.setActionHandler('createBookmark', async (action) => {
            console.log('Adding bookmark:', action.data);
            return true;
        });

        this.setUndoHandler('createBookmark', async (action) => {
            console.log('Undoing bookmark:', action.data);
            return true;
        });

        // Page navigation undo/redo
        this.setActionHandler('nextPage', async (action) => {
            console.log('Going to next page:', action.data);
            return true;
        });

        this.setUndoHandler('nextPage', async (action) => {
            console.log('Undoing page navigation:', action.data);
            return true;
        });

        this.setActionHandler('prevPage', async (action) => {
            console.log('Going to previous page:', action.data);
            return true;
        });

        this.setUndoHandler('prevPage', async (action) => {
            console.log('Undoing page navigation:', action.data);
            return true;
        });
    }

    // Register action handlers
    setActionHandler(actionType: string, handler: (action: UndoableAction) => Promise<boolean>) {
        this.actionHandlers.set(actionType, handler);
    }

    setUndoHandler(actionType: string, handler: (action: UndoableAction) => Promise<boolean>) {
        this.undoHandlers.set(actionType, handler);
    }

    // Set callbacks
    setCallbacks(callbacks: UndoRedoCallbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    // Add action to undo stack
    async addAction(action: ActionResult): Promise<boolean> {
        if (this.state.isUndoing || this.state.isRedoing) {
            return false;
        }

        try {
            const undoableAction: UndoableAction = {
                ...action,
                canUndo: true,
                canRedo: false,
                timestamp: Date.now(),
                sessionId: action.sessionId || 'default'
            };

            // Clear redo stack when new action is added
            this.state.redoStack = [];
            this.state.currentIndex = -1;

            // Add to undo stack
            this.state.undoStack.push(undoableAction);

            // Limit stack size
            if (this.state.undoStack.length > this.state.maxStackSize) {
                this.state.undoStack.shift();
            }

            this.state.currentIndex = this.state.undoStack.length - 1;
            this.saveStoredData();
            this.callbacks.onStackChange?.(this.state);

            return true;
        } catch (error) {
            console.error('Failed to add action to undo stack:', error);
            return false;
        }
    }

    // Undo last action
    async undo(): Promise<boolean> {
        if (this.state.isUndoing || this.state.isRedoing) {
            return false;
        }

        if (this.state.undoStack.length === 0) {
            return false;
        }

        this.state.isUndoing = true;

        try {
            const action = this.state.undoStack[this.state.undoStack.length - 1];

            if (!action.canUndo) {
                this.state.isUndoing = false;
                return false;
            }

            // Execute undo handler
            const undoHandler = this.undoHandlers.get(action.actionType);
            if (undoHandler) {
                const success = await undoHandler(action);
                if (!success) {
                    this.state.isUndoing = false;
                    return false;
                }
            }

            // Move action to redo stack
            this.state.undoStack.pop();
            this.state.redoStack.push({
                ...action,
                canUndo: false,
                canRedo: true
            });

            this.state.currentIndex = this.state.undoStack.length - 1;
            this.saveStoredData();
            this.callbacks.onStackChange?.(this.state);
            this.callbacks.onUndo?.(action);

            return true;
        } catch (error) {
            console.error('Failed to undo action:', error);
            this.callbacks.onError?.(error as Error, this.state.undoStack[this.state.undoStack.length - 1]);
            return false;
        } finally {
            this.state.isUndoing = false;
        }
    }

    // Redo last undone action
    async redo(): Promise<boolean> {
        if (this.state.isUndoing || this.state.isRedoing) {
            return false;
        }

        if (this.state.redoStack.length === 0) {
            return false;
        }

        this.state.isRedoing = true;

        try {
            const action = this.state.redoStack[this.state.redoStack.length - 1];

            if (!action.canRedo) {
                this.state.isRedoing = false;
                return false;
            }

            // Execute action handler
            const actionHandler = this.actionHandlers.get(action.actionType);
            if (actionHandler) {
                const success = await actionHandler(action);
                if (!success) {
                    this.state.isRedoing = false;
                    return false;
                }
            }

            // Move action back to undo stack
            this.state.redoStack.pop();
            this.state.undoStack.push({
                ...action,
                canUndo: true,
                canRedo: false
            });

            this.state.currentIndex = this.state.undoStack.length - 1;
            this.saveStoredData();
            this.callbacks.onStackChange?.(this.state);
            this.callbacks.onRedo?.(action);

            return true;
        } catch (error) {
            console.error('Failed to redo action:', error);
            this.callbacks.onError?.(error as Error, this.state.redoStack[this.state.redoStack.length - 1]);
            return false;
        } finally {
            this.state.isRedoing = false;
        }
    }

    // Undo multiple actions
    async undoMultiple(count: number): Promise<number> {
        let undoneCount = 0;

        for (let i = 0; i < count && this.state.undoStack.length > 0; i++) {
            const success = await this.undo();
            if (success) {
                undoneCount++;
            } else {
                break;
            }
        }

        return undoneCount;
    }

    // Redo multiple actions
    async redoMultiple(count: number): Promise<number> {
        let redoneCount = 0;

        for (let i = 0; i < count && this.state.redoStack.length > 0; i++) {
            const success = await this.redo();
            if (success) {
                redoneCount++;
            } else {
                break;
            }
        }

        return redoneCount;
    }

    // Clear all undo/redo history
    clearHistory(): void {
        this.state.undoStack = [];
        this.state.redoStack = [];
        this.state.currentIndex = -1;
        this.saveStoredData();
        this.callbacks.onStackChange?.(this.state);
    }

    // Clear redo stack only
    clearRedoStack(): void {
        this.state.redoStack = [];
        this.saveStoredData();
        this.callbacks.onStackChange?.(this.state);
    }

    // Get current state
    getState(): UndoRedoState {
        return { ...this.state };
    }

    // Get undo stack
    getUndoStack(): UndoableAction[] {
        return [...this.state.undoStack];
    }

    // Get redo stack
    getRedoStack(): UndoableAction[] {
        return [...this.state.redoStack];
    }

    // Check if undo is available
    canUndo(): boolean {
        return this.state.undoStack.length > 0 && !this.state.isUndoing && !this.state.isRedoing;
    }

    // Check if redo is available
    canRedo(): boolean {
        return this.state.redoStack.length > 0 && !this.state.isUndoing && !this.state.isRedoing;
    }

    // Get undo count
    getUndoCount(): number {
        return this.state.undoStack.length;
    }

    // Get redo count
    getRedoCount(): number {
        return this.state.redoStack.length;
    }

    // Set max stack size
    setMaxStackSize(size: number): void {
        this.state.maxStackSize = Math.max(1, Math.min(1000, size));

        // Trim stacks if necessary
        if (this.state.undoStack.length > this.state.maxStackSize) {
            this.state.undoStack = this.state.undoStack.slice(-this.state.maxStackSize);
        }
        if (this.state.redoStack.length > this.state.maxStackSize) {
            this.state.redoStack = this.state.redoStack.slice(-this.state.maxStackSize);
        }

        this.saveStoredData();
        this.callbacks.onStackChange?.(this.state);
    }

    // Get action by index
    getActionByIndex(index: number): UndoableAction | null {
        if (index >= 0 && index < this.state.undoStack.length) {
            return this.state.undoStack[index];
        }
        return null;
    }

    // Jump to specific action (undo all actions after that point)
    async jumpToAction(index: number): Promise<boolean> {
        if (index < 0 || index >= this.state.undoStack.length) {
            return false;
        }

        const actionsToUndo = this.state.undoStack.length - 1 - index;
        if (actionsToUndo <= 0) {
            return true;
        }

        return await this.undoMultiple(actionsToUndo) === actionsToUndo;
    }

    // Get statistics
    getStatistics() {
        const totalActions = this.state.undoStack.length + this.state.redoStack.length;
        const undoableActions = this.state.undoStack.filter(a => a.canUndo).length;
        const redoableActions = this.state.redoStack.filter(a => a.canRedo).length;

        const actionTypes = [...new Set([
            ...this.state.undoStack.map(a => a.actionType),
            ...this.state.redoStack.map(a => a.actionType)
        ])];

        const sessionIds = [...new Set([
            ...this.state.undoStack.map(a => a.sessionId),
            ...this.state.redoStack.map(a => a.sessionId)
        ])];

        return {
            totalActions,
            undoableActions,
            redoableActions,
            actionTypes,
            sessionIds,
            maxStackSize: this.state.maxStackSize,
            currentIndex: this.state.currentIndex,
            isUndoing: this.state.isUndoing,
            isRedoing: this.state.isRedoing
        };
    }

    // Export undo/redo history
    exportHistory() {
        return {
            undoStack: this.state.undoStack,
            redoStack: this.state.redoStack,
            statistics: this.getStatistics(),
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };
    }

    // Import undo/redo history
    importHistory(data: any): boolean {
        try {
            if (data.undoStack && Array.isArray(data.undoStack)) {
                this.state.undoStack = data.undoStack;
            }
            if (data.redoStack && Array.isArray(data.redoStack)) {
                this.state.redoStack = data.redoStack;
            }

            this.state.currentIndex = this.state.undoStack.length - 1;
            this.saveStoredData();
            this.callbacks.onStackChange?.(this.state);

            return true;
        } catch (error) {
            console.error('Failed to import undo/redo history:', error);
            return false;
        }
    }
}

// Create singleton instance
export const actionUndoRedoManager = new ActionUndoRedoManager();

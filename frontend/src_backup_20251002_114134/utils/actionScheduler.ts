// Action Scheduler System
// Handles time-based action execution and scheduling

import { executeAction, ActionResult, ACTION_REGISTRY } from './actionGenerators';
import { analyticsManager } from './analytics';
import { playActionSound, soundEffects } from './soundEffects';
import { animationUtils } from './animations';

export interface ScheduledAction {
    id: string;
    actionType: keyof typeof ACTION_REGISTRY;
    name: string;
    description?: string;
    scheduledTime: string; // ISO string
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    repeatType: 'once' | 'daily' | 'weekly' | 'monthly' | 'interval';
    repeatInterval?: number; // minutes for interval type
    repeatDays?: number[]; // 0-6 for weekly (0 = Sunday)
    repeatTime?: string; // HH:MM for daily/weekly/monthly
    endDate?: string; // ISO string for when to stop repeating
    maxExecutions?: number; // Maximum number of executions
    executionCount: number;
    lastExecuted?: string; // ISO string
    nextExecution?: string; // ISO string
    result?: ActionResult;
    error?: string;
    createdAt: string;
    createdBy: string;
    tags: string[];
    priority: 'low' | 'medium' | 'high';
    enabled: boolean;
}

export interface SchedulerSettings {
    timezone: string;
    maxConcurrentJobs: number;
    retryFailedJobs: boolean;
    maxRetries: number;
    retryDelay: number; // minutes
    cleanupCompletedJobs: boolean;
    cleanupAfterDays: number;
    notifications: {
        onSuccess: boolean;
        onFailure: boolean;
        onCompletion: boolean;
    };
}

export interface SchedulerStats {
    totalScheduled: number;
    pendingJobs: number;
    runningJobs: number;
    completedJobs: number;
    failedJobs: number;
    cancelledJobs: number;
    successRate: number;
    averageExecutionTime: number;
    nextExecution: string | null;
    lastExecution: string | null;
}

class ActionScheduler {
    private scheduledActions: ScheduledAction[] = [];
    private activeTimers: Map<string, NodeJS.Timeout> = new Map();
    private settings: SchedulerSettings;
    private isRunning: boolean = false;
    private stats: SchedulerStats = {
        totalScheduled: 0,
        pendingJobs: 0,
        runningJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        cancelledJobs: 0,
        successRate: 0,
        averageExecutionTime: 0,
        nextExecution: null,
        lastExecution: null
    };

    constructor() {
        this.settings = this.getDefaultSettings();
        this.loadStoredData();
        this.startScheduler();
    }

    private getDefaultSettings(): SchedulerSettings {
        return {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            maxConcurrentJobs: 5,
            retryFailedJobs: true,
            maxRetries: 3,
            retryDelay: 5,
            cleanupCompletedJobs: true,
            cleanupAfterDays: 30,
            notifications: {
                onSuccess: true,
                onFailure: true,
                onCompletion: true
            }
        };
    }

    private loadStoredData() {
        try {
            const storedActions = localStorage.getItem('scheduled_actions');
            const storedSettings = localStorage.getItem('scheduler_settings');

            if (storedActions) {
                this.scheduledActions = JSON.parse(storedActions);
            }

            if (storedSettings) {
                this.settings = { ...this.settings, ...JSON.parse(storedSettings) };
            }
        } catch (error) {
            console.warn('Failed to load scheduler data:', error);
            this.scheduledActions = [];
        }
    }

    private saveStoredData() {
        try {
            localStorage.setItem('scheduled_actions', JSON.stringify(this.scheduledActions));
            localStorage.setItem('scheduler_settings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Failed to save scheduler data:', error);
        }
    }

    private startScheduler() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.scheduleAllActions();

        // Check for due actions every minute
        setInterval(() => {
            this.checkAndExecuteDueActions();
        }, 60000);
    }

    private scheduleAllActions() {
        this.scheduledActions.forEach(action => {
            if (action.enabled && action.status === 'pending') {
                this.scheduleAction(action);
            }
        });
    }

    private scheduleAction(action: ScheduledAction) {
        const now = new Date();
        const scheduledTime = new Date(action.scheduledTime);

        if (scheduledTime <= now) {
            this.executeAction(action);
            return;
        }

        const delay = scheduledTime.getTime() - now.getTime();

        const timer = setTimeout(() => {
            this.executeAction(action);
        }, delay);

        this.activeTimers.set(action.id, timer);
    }

    private async executeAction(action: ScheduledAction) {
        if (action.status !== 'pending') return;

        action.status = 'running';
        action.lastExecuted = new Date().toISOString();
        action.executionCount++;

        this.updateStats();
        this.saveStoredData();

        try {
            const startTime = Date.now();
            const result = executeAction(action.actionType);
            const executionTime = Date.now() - startTime;

            action.result = result;
            action.status = 'completed';

            // Track analytics
            analyticsManager.trackAction(result, 'scheduled');

            // Play success sound
            if (soundEffects.isSoundEnabled() && this.settings.notifications.onSuccess) {
                await playActionSound(result.actionType);
            }

            // Show success notification
            if (this.settings.notifications.onSuccess) {
                animationUtils.showSuccessNotification(
                    `Scheduled action "${action.name}" completed successfully`,
                    3000
                );
            }

            // Handle repeat scheduling
            this.scheduleNextExecution(action);

        } catch (error) {
            console.error(`Scheduled action ${action.id} failed:`, error);

            action.error = error instanceof Error ? error.message : 'Unknown error';
            action.status = 'failed';

            // Play error sound
            if (soundEffects.isSoundEnabled() && this.settings.notifications.onFailure) {
                await playActionSound('ERROR');
            }

            // Show error notification
            if (this.settings.notifications.onFailure) {
                animationUtils.showErrorNotification(
                    `Scheduled action "${action.name}" failed: ${action.error}`,
                    5000
                );
            }

            // Retry if enabled
            if (this.settings.retryFailedJobs && action.executionCount < this.settings.maxRetries) {
                setTimeout(() => {
                    action.status = 'pending';
                    action.scheduledTime = new Date(Date.now() + this.settings.retryDelay * 60000).toISOString();
                    this.scheduleAction(action);
                }, this.settings.retryDelay * 60000);
            }
        }

        this.updateStats();
        this.saveStoredData();
    }

    private scheduleNextExecution(action: ScheduledAction) {
        if (action.repeatType === 'once') {
            return;
        }

        const now = new Date();
        let nextExecution: Date;

        switch (action.repeatType) {
            case 'daily':
                nextExecution = new Date(now);
                nextExecution.setHours(
                    parseInt(action.repeatTime?.split(':')[0] || '0'),
                    parseInt(action.repeatTime?.split(':')[1] || '0'),
                    0,
                    0
                );
                if (nextExecution <= now) {
                    nextExecution.setDate(nextExecution.getDate() + 1);
                }
                break;

            case 'weekly':
                nextExecution = new Date(now);
                const targetDay = action.repeatDays?.[0] || 0;
                const currentDay = nextExecution.getDay();
                const daysUntilTarget = (targetDay - currentDay + 7) % 7;
                nextExecution.setDate(nextExecution.getDate() + daysUntilTarget);
                nextExecution.setHours(
                    parseInt(action.repeatTime?.split(':')[0] || '0'),
                    parseInt(action.repeatTime?.split(':')[1] || '0'),
                    0,
                    0
                );
                if (nextExecution <= now) {
                    nextExecution.setDate(nextExecution.getDate() + 7);
                }
                break;

            case 'monthly':
                nextExecution = new Date(now);
                nextExecution.setMonth(nextExecution.getMonth() + 1);
                nextExecution.setHours(
                    parseInt(action.repeatTime?.split(':')[0] || '0'),
                    parseInt(action.repeatTime?.split(':')[1] || '0'),
                    0,
                    0
                );
                break;

            case 'interval':
                nextExecution = new Date(now.getTime() + (action.repeatInterval || 60) * 60000);
                break;

            default:
                return;
        }

        // Check if we should stop repeating
        if (action.endDate && nextExecution > new Date(action.endDate)) {
            return;
        }

        if (action.maxExecutions && action.executionCount >= action.maxExecutions) {
            return;
        }

        action.scheduledTime = nextExecution.toISOString();
        action.nextExecution = nextExecution.toISOString();
        action.status = 'pending';

        this.scheduleAction(action);
    }

    private checkAndExecuteDueActions() {
        const now = new Date();

        this.scheduledActions.forEach(action => {
            if (action.enabled && action.status === 'pending') {
                const scheduledTime = new Date(action.scheduledTime);
                if (scheduledTime <= now) {
                    this.executeAction(action);
                }
            }
        });
    }

    private updateStats() {
        const now = new Date();

        this.stats = {
            totalScheduled: this.scheduledActions.length,
            pendingJobs: this.scheduledActions.filter(a => a.status === 'pending').length,
            runningJobs: this.scheduledActions.filter(a => a.status === 'running').length,
            completedJobs: this.scheduledActions.filter(a => a.status === 'completed').length,
            failedJobs: this.scheduledActions.filter(a => a.status === 'failed').length,
            cancelledJobs: this.scheduledActions.filter(a => a.status === 'cancelled').length,
            successRate: this.calculateSuccessRate(),
            averageExecutionTime: this.calculateAverageExecutionTime(),
            nextExecution: this.getNextExecutionTime(),
            lastExecution: this.getLastExecutionTime()
        };
    }

    private calculateSuccessRate(): number {
        const totalExecuted = this.scheduledActions.filter(a =>
            a.status === 'completed' || a.status === 'failed'
        ).length;

        if (totalExecuted === 0) return 0;

        const successful = this.scheduledActions.filter(a => a.status === 'completed').length;
        return Math.round((successful / totalExecuted) * 100);
    }

    private calculateAverageExecutionTime(): number {
        const completedActions = this.scheduledActions.filter(a => a.status === 'completed');
        if (completedActions.length === 0) return 0;

        // This would need to be tracked during execution
        return 0; // Placeholder
    }

    private getNextExecutionTime(): string | null {
        const pendingActions = this.scheduledActions
            .filter(a => a.status === 'pending' && a.enabled)
            .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());

        return pendingActions.length > 0 ? pendingActions[0].scheduledTime : null;
    }

    private getLastExecutionTime(): string | null {
        const executedActions = this.scheduledActions
            .filter(a => a.lastExecuted)
            .sort((a, b) => new Date(b.lastExecuted!).getTime() - new Date(a.lastExecuted!).getTime());

        return executedActions.length > 0 ? executedActions[0].lastExecuted! : null;
    }

    // Public methods
    createScheduledAction(action: Omit<ScheduledAction, 'id' | 'createdAt' | 'executionCount' | 'status'>): ScheduledAction {
        const newAction: ScheduledAction = {
            ...action,
            id: `scheduled_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            createdAt: new Date().toISOString(),
            executionCount: 0,
            status: 'pending'
        };

        this.scheduledActions.push(newAction);
        this.scheduleAction(newAction);
        this.updateStats();
        this.saveStoredData();

        return newAction;
    }

    getScheduledActions(): ScheduledAction[] {
        return [...this.scheduledActions];
    }

    getScheduledAction(id: string): ScheduledAction | null {
        return this.scheduledActions.find(a => a.id === id) || null;
    }

    updateScheduledAction(id: string, updates: Partial<ScheduledAction>): ScheduledAction | null {
        const action = this.scheduledActions.find(a => a.id === id);
        if (!action) return null;

        Object.assign(action, updates);

        // Reschedule if time changed
        if (updates.scheduledTime || updates.enabled !== undefined) {
            this.cancelScheduledAction(id);
            if (action.enabled) {
                this.scheduleAction(action);
            }
        }

        this.updateStats();
        this.saveStoredData();
        return action;
    }

    cancelScheduledAction(id: string): boolean {
        const action = this.scheduledActions.find(a => a.id === id);
        if (!action) return false;

        // Cancel timer
        const timer = this.activeTimers.get(id);
        if (timer) {
            clearTimeout(timer);
            this.activeTimers.delete(id);
        }

        action.status = 'cancelled';
        this.updateStats();
        this.saveStoredData();
        return true;
    }

    deleteScheduledAction(id: string): boolean {
        const index = this.scheduledActions.findIndex(a => a.id === id);
        if (index === -1) return false;

        this.cancelScheduledAction(id);
        this.scheduledActions.splice(index, 1);
        this.updateStats();
        this.saveStoredData();
        return true;
    }

    getStats(): SchedulerStats {
        return { ...this.stats };
    }

    getSettings(): SchedulerSettings {
        return { ...this.settings };
    }

    updateSettings(settings: Partial<SchedulerSettings>): void {
        this.settings = { ...this.settings, ...settings };
        this.saveStoredData();
    }

    pauseScheduler(): void {
        this.isRunning = false;
        this.activeTimers.forEach(timer => clearTimeout(timer));
        this.activeTimers.clear();
    }

    resumeScheduler(): void {
        this.startScheduler();
    }

    isSchedulerRunning(): boolean {
        return this.isRunning;
    }

    cleanupOldJobs(): number {
        if (!this.settings.cleanupCompletedJobs) return 0;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.settings.cleanupAfterDays);

        const initialCount = this.scheduledActions.length;
        this.scheduledActions = this.scheduledActions.filter(action => {
            if (action.status === 'completed' && action.lastExecuted) {
                return new Date(action.lastExecuted) > cutoffDate;
            }
            return true;
        });

        const cleanedCount = initialCount - this.scheduledActions.length;
        this.updateStats();
        this.saveStoredData();
        return cleanedCount;
    }

    // Get actions by status
    getActionsByStatus(status: ScheduledAction['status']): ScheduledAction[] {
        return this.scheduledActions.filter(a => a.status === status);
    }

    // Get actions by tag
    getActionsByTag(tag: string): ScheduledAction[] {
        return this.scheduledActions.filter(a => a.tags.includes(tag));
    }

    // Get actions due soon (next hour)
    getActionsDueSoon(): ScheduledAction[] {
        const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
        return this.scheduledActions.filter(a =>
            a.status === 'pending' &&
            a.enabled &&
            new Date(a.scheduledTime) <= oneHourFromNow
        );
    }
}

// Create singleton instance
export const actionScheduler = new ActionScheduler();

// Auto-cleanup every hour
setInterval(() => {
    actionScheduler.cleanupOldJobs();
}, 60 * 60 * 1000);

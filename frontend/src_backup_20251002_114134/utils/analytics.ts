// Action Analytics System
// Tracks usage patterns, statistics, and provides insights

import { ActionResult } from './actionGenerators';

export interface ActionAnalytics {
    totalActions: number;
    actionsByType: Record<string, number>;
    actionsByHour: Record<number, number>;
    actionsByDay: Record<string, number>;
    averageActionsPerSession: number;
    mostUsedAction: string;
    leastUsedAction: string;
    peakUsageHour: number;
    totalSessions: number;
    averageSessionDuration: number;
    keyboardShortcutUsage: number;
    soundEnabledUsage: number;
    errorRate: number;
    lastActionTime: string;
    firstActionTime: string;
}

export interface SessionData {
    sessionId: string;
    startTime: string;
    endTime?: string;
    actions: ActionResult[];
    duration?: number;
    soundEnabled: boolean;
    keyboardShortcutsUsed: number;
}

export interface UsagePattern {
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    frequency: 'low' | 'medium' | 'high';
    preferredActions: string[];
    averageSessionLength: number;
}

class AnalyticsManager {
    private currentSession: SessionData | null = null;
    private sessions: SessionData[] = [];
    private actions: ActionResult[] = [];
    private isEnabled: boolean = true;

    constructor() {
        this.loadStoredData();
        this.initializeSession();
    }

    private loadStoredData() {
        try {
            const storedSessions = localStorage.getItem('analytics_sessions');
            const storedActions = localStorage.getItem('analytics_actions');

            if (storedSessions) {
                this.sessions = JSON.parse(storedSessions);
            }

            if (storedActions) {
                this.actions = JSON.parse(storedActions);
            }
        } catch (error) {
            console.warn('Failed to load analytics data:', error);
            this.sessions = [];
            this.actions = [];
        }
    }

    private saveStoredData() {
        try {
            localStorage.setItem('analytics_sessions', JSON.stringify(this.sessions));
            localStorage.setItem('analytics_actions', JSON.stringify(this.actions));
        } catch (error) {
            console.warn('Failed to save analytics data:', error);
        }
    }

    private initializeSession() {
        this.currentSession = {
            sessionId: this.generateSessionId(),
            startTime: new Date().toISOString(),
            actions: [],
            soundEnabled: this.getSoundEnabledState(),
            keyboardShortcutsUsed: 0
        };
    }

    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }

    private getSoundEnabledState(): boolean {
        try {
            const soundEnabled = localStorage.getItem('soundEnabled');
            return soundEnabled === 'true';
        } catch {
            return false;
        }
    }

    // Track action execution
    trackAction(action: ActionResult, method: 'click' | 'keyboard' | 'api' = 'click') {
        if (!this.isEnabled || !this.currentSession) return;

        // Add method to action data
        const trackedAction = {
            ...action,
            method,
            timestamp: new Date().toISOString()
        };

        this.actions.push(trackedAction);
        this.currentSession.actions.push(trackedAction);

        if (method === 'keyboard') {
            this.currentSession.keyboardShortcutsUsed++;
        }

        this.saveStoredData();
    }

    // Track session end
    endSession() {
        if (!this.currentSession) return;

        this.currentSession.endTime = new Date().toISOString();
        this.currentSession.duration = this.calculateSessionDuration();

        this.sessions.push(this.currentSession);
        this.saveStoredData();

        this.initializeSession();
    }

    private calculateSessionDuration(): number {
        if (!this.currentSession?.startTime) return 0;

        const start = new Date(this.currentSession.startTime);
        const end = new Date();
        return Math.floor((end.getTime() - start.getTime()) / 1000); // seconds
    }

    // Get comprehensive analytics
    getAnalytics(): ActionAnalytics {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Filter recent actions (last 7 days)
        const recentActions = this.actions.filter(action =>
            new Date(action.timestamp) >= oneWeekAgo
        );

        const actionsByType = this.getActionsByType(recentActions);
        const actionsByHour = this.getActionsByHour(recentActions);
        const actionsByDay = this.getActionsByDay(recentActions);

        const totalActions = recentActions.length;
        const actionTypes = Object.keys(actionsByType);

        return {
            totalActions,
            actionsByType,
            actionsByHour,
            actionsByDay,
            averageActionsPerSession: this.calculateAverageActionsPerSession(),
            mostUsedAction: this.getMostUsedAction(actionsByType),
            leastUsedAction: this.getLeastUsedAction(actionsByType),
            peakUsageHour: this.getPeakUsageHour(actionsByHour),
            totalSessions: this.sessions.length,
            averageSessionDuration: this.calculateAverageSessionDuration(),
            keyboardShortcutUsage: this.calculateKeyboardShortcutUsage(),
            soundEnabledUsage: this.calculateSoundEnabledUsage(),
            errorRate: this.calculateErrorRate(),
            lastActionTime: this.getLastActionTime(),
            firstActionTime: this.getFirstActionTime()
        };
    }

    private getActionsByType(actions: ActionResult[]): Record<string, number> {
        return actions.reduce((acc, action) => {
            acc[action.actionType] = (acc[action.actionType] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }

    private getActionsByHour(actions: ActionResult[]): Record<number, number> {
        return actions.reduce((acc, action) => {
            const hour = new Date(action.timestamp).getHours();
            acc[hour] = (acc[hour] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);
    }

    private getActionsByDay(actions: ActionResult[]): Record<string, number> {
        return actions.reduce((acc, action) => {
            const day = new Date(action.timestamp).toLocaleDateString('en-US', { weekday: 'long' });
            acc[day] = (acc[day] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }

    private calculateAverageActionsPerSession(): number {
        if (this.sessions.length === 0) return 0;

        const totalActions = this.sessions.reduce((sum, session) => sum + session.actions.length, 0);
        return Math.round(totalActions / this.sessions.length * 100) / 100;
    }

    private getMostUsedAction(actionsByType: Record<string, number>): string {
        const entries = Object.entries(actionsByType);
        if (entries.length === 0) return 'None';

        return entries.reduce((max, [action, count]) =>
            count > actionsByType[max] ? action : max
        );
    }

    private getLeastUsedAction(actionsByType: Record<string, number>): string {
        const entries = Object.entries(actionsByType);
        if (entries.length === 0) return 'None';

        return entries.reduce((min, [action, count]) =>
            count < actionsByType[min] ? action : min
        );
    }

    private getPeakUsageHour(actionsByHour: Record<number, number>): number {
        const entries = Object.entries(actionsByHour);
        if (entries.length === 0) return 0;

        return parseInt(entries.reduce((max, [hour, count]) =>
            count > actionsByHour[max] ? hour : max
        ));
    }

    private calculateAverageSessionDuration(): number {
        if (this.sessions.length === 0) return 0;

        const totalDuration = this.sessions.reduce((sum, session) =>
            sum + (session.duration || 0), 0
        );
        return Math.round(totalDuration / this.sessions.length);
    }

    private calculateKeyboardShortcutUsage(): number {
        if (this.actions.length === 0) return 0;

        const keyboardActions = this.actions.filter(action =>
            (action as any).method === 'keyboard'
        ).length;

        return Math.round((keyboardActions / this.actions.length) * 100);
    }

    private calculateSoundEnabledUsage(): number {
        if (this.sessions.length === 0) return 0;

        const soundEnabledSessions = this.sessions.filter(session =>
            session.soundEnabled
        ).length;

        return Math.round((soundEnabledSessions / this.sessions.length) * 100);
    }

    private calculateErrorRate(): number {
        if (this.actions.length === 0) return 0;

        const errorActions = this.actions.filter(action =>
            action.actionType.includes('ERROR') || action.message.includes('error')
        ).length;

        return Math.round((errorActions / this.actions.length) * 100);
    }

    private getLastActionTime(): string {
        if (this.actions.length === 0) return 'Never';

        const lastAction = this.actions[this.actions.length - 1];
        return new Date(lastAction.timestamp).toLocaleString();
    }

    private getFirstActionTime(): string {
        if (this.actions.length === 0) return 'Never';

        const firstAction = this.actions[0];
        return new Date(firstAction.timestamp).toLocaleString();
    }

    // Get usage patterns
    getUsagePatterns(): UsagePattern {
        const analytics = this.getAnalytics();
        const hour = new Date().getHours();
        const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as any;

        let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
        if (hour >= 6 && hour < 12) timeOfDay = 'morning';
        else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
        else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
        else timeOfDay = 'night';

        const frequency = analytics.totalActions > 50 ? 'high' :
            analytics.totalActions > 20 ? 'medium' : 'low';

        const preferredActions = Object.entries(analytics.actionsByType)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([action]) => action);

        return {
            timeOfDay,
            dayOfWeek,
            frequency,
            preferredActions,
            averageSessionLength: analytics.averageSessionDuration
        };
    }

    // Get recent activity (last 24 hours)
    getRecentActivity(): ActionResult[] {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return this.actions.filter(action =>
            new Date(action.timestamp) >= oneDayAgo
        ).slice(-10); // Last 10 actions
    }

    // Clear all analytics data
    clearAnalytics() {
        this.actions = [];
        this.sessions = [];
        this.currentSession = null;
        this.initializeSession();
        this.saveStoredData();
    }

    // Enable/disable analytics
    setEnabled(enabled: boolean) {
        this.isEnabled = enabled;
    }

    isAnalyticsEnabled(): boolean {
        return this.isEnabled;
    }

    // Export analytics data
    exportData(format: 'json' | 'csv' = 'json'): string {
        const data = {
            analytics: this.getAnalytics(),
            sessions: this.sessions,
            actions: this.actions,
            usagePatterns: this.getUsagePatterns(),
            exportTime: new Date().toISOString()
        };

        if (format === 'csv') {
            return this.convertToCSV(data);
        }

        return JSON.stringify(data, null, 2);
    }

    private convertToCSV(data: any): string {
        // Simple CSV conversion for actions
        const headers = ['timestamp', 'actionType', 'method', 'message'];
        const rows = this.actions.map(action => [
            action.timestamp,
            action.actionType,
            (action as any).method || 'click',
            action.message
        ]);

        return [headers, ...rows].map(row =>
            row.map(field => `"${field}"`).join(',')
        ).join('\n');
    }
}

// Create singleton instance
export const analyticsManager = new AnalyticsManager();

// Auto-save session on page unload
window.addEventListener('beforeunload', () => {
    analyticsManager.endSession();
});

// Auto-save session every 5 minutes
setInterval(() => {
    analyticsManager.endSession();
    analyticsManager.initializeSession();
}, 5 * 60 * 1000);

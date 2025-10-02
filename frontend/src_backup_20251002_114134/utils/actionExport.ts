// Enhanced Action Export System
// Export action history and analytics data to various formats

import { ActionResult } from './actionGenerators';
import { analyticsManager } from './analytics';
import { actionScheduler } from './actionScheduler';
import { actionTemplateManager } from './actionTemplates';

export interface ExportOptions {
    format: 'csv' | 'json' | 'xlsx' | 'pdf';
    dateRange?: {
        start: string;
        end: string;
    };
    includeAnalytics?: boolean;
    includeScheduled?: boolean;
    includeTemplates?: boolean;
    includeMetadata?: boolean;
    groupBy?: 'actionType' | 'date' | 'session' | 'none';
    sortBy?: 'timestamp' | 'actionType' | 'duration' | 'success';
    sortOrder?: 'asc' | 'desc';
    filterBy?: {
        actionTypes?: string[];
        success?: boolean;
        sessions?: string[];
    };
}

export interface ExportData {
    actions: ActionResult[];
    analytics?: any;
    scheduled?: any[];
    templates?: any[];
    metadata: {
        exportDate: string;
        totalActions: number;
        dateRange: string;
        format: string;
        version: string;
    };
}

export interface ExportResult {
    success: boolean;
    data?: string | Blob;
    filename?: string;
    size?: number;
    error?: string;
}

class ActionExportManager {
    private version = '1.0.0';

    // Export action history to various formats
    async exportActions(options: ExportOptions): Promise<ExportResult> {
        try {
            const data = await this.prepareExportData(options);

            switch (options.format) {
                case 'csv':
                    return this.exportToCSV(data, options);
                case 'json':
                    return this.exportToJSON(data, options);
                case 'xlsx':
                    return this.exportToXLSX(data, options);
                case 'pdf':
                    return this.exportToPDF(data, options);
                default:
                    throw new Error(`Unsupported export format: ${options.format}`);
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    private async prepareExportData(options: ExportOptions): Promise<ExportData> {
        // Get action history
        const allActions = this.getActionHistory();

        // Apply filters
        let filteredActions = this.applyFilters(allActions, options);

        // Apply date range filter
        if (options.dateRange) {
            filteredActions = this.applyDateRange(filteredActions, options.dateRange);
        }

        // Sort actions
        filteredActions = this.sortActions(filteredActions, options);

        // Group actions if requested
        const groupedActions = this.groupActions(filteredActions, options);

        const exportData: ExportData = {
            actions: groupedActions,
            metadata: {
                exportDate: new Date().toISOString(),
                totalActions: filteredActions.length,
                dateRange: options.dateRange ?
                    `${options.dateRange.start} to ${options.dateRange.end}` :
                    'All time',
                format: options.format,
                version: this.version
            }
        };

        // Add optional data
        if (options.includeAnalytics) {
            exportData.analytics = this.getAnalyticsData();
        }

        if (options.includeScheduled) {
            exportData.scheduled = actionScheduler.getScheduledActions();
        }

        if (options.includeTemplates) {
            exportData.templates = actionTemplateManager.getTemplates();
        }

        return exportData;
    }

    private getActionHistory(): ActionResult[] {
        try {
            const stored = localStorage.getItem('actionHistory');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.warn('Failed to load action history:', error);
            return [];
        }
    }

    private applyFilters(actions: ActionResult[], options: ExportOptions): ActionResult[] {
        if (!options.filterBy) return actions;

        return actions.filter(action => {
            if (options.filterBy!.actionTypes &&
                !options.filterBy!.actionTypes.includes(action.actionType)) {
                return false;
            }

            if (options.filterBy!.success !== undefined &&
                action.success !== options.filterBy!.success) {
                return false;
            }

            if (options.filterBy!.sessions &&
                !options.filterBy!.sessions.includes(action.sessionId || '')) {
                return false;
            }

            return true;
        });
    }

    private applyDateRange(actions: ActionResult[], dateRange: { start: string; end: string }): ActionResult[] {
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);

        return actions.filter(action => {
            const actionDate = new Date(action.timestamp);
            return actionDate >= startDate && actionDate <= endDate;
        });
    }

    private sortActions(actions: ActionResult[], options: ExportOptions): ActionResult[] {
        if (!options.sortBy) return actions;

        return actions.sort((a, b) => {
            let aValue: any, bValue: any;

            switch (options.sortBy) {
                case 'timestamp':
                    aValue = new Date(a.timestamp).getTime();
                    bValue = new Date(b.timestamp).getTime();
                    break;
                case 'actionType':
                    aValue = a.actionType;
                    bValue = b.actionType;
                    break;
                case 'duration':
                    aValue = a.duration || 0;
                    bValue = b.duration || 0;
                    break;
                case 'success':
                    aValue = a.success ? 1 : 0;
                    bValue = b.success ? 1 : 0;
                    break;
                default:
                    return 0;
            }

            if (options.sortOrder === 'desc') {
                return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
            } else {
                return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
            }
        });
    }

    private groupActions(actions: ActionResult[], options: ExportOptions): ActionResult[] {
        if (!options.groupBy || options.groupBy === 'none') return actions;

        // For now, return actions as-is. Grouping would be implemented based on specific requirements
        return actions;
    }

    private getAnalyticsData(): any {
        try {
            return {
                sessions: analyticsManager.getSessions(),
                actionStats: analyticsManager.getActionStats(),
                methodStats: analyticsManager.getMethodStats(),
                timeStats: analyticsManager.getTimeStats()
            };
        } catch (error) {
            console.warn('Failed to get analytics data:', error);
            return null;
        }
    }

    // CSV Export
    private exportToCSV(data: ExportData, options: ExportOptions): ExportResult {
        const csvContent = this.convertToCSV(data.actions);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const filename = this.generateFilename('actions', 'csv', options.dateRange);

        return {
            success: true,
            data: blob,
            filename,
            size: blob.size
        };
    }

    private convertToCSV(actions: ActionResult[]): string {
        if (actions.length === 0) return '';

        const headers = [
            'Timestamp',
            'Action Type',
            'Action String',
            'Unique ID',
            'Success',
            'Duration (ms)',
            'Session ID',
            'Method',
            'Message',
            'Data'
        ];

        const rows = actions.map(action => [
            action.timestamp,
            action.actionType,
            action.actionString,
            action.uniqueId,
            action.success ? 'Yes' : 'No',
            action.duration || 0,
            action.sessionId || '',
            action.method || '',
            action.message || '',
            JSON.stringify(action.data || {})
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        return csvContent;
    }

    // JSON Export
    private exportToJSON(data: ExportData, options: ExportOptions): ExportResult {
        const jsonContent = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        const filename = this.generateFilename('actions', 'json', options.dateRange);

        return {
            success: true,
            data: blob,
            filename,
            size: blob.size
        };
    }

    // XLSX Export (simplified - would need a library like SheetJS for full implementation)
    private exportToXLSX(data: ExportData, options: ExportOptions): ExportResult {
        // For now, export as CSV with .xlsx extension
        // In a real implementation, you would use a library like SheetJS
        const csvContent = this.convertToCSV(data.actions);
        const blob = new Blob([csvContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const filename = this.generateFilename('actions', 'xlsx', options.dateRange);

        return {
            success: true,
            data: blob,
            filename,
            size: blob.size
        };
    }

    // PDF Export (simplified - would need a library like jsPDF for full implementation)
    private exportToPDF(data: ExportData, options: ExportOptions): ExportResult {
        // For now, export as JSON with .pdf extension
        // In a real implementation, you would use a library like jsPDF
        const jsonContent = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/pdf' });
        const filename = this.generateFilename('actions', 'pdf', options.dateRange);

        return {
            success: true,
            data: blob,
            filename,
            size: blob.size
        };
    }

    private generateFilename(prefix: string, extension: string, dateRange?: { start: string; end: string }): string {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');

        let filename = `${prefix}_${dateStr}_${timeStr}`;

        if (dateRange) {
            const startDate = dateRange.start.split('T')[0];
            const endDate = dateRange.end.split('T')[0];
            filename = `${prefix}_${startDate}_to_${endDate}`;
        }

        return `${filename}.${extension}`;
    }

    // Download file
    downloadFile(result: ExportResult): void {
        if (!result.success || !result.data || !result.filename) {
            throw new Error('Invalid export result');
        }

        const url = URL.createObjectURL(result.data as Blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Get export statistics
    getExportStats(): any {
        const actions = this.getActionHistory();
        const analytics = this.getAnalyticsData();

        return {
            totalActions: actions.length,
            successfulActions: actions.filter(a => a.success).length,
            failedActions: actions.filter(a => !a.success).length,
            uniqueActionTypes: [...new Set(actions.map(a => a.actionType))].length,
            dateRange: {
                earliest: actions.length > 0 ? Math.min(...actions.map(a => new Date(a.timestamp).getTime())) : null,
                latest: actions.length > 0 ? Math.max(...actions.map(a => new Date(a.timestamp).getTime())) : null
            },
            analyticsAvailable: !!analytics,
            scheduledActions: actionScheduler.getScheduledActions().length,
            templates: actionTemplateManager.getTemplates().length
        };
    }

    // Export templates
    async exportTemplates(templateIds?: string[]): Promise<ExportResult> {
        try {
            const templates = templateIds ?
                actionTemplateManager.getTemplates().filter(t => templateIds.includes(t.id)) :
                actionTemplateManager.getTemplates();

            const data = {
                templates,
                metadata: {
                    exportDate: new Date().toISOString(),
                    totalTemplates: templates.length,
                    version: this.version
                }
            };

            const jsonContent = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
            const filename = `templates_${new Date().toISOString().split('T')[0]}.json`;

            return {
                success: true,
                data: blob,
                filename,
                size: blob.size
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    // Export scheduled actions
    async exportScheduledActions(): Promise<ExportResult> {
        try {
            const scheduledActions = actionScheduler.getScheduledActions();

            const data = {
                scheduledActions,
                metadata: {
                    exportDate: new Date().toISOString(),
                    totalScheduled: scheduledActions.length,
                    version: this.version
                }
            };

            const jsonContent = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
            const filename = `scheduled_actions_${new Date().toISOString().split('T')[0]}.json`;

            return {
                success: true,
                data: blob,
                filename,
                size: blob.size
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}

// Create singleton instance
export const actionExportManager = new ActionExportManager();

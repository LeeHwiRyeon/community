// Enhanced Action Validation System
// Comprehensive validation and error handling for all actions

import { ActionResult, ActionData } from './actionGenerators';

export interface ValidationRule {
    id: string;
    name: string;
    description: string;
    severity: 'error' | 'warning' | 'info';
    condition: (action: ActionData) => boolean;
    message: (action: ActionData) => string;
    fix?: (action: ActionData) => ActionData;
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    info: ValidationInfo[];
    score: number; // 0-100
    suggestions: string[];
}

export interface ValidationError {
    id: string;
    ruleId: string;
    message: string;
    field?: string;
    value?: any;
    fix?: () => ActionData;
    severity: 'error';
}

export interface ValidationWarning {
    id: string;
    ruleId: string;
    message: string;
    field?: string;
    value?: any;
    fix?: () => ActionData;
    severity: 'warning';
}

export interface ValidationInfo {
    id: string;
    ruleId: string;
    message: string;
    field?: string;
    value?: any;
    severity: 'info';
}

export interface ValidationSettings {
    enableRealTimeValidation: boolean;
    enableAutoFix: boolean;
    enableSuggestions: boolean;
    strictMode: boolean;
    customRules: ValidationRule[];
    ignoredRules: string[];
    validationTimeout: number; // milliseconds
}

export interface ValidationStatistics {
    totalValidations: number;
    successfulValidations: number;
    failedValidations: number;
    averageScore: number;
    mostCommonErrors: { ruleId: string; count: number }[];
    validationTime: number; // average milliseconds
}

class ActionValidationManager {
    private rules: Map<string, ValidationRule> = new Map();
    private settings: ValidationSettings = {
        enableRealTimeValidation: true,
        enableAutoFix: true,
        enableSuggestions: true,
        strictMode: false,
        customRules: [],
        ignoredRules: [],
        validationTimeout: 5000
    };
    private statistics: ValidationStatistics = {
        totalValidations: 0,
        successfulValidations: 0,
        failedValidations: 0,
        averageScore: 0,
        mostCommonErrors: [],
        validationTime: 0
    };

    constructor() {
        this.loadStoredData();
        this.initializeDefaultRules();
    }

    private loadStoredData() {
        try {
            const storedSettings = localStorage.getItem('validation_settings');
            const storedStats = localStorage.getItem('validation_statistics');

            if (storedSettings) {
                this.settings = { ...this.settings, ...JSON.parse(storedSettings) };
            }

            if (storedStats) {
                this.statistics = { ...this.statistics, ...JSON.parse(storedStats) };
            }
        } catch (error) {
            console.warn('Failed to load validation data:', error);
        }
    }

    private saveStoredData() {
        try {
            localStorage.setItem('validation_settings', JSON.stringify(this.settings));
            localStorage.setItem('validation_statistics', JSON.stringify(this.statistics));
        } catch (error) {
            console.warn('Failed to save validation data:', error);
        }
    }

    private initializeDefaultRules() {
        // Required field validation
        this.addRule({
            id: 'required_fields',
            name: 'Required Fields',
            description: 'All required fields must be present',
            severity: 'error',
            condition: (action) => {
                return !action.id || !action.type || !action.timestamp || !action.payload;
            },
            message: (action) => {
                const missing = [];
                if (!action.id) missing.push('id');
                if (!action.type) missing.push('type');
                if (!action.timestamp) missing.push('timestamp');
                if (!action.payload) missing.push('payload');
                return `Missing required fields: ${missing.join(', ')}`;
            },
            fix: (action) => ({
                ...action,
                id: action.id || `action_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                type: action.type || 'UNKNOWN',
                timestamp: action.timestamp || new Date().toISOString(),
                payload: action.payload || {}
            })
        });

        // Valid action type validation
        this.addRule({
            id: 'valid_action_type',
            name: 'Valid Action Type',
            description: 'Action type must be valid',
            severity: 'error',
            condition: (action) => {
                const validTypes = [
                    'POST_CREATE', 'COMMENT_ADD', 'LIKE_ADD', 'SHARE_ACTION',
                    'FOLLOW_USER', 'BOOKMARK_ADD', 'PAGE_NEXT', 'PAGE_PREV'
                ];
                return !validTypes.includes(action.type);
            },
            message: (action) => `Invalid action type: ${action.type}`,
            fix: (action) => ({
                ...action,
                type: 'POST_CREATE' // Default to POST_CREATE
            })
        });

        // Timestamp validation
        this.addRule({
            id: 'valid_timestamp',
            name: 'Valid Timestamp',
            description: 'Timestamp must be a valid ISO string',
            severity: 'error',
            condition: (action) => {
                try {
                    const date = new Date(action.timestamp);
                    return isNaN(date.getTime());
                } catch {
                    return true;
                }
            },
            message: (action) => `Invalid timestamp format: ${action.timestamp}`,
            fix: (action) => ({
                ...action,
                timestamp: new Date().toISOString()
            })
        });

        // Payload validation
        this.addRule({
            id: 'valid_payload',
            name: 'Valid Payload',
            description: 'Payload must be an object',
            severity: 'error',
            condition: (action) => {
                return typeof action.payload !== 'object' || action.payload === null;
            },
            message: (action) => `Payload must be an object, got: ${typeof action.payload}`,
            fix: (action) => ({
                ...action,
                payload: {}
            })
        });

        // Unique string validation
        this.addRule({
            id: 'unique_string_format',
            name: 'Unique String Format',
            description: 'Unique string should follow expected format',
            severity: 'warning',
            condition: (action) => {
                if (!action.uniqueString) return true;
                const parts = action.uniqueString.split('-');
                return parts.length < 3;
            },
            message: (action) => `Unique string format may be invalid: ${action.uniqueString}`,
            fix: (action) => ({
                ...action,
                uniqueString: `${action.type}-${action.timestamp}-${Math.random().toString(36).substring(7)}`
            })
        });

        // Payload content validation for specific action types
        this.addRule({
            id: 'post_content_validation',
            name: 'Post Content Validation',
            description: 'Post creation actions should have title and content',
            severity: 'warning',
            condition: (action) => {
                if (action.type !== 'POST_CREATE') return false;
                return !action.payload.title || !action.payload.content;
            },
            message: (action) => 'Post creation should include title and content',
            fix: (action) => ({
                ...action,
                payload: {
                    ...action.payload,
                    title: action.payload.title || 'Untitled Post',
                    content: action.payload.content || 'No content provided'
                }
            })
        });

        this.addRule({
            id: 'comment_content_validation',
            name: 'Comment Content Validation',
            description: 'Comment actions should have postId and content',
            severity: 'warning',
            condition: (action) => {
                if (action.type !== 'COMMENT_ADD') return false;
                return !action.payload.postId || !action.payload.commentContent;
            },
            message: (action) => 'Comment should include postId and content',
            fix: (action) => ({
                ...action,
                payload: {
                    ...action.payload,
                    postId: action.payload.postId || 'unknown',
                    commentContent: action.payload.commentContent || 'No comment content'
                }
            })
        });

        // Data size validation
        this.addRule({
            id: 'payload_size_validation',
            name: 'Payload Size Validation',
            description: 'Payload should not be too large',
            severity: 'warning',
            condition: (action) => {
                const payloadSize = JSON.stringify(action.payload).length;
                return payloadSize > 10000; // 10KB limit
            },
            message: (action) => {
                const payloadSize = JSON.stringify(action.payload).length;
                return `Payload size (${payloadSize} bytes) exceeds recommended limit`;
            }
        });

        // Future timestamp validation
        this.addRule({
            id: 'future_timestamp_validation',
            name: 'Future Timestamp Validation',
            description: 'Timestamp should not be in the future',
            severity: 'warning',
            condition: (action) => {
                try {
                    const actionDate = new Date(action.timestamp);
                    const now = new Date();
                    return actionDate > now;
                } catch {
                    return false;
                }
            },
            message: (action) => 'Timestamp is in the future',
            fix: (action) => ({
                ...action,
                timestamp: new Date().toISOString()
            })
        });

        // Old timestamp validation
        this.addRule({
            id: 'old_timestamp_validation',
            name: 'Old Timestamp Validation',
            description: 'Timestamp should not be too old',
            severity: 'info',
            condition: (action) => {
                try {
                    const actionDate = new Date(action.timestamp);
                    const oneYearAgo = new Date();
                    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                    return actionDate < oneYearAgo;
                } catch {
                    return false;
                }
            },
            message: (action) => 'Timestamp is more than one year old'
        });
    }

    // Add custom validation rule
    addRule(rule: ValidationRule): void {
        this.rules.set(rule.id, rule);
    }

    // Remove validation rule
    removeRule(ruleId: string): boolean {
        return this.rules.delete(ruleId);
    }

    // Get all rules
    getRules(): ValidationRule[] {
        return Array.from(this.rules.values());
    }

    // Get rule by ID
    getRule(ruleId: string): ValidationRule | undefined {
        return this.rules.get(ruleId);
    }

    // Validate action
    async validateAction(action: ActionData): Promise<ValidationResult> {
        const startTime = Date.now();

        try {
            const errors: ValidationError[] = [];
            const warnings: ValidationWarning[] = [];
            const info: ValidationInfo[] = [];

            // Run all validation rules
            for (const rule of this.rules.values()) {
                if (this.settings.ignoredRules.includes(rule.id)) {
                    continue;
                }

                try {
                    if (rule.condition(action)) {
                        const message = rule.message(action);
                        const validationItem = {
                            id: `${rule.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                            ruleId: rule.id,
                            message,
                            field: this.getFieldFromAction(action, rule.id),
                            value: this.getValueFromAction(action, rule.id),
                            fix: rule.fix ? () => rule.fix!(action) : undefined,
                            severity: rule.severity
                        };

                        switch (rule.severity) {
                            case 'error':
                                errors.push(validationItem as ValidationError);
                                break;
                            case 'warning':
                                warnings.push(validationItem as ValidationWarning);
                                break;
                            case 'info':
                                info.push(validationItem as ValidationInfo);
                                break;
                        }
                    }
                } catch (error) {
                    console.warn(`Validation rule ${rule.id} failed:`, error);
                }
            }

            // Calculate validation score
            const score = this.calculateScore(errors, warnings, info);

            // Generate suggestions
            const suggestions = this.generateSuggestions(errors, warnings, info);

            const result: ValidationResult = {
                isValid: errors.length === 0,
                errors,
                warnings,
                info,
                score,
                suggestions
            };

            // Update statistics
            this.updateStatistics(result, Date.now() - startTime);

            return result;
        } catch (error) {
            console.error('Validation failed:', error);
            return {
                isValid: false,
                errors: [{
                    id: 'validation_error',
                    ruleId: 'system',
                    message: 'Validation system error',
                    severity: 'error'
                }],
                warnings: [],
                info: [],
                score: 0,
                suggestions: ['Check system logs for details']
            };
        }
    }

    // Validate multiple actions
    async validateActions(actions: ActionData[]): Promise<ValidationResult[]> {
        const results = await Promise.all(
            actions.map(action => this.validateAction(action))
        );
        return results;
    }

    // Auto-fix action based on validation results
    async autoFixAction(action: ActionData, validationResult: ValidationResult): Promise<ActionData> {
        if (!this.settings.enableAutoFix) {
            return action;
        }

        let fixedAction = { ...action };

        // Apply fixes for errors first
        for (const error of validationResult.errors) {
            if (error.fix) {
                try {
                    fixedAction = error.fix();
                } catch (error) {
                    console.warn('Auto-fix failed for error:', error);
                }
            }
        }

        // Apply fixes for warnings if in strict mode
        if (this.settings.strictMode) {
            for (const warning of validationResult.warnings) {
                if (warning.fix) {
                    try {
                        fixedAction = warning.fix();
                    } catch (error) {
                        console.warn('Auto-fix failed for warning:', error);
                    }
                }
            }
        }

        return fixedAction;
    }

    private calculateScore(errors: ValidationError[], warnings: ValidationWarning[], info: ValidationInfo[]): number {
        const totalIssues = errors.length + warnings.length + info.length;
        if (totalIssues === 0) return 100;

        const errorWeight = 10;
        const warningWeight = 5;
        const infoWeight = 1;

        const weightedScore = (errors.length * errorWeight) + (warnings.length * warningWeight) + (info.length * infoWeight);
        const maxPossibleScore = (errors.length + warnings.length + info.length) * errorWeight;

        return Math.max(0, Math.round(100 - (weightedScore / maxPossibleScore) * 100));
    }

    private generateSuggestions(errors: ValidationError[], warnings: ValidationWarning[], info: ValidationInfo[]): string[] {
        const suggestions: string[] = [];

        if (errors.length > 0) {
            suggestions.push('Fix all errors before proceeding');
        }

        if (warnings.length > 0) {
            suggestions.push('Consider addressing warnings for better data quality');
        }

        if (info.length > 0) {
            suggestions.push('Review informational messages for potential improvements');
        }

        // Specific suggestions based on common issues
        const hasRequiredFieldErrors = errors.some(e => e.ruleId === 'required_fields');
        if (hasRequiredFieldErrors) {
            suggestions.push('Ensure all required fields are provided');
        }

        const hasTimestampErrors = errors.some(e => e.ruleId === 'valid_timestamp');
        if (hasTimestampErrors) {
            suggestions.push('Use ISO 8601 format for timestamps');
        }

        const hasPayloadErrors = errors.some(e => e.ruleId === 'valid_payload');
        if (hasPayloadErrors) {
            suggestions.push('Ensure payload is a valid object');
        }

        return suggestions;
    }

    private getFieldFromAction(action: ActionData, ruleId: string): string | undefined {
        switch (ruleId) {
            case 'required_fields':
                return 'id,type,timestamp,payload';
            case 'valid_action_type':
                return 'type';
            case 'valid_timestamp':
                return 'timestamp';
            case 'valid_payload':
                return 'payload';
            case 'unique_string_format':
                return 'uniqueString';
            default:
                return undefined;
        }
    }

    private getValueFromAction(action: ActionData, ruleId: string): any {
        switch (ruleId) {
            case 'valid_action_type':
                return action.type;
            case 'valid_timestamp':
                return action.timestamp;
            case 'valid_payload':
                return action.payload;
            case 'unique_string_format':
                return action.uniqueString;
            default:
                return undefined;
        }
    }

    private updateStatistics(result: ValidationResult, validationTime: number): void {
        this.statistics.totalValidations++;

        if (result.isValid) {
            this.statistics.successfulValidations++;
        } else {
            this.statistics.failedValidations++;
        }

        // Update average score
        const totalScore = this.statistics.averageScore * (this.statistics.totalValidations - 1) + result.score;
        this.statistics.averageScore = totalScore / this.statistics.totalValidations;

        // Update average validation time
        const totalTime = this.statistics.validationTime * (this.statistics.totalValidations - 1) + validationTime;
        this.statistics.validationTime = totalTime / this.statistics.totalValidations;

        // Update most common errors
        const errorCounts = new Map<string, number>();
        result.errors.forEach(error => {
            const count = errorCounts.get(error.ruleId) || 0;
            errorCounts.set(error.ruleId, count + 1);
        });

        this.statistics.mostCommonErrors = Array.from(errorCounts.entries())
            .map(([ruleId, count]) => ({ ruleId, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        this.saveStoredData();
    }

    // Settings management
    getSettings(): ValidationSettings {
        return { ...this.settings };
    }

    updateSettings(settings: Partial<ValidationSettings>): void {
        this.settings = { ...this.settings, ...settings };
        this.saveStoredData();
    }

    // Statistics
    getStatistics(): ValidationStatistics {
        return { ...this.statistics };
    }

    // Reset statistics
    resetStatistics(): void {
        this.statistics = {
            totalValidations: 0,
            successfulValidations: 0,
            failedValidations: 0,
            averageScore: 0,
            mostCommonErrors: [],
            validationTime: 0
        };
        this.saveStoredData();
    }

    // Export validation rules
    exportRules(): string {
        return JSON.stringify(Array.from(this.rules.values()), null, 2);
    }

    // Import validation rules
    importRules(rulesJson: string): boolean {
        try {
            const rules = JSON.parse(rulesJson);
            if (Array.isArray(rules)) {
                rules.forEach(rule => {
                    if (rule.id && rule.name && rule.condition && rule.message) {
                        this.addRule(rule);
                    }
                });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to import validation rules:', error);
            return false;
        }
    }
}

// Create singleton instance
export const actionValidationManager = new ActionValidationManager();

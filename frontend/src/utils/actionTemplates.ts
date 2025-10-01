// Enhanced Action Templates System
// Advanced template management for common workflows

import { ACTION_REGISTRY } from './actionGenerators';

export interface ActionTemplate {
    id: string;
    name: string;
    description: string;
    category: 'social' | 'content' | 'navigation' | 'automation' | 'testing' | 'custom';
    tags: string[];
    actions: TemplateAction[];
    variables: TemplateVariable[];
    settings: TemplateSettings;
    metadata: TemplateMetadata;
    isDefault: boolean;
    isPublic: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    usageCount: number;
    rating: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedDuration: number; // minutes
}

export interface TemplateAction {
    id: string;
    actionType: keyof typeof ACTION_REGISTRY;
    name: string;
    description?: string;
    order: number;
    required: boolean;
    settings: {
        delay?: number; // milliseconds before execution
        retryOnFailure?: boolean;
        skipOnError?: boolean;
        customData?: Record<string, any>;
    };
    conditions?: TemplateCondition[];
}

export interface TemplateVariable {
    id: string;
    name: string;
    type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect';
    description: string;
    defaultValue: any;
    required: boolean;
    options?: string[]; // for select/multiselect types
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
        custom?: (value: any) => boolean;
    };
}

export interface TemplateCondition {
    id: string;
    variableId: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
    value: any;
    action: 'skip' | 'modify' | 'stop';
}

export interface TemplateSettings {
    allowCustomization: boolean;
    allowVariableOverride: boolean;
    requireConfirmation: boolean;
    showProgress: boolean;
    enableNotifications: boolean;
    autoSave: boolean;
    maxExecutions?: number;
    timeout?: number; // minutes
}

export interface TemplateMetadata {
    version: string;
    author: string;
    documentation?: string;
    changelog?: string[];
    dependencies?: string[];
    compatibility: string[];
    lastTested: string;
}

export interface TemplateExecution {
    id: string;
    templateId: string;
    variables: Record<string, any>;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    progress: number;
    startedAt?: string;
    completedAt?: string;
    results: TemplateActionResult[];
    error?: string;
}

export interface TemplateActionResult {
    actionId: string;
    actionType: string;
    success: boolean;
    result?: any;
    error?: string;
    executedAt: string;
    duration: number;
}

class ActionTemplateManager {
    private templates: ActionTemplate[] = [];
    private executions: TemplateExecution[] = [];
    private isExecuting: boolean = false;

    constructor() {
        this.loadStoredData();
        this.initializeDefaultTemplates();
    }

    private loadStoredData() {
        try {
            const storedTemplates = localStorage.getItem('action_templates');
            const storedExecutions = localStorage.getItem('template_executions');

            if (storedTemplates) {
                this.templates = JSON.parse(storedTemplates);
            }

            if (storedExecutions) {
                this.executions = JSON.parse(storedExecutions);
            }
        } catch (error) {
            console.warn('Failed to load template data:', error);
            this.templates = [];
            this.executions = [];
        }
    }

    private saveStoredData() {
        try {
            localStorage.setItem('action_templates', JSON.stringify(this.templates));
            localStorage.setItem('template_executions', JSON.stringify(this.executions));
        } catch (error) {
            console.warn('Failed to save template data:', error);
        }
    }

    private initializeDefaultTemplates() {
        if (this.templates.length === 0) {
            this.templates = [
                // Social Media Management
                {
                    id: 'social_media_daily',
                    name: 'Daily Social Media Management',
                    description: 'Complete daily social media engagement workflow',
                    category: 'social',
                    tags: ['social', 'daily', 'engagement', 'management'],
                    actions: [
                        {
                            id: 'like_posts',
                            actionType: 'createLike',
                            name: 'Like Recent Posts',
                            description: 'Like posts from followed users',
                            order: 1,
                            required: true,
                            settings: { delay: 1000 }
                        },
                        {
                            id: 'share_content',
                            actionType: 'createShare',
                            name: 'Share Content',
                            description: 'Share interesting content',
                            order: 2,
                            required: true,
                            settings: { delay: 2000 }
                        },
                        {
                            id: 'follow_users',
                            actionType: 'createFollow',
                            name: 'Follow New Users',
                            description: 'Follow users based on interests',
                            order: 3,
                            required: false,
                            settings: { delay: 3000 }
                        }
                    ],
                    variables: [
                        {
                            id: 'like_count',
                            name: 'Number of Likes',
                            type: 'number',
                            description: 'How many posts to like',
                            defaultValue: 5,
                            required: true,
                            validation: { min: 1, max: 50 }
                        },
                        {
                            id: 'share_count',
                            name: 'Number of Shares',
                            type: 'number',
                            description: 'How many posts to share',
                            defaultValue: 2,
                            required: true,
                            validation: { min: 1, max: 20 }
                        }
                    ],
                    settings: {
                        allowCustomization: true,
                        allowVariableOverride: true,
                        requireConfirmation: true,
                        showProgress: true,
                        enableNotifications: true,
                        autoSave: true
                    },
                    metadata: {
                        version: '1.0.0',
                        author: 'System',
                        compatibility: ['all'],
                        lastTested: new Date().toISOString()
                    },
                    isDefault: true,
                    isPublic: true,
                    createdBy: 'system',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    usageCount: 0,
                    rating: 4.5,
                    difficulty: 'beginner',
                    estimatedDuration: 10
                },

                // Content Creation Workflow
                {
                    id: 'content_creation_workflow',
                    name: 'Content Creation Workflow',
                    description: 'Complete content creation and publishing workflow',
                    category: 'content',
                    tags: ['content', 'creation', 'publishing', 'workflow'],
                    actions: [
                        {
                            id: 'create_post',
                            actionType: 'createPost',
                            name: 'Create New Post',
                            description: 'Create a new post with specified content',
                            order: 1,
                            required: true,
                            settings: { delay: 1000 }
                        },
                        {
                            id: 'add_comment',
                            actionType: 'createComment',
                            name: 'Add Comment',
                            description: 'Add a comment to the post',
                            order: 2,
                            required: false,
                            settings: { delay: 2000 }
                        },
                        {
                            id: 'bookmark_post',
                            actionType: 'createBookmark',
                            name: 'Bookmark Post',
                            description: 'Bookmark the created post',
                            order: 3,
                            required: false,
                            settings: { delay: 1000 }
                        }
                    ],
                    variables: [
                        {
                            id: 'post_title',
                            name: 'Post Title',
                            type: 'string',
                            description: 'Title of the post to create',
                            defaultValue: 'New Post',
                            required: true,
                            validation: { min: 1, max: 100 }
                        },
                        {
                            id: 'post_content',
                            name: 'Post Content',
                            type: 'string',
                            description: 'Content of the post',
                            defaultValue: 'This is a new post created via template.',
                            required: true,
                            validation: { min: 10, max: 1000 }
                        },
                        {
                            id: 'add_comment',
                            name: 'Add Comment',
                            type: 'boolean',
                            description: 'Whether to add a comment after creating the post',
                            defaultValue: true,
                            required: false
                        }
                    ],
                    settings: {
                        allowCustomization: true,
                        allowVariableOverride: true,
                        requireConfirmation: true,
                        showProgress: true,
                        enableNotifications: true,
                        autoSave: true
                    },
                    metadata: {
                        version: '1.0.0',
                        author: 'System',
                        compatibility: ['all'],
                        lastTested: new Date().toISOString()
                    },
                    isDefault: true,
                    isPublic: true,
                    createdBy: 'system',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    usageCount: 0,
                    rating: 4.8,
                    difficulty: 'intermediate',
                    estimatedDuration: 5
                },

                // Testing and Quality Assurance
                {
                    id: 'comprehensive_testing',
                    name: 'Comprehensive Testing Suite',
                    description: 'Complete testing workflow for all action types',
                    category: 'testing',
                    tags: ['testing', 'qa', 'comprehensive', 'validation'],
                    actions: [
                        {
                            id: 'test_post_creation',
                            actionType: 'createPost',
                            name: 'Test Post Creation',
                            description: 'Test post creation functionality',
                            order: 1,
                            required: true,
                            settings: { delay: 1000 }
                        },
                        {
                            id: 'test_comment_creation',
                            actionType: 'createComment',
                            name: 'Test Comment Creation',
                            description: 'Test comment creation functionality',
                            order: 2,
                            required: true,
                            settings: { delay: 1000 }
                        },
                        {
                            id: 'test_like_functionality',
                            actionType: 'createLike',
                            name: 'Test Like Functionality',
                            description: 'Test like functionality',
                            order: 3,
                            required: true,
                            settings: { delay: 1000 }
                        },
                        {
                            id: 'test_share_functionality',
                            actionType: 'createShare',
                            name: 'Test Share Functionality',
                            description: 'Test share functionality',
                            order: 4,
                            required: true,
                            settings: { delay: 1000 }
                        },
                        {
                            id: 'test_follow_functionality',
                            actionType: 'createFollow',
                            name: 'Test Follow Functionality',
                            description: 'Test follow functionality',
                            order: 5,
                            required: true,
                            settings: { delay: 1000 }
                        },
                        {
                            id: 'test_bookmark_functionality',
                            actionType: 'createBookmark',
                            name: 'Test Bookmark Functionality',
                            description: 'Test bookmark functionality',
                            order: 6,
                            required: true,
                            settings: { delay: 1000 }
                        }
                    ],
                    variables: [
                        {
                            id: 'test_mode',
                            name: 'Test Mode',
                            type: 'select',
                            description: 'Type of testing to perform',
                            defaultValue: 'basic',
                            required: true,
                            options: ['basic', 'comprehensive', 'stress']
                        },
                        {
                            id: 'iterations',
                            name: 'Test Iterations',
                            type: 'number',
                            description: 'Number of test iterations to run',
                            defaultValue: 1,
                            required: true,
                            validation: { min: 1, max: 10 }
                        }
                    ],
                    settings: {
                        allowCustomization: true,
                        allowVariableOverride: true,
                        requireConfirmation: true,
                        showProgress: true,
                        enableNotifications: true,
                        autoSave: true,
                        maxExecutions: 1
                    },
                    metadata: {
                        version: '1.0.0',
                        author: 'System',
                        compatibility: ['all'],
                        lastTested: new Date().toISOString()
                    },
                    isDefault: true,
                    isPublic: true,
                    createdBy: 'system',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    usageCount: 0,
                    rating: 4.9,
                    difficulty: 'advanced',
                    estimatedDuration: 15
                },

                // Automation Workflow
                {
                    id: 'automation_workflow',
                    name: 'Automation Workflow',
                    description: 'Automated workflow for repetitive tasks',
                    category: 'automation',
                    tags: ['automation', 'workflow', 'efficiency', 'productivity'],
                    actions: [
                        {
                            id: 'navigate_pages',
                            actionType: 'nextPage',
                            name: 'Navigate Pages',
                            description: 'Navigate through multiple pages',
                            order: 1,
                            required: true,
                            settings: { delay: 2000 }
                        },
                        {
                            id: 'like_content',
                            actionType: 'createLike',
                            name: 'Like Content',
                            description: 'Like content on each page',
                            order: 2,
                            required: true,
                            settings: { delay: 1000 }
                        },
                        {
                            id: 'bookmark_interesting',
                            actionType: 'createBookmark',
                            name: 'Bookmark Interesting Content',
                            description: 'Bookmark interesting content found',
                            order: 3,
                            required: false,
                            settings: { delay: 1000 }
                        }
                    ],
                    variables: [
                        {
                            id: 'page_count',
                            name: 'Number of Pages',
                            type: 'number',
                            description: 'How many pages to navigate through',
                            defaultValue: 3,
                            required: true,
                            validation: { min: 1, max: 20 }
                        },
                        {
                            id: 'like_frequency',
                            name: 'Like Frequency',
                            type: 'select',
                            description: 'How often to like content',
                            defaultValue: 'every_page',
                            required: true,
                            options: ['every_page', 'every_other_page', 'random']
                        }
                    ],
                    settings: {
                        allowCustomization: true,
                        allowVariableOverride: true,
                        requireConfirmation: true,
                        showProgress: true,
                        enableNotifications: true,
                        autoSave: true,
                        timeout: 30
                    },
                    metadata: {
                        version: '1.0.0',
                        author: 'System',
                        compatibility: ['all'],
                        lastTested: new Date().toISOString()
                    },
                    isDefault: true,
                    isPublic: true,
                    createdBy: 'system',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    usageCount: 0,
                    rating: 4.3,
                    difficulty: 'intermediate',
                    estimatedDuration: 20
                }
            ];
            this.saveStoredData();
        }
    }

    // Template Management
    createTemplate(template: Omit<ActionTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): ActionTemplate {
        const newTemplate: ActionTemplate = {
            ...template,
            id: `template_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageCount: 0
        };

        this.templates.push(newTemplate);
        this.saveStoredData();
        return newTemplate;
    }

    getTemplates(): ActionTemplate[] {
        return [...this.templates];
    }

    getTemplate(id: string): ActionTemplate | null {
        return this.templates.find(t => t.id === id) || null;
    }

    getTemplatesByCategory(category: string): ActionTemplate[] {
        return this.templates.filter(t => t.category === category);
    }

    getTemplatesByTag(tag: string): ActionTemplate[] {
        return this.templates.filter(t => t.tags.includes(tag));
    }

    searchTemplates(query: string): ActionTemplate[] {
        const lowercaseQuery = query.toLowerCase();
        return this.templates.filter(t =>
            t.name.toLowerCase().includes(lowercaseQuery) ||
            t.description.toLowerCase().includes(lowercaseQuery) ||
            t.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
        );
    }

    updateTemplate(id: string, updates: Partial<ActionTemplate>): ActionTemplate | null {
        const template = this.templates.find(t => t.id === id);
        if (!template) return null;

        Object.assign(template, updates, { updatedAt: new Date().toISOString() });
        this.saveStoredData();
        return template;
    }

    deleteTemplate(id: string): boolean {
        const index = this.templates.findIndex(t => t.id === id);
        if (index === -1) return false;

        // Don't allow deletion of default templates
        if (this.templates[index].isDefault) {
            return false;
        }

        this.templates.splice(index, 1);
        this.saveStoredData();
        return true;
    }

    duplicateTemplate(id: string, newName: string): ActionTemplate | null {
        const template = this.templates.find(t => t.id === id);
        if (!template) return null;

        const duplicatedTemplate: ActionTemplate = {
            ...template,
            id: `template_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            name: newName,
            isDefault: false,
            createdBy: 'user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageCount: 0
        };

        this.templates.push(duplicatedTemplate);
        this.saveStoredData();
        return duplicatedTemplate;
    }

    // Template Execution
    async executeTemplate(templateId: string, variables: Record<string, any>): Promise<TemplateExecution> {
        const template = this.getTemplate(templateId);
        if (!template) {
            throw new Error(`Template ${templateId} not found`);
        }

        const execution: TemplateExecution = {
            id: `execution_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            templateId,
            variables,
            status: 'pending',
            progress: 0,
            results: []
        };

        this.executions.push(execution);
        this.saveStoredData();

        try {
            execution.status = 'running';
            execution.startedAt = new Date().toISOString();
            this.saveStoredData();

            // Update template usage count
            template.usageCount++;
            this.saveStoredData();

            // Execute actions in order
            const totalActions = template.actions.length;
            for (let i = 0; i < totalActions; i++) {
                const action = template.actions[i];

                // Check conditions
                if (this.shouldSkipAction(action, variables)) {
                    continue;
                }

                try {
                    const startTime = Date.now();

                    // Apply variable substitutions
                    const processedAction = this.processActionWithVariables(action, variables);

                    // Execute the action
                    const result = await this.executeAction(processedAction);

                    const duration = Date.now() - startTime;

                    execution.results.push({
                        actionId: action.id,
                        actionType: action.actionType,
                        success: true,
                        result,
                        executedAt: new Date().toISOString(),
                        duration
                    });

                } catch (error) {
                    execution.results.push({
                        actionId: action.id,
                        actionType: action.actionType,
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                        executedAt: new Date().toISOString(),
                        duration: 0
                    });

                    if (action.settings.skipOnError) {
                        continue;
                    } else {
                        throw error;
                    }
                }

                execution.progress = Math.round(((i + 1) / totalActions) * 100);
                this.saveStoredData();

                // Apply delay if specified
                if (action.settings.delay) {
                    await new Promise(resolve => setTimeout(resolve, action.settings.delay));
                }
            }

            execution.status = 'completed';
            execution.completedAt = new Date().toISOString();
            execution.progress = 100;

        } catch (error) {
            execution.status = 'failed';
            execution.error = error instanceof Error ? error.message : 'Unknown error';
            execution.completedAt = new Date().toISOString();
        }

        this.saveStoredData();
        return execution;
    }

    private shouldSkipAction(action: TemplateAction, variables: Record<string, any>): boolean {
        if (!action.conditions) return false;

        return action.conditions.some(condition => {
            const variableValue = variables[condition.variableId];

            switch (condition.operator) {
                case 'equals':
                    return variableValue === condition.value;
                case 'not_equals':
                    return variableValue !== condition.value;
                case 'contains':
                    return String(variableValue).includes(String(condition.value));
                case 'greater_than':
                    return Number(variableValue) > Number(condition.value);
                case 'less_than':
                    return Number(variableValue) < Number(condition.value);
                case 'in':
                    return Array.isArray(condition.value) && condition.value.includes(variableValue);
                case 'not_in':
                    return Array.isArray(condition.value) && !condition.value.includes(variableValue);
                default:
                    return false;
            }
        });
    }

    private processActionWithVariables(action: TemplateAction, variables: Record<string, any>): TemplateAction {
        // This would process any variable substitutions in the action
        // For now, return the action as-is
        return action;
    }

    private async executeAction(action: TemplateAction): Promise<any> {
        // Import the executeAction function from actionGenerators
        const { executeAction } = await import('./actionGenerators');
        return executeAction(action.actionType);
    }

    // Execution Management
    getExecutions(): TemplateExecution[] {
        return [...this.executions];
    }

    getExecution(id: string): TemplateExecution | null {
        return this.executions.find(e => e.id === id) || null;
    }

    getExecutionsByTemplate(templateId: string): TemplateExecution[] {
        return this.executions.filter(e => e.templateId === templateId);
    }

    cancelExecution(id: string): boolean {
        const execution = this.executions.find(e => e.id === id);
        if (!execution || execution.status !== 'running') return false;

        execution.status = 'cancelled';
        execution.completedAt = new Date().toISOString();
        this.saveStoredData();
        return true;
    }

    deleteExecution(id: string): boolean {
        const index = this.executions.findIndex(e => e.id === id);
        if (index === -1) return false;

        this.executions.splice(index, 1);
        this.saveStoredData();
        return true;
    }

    // Statistics
    getTemplateStats(templateId: string) {
        const executions = this.getExecutionsByTemplate(templateId);
        const totalExecutions = executions.length;
        const successfulExecutions = executions.filter(e => e.status === 'completed').length;
        const failedExecutions = executions.filter(e => e.status === 'failed').length;
        const averageDuration = executions
            .filter(e => e.completedAt && e.startedAt)
            .reduce((sum, e) => {
                const duration = new Date(e.completedAt!).getTime() - new Date(e.startedAt!).getTime();
                return sum + duration;
            }, 0) / Math.max(executions.length, 1);

        return {
            totalExecutions,
            successfulExecutions,
            failedExecutions,
            successRate: totalExecutions > 0 ? Math.round((successfulExecutions / totalExecutions) * 100) : 0,
            averageDuration: Math.round(averageDuration / 1000) // seconds
        };
    }

    getGlobalStats() {
        const allExecutions = this.executions;
        const totalExecutions = allExecutions.length;
        const successfulExecutions = allExecutions.filter(e => e.status === 'completed').length;
        const totalTemplates = this.templates.length;
        const publicTemplates = this.templates.filter(t => t.isPublic).length;

        return {
            totalTemplates,
            publicTemplates,
            totalExecutions,
            successfulExecutions,
            successRate: totalExecutions > 0 ? Math.round((successfulExecutions / totalExecutions) * 100) : 0,
            mostUsedTemplate: this.getMostUsedTemplate(),
            recentExecutions: allExecutions
                .sort((a, b) => new Date(b.startedAt || 0).getTime() - new Date(a.startedAt || 0).getTime())
                .slice(0, 5)
        };
    }

    private getMostUsedTemplate(): ActionTemplate | null {
        if (this.templates.length === 0) return null;

        return this.templates.reduce((most, current) =>
            current.usageCount > most.usageCount ? current : most
        );
    }

    // Cleanup
    cleanupOldExecutions(daysOld: number = 30): number {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const initialCount = this.executions.length;
        this.executions = this.executions.filter(execution => {
            if (!execution.startedAt) return true;
            return new Date(execution.startedAt) > cutoffDate;
        });

        const cleanedCount = initialCount - this.executions.length;
        this.saveStoredData();
        return cleanedCount;
    }
}

// Create singleton instance
export const actionTemplateManager = new ActionTemplateManager();

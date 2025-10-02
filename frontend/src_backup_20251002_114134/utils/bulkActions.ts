// Bulk Actions System
// Handles multiple action selection and execution

import { executeAction, ActionResult, ACTION_REGISTRY } from './actionGenerators';
import { analyticsManager } from './analytics';
import { playActionSound, soundEffects } from './soundEffects';
import { animationUtils } from './animations';

export interface BulkActionItem {
    id: string;
    actionType: keyof typeof ACTION_REGISTRY;
    selected: boolean;
    executed: boolean;
    result?: ActionResult;
    error?: string;
    timestamp?: string;
}

export interface BulkActionBatch {
    id: string;
    name: string;
    items: BulkActionItem[];
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    createdAt: string;
    completedAt?: string;
    totalItems: number;
    executedItems: number;
    failedItems: number;
    progress: number;
}

export interface BulkActionTemplate {
    id: string;
    name: string;
    description: string;
    actions: (keyof typeof ACTION_REGISTRY)[];
    category: 'social' | 'content' | 'navigation' | 'custom';
    isDefault: boolean;
}

class BulkActionManager {
    private batches: BulkActionBatch[] = [];
    private templates: BulkActionTemplate[] = [];
    private isExecuting: boolean = false;
    private currentBatchId: string | null = null;

    constructor() {
        this.loadStoredData();
        this.initializeDefaultTemplates();
    }

    private loadStoredData() {
        try {
            const storedBatches = localStorage.getItem('bulk_action_batches');
            const storedTemplates = localStorage.getItem('bulk_action_templates');

            if (storedBatches) {
                this.batches = JSON.parse(storedBatches);
            }

            if (storedTemplates) {
                this.templates = JSON.parse(storedTemplates);
            }
        } catch (error) {
            console.warn('Failed to load bulk action data:', error);
            this.batches = [];
            this.templates = [];
        }
    }

    private saveStoredData() {
        try {
            localStorage.setItem('bulk_action_batches', JSON.stringify(this.batches));
            localStorage.setItem('bulk_action_templates', JSON.stringify(this.templates));
        } catch (error) {
            console.warn('Failed to save bulk action data:', error);
        }
    }

    private initializeDefaultTemplates() {
        if (this.templates.length === 0) {
            this.templates = [
                {
                    id: 'social_engagement',
                    name: 'Social Engagement',
                    description: 'Like, share, and follow actions for social media engagement',
                    actions: ['createLike', 'createShare', 'createFollow'],
                    category: 'social',
                    isDefault: true
                },
                {
                    id: 'content_creation',
                    name: 'Content Creation',
                    description: 'Create posts, comments, and bookmarks for content management',
                    actions: ['createPost', 'createComment', 'createBookmark'],
                    category: 'content',
                    isDefault: true
                },
                {
                    id: 'navigation_actions',
                    name: 'Navigation Actions',
                    description: 'Page navigation and browsing actions',
                    actions: ['nextPage', 'previousPage'],
                    category: 'navigation',
                    isDefault: true
                },
                {
                    id: 'full_workflow',
                    name: 'Full Workflow',
                    description: 'Complete workflow with all available actions',
                    actions: ['createPost', 'createComment', 'createLike', 'createShare', 'createFollow', 'createBookmark'],
                    category: 'custom',
                    isDefault: true
                }
            ];
            this.saveStoredData();
        }
    }

    // Create a new bulk action batch
    createBatch(name: string, actionTypes: (keyof typeof ACTION_REGISTRY)[]): BulkActionBatch {
        const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        const items: BulkActionItem[] = actionTypes.map((actionType, index) => ({
            id: `item_${batchId}_${index}`,
            actionType,
            selected: true,
            executed: false
        }));

        const batch: BulkActionBatch = {
            id: batchId,
            name,
            items,
            status: 'pending',
            createdAt: new Date().toISOString(),
            totalItems: items.length,
            executedItems: 0,
            failedItems: 0,
            progress: 0
        };

        this.batches.unshift(batch);
        this.saveStoredData();
        return batch;
    }

    // Create batch from template
    createBatchFromTemplate(templateId: string, customName?: string): BulkActionBatch {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) {
            throw new Error(`Template ${templateId} not found`);
        }

        const name = customName || `${template.name} - ${new Date().toLocaleString()}`;
        return this.createBatch(name, template.actions);
    }

    // Toggle item selection
    toggleItemSelection(batchId: string, itemId: string): BulkActionBatch | null {
        const batch = this.batches.find(b => b.id === batchId);
        if (!batch) return null;

        const item = batch.items.find(i => i.id === itemId);
        if (!item) return null;

        item.selected = !item.selected;
        this.saveStoredData();
        return batch;
    }

    // Select all items in batch
    selectAllItems(batchId: string): BulkActionBatch | null {
        const batch = this.batches.find(b => b.id === batchId);
        if (!batch) return null;

        batch.items.forEach(item => {
            item.selected = true;
        });
        this.saveStoredData();
        return batch;
    }

    // Deselect all items in batch
    deselectAllItems(batchId: string): BulkActionBatch | null {
        const batch = this.batches.find(b => b.id === batchId);
        if (!batch) return null;

        batch.items.forEach(item => {
            item.selected = false;
        });
        this.saveStoredData();
        return batch;
    }

    // Execute bulk actions
    async executeBatch(batchId: string, options: {
        delay?: number;
        stopOnError?: boolean;
        playSounds?: boolean;
        showAnimations?: boolean;
    } = {}): Promise<BulkActionBatch | null> {
        const batch = this.batches.find(b => b.id === batchId);
        if (!batch) return null;

        if (this.isExecuting) {
            throw new Error('Another batch is currently executing');
        }

        this.isExecuting = true;
        this.currentBatchId = batchId;
        batch.status = 'running';

        const {
            delay = 1000,
            stopOnError = false,
            playSounds = true,
            showAnimations = true
        } = options;

        const selectedItems = batch.items.filter(item => item.selected);
        let executedCount = 0;
        let failedCount = 0;

        try {
            for (const item of selectedItems) {
                try {
                    // Execute the action
                    const result = executeAction(item.actionType);
                    item.result = result;
                    item.executed = true;
                    item.timestamp = new Date().toISOString();
                    executedCount++;

                    // Track analytics
                    analyticsManager.trackAction(result, 'bulk');

                    // Play sound effect
                    if (playSounds && soundEffects.isSoundEnabled()) {
                        await playActionSound(result.actionType);
                    }

                    // Show animation
                    if (showAnimations) {
                        animationUtils.showSuccessNotification(
                            `${item.actionType} executed successfully`,
                            1000
                        );
                    }

                    // Update batch progress
                    batch.executedItems = executedCount;
                    batch.failedItems = failedCount;
                    batch.progress = Math.round((executedCount + failedCount) / selectedItems.length * 100);

                    this.saveStoredData();

                    // Delay between actions
                    if (delay > 0) {
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }

                } catch (error) {
                    console.error(`Failed to execute ${item.actionType}:`, error);

                    item.error = error instanceof Error ? error.message : 'Unknown error';
                    item.executed = false;
                    failedCount++;

                    // Play error sound
                    if (playSounds && soundEffects.isSoundEnabled()) {
                        await playActionSound('ERROR');
                    }

                    // Show error animation
                    if (showAnimations) {
                        animationUtils.showErrorNotification(
                            `Failed to execute ${item.actionType}`,
                            2000
                        );
                    }

                    // Update batch progress
                    batch.executedItems = executedCount;
                    batch.failedItems = failedCount;
                    batch.progress = Math.round((executedCount + failedCount) / selectedItems.length * 100);

                    this.saveStoredData();

                    if (stopOnError) {
                        break;
                    }
                }
            }

            // Mark batch as completed
            batch.status = failedCount === 0 ? 'completed' : 'failed';
            batch.completedAt = new Date().toISOString();

        } catch (error) {
            console.error('Bulk execution failed:', error);
            batch.status = 'failed';
            batch.completedAt = new Date().toISOString();
        } finally {
            this.isExecuting = false;
            this.currentBatchId = null;
            this.saveStoredData();
        }

        return batch;
    }

    // Cancel batch execution
    cancelBatch(batchId: string): BulkActionBatch | null {
        const batch = this.batches.find(b => b.id === batchId);
        if (!batch) return null;

        if (batch.status === 'running') {
            batch.status = 'cancelled';
            batch.completedAt = new Date().toISOString();
            this.isExecuting = false;
            this.currentBatchId = null;
            this.saveStoredData();
        }

        return batch;
    }

    // Get all batches
    getBatches(): BulkActionBatch[] {
        return [...this.batches];
    }

    // Get batch by ID
    getBatch(batchId: string): BulkActionBatch | null {
        return this.batches.find(b => b.id === batchId) || null;
    }

    // Delete batch
    deleteBatch(batchId: string): boolean {
        const index = this.batches.findIndex(b => b.id === batchId);
        if (index === -1) return false;

        this.batches.splice(index, 1);
        this.saveStoredData();
        return true;
    }

    // Get all templates
    getTemplates(): BulkActionTemplate[] {
        return [...this.templates];
    }

    // Get templates by category
    getTemplatesByCategory(category: string): BulkActionTemplate[] {
        return this.templates.filter(t => t.category === category);
    }

    // Create custom template
    createTemplate(template: Omit<BulkActionTemplate, 'id'>): BulkActionTemplate {
        const newTemplate: BulkActionTemplate = {
            ...template,
            id: `template_${Date.now()}_${Math.random().toString(36).substring(7)}`
        };

        this.templates.push(newTemplate);
        this.saveStoredData();
        return newTemplate;
    }

    // Delete template
    deleteTemplate(templateId: string): boolean {
        const index = this.templates.findIndex(t => t.id === templateId);
        if (index === -1) return false;

        // Don't allow deletion of default templates
        if (this.templates[index].isDefault) {
            return false;
        }

        this.templates.splice(index, 1);
        this.saveStoredData();
        return true;
    }

    // Get execution status
    isCurrentlyExecuting(): boolean {
        return this.isExecuting;
    }

    getCurrentBatchId(): string | null {
        return this.currentBatchId;
    }

    // Clear all data
    clearAllData() {
        this.batches = [];
        this.templates = this.templates.filter(t => t.isDefault);
        this.isExecuting = false;
        this.currentBatchId = null;
        this.saveStoredData();
    }

    // Get batch statistics
    getBatchStatistics() {
        const totalBatches = this.batches.length;
        const completedBatches = this.batches.filter(b => b.status === 'completed').length;
        const failedBatches = this.batches.filter(b => b.status === 'failed').length;
        const totalActions = this.batches.reduce((sum, batch) => sum + batch.totalItems, 0);
        const executedActions = this.batches.reduce((sum, batch) => sum + batch.executedItems, 0);
        const failedActions = this.batches.reduce((sum, batch) => sum + batch.failedItems, 0);

        return {
            totalBatches,
            completedBatches,
            failedBatches,
            totalActions,
            executedActions,
            failedActions,
            successRate: totalActions > 0 ? Math.round((executedActions / totalActions) * 100) : 0,
            averageBatchSize: totalBatches > 0 ? Math.round(totalActions / totalBatches) : 0
        };
    }
}

// Create singleton instance
export const bulkActionManager = new BulkActionManager();

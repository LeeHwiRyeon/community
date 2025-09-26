import { runtimeMetrics, incMetric } from './metrics-state.js';

function ensureDepthBucket() {
    if (!runtimeMetrics.attachmentsQueueDepth || typeof runtimeMetrics.attachmentsQueueDepth !== 'object') {
        runtimeMetrics.attachmentsQueueDepth = {};
    }
}

export function recordAttachmentJobCompleted(queueName) {
    incMetric('attachmentsJobsCompleted');
    if (queueName) {
        runtimeMetrics.attachmentsLastQueue = queueName;
    }
}

export function recordAttachmentJobFailed(queueName) {
    incMetric('attachmentsJobsFailed');
    if (queueName) {
        runtimeMetrics.attachmentsLastFailedQueue = queueName;
    }
}

export function recordAttachmentJobRetried(queueName) {
    incMetric('attachmentsJobsRetried');
    if (queueName) {
        runtimeMetrics.attachmentsLastRetryQueue = queueName;
    }
}

export function recordAttachmentCleanupRun() {
    incMetric('attachmentsCleanupRuns');
}

export function setAttachmentQueueDepth(queueName, stats) {
    ensureDepthBucket();
    runtimeMetrics.attachmentsQueueDepth[queueName] = stats;
    runtimeMetrics.attachmentsQueueUpdatedAt = Date.now();
}

export function getAttachmentQueueDepth() {
    ensureDepthBucket();
    return runtimeMetrics.attachmentsQueueDepth;
}


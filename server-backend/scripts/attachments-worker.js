#!/usr/bin/env node
import { Worker, QueueScheduler, Queue } from 'bullmq';
import { resolveAttachmentQueueConfig, resolveBullConnection, loadWorkerDefinitions } from '../src/services/attachments/worker-config.js';
import { recordAttachmentJobCompleted, recordAttachmentJobFailed, recordAttachmentJobRetried, recordAttachmentCleanupRun, setAttachmentQueueDepth } from '../src/metrics-attachments.js';
import pino from 'pino';

const logger = pino({ level: process.env.ATTACH_WORKER_LOG_LEVEL || 'info', name: 'attachments-worker' });
const config = resolveAttachmentQueueConfig();

if (!config.enabled) {
    logger.warn('attachments queue disabled via ATTACH_QUEUE_ENABLED=0');
    process.exit(0);
}

const connection = resolveBullConnection();

async function start() {
    const { processJob, cleanupJob } = loadWorkerDefinitions();
    const processors = {
        process: (await import(processJob)).handleProcessJob,
        cleanup: (await import(cleanupJob)).handleCleanupJob
    };

    const processQueueName = `${config.prefix}:process`;
    const cleanupQueueName = `${config.prefix}:cleanup`;

    const processQueue = new Queue(processQueueName, { connection });
    const cleanupQueue = new Queue(cleanupQueueName, { connection });

    new QueueScheduler(processQueueName, { connection });
    new QueueScheduler(cleanupQueueName, { connection });

    const processWorker = new Worker(processQueueName, async job => processors.process(job, { logger, config }), {
        connection,
        concurrency: config.concurrency,
        autorun: true
    });

    const cleanupWorker = new Worker(cleanupQueueName, async job => processors.cleanup(job, { logger, config }), {
        connection,
        concurrency: 1,
        autorun: true
    });

    async function refreshQueueDepth() {
        try {
            const [processCounts, cleanupCounts] = await Promise.all([
                processQueue.getJobCounts('waiting', 'active', 'delayed'),
                cleanupQueue.getJobCounts('waiting', 'active', 'delayed')
            ]);
            setAttachmentQueueDepth(processQueueName, processCounts);
            setAttachmentQueueDepth(cleanupQueueName, cleanupCounts);
        } catch (err) {
            logger.warn({ err }, 'attachments.queueDepth.refresh.failed');
        }
    }

    processWorker.on('completed', () => {
        recordAttachmentJobCompleted(processQueueName);
        refreshQueueDepth();
    });

    processWorker.on('failed', job => {
        recordAttachmentJobFailed(processQueueName);
        if (job?.attemptsMade > 1) {
            recordAttachmentJobRetried(processQueueName);
        }
        refreshQueueDepth();
    });

    cleanupWorker.on('completed', () => {
        recordAttachmentCleanupRun();
        refreshQueueDepth();
    });

    cleanupWorker.on('failed', () => {
        recordAttachmentJobFailed(cleanupQueueName);
        refreshQueueDepth();
    });

    await refreshQueueDepth();

    logger.info('attachments worker started', {
        queues: [processQueueName, cleanupQueueName],
        concurrency: config.concurrency
    });
}

start().catch(error => {
    logger.error({ err: error }, 'failed to start attachments worker');
    process.exitCode = 1;
});


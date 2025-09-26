import { join } from 'node:path';


export function resolveAttachmentQueueConfig() {
    return {
        enabled: (process.env.ATTACH_QUEUE_ENABLED ?? '1') !== '0',
        concurrency: Number.parseInt(process.env.ATTACH_QUEUE_CONCURRENCY || '3', 10),
        prefix: process.env.ATTACH_QUEUE_PREFIX || 'attach',
        cleanupCron: process.env.ATTACH_CLEANUP_CRON || '15m',
        metricsEnabled: (process.env.ATTACH_QUEUE_METRICS ?? '1') !== '0'
    };
}

export function resolveBullConnection() {
    const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    return { url };
}

export function loadWorkerDefinitions() {
    const base = join(process.cwd(), 'server-backend', 'src', 'services', 'attachments');
    return {
        processJob: join(base, 'workers', 'process-job.js'),
        cleanupJob: join(base, 'workers', 'cleanup-job.js')
    };
}


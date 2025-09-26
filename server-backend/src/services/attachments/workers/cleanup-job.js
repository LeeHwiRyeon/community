export async function handleCleanupJob(job, { logger }) {
    logger?.info?.('attachments.cleanup.received', { id: job.id, payload: job.data });
    throw new Error('attachments.cleanup handler not implemented (Step 44)');
}

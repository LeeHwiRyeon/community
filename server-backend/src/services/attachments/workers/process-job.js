export async function handleProcessJob(job, { logger }) {
    logger?.info?.('attachments.process.received', { id: job.id, fileKey: job.data?.fileKey });
    throw new Error('attachments.process handler not implemented (Step 44)');
}

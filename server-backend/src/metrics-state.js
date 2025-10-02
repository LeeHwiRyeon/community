export const runtimeMetrics = {
    startTime: Date.now(),
    keepaliveFail: 0,
    lastKeepaliveOk: null,
    lastKeepaliveError: null,
    viewBufferedAdds: 0,
    viewFlushBatches: 0,
    viewFlushRows: 0,
    viewFlushFailures: 0,
    viewForcedFlushes: 0,
    viewFlushDropped: 0,
    viewBackoffRetries: 0,
    authLoginSuccess: 0,
    authLoginFail: 0,
    authRefresh: 0,
    authLink: 0,
    chatMessagesPosted: 0,
    chatMessagesFetched: 0,
    chatCommunitiesListed: 0,
    chatRoomsListed: 0,
    chatClears: 0,
    chatRedisTrim: 0,
    searchQueryCount: 0,
    searchQueryDurationTotal: 0,
    searchQueryPeakMs: 0,
    searchQuerySlow: 0,
    searchQueryFailures: 0,
    rpgXpEvents: 0,
    rpgXpAwardTotal: 0,
    rpgXpAwardMax: 0,
    rpgLevelUpCount: 0,
    rpgBadgeUnlockCount: 0,
    rpgLastEventAt: null,
    attachmentsJobsCompleted: 0,
    attachmentsJobsFailed: 0,
    attachmentsJobsRetried: 0,
    attachmentsCleanupRuns: 0,
    attachmentsQueueDepth: {},
    attachmentsQueueUpdatedAt: null
};

export function recordKeepaliveSuccess() {
    runtimeMetrics.lastKeepaliveOk = Date.now();
    runtimeMetrics.keepaliveFail = 0;
}

export function recordKeepaliveFailure(err) {
    runtimeMetrics.keepaliveFail += 1;
    runtimeMetrics.lastKeepaliveError = err?.message || String(err);
}

// Generic metric increment helper
export function incMetric(name, delta = 1) {
    runtimeMetrics[name] = (runtimeMetrics[name] || 0) + delta;
}




// Simple ring buffer & aggregation helper for client performance metrics
// Stores objects: { ts, metrics: {LCP,CLS,FID,INP,FCP,TTFB,LAF,LAF_MAX}, path, ua }

export class ClientMetricBuffer {
    constructor(limit = 500, windowMs = 2 * 3600 * 1000) {
        this.limit = limit;
        this.windowMs = windowMs;
        this.entries = [];
    }
    push(entry) {
        this.entries.push(entry);
        if (this.entries.length > this.limit) this.entries.splice(0, this.entries.length - this.limit);
        this.prune();
    }
    prune() {
        const cutoff = Date.now() - this.windowMs;
        if (this.entries.length && this.entries[0].ts < cutoff) {
            this.entries = this.entries.filter(e => e.ts >= cutoff);
        }
    }
    aggregateKey(key) {
        const vals = this.entries.map(e => e.metrics[key]).filter(v => typeof v === 'number');
        if (!vals.length) return null;
        vals.sort((a, b) => a - b);
        const sum = vals.reduce((a, b) => a + b, 0);
        const pct = p => vals[Math.min(vals.length - 1, Math.floor(p * vals.length))];
        return { count: vals.length, p50: pct(0.50), p90: pct(0.90), p99: pct(0.99), avg: sum / vals.length };
    }
    snapshot() {
        return {
            collected: this.entries.length,
            windowMinutes: Math.round(this.windowMs / 60000),
            LCP: this.aggregateKey('LCP'),
            CLS: this.aggregateKey('CLS'),
            FID: this.aggregateKey('FID'),
            INP: this.aggregateKey('INP'),
            FCP: this.aggregateKey('FCP'),
            TTFB: this.aggregateKey('TTFB'),
            LAF: this.aggregateKey('LAF'),
            LAF_MAX: this.aggregateKey('LAF_MAX')
        };
    }
}

export function getClientMetricBuffer(app) {
    if (!app.locals.clientMetricBuffer) {
        app.locals.clientMetricBuffer = new ClientMetricBuffer();
    }
    return app.locals.clientMetricBuffer;
}

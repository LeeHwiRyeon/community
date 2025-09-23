import dotenv from 'dotenv';

dotenv.config();

const BASE = process.env.MOCK_BASE || `http://localhost:${process.env.PORT || 50000}`;

async function main() {
    const count = parseInt(process.env.MOCK_COUNT || '50', 10);
    const board = process.env.MOCK_BOARD || '';
    const opt = {
        count,
        board: board || undefined,
        daysBack: process.env.MOCK_DAYS_BACK,
        viewsMin: process.env.MOCK_VIEWS_MIN,
        viewsMax: process.env.MOCK_VIEWS_MAX,
        thumbsRatio: process.env.MOCK_THUMBS_RATIO,
        titlePrefix: process.env.MOCK_TITLE_PREFIX ? process.env.MOCK_TITLE_PREFIX.split('|') : undefined,
        categoryPool: process.env.MOCK_CATEGORY_POOL ? process.env.MOCK_CATEGORY_POOL.split(',') : undefined,
        authorPool: process.env.MOCK_AUTHOR_POOL ? process.env.MOCK_AUTHOR_POOL.split(',') : undefined,
        contentLengthMin: process.env.MOCK_CONTENT_MIN,
        contentLengthMax: process.env.MOCK_CONTENT_MAX,
        seed: process.env.MOCK_SEED
    };
    const body = Object.fromEntries(Object.entries(opt).filter(([, v]) => v !== undefined && v !== ''));
    const res = await fetch(`${BASE}/api/mock/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        console.error('generate failed', res.status, await res.text());
        process.exit(1);
    }
    const json = await res.json();
    console.log('generated', json.generated);
}

if (process.argv[1] && process.argv[1].endsWith('mock-data.js')) {
    main().catch(e => { console.error(e); process.exit(1); });
}

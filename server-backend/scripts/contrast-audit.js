// Simple contrast & a11y audit using Puppeteer + axe-core
// Fails (exit 1) if any serious contrast violations are found.
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { readFile } from 'fs/promises';

async function run() {
    const pagesToCheck = [
        '../../home.html',
        '../../board.html',
        '../../post.html'
    ];
    const browser = await puppeteer.launch({ headless: 'new' });
    const axeSource = await readFile(new URL('./node_modules/axe-core/axe.min.js', import.meta.url), 'utf8').catch(async () => {
        const axePath = path.resolve(process.cwd(), 'node_modules/axe-core/axe.min.js');
        return fs.readFileSync(axePath, 'utf8');
    });
    const results = [];
    for (const rel of pagesToCheck) {
        const filePath = path.resolve(path.dirname(new URL(import.meta.url).pathname), rel);
        const page = await browser.newPage();
        await page.goto('file://' + filePath, { waitUntil: 'load' });
        await page.addScriptTag({ content: axeSource });
        const axeResult = await page.evaluate(async () => {
            return await axe.run(document, { runOnly: ['wcag2aa', 'wcag21aa'] });
        });
        const contrast = axeResult.violations.filter(v => v.id === 'color-contrast');
        results.push({ page: rel, violations: contrast.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })) });
        await page.close();
    }
    await browser.close();
    const flat = results.flatMap(r => r.violations.map(v => ({ page: r.page, ...v })));
    const severe = flat.filter(v => ['serious', 'critical'].includes(v.impact));
    const summary = { totalPages: results.length, contrastIssues: flat.length, severe: severe.length, details: flat };
    console.log('Contrast audit summary:', JSON.stringify(summary, null, 2));
    fs.writeFileSync(path.resolve(process.cwd(), 'contrast-report.json'), JSON.stringify(summary, null, 2));
    if (severe.length) {
        console.error('Severe contrast issues detected');
        process.exit(1);
    }
}

run().catch(e => { console.error(e); process.exit(1); });

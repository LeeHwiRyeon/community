/**
 * PWA 아이콘 생성 스크립트
 * SVG 파일을 다양한 크기의 PNG로 변환합니다.
 * 
 * 사용법:
 * 1. npm install sharp
 * 2. node scripts/generate-pwa-icons.js
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputSvg = path.join(__dirname, '../public/images/icon.svg');
const outputDir = path.join(__dirname, '../public/images');

// 생성할 아이콘 크기 정의
const iconSizes = [
    { name: 'icon-192.png', size: 192, purpose: 'any' },
    { name: 'icon-512.png', size: 512, purpose: 'any' },
    { name: 'icon-maskable.png', size: 512, purpose: 'maskable' },
    { name: 'apple-touch-icon.png', size: 180, purpose: 'apple' },
    { name: 'favicon-32x32.png', size: 32, purpose: 'favicon' },
    { name: 'favicon-16x16.png', size: 16, purpose: 'favicon' }
];

// SVG 파일 읽기
const svgBuffer = fs.readFileSync(inputSvg);

// 각 크기별로 PNG 생성
async function generateIcons() {
    console.log('🎨 PWA 아이콘 생성 시작...\n');

    for (const icon of iconSizes) {
        try {
            const outputPath = path.join(outputDir, icon.name);

            // Maskable 아이콘은 패딩 추가
            if (icon.purpose === 'maskable') {
                await sharp(svgBuffer)
                    .resize(icon.size, icon.size, {
                        fit: 'contain',
                        background: { r: 33, g: 150, b: 243, alpha: 1 } // #2196F3
                    })
                    .png()
                    .toFile(outputPath);
            } else {
                await sharp(svgBuffer)
                    .resize(icon.size, icon.size)
                    .png()
                    .toFile(outputPath);
            }

            console.log(`✅ ${icon.name} (${icon.size}x${icon.size}) 생성 완료`);
        } catch (error) {
            console.error(`❌ ${icon.name} 생성 실패:`, error.message);
        }
    }

    // favicon.ico 생성 (선택사항)
    try {
        await sharp(svgBuffer)
            .resize(32, 32)
            .toFile(path.join(__dirname, '../public/favicon.ico'));
        console.log(`✅ favicon.ico 생성 완료`);
    } catch (error) {
        console.error(`❌ favicon.ico 생성 실패:`, error.message);
    }

    console.log('\n🎉 모든 아이콘 생성 완료!');
    console.log(`\n📁 생성된 파일 위치: ${outputDir}`);
}

// 스크립트 실행
generateIcons().catch(error => {
    console.error('❌ 아이콘 생성 중 오류 발생:', error);
    process.exit(1);
});

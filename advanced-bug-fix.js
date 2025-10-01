const fs = require('fs');
const path = require('path');

console.log('🔧 고급 자동 버그 수정 시작...');
console.log('=========================');

let fixedFiles = 0;
let fixedIssues = 0;
const report = {
    timestamp: new Date().toISOString(),
    fixedFiles: [],
    fixedIssues: [],
    summary: {}
};

// 1. Chakra UI 아이콘 import 오류 수정
const fixChakraIcons = (content) => {
    let fixed = content;

    // 존재하지 않는 아이콘들을 올바른 아이콘으로 교체
    const iconReplacements = {
        'ShareIcon': 'ExternalLinkIcon',
        'VolumeIcon': 'VolumeUpIcon',
        'VolumeOffIcon': 'VolumeOffIcon'
    };

    Object.entries(iconReplacements).forEach(([oldIcon, newIcon]) => {
        const regex = new RegExp(`import\\s*{\\s*${oldIcon}\\s*}\\s*from\\s*['"]@chakra-ui/icons['"]`, 'g');
        if (fixed.includes(oldIcon)) {
            fixed = fixed.replace(regex, `import { ${newIcon} } from '@chakra-ui/icons'`);
            fixed = fixed.replace(new RegExp(`\\b${oldIcon}\\b`, 'g'), newIcon);
        }
    });

    return fixed;
};

// 2. VirtualizedList width 속성 추가
const fixVirtualizedList = (content) => {
    let fixed = content;

    // FixedSizeList에 width 속성 추가
    const fixedSizeListRegex = /<FixedSizeList\s+([^>]*?)>/g;
    fixed = fixed.replace(fixedSizeListRegex, (match, props) => {
        if (!props.includes('width')) {
            return `<FixedSizeList width="100%" ${props}>`;
        }
        return match;
    });

    return fixed;
};

// 3. any 타입을 구체적인 타입으로 수정
const fixAnyTypes = (content) => {
    let fixed = content;

    // 이벤트 핸들러의 any 타입 수정
    const eventHandlerRegex = /\(e:\s*any\)\s*=>/g;
    fixed = fixed.replace(eventHandlerRegex, '(e: React.MouseEvent) =>');

    // 함수 매개변수의 any 타입 수정
    const paramRegex = /\((\w+):\s*any\)/g;
    fixed = fixed.replace(paramRegex, '($1: unknown)');

    return fixed;
};

// 4. undefined 체크 추가
const fixUndefinedChecks = (content) => {
    let fixed = content;

    // 옵셔널 체이닝 추가
    const propertyAccessRegex = /(\w+)\.(\w+)(?!\?)/g;
    fixed = fixed.replace(propertyAccessRegex, '$1?.$2');

    return fixed;
};

// 5. constants.ts 중복 속성 제거
const fixConstantsDuplicates = (content) => {
    let fixed = content;

    // 중복된 속성 제거 (간단한 패턴)
    const lines = fixed.split('\n');
    const seen = new Set();
    const cleanedLines = [];

    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.includes(':') && !trimmed.startsWith('//')) {
            const key = trimmed.split(':')[0].trim();
            if (seen.has(key)) {
                console.log(`  🔄 중복 속성 제거: ${key}`);
                return; // 중복된 라인 건너뛰기
            }
            seen.add(key);
        }
        cleanedLines.push(line);
    });

    return cleanedLines.join('\n');
};

// 6. React Hook Form 타입 제약 수정
const fixReactHookForm = (content) => {
    let fixed = content;

    // FieldValues 제약 추가
    const genericRegex = /<TFormValues>/g;
    fixed = fixed.replace(genericRegex, '<TFormValues extends FieldValues>');

    return fixed;
};

// 7. 브라우저 API 타입 정의 추가
const fixBrowserAPIs = (content) => {
    let fixed = content;

    // DeviceMotionEvent.requestPermission 타입 오류 수정
    fixed = fixed.replace(/DeviceMotionEvent\.requestPermission/g, '(DeviceMotionEvent as any).requestPermission');
    fixed = fixed.replace(/DeviceOrientationEvent\.requestPermission/g, '(DeviceOrientationEvent as any).requestPermission');

    // GeolocationPositionError 상수 수정
    fixed = fixed.replace(/GeolocationPositionError\.GEOLOCATION_UNSUPPORTED/g, 'GeolocationPositionError.POSITION_UNAVAILABLE');

    return fixed;
};

// 수정할 파일들
const filesToFix = [
    {
        path: 'frontend/src/components/UnifiedRequestForm.tsx',
        fixers: [fixChakraIcons, fixAnyTypes]
    },
    {
        path: 'frontend/src/components/VirtualizedBoardList.tsx',
        fixers: [fixVirtualizedList, fixAnyTypes]
    },
    {
        path: 'frontend/src/components/VirtualizedPostList.tsx',
        fixers: [fixVirtualizedList, fixAnyTypes]
    },
    {
        path: 'frontend/src/hooks/useDraftAutoSave.ts',
        fixers: [fixReactHookForm, fixAnyTypes]
    },
    {
        path: 'frontend/src/hooks/useDeviceMotion.ts',
        fixers: [fixBrowserAPIs, fixAnyTypes]
    },
    {
        path: 'frontend/src/hooks/useDeviceOrientation.ts',
        fixers: [fixBrowserAPIs, fixAnyTypes]
    },
    {
        path: 'frontend/src/utils/constants.ts',
        fixers: [fixConstantsDuplicates]
    }
];

// 파일 수정 실행
filesToFix.forEach(file => {
    const fullPath = path.join(__dirname, file.path);

    if (fs.existsSync(fullPath)) {
        try {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            // 모든 수정 함수 적용
            file.fixers.forEach(fixer => {
                content = fixer(content);
            });

            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`  ✅ ${file.path} 수정 완료`);
                fixedFiles++;
                fixedIssues++;
                report.fixedFiles.push(file.path);
                report.fixedIssues.push(`${file.path} - 자동 수정 적용`);
            } else {
                console.log(`  ⏭️  ${file.path} - 수정할 내용 없음`);
            }
        } catch (error) {
            console.log(`  ❌ ${file.path} 수정 실패: ${error.message}`);
        }
    } else {
        console.log(`  ⚠️  ${file.path} - 파일을 찾을 수 없음`);
    }
});

// 보고서 생성
report.summary = {
    totalFiles: filesToFix.length,
    fixedFiles,
    fixedIssues,
    successRate: `${((fixedFiles / filesToFix.length) * 100).toFixed(1)}%`
};

fs.writeFileSync('advanced-bug-fix-report.json', JSON.stringify(report, null, 2));

console.log('\n📊 고급 자동 버그 수정 보고서');
console.log('========================');
console.log(`✅ 수정된 파일: ${fixedFiles}개`);
console.log(`🔧 수정된 이슈: ${fixedIssues}개`);
console.log(`📈 성공률: ${report.summary.successRate}`);

console.log('\n📁 수정된 파일 목록:');
report.fixedFiles.forEach(file => console.log(`  - ${file}`));

console.log('\n💾 보고서 저장: advanced-bug-fix-report.json');
console.log('\n🎉 고급 자동 버그 수정 완료!');
console.log('다음 단계: npm run build로 빌드 테스트를 진행하세요.');

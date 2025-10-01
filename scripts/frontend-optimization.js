#!/usr/bin/env node

/**
 * 🚀 프론트엔드 성능 최적화 스크립트
 * 
 * 이 스크립트는 다음 작업을 수행합니다:
 * 1. 번들 크기 분석 및 최적화
 * 2. 이미지 최적화
 * 3. 코드 스플리팅 분석
 * 4. 메모리 사용량 최적화
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { performance } = require('perf_hooks');

// 색상 정의
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
    console.log(`${colors[color]}${message}${colors.reset}`);
};

// 프론트엔드 디렉토리 경로
const frontendDir = path.join(__dirname, '../frontend');
const srcDir = path.join(frontendDir, 'src');
const buildDir = path.join(frontendDir, 'dist');
const publicDir = path.join(frontendDir, 'public');

class FrontendOptimizer {
    constructor() {
        this.results = {
            bundleAnalysis: {},
            imageOptimization: {},
            codeSplitting: {},
            memoryUsage: {},
            recommendations: []
        };
    }

    // 번들 크기 분석
    analyzeBundleSize() {
        log('\n📦 번들 크기 분석 중...', 'cyan');

        const analysis = {
            totalFiles: 0,
            totalSize: 0,
            fileTypes: {},
            largestFiles: [],
            duplicateDependencies: [],
            unusedDependencies: []
        };

        if (!fs.existsSync(buildDir)) {
            log('⚠️  빌드 디렉토리가 없습니다. 먼저 빌드를 실행하세요.', 'yellow');
            return analysis;
        }

        // 빌드 파일 분석
        this.analyzeDirectory(buildDir, analysis);

        // package.json 의존성 분석
        this.analyzeDependencies(frontendDir, analysis);

        log(`  📁 총 파일 수: ${analysis.totalFiles}개`, 'blue');
        log(`  💾 총 크기: ${(analysis.totalSize / 1024 / 1024).toFixed(2)}MB`, 'blue');

        // 파일 타입별 분포
        log('  📊 파일 타입별 분포:', 'blue');
        Object.entries(analysis.fileTypes).forEach(([type, count]) => {
            log(`    ${type}: ${count}개`, 'blue');
        });

        // 가장 큰 파일들
        if (analysis.largestFiles.length > 0) {
            log('  📄 가장 큰 파일들:', 'blue');
            analysis.largestFiles.slice(0, 5).forEach((file, index) => {
                log(`    ${index + 1}. ${file.name} (${(file.size / 1024).toFixed(1)}KB)`, 'blue');
            });
        }

        this.results.bundleAnalysis = analysis;
        return analysis;
    }

    analyzeDirectory(dir, analysis) {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);

            if (stats.isDirectory()) {
                this.analyzeDirectory(filePath, analysis);
            } else {
                analysis.totalFiles++;
                analysis.totalSize += stats.size;

                const ext = path.extname(file);
                analysis.fileTypes[ext] = (analysis.fileTypes[ext] || 0) + 1;

                analysis.largestFiles.push({
                    name: path.relative(buildDir, filePath),
                    size: stats.size
                });
            }
        }

        // 크기순으로 정렬
        analysis.largestFiles.sort((a, b) => b.size - a.size);
    }

    analyzeDependencies(projectDir, analysis) {
        const packageJsonPath = path.join(projectDir, 'package.json');

        if (!fs.existsSync(packageJsonPath)) {
            return;
        }

        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const dependencies = Object.keys(packageJson.dependencies || {});
        const devDependencies = Object.keys(packageJson.devDependencies || {});

        analysis.dependencies = {
            production: dependencies.length,
            development: devDependencies.length,
            total: dependencies.length + devDependencies.length
        };

        log(`  📦 의존성: 프로덕션 ${dependencies.length}개, 개발 ${devDependencies.length}개`, 'blue');
    }

    // 이미지 최적화 분석
    analyzeImages() {
        log('\n🖼️  이미지 최적화 분석 중...', 'cyan');

        const analysis = {
            totalImages: 0,
            totalSize: 0,
            imageTypes: {},
            unoptimizedImages: [],
            recommendations: []
        };

        // src 디렉토리에서 이미지 파일 찾기
        this.findImages(srcDir, analysis);

        // public 디렉토리에서 이미지 파일 찾기
        if (fs.existsSync(publicDir)) {
            this.findImages(publicDir, analysis);
        }

        log(`  🖼️  총 이미지 수: ${analysis.totalImages}개`, 'blue');
        log(`  💾 총 크기: ${(analysis.totalSize / 1024 / 1024).toFixed(2)}MB`, 'blue');

        // 이미지 타입별 분포
        log('  📊 이미지 타입별 분포:', 'blue');
        Object.entries(analysis.imageTypes).forEach(([type, count]) => {
            log(`    ${type}: ${count}개`, 'blue');
        });

        // 최적화 권장사항
        if (analysis.totalSize > 5 * 1024 * 1024) { // 5MB 이상
            analysis.recommendations.push('이미지 크기가 5MB를 초과합니다. WebP 변환을 권장합니다.');
        }

        if (analysis.imageTypes['.png'] > analysis.imageTypes['.jpg']) {
            analysis.recommendations.push('PNG 파일이 많습니다. JPG로 변환을 고려하세요.');
        }

        if (analysis.unoptimizedImages.length > 0) {
            analysis.recommendations.push(`${analysis.unoptimizedImages.length}개의 이미지가 최적화되지 않았습니다.`);
        }

        this.results.imageOptimization = analysis;
        return analysis;
    }

    findImages(dir, analysis) {
        if (!fs.existsSync(dir)) return;

        const files = fs.readdirSync(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);

            if (stats.isDirectory()) {
                this.findImages(filePath, analysis);
            } else {
                const ext = path.extname(file).toLowerCase();
                if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
                    analysis.totalImages++;
                    analysis.totalSize += stats.size;

                    analysis.imageTypes[ext] = (analysis.imageTypes[ext] || 0) + 1;

                    // 최적화되지 않은 이미지 체크
                    if (stats.size > 500 * 1024) { // 500KB 이상
                        analysis.unoptimizedImages.push({
                            path: path.relative(frontendDir, filePath),
                            size: stats.size
                        });
                    }
                }
            }
        }
    }

    // 코드 스플리팅 분석
    analyzeCodeSplitting() {
        log('\n🔀 코드 스플리팅 분석 중...', 'cyan');

        const analysis = {
            hasCodeSplitting: false,
            chunkFiles: [],
            lazyLoadedComponents: [],
            recommendations: []
        };

        // React.lazy 사용 여부 확인
        const lazyComponents = this.findLazyComponents(srcDir);
        analysis.lazyLoadedComponents = lazyComponents;

        if (lazyComponents.length > 0) {
            analysis.hasCodeSplitting = true;
            log(`  ✅ 지연 로딩 컴포넌트: ${lazyComponents.length}개`, 'green');
        } else {
            log('  ⚠️  지연 로딩이 구현되지 않았습니다.', 'yellow');
            analysis.recommendations.push('React.lazy()를 사용한 코드 스플리팅을 구현하세요.');
        }

        // 빌드된 청크 파일 확인
        if (fs.existsSync(buildDir)) {
            const chunkFiles = this.findChunkFiles(buildDir);
            analysis.chunkFiles = chunkFiles;

            if (chunkFiles.length > 1) {
                log(`  📦 청크 파일: ${chunkFiles.length}개`, 'blue');
                chunkFiles.forEach(chunk => {
                    log(`    - ${chunk.name} (${(chunk.size / 1024).toFixed(1)}KB)`, 'blue');
                });
            }
        }

        this.results.codeSplitting = analysis;
        return analysis;
    }

    findLazyComponents(dir) {
        const lazyComponents = [];

        if (!fs.existsSync(dir)) return lazyComponents;

        const files = fs.readdirSync(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);

            if (stats.isDirectory()) {
                lazyComponents.push(...this.findLazyComponents(filePath));
            } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
                const content = fs.readFileSync(filePath, 'utf8');

                // React.lazy 사용 여부 확인
                if (content.includes('React.lazy') || content.includes('lazy(')) {
                    lazyComponents.push({
                        file: path.relative(frontendDir, filePath),
                        hasLazy: true
                    });
                }
            }
        }

        return lazyComponents;
    }

    findChunkFiles(dir) {
        const chunkFiles = [];

        if (!fs.existsSync(dir)) return chunkFiles;

        const files = fs.readdirSync(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);

            if (stats.isDirectory()) {
                chunkFiles.push(...this.findChunkFiles(filePath));
            } else if (file.includes('chunk') || file.endsWith('.js')) {
                chunkFiles.push({
                    name: path.relative(buildDir, filePath),
                    size: stats.size
                });
            }
        }

        return chunkFiles.sort((a, b) => b.size - a.size);
    }

    // 메모리 사용량 분석
    analyzeMemoryUsage() {
        log('\n💾 메모리 사용량 분석 중...', 'cyan');

        const memUsage = process.memoryUsage();
        const analysis = {
            rss: Math.round(memUsage.rss / 1024 / 1024), // MB
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
            external: Math.round(memUsage.external / 1024 / 1024), // MB
            recommendations: []
        };

        log(`  RSS: ${analysis.rss}MB`, 'blue');
        log(`  Heap Total: ${analysis.heapTotal}MB`, 'blue');
        log(`  Heap Used: ${analysis.heapUsed}MB`, 'blue');
        log(`  External: ${analysis.external}MB`, 'blue');

        // 메모리 사용량 권장사항
        if (analysis.heapUsed > 100) {
            analysis.recommendations.push('힙 메모리 사용량이 높습니다. 메모리 누수 검사를 권장합니다.');
        }

        if (analysis.external > 50) {
            analysis.recommendations.push('외부 메모리 사용량이 높습니다. C++ 바인딩 사용을 검토하세요.');
        }

        this.results.memoryUsage = analysis;
        return analysis;
    }

    // 최적화 권장사항 생성
    generateRecommendations() {
        const recommendations = [];

        // 번들 크기 권장사항
        if (this.results.bundleAnalysis.totalSize > 10 * 1024 * 1024) { // 10MB 이상
            recommendations.push('번들 크기가 10MB를 초과합니다. 코드 스플리팅을 구현하세요.');
        }

        // 이미지 최적화 권장사항
        if (this.results.imageOptimization.totalSize > 5 * 1024 * 1024) { // 5MB 이상
            recommendations.push('이미지 크기가 5MB를 초과합니다. WebP 변환 및 압축을 권장합니다.');
        }

        // 코드 스플리팅 권장사항
        if (!this.results.codeSplitting.hasCodeSplitting) {
            recommendations.push('코드 스플리팅이 구현되지 않았습니다. React.lazy()를 사용하세요.');
        }

        // 메모리 사용량 권장사항
        if (this.results.memoryUsage.heapUsed > 100) {
            recommendations.push('메모리 사용량이 높습니다. 컴포넌트 최적화를 권장합니다.');
        }

        // 일반적인 권장사항
        recommendations.push('정기적인 번들 분석을 위해 webpack-bundle-analyzer를 사용하세요.');
        recommendations.push('이미지 최적화를 위해 next/image 또는 react-image를 사용하세요.');
        recommendations.push('불필요한 의존성을 제거하여 번들 크기를 줄이세요.');

        this.results.recommendations = recommendations;
        return recommendations;
    }

    // 최적화 스크립트 생성
    generateOptimizationScripts() {
        log('\n🛠️  최적화 스크립트 생성 중...', 'cyan');

        const scripts = {
            webpack: this.generateWebpackConfig(),
            packageJson: this.generatePackageJsonScripts(),
            imageOptimization: this.generateImageOptimizationScript()
        };

        // webpack.config.js 생성
        const webpackConfigPath = path.join(frontendDir, 'webpack.config.optimized.js');
        fs.writeFileSync(webpackConfigPath, scripts.webpack);
        log(`  ✅ Webpack 설정 생성: ${webpackConfigPath}`, 'green');

        // 이미지 최적화 스크립트 생성
        const imageScriptPath = path.join(frontendDir, 'scripts', 'optimize-images.js');
        if (!fs.existsSync(path.dirname(imageScriptPath))) {
            fs.mkdirSync(path.dirname(imageScriptPath), { recursive: true });
        }
        fs.writeFileSync(imageScriptPath, scripts.imageOptimization);
        log(`  ✅ 이미지 최적화 스크립트 생성: ${imageScriptPath}`, 'green');

        return scripts;
    }

    generateWebpackConfig() {
        return `const path = require('path');
const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  mode: 'production',
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].chunk.js',
    clean: true,
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\\\/]node_modules[\\\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          enforce: true,
        },
      },
    },
    usedExports: true,
    sideEffects: false,
  },
  plugins: [
    new webpack.optimize.ModuleConcatenationPlugin(),
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
    }),
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
  },
  module: {
    rules: [
      {
        test: /\\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\\.(js|jsx)$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\\.(png|jpg|jpeg|gif|svg)$/,
        type: 'asset/resource',
        generator: {
          filename: 'images/[name].[contenthash][ext]',
        },
      },
    ],
  },
};`;
    }

    generateImageOptimizationScript() {
        return `const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function optimizeImages() {
  const imageDir = path.join(__dirname, '../src/assets/images');
  const outputDir = path.join(__dirname, '../src/assets/images/optimized');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const files = fs.readdirSync(imageDir);
  
  for (const file of files) {
    if (/\\.(jpg|jpeg|png)$/i.test(file)) {
      const inputPath = path.join(imageDir, file);
      const outputPath = path.join(outputDir, file.replace(/\\.(jpg|jpeg|png)$/i, '.webp'));
      
      try {
        await sharp(inputPath)
          .webp({ quality: 80 })
          .toFile(outputPath);
        
        console.log(\`Optimized: \${file}\`);
      } catch (error) {
        console.error(\`Error optimizing \${file}:\`, error);
      }
    }
  }
}

optimizeImages();`;
    }

    generatePackageJsonScripts() {
        return {
            "build:analyze": "webpack --config webpack.config.optimized.js",
            "optimize:images": "node scripts/optimize-images.js",
            "bundle:analyze": "npx webpack-bundle-analyzer dist/static/js/*.js"
        };
    }

    // 보고서 생성
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            bundleAnalysis: this.results.bundleAnalysis,
            imageOptimization: this.results.imageOptimization,
            codeSplitting: this.results.codeSplitting,
            memoryUsage: this.results.memoryUsage,
            recommendations: this.results.recommendations
        };

        const reportsDir = path.join(__dirname, '../reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        const reportPath = path.join(reportsDir, `frontend-optimization-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        log(`\n📄 최적화 보고서 저장: ${reportPath}`, 'green');
        return reportPath;
    }
}

async function main() {
    log('🚀 프론트엔드 성능 최적화 스크립트 시작', 'bright');
    log('=' * 50, 'cyan');

    const optimizer = new FrontendOptimizer();

    try {
        // 번들 크기 분석
        optimizer.analyzeBundleSize();

        // 이미지 최적화 분석
        optimizer.analyzeImages();

        // 코드 스플리팅 분석
        optimizer.analyzeCodeSplitting();

        // 메모리 사용량 분석
        optimizer.analyzeMemoryUsage();

        // 권장사항 생성
        optimizer.generateRecommendations();

        // 최적화 스크립트 생성
        optimizer.generateOptimizationScripts();

        // 보고서 생성
        optimizer.generateReport();

        // 결과 출력
        log('\n📊 최적화 분석 결과', 'cyan');
        log('=' * 30, 'cyan');

        if (optimizer.results.recommendations.length > 0) {
            log('\n💡 권장사항:', 'yellow');
            optimizer.results.recommendations.forEach((rec, index) => {
                log(`  ${index + 1}. ${rec}`, 'yellow');
            });
        } else {
            log('\n✅ 모든 최적화 기준을 만족합니다!', 'green');
        }

        log('\n🎉 프론트엔드 최적화 분석 완료!', 'green');

    } catch (error) {
        log(`\n❌ 최적화 분석 실패: ${error.message}`, 'red');
        process.exit(1);
    }
}

// 스크립트 실행
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    FrontendOptimizer
};

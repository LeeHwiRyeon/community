#!/usr/bin/env node

/**
 * Security Strict Test
 * Basic security validation tests
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🛡️  Running Security Tests...\n');

const securityFiles = [
    'middleware/security.js',
    'src/auth/jwt.js',
    '.env.security.example'
];

console.log('📁 Checking security files...');
let allFilesExist = true;

securityFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
        console.log(`  ✅ ${file} exists`);
    } else {
        console.log(`  ❌ ${file} missing`);
        allFilesExist = false;
    }
});

// Test 2: Check package.json for security scripts
console.log('\n📦 Checking security scripts...');
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const scripts = packageJson.scripts || {};

    const securityScripts = [
        'test:security',
        'test:security:comprehensive',
        'audit:security'
    ];

    securityScripts.forEach(script => {
        if (scripts[script]) {
            console.log(`  ✅ ${script} script exists`);
        } else {
            console.log(`  ❌ ${script} script missing`);
            allFilesExist = false;
        }
    });
} else {
    console.log('  ❌ package.json not found');
    allFilesExist = false;
}

// Test 3: Check for security dependencies
console.log('\n🔒 Checking security dependencies...');
const securityDeps = [
    'helmet',
    'express-rate-limit',
    'bcryptjs',
    'jsonwebtoken',
    'express-validator'
];

if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    securityDeps.forEach(dep => {
        if (deps[dep]) {
            console.log(`  ✅ ${dep} is installed`);
        } else {
            console.log(`  ❌ ${dep} is missing`);
            allFilesExist = false;
        }
    });
}

// Test 4: Check environment variables
console.log('\n🌍 Checking environment configuration...');
const envExamplePath = path.join(__dirname, '..', '.env.security.example');
if (fs.existsSync(envExamplePath)) {
    console.log('  ✅ Security environment example exists');
    console.log('  📝 Remember to copy .env.security.example to .env and configure values');
} else {
    console.log('  ❌ Security environment example missing');
    allFilesExist = false;
}

// Test 5: Check for security documentation
console.log('\n📚 Checking security documentation...');
const securityDocPath = path.join(__dirname, '..', '..', 'SECURITY.md');
if (fs.existsSync(securityDocPath)) {
    console.log('  ✅ SECURITY.md documentation exists');
} else {
    console.log('  ❌ SECURITY.md documentation missing');
    allFilesExist = false;
}

// Summary
console.log('\n📊 Security Test Summary:');
if (allFilesExist) {
    console.log('  🎉 All security components are properly configured!');
    console.log('\n🔧 Next steps:');
    console.log('  1. Copy .env.security.example to .env');
    console.log('  2. Set strong JWT_SECRET and other security values');
    console.log('  3. Enable HTTPS in production');
    console.log('  4. Run regular security audits');
    console.log('  5. Monitor security logs');
} else {
    console.log('  ⚠️  Some security components are missing or misconfigured');
    console.log('  Please review the failed checks above');
}

console.log('\n🛡️  Security test completed!');

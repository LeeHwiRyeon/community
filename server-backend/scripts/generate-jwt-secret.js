#!/usr/bin/env node

/**
 * JWT Secret Generator
 * 
 * Generates a cryptographically secure JWT secret key
 * with sufficient entropy for production use.
 * 
 * Usage:
 *   node scripts/generate-jwt-secret.js
 * 
 * Output:
 *   - Base64-encoded secret (64 bytes)
 *   - Entropy calculation
 *   - .env file format
 */

import crypto from 'crypto';

/**
 * Calculate Shannon entropy of a string
 * @param {string} str - Input string
 * @returns {number} - Entropy in bits
 */
function calculateEntropy(str) {
    const freq = {};

    // Count character frequencies
    for (let char of str) {
        freq[char] = (freq[char] || 0) + 1;
    }

    let entropy = 0;
    const len = str.length;

    // Calculate Shannon entropy
    for (let char in freq) {
        const p = freq[char] / len;
        entropy -= p * Math.log2(p);
    }

    // Total entropy in bits
    return entropy * len;
}

/**
 * Generate JWT Secret
 */
function generateJWTSecret() {
    console.log('🔐 Generating JWT Secret...\n');

    // Generate 64 random bytes (512 bits)
    const secret = crypto.randomBytes(64).toString('base64');

    console.log('✅ Generated JWT Secret (64 bytes, base64-encoded):');
    console.log('━'.repeat(80));
    console.log(secret);
    console.log('━'.repeat(80));

    // Calculate entropy
    const entropy = calculateEntropy(secret);
    console.log(`\n📊 Secret Statistics:`);
    console.log(`   Length: ${secret.length} characters`);
    console.log(`   Entropy: ${entropy.toFixed(2)} bits`);
    console.log(`   Recommended minimum: 256 bits`);

    if (entropy < 256) {
        console.warn('\n⚠️  Warning: Secret entropy is below recommended 256 bits');
        console.warn('   This should not happen with crypto.randomBytes()');
    } else {
        console.log('\n✅ Secret meets security requirements (>= 256 bits)');
    }

    // Show .env format
    console.log('\n📝 Add this to your .env file:');
    console.log('━'.repeat(80));
    console.log(`JWT_SECRET=${secret}`);
    console.log('━'.repeat(80));

    // Additional configuration
    console.log('\n💡 Additional JWT Configuration (optional):');
    console.log('JWT_ACCESS_TTL_SEC=900          # 15 minutes');
    console.log('JWT_REFRESH_TTL_SEC=1209600     # 14 days');
    console.log('JWT_ISSUER=community-platform');
    console.log('JWT_AUDIENCE=community-platform-users');

    // Security recommendations
    console.log('\n🔒 Security Recommendations:');
    console.log('   1. Never commit the .env file to version control');
    console.log('   2. Use different secrets for development and production');
    console.log('   3. Rotate secrets periodically (every 90 days)');
    console.log('   4. Store production secrets in a secure vault (e.g., AWS Secrets Manager)');
    console.log('   5. Ensure .env file has restricted permissions (chmod 600)');

    // Alternative generation methods
    console.log('\n🛠️  Alternative Generation Methods:');
    console.log('   OpenSSL: openssl rand -base64 64');
    console.log('   Node.js REPL: require("crypto").randomBytes(64).toString("base64")');
    console.log('   Online (use with caution): https://generate-secret.vercel.app/64');
}

// Run generator
generateJWTSecret();

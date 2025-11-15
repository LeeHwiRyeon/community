/**
 * Startup Security Checks
 * 
 * Validates security configuration before starting the server.
 * Ensures all required environment variables are set and meet security requirements.
 */

/**
 * Validate Security Configuration
 * 
 * Performs comprehensive validation of security-related environment variables.
 * Exits the process if critical security requirements are not met.
 */
export function validateSecurityConfig() {
    console.log('\n🔒 Running Security Configuration Checks...\n');

    const checks = [
        {
            name: 'JWT_SECRET',
            value: process.env.JWT_SECRET,
            minLength: 32,
            required: true,
            description: 'JWT signing secret'
        },
        {
            name: 'DB_PASS',
            value: process.env.DB_PASS,
            minLength: 8,
            required: true,
            description: 'Database password'
        },
        {
            name: 'REDIS_PASSWORD',
            value: process.env.REDIS_PASSWORD,
            minLength: 8,
            required: false,
            description: 'Redis password (optional)'
        }
    ];

    let hasErrors = false;
    let hasWarnings = false;

    // Check each security configuration
    checks.forEach(check => {
        const status = validateConfig(check);

        if (status === 'error') {
            hasErrors = true;
        } else if (status === 'warning') {
            hasWarnings = true;
        }
    });

    // Check Node environment
    const nodeEnv = process.env.NODE_ENV || 'development';
    console.log(`📌 NODE_ENV: ${nodeEnv}`);

    if (nodeEnv === 'production') {
        console.log('   ✅ Running in production mode');

        // Additional production checks
        if (!process.env.FORCE_HTTPS) {
            console.warn('   ⚠️  FORCE_HTTPS not set (recommended for production)');
            hasWarnings = true;
        }
    } else {
        console.log('   ℹ️  Running in development mode');
    }

    console.log('');

    // Summary
    if (hasErrors) {
        console.error('🔴 Security configuration errors detected. Server cannot start.\n');
        console.error('Please fix the errors above and try again.');
        console.error('Run: node scripts/generate-jwt-secret.js to generate a secure JWT secret.\n');
        process.exit(1);
    }

    if (hasWarnings) {
        console.warn('🟡 Security configuration warnings detected.');
        console.warn('Review the warnings above to improve security.\n');
    }

    console.log('✅ Security configuration validated successfully\n');
}

/**
 * Validate Individual Configuration
 * 
 * @param {Object} check - Configuration check object
 * @returns {string} - 'ok', 'warning', or 'error'
 */
function validateConfig(check) {
    const { name, value, minLength, required, description } = check;

    // Check if required but not set
    if (required && !value) {
        console.error(`❌ ${name} is required but not set`);
        console.error(`   Description: ${description}`);
        return 'error';
    }

    // Check if set but too short
    if (value && minLength && value.length < minLength) {
        console.error(`❌ ${name} must be at least ${minLength} characters`);
        console.error(`   Current length: ${value.length} characters`);
        console.error(`   Description: ${description}`);
        return 'error';
    }

    // Check if optional and not set
    if (!required && !value) {
        console.warn(`⚠️  ${name} is not set (optional)`);
        console.warn(`   Description: ${description}`);
        return 'warning';
    }

    // All good
    if (value) {
        console.log(`✅ ${name} is set (${value.length} characters)`);
    }

    return 'ok';
}

/**
 * Validate Database Configuration
 */
export function validateDatabaseConfig() {
    console.log('🗄️  Validating Database Configuration...\n');

    const requiredVars = [
        'DB_HOST',
        'DB_PORT',
        'DB_NAME',
        'DB_USER',
        'DB_PASS'
    ];

    let hasErrors = false;

    requiredVars.forEach(varName => {
        if (!process.env[varName]) {
            console.error(`❌ ${varName} is not set`);
            hasErrors = true;
        } else {
            console.log(`✅ ${varName} is set`);
        }
    });

    console.log('');

    if (hasErrors) {
        console.error('🔴 Database configuration errors detected.\n');
        return false;
    }

    console.log('✅ Database configuration validated\n');
    return true;
}

/**
 * Run All Startup Checks
 */
export function runStartupChecks() {
    console.log('═'.repeat(80));
    console.log('🚀 Community Platform - Startup Checks');
    console.log('═'.repeat(80));

    // Validate security configuration (will exit if errors)
    validateSecurityConfig();

    // Validate database configuration
    validateDatabaseConfig();

    console.log('═'.repeat(80));
    console.log('✅ All startup checks passed. Server is ready to start.');
    console.log('═'.repeat(80));
    console.log('');
}

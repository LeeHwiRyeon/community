/**
 * Validation utilities for form inputs and data
 */

export interface ValidationRule {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    email?: boolean;
    url?: boolean;
    custom?: (value: any) => string | null;
}

export interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
}

export class Validator {
    private rules: Record<string, ValidationRule> = {};

    /**
     * Add validation rule for a field
     */
    addRule(field: string, rule: ValidationRule): this {
        this.rules[field] = { ...this.rules[field], ...rule };
        return this;
    }

    /**
     * Validate a single field
     */
    validateField(field: string, value: any): string | null {
        const rule = this.rules[field];
        if (!rule) return null;

        // Required validation
        if (rule.required && (value === null || value === undefined || value === '')) {
            return `${field} is required`;
        }

        // Skip other validations if value is empty and not required
        if (!rule.required && (value === null || value === undefined || value === '')) {
            return null;
        }

        // String length validation
        if (typeof value === 'string') {
            if (rule.minLength && value.length < rule.minLength) {
                return `${field} must be at least ${rule.minLength} characters`;
            }
            if (rule.maxLength && value.length > rule.maxLength) {
                return `${field} must be no more than ${rule.maxLength} characters`;
            }
        }

        // Number validation
        if (typeof value === 'number') {
            if (rule.min !== undefined && value < rule.min) {
                return `${field} must be at least ${rule.min}`;
            }
            if (rule.max !== undefined && value > rule.max) {
                return `${field} must be no more than ${rule.max}`;
            }
        }

        // Pattern validation
        if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
            return `${field} format is invalid`;
        }

        // Email validation
        if (rule.email && typeof value === 'string') {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(value)) {
                return `${field} must be a valid email address`;
            }
        }

        // URL validation
        if (rule.url && typeof value === 'string') {
            try {
                new URL(value);
            } catch {
                return `${field} must be a valid URL`;
            }
        }

        // Custom validation
        if (rule.custom) {
            const customError = rule.custom(value);
            if (customError) {
                return customError;
            }
        }

        return null;
    }

    /**
     * Validate all fields
     */
    validate(data: Record<string, any>): ValidationResult {
        const errors: Record<string, string> = {};

        for (const field in this.rules) {
            const error = this.validateField(field, data[field]);
            if (error) {
                errors[field] = error;
            }
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors,
        };
    }

    /**
     * Clear all rules
     */
    clear(): this {
        this.rules = {};
        return this;
    }
}

/**
 * Common validation patterns
 */
export const patterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^\+?[\d\s\-\(\)]+$/,
    username: /^[a-zA-Z0-9_]{3,20}$/,
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    url: /^https?:\/\/.+/,
    slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    hexColor: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
    ipAddress: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
};

/**
 * Common validation rules
 */
export const rules = {
    required: { required: true },
    email: { email: true },
    url: { url: true },
    username: { pattern: patterns.username, minLength: 3, maxLength: 20 },
    password: { pattern: patterns.password, minLength: 8 },
    phone: { pattern: patterns.phone },
    slug: { pattern: patterns.slug },
    hexColor: { pattern: patterns.hexColor },
    ipAddress: { pattern: patterns.ipAddress },
    uuid: { pattern: patterns.uuid },
};

/**
 * Validate email address
 */
export const validateEmail = (email: string): boolean => {
    return patterns.email.test(email);
};

/**
 * Validate URL
 */
export const validateUrl = (url: string): boolean => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

/**
 * Validate phone number
 */
export const validatePhone = (phone: string): boolean => {
    return patterns.phone.test(phone);
};

/**
 * Validate username
 */
export const validateUsername = (username: string): boolean => {
    return patterns.username.test(username);
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    if (!/[@$!%*?&]/.test(password)) {
        errors.push('Password must contain at least one special character (@$!%*?&)');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

/**
 * Validate file upload
 */
export const validateFile = (
    file: File,
    options: {
        maxSize?: number; // in bytes
        allowedTypes?: string[];
        allowedExtensions?: string[];
    } = {}
): { isValid: boolean; error?: string } => {
    const { maxSize, allowedTypes, allowedExtensions } = options;

    // Check file size
    if (maxSize && file.size > maxSize) {
        return {
            isValid: false,
            error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`,
        };
    }

    // Check file type
    if (allowedTypes && !allowedTypes.includes(file.type)) {
        return {
            isValid: false,
            error: `File type must be one of: ${allowedTypes.join(', ')}`,
        };
    }

    // Check file extension
    if (allowedExtensions) {
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (!extension || !allowedExtensions.includes(extension)) {
            return {
                isValid: false,
                error: `File extension must be one of: ${allowedExtensions.join(', ')}`,
            };
        }
    }

    return { isValid: true };
};

/**
 * Validate form data
 */
export const validateForm = (
    data: Record<string, any>,
    validationRules: Record<string, ValidationRule>
): ValidationResult => {
    const validator = new Validator();

    // Add all rules
    Object.entries(validationRules).forEach(([field, rule]) => {
        validator.addRule(field, rule);
    });

    return validator.validate(data);
};

/**
 * Sanitize input
 */
export const sanitizeInput = (input: string): string => {
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, ''); // Remove event handlers
};

/**
 * Sanitize HTML
 */
export const sanitizeHtml = (html: string): string => {
    const allowedTags = ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'];
    const allowedAttributes = ['href', 'target'];

    // Simple HTML sanitization - in production, use a library like DOMPurify
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

/**
 * Validate JSON
 */
export const validateJson = (jsonString: string): { isValid: boolean; data?: any; error?: string } => {
    try {
        const data = JSON.parse(jsonString);
        return { isValid: true, data };
    } catch (error) {
        return {
            isValid: false,
            error: error instanceof Error ? error.message : 'Invalid JSON',
        };
    }
};

/**
 * Validate date range
 */
export const validateDateRange = (startDate: string | Date, endDate: string | Date): boolean => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return false;
    }

    return start <= end;
};

/**
 * Validate credit card number (Luhn algorithm)
 */
export const validateCreditCard = (cardNumber: string): boolean => {
    const cleaned = cardNumber.replace(/\D/g, '');

    if (cleaned.length < 13 || cleaned.length > 19) {
        return false;
    }

    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
        let digit = parseInt(cleaned[i]);

        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }

        sum += digit;
        isEven = !isEven;
    }

    return sum % 10 === 0;
};

/**
 * Validate ISBN
 */
export const validateISBN = (isbn: string): boolean => {
    const cleaned = isbn.replace(/[-\s]/g, '');

    if (cleaned.length === 10) {
        // ISBN-10
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cleaned[i]) * (10 - i);
        }
        const checkDigit = cleaned[9] === 'X' ? 10 : parseInt(cleaned[9]);
        return (sum + checkDigit) % 11 === 0;
    } else if (cleaned.length === 13) {
        // ISBN-13
        let sum = 0;
        for (let i = 0; i < 12; i++) {
            sum += parseInt(cleaned[i]) * (i % 2 === 0 ? 1 : 3);
        }
        const checkDigit = parseInt(cleaned[12]);
        return (10 - (sum % 10)) % 10 === checkDigit;
    }

    return false;
};

/**
 * Validate postal code
 */
export const validatePostalCode = (postalCode: string, country: string = 'US'): boolean => {
    const patterns: Record<string, RegExp> = {
        US: /^\d{5}(-\d{4})?$/,
        CA: /^[A-Z]\d[A-Z] \d[A-Z]\d$/,
        UK: /^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/,
        DE: /^\d{5}$/,
        FR: /^\d{5}$/,
        JP: /^\d{3}-\d{4}$/,
    };

    const pattern = patterns[country.toUpperCase()];
    return pattern ? pattern.test(postalCode) : false;
};

/**
 * Validate social security number (US)
 */
export const validateSSN = (ssn: string): boolean => {
    const cleaned = ssn.replace(/\D/g, '');
    return /^\d{9}$/.test(cleaned) && !/^(\d)\1{8}$/.test(cleaned);
};

/**
 * Validate IP address
 */
export const validateIPAddress = (ip: string): boolean => {
    return patterns.ipAddress.test(ip);
};

/**
 * Validate MAC address
 */
export const validateMACAddress = (mac: string): boolean => {
    const pattern = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    return pattern.test(mac);
};

/**
 * Validate UUID
 */
export const validateUUID = (uuid: string): boolean => {
    return patterns.uuid.test(uuid);
};

/**
 * Validate hex color
 */
export const validateHexColor = (color: string): boolean => {
    return patterns.hexColor.test(color);
};

/**
 * Validate slug
 */
export const validateSlug = (slug: string): boolean => {
    return patterns.slug.test(slug);
};

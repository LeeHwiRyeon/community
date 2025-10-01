/**
 * Utility functions for formatting data
 */

/**
 * Format a number with commas
 */
export const formatNumber = (num: number | string): string => {
    if (num === null || num === undefined) return '0';
    const number = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(number)) return '0';
    return number.toLocaleString();
};

/**
 * Format a date to a readable string
 */
export const formatDate = (date: string | Date): string => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

/**
 * Format a date to a relative time string (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: string | Date): string => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
    return `${Math.floor(diffInSeconds / 31536000)}y ago`;
};

/**
 * Format a file size in bytes to a readable string
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format a duration in seconds to a readable string
 */
export const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${Math.floor(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
};

/**
 * Format a percentage
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
    return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Format a currency amount
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
};

/**
 * Truncate text to a specified length
 */
export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

/**
 * Format a username with @ symbol
 */
export const formatUsername = (username: string): string => {
    if (!username) return '';
    return username.startsWith('@') ? username : `@${username}`;
};

/**
 * Format a phone number
 */
export const formatPhoneNumber = (phone: string): string => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
};

/**
 * Format a URL to a readable domain
 */
export const formatDomain = (url: string): string => {
    try {
        const domain = new URL(url).hostname;
        return domain.replace('www.', '');
    } catch {
        return url;
    }
};

/**
 * Format a list of items with proper conjunction
 */
export const formatList = (items: string[], conjunction: string = 'and'): string => {
    if (items.length === 0) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
    return `${items.slice(0, -1).join(', ')}, ${conjunction} ${items[items.length - 1]}`;
};

/**
 * Format a time range
 */
export const formatTimeRange = (start: string | Date, end: string | Date): string => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return '';

    const startTime = startDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    const endTime = endDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    return `${startTime} - ${endTime}`;
};

/**
 * Format a date range
 */
export const formatDateRange = (start: string | Date, end: string | Date): string => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return '';

    const startFormatted = startDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    const endFormatted = endDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    return `${startFormatted} - ${endFormatted}`;
};

/**
 * Format a priority level
 */
export const formatPriority = (priority: number): string => {
    const levels = ['', 'Low', 'Medium', 'High', 'Critical', 'Urgent'];
    return levels[priority] || 'Unknown';
};

/**
 * Format a status
 */
export const formatStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
        'pending': 'Pending',
        'in_progress': 'In Progress',
        'completed': 'Completed',
        'cancelled': 'Cancelled',
        'on_hold': 'On Hold',
        'draft': 'Draft',
        'published': 'Published',
        'archived': 'Archived'
    };
    return statusMap[status] || status;
};

/**
 * Format a category
 */
export const formatCategory = (category: string): string => {
    const categoryMap: Record<string, string> = {
        'feature': 'Feature',
        'bug': 'Bug',
        'improvement': 'Improvement',
        'documentation': 'Documentation',
        'testing': 'Testing',
        'refactoring': 'Refactoring',
        'deployment': 'Deployment'
    };
    return categoryMap[category] || category;
};

/**
 * Safe date formatting that handles invalid dates
 */
export const safeDate = (date: string | Date | null | undefined): string => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

/**
 * Convert a date to a value for sorting
 */
export const toDateValue = (date: string | Date | null | undefined): number => {
    if (!date) return 0;
    const d = new Date(date);
    return isNaN(d.getTime()) ? 0 : d.getTime();
};

/**
 * Create an excerpt from text
 */
export const toExcerpt = (text: string, maxLength: number = 100): string => {
    if (!text) return '';
    const cleaned = text.replace(/<[^>]*>/g, ''); // Remove HTML tags
    return truncateText(cleaned, maxLength);
};

/**
 * Format a progress percentage
 */
export const formatProgress = (current: number, total: number): string => {
    if (total === 0) return '0%';
    const percentage = (current / total) * 100;
    return `${Math.round(percentage)}%`;
};

/**
 * Format a score with stars
 */
export const formatScore = (score: number, maxScore: number = 5): string => {
    const stars = '★'.repeat(Math.floor(score));
    const emptyStars = '☆'.repeat(maxScore - Math.floor(score));
    return `${stars}${emptyStars} (${score.toFixed(1)})`;
};

/**
 * Format a version number
 */
export const formatVersion = (version: string): string => {
    if (!version) return 'Unknown';
    return `v${version}`;
};

/**
 * Format a hash (show first and last few characters)
 */
export const formatHash = (hash: string, length: number = 8): string => {
    if (!hash) return '';
    if (hash.length <= length * 2) return hash;
    return `${hash.substring(0, length)}...${hash.substring(hash.length - length)}`;
};

/**
 * Format a boolean value
 */
export const formatBoolean = (value: boolean | null | undefined): string => {
    if (value === null || value === undefined) return 'Unknown';
    return value ? 'Yes' : 'No';
};

/**
 * Format a JSON object for display
 */
export const formatJSON = (obj: any, indent: number = 2): string => {
    try {
        return JSON.stringify(obj, null, indent);
    } catch {
        return String(obj);
    }
};

/**
 * Format a list of tags
 */
export const formatTags = (tags: string[] | string): string => {
    if (!tags) return '';
    const tagArray = Array.isArray(tags) ? tags : [tags];
    return tagArray.map(tag => `#${tag}`).join(' ');
};

/**
 * Format a count with proper pluralization
 */
export const formatCount = (count: number, singular: string, plural?: string): string => {
    const pluralForm = plural || `${singular}s`;
    return count === 1 ? `1 ${singular}` : `${count} ${pluralForm}`;
};

/**
 * Format a time ago string with more precision
 */
export const formatTimeAgo = (date: string | Date): string => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minute${Math.floor(diffInSeconds / 60) === 1 ? '' : 's'} ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour${Math.floor(diffInSeconds / 3600) === 1 ? '' : 's'} ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} day${Math.floor(diffInSeconds / 86400) === 1 ? '' : 's'} ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} month${Math.floor(diffInSeconds / 2592000) === 1 ? '' : 's'} ago`;
    return `${Math.floor(diffInSeconds / 31536000)} year${Math.floor(diffInSeconds / 31536000) === 1 ? '' : 's'} ago`;
};

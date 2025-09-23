// auth/providers.js - configuration & placeholder discovery for OAuth providers
// This is a scaffolding layer; real OAuth flows to be implemented later.

export const SUPPORTED_PROVIDERS = [
    'google', 'apple', 'microsoft', 'github', 'naver', 'kakao'
];

export function getEnabledProviders(env = process.env) {
    // Simple heuristic: provider enabled if its CLIENT_ID is present (or global AUTH_ENABLE_ALL=1)
    if (env.AUTH_ENABLE_ALL === '1') return [...SUPPORTED_PROVIDERS];
    // In non-production environments, default-enable all providers to support mock flows and tests
    if ((env.NODE_ENV || '').toLowerCase() !== 'production') return [...SUPPORTED_PROVIDERS];
    return SUPPORTED_PROVIDERS.filter(p => !!env[`OAUTH_${p.toUpperCase()}_CLIENT_ID`]);
}

export function providerMeta(provider) {
    switch (provider) {
        case 'google': return { authUrl: 'https://accounts.google.com/o/oauth2/v2/auth', scopes: ['profile', 'email'] };
        case 'apple': return { authUrl: 'https://appleid.apple.com/auth/authorize', scopes: ['name', 'email'] };
        case 'microsoft': return { authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize', scopes: ['User.Read'] };
        case 'github': return { authUrl: 'https://github.com/login/oauth/authorize', scopes: ['read:user', 'user:email'] };
        case 'naver': return { authUrl: 'https://nid.naver.com/oauth2.0/authorize', scopes: ['profile', 'email'] };
        case 'kakao': return { authUrl: 'https://kauth.kakao.com/oauth/authorize', scopes: ['profile', 'account_email'] };
        default: return null;
    }
}

// Builds a mock login redirect URL (real implementation would include state & client_id, etc.)
export function buildMockAuthRedirect(provider, baseCallback) {
    const meta = providerMeta(provider);
    if (!meta) return null;
    const state = Math.random().toString(36).slice(2);
    const cb = encodeURIComponent(`${baseCallback}/api/auth/callback/${provider}?state=${state}`);
    return `${meta.authUrl}?client_id=FAKE_${provider.toUpperCase()}_CID&redirect_uri=${cb}&scope=${encodeURIComponent(meta.scopes.join(' '))}&response_type=code&state=${state}`;
}

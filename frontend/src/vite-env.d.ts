/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
    readonly VITE_API_ENDPOINT: string;
    readonly VITE_AUTH_ENDPOINT: string;
    readonly VITE_NODE_ENV: string;
    readonly VITE_DEBUG: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
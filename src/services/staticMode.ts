/// <reference types="vite/client" />

const STATIC_HOSTS = ['github.io', 'pages.dev', 'vercel.app', 'netlify.app'];

export function isStaticMode(): boolean {
  if (import.meta.env.VITE_STATIC === 'true') return true;
  try {
    return STATIC_HOSTS.some(h => window.location.hostname.endsWith(h));
  } catch {
    return false;
  }
}

export const STATIC_MODE = isStaticMode();

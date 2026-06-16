import type { AuthUser } from '../types/api';

const STORAGE_KEY = 'zpl-auth-session';
const SESSION_EVENT = 'zpl-auth-session-changed';

export interface StoredSession {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
}

export function readStoredSession(): StoredSession {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { accessToken: null, refreshToken: null, user: null };
  }

  try {
    const parsed = JSON.parse(raw) as StoredSession;
    return {
      accessToken: parsed.accessToken ?? null,
      refreshToken: parsed.refreshToken ?? null,
      user: parsed.user ?? null,
    };
  } catch {
    clearStoredSession();
    return { accessToken: null, refreshToken: null, user: null };
  }
}

export function storeSession(session: StoredSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function clearStoredSession(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function onSessionChange(handler: () => void): () => void {
  window.addEventListener(SESSION_EVENT, handler);
  return () => window.removeEventListener(SESSION_EVENT, handler);
}

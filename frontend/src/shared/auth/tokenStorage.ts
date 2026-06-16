import type { AuthUser } from '../types/api';

const STORAGE_KEY = 'zpl-auth-session';

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
}

export function clearStoredSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

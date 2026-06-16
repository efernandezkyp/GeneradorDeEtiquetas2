import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  clearStoredSession,
  readStoredSession,
  storeSession,
  onSessionChange,
  type StoredSession,
} from '../../../shared/auth/tokenStorage';
import type { AuthUser } from '../../../shared/types/api';
import { getCurrentUser, loginRequest, logoutRequest, type LoginPayload } from '../api/authApi';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  completeGoogleLogin: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function emptySession(): StoredSession {
  return { accessToken: null, refreshToken: null, user: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession>(() => readStoredSession());
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(readStoredSession().accessToken));

  useEffect(() => {
    return onSessionChange(() => {
      setSession(readStoredSession());
    });
  }, []);

  useEffect(() => {
    let active = true;

    async function hydrateSession() {
      if (!session.accessToken) {
        setIsLoading(false);
        return;
      }

      try {
        const user = session.user ?? (await getCurrentUser());
        const nextSession = { ...session, user };
        storeSession(nextSession);
        if (active) {
          setSession(nextSession);
        }
      } catch {
        clearStoredSession();
        if (active) {
          setSession(emptySession());
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void hydrateSession();

    return () => {
      active = false;
    };
  }, [session.accessToken, session.refreshToken, session.user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session.user,
      isLoading,
      isAuthenticated: Boolean(session.accessToken && session.user),
      login: async (payload: LoginPayload) => {
        const nextSession = await loginRequest(payload);
        storeSession(nextSession);
        setSession(nextSession);
        setIsLoading(false);
      },
      completeGoogleLogin: async (accessToken: string, refreshToken: string) => {
        const partialSession = { accessToken, refreshToken, user: null };
        storeSession(partialSession);
        setSession(partialSession);
        const user = await getCurrentUser();
        const nextSession = { accessToken, refreshToken, user };
        storeSession(nextSession);
        setSession(nextSession);
        setIsLoading(false);
      },
      logout: async () => {
        if (session.refreshToken) {
          try {
            await logoutRequest(session.refreshToken);
          } catch {
            // Local cleanup is still required if the remote logout fails.
          }
        }
        clearStoredSession();
        setSession(emptySession());
        setIsLoading(false);
      },
    }),
    [isLoading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}

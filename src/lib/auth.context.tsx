/**
 * ============================================================
 *  AUTH CONTEXT
 *  Wrap your root layout with <AuthProvider>.
 *  Access anywhere with useAuth().
 * ============================================================
 */

import React, {
  createContext, useContext, useEffect, useState,
  useCallback, type ReactNode,
} from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { authService, type UserSession } from '../services/auth.service';
import { FEATURES } from '../config/features';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextValue {
  session: UserSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  user: UserSession['user'] | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const redirectUri = AuthSession.makeRedirectUri({ scheme: authService.getScheme() });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: authService.getClientId(),
      scopes: authService.getScopes(),
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    authService.getDiscovery()
  );

  // Load persisted session on mount
  useEffect(() => {
    (async () => {
      if (!FEATURES.googleAuth) { setIsLoading(false); return; }
      const saved = await authService.loadSession();
      setSession(saved);
      setIsLoading(false);
    })();
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    if (!FEATURES.googleAuth || response?.type !== 'success') return;
    const { code } = response.params;
    if (!code || !request?.codeVerifier) return;

    (async () => {
      try {
        const newSession = await authService.exchangeCodeForTokens(
          code, request.codeVerifier!, redirectUri
        );
        await authService.saveSession(newSession);
        authService.scheduleRefresh(newSession);
        setSession(newSession);
      } catch (err) {
        console.error('[AuthContext]', err);
      }
    })();
  }, [response]);

  const signIn = useCallback(async () => {
    if (!FEATURES.googleAuth) return;
    await promptAsync();
  }, [promptAsync]);

  const signOut = useCallback(async () => {
    await authService.clearSession();
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      session, isLoading,
      isAuthenticated: !!session,
      user: session?.user ?? null,
      signIn, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/**
 * ============================================================
 *  AUTH SERVICE
 *  Google OAuth + SecureStore + auto token refresh.
 *  All behaviour gated by feature flags.
 * ============================================================
 */

import * as SecureStore from 'expo-secure-store';
import { FEATURES } from '../config/features';
import { ENV } from '../config/env';

const STORAGE_KEY = 'auth_session_v1';
const REFRESH_BUFFER_MS = 5 * 60 * 1000; // refresh 5 min before expiry

export interface UserSession {
  accessToken: string;
  idToken: string | null;
  refreshToken: string | null;
  expiresAt: number;
  user: {
    id: string;
    email: string;
    name: string;
    picture: string;
  };
  // Scopes granted — add more in auth.context.tsx as needed
  scopes: string[];
}

const DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

class AuthService {
  private session: UserSession | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  getDiscovery() {
    return DISCOVERY;
  }

  getClientId() {
    return ENV.google.clientId;
  }

  getScheme() {
    return ENV.google.scheme;
  }

  // Default scopes — extend per project
  getScopes(): string[] {
    return [
      'openid',
      'profile',
      'email',
      // Uncomment to access YouTube on behalf of the user:
      // 'https://www.googleapis.com/auth/youtube.readonly',
    ];
  }

  async exchangeCodeForTokens(code: string, codeVerifier: string, redirectUri: string): Promise<UserSession> {
    const res = await fetch(DISCOVERY.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: ENV.google.clientId,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code_verifier: codeVerifier,
      }).toString(),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Token exchange failed: ${err}`);
    }

    const tokens = await res.json();
    const user = await this.fetchUserInfo(tokens.access_token);

    const session: UserSession = {
      accessToken: tokens.access_token,
      idToken: tokens.id_token ?? null,
      refreshToken: tokens.refresh_token ?? null,
      expiresAt: Date.now() + tokens.expires_in * 1000,
      user,
      scopes: this.getScopes(),
    };

    return session;
  }

  private async fetchUserInfo(accessToken: string) {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const d = await res.json();
    return { id: d.sub, email: d.email, name: d.name, picture: d.picture };
  }

  async refreshToken(): Promise<UserSession | null> {
    if (!FEATURES.tokenAutoRefresh || !this.session?.refreshToken) return null;

    try {
      const res = await fetch(DISCOVERY.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: ENV.google.clientId,
          grant_type: 'refresh_token',
          refresh_token: this.session.refreshToken,
        }).toString(),
      });

      if (!res.ok) throw new Error('Refresh failed');
      const tokens = await res.json();

      const updated: UserSession = {
        ...this.session,
        accessToken: tokens.access_token,
        expiresAt: Date.now() + tokens.expires_in * 1000,
      };

      await this.saveSession(updated);
      this.scheduleRefresh(updated);
      return updated;
    } catch {
      return null;
    }
  }

  scheduleRefresh(session: UserSession) {
    if (!FEATURES.tokenAutoRefresh || !session.refreshToken) return;
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    const delay = Math.max(0, session.expiresAt - Date.now() - REFRESH_BUFFER_MS);
    this.refreshTimer = setTimeout(() => this.refreshToken(), delay);
  }

  async saveSession(session: UserSession): Promise<void> {
    this.session = session;
    if (!FEATURES.persistentLogin) return;
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(session));
  }

  async loadSession(): Promise<UserSession | null> {
    if (!FEATURES.persistentLogin) return null;
    try {
      const raw = await SecureStore.getItemAsync(STORAGE_KEY);
      if (!raw) return null;
      const session: UserSession = JSON.parse(raw);
      this.session = session;
      if (session.refreshToken) this.scheduleRefresh(session);
      return session;
    } catch {
      return null;
    }
  }

  async clearSession(): Promise<void> {
    this.session = null;
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    if (FEATURES.persistentLogin) {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
    }
  }

  getSession(): UserSession | null {
    return this.session;
  }

  isExpired(session: UserSession): boolean {
    return Date.now() >= session.expiresAt - REFRESH_BUFFER_MS;
  }
}

export const authService = new AuthService();

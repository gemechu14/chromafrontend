"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi } from "@/lib/api/auth";
import { getAccessToken, getRefreshToken, clearTokens } from "@/lib/api/client";
import type { User } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<User>;
  /** Step B — after Google redirects with ?code=&state= */
  loginWithGoogleOAuth: (code: string, state: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * On mount: if there's a stored access token, fetch the current user
   * to rehydrate the session.
   */
  useEffect(() => {
    async function rehydrate() {
      const token = getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const currentUser = await authApi.getCurrentUser();
        setUser(currentUser);
      } catch {
        // Token is invalid/expired; clear and let auth guard handle redirect
        clearTokens();
      } finally {
        setIsLoading(false);
      }
    }

    rehydrate();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: loggedInUser } = await authApi.login(email, password);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const loginWithGoogleOAuth = useCallback(async (code: string, state: string) => {
    const { user: loggedInUser } = await authApi.exchangeGoogleOAuthCallback(code, state);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return;
    try {
      await authApi.refreshToken(refreshToken);
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
    } catch {
      clearTokens();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        loginWithGoogleOAuth,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}







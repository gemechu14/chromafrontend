import { apiClient, setTokens, clearTokens } from "./client";
import type { LoginResponse, TokenResponse, User, LoginRequest, RefreshRequest } from "../types";

export const authApi = {
  /**
   * POST /users/login
   * Authenticates user and stores tokens in localStorage.
   */
  async login(email: string, password: string): Promise<{ tokens: TokenResponse; user: User }> {
    const payload: LoginRequest = { email, password };
    const data = await apiClient.post<LoginResponse>("/users/login", payload, {
      skipAuth: true,
    });
    setTokens(data.access_token, data.refresh_token);
    // Login payload may include a minimal user object (routing fields only).
    // Fetch /users/me so downstream pages always receive full user fields
    // like default_location_id, is_active, and default_location_id.
    let user: User;
    try {
      user = await authApi.getCurrentUser();
    } catch {
      if (!data.user) throw new Error("Unable to load user profile after login.");
      user = data.user;
    }
    return { tokens: data, user };
  },

  /**
   * POST /users/refresh
   * Exchanges a refresh token for a new token pair.
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const payload: RefreshRequest = { refresh_token: refreshToken };
    const tokens = await apiClient.post<TokenResponse>("/users/refresh", payload, {
      skipAuth: true,
    });
    setTokens(tokens.access_token, tokens.refresh_token);
    return tokens;
  },

  /**
   * GET /users/me
   * Returns the currently authenticated user.
   */
  getCurrentUser(): Promise<User> {
    return apiClient.get<User>("/users/me");
  },

  /**
   * Clears tokens from localStorage (client-side logout).
   */
  logout(): void {
    clearTokens();
  },
};







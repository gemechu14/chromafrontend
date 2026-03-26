import { apiClient } from "./client";
import type { User, CreateUserRequest, UpdateUserRequest, PaginatedResponse } from "../types";

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      q.set(k, String(v));
    }
  }
  const str = q.toString();
  return str ? `?${str}` : "";
}

export interface ListUsersParams {
  page?: number;
  page_size?: number;
  /** Required for SUPER_ADMIN when listing staff in a salon. */
  tenant_id?: string;
}

export const usersApi = {
  /**
   * GET /users/
   * Salon: current tenant. SUPER_ADMIN: pass tenant_id for a salon.
   */
  list(params: ListUsersParams = {}): Promise<PaginatedResponse<User>> {
    const query = buildQuery({
      page: params.page ?? 1,
      page_size: params.page_size ?? 20,
      tenant_id: params.tenant_id,
    });
    return apiClient.get<PaginatedResponse<User>>(`/users/${query}`);
  },

  /**
   * POST /users/
   * Create a new user for the tenant. (ADMIN/MANAGER)
   */
  create(data: CreateUserRequest): Promise<User> {
    return apiClient.post<User>("/users/", data);
  },

  /**
   * GET /users/{user_id}
   */
  getById(userId: string): Promise<User> {
    return apiClient.get<User>(`/users/${userId}`);
  },

  /**
   * PATCH /users/{user_id}  (ADMIN/MANAGER)
   */
  update(userId: string, data: UpdateUserRequest): Promise<User> {
    return apiClient.patch<User>(`/users/${userId}`, data);
  },

  /**
   * DELETE /users/{user_id}  (ADMIN only)
   */
  delete(userId: string): Promise<void> {
    return apiClient.delete(`/users/${userId}`);
  },
};







import { apiClient } from "./client";
import type {
  Tenant,
  RegisterTenantRequest,
  RegisterTenantResponse,
  CreateTenantRequest,
  UpdateTenantRequest,
  Location,
  CreateLocationRequest,
  UpdateLocationRequest,
  PaginatedResponse,
} from "../types";

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

export const tenantsApi = {
  // ── Tenants ────────────────────────────────────────────────────────────────

  /**
   * POST /tenants/register  (public — no auth required)
   * Registers a new tenant, creates default location and admin user.
   */
  register(data: RegisterTenantRequest): Promise<RegisterTenantResponse> {
    return apiClient.post<RegisterTenantResponse>("/tenants/register", data, {
      skipAuth: true,
    });
  },

  /**
   * GET /tenants/
   * @param includePlatform When false (default), omits the platform tenant from results.
   */
  list(
    page = 1,
    pageSize = 20,
    options?: { includePlatform?: boolean }
  ): Promise<PaginatedResponse<Tenant>> {
    const query = buildQuery({
      page,
      page_size: pageSize,
      include_platform: options?.includePlatform,
    });
    return apiClient.get<PaginatedResponse<Tenant>>(`/tenants/${query}`);
  },

  /**
   * GET /tenants/mine — current user’s tenant record.
   */
  getMine(): Promise<Tenant> {
    return apiClient.get<Tenant>("/tenants/mine");
  },

  /**
   * GET /tenants/{tenant_id}
   */
  getById(tenantId: string): Promise<Tenant> {
    return apiClient.get<Tenant>(`/tenants/${tenantId}`);
  },

  /**
   * POST /tenants/  (ADMIN only)
   */
  create(data: CreateTenantRequest): Promise<Tenant> {
    return apiClient.post<Tenant>("/tenants/", data);
  },

  /**
   * PATCH /tenants/{tenant_id}  (ADMIN only)
   */
  update(tenantId: string, data: UpdateTenantRequest): Promise<Tenant> {
    return apiClient.patch<Tenant>(`/tenants/${tenantId}`, data);
  },

  /**
   * DELETE /tenants/{tenant_id}  (ADMIN only)
   */
  delete(tenantId: string): Promise<void> {
    return apiClient.delete(`/tenants/${tenantId}`);
  },

  // ── Locations ──────────────────────────────────────────────────────────────

  /**
   * GET /tenants/{tenant_id}/locations
   */
  listLocations(tenantId: string, page = 1, pageSize = 100): Promise<PaginatedResponse<Location>> {
    return apiClient.get<PaginatedResponse<Location>>(
      `/tenants/${tenantId}/locations?page=${page}&page_size=${pageSize}`
    );
  },

  /**
   * POST /tenants/{tenant_id}/locations  (ADMIN/MANAGER)
   */
  createLocation(tenantId: string, data: CreateLocationRequest): Promise<Location> {
    return apiClient.post<Location>(`/tenants/${tenantId}/locations`, data);
  },

  /**
   * PATCH /tenants/{tenant_id}/locations/{location_id}  (ADMIN/MANAGER)
   */
  updateLocation(
    tenantId: string,
    locationId: string,
    data: UpdateLocationRequest
  ): Promise<Location> {
    return apiClient.patch<Location>(`/tenants/${tenantId}/locations/${locationId}`, data);
  },

  /**
   * DELETE /tenants/{tenant_id}/locations/{location_id}  (ADMIN only)
   */
  deleteLocation(tenantId: string, locationId: string): Promise<void> {
    return apiClient.delete(`/tenants/${tenantId}/locations/${locationId}`);
  },
};







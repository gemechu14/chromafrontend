import { apiClient } from "./client";
import type {
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  ListCustomersParams,
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

export const customersApi = {
  /**
   * GET /customers/
   * List all customers with optional search and pagination.
   */
  list(params: ListCustomersParams = {}): Promise<PaginatedResponse<Customer>> {
    const query = buildQuery({
      page: params.page ?? 1,
      page_size: params.page_size ?? 20,
      search: params.search,
    });
    return apiClient.get<PaginatedResponse<Customer>>(`/customers/${query}`);
  },

  /**
   * POST /customers/
   * Create a new customer.
   */
  create(data: CreateCustomerRequest): Promise<Customer> {
    return apiClient.post<Customer>("/customers/", data);
  },

  /**
   * GET /customers/{customer_id}
   * Get a single customer by ID.
   */
  getById(customerId: string): Promise<Customer> {
    return apiClient.get<Customer>(`/customers/${customerId}`);
  },

  /**
   * PATCH /customers/{customer_id}
   * Update customer fields (all optional).
   */
  update(customerId: string, data: UpdateCustomerRequest): Promise<Customer> {
    return apiClient.patch<Customer>(`/customers/${customerId}`, data);
  },

  /**
   * DELETE /customers/{customer_id}
   * Delete a customer (also deletes associated formulas).
   */
  delete(customerId: string): Promise<void> {
    return apiClient.delete(`/customers/${customerId}`);
  },
};







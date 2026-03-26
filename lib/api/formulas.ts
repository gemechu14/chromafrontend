import { apiClient } from "./client";
import type {
  Formula,
  CreateFormulaRequest,
  UpdateFormulaRequest,
  ListFormulasParams,
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

export const formulasApi = {
  /**
   * GET /formulas/
   * List formulas. Optionally filter by customer_id.
   * Creating a formula automatically deducts inventory via CONSUME transactions.
   */
  list(params: ListFormulasParams = {}): Promise<PaginatedResponse<Formula>> {
    const query = buildQuery({
      customer_id: params.customer_id,
      page: params.page ?? 1,
      page_size: params.page_size ?? 20,
    });
    return apiClient.get<PaginatedResponse<Formula>>(`/formulas/${query}`);
  },

  /**
   * POST /formulas/
   * Create a formula. Automatically deducts inventory and creates CONSUME transactions.
   */
  create(data: CreateFormulaRequest): Promise<Formula> {
    return apiClient.post<Formula>("/formulas/", data);
  },

  /**
   * GET /formulas/{formula_id}
   */
  getById(formulaId: string): Promise<Formula> {
    return apiClient.get<Formula>(`/formulas/${formulaId}`);
  },

  /**
   * PATCH /formulas/{formula_id}
   * Update formula metadata. Items cannot be updated after creation.
   */
  update(formulaId: string, data: UpdateFormulaRequest): Promise<Formula> {
    return apiClient.patch<Formula>(`/formulas/${formulaId}`, data);
  },

  /**
   * DELETE /formulas/{formula_id}  (ADMIN/MANAGER only)
   * Note: does NOT restore inventory.
   */
  delete(formulaId: string): Promise<void> {
    return apiClient.delete(`/formulas/${formulaId}`);
  },
};







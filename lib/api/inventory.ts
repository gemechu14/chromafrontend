import { apiClient } from "./client";
import type {
  InventoryItem,
  CreateInventoryItemRequest,
  UpdateInventoryItemRequest,
  InventoryTransaction,
  CreateTransactionRequest,
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

export const inventoryApi = {
  /**
   * GET /inventory/items?location_id=...
   * List inventory items for a specific location (returns array, not paginated).
   */
  listItems(locationId: string): Promise<InventoryItem[]> {
    const query = buildQuery({ location_id: locationId });
    return apiClient.get<InventoryItem[]>(`/inventory/items${query}`);
  },

  /**
   * GET /inventory/items/low-stock
   * Returns items at or below reorder level (returns array, not paginated).
   */
  getLowStock(): Promise<InventoryItem[]> {
    return apiClient.get<InventoryItem[]>("/inventory/items/low-stock");
  },

  /**
   * POST /inventory/items  (ADMIN/MANAGER)
   * Create a new inventory item for a location and product.
   */
  createItem(data: CreateInventoryItemRequest): Promise<InventoryItem> {
    return apiClient.post<InventoryItem>("/inventory/items", data);
  },

  /**
   * GET /inventory/items/{item_id}
   */
  getItem(itemId: string): Promise<InventoryItem> {
    return apiClient.get<InventoryItem>(`/inventory/items/${itemId}`);
  },

  /**
   * PATCH /inventory/items/{item_id}  (ADMIN/MANAGER)
   */
  updateItem(itemId: string, data: UpdateInventoryItemRequest): Promise<InventoryItem> {
    return apiClient.patch<InventoryItem>(`/inventory/items/${itemId}`, data);
  },

  /**
   * GET /inventory/transactions
   * List all transactions for the tenant (paginated).
   */
  listTransactions(page = 1, pageSize = 20): Promise<PaginatedResponse<InventoryTransaction>> {
    const query = buildQuery({ page, page_size: pageSize });
    return apiClient.get<PaginatedResponse<InventoryTransaction>>(`/inventory/transactions${query}`);
  },

  /**
   * GET /inventory/transactions/{item_id}
   * List transactions for a specific inventory item (paginated).
   */
  listItemTransactions(
    itemId: string,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResponse<InventoryTransaction>> {
    const query = buildQuery({ page, page_size: pageSize });
    return apiClient.get<PaginatedResponse<InventoryTransaction>>(
      `/inventory/transactions/${itemId}${query}`
    );
  },

  /**
   * POST /inventory/transactions  (ADMIN/MANAGER)
   * Create a manual transaction (PURCHASE, ADJUST, WASTE, RETURN).
   * Also automatically updates on_hand_qty of the inventory item.
   */
  createTransaction(data: CreateTransactionRequest): Promise<InventoryTransaction> {
    return apiClient.post<InventoryTransaction>("/inventory/transactions", data);
  },
};







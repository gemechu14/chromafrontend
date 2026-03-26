// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

// ─── User ──────────────────────────────────────────────────────────────────────

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "EMPLOYEE";

export interface User {
  id: string;
  tenant_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  /** True when the user belongs to the platform tenant (SaaS operators). */
  is_platform_tenant?: boolean;
  is_active: boolean;
  default_location_id: string | null;
  last_login_at: string | null;
  created_at: string;
}

/** Response from POST /users/login (may include embedded user for routing). */
export interface LoginResponse extends TokenResponse {
  user?: User;
}

export interface CreateUserRequest {
  tenant_id: string;
  full_name: string;
  email: string;
  password: string;
  role?: UserRole;
  is_active?: boolean;
  default_location_id?: string | null;
}

export interface UpdateUserRequest {
  full_name?: string;
  email?: string;
  role?: UserRole;
  is_active?: boolean;
  default_location_id?: string | null;
  password?: string;
}

// ─── Tenant ────────────────────────────────────────────────────────────────────

export type TenantPlan = "trial" | "basic" | "premium";
export type TenantStatus = "trial" | "active" | "suspended";

export interface Tenant {
  id: string;
  name: string;
  plan: TenantPlan;
  status: TenantStatus;
  /** Platform operator tenant (not a salon). */
  is_platform?: boolean;
  created_at: string;
}

export interface RegisterTenantRequest {
  tenant_name: string;
  plan?: TenantPlan;
  admin_email: string;
  admin_password: string;
  admin_full_name: string;
  location_name: string;
  location_address?: string;
  location_timezone?: string;
}

export interface RegisterTenantResponse {
  tenant: Tenant;
  location: Location;
  admin_user_id: string;
  admin_email: string;
  message: string;
}

export interface CreateTenantRequest {
  name: string;
  plan?: TenantPlan;
  status?: TenantStatus;
  /** Only for initial platform tenant; salon signups use false (default). */
  is_platform?: boolean;
}

export interface UpdateTenantRequest {
  name?: string;
  plan?: TenantPlan;
  status?: TenantStatus;
}

// ─── Location ──────────────────────────────────────────────────────────────────

export interface Location {
  id: string;
  tenant_id: string;
  name: string;
  address?: string | null;
  timezone?: string | null;
  created_at: string;
}

export interface CreateLocationRequest {
  tenant_id: string;
  name: string;
  address?: string;
  timezone?: string;
}

export interface UpdateLocationRequest {
  name?: string;
  address?: string;
  timezone?: string;
}

// ─── Customer ──────────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  tenant_id: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  home_location_id?: string | null;
  created_at: string;
}

export interface CreateCustomerRequest {
  tenant_id: string;
  full_name: string;
  phone?: string;
  email?: string;
  notes?: string;
  home_location_id?: string;
}

export interface UpdateCustomerRequest {
  full_name?: string;
  phone?: string;
  email?: string;
  notes?: string;
  home_location_id?: string;
}

export interface ListCustomersParams {
  page?: number;
  page_size?: number;
  search?: string;
}

// ─── Products ──────────────────────────────────────────────────────────────────

export type ProductCategory = "COLOR" | "DEVELOPER" | "TONER" | "TREATMENT";
export type PackSizeUnit = "G" | "ML";

export interface Brand {
  id: string;
  name: string;
  website_url?: string | null;
  created_at: string;
}

export interface CreateBrandRequest {
  name: string;
  website_url?: string;
}

export interface UpdateBrandRequest {
  name?: string;
  website_url?: string;
}

export interface ProductLine {
  id: string;
  brand_id: string;
  name: string;
  category: ProductCategory;
  created_at: string;
}

export interface CreateProductLineRequest {
  brand_id: string;
  name: string;
  category: ProductCategory;
}

export interface UpdateProductLineRequest {
  name?: string;
  category?: ProductCategory;
}

export interface Product {
  id: string;
  product_line_id: string;
  sku?: string | null;
  code: string;
  name: string;
  tone_family?: string | null;
  pack_size_value: number;
  pack_size_unit: PackSizeUnit;
  is_active: boolean;
  created_at: string;
}

export interface CreateProductRequest {
  product_line_id: string;
  sku?: string;
  code: string;
  name: string;
  tone_family?: string;
  pack_size_value: number;
  pack_size_unit: PackSizeUnit;
  is_active?: boolean;
}

export interface TenantProduct {
  id: string;
  tenant_id: string;
  product_id: string;
  custom_name?: string | null;
  is_enabled: boolean;
  tracking_unit: PackSizeUnit;
  default_unit_cost?: number | null;
  currency?: string | null;
  created_at: string;
}

export interface AddTenantProductRequest {
  tenant_id: string;
  product_id: string;
  custom_name?: string;
  is_enabled?: boolean;
  tracking_unit?: PackSizeUnit;
  default_unit_cost?: number;
  currency?: string;
}

export interface UpdateTenantProductRequest {
  custom_name?: string;
  is_enabled?: boolean;
  tracking_unit?: PackSizeUnit;
  default_unit_cost?: number;
  currency?: string;
}

export interface ListProductsParams {
  product_line_id?: string;
  page?: number;
  page_size?: number;
}

export interface ListTenantProductsParams {
  /** Required for SUPER_ADMIN when viewing a salon catalog. */
  tenant_id?: string;
  enabled_only?: boolean;
  page?: number;
  page_size?: number;
}

// ─── Inventory ─────────────────────────────────────────────────────────────────

export interface InventoryItem {
  id: string;
  tenant_id: string;
  location_id: string;
  tenant_product_id: string;
  on_hand_qty: number;
  reorder_level_qty: number;
  updated_at: string;
  created_at: string;
}

export interface CreateInventoryItemRequest {
  tenant_id: string;
  location_id: string;
  tenant_product_id: string;
  on_hand_qty?: number;
  reorder_level_qty?: number;
}

export interface UpdateInventoryItemRequest {
  on_hand_qty?: number;
  reorder_level_qty?: number;
}

export type TransactionType = "PURCHASE" | "CONSUME" | "ADJUST" | "WASTE" | "RETURN";

export interface InventoryTransaction {
  id: string;
  tenant_id: string;
  inventory_item_id: string;
  user_id: string;
  formula_id: string | null;
  txn_type: TransactionType;
  qty_delta: number;
  unit_cost_at_time?: number | null;
  note?: string | null;
  created_at: string;
}

export interface CreateTransactionRequest {
  tenant_id: string;
  inventory_item_id: string;
  user_id: string;
  txn_type: TransactionType;
  qty_delta: number;
  unit_cost_at_time?: number;
  note?: string;
  formula_id?: string | null;
}

// ─── Formula ───────────────────────────────────────────────────────────────────

export interface FormulaItem {
  id: string;
  formula_id: string;
  tenant_product_id: string;
  amount_used: number;
  cost_at_time: number;
  created_at: string;
}

export interface Formula {
  id: string;
  tenant_id: string;
  location_id: string;
  customer_id: string;
  created_by_user_id: string;
  formula_name?: string | null;
  service_type?: string | null;
  notes?: string | null;
  created_at: string;
  formula_items: FormulaItem[];
}

export interface CreateFormulaItemRequest {
  tenant_product_id: string;
  amount_used: number;
  cost_at_time?: number;
}

export interface CreateFormulaRequest {
  tenant_id: string;
  location_id: string;
  customer_id: string;
  created_by_user_id: string;
  formula_name?: string;
  service_type?: string;
  notes?: string;
  items: CreateFormulaItemRequest[];
}

export interface UpdateFormulaRequest {
  formula_name?: string;
  service_type?: string;
  notes?: string;
}

export interface ListFormulasParams {
  customer_id?: string;
  page?: number;
  page_size?: number;
}

// ─── API Error ─────────────────────────────────────────────────────────────────

export interface ApiError {
  detail: string;
}


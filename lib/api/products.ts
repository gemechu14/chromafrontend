import { apiClient } from "./client";
import type {
  Brand,
  CreateBrandRequest,
  UpdateBrandRequest,
  ProductLine,
  CreateProductLineRequest,
  UpdateProductLineRequest,
  Product,
  CreateProductRequest,
  TenantProduct,
  AddTenantProductRequest,
  UpdateTenantProductRequest,
  ListProductsParams,
  ListTenantProductsParams,
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

export const productsApi = {
  // ── Brands ─────────────────────────────────────────────────────────────────

  /**
   * GET /products/brands
   */
  listBrands(page = 1, pageSize = 100): Promise<PaginatedResponse<Brand>> {
    const query = buildQuery({ page, page_size: pageSize });
    return apiClient.get<PaginatedResponse<Brand>>(`/products/brands${query}`);
  },

  /**
   * POST /products/brands  (ADMIN only)
   */
  createBrand(data: CreateBrandRequest): Promise<Brand> {
    return apiClient.post<Brand>("/products/brands", data);
  },

  /**
   * PATCH /products/brands/{brand_id}  (ADMIN only)
   */
  updateBrand(brandId: string, data: UpdateBrandRequest): Promise<Brand> {
    return apiClient.patch<Brand>(`/products/brands/${brandId}`, data);
  },

  /**
   * DELETE /products/brands/{brand_id}
   */
  deleteBrand(brandId: string): Promise<void> {
    return apiClient.delete(`/products/brands/${brandId}`);
  },

  // ── Product Lines ──────────────────────────────────────────────────────────

  /**
   * GET /products/lines?brand_id=...
   * brand_id is required by the API; pass undefined to omit (may return all lines if backend allows).
   */
  listProductLines(brandId: string | undefined, page = 1, pageSize = 100): Promise<PaginatedResponse<ProductLine>> {
    const query = buildQuery({ brand_id: brandId, page, page_size: pageSize });
    return apiClient.get<PaginatedResponse<ProductLine>>(`/products/lines${query}`);
  },

  /**
   * POST /products/lines
   */
  createProductLine(data: CreateProductLineRequest): Promise<ProductLine> {
    return apiClient.post<ProductLine>("/products/lines", data);
  },

  /**
   * PATCH /products/lines/{line_id}
   */
  updateProductLine(lineId: string, data: UpdateProductLineRequest): Promise<ProductLine> {
    return apiClient.patch<ProductLine>(`/products/lines/${lineId}`, data);
  },

  /**
   * DELETE /products/lines/{line_id}
   */
  deleteProductLine(lineId: string): Promise<void> {
    return apiClient.delete(`/products/lines/${lineId}`);
  },

  // ── Products ───────────────────────────────────────────────────────────────

  /**
   * GET /products/{product_id}
   */
  getProductById(productId: string): Promise<Product> {
    return apiClient.get<Product>(`/products/${productId}`);
  },

  /**
   * GET /products/
   */
  listProducts(params: ListProductsParams = {}): Promise<PaginatedResponse<Product>> {
    const query = buildQuery({
      product_line_id: params.product_line_id,
      page: params.page ?? 1,
      page_size: params.page_size ?? 100,
    });
    return apiClient.get<PaginatedResponse<Product>>(`/products/${query}`);
  },

  /**
   * POST /products/
   */
  createProduct(data: CreateProductRequest): Promise<Product> {
    return apiClient.post<Product>("/products/", data);
  },

  /**
   * PATCH /products/{product_id}
   */
  updateProduct(productId: string, data: Partial<CreateProductRequest>): Promise<Product> {
    return apiClient.patch<Product>(`/products/${productId}`, data);
  },

  /**
   * DELETE /products/{product_id}
   */
  deleteProduct(productId: string): Promise<void> {
    return apiClient.delete(`/products/${productId}`);
  },

  // ── Tenant Catalog ─────────────────────────────────────────────────────────

  /**
   * GET /products/tenant-catalog
   */
  listTenantProducts(params: ListTenantProductsParams = {}): Promise<PaginatedResponse<TenantProduct>> {
    const query = buildQuery({
      tenant_id: params.tenant_id,
      enabled_only: params.enabled_only,
      page: params.page ?? 1,
      page_size: params.page_size ?? 100,
    });
    return apiClient.get<PaginatedResponse<TenantProduct>>(`/products/tenant-catalog${query}`);
  },

  /**
   * POST /products/tenant-catalog  (ADMIN/MANAGER)
   */
  addTenantProduct(data: AddTenantProductRequest): Promise<TenantProduct> {
    return apiClient.post<TenantProduct>("/products/tenant-catalog", data);
  },

  /**
   * PATCH /products/tenant-catalog/{tp_id}  (ADMIN/MANAGER)
   */
  updateTenantProduct(tpId: string, data: UpdateTenantProductRequest): Promise<TenantProduct> {
    return apiClient.patch<TenantProduct>(`/products/tenant-catalog/${tpId}`, data);
  },

  /**
   * DELETE /products/tenant-catalog/{tp_id}  (ADMIN/MANAGER)
   */
  removeTenantProduct(tpId: string): Promise<void> {
    return apiClient.delete(`/products/tenant-catalog/${tpId}`);
  },
};


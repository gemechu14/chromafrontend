"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Plus,
  Search,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  ChevronRight,
  PackagePlus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { productsApi } from "@/lib/api/products";
import { useAuth } from "@/contexts/auth-context";
import { ApiRequestError } from "@/lib/api/client";
import { toast } from "sonner";
import type {
  TenantProduct,
  Brand,
  ProductLine,
  Product,
  PackSizeUnit,
} from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EditCatalogForm {
  custom_name: string;
  tracking_unit: PackSizeUnit;
  pack_size_value: string;
  default_unit_cost: string;
  currency: string;
  is_enabled: boolean;
}

interface AddToCatalogForm {
  custom_name: string;
  tracking_unit: PackSizeUnit;
  pack_size_value: string;
  default_unit_cost: string;
  currency: string;
}

const defaultEditForm: EditCatalogForm = {
  custom_name: "",
  tracking_unit: "G",
  pack_size_value: "",
  default_unit_cost: "",
  currency: "USD",
  is_enabled: true,
};

const defaultAddForm: AddToCatalogForm = {
  custom_name: "",
  tracking_unit: "G",
  pack_size_value: "",
  default_unit_cost: "",
  currency: "USD",
};

function costUnitLabel(unit: PackSizeUnit): "g" | "ml" {
  return unit === "G" ? "g" : "ml";
}

// ─── My Catalog Tab ───────────────────────────────────────────────────────────

function MyCatalogTab({ canEdit }: { canEdit: boolean }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingTp, setEditingTp] = useState<TenantProduct | null>(null);
  const [editForm, setEditForm] = useState<EditCatalogForm>(defaultEditForm);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: tenantProductsPage, isLoading } = useQuery({
    queryKey: ["tenant-products", "catalog"],
    queryFn: () => productsApi.listTenantProducts({ page: 1, page_size: 200 }),
  });

  // ── Fetch ALL global products for lookup ────────────────────────────────────
  const { data: globalProductsPage, isLoading: loadingGlobalProducts } = useQuery({
    queryKey: ["products", "all"],
    queryFn: async () => {
      // Fetch first page
      const firstPage = await productsApi.listProducts({ page: 1, page_size: 100 });
      const allProducts = [...firstPage.items];
      
      // Fetch remaining pages if any
      const totalPages = firstPage.total_pages;
      if (totalPages > 1) {
        const remainingPages = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, i) =>
            productsApi.listProducts({ page: i + 2, page_size: 100 })
          )
        );
        remainingPages.forEach((page) => {
          allProducts.push(...page.items);
        });
      }
      
      return { items: allProducts, total: firstPage.total };
    },
  });
  
  // Build global product lookup map
  const globalLookup: Record<
    string,
    { name: string; code: string; pack_size_value: number; pack_size_unit: PackSizeUnit }
  > = {};
  globalProductsPage?.items.forEach((gp) => {
    globalLookup[gp.id] = {
      name: gp.name,
      code: gp.code,
      pack_size_value: gp.pack_size_value,
      pack_size_unit: gp.pack_size_unit,
    };
  });

  const tenantProducts: TenantProduct[] = tenantProductsPage?.items ?? [];

  function resolveDisplayName(tp: TenantProduct): string {
    if (tp.custom_name) return tp.custom_name;
    const gp = globalLookup[tp.product_id];
    if (gp) {
      return gp.code ? `${gp.name} (${gp.code})` : gp.name;
    }
    // Fallback: show product ID if lookup hasn't loaded yet or product not found
    return loadingGlobalProducts ? "Loading..." : `Product ${tp.product_id.slice(0, 8)}...`;
  }

  const filtered = tenantProducts.filter((tp) =>
    resolveDisplayName(tp).toLowerCase().includes(search.toLowerCase())
  );

  function formatPackDisplay(tp: TenantProduct): string | null {
    const unit = tp.pack_size_unit ?? tp.tracking_unit;
    if (tp.pack_size_value != null && unit) {
      return `${tp.pack_size_value}${unit.toLowerCase()}`;
    }
    const gp = globalLookup[tp.product_id];
    if (gp) {
      return `${gp.pack_size_value}${gp.pack_size_unit.toLowerCase()}`;
    }
    return null;
  }

  // ── Toggle enable/disable ──────────────────────────────────────────────────
  const toggleMutation = useMutation({
    mutationFn: (tp: TenantProduct) =>
      productsApi.updateTenantProduct(tp.id, { is_enabled: !tp.is_enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-products"] });
      toast.success("Product updated.");
    },
    onError: () => toast.error("Failed to update product."),
  });

  // ── Edit ──────────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editingTp) throw new Error("No product selected.");
      const cost = parseFloat(editForm.default_unit_cost);
      const pack = parseFloat(editForm.pack_size_value);
      return productsApi.updateTenantProduct(editingTp.id, {
        custom_name: editForm.custom_name || undefined,
        tracking_unit: editForm.tracking_unit,
        pack_size_value: pack,
        pack_size_unit: editForm.tracking_unit,
        default_unit_cost: cost,
        currency: editForm.currency || undefined,
        is_enabled: editForm.is_enabled,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-products"] });
      setEditingTp(null);
      toast.success("Product updated successfully.");
    },
    onError: (err) => {
      setFormError(
        err instanceof ApiRequestError ? err.message : "Failed to update product."
      );
    },
  });

  // ── Remove ─────────────────────────────────────────────────────────────────
  const removeMutation = useMutation({
    mutationFn: (tpId: string) => productsApi.removeTenantProduct(tpId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-products"] });
      toast.success("Product removed from catalog.");
    },
    onError: () => toast.error("Failed to remove product."),
  });

  function openEdit(tp: TenantProduct) {
    setEditingTp(tp);
    setFormError(null);
    const gp = globalLookup[tp.product_id];
    const packVal =
      tp.pack_size_value != null && tp.pack_size_value !== undefined
        ? String(tp.pack_size_value)
        : gp
          ? String(gp.pack_size_value)
          : "";
    setEditForm({
      custom_name: tp.custom_name ?? "",
      tracking_unit: tp.tracking_unit,
      pack_size_value: packVal,
      default_unit_cost: tp.default_unit_cost?.toString() ?? "",
      currency: tp.currency ?? "USD",
      is_enabled: tp.is_enabled,
    });
  }

  return (
    <>
      {/* Search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-full"
          />
        </div>
        <span className="text-sm text-slate-400">{filtered.length} products</span>
      </div>

      {/* Grid */}
      {isLoading || loadingGlobalProducts ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {tenantProducts.length === 0
              ? "No products in your catalog yet. Browse the global catalog to add some."
              : "No products match your search."}
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {filtered.map((tp) => {
            const displayName = resolveDisplayName(tp);
            const packStr = formatPackDisplay(tp);
            return (
              <Card
                key={tp.id}
                className={`border shadow-sm transition-shadow hover:shadow-md ${
                  tp.is_enabled ? "border-slate-200" : "border-slate-100 opacity-60"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-semibold text-sm text-foreground leading-tight">
                      {displayName}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-xs shrink-0 ${
                        tp.is_enabled
                          ? "border-emerald-300 text-emerald-600 bg-emerald-50"
                          : "border-slate-200 text-slate-400"
                      }`}
                    >
                      {tp.is_enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mb-3">
                    {packStr && <span>Pack: {packStr}</span>}
                    <span>Unit: {tp.tracking_unit}</span>
                    {tp.default_unit_cost !== null && tp.default_unit_cost !== undefined ? (
                      <span>
                        Cost: {tp.currency ?? "USD"} {Number(tp.default_unit_cost).toFixed(4)}/
                        {costUnitLabel(tp.tracking_unit)}
                      </span>
                    ) : (
                      <span className="italic">No cost set</span>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleMutation.mutate(tp)}
                        disabled={toggleMutation.isPending}
                        className="text-slate-400 hover:text-primary transition-colors"
                        title={tp.is_enabled ? "Disable" : "Enable"}
                      >
                        {tp.is_enabled ? (
                          <ToggleRight className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => openEdit(tp)}
                        className="text-slate-400 hover:text-primary transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remove "${displayName}" from your catalog?`)) {
                            removeMutation.mutate(tp.id);
                          }
                        }}
                        disabled={removeMutation.isPending}
                        className="text-slate-400 hover:text-destructive transition-colors ml-auto"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </motion.div>
      )}

      {/* ─── Edit Dialog ─── */}
      <Dialog open={!!editingTp} onOpenChange={(o) => !o && setEditingTp(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Catalog Product</DialogTitle>
            <DialogDescription>
              Update cost, tracking unit, or custom name for this product.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {formError}
            </div>
          )}

          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Custom Name (optional)</Label>
              <Input
                placeholder="Leave blank to use global product name"
                value={editForm.custom_name}
                onChange={(e) => setEditForm((f) => ({ ...f, custom_name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tracking Unit</Label>
                <Select
                  value={editForm.tracking_unit}
                  onValueChange={(v) =>
                    setEditForm((f) => ({ ...f, tracking_unit: v as PackSizeUnit }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="G">Grams (G)</SelectItem>
                    <SelectItem value="ML">Milliliters (ML)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Input
                  placeholder="USD"
                  value={editForm.currency}
                  onChange={(e) => setEditForm((f) => ({ ...f, currency: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Pack size ({costUnitLabel(editForm.tracking_unit)})</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 60"
                value={editForm.pack_size_value}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, pack_size_value: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cost per {costUnitLabel(editForm.tracking_unit)}</Label>
              <Input
                type="number"
                min="0"
                step="0.0001"
                required
                placeholder="e.g. 0.35"
                value={editForm.default_unit_cost}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, default_unit_cost: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingTp(null)} className="rounded-full">
              Cancel
            </Button>
            <Button
              onClick={() => {
                setFormError(null);
                const cost = parseFloat(editForm.default_unit_cost.trim());
                if (
                  editForm.default_unit_cost.trim() === "" ||
                  !Number.isFinite(cost) ||
                  cost < 0
                ) {
                  setFormError(
                    `Enter a valid cost per ${costUnitLabel(editForm.tracking_unit)}.`
                  );
                  return;
                }
                const pack = parseFloat(editForm.pack_size_value.trim());
                if (
                  editForm.pack_size_value.trim() === "" ||
                  !Number.isFinite(pack) ||
                  pack <= 0
                ) {
                  setFormError("Enter a valid pack size (greater than zero).");
                  return;
                }
                updateMutation.mutate();
              }}
              disabled={updateMutation.isPending}
              className="bg-primary text-white hover:bg-primary/90 rounded-full"
            >
              {updateMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                </span>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Browse & Add Tab ─────────────────────────────────────────────────────────

function BrowseTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [selectedLineId, setSelectedLineId] = useState("");
  const [addingProduct, setAddingProduct] = useState<Product | null>(null);
  const [addForm, setAddForm] = useState<AddToCatalogForm>(defaultAddForm);
  const [formError, setFormError] = useState<string | null>(null);

  // ── Brands ─────────────────────────────────────────────────────────────────
  const { data: brandsPage, isLoading: loadingBrands } = useQuery({
    queryKey: ["brands"],
    queryFn: () => productsApi.listBrands(),
  });
  const brands: Brand[] = brandsPage?.items ?? [];

  // ── Product Lines (when brand selected) ───────────────────────────────────
  const { data: linesPage, isLoading: loadingLines } = useQuery({
    queryKey: ["product-lines", selectedBrandId],
    queryFn: () => productsApi.listProductLines(selectedBrandId),
    enabled: !!selectedBrandId,
  });
  const lines: ProductLine[] = linesPage?.items ?? [];

  // ── Products (when line selected) ─────────────────────────────────────────
  const { data: productsPage, isLoading: loadingProducts } = useQuery({
    queryKey: ["global-products", selectedLineId],
    queryFn: () => productsApi.listProducts({ product_line_id: selectedLineId }),
    enabled: !!selectedLineId,
  });
  const products: Product[] = productsPage?.items ?? [];

  // Existing tenant products to mark "already added"
  const { data: tenantProductsPage } = useQuery({
    queryKey: ["tenant-products", "catalog"],
    queryFn: () => productsApi.listTenantProducts({ page: 1, page_size: 200 }),
  });
  const existingProductIds = new Set(
    (tenantProductsPage?.items ?? []).map((tp) => tp.product_id)
  );

  // ── Add to catalog ─────────────────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: () => {
      if (!user || !addingProduct) throw new Error("Missing data.");
      const cost = parseFloat(addForm.default_unit_cost.trim());
      const pack = parseFloat(addForm.pack_size_value.trim());
      return productsApi.addTenantProduct({
        tenant_id: user.tenant_id,
        product_id: addingProduct.id,
        custom_name: addForm.custom_name || undefined,
        tracking_unit: addForm.tracking_unit,
        pack_size_value: pack,
        pack_size_unit: addForm.tracking_unit,
        default_unit_cost: cost,
        currency: addForm.currency || undefined,
        is_enabled: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-products"] });
      setAddingProduct(null);
      toast.success("Product added to your catalog.");
    },
    onError: (err) => {
      setFormError(
        err instanceof ApiRequestError ? err.message : "Failed to add product."
      );
    },
  });

  function openAdd(product: Product) {
    setAddingProduct(product);
    setFormError(null);
    setAddForm({
      custom_name: "",
      tracking_unit: product.pack_size_unit ?? "G",
      pack_size_value: String(product.pack_size_value ?? ""),
      default_unit_cost: "",
      currency: "USD",
    });
  }

  return (
    <>
      {/* Breadcrumb filter */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Brand
            </p>
            {loadingBrands ? (
              <Skeleton className="w-44 h-9" />
            ) : (
              <Select
                value={selectedBrandId}
                onValueChange={(v) => {
                  setSelectedBrandId(v);
                  setSelectedLineId("");
                }}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Select brand…" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedBrandId && (
            <>
              <ChevronRight className="w-4 h-4 text-slate-300 mt-5" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                  Product Line
                </p>
                {loadingLines ? (
                  <Skeleton className="w-44 h-9" />
                ) : (
                  <Select value={selectedLineId} onValueChange={setSelectedLineId}>
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="Select line…" />
                    </SelectTrigger>
                    <SelectContent>
                      {lines.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name}
                          <span className="ml-1 text-xs text-slate-400">({l.category})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Products list */}
      {!selectedBrandId ? (
        <div className="text-center py-16 text-slate-400">
          <PackagePlus className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select a brand to browse the global product catalog.</p>
        </div>
      ) : !selectedLineId ? (
        <div className="text-center py-10 text-slate-400 text-sm">
          Select a product line to see products.
        </div>
      ) : loadingProducts ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-sm">
          No products in this line.
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {products.map((p) => {
            const alreadyAdded = existingProductIds.has(p.id);
            return (
              <Card
                key={p.id}
                className={`border shadow-sm ${
                  alreadyAdded ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-semibold text-sm text-foreground leading-tight">
                      {p.name}
                    </p>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {p.code}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    {p.pack_size_value}
                    {p.pack_size_unit?.toLowerCase()}
                    {p.tone_family ? ` · ${p.tone_family}` : ""}
                  </p>
                  {alreadyAdded ? (
                    <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                      ✓ In your catalog
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full h-7 text-xs gap-1"
                      onClick={() => openAdd(p)}
                    >
                      <Plus className="w-3 h-3" /> Add to Catalog
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </motion.div>
      )}

      {/* ─── Add to Catalog Dialog ─── */}
      <Dialog open={!!addingProduct} onOpenChange={(o) => !o && setAddingProduct(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Add to Your Catalog</DialogTitle>
            <DialogDescription>
              Configure how you track and price{" "}
              <strong>{addingProduct?.name}</strong> in your salon.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {formError}
            </div>
          )}

          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Custom Name (optional)</Label>
              <Input
                placeholder={addingProduct?.name ?? ""}
                value={addForm.custom_name}
                onChange={(e) => setAddForm((f) => ({ ...f, custom_name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tracking Unit</Label>
                <Select
                  value={addForm.tracking_unit}
                  onValueChange={(v) =>
                    setAddForm((f) => ({ ...f, tracking_unit: v as PackSizeUnit }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="G">Grams (G)</SelectItem>
                    <SelectItem value="ML">Milliliters (ML)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Input
                  placeholder="USD"
                  value={addForm.currency}
                  onChange={(e) => setAddForm((f) => ({ ...f, currency: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Pack size ({costUnitLabel(addForm.tracking_unit)})</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 60"
                value={addForm.pack_size_value}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, pack_size_value: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cost per {costUnitLabel(addForm.tracking_unit)}</Label>
              <Input
                type="number"
                min="0"
                step="0.0001"
                required
                placeholder="e.g. 0.35"
                value={addForm.default_unit_cost}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, default_unit_cost: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setAddingProduct(null)}
              className="rounded-full"
              disabled={addMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setFormError(null);
                const cost = parseFloat(addForm.default_unit_cost.trim());
                if (
                  addForm.default_unit_cost.trim() === "" ||
                  !Number.isFinite(cost) ||
                  cost < 0
                ) {
                  setFormError(
                    `Enter a valid cost per ${costUnitLabel(addForm.tracking_unit)}.`
                  );
                  return;
                }
                const pack = parseFloat(addForm.pack_size_value.trim());
                if (
                  addForm.pack_size_value.trim() === "" ||
                  !Number.isFinite(pack) ||
                  pack <= 0
                ) {
                  setFormError("Enter a valid pack size (greater than zero).");
                  return;
                }
                addMutation.mutate();
              }}
              disabled={addMutation.isPending}
              className="bg-primary text-white hover:bg-primary/90 rounded-full"
            >
              {addMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Adding…
                </span>
              ) : (
                "Add to Catalog"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const { user } = useAuth();
  const canEdit = user?.role === "ADMIN" || user?.role === "MANAGER";

  const { data: tenantProductsPage } = useQuery({
    queryKey: ["tenant-products", "catalog"],
    queryFn: () => productsApi.listTenantProducts({ page: 1, page_size: 200 }),
  });
  const total = tenantProductsPage?.total ?? 0;
  const enabled = tenantProductsPage?.items.filter((tp) => tp.is_enabled).length ?? 0;

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Product Catalog</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Manage your salon&apos;s product catalog and browse the global product library
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "In Catalog", value: total, color: "border-blue-100 bg-blue-50" },
          { label: "Enabled", value: enabled, color: "border-emerald-100 bg-emerald-50" },
          {
            label: "Disabled",
            value: total - enabled,
            color: "border-slate-100 bg-slate-50",
          },
        ].map((s) => (
          <Card key={s.label} className={`border ${s.color} shadow-sm`}>
            <CardContent className="p-4">
              <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="catalog">
        <TabsList className="mb-4">
          <TabsTrigger value="catalog">My Catalog</TabsTrigger>
          {canEdit && <TabsTrigger value="browse">Browse &amp; Add</TabsTrigger>}
        </TabsList>

        <TabsContent value="catalog">
          <MyCatalogTab canEdit={canEdit} />
        </TabsContent>

        {canEdit && (
          <TabsContent value="browse">
            <BrowseTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}


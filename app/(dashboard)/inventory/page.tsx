"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  AlertTriangle,
  Plus,
  PackagePlus,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { inventoryApi } from "@/lib/api/inventory";
import { productsApi } from "@/lib/api/products";
import { ApiRequestError } from "@/lib/api/client";
import type {
  TenantProduct,
  TransactionType,
  Brand,
  ProductLine,
  PackSizeUnit,
} from "@/lib/types";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type DialogMode = "add-product" | "adjust" | null;

interface AdjustForm {
  inventoryItemId: string;
  txnType: TransactionType;
  qty: string;
  note: string;
}

interface AddProductForm {
  tenantProductId: string;
  /** Number of packs when catalog has a pack size; stored as packs × pack size → g/ml. */
  onHandPacks: string;
  /** Raw g/ml when no pack size is set on the product. */
  onHandDirect: string;
  reorderLevelQty: string;
}

const defaultAdjust: AdjustForm = {
  inventoryItemId: "",
  txnType: "PURCHASE",
  qty: "",
  note: "",
};

const defaultAddProduct: AddProductForm = {
  tenantProductId: "",
  onHandPacks: "0",
  onHandDirect: "",
  reorderLevelQty: "120",
};

// ─── Combined inventory row (item + tenant product details) ───────────────────

interface InventoryRow {
  itemId: string;
  tenantProductId: string;
  onHandQty: number;
  reorderLevelQty: number;
  updatedAt: string;
  displayName: string; // product name
  productCode: string; // e.g. "09N"
  brandLineName: string; // e.g. "Redken · Shades EQ"
  tone: string | null; // e.g. "Natural" (tone_family)
  trackingUnit: string;
  unitCost: number | null;
  /** e.g. 60 — used with onHandQty to show pack count */
  packSizeValue: number | null;
  packUnitLabel: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Inventory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const locationId = user?.default_location_id ?? "";

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low">("all");
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [adjust, setAdjust] = useState<AdjustForm>(defaultAdjust);
  const [addProduct, setAddProduct] = useState<AddProductForm>(defaultAddProduct);
  const [formError, setFormError] = useState<string | null>(null);

  // ── Fetch data ──────────────────────────────────────────────────────────────
  const { data: inventoryItems = [], isLoading: loadingItems } = useQuery({
    queryKey: ["inventory", "items", locationId],
    queryFn: () => inventoryApi.listItems(locationId),
    enabled: !!locationId,
  });

  // ── Fetch ALL tenant products (handle pagination) ───────────────────────────────
  const { data: tenantProductsPage, isLoading: loadingTenantProducts } = useQuery({
    queryKey: ["tenant-products", "all"],
    queryFn: async () => {
      // Fetch first page
      const firstPage = await productsApi.listTenantProducts({ page: 1, page_size: 100 });
      const allProducts = [...firstPage.items];
      
      // Fetch remaining pages if any
      const totalPages = firstPage.total_pages;
      if (totalPages > 1) {
        const remainingPages = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, i) =>
            productsApi.listTenantProducts({ page: i + 2, page_size: 100 })
          )
        );
        remainingPages.forEach((page) => {
          allProducts.push(...page.items);
        });
      }
      
      return { items: allProducts, total: firstPage.total };
    },
  });

  const tenantProducts: TenantProduct[] = tenantProductsPage?.items ?? [];

  // ── Fetch brands + product lines for enriched display ──────────────────────
  const { data: brandsPage } = useQuery({
    queryKey: ["brands"],
    queryFn: () => productsApi.listBrands(1, 100),
  });
  const brands: Brand[] = brandsPage?.items ?? [];
  const brandMap = Object.fromEntries(brands.map((b) => [b.id, b]));

  const productLineQueries = useQueries({
    queries: brands.map((brand) => ({
      queryKey: ["product-lines", brand.id],
      queryFn: () => productsApi.listProductLines(brand.id, 1, 100),
      staleTime: 5 * 60 * 1000,
      enabled: !!brand.id,
    })),
  });
  const lineMap: Record<string, ProductLine> = {};
  productLineQueries.forEach((q) => {
    q.data?.items.forEach((line) => {
      lineMap[line.id] = line;
    });
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
  const globalProductLookup: Record<
    string,
    {
      name: string;
      code: string;
      tone_family: string | null;
      product_line_id: string;
      pack_size_value: number;
      pack_size_unit: PackSizeUnit;
    }
  > = {};
  globalProductsPage?.items.forEach((gp) => {
    globalProductLookup[gp.id] = {
      name: gp.name,
      code: gp.code,
      tone_family: gp.tone_family ?? null,
      product_line_id: gp.product_line_id,
      pack_size_value: gp.pack_size_value,
      pack_size_unit: gp.pack_size_unit,
    };
  });

  function unitLabel(u: PackSizeUnit | undefined): string {
    return u === "ML" ? "ml" : "g";
  }

  function resolvePackSizeForTenant(
    tp: TenantProduct | undefined
  ): { value: number; unit: PackSizeUnit } | null {
    if (!tp) return null;
    const v = tp.pack_size_value;
    const u = (tp.pack_size_unit ?? tp.tracking_unit) as PackSizeUnit;
    if (v != null && v > 0 && u) {
      return { value: v, unit: u };
    }
    const gp = globalProductLookup[tp.product_id];
    if (gp && gp.pack_size_value > 0) {
      return { value: gp.pack_size_value, unit: gp.pack_size_unit };
    }
    return null;
  }

  function formatPackCountLine(total: number, packValue: number): string {
    if (packValue <= 0 || !Number.isFinite(total)) return "—";
    const packs = total / packValue;
    if (!Number.isFinite(packs)) return "—";
    const rounded = Math.round(packs * 100) / 100;
    const s = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/\.?0+$/, "");
    return s;
  }

  const loadingProducts = loadingTenantProducts || loadingGlobalProducts;

  function resolveDisplayName(tp: TenantProduct | undefined, fallback: string): string {
    if (!tp) return fallback;
    if (tp.custom_name) return tp.custom_name;
    const gp = globalProductLookup[tp.product_id];
    return gp ? gp.name : fallback;
  }

  // Note: resolveProductName was removed as it was unused

  function resolveBrandLine(tp: TenantProduct | undefined): string {
    if (!tp) return "—";
    const gp = globalProductLookup[tp.product_id];
    if (!gp) return "—";
    const line = lineMap[gp.product_line_id];
    if (!line) return "—";
    const brand = brandMap[line.brand_id];
    return brand ? `${brand.name} · ${line.name}` : line.name;
  }

  function resolveProductCode(tp: TenantProduct | undefined): string {
    if (!tp) return "";
    const gp = globalProductLookup[tp.product_id];
    return gp?.code ?? "";
  }

  function resolveTone(tp: TenantProduct | undefined): string | null {
    if (!tp) return null;
    const gp = globalProductLookup[tp.product_id];
    return gp?.tone_family ?? null;
  }

  // Build merged rows
  const rows: InventoryRow[] = inventoryItems.map((inv) => {
    const tp = tenantProducts.find((p) => p.id === inv.tenant_product_id);
    // If tenant product not found, show a warning but still display the row
    if (!tp && !loadingProducts) {
      console.warn(`Tenant product not found for inventory item ${inv.id}:`, inv.tenant_product_id);
    }
    const pack = resolvePackSizeForTenant(tp);
    return {
      itemId: inv.id,
      tenantProductId: inv.tenant_product_id,
      onHandQty: inv.on_hand_qty,
      reorderLevelQty: inv.reorder_level_qty,
      updatedAt: inv.updated_at,
      displayName: tp ? resolveDisplayName(tp, inv.tenant_product_id) : `[Product ${inv.tenant_product_id.slice(0, 8)}...]`,
      productCode: resolveProductCode(tp),
      brandLineName: resolveBrandLine(tp),
      tone: resolveTone(tp),
      trackingUnit: tp?.tracking_unit?.toLowerCase() ?? "g",
      unitCost: tp?.default_unit_cost ?? null,
      packSizeValue: pack ? pack.value : null,
      packUnitLabel: pack ? unitLabel(pack.unit) : "g",
    };
  });

  // Products not yet in inventory (available to add)
  const existingTpIds = new Set(inventoryItems.map((i) => i.tenant_product_id));
  const availableToAdd = tenantProducts.filter(
    (tp) => tp.is_enabled && !existingTpIds.has(tp.id)
  );

  // Filter rows
  const filtered = rows.filter((r) => {
    const matchesSearch = r.displayName.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || r.onHandQty <= r.reorderLevelQty;
    return matchesSearch && matchesFilter;
  });

  const lowCount = rows.filter((r) => r.onHandQty <= r.reorderLevelQty).length;

  // ── Add to inventory ────────────────────────────────────────────────────────
  const addItemMutation = useMutation({
    mutationFn: () => {
      if (!user || !locationId) throw new Error("No location selected.");
      const tp = tenantProducts.find((p) => p.id === addProduct.tenantProductId);
      const pack = resolvePackSizeForTenant(tp);
      let onHandQty: number;
      if (pack && pack.value > 0) {
        const packs = parseFloat(addProduct.onHandPacks.trim());
        onHandQty = Number.isFinite(packs) ? packs * pack.value : 0;
      } else {
        onHandQty = parseFloat(addProduct.onHandDirect.trim()) || 0;
      }
      return inventoryApi.createItem({
        tenant_id: user.tenant_id,
        location_id: locationId,
        tenant_product_id: addProduct.tenantProductId,
        on_hand_qty: onHandQty,
        reorder_level_qty: parseFloat(addProduct.reorderLevelQty) || 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setAddProduct(defaultAddProduct);
      setDialogMode(null);
      toast.success("Product added to inventory.");
    },
    onError: (err) => {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : "Failed to add product to inventory.";
      setFormError(msg);
    },
  });

  // ── Adjust stock ────────────────────────────────────────────────────────────
  const adjustMutation = useMutation({
    mutationFn: () => {
      if (!user) throw new Error("Not authenticated.");
      const qty = parseFloat(adjust.qty);
      const isAddTransaction =
        adjust.txnType === "PURCHASE" || adjust.txnType === "RETURN";
      const qtyDelta = isAddTransaction ? Math.abs(qty) : -Math.abs(qty);
      return inventoryApi.createTransaction({
        tenant_id: user.tenant_id,
        inventory_item_id: adjust.inventoryItemId,
        user_id: user.id,
        txn_type: adjust.txnType,
        qty_delta: qtyDelta,
        note: adjust.note || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setAdjust(defaultAdjust);
      setDialogMode(null);
      toast.success("Stock adjustment saved.");
    },
    onError: (err) => {
      const msg =
        err instanceof ApiRequestError ? err.message : "Failed to save adjustment.";
      setFormError(msg);
    },
  });

  const isLoading = loadingItems || loadingProducts;

  const addSelectedTp = tenantProducts.find((p) => p.id === addProduct.tenantProductId);
  const addPack = resolvePackSizeForTenant(addSelectedTp);
  const addPacksNum = parseFloat(addProduct.onHandPacks.trim());
  const addDirectNum = parseFloat(addProduct.onHandDirect.trim());
  const addPreviewTotal =
    addPack && addPack.value > 0
      ? Number.isFinite(addPacksNum)
        ? addPacksNum * addPack.value
        : 0
      : Number.isFinite(addDirectNum)
        ? addDirectNum
        : 0;
  const addTu = addSelectedTp?.tracking_unit
    ? unitLabel(addSelectedTp.tracking_unit as PackSizeUnit)
    : "g";

  // ── No location configured ──────────────────────────────────────────────────
  if (!locationId && !isLoading) {
    return (
      <div className="space-y-6 w-full">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Inventory</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Track product stock levels in grams &amp; milliliters
          </p>
        </div>
        <Card className="border border-amber-200 bg-amber-50 shadow-sm">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
            <p className="font-semibold text-foreground mb-1">No default location set</p>
            <p className="text-sm text-slate-500">
              Ask your administrator to assign a default location to your user account.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Inventory</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Track product stock levels in grams &amp; milliliters
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Total Products",
            value: rows.length,
            color: "border-blue-100 bg-blue-50",
          },
          { label: "Low Stock", value: lowCount, color: "border-amber-100 bg-amber-50" },
          {
            label: "Well Stocked",
            value: rows.length - lowCount,
            color: "border-emerald-100 bg-emerald-50",
          },
        ].map((s) => (
          <Card key={s.label} className={`border ${s.color} shadow-sm`}>
            <CardContent className="p-4">
              {isLoading ? (
                <Skeleton className="w-10 h-7 mb-1" />
              ) : (
                <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
              )}
              <p className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-full"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-colors",
              filter === "all"
                ? "bg-primary text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            )}
          >
            All ({rows.length})
          </button>
          <button
            onClick={() => setFilter("low")}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5",
              filter === "low"
                ? "bg-amber-500 text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            )}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Low Stock ({lowCount})
          </button>
          {user?.role !== "EMPLOYEE" && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 font-semibold rounded-full h-9"
                onClick={() => {
                  setAdjust(defaultAdjust);
                  setFormError(null);
                  setDialogMode("adjust");
                }}
                disabled={rows.length === 0}
              >
                <PackagePlus className="w-3.5 h-3.5" />
                Adjust Stock
              </Button>
              <Button
                size="sm"
                className="bg-primary text-white hover:bg-primary/90 rounded-full gap-1.5 font-semibold h-9"
                onClick={() => {
                  setAddProduct(defaultAddProduct);
                  setFormError(null);
                  setDialogMode("add-product");
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Product
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 border-b border-slate-200">
                  <TableHead className="font-semibold text-foreground">Product</TableHead>
                  <TableHead className="font-semibold text-foreground hidden md:table-cell">Brand / Line</TableHead>
                  <TableHead className="font-semibold text-foreground hidden lg:table-cell">Tone</TableHead>
                  <TableHead className="text-right font-semibold text-foreground hidden xl:table-cell">
                    Pack size
                  </TableHead>
                  <TableHead className="text-right font-semibold text-foreground hidden lg:table-cell">
                    Packs
                  </TableHead>
                  <TableHead className="text-right font-semibold text-foreground">Total</TableHead>
                  <TableHead className="text-right font-semibold text-foreground hidden sm:table-cell">Reorder At</TableHead>
                  <TableHead className="text-right font-semibold text-foreground hidden lg:table-cell">Unit Cost</TableHead>
                  <TableHead className="font-semibold text-foreground">Stock Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="w-full h-4" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <>
                    {filtered.map((r) => {
                      const isLow = r.onHandQty <= r.reorderLevelQty;
                      const pct = Math.min(
                        (r.onHandQty / Math.max(r.reorderLevelQty * 3, 1)) * 100,
                        100
                      );
                      return (
                        <TableRow
                          key={r.itemId}
                          className={cn(
                            "hover:bg-slate-50 transition-colors",
                            isLow && "bg-amber-50/50"
                          )}
                        >
                          {/* Product — code + name stacked */}
                          <TableCell>
                            {r.productCode && (
                              <p className="text-xs font-bold text-primary leading-none mb-0.5">
                                {r.productCode}
                              </p>
                            )}
                            <p className="font-semibold text-foreground text-sm leading-snug">
                              {r.displayName}
                            </p>
                          </TableCell>
                          {/* Brand · Line */}
                          <TableCell className="text-sm text-slate-500 hidden md:table-cell">
                            {r.brandLineName}
                          </TableCell>
                          {/* Tone */}
                          <TableCell className="text-sm text-slate-500 hidden lg:table-cell">
                            {r.tone ?? "—"}
                          </TableCell>
                          <TableCell className="text-right text-sm text-slate-600 tabular-nums hidden xl:table-cell">
                            {r.packSizeValue != null ? (
                              <>
                                {r.packSizeValue}
                                {r.packUnitLabel}
                              </>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium text-foreground tabular-nums hidden lg:table-cell">
                            {r.packSizeValue != null
                              ? formatPackCountLine(r.onHandQty, r.packSizeValue)
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-foreground tabular-nums">
                            <span className="block sm:inline">
                              {r.onHandQty}
                              {r.trackingUnit}
                            </span>
                            {r.packSizeValue != null && (
                              <span className="block text-xs font-normal text-slate-500 sm:hidden mt-0.5">
                                {formatPackCountLine(r.onHandQty, r.packSizeValue)} packs × {r.packSizeValue}
                                {r.packUnitLabel}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-sm text-slate-500 hidden sm:table-cell">
                            {r.reorderLevelQty}
                            {r.trackingUnit}
                          </TableCell>
                          <TableCell className="text-right text-sm text-slate-600 hidden lg:table-cell">
                            {r.unitCost !== null
                              ? `$${r.unitCost.toFixed(2)}/${r.trackingUnit}`
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    isLow ? "bg-amber-400" : "bg-primary"
                                  )}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              {isLow ? (
                                <Badge
                                  variant="outline"
                                  className="text-xs border-amber-300 text-amber-600 bg-amber-50"
                                >
                                  Low
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-xs border-emerald-300 text-emerald-600 bg-emerald-50"
                                >
                                  OK
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="text-center text-slate-400 py-12"
                        >
                          {rows.length === 0
                            ? "No products in inventory yet. Add your first product."
                            : "No products match your search"}
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Add Product to Inventory Dialog ─── */}
      <Dialog
        open={dialogMode === "add-product"}
        onOpenChange={(o) => !o && setDialogMode(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Add Product to Inventory</DialogTitle>
            <DialogDescription>
              Stock is stored in grams or milliliters. With a pack size, enter how many packs you
              have — we calculate the total (e.g. 5 packs × 60g = 300g).
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 font-medium">
              {formError}
            </div>
          )}

          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>
                Product <span className="text-red-500">*</span>
              </Label>
              {loadingProducts ? (
                <Skeleton className="w-full h-10" />
              ) : (
                <Select
                  value={addProduct.tenantProductId}
                  onValueChange={(v) =>
                    setAddProduct((p) => ({
                      ...p,
                      tenantProductId: v,
                      onHandPacks: "0",
                      onHandDirect: "",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product…" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableToAdd.length === 0 ? (
                      <SelectItem value="__none__" disabled>
                        All catalog products are already tracked
                      </SelectItem>
                    ) : (
                      availableToAdd.map((tp) => {
                        const gp = globalProductLookup[tp.product_id];
                        const name = tp.custom_name ?? (gp ? `${gp.code} ${gp.name}` : tp.product_id);
                        return (
                          <SelectItem key={tp.id} value={tp.id}>
                            {name} ({tp.tracking_unit})
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            {addPack && addPack.value > 0 ? (
              <>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <span className="text-slate-500">Pack size</span>{" "}
                  <span className="font-semibold text-foreground">
                    {addPack.value}
                    {unitLabel(addPack.unit)}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <Label>On hand (packs)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={addProduct.onHandPacks}
                    onChange={(e) =>
                      setAddProduct((p) => ({ ...p, onHandPacks: e.target.value }))
                    }
                  />
                  <p className="text-xs text-slate-500">
                    Total on hand:{" "}
                    <span className="font-medium text-foreground tabular-nums">
                      {addPreviewTotal}
                      {addTu}
                    </span>{" "}
                    ({addProduct.onHandPacks.trim() || "0"} × {addPack.value}
                    {unitLabel(addPack.unit)})
                  </p>
                </div>
              </>
            ) : (
              addSelectedTp && (
                <div className="space-y-1.5">
                  <Label>On hand ({addTu})</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={addProduct.onHandDirect}
                    onChange={(e) =>
                      setAddProduct((p) => ({ ...p, onHandDirect: e.target.value }))
                    }
                  />
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-1.5">
                    No pack size on this catalog product — enter total weight or volume directly.
                    Set pack size under Products → catalog if you prefer counting by pack.
                  </p>
                </div>
              )
            )}

            <div className="space-y-1.5">
              <Label>Reorder level ({addTu})</Label>
              <Input
                type="number"
                min="0"
                placeholder="120"
                value={addProduct.reorderLevelQty}
                onChange={(e) =>
                  setAddProduct((p) => ({ ...p, reorderLevelQty: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogMode(null)}
              className="rounded-full"
              disabled={addItemMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setFormError(null);
                addItemMutation.mutate();
              }}
              disabled={!addProduct.tenantProductId || addItemMutation.isPending}
              className="bg-primary text-white hover:bg-primary/90 rounded-full"
            >
              {addItemMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding…
                </div>
              ) : (
                "Add to Inventory"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Adjust Stock Dialog ─── */}
      <Dialog
        open={dialogMode === "adjust"}
        onOpenChange={(o) => !o && setDialogMode(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Adjust Stock</DialogTitle>
            <DialogDescription>
              Record a purchase, adjustment, waste or return for a product.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 font-medium">
              {formError}
            </div>
          )}

          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>
                Product <span className="text-red-500">*</span>
              </Label>
              <Select
                value={adjust.inventoryItemId}
                onValueChange={(v) => setAdjust((a) => ({ ...a, inventoryItemId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product…" />
                </SelectTrigger>
                <SelectContent>
                  {rows.map((r) => (
                    <SelectItem key={r.itemId} value={r.itemId}>
                      {r.displayName} ({r.onHandQty}
                      {r.trackingUnit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>
                Transaction Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={adjust.txnType}
                onValueChange={(v) =>
                  setAdjust((a) => ({ ...a, txnType: v as TransactionType }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PURCHASE">Purchase (add stock)</SelectItem>
                  <SelectItem value="RETURN">Return (add stock)</SelectItem>
                  <SelectItem value="ADJUST">Manual Adjust (subtract)</SelectItem>
                  <SelectItem value="WASTE">Waste (subtract)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>
                Quantity (
                {rows.find((r) => r.itemId === adjust.inventoryItemId)?.trackingUnit ?? "g"}){" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                placeholder="e.g. 60"
                value={adjust.qty}
                onChange={(e) => setAdjust((a) => ({ ...a, qty: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Note (optional)</Label>
              <Input
                placeholder="e.g. Received new order"
                value={adjust.note}
                onChange={(e) => setAdjust((a) => ({ ...a, note: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogMode(null)}
              className="rounded-full"
              disabled={adjustMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setFormError(null);
                adjustMutation.mutate();
              }}
              disabled={!adjust.inventoryItemId || !adjust.qty || adjustMutation.isPending}
              className="bg-primary text-white hover:bg-primary/90 rounded-full"
            >
              {adjustMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </div>
              ) : (
                "Save Adjustment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

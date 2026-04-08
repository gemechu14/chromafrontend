"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FlaskConical, Plus, Trash2, Save, User, Loader2, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { customersApi } from "@/lib/api/customers";
import { tenantsApi } from "@/lib/api/tenants";
import { productsApi } from "@/lib/api/products";
import { formulasApi } from "@/lib/api/formulas";
import { inventoryApi } from "@/lib/api/inventory";
import { useAuth } from "@/contexts/auth-context";
import type { Formula, TenantProduct, ProductCategory, ProductLine } from "@/lib/types";
import { ApiRequestError } from "@/lib/api/client";
import {
  mixColors,
  normalizeCatalogHex,
  getNonColorLayerColor,
} from "@/lib/utils/color-mixer";
import { FormulaDroplet, type DropletItem } from "@/components/formula/FormulaDroplet";

/** Resolve visual properties for a formula item in the droplet preview (API uses `hex_code`). */
function resolveDropletVisual(
  gp:
    | { hex_code: string | null; product_line_id: string }
    | null
    | undefined,
  lineCategory: ProductCategory | undefined
): {
  color: string;
  hex_code: string | null;
  isColorCategory: boolean;
  contributesToMix: boolean;
  categoryLabel: string;
} {
  const catLabelFor = (c: ProductCategory | undefined): string => {
    if (c === undefined) return "Other";
    if (c === "COLOR") return "Color";
    if (c === "DEVELOPER") return "Developer";
    if (c === "TONER") return "Toner";
    if (c === "TREATMENT") return "Treatment";
    return String(c);
  };

  if (!gp) {
    return {
      color: "#94a3b8",
      hex_code: null,
      isColorCategory: lineCategory === "COLOR",
      contributesToMix: false,
      categoryLabel: catLabelFor(lineCategory),
    };
  }

  const normHex = normalizeCatalogHex(gp.hex_code);

  // TONER can also carry pigment hex; preview it in the cylinder when hex exists.
  if (lineCategory === "TONER") {
    return {
      color: normHex ?? getNonColorLayerColor("TONER"),
      hex_code: normHex,
      isColorCategory: false,
      contributesToMix: normHex !== null,
      categoryLabel: catLabelFor(lineCategory),
    };
  }

  if (lineCategory === "DEVELOPER" || lineCategory === "TREATMENT") {
    return {
      color: getNonColorLayerColor(lineCategory),
      hex_code: null,
      isColorCategory: false,
      contributesToMix: false,
      categoryLabel: catLabelFor(lineCategory),
    };
  }

  if (lineCategory === "COLOR") {
    return {
      color: normHex ?? "#94a3b8",
      hex_code: normHex,
      isColorCategory: true,
      contributesToMix: normHex !== null,
      categoryLabel: "Color",
    };
  }

  // Unknown line (not in map) or uncategorized — do not guess COLOR from hex
  return {
    color: "#94a3b8",
    hex_code: null,
    isColorCategory: false,
    contributesToMix: false,
    categoryLabel: catLabelFor(lineCategory),
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface MixItem {
  tenantProductId: string;
  amount: string;
}

// ─── Customer History Sidebar ─────────────────────────────────────────────────

function CustomerHistorySidebar({
  customerId,
  tenantProducts,
  globalProductLookup,
  onSelectFormula,
}: {
  customerId: string;
  tenantProducts: TenantProduct[];
  globalProductLookup: Record<string, { name: string; code: string }>;
  onSelectFormula: (formula: Formula) => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["formulas", "customer", customerId],
    queryFn: () => formulasApi.list({ customer_id: customerId, page: 1, page_size: 20 }),
    enabled: !!customerId,
  });

  const history: Formula[] = data?.items ?? [];

  function resolveProductName(tenantProductId: string): string {
    const tp = tenantProducts.find((p) => p.id === tenantProductId);
    if (!tp) return tenantProductId;
    if (tp.custom_name) return tp.custom_name;
    const gp = globalProductLookup[tp.product_id];
    return gp ? `${gp.name} (${gp.code})` : tp.product_id;
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="w-full h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return <p className="text-sm text-muted-foreground">No previous formulas</p>;
  }

  return (
    <div className="space-y-3">
      {history.map((f) => {
        const cost = f.formula_items.reduce(
          (sum, fi) => sum + fi.cost_at_time * fi.amount_used,
          0
        );
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onSelectFormula(f)}
            className="w-full text-left p-3 rounded-lg bg-muted/40 space-y-1 hover:bg-muted/60 transition-colors border border-transparent hover:border-border/60"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {f.formula_name ?? f.service_type ?? "Formula"}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(f.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "2-digit",
                })}
              </span>
            </div>
            {f.formula_items.map((fi) => (
              <p key={fi.id} className="text-xs text-muted-foreground">
                {fi.amount_used}g/ml{" "}
                {resolveProductName(fi.tenant_product_id)}
              </p>
            ))}
            {cost > 0 && (
              <p className="text-xs font-medium text-primary">${cost.toFixed(2)}</p>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FormulaBuilder() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [formulaName, setFormulaName] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [notes, setNotes] = useState("");
  const [mixItems, setMixItems] = useState<MixItem[]>([
    { tenantProductId: "", amount: "" },
  ]);

  // ── Locations: formula always uses the user's default location (read-only in UI) ──
  const { data: locationsPage, isLoading: loadingLocations } = useQuery({
    queryKey: ["locations", user?.tenant_id, "formula-builder"],
    queryFn: () => tenantsApi.listLocations(user!.tenant_id),
    enabled: !!user?.tenant_id,
  });
  const locations = locationsPage?.items ?? [];

  const formulaLocationId = (() => {
    if (!user || locations.length === 0) return "";
    if (user.default_location_id && locations.some((l) => l.id === user.default_location_id)) {
      return user.default_location_id;
    }
    if (locations.length === 1) return locations[0].id;
    return "";
  })();

  const formulaLocationName =
    (formulaLocationId && locations.find((l) => l.id === formulaLocationId)?.name) ?? "";

  // ── Inventory at default location (for product dropdown: in stock only) ─────────
  const { data: inventoryItems = [], isLoading: loadingInventory } = useQuery({
    queryKey: ["inventory", "items", formulaLocationId, "formula-builder"],
    queryFn: () => inventoryApi.listItems(formulaLocationId),
    enabled: !!formulaLocationId,
  });

  const tenantProductIdsInStock = new Set(
    inventoryItems.filter((inv) => inv.on_hand_qty > 0).map((inv) => inv.tenant_product_id)
  );

  // ── Fetch customers ─────────────────────────────────────────────────────────
  const { data: customersPage, isLoading: loadingCustomers } = useQuery({
    queryKey: ["customers", "formula-builder"],
    queryFn: () => customersApi.list({ page: 1, page_size: 100 }),
  });
  const customers = customersPage?.items ?? [];

  // ── Fetch enabled tenant products ───────────────────────────────────────────
  const { data: tenantProductsPage, isLoading: loadingTenantProducts, error: productsError } = useQuery({
    queryKey: ["tenant-products", "enabled"],
    queryFn: async () => {
      // Fetch first page
      const firstPage = await productsApi.listTenantProducts({ enabled_only: true, page: 1, page_size: 100 });
      const allProducts = [...firstPage.items];
      
      // Fetch remaining pages if any
      const totalPages = firstPage.total_pages;
      if (totalPages > 1) {
        const remainingPages = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, i) =>
            productsApi.listTenantProducts({ enabled_only: true, page: i + 2, page_size: 100 })
          )
        );
        remainingPages.forEach((page) => {
          allProducts.push(...page.items);
        });
      }
      
      return { items: allProducts, total: firstPage.total };
    },
  });
  const tenantProducts = tenantProductsPage?.items ?? [];

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

  // ── Product lines (per brand) — API uses brand_id; category + name live on the line ──
  const { data: productLinesData, isLoading: loadingProductLines } = useQuery({
    queryKey: ["product-lines", "all-by-brand", "formula-builder"],
    queryFn: async () => {
      const brandsPage = await productsApi.listBrands(1, 500);
      const allLines: ProductLine[] = [];
      for (const b of brandsPage.items) {
        let page = 1;
        let totalPages = 1;
        do {
          const res = await productsApi.listProductLines(b.id, page, 100);
          allLines.push(...res.items);
          totalPages = res.total_pages;
          page += 1;
        } while (page <= totalPages);
      }
      return { items: allLines };
    },
  });

  const lineMetaById: Record<string, { category: ProductCategory; name: string }> = {};
  productLinesData?.items.forEach((line) => {
    lineMetaById[line.id] = { category: line.category, name: line.name };
  });
  
  // Build global product lookup map
  const globalProductLookup: Record<string, {
    name: string;
    code: string;
    tone_family: string | null;
    hex_code: string | null;
    product_line_id: string;
  }> = {};
  globalProductsPage?.items.forEach((gp) => {
    globalProductLookup[gp.id] = {
      name: gp.name,
      code: gp.code,
      tone_family: gp.tone_family ?? null,
      hex_code: gp.hex_code ?? null,
      product_line_id: gp.product_line_id,
    };
  });

  const loadingProducts =
    loadingTenantProducts || loadingGlobalProducts || loadingInventory || loadingProductLines;

  function mixProductLabel(p: TenantProduct): string {
    if (p.custom_name?.trim()) return p.custom_name;
    const gp = globalProductLookup[p.product_id];
    return gp ? `${gp.name} (${gp.code})` : p.product_id || `Product ${p.id.slice(0, 8)}`;
  }

  function mixProductsForRow(selectedTenantProductId: string): TenantProduct[] {
    const inStock = tenantProducts.filter((p) => tenantProductIdsInStock.has(p.id));
    if (selectedTenantProductId && !inStock.some((p) => p.id === selectedTenantProductId)) {
      const extra = tenantProducts.find((p) => p.id === selectedTenantProductId);
      if (extra) return [extra, ...inStock];
    }
    return inStock;
  }

  // ── Mix item helpers ─────────────────────────────────────────────────────────
  const addItem = () =>
    setMixItems([...mixItems, { tenantProductId: "", amount: "" }]);

  const removeItem = (i: number) =>
    setMixItems(mixItems.filter((_, idx) => idx !== i));

  const updateItem = (i: number, field: keyof MixItem, val: string) => {
    const updated = [...mixItems];
    updated[i] = { ...updated[i], [field]: val };
    setMixItems(updated);
  };

  // ── Cost calculation ─────────────────────────────────────────────────────────
  const totalCost = mixItems.reduce((sum, item) => {
    const tp = tenantProducts.find((p) => p.id === item.tenantProductId);
    const amt = parseFloat(item.amount) || 0;
    return sum + (tp?.default_unit_cost ?? 0) * amt;
  }, 0);

  const totalWeight = mixItems.reduce(
    (sum, item) => sum + (parseFloat(item.amount) || 0),
    0
  );
  const totalByUnit = mixItems.reduce(
    (acc, item) => {
      const amt = parseFloat(item.amount) || 0;
      if (!item.tenantProductId || amt <= 0) return acc;
      const tp = tenantProducts.find((p) => p.id === item.tenantProductId);
      const unit = tp?.tracking_unit?.toUpperCase() === "ML" ? "ml" : "g";
      acc[unit] += amt;
      return acc;
    },
    { g: 0, ml: 0 }
  );

  // ── Droplet items + mixed color (pigment hex only; developers excluded) ─────
  const dropletItems: DropletItem[] = mixItems
    .filter((item) => item.tenantProductId && parseFloat(item.amount) > 0)
    .map((item) => {
      const tp = tenantProducts.find((p) => p.id === item.tenantProductId);
      const gp = tp ? globalProductLookup[tp.product_id] : null;
      const cat = gp ? lineMetaById[gp.product_line_id]?.category : undefined;
      const productLineName = gp ? lineMetaById[gp.product_line_id]?.name ?? null : null;
      const v = resolveDropletVisual(gp, cat);
      return {
        color: v.color,
        amount: parseFloat(item.amount) || 0,
        label: tp ? mixProductLabel(tp) : "Unknown",
        unitLabel: tp?.tracking_unit?.toUpperCase() === "ML" ? "ml" : "g",
        hex_code: v.hex_code,
        isColorCategory: v.isColorCategory,
        contributesToMix: v.contributesToMix,
        categoryLabel: v.categoryLabel,
        product_line_name: productLineName,
      };
    });

  const mixedColor = (() => {
    const parts = dropletItems
      .filter((d) => d.contributesToMix)
      .map((d) => ({ color: d.color, amount: d.amount }));
    return parts.length > 0 ? mixColors(parts) : "#CCCCCC";
  })();

  const formulaUnitLabel = (() => {
    const first = mixItems.find((i) => i.tenantProductId && parseFloat(i.amount) > 0);
    if (!first) return "g";
    const tp = tenantProducts.find((p) => p.id === first.tenantProductId);
    return tp?.tracking_unit?.toUpperCase() === "ML" ? "ml" : "g";
  })();

  // ── Save formula ─────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: () => {
      if (!user) throw new Error("Not authenticated.");
      const locationId = formulaLocationId;
      if (!locationId) {
        throw new Error(
          locations.length === 0
            ? "No salon locations found. Add a location first."
            : "Set your default location (Team) or ensure this salon has exactly one location."
        );
      }

      const validItems = mixItems.filter(
        (i) => i.tenantProductId && parseFloat(i.amount) > 0
      );
      if (validItems.length === 0) throw new Error("Add at least one product with an amount.");

      return formulasApi.create({
        tenant_id: user.tenant_id,
        location_id: locationId,
        customer_id: selectedCustomer,
        created_by_user_id: user.id,
        formula_name: formulaName || undefined,
        service_type: serviceType || undefined,
        notes: notes || undefined,
        items: validItems.map((i) => {
          const tp = tenantProducts.find((p) => p.id === i.tenantProductId);
          return {
            tenant_product_id: i.tenantProductId,
            amount_used: parseFloat(i.amount),
            cost_at_time: tp?.default_unit_cost ?? 0,
          };
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formulas"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Formula saved! Inventory deducted automatically.");
      setMixItems([{ tenantProductId: "", amount: "" }]);
      setFormulaName("");
      setNotes("");
      setServiceType("");
    },
    onError: (err) => {
      if (err instanceof ApiRequestError) {
        // Check if this is an insufficient inventory error
        const detail = err.detail as { insufficient_items?: Array<{
          tenant_product_id: string;
          product_name: string;
          tracking_unit: string;
          amount_needed: number;
          available: number;
          reason: string;
        }> } | undefined;

        if (detail?.insufficient_items && detail.insufficient_items.length > 0) {
          // Build detailed error message
          const items = detail.insufficient_items;
          const productMessages = items.map((item) => {
            const shortfall = item.amount_needed - item.available;
            return `• ${item.product_name}: Need ${item.amount_needed}${item.tracking_unit}, have ${item.available}${item.tracking_unit} (short ${shortfall}${item.tracking_unit})`;
          });

          const fullMessage = `${err.message}\n\n${productMessages.join("\n")}`;
          toast.error(fullMessage);
        } else {
          toast.error(err.message);
        }
      } else {
        const msg = (err as Error).message ?? "Failed to save formula.";
        toast.error(msg);
      }
    },
  });

  function handleSave() {
    if (!selectedCustomer) {
      toast.error("Please select a customer.");
      return;
    }
    const locationId = formulaLocationId;
    if (!locationId) {
      toast.error(
        locations.length === 0
          ? "Add a salon location before saving formulas."
          : "Set your default location under Team before saving formulas."
      );
      return;
    }
    const validItems = mixItems.filter(
      (i) => i.tenantProductId && parseFloat(i.amount) > 0
    );
    if (validItems.length === 0) {
      toast.error("Add at least one product with an amount.");
      return;
    }
    saveMutation.mutate();
  }

  function handleSelectPastFormula(formula: Formula) {
    setFormulaName(formula.formula_name ?? "");
    setServiceType(formula.service_type ?? "");
    setNotes(formula.notes ?? "");
    const loadedItems = formula.formula_items.map((fi) => ({
      tenantProductId: fi.tenant_product_id,
      amount: fi.amount_used > 0 ? String(fi.amount_used) : "",
    }));
    setMixItems(loadedItems.length > 0 ? loadedItems : [{ tenantProductId: "", amount: "" }]);
    toast.success("Loaded formula from history.");
  }

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-3xl font-display font-semibold">Formula Builder</h1>
        <p className="text-muted-foreground mt-1">
          Create and save color formulas for your clients. Inventory is deducted automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main builder */}
        <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1">
          {/* Client & Service */}
          <Card className="shadow-card border-border/60">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Client &amp; Service
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {loadingCustomers ? (
                  <Skeleton className="w-full h-10" />
                ) : (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Customer</Label>
                    <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.length === 0 ? (
                          <SelectItem value="__none__" disabled>
                            No customers yet
                          </SelectItem>
                        ) : (
                          customers.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.full_name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Service type</Label>
                  <Input
                    placeholder="e.g. Balayage"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Location</Label>
                {loadingLocations ? (
                  <Skeleton className="w-full h-10" />
                ) : locations.length === 0 ? (
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                    No locations for this salon. Add one under{" "}
                    <span className="font-medium">Locations</span> first.
                  </p>
                ) : !formulaLocationId ? (
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                    Set your default location under <span className="font-medium">Team</span> to build
                    formulas. This formula uses your default location only.
                  </p>
                ) : (
                  <p className="text-sm rounded-md border border-border bg-muted/30 px-3 py-2.5 text-foreground">
                    <span className="text-muted-foreground"></span>{" "}
                    <span className="font-medium">{formulaLocationName}</span>
                  </p>
                )}
              </div>
              <div>
                <Input
                  placeholder="Formula name (optional, e.g. Sarah's Winter Color)"
                  value={formulaName}
                  onChange={(e) => setFormulaName(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Color Mix */}
          <Card className="shadow-card border-border/60">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-primary" /> Color Mix
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <AnimatePresence>
                {mixItems.map((item, i) => {
                  const tp = tenantProducts.find((p) => p.id === item.tenantProductId);
                  const rowProducts = mixProductsForRow(item.tenantProductId);
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-3"
                    >
                      {loadingProducts ? (
                        <Skeleton className="flex-1 h-10" />
                      ) : (
                        <Select
                          value={item.tenantProductId}
                          onValueChange={(v) => updateItem(i, "tenantProductId", v)}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {productsError ? (
                              <SelectItem value="__error__" disabled>
                                Error loading products
                              </SelectItem>
                            ) : tenantProducts.length === 0 ? (
                              <SelectItem value="__none__" disabled>
                                {loadingProducts ? "Loading products..." : "No products in catalog"}
                              </SelectItem>
                            ) : rowProducts.length === 0 ? (
                              <SelectItem value="__none__" disabled>
                                No products in stock at this location
                              </SelectItem>
                            ) : (
                              rowProducts.map((p) => {
                                const inStock = tenantProductIdsInStock.has(p.id);
                                const name = mixProductLabel(p);
                                return (
                                  <SelectItem key={p.id} value={p.id} disabled={!inStock}>
                                    {!inStock ? `${name} (not in stock)` : name}
                                  </SelectItem>
                                );
                              })
                            )}
                          </SelectContent>
                        </Select>
                      )}
                      <div className="flex items-center gap-1 w-28">
                        <Input
                          type="number"
                          placeholder="0"
                          min="0"
                          step="0.1"
                          value={item.amount}
                          onChange={(e) => updateItem(i, "amount", e.target.value)}
                          className="w-20"
                        />
                        <span className="text-xs text-muted-foreground w-6">
                          {tp?.tracking_unit?.toLowerCase() ?? "g"}
                        </span>
                      </div>
                      {mixItems.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(i)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              <Button variant="outline" size="sm" onClick={addItem} className="mt-2">
                <Plus className="w-4 h-4 mr-1" /> Add Product
              </Button>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="shadow-card border-border/60">
            <CardContent className="p-5">
              <Textarea
                placeholder="Formula notes (e.g. 30 min processing, natural ash blend)…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px]"
              />
            </CardContent>
          </Card>

          {/* Footer: totals + save */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Total:{" "}
                <span className="font-semibold text-foreground">{totalWeight.toFixed(1)}g/ml</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Est. Cost:{" "}
                <span className="font-semibold text-primary">${totalCost.toFixed(2)}</span>
              </p>
            </div>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="gradient-primary shadow-primary text-white font-medium px-6"
            >
              {saveMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </div>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Save Formula
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right Sidebar - Color Preview & History */}
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start lg:z-10">
          {/* Color Preview (glass bowl) + product breakdown */}
          <Card className="shadow-card border-border/60 overflow-hidden">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" /> Color Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <FormulaDroplet
                items={dropletItems}
                capacity={500}
                unitLabel={formulaUnitLabel}
              />
              {totalWeight > 0 && (
                <div className="space-y-2.5 pt-3 border-t border-border/40">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium text-muted-foreground shrink-0">Total Amount:</span>
                    <span className="font-bold text-foreground tabular-nums text-right">
                      {totalByUnit.g > 0 && <span>{totalByUnit.g.toFixed(1)}g</span>}
                      {totalByUnit.g > 0 && totalByUnit.ml > 0 && <span className="mx-1">/</span>}
                      {totalByUnit.ml > 0 && <span>{totalByUnit.ml.toFixed(1)}ml</span>}
                      {totalByUnit.g === 0 && totalByUnit.ml === 0 && <span>0.0{formulaUnitLabel}</span>}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-muted-foreground shrink-0">Mixed Color:</span>
                    <span className="flex items-center gap-2 min-w-0 justify-end">
                      {mixedColor !== "#CCCCCC" && (
                        <div
                          className="w-5 h-5 rounded-full border-2 border-border shrink-0 shadow-sm"
                          style={{ backgroundColor: mixedColor }}
                        />
                      )}
                      <span className="font-bold font-mono text-foreground tabular-nums tracking-tight truncate">
                        {mixedColor !== "#CCCCCC" ? mixedColor.toUpperCase() : "—"}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium text-muted-foreground shrink-0">Est. Cost:</span>
                    <span className="font-bold text-primary tabular-nums">
                      ${totalCost.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer history sidebar */}
          <Card className="shadow-card border-border/60">
            <CardHeader>
              <CardTitle className="font-display text-lg">Past Formulas</CardTitle>
            </CardHeader>
            <CardContent className="lg:max-h-[50vh] lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
              {!selectedCustomer ? (
                <p className="text-sm text-muted-foreground">
                  Select a customer to see history
                </p>
              ) : (
                <CustomerHistorySidebar
                  customerId={selectedCustomer}
                  tenantProducts={tenantProducts}
                  globalProductLookup={globalProductLookup}
                  onSelectFormula={handleSelectPastFormula}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
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
import { useAuth } from "@/contexts/auth-context";
import type { Formula, TenantProduct } from "@/lib/types";
import { ApiRequestError } from "@/lib/api/client";
import { mixColors, getProductColor } from "@/lib/utils/color-mixer";
import { ColorCylinder } from "@/components/formula/ColorCylinder";

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
  const [selectedLocationId, setSelectedLocationId] = useState("");

  // ── Fetch locations (formula needs a location_id; default_location may be unset) ──
  const { data: locationsPage, isLoading: loadingLocations } = useQuery({
    queryKey: ["locations", user?.tenant_id, "formula-builder"],
    queryFn: () => tenantsApi.listLocations(user!.tenant_id),
    enabled: !!user?.tenant_id,
  });
  const locations = locationsPage?.items ?? [];

  useEffect(() => {
    if (!user || locations.length === 0) return;
    setSelectedLocationId((prev) => {
      if (prev && locations.some((l) => l.id === prev)) return prev;
      if (user.default_location_id && locations.some((l) => l.id === user.default_location_id)) {
        return user.default_location_id;
      }
      if (locations.length === 1) return locations[0].id;
      return "";
    });
  }, [user?.id, user?.default_location_id, locations]);

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
  
  // Build global product lookup map
  const globalProductLookup: Record<string, { name: string; code: string; tone_family: string | null }> = {};
  globalProductsPage?.items.forEach((gp) => {
    globalProductLookup[gp.id] = {
      name: gp.name,
      code: gp.code,
      tone_family: gp.tone_family ?? null,
    };
  });

  const loadingProducts = loadingTenantProducts || loadingGlobalProducts;

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

  // ── Color mixing calculation ────────────────────────────────────────────────────
  const mixedColor = (() => {
    const colorItems = mixItems
      .filter((item) => item.tenantProductId && parseFloat(item.amount) > 0)
      .map((item) => {
        const tp = tenantProducts.find((p) => p.id === item.tenantProductId);
        if (!tp) return null;
        
        const globalProduct = globalProductLookup[tp.product_id];
        const code = globalProduct?.code || "";
        const toneFamily = globalProduct?.tone_family || null;
        const color = getProductColor(code, toneFamily);
        const amount = parseFloat(item.amount) || 0;
        
        return { color, amount };
      })
      .filter((item): item is { color: string; amount: number } => item !== null);

    return mixColors(colorItems);
  })();

  // ── Save formula ─────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: () => {
      if (!user) throw new Error("Not authenticated.");
      const locationId = selectedLocationId || user.default_location_id || "";
      if (!locationId) {
        throw new Error(
          locations.length === 0
            ? "No salon locations found. Add a location first."
            : "Select a location for this formula."
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
    const locationId = selectedLocationId || user?.default_location_id;
    if (!locationId) {
      toast.error(
        locations.length === 0
          ? "Add a salon location before saving formulas."
          : "Select a location for this formula."
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
                ) : (
                  <Select value={selectedLocationId || undefined} onValueChange={setSelectedLocationId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                            ) : (
                              tenantProducts.map((p) => {
                                // Use custom_name if it exists and is not empty, otherwise fall back to global product
                                const name = (p.custom_name && p.custom_name.trim())
                                  ? p.custom_name
                                  : (globalProductLookup[p.product_id]
                                    ? `${globalProductLookup[p.product_id].name} (${globalProductLookup[p.product_id].code})`
                                    : p.product_id || `Product ${p.id.slice(0, 8)}`);
                                return (
                                  <SelectItem key={p.id} value={p.id}>
                                    {name}
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
          {/* Real-time Color Preview */}
          <Card className="shadow-card border-border/60">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" /> Color Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-6 min-h-[300px]">
                <ColorCylinder color={mixedColor} totalAmount={totalWeight} />
              </div>
              {totalWeight > 0 && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Amount:</span>
                      <span className="font-semibold">{totalWeight.toFixed(1)}g/ml</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Mixed Color:</span>
                      <span className="font-mono text-xs">{mixedColor.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Est. Cost:</span>
                      <span className="font-semibold text-primary">${totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
              {totalWeight === 0 && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
                  <p className="text-sm text-muted-foreground">
                    Add products to see the mixed color preview
                  </p>
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

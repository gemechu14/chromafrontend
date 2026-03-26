"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  UserPlus,
  Phone,
  Mail,
  Calendar,
  Loader2,
  Users,
  UserCheck,
  MapPin,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { customersApi } from "@/lib/api/customers";
import { formulasApi } from "@/lib/api/formulas";
import { productsApi } from "@/lib/api/products";
import { tenantsApi } from "@/lib/api/tenants";
import { useAuth } from "@/contexts/auth-context";
import type { Customer, Formula, TenantProduct, Location } from "@/lib/types";
import { ApiRequestError } from "@/lib/api/client";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NewCustomerForm {
  full_name: string;
  phone: string;
  email: string;
  notes: string;
  home_location_id: string;
}

const defaultForm: NewCustomerForm = { full_name: "", phone: "", email: "", notes: "", home_location_id: "" };

// ─── Customer Formula History (lazy loaded on expand) ─────────────────────────

function CustomerFormulaHistory({ customerId }: { customerId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["formulas", "customer", customerId],
    queryFn: () => formulasApi.list({ customer_id: customerId, page: 1, page_size: 50 }),
  });

  const history: Formula[] = data?.items ?? [];

  // Fetch tenant products so we can resolve product IDs to names
  const { data: tenantProductsPage } = useQuery({
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
  const tenantProductMap = Object.fromEntries(tenantProducts.map((tp) => [tp.id, tp]));

  // ── Fetch ALL global products for lookup ────────────────────────────────────
  const { data: globalProductsPage } = useQuery({
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
  const globalProductLookup: Record<string, { name: string; code: string }> = {};
  globalProductsPage?.items.forEach((gp) => {
    globalProductLookup[gp.id] = {
      name: gp.name,
      code: gp.code,
    };
  });

  function resolveProductName(tenantProductId: string): string {
    const tp = tenantProductMap[tenantProductId];
    if (!tp) return tenantProductId;
    if (tp.custom_name) return tp.custom_name;
    const gp = globalProductLookup[tp.product_id];
    return gp ? `${gp.code} ${gp.name}` : tp.product_id;
  }

  if (isLoading) {
    return (
      <div className="mt-3 space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="w-full h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-6">
        <FlaskConical className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-400">No formula history yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-3">
      <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold flex items-center gap-1">
        <FlaskConical className="w-3 h-3" />
        Formula History
      </p>
      {history.map((f) => {
        const cost = f.formula_items.reduce(
          (sum, fi) => sum + fi.cost_at_time * fi.amount_used,
          0
        );
        return (
          <div key={f.id} className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground">
                  {f.formula_name ?? f.service_type ?? "Formula"}
                </span>
                {f.service_type && (
                  <Badge variant="outline" className="text-xs border-slate-200">
                    {f.service_type}
                  </Badge>
                )}
              </div>
              <span className="text-xs text-slate-400">
                {new Date(f.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {f.formula_items.map((fi) => (
                <span
                  key={fi.id}
                  className="text-xs bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full text-foreground font-medium"
                >
                  {fi.amount_used}g/ml · {resolveProductName(fi.tenant_product_id)}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between">
              {f.notes && (
                <p className="text-xs text-slate-400 italic">{f.notes}</p>
              )}
              <p className="text-sm font-bold text-accent ml-auto">${cost.toFixed(2)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Customers() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<NewCustomerForm>(defaultForm);
  const [formError, setFormError] = useState<string | null>(null);

  // Debounce search input
  const handleSearchChange = useCallback((val: string) => {
    setSearch(val);
    const t = setTimeout(() => setDebouncedSearch(val), 400);
    return () => clearTimeout(t);
  }, []);

  // ── Fetch customers ─────────────────────────────────────────────────────────
  const { data: customersPage, isLoading } = useQuery({
    queryKey: ["customers", debouncedSearch],
    queryFn: () =>
      customersApi.list({
        search: debouncedSearch || undefined,
        page: 1,
        page_size: 50,
      }),
  });

  const customerList: Customer[] = customersPage?.items ?? [];
  const total = customersPage?.total ?? 0;

  // ── Stats ───────────────────────────────────────────────────────────────────
  const { data: allCustomersPage } = useQuery({
    queryKey: ["customers", "all-count"],
    queryFn: () => customersApi.list({ page: 1, page_size: 1 }),
  });
  const totalCount = allCustomersPage?.total ?? total;

  // Fetch all customers for "New This Month" calculation
  const { data: allCustomersForStats } = useQuery({
    queryKey: ["customers", "all-for-stats"],
    queryFn: async () => {
      const firstPage = await customersApi.list({ page: 1, page_size: 100 });
      const allCustomers = [...firstPage.items];
      
      // Fetch remaining pages if any
      const totalPages = firstPage.total_pages;
      if (totalPages > 1) {
        const remainingPages = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, i) =>
            customersApi.list({ page: i + 2, page_size: 100 })
          )
        );
        remainingPages.forEach((page) => {
          allCustomers.push(...page.items);
        });
      }
      
      return allCustomers;
    },
  });

  // ── Locations (for home_location_id dropdown) ────────────────────────────────
  const { data: locationsPage } = useQuery({
    queryKey: ["locations", user?.tenant_id],
    queryFn: () => tenantsApi.listLocations(user!.tenant_id),
    enabled: !!user?.tenant_id,
  });
  const locations: Location[] = locationsPage?.items ?? [];

  // ── Create customer ─────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data: NewCustomerForm) =>
      customersApi.create({
        tenant_id: user!.tenant_id,
        full_name: data.full_name,
        phone: data.phone || undefined,
        email: data.email || undefined,
        notes: data.notes || undefined,
        home_location_id: data.home_location_id || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setForm(defaultForm);
      setShowDialog(false);
      toast.success("Customer added successfully!");
    },
    onError: (err) => {
      const msg =
        err instanceof ApiRequestError ? err.message : "Failed to add customer.";
      setFormError(msg);
    },
  });

  function handleAdd() {
    setFormError(null);
    if (!form.full_name) {
      setFormError("Full name is required.");
      return;
    }
    createMutation.mutate(form);
  }

  // Calculate new customers this month
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const allCustomersForCalc = allCustomersForStats ?? [];
  const newThisMonth = allCustomersForCalc.filter((c) => {
    const created = new Date(c.created_at);
    return created.getMonth() === thisMonth && created.getFullYear() === thisYear;
  }).length;

  const summaryCards = [
    {
      label: "Total Clients",
      value: totalCount,
      icon: Users,
      color: "border-blue-100 bg-blue-50",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      label: "New This Month",
      value: isLoading || !allCustomersForStats ? "—" : newThisMonth,
      icon: UserCheck,
      color: "border-emerald-100 bg-emerald-50",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      label: "Locations",
      value: locations.length,
      icon: MapPin,
      color: "border-sky-100 bg-sky-50",
      iconBg: "bg-sky-100",
      iconColor: "text-sky-600",
    },
  ];

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Customers</h1>
        <p className="text-slate-500 text-sm mt-0.5">Client profiles and formula history</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className={`border ${s.color} shadow-sm hover:shadow-md transition-shadow`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg ${s.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${s.iconColor}`} />
                  </div>
                </div>
                {isLoading ? (
                  <Skeleton className="w-16 h-7 mb-1" />
                ) : (
                  <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
                )}
                <p className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search + Add */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 rounded-full"
          />
        </div>
        <Button
          className="bg-primary text-white hover:bg-primary/90 rounded-full gap-2 font-semibold"
          onClick={() => {
            setForm({ ...defaultForm, home_location_id: user?.default_location_id ?? "" });
            setFormError(null);
            setShowDialog(true);
          }}
        >
          <UserPlus className="w-4 h-4" />
          Add Customer
        </Button>
      </div>

      {/* Customer list */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="w-full h-20 rounded-xl" />
          ))
        ) : customerList.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <UserPlus className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">
              {debouncedSearch ? "No customers match your search" : "No customers yet"}
            </p>
          </div>
        ) : (
          customerList.map((c) => {
            const isExpanded = expanded === c.id;
            const initials = c.full_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : c.id)}
                    className="w-full text-left p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-white font-display font-bold text-sm shrink-0">
                        {initials}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{c.full_name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          {c.phone && (
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {c.phone}
                            </span>
                          )}
                          {c.email && (
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {c.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Added
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {new Date(c.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <CardContent className="pt-0 pb-5 px-5 border-t border-slate-100">
                          {c.notes && (
                            <p className="text-sm text-slate-500 mt-4 mb-2 italic p-3 bg-slate-50 rounded-lg border border-slate-100">
                              &quot;{c.notes}&quot;
                            </p>
                          )}
                          <CustomerFormulaHistory customerId={c.id} />
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* ─── Add Customer Dialog ─── */}
      <Dialog open={showDialog} onOpenChange={(o) => !o && setShowDialog(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Add New Customer</DialogTitle>
            <DialogDescription>
              Create a client profile. Formula history is added when you save formulas.
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
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Sarah Mitchell"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="sarah@email.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Home Location</Label>
              <Select
                value={form.home_location_id}
                onValueChange={(val) => setForm((f) => ({ ...f, home_location_id: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                placeholder="e.g. Sensitive scalp, prefers ammonia-free formulas"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="resize-none"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              className="rounded-full"
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!form.full_name || createMutation.isPending}
              className="bg-primary text-white hover:bg-primary/90 rounded-full"
            >
              {createMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </div>
              ) : (
                "Add Customer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

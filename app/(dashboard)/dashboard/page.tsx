"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  FlaskConical,
  DollarSign,
  AlertTriangle,
  Users,
  ArrowRight,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import Link from "next/link";
import { inventoryApi } from "@/lib/api/inventory";
import { formulasApi } from "@/lib/api/formulas";
import { customersApi } from "@/lib/api/customers";
import { productsApi } from "@/lib/api/products";
import type { Formula, TenantProduct } from "@/lib/types";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

// ─── Derived helpers ──────────────────────────────────────────────────────────

function getThisMonthCount(formulas: Formula[]): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return formulas.filter((f) => {
    const d = new Date(f.created_at);
    return d.getFullYear() === year && d.getMonth() === month;
  }).length;
}

function getAvgCostPerService(formulas: Formula[]): number {
  if (formulas.length === 0) return 0;
  const total = formulas.reduce(
    (sum, f) => sum + f.formula_items.reduce((s, i) => s + i.cost_at_time * i.amount_used, 0),
    0
  );
  return total / formulas.length;
}

function getMonthlyUsage(formulas: Formula[]): { month: string; cost: number }[] {
  const map = new Map<string, number>();
  formulas.forEach((f) => {
    const d = new Date(f.created_at);
    const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
    const cost = f.formula_items.reduce((s, i) => s + i.cost_at_time * i.amount_used, 0);
    map.set(key, (map.get(key) ?? 0) + cost);
  });
  // Sort by date and take last 6
  return Array.from(map.entries())
    .slice(-6)
    .map(([month, cost]) => ({ month, cost: parseFloat(cost.toFixed(2)) }));
}

function getTopProducts(
  formulas: Formula[],
  tenantProducts: TenantProduct[],
  globalProductLookup: Record<string, { name: string; code: string }>
): { name: string; usage: number }[] {
  const usageMap = new Map<string, number>();
  formulas.forEach((f) => {
    f.formula_items.forEach((fi) => {
      usageMap.set(
        fi.tenant_product_id,
        (usageMap.get(fi.tenant_product_id) ?? 0) + fi.amount_used
      );
    });
  });

  return Array.from(usageMap.entries())
    .map(([tpId, usage]) => {
      const tp = tenantProducts.find((p) => p.id === tpId);
      if (tp?.custom_name) {
        return { name: tp.custom_name, usage };
      }
      if (tp) {
        const gp = globalProductLookup[tp.product_id];
        if (gp) {
          return { name: `${gp.code} ${gp.name}`, usage };
        }
      }
      return { name: tpId, usage };
    })
    .sort((a, b) => b.usage - a.usage)
    .slice(0, 5);
}

// ─── Skeleton loaders ─────────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="w-12 h-4" />
        </div>
        <Skeleton className="w-16 h-7 mb-1" />
        <Skeleton className="w-24 h-3" />
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { data: lowStockItems = [], isLoading: loadingLowStock } = useQuery({
    queryKey: ["inventory", "low-stock"],
    queryFn: () => inventoryApi.getLowStock(),
  });

  const { data: formulasPage, isLoading: loadingFormulas } = useQuery({
    queryKey: ["formulas", "dashboard"],
    queryFn: () => formulasApi.list({ page: 1, page_size: 100 }),
  });

  const { data: customersPage, isLoading: loadingCustomers } = useQuery({
    queryKey: ["customers", "dashboard"],
    queryFn: () => customersApi.list({ page: 1, page_size: 1 }),
  });

  const { data: tenantProductsPage } = useQuery({
    queryKey: ["tenant-products", "dashboard"],
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

  // ── Fetch ALL global products for lookup ────────────────────────────────────
  const { data: globalProductsPage } = useQuery({
    queryKey: ["products", "dashboard"],
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
  const globalProductLookup = useMemo(() => {
    const lookup: Record<string, { name: string; code: string }> = {};
    globalProductsPage?.items.forEach((gp) => {
      lookup[gp.id] = {
        name: gp.name,
        code: gp.code,
      };
    });
    return lookup;
  }, [globalProductsPage?.items]);

  const formulas = useMemo(() => formulasPage?.items ?? [], [formulasPage?.items]);
  const tenantProducts = useMemo(() => tenantProductsPage?.items ?? [], [tenantProductsPage?.items]);
  const totalCustomers = customersPage?.total ?? 0;
  const recentFormulas = useMemo(() => formulas.slice(0, 4), [formulas]);

  const formulasThisMonth = useMemo(() => getThisMonthCount(formulas), [formulas]);
  const avgCostPerService = useMemo(() => getAvgCostPerService(formulas), [formulas]);
  const monthlyUsage = useMemo(() => getMonthlyUsage(formulas), [formulas]);
  const topProducts = useMemo(() => getTopProducts(formulas, tenantProducts, globalProductLookup), [formulas, tenantProducts, globalProductLookup]);

  const isLoading = loadingLowStock || loadingFormulas || loadingCustomers;

  const statCards = [
    {
      title: "Formulas This Month",
      value: formulasThisMonth,
      icon: FlaskConical,
      change: `${formulasThisMonth} total`,
      up: formulasThisMonth > 0,
      color: "bg-blue-50 text-primary",
      border: "border-blue-100",
    },
    {
      title: "Avg Cost / Service",
      value: `$${avgCostPerService.toFixed(2)}`,
      icon: DollarSign,
      change: "per formula",
      up: false,
      color: "bg-emerald-50 text-accent",
      border: "border-emerald-100",
    },
    {
      title: "Low Stock Items",
      value: lowStockItems.length,
      icon: AlertTriangle,
      change: lowStockItems.length > 0 ? `${lowStockItems.length} need attention` : "All stocked",
      up: false,
      color: "bg-amber-50 text-amber-600",
      border: "border-amber-100",
    },
    {
      title: "Active Customers",
      value: totalCustomers,
      icon: Users,
      change: "total clients",
      up: totalCustomers > 0,
      color: "bg-sky-50 text-sky-600",
      border: "border-sky-100",
    },
  ];

  return (
    <div className="space-y-6 w-full">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stat cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {statCards.map((s) => (
            <motion.div key={s.title} variants={item}>
              <Card className={`border ${s.border} shadow-sm hover:shadow-md transition-shadow`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-10 h-10 rounded-xl ${s.color} bg-opacity-60 flex items-center justify-center`}
                    >
                      <s.icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-xs font-semibold flex items-center gap-0.5 ${
                        s.up ? "text-accent" : "text-slate-400"
                      }`}
                    >
                      {s.up && <ChevronUp className="w-3 h-3" />}
                      {s.change}
                    </span>
                  </div>
                  <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">{s.title}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly cost chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-2"
        >
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-display text-base font-semibold text-foreground">
                Monthly Color Costs
              </CardTitle>
              <span className="text-xs text-slate-400">Last 6 months</span>
            </CardHeader>
            <CardContent>
              {loadingFormulas ? (
                <Skeleton className="w-full h-44" />
              ) : (
                <ResponsiveContainer width="100%" height={176}>
                  <AreaChart data={monthlyUsage}>
                    <defs>
                      <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip
                      formatter={(val: number) => [`$${val}`, "Cost"]}
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="cost"
                      stroke="#2563EB"
                      strokeWidth={2.5}
                      fill="url(#colorCost)"
                      dot={{ r: 4, fill: "#2563EB", strokeWidth: 2, stroke: "#fff" }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
              {!loadingFormulas && monthlyUsage.length === 0 && (
                <div className="flex items-center justify-center h-44 text-slate-400 text-sm">
                  No formula data yet
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
        >
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base font-semibold text-foreground">
                Top Products by Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingFormulas ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-5 h-4" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="w-full h-3" />
                      <Skeleton className="w-full h-1.5" />
                    </div>
                  </div>
                ))
              ) : topProducts.length === 0 ? (
                <p className="text-sm text-slate-400">No usage data yet</p>
              ) : (
                topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="w-5 text-xs font-bold text-slate-400">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {p.name}
                        </span>
                        <span className="text-xs text-slate-400 ml-2 shrink-0">{p.usage}g</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{
                            width: `${(p.usage / (topProducts[0]?.usage || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom row: Low stock + Recent formulas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low stock */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
        >
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-display text-base font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Low Stock Alert
              </CardTitle>
              <Link href="/inventory">
                <Button variant="ghost" size="sm" className="text-xs text-primary gap-1 h-7 px-2">
                  View All <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {loadingLowStock ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="w-full h-14 rounded-lg" />
                ))
              ) : lowStockItems.length === 0 ? (
                <p className="text-slate-500 text-sm py-2">All products are well stocked ✓</p>
              ) : (
                lowStockItems.slice(0, 5).map((inv) => {
                  const tp = tenantProducts.find((p) => p.id === inv.tenant_product_id);
                  let productName = inv.tenant_product_id;
                  if (tp?.custom_name) {
                    productName = tp.custom_name;
                  } else if (tp) {
                    const gp = globalProductLookup[tp.product_id];
                    if (gp) {
                      productName = `${gp.code} ${gp.name}`;
                    }
                  }
                  return (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {productName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {tp?.tracking_unit ?? "G"} · Reorder at {inv.reorder_level_qty}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive" className="text-xs mb-0.5">
                          {inv.on_hand_qty} {tp?.tracking_unit ?? "G"}
                        </Badge>
                        <p className="text-xs text-slate-400">min {inv.reorder_level_qty}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent formulas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.44 }}
        >
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-display text-base font-semibold text-foreground">
                Recent Formulas
              </CardTitle>
              <Link href="/formulas">
                <Button variant="ghost" size="sm" className="text-xs text-primary gap-1 h-7 px-2">
                  View All <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {loadingFormulas ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="w-full h-14 rounded-lg" />
                ))
              ) : recentFormulas.length === 0 ? (
                <p className="text-slate-500 text-sm py-2">No formulas yet</p>
              ) : (
                recentFormulas.map((f) => {
                  const cost = f.formula_items.reduce(
                    (s, i) => s + i.cost_at_time * i.amount_used,
                    0
                  );
                  return (
                    <div
                      key={f.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <FlaskConical className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {f.formula_name ?? "Untitled Formula"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {f.service_type ?? "—"} · {f.formula_items.length} product
                            {f.formula_items.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-accent">${cost.toFixed(2)}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(f.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

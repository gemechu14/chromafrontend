"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueries } from "@tanstack/react-query";
import Link from "next/link";
import {
  Building2,
  Database,
  Package,
  Users,
  ArrowRight,
  ChevronUp,
  AlertTriangle,
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
import { tenantsApi } from "@/lib/api/tenants";
import { productsApi } from "@/lib/api/products";
import type { Tenant } from "@/lib/types";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

function getTenantGrowth(tenants: Tenant[]): { month: string; count: number }[] {
  const now = new Date();
  const result: { month: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const target = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const label = target.toLocaleString("default", { month: "short", year: "2-digit" });
    const count = tenants.filter((t) => {
      const d = new Date(t.created_at);
      return d >= target && d < next;
    }).length;
    result.push({ month: label, count });
  }
  return result;
}

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

export default function PlatformDashboardPage() {
  const { data: allTenants = [], isLoading: loadingTenants } = useQuery({
    queryKey: ["platform-dashboard-tenants"],
    queryFn: async () => {
      const first = await tenantsApi.list(1, 100, { includePlatform: false });
      const items = [...first.items];
      for (let p = 2; p <= first.total_pages; p++) {
        const page = await tenantsApi.list(p, 100, { includePlatform: false });
        items.push(...page.items);
      }
      return items;
    },
  });

  const { data: brandMeta, isLoading: loadingBrandMeta } = useQuery({
    queryKey: ["platform-dashboard-brands-meta"],
    queryFn: () => productsApi.listBrands(1, 1),
  });

  const { data: productMeta, isLoading: loadingProductMeta } = useQuery({
    queryKey: ["platform-dashboard-products-meta"],
    queryFn: () => productsApi.listProducts({ page: 1, page_size: 1 }),
  });

  const { data: brandsPage, isLoading: loadingBrandsList } = useQuery({
    queryKey: ["platform-dashboard-brands-list"],
    queryFn: async () => {
      const first = await productsApi.listBrands(1, 100);
      const items = [...first.items];
      for (let p = 2; p <= first.total_pages; p++) {
        const page = await productsApi.listBrands(p, 100);
        items.push(...page.items);
      }
      return items;
    },
  });

  const brands = brandsPage ?? [];
  const previewBrands = useMemo(() => brands.slice(0, 5), [brands]);

  const lineQueries = useQueries({
    queries: previewBrands.map((b) => ({
      queryKey: ["platform-dashboard-line-total", b.id],
      queryFn: () => productsApi.listProductLines(b.id, 1, 1),
      enabled: previewBrands.length > 0,
    })),
  });

  const topBrandsByLines = useMemo(() => {
    return previewBrands
      .map((b, i) => ({
        name: b.name,
        lines: lineQueries[i]?.data?.total ?? 0,
      }))
      .sort((a, b) => b.lines - a.lines);
  }, [previewBrands, lineQueries]);

  const tenantGrowth = useMemo(() => getTenantGrowth(allTenants), [allTenants]);
  const activeSalons = useMemo(
    () => allTenants.filter((t) => t.status === "active").length,
    [allTenants]
  );
  const attentionTenants = useMemo(
    () =>
      allTenants.filter(
        (t) => t.status === "suspended" || t.status === "trial"
      ),
    [allTenants]
  );
  const recentSalons = useMemo(() => {
    return [...allTenants]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 4);
  }, [allTenants]);

  const totalSalons = allTenants.length;
  const totalBrands = brandMeta?.total ?? 0;
  const totalProducts = productMeta?.total ?? 0;

  const loadingStats = loadingTenants || loadingBrandMeta || loadingProductMeta;

  const statCards = [
    {
      title: "Salon tenants",
      value: totalSalons,
      icon: Building2,
      change: `${totalSalons} total`,
      up: totalSalons > 0,
      color: "bg-blue-50 text-primary",
      border: "border-blue-100",
    },
    {
      title: "Global brands",
      value: totalBrands,
      icon: Database,
      change: "in catalog",
      up: totalBrands > 0,
      color: "bg-emerald-50 text-accent",
      border: "border-emerald-100",
    },
    {
      title: "Global products",
      value: totalProducts,
      icon: Package,
      change: "SKU count",
      up: totalProducts > 0,
      color: "bg-amber-50 text-amber-600",
      border: "border-amber-100",
    },
    {
      title: "Active salons",
      value: activeSalons,
      icon: Users,
      change: "status active",
      up: activeSalons > 0,
      color: "bg-sky-50 text-sky-600",
      border: "border-sky-100",
    },
  ];

  const maxLines = topBrandsByLines[0]?.lines || 1;

  return (
    <div className="space-y-6 w-full">
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

      {loadingStats ? (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-2"
        >
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-display text-base font-semibold text-foreground">
                New salon tenants
              </CardTitle>
              <span className="text-xs text-slate-400">Last 6 months</span>
            </CardHeader>
            <CardContent>
              {loadingTenants ? (
                <Skeleton className="w-full h-44" />
              ) : (
                <ResponsiveContainer width="100%" height={176}>
                  <AreaChart data={tenantGrowth}>
                    <defs>
                      <linearGradient id="platformTenant" x1="0" y1="0" x2="0" y2="1">
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
                      allowDecimals={false}
                    />
                    <Tooltip
                      formatter={(val: number) => [val, "Tenants"]}
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#2563EB"
                      strokeWidth={2.5}
                      fill="url(#platformTenant)"
                      dot={{ r: 4, fill: "#2563EB", strokeWidth: 2, stroke: "#fff" }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
              {!loadingTenants && allTenants.length === 0 && (
                <div className="flex items-center justify-center h-44 text-slate-400 text-sm">
                  No tenants yet
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
        >
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base font-semibold text-foreground">
                Brands by product lines
              </CardTitle>
              <p className="text-xs text-slate-400">First five brands, ranked by lines</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingBrandsList ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-5 h-4" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="w-full h-3" />
                      <Skeleton className="w-full h-1.5" />
                    </div>
                  </div>
                ))
              ) : topBrandsByLines.length === 0 ? (
                <p className="text-sm text-slate-400">Add brands in Global catalog</p>
              ) : (
                topBrandsByLines.map((row, i) => (
                  <div key={row.name} className="flex items-center gap-3">
                    <span className="w-5 text-xs font-bold text-slate-400">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {row.name}
                        </span>
                        <span className="text-xs text-slate-400 ml-2 shrink-0">{row.lines} lines</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{
                            width: `${(row.lines / maxLines) * 100}%`,
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
        >
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-display text-base font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Tenants needing attention
              </CardTitle>
              <Link href="/platform/tenants">
                <Button variant="ghost" size="sm" className="text-xs text-primary gap-1 h-7 px-2">
                  View All <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {loadingTenants ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="w-full h-14 rounded-lg" />
                ))
              ) : attentionTenants.length === 0 ? (
                <p className="text-slate-500 text-sm py-2">No trial or suspended salons right now ✓</p>
              ) : (
                attentionTenants.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-slate-500 capitalize">{t.plan} plan</p>
                    </div>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {t.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.44 }}
        >
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-display text-base font-semibold text-foreground">
                Recent salons
              </CardTitle>
              <Link href="/platform/tenants">
                <Button variant="ghost" size="sm" className="text-xs text-primary gap-1 h-7 px-2">
                  View All <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {loadingTenants ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="w-full h-14 rounded-lg" />
                ))
              ) : recentSalons.length === 0 ? (
                <p className="text-slate-500 text-sm py-2">No salons yet</p>
              ) : (
                recentSalons.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                        <Building2 className="w-3.5 h-3.5 text-sky-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{t.name}</p>
                        <p className="text-xs text-slate-500 capitalize">
                          {t.plan} · {t.status}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 shrink-0">
                      {new Date(t.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

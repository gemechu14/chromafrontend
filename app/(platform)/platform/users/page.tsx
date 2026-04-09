"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Mail, UserCircle2 } from "lucide-react";
import { tenantsApi } from "@/lib/api/tenants";
import { usersApi } from "@/lib/api/users";
import type { User as AppUser } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  PlatformTablePagination,
  PlatformTableWrap,
} from "@/components/platform/platform-data-table";

function roleLabel(role: string): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super admin";
    case "ADMIN":
      return "Admin";
    case "MANAGER":
      return "Manager";
    case "EMPLOYEE":
      return "Employee";
    default:
      return role;
  }
}

function roleBadgeClass(role: string): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "bg-amber-50 text-amber-900 border-amber-200";
    case "ADMIN":
      return "bg-purple-50 text-purple-800 border-purple-200";
    case "MANAGER":
      return "bg-blue-50 text-blue-800 border-blue-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

export default function PlatformSalonUsersPage() {
  const [tenantId, setTenantId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: tenantsPage, isLoading: loadingTenants } = useQuery({
    queryKey: ["platform-tenants", "user-picker"],
    queryFn: () => tenantsApi.list(1, 200, { includePlatform: false }),
  });

  const salons = useMemo(() => {
    const items = tenantsPage?.items ?? [];
    return items.filter((t) => t.is_platform !== true);
  }, [tenantsPage?.items]);

  useEffect(() => {
    setPage(1);
  }, [tenantId]);

  const { data: usersPage, isLoading: loadingUsers } = useQuery({
    queryKey: ["platform-users", tenantId, page, pageSize],
    queryFn: () =>
      usersApi.list({
        page,
        page_size: pageSize,
        tenant_id: tenantId,
      }),
    enabled: !!tenantId,
  });

  const users = usersPage?.items ?? [];
  const total = usersPage?.total ?? 0;
  const totalPages = usersPage?.total_pages ?? 1;

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl">Salon users</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Pick a salon to view its staff.
        </p>
      </div>

      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100/80 px-4 pb-4 pt-5 sm:px-6 sm:pt-6">
          <CardTitle className="font-display text-base sm:text-lg">Select salon</CardTitle>
          {/* <CardDescription>Only non-platform tenants are listed.</CardDescription> */}
        </CardHeader>
        <CardContent className="max-w-xl px-4 pb-6 pt-4 sm:px-6 sm:pt-6">
          {loadingTenants ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary/60" />
          ) : (
            <Select value={tenantId || undefined} onValueChange={setTenantId}>
              <SelectTrigger className="bg-white h-11">
                <SelectValue placeholder="Choose a salon…" />
              </SelectTrigger>
              <SelectContent>
                {salons.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100/80 px-4 pb-4 pt-5 sm:px-6 sm:pt-6">
          <CardTitle className="font-display text-base sm:text-lg">Staff</CardTitle>
          <CardDescription>
            {tenantId
              ? "Team members for the selected tenant."
              : "Select a salon to load users."}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-6 pt-4 sm:px-6 sm:pt-6">
          {!tenantId ? (
            <p className="text-sm text-muted-foreground text-center py-12 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
              Select a salon to view staff.
            </p>
          ) : loadingUsers ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-primary/60" />
            </div>
          ) : (
            <PlatformTableWrap>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-100 hover:bg-transparent">
                      <TableHead className="bg-slate-50/90 text-muted-foreground font-semibold h-11">
                        Name
                      </TableHead>
                      <TableHead className="bg-slate-50/90 text-muted-foreground font-semibold h-11">
                        Email
                      </TableHead>
                      <TableHead className="bg-slate-50/90 text-muted-foreground font-semibold h-11 w-40">
                        Role
                      </TableHead>
                      <TableHead className="bg-slate-50/90 text-muted-foreground font-semibold h-11 w-28">
                        Active
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          No users found for this salon.
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((u: AppUser) => (
                        <TableRow key={u.id} className="border-slate-100 hover:bg-slate-50/70">
                          <TableCell>
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <UserCircle2 className="h-5 w-5" />
                              </div>
                              <span className="font-medium text-foreground truncate">
                                {u.full_name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-muted-foreground text-sm min-w-0">
                              <Mail className="h-3.5 w-3.5 shrink-0 opacity-60" />
                              <span className="truncate">{u.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`font-medium capitalize ${roleBadgeClass(u.role)}`}
                            >
                              {roleLabel(u.role)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {u.is_active ? (
                              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">
                                Inactive
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <PlatformTablePagination
                page={page}
                pageSize={pageSize}
                total={total}
                totalPages={totalPages}
                onPageChange={setPage}
                onPageSizeChange={(s) => {
                  setPageSize(s);
                  setPage(1);
                }}
              />
            </PlatformTableWrap>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

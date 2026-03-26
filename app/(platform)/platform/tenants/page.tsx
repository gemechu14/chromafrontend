"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { tenantsApi } from "@/lib/api/tenants";
import { ApiRequestError } from "@/lib/api/client";
import type { Tenant, TenantPlan, TenantStatus, CreateTenantRequest } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  PlatformTablePagination,
  PlatformTableWrap,
} from "@/components/platform/platform-data-table";

export default function PlatformTenantsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [form, setForm] = useState<CreateTenantRequest>({
    name: "",
    plan: "trial",
    status: "trial",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["platform-tenants", "paged", page, pageSize],
    queryFn: () => tenantsApi.list(page, pageSize, { includePlatform: false }),
  });

  const createMutation = useMutation({
    mutationFn: (body: CreateTenantRequest) => tenantsApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-tenants"] });
      toast.success("Tenant created");
      setCreateOpen(false);
      setForm({ name: "", plan: "trial", status: "trial" });
      setPage(1);
    },
    onError: (e: unknown) => {
      toast.error(e instanceof ApiRequestError ? e.message : "Could not create tenant");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof tenantsApi.update>[1] }) =>
      tenantsApi.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-tenants"] });
      toast.success("Tenant updated");
      setEditing(null);
    },
    onError: (e: unknown) => {
      toast.error(e instanceof ApiRequestError ? e.message : "Could not update tenant");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tenantsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-tenants"] });
      toast.success("Tenant deleted");
    },
    onError: (e: unknown) => {
      toast.error(e instanceof ApiRequestError ? e.message : "Could not delete tenant");
    },
  });

  const tenants = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.total_pages ?? 1;

  function openEdit(t: Tenant) {
    setEditing(t);
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Salon tenants</h1>
          <p className="text-muted-foreground mt-1 leading-relaxed">
            Create and manage customer organizations. The platform tenant itself is omitted from this
            list.
          </p>
        </div>
        <Button
          className="gradient-primary text-white border-0 shadow-primary shrink-0"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New tenant
        </Button>
      </div>

      <Card className="border border-slate-200 shadow-sm bg-white">
        <CardHeader className="border-b border-slate-100/80 pb-4">
          <CardTitle className="font-display text-lg">All salons</CardTitle>
          <CardDescription>Plan and status apply to billing and access.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
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
                      <TableHead className="bg-slate-50/90 text-muted-foreground font-semibold h-11 w-36">
                        Plan
                      </TableHead>
                      <TableHead className="bg-slate-50/90 text-muted-foreground font-semibold h-11 w-36">
                        Status
                      </TableHead>
                      <TableHead className="text-right bg-slate-50/90 text-muted-foreground font-semibold h-11 w-[120px]">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          No tenants yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      tenants.map((t) => (
                        <TableRow key={t.id} className="border-slate-100 hover:bg-slate-50/70">
                          <TableCell className="font-medium text-foreground">{t.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize font-medium">
                              {t.plan}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize border-slate-200">
                              {t.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-600 hover:text-primary"
                              onClick={() => openEdit(t)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => {
                                if (confirm(`Delete tenant “${t.name}”? This cannot be undone.`)) {
                                  deleteMutation.mutate(t.id);
                                }
                              }}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Create tenant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="t-name">Salon name</Label>
              <Input
                id="t-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Luxe Hair Studio"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select
                  value={form.plan}
                  onValueChange={(v) => setForm((f) => ({ ...f, plan: v as TenantPlan }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v as TenantStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.name.trim() || createMutation.isPending}
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Edit tenant</DialogTitle>
          </DialogHeader>
          {editing && (
            <>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="e-name">Name</Label>
                  <Input
                    id="e-name"
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Plan</Label>
                    <Select
                      value={editing.plan}
                      onValueChange={(v) => setEditing({ ...editing, plan: v as TenantPlan })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={editing.status}
                      onValueChange={(v) => setEditing({ ...editing, status: v as TenantStatus })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    updateMutation.mutate({
                      id: editing.id,
                      body: {
                        name: editing.name,
                        plan: editing.plan,
                        status: editing.status,
                      },
                    })
                  }
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

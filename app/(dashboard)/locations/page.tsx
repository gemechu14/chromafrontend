"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MapPin,
  Plus,
  Clock,
  Home,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TableRowActions } from "@/components/ui/table-row-actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { tenantsApi } from "@/lib/api/tenants";
import { useAuth } from "@/contexts/auth-context";
import { ApiRequestError } from "@/lib/api/client";
import { toast } from "sonner";
import type { Location } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocationForm {
  name: string;
  address: string;
  timezone: string;
}

const defaultForm: LocationForm = { name: "", address: "", timezone: "" };

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LocationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const tenantId = user?.tenant_id ?? "";
  const canEdit = user?.role === "ADMIN" || user?.role === "MANAGER";
  const isAdmin = user?.role === "ADMIN";

  const [showCreate, setShowCreate] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [form, setForm] = useState<LocationForm>(defaultForm);
  const [formError, setFormError] = useState<string | null>(null);

  // ── Fetch locations ─────────────────────────────────────────────────────────
  const { data: locationsPage, isLoading } = useQuery({
    queryKey: ["locations", tenantId],
    queryFn: () => tenantsApi.listLocations(tenantId),
    enabled: !!tenantId,
  });
  const locations: Location[] = locationsPage?.items ?? [];

  // ── Create location ─────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: () =>
      tenantsApi.createLocation(tenantId, {
        tenant_id: tenantId,
        name: form.name,
        address: form.address || undefined,
        timezone: form.timezone || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      setShowCreate(false);
      setForm(defaultForm);
      toast.success("Location created successfully.");
    },
    onError: (err) => {
      setFormError(
        err instanceof ApiRequestError ? err.message : "Failed to create location."
      );
    },
  });

  // ── Update location ─────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editingLocation) throw new Error("No location selected.");
      return tenantsApi.updateLocation(tenantId, editingLocation.id, {
        name: form.name || undefined,
        address: form.address || undefined,
        timezone: form.timezone || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      setEditingLocation(null);
      setForm(defaultForm);
      toast.success("Location updated.");
    },
    onError: (err) => {
      setFormError(
        err instanceof ApiRequestError ? err.message : "Failed to update location."
      );
    },
  });

  // ── Delete location ─────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (locationId: string) =>
      tenantsApi.deleteLocation(tenantId, locationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Location deleted.");
    },
    onError: () => toast.error("Failed to delete location."),
  });

  function openCreate() {
    setForm(defaultForm);
    setFormError(null);
    setShowCreate(true);
  }

  function openEdit(loc: Location) {
    setEditingLocation(loc);
    setFormError(null);
    setForm({
      name: loc.name,
      address: loc.address ?? "",
      timezone: loc.timezone ?? "",
    });
  }

  const isDefaultLocation = (locId: string) =>
    user?.default_location_id === locId;

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Locations</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage your salon branches and service locations
          </p>
        </div>
        {canEdit && (
          <Button
            className="bg-primary text-white hover:bg-primary/90 rounded-full gap-2 font-semibold"
            onClick={openCreate}
          >
            <Plus className="w-4 h-4" />
            Add Location
          </Button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Branches", value: locations.length, color: "border-blue-100 bg-blue-50" },
          {
            label: "Your Default",
            value: user?.default_location_id
              ? locations.find((l) => l.id === user.default_location_id)?.name ?? "—"
              : "Not set",
            color: "border-emerald-100 bg-emerald-50",
          },
        ].map((s) => (
          <Card key={s.label} className={`border ${s.color} shadow-sm`}>
            <CardContent className="p-4">
              {isLoading ? (
                <Skeleton className="w-16 h-7 mb-1" />
              ) : (
                <p className="text-xl font-display font-bold text-foreground truncate">
                  {s.value}
                </p>
              )}
              <p className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Location cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))
        ) : locations.length === 0 ? (
          <div className="col-span-full text-center py-16 text-slate-400">
            <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No locations yet. Add your first salon branch.</p>
          </div>
        ) : (
          locations.map((loc) => {
            const isDefault = isDefaultLocation(loc.id);
            return (
              <motion.div
                key={loc.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-5 flex flex-col h-full">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4 text-primary" />
                        </div>
                        <p className="font-semibold text-foreground">{loc.name}</p>
                      </div>
                      {isDefault && (
                        <Badge
                          variant="outline"
                          className="text-xs border-emerald-300 text-emerald-600 bg-emerald-50 shrink-0 gap-1"
                        >
                          <Home className="w-3 h-3" /> Default
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1.5 flex-1">
                      {loc.address && (
                        <p className="text-sm text-slate-500 flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                          {loc.address}
                        </p>
                      )}
                      {loc.timezone && (
                        <p className="text-xs text-slate-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {loc.timezone}
                        </p>
                      )}
                      <p className="text-xs text-slate-400">
                        Added{" "}
                        {new Date(loc.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    {canEdit && (
                      <div className="flex items-center justify-end mt-4 pt-3 border-t border-slate-100">
                        <TableRowActions
                          itemName={loc.name}
                          onEdit={() => openEdit(loc)}
                          onDelete={() => deleteMutation.mutate(loc.id)}
                          confirmTitle={`Delete “${loc.name}”?`}
                          confirmDescription="This cannot be undone and will affect all inventory and users assigned to this location."
                          showDelete={isAdmin}
                          disabled={deleteMutation.isPending}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* ─── Create Dialog ─── */}
      <Dialog open={showCreate} onOpenChange={(o) => !o && setShowCreate(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Add New Location</DialogTitle>
            <DialogDescription>
              Add a new salon branch or service location to your account.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {formError}
            </div>
          )}

          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>
                Location Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Main Street Salon"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Textarea
                placeholder="123 Main St, City, State 12345"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="resize-none"
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Timezone</Label>
              <Input
                placeholder="e.g. America/New_York"
                value={form.timezone}
                onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCreate(false)}
              className="rounded-full"
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setFormError(null);
                if (!form.name) {
                  setFormError("Location name is required.");
                  return;
                }
                createMutation.mutate();
              }}
              disabled={createMutation.isPending}
              className="bg-primary text-white hover:bg-primary/90 rounded-full"
            >
              {createMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating…
                </span>
              ) : (
                "Create Location"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Dialog ─── */}
      <Dialog
        open={!!editingLocation}
        onOpenChange={(o) => !o && setEditingLocation(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Location</DialogTitle>
            <DialogDescription>
              Update details for {editingLocation?.name}.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {formError}
            </div>
          )}

          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>
                Location Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Textarea
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="resize-none"
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Timezone</Label>
              <Input
                placeholder="e.g. America/New_York"
                value={form.timezone}
                onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingLocation(null)}
              className="rounded-full"
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setFormError(null);
                if (!form.name) {
                  setFormError("Location name is required.");
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
    </div>
  );
}


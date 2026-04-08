"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UserPlus,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Crown,
  User,
  ToggleLeft,
  ToggleRight,
  MapPin,
  Eye,
  EyeOff,
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
import { TableRowActions } from "@/components/ui/table-row-actions";
import { usersApi } from "@/lib/api/users";
import { tenantsApi } from "@/lib/api/tenants";
import { useAuth } from "@/contexts/auth-context";
import { ApiRequestError } from "@/lib/api/client";
import { toast } from "sonner";
import type { User as AppUser, UserRole, Location } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreateUserForm {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
  default_location_id: string;
}

interface EditUserForm {
  full_name: string;
  role: UserRole;
  is_active: boolean;
  default_location_id: string;
}

const defaultCreateForm: CreateUserForm = {
  full_name: "",
  email: "",
  password: "",
  role: "EMPLOYEE",
  default_location_id: "",
};

/** Prefers the logged-in user's default location; otherwise first tenant location. */
function initialCreateForm(
  current: AppUser | null | undefined,
  locs: Location[]
): CreateUserForm {
  const uid = current?.default_location_id ?? null;
  const ids = new Set(locs.map((l) => l.id));
  let default_location_id = "";
  if (uid && ids.has(uid)) {
    default_location_id = uid;
  } else if (locs.length > 0) {
    default_location_id = locs[0].id;
  }
  return { ...defaultCreateForm, default_location_id };
}

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: UserRole }) {
  const config: Record<UserRole, { label: string; className: string; Icon: React.ElementType }> = {
    SUPER_ADMIN: {
      label: "Super Admin",
      className: "border-amber-300 text-amber-800 bg-amber-50",
      Icon: Crown,
    },
    ADMIN: {
      label: "Admin",
      className: "border-purple-300 text-purple-700 bg-purple-50",
      Icon: ShieldAlert,
    },
    MANAGER: {
      label: "Manager",
      className: "border-blue-300 text-blue-700 bg-blue-50",
      Icon: ShieldCheck,
    },
    EMPLOYEE: {
      label: "Employee",
      className: "border-slate-300 text-slate-600 bg-slate-50",
      Icon: User,
    },
  };
  const { label, className, Icon } = config[role];
  return (
    <Badge variant="outline" className={`text-xs gap-1 ${className}`}>
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const canEdit =
    currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER";
  const isAdmin = currentUser?.role === "ADMIN";

  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [createForm, setCreateForm] = useState<CreateUserForm>(defaultCreateForm);
  const [editForm, setEditForm] = useState<EditUserForm>({
    full_name: "",
    role: "EMPLOYEE",
    is_active: true,
    default_location_id: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  // ── Fetch users ─────────────────────────────────────────────────────────────
  const { data: usersPage, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.list({ page: 1, page_size: 100 }),
  });
  const users: AppUser[] = usersPage?.items ?? [];

  // ── Fetch locations for default_location_id picker ─────────────────────────
  const { data: locationsPage } = useQuery({
    queryKey: ["locations", currentUser?.tenant_id],
    queryFn: () => tenantsApi.listLocations(currentUser!.tenant_id),
    enabled: !!currentUser?.tenant_id,
  });
  const locations: Location[] = useMemo(
    () => locationsPage?.items ?? [],
    [locationsPage]
  );

  // If locations load after the dialog opens, apply logged-in user's location (or first location).
  useEffect(() => {
    if (!showCreate || locations.length === 0) return;
    setCreateForm((f) => {
      const valid = locations.some((l) => l.id === f.default_location_id);
      if (valid) return f;
      const next = initialCreateForm(currentUser, locations);
      return { ...f, default_location_id: next.default_location_id };
    });
  }, [showCreate, locations, currentUser]);

  // ── Create user ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: () => {
      if (!currentUser) throw new Error("Not authenticated.");
      const pw = createForm.password.trim();
      return usersApi.create({
        tenant_id: currentUser.tenant_id,
        full_name: createForm.full_name,
        email: createForm.email,
        password: pw === "" ? null : pw,
        role: createForm.role,
        default_location_id: createForm.default_location_id || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setShowCreate(false);
      setCreateForm(initialCreateForm(currentUser, locations));
      setShowCreatePassword(false);
      toast.success("Team member added successfully.");
    },
    onError: (err) => {
      setFormError(
        err instanceof ApiRequestError ? err.message : "Failed to create user."
      );
    },
  });

  // ── Update user ─────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editingUser) throw new Error("No user selected.");
      return usersApi.update(editingUser.id, {
        full_name: editForm.full_name || undefined,
        role: editForm.role,
        is_active: editForm.is_active,
        default_location_id: editForm.default_location_id || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditingUser(null);
      toast.success("Team member updated.");
    },
    onError: (err) => {
      setFormError(
        err instanceof ApiRequestError ? err.message : "Failed to update user."
      );
    },
  });

  // ── Toggle active ───────────────────────────────────────────────────────────
  const toggleActiveMutation = useMutation({
    mutationFn: (u: AppUser) =>
      usersApi.update(u.id, { is_active: !u.is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User status updated.");
    },
    onError: () => toast.error("Failed to update status."),
  });

  // ── Delete user ─────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (userId: string) => usersApi.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User removed.");
    },
    onError: () => toast.error("Failed to delete user."),
  });

  function openEdit(u: AppUser) {
    setEditingUser(u);
    setFormError(null);
    setEditForm({
      full_name: u.full_name,
      role: u.role,
      is_active: u.is_active,
      default_location_id: u.default_location_id ?? "",
    });
  }

  // Stats
  const managerCount = users.filter((u) => u.role === "MANAGER").length;
  const employeeCount = users.filter((u) => u.role === "EMPLOYEE").length;
  const activeCount = users.filter((u) => u.is_active).length;

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Team</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage employees, managers, and access roles
          </p>
        </div>
        {canEdit && (
          <Button
            className="bg-primary text-white hover:bg-primary/90 rounded-full gap-2 font-semibold"
            onClick={() => {
              setCreateForm(initialCreateForm(currentUser, locations));
              setFormError(null);
              setShowCreatePassword(false);
              setShowCreate(true);
            }}
          >
            <UserPlus className="w-4 h-4" />
            Add Member
          </Button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Members", value: users.length, color: "border-blue-100 bg-blue-50" },
          { label: "Active", value: activeCount, color: "border-emerald-100 bg-emerald-50" },
          { label: "Managers", value: managerCount, color: "border-sky-100 bg-sky-50" },
          { label: "Employees", value: employeeCount, color: "border-slate-100 bg-slate-50" },
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

      {/* User list */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="w-full h-20 rounded-xl" />
          ))
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No team members yet</p>
          </div>
        ) : (
          users.map((u) => {
            const isCurrentUser = u.id === currentUser?.id;
            const location = locations.find((l) => l.id === u.default_location_id);
            const initials = u.full_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card
                  className={`border shadow-sm hover:shadow-md transition-shadow ${
                    !u.is_active ? "opacity-60" : "border-slate-200"
                  }`}
                >
                  <CardContent className="p-5 flex items-center gap-4">
                    {/* Avatar */}
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-display font-bold text-sm shrink-0 ${
                        u.is_active ? "bg-primary" : "bg-slate-300"
                      }`}
                    >
                      {initials}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <p className="font-semibold text-foreground">{u.full_name}</p>
                        {isCurrentUser && (
                          <span className="text-xs text-primary font-medium">(you)</span>
                        )}
                        <RoleBadge role={u.role} />
                        {!u.is_active && (
                          <Badge
                            variant="outline"
                            className="text-xs border-slate-300 text-slate-400"
                          >
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 truncate">{u.email}</p>
                      {location && (
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {location.name}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    {canEdit && !isCurrentUser && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleActiveMutation.mutate(u)}
                          disabled={toggleActiveMutation.isPending}
                          className="text-slate-400 hover:text-primary transition-colors"
                          title={u.is_active ? "Deactivate" : "Activate"}
                        >
                          {u.is_active ? (
                            <ToggleRight className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <ToggleLeft className="w-5 h-5" />
                          )}
                        </button>
                        <TableRowActions
                          itemName={u.full_name}
                          onEdit={() => openEdit(u)}
                          onDelete={() => deleteMutation.mutate(u.id)}
                          confirmTitle={`Delete ${u.full_name}?`}
                          confirmDescription="This cannot be undone."
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

      {/* ─── Create Member Dialog ─── */}
      <Dialog open={showCreate} onOpenChange={(o) => !o && setShowCreate(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Add Team Member</DialogTitle>
            <DialogDescription>
              Create a new login account for a stylist, manager, or admin.
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
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Mike Johnson"
                value={createForm.full_name}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, full_name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                placeholder="mike@salon.com"
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showCreatePassword ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  value={createForm.password}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-foreground transition-colors"
                  aria-label={showCreatePassword ? "Hide password" : "Show password"}
                >
                  {showCreatePassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty to send an email invitation.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select
                  value={createForm.role}
                  onValueChange={(v) =>
                    setCreateForm((f) => ({ ...f, role: v as UserRole }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {isAdmin && <SelectItem value="ADMIN">Admin</SelectItem>}
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Default Location</Label>
                {locations.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No locations available yet.
                  </p>
                ) : (
                  <Select
                    value={createForm.default_location_id}
                    onValueChange={(v) =>
                      setCreateForm((f) => ({ ...f, default_location_id: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
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
                if (!createForm.full_name || !createForm.email) {
                  setFormError("Full name and email are required.");
                  return;
                }
                const pw = createForm.password.trim();
                if (pw !== "" && pw.length < 8) {
                  setFormError("Password must be at least 8 characters.");
                  return;
                }
                createMutation.mutate();
              }}
              disabled={createMutation.isPending}
              className="bg-primary text-white hover:bg-primary/90 rounded-full"
            >
              {createMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Adding…
                </span>
              ) : (
                "Add Member"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Member Dialog ─── */}
      <Dialog open={!!editingUser} onOpenChange={(o) => !o && setEditingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Team Member</DialogTitle>
            <DialogDescription>
              Update role, status, or default location for {editingUser?.full_name}.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {formError}
            </div>
          )}

          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input
                value={editForm.full_name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, full_name: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(v) =>
                    setEditForm((f) => ({ ...f, role: v as UserRole }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {isAdmin && <SelectItem value="ADMIN">Admin</SelectItem>}
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Default Location</Label>
                <Select
                  value={editForm.default_location_id || "__none__"}
                  onValueChange={(v) =>
                    setEditForm((f) => ({ ...f, default_location_id: v === "__none__" ? "" : v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingUser(null)}
              className="rounded-full"
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setFormError(null);
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


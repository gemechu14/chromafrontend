import type { User } from "@/lib/types";

/**
 * Platform operators: global catalog + tenant management.
 * Prefer API checks; this is for routing and UX only.
 */
export function isPlatformSuperAdmin(user: User | null | undefined): boolean {
  return (
    !!user &&
    user.role === "SUPER_ADMIN" &&
    user.is_platform_tenant === true
  );
}

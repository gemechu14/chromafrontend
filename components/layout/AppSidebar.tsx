"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FlaskConical,
  Package,
  Users,
  BookOpen,
  UsersRound,
  MapPin,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { SidebarAccountFooter } from "@/components/layout/SidebarAccountFooter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import type { UserRole } from "@/lib/types";

const coreNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Formula Builder", url: "/formulas", icon: FlaskConical },
  { title: "Inventory", url: "/inventory", icon: Package },
  { title: "Customers", url: "/customers", icon: Users },
];

const managementNav = [
  { title: "Products", url: "/products", icon: BookOpen },
  { title: "Team", url: "/team", icon: UsersRound },
  { title: "Locations", url: "/locations", icon: MapPin },
];

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = usePathname();

  function closeMobileNav() {
    if (isMobile) setOpenMobile(false);
  }
  const { user } = useAuth();
  const userRole: UserRole | undefined = user?.role;

  function NavGroup({
    label,
    items,
  }: {
    label: string;
    items: { title: string; url: string; icon: React.ElementType }[];
  }) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase text-xs tracking-widest">
          {label}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => {
              const isActive = pathname === item.url;
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={item.url}
                      onClick={closeMobileNav}
                      className={cn(
                        "flex items-center gap-2 hover:bg-sidebar-accent/60 transition-colors",
                        isActive && "bg-sidebar-accent text-sidebar-primary font-medium"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <span className="font-display text-lg font-semibold text-sidebar-foreground tracking-wide">
              Chroma
            </span>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label="Salon" items={coreNav} />
        {/* Management section: Only visible to ADMIN and MANAGER */}
        {(userRole === "ADMIN" || userRole === "MANAGER") && (
          <NavGroup label="Manage" items={managementNav} />
        )}
      </SidebarContent>
      <SidebarAccountFooter settingsHref="/settings" variant="salon" />
    </Sidebar>
  );
}

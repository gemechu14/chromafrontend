"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  Building2,
  Users,
  FlaskConical,
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

const platformNav = [
  { title: "Dashboard", url: "/platform", icon: LayoutDashboard },
  { title: "Global catalog", url: "/platform/catalog", icon: Database },
  { title: "Tenants", url: "/platform/tenants", icon: Building2 },
  { title: "Salon users", url: "/platform/users", icon: Users },
];

export function PlatformSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = usePathname();

  function closeMobileNav() {
    if (isMobile) setOpenMobile(false);
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/90 flex items-center justify-center">
            <FlaskConical className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-display text-sm font-semibold text-sidebar-foreground tracking-wide">
                Chroma
              </span>
              <span className="text-[10px] uppercase tracking-widest text-amber-400/90">
                Platform
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase text-xs tracking-widest">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {platformNav.map((item) => {
                const isActive =
                  item.url === "/platform"
                    ? pathname === "/platform"
                    : pathname.startsWith(item.url);
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
      </SidebarContent>
      <SidebarAccountFooter settingsHref="/platform/settings" variant="platform" />
    </Sidebar>
  );
}

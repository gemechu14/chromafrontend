"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, LogOut, Settings } from "lucide-react";
import {
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type Variant = "salon" | "platform";

const variantStyles: Record<
  Variant,
  { avatar: string; card: string; chevron: string }
> = {
  salon: {
    avatar:
      "bg-primary/15 text-primary ring-2 ring-primary/20 dark:ring-primary/30",
    card: "hover:bg-sidebar-accent/80",
    chevron: "text-sidebar-foreground/45",
  },
  platform: {
    avatar: "bg-amber-500/25 text-amber-100 ring-2 ring-amber-400/30",
    card: "hover:bg-sidebar-accent/80",
    chevron: "text-sidebar-foreground/45",
  },
};

interface SidebarAccountFooterProps {
  settingsHref: string;
  variant: Variant;
}

export function SidebarAccountFooter({
  settingsHref,
  variant,
}: SidebarAccountFooterProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const styles = variantStyles[variant];

  const name = user?.full_name?.trim() || "Signed in";
  const email = user?.email?.trim() || "";
  const initials = initialsFromName(name);

  function closeMobileNav() {
    if (isMobile) setOpenMobile(false);
  }

  function handleLogout() {
    closeMobileNav();
    logout();
    router.push("/login");
  }

  const triggerButton = (
    <button
      type="button"
      title={collapsed ? name : undefined}
      className={cn(
        "flex w-full min-w-0 items-center gap-3 rounded-xl border border-sidebar-border/60 bg-sidebar-accent/25 px-2.5 py-2.5 text-left outline-none transition-colors",
        styles.card,
        "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        collapsed && "justify-center gap-0 border-transparent bg-transparent px-2 py-2 hover:bg-sidebar-accent/50",
      )}
    >
      <Avatar className={cn("h-9 w-9 shrink-0 shadow-sm", collapsed && "h-10 w-10")}>
        <AvatarFallback className={cn("text-xs font-semibold", styles.avatar)}>
          {initials}
        </AvatarFallback>
      </Avatar>
      {!collapsed && (
        <>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight text-sidebar-foreground">
              {name}
            </p>
            {email ? (
              <p className="truncate text-xs text-sidebar-foreground/55">{email}</p>
            ) : null}
          </div>
          <ChevronsUpDown className={cn("h-4 w-4 shrink-0", styles.chevron)} />
        </>
      )}
    </button>
  );

  return (
    <SidebarFooter className="border-t border-sidebar-border/70 p-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{triggerButton}</DropdownMenuTrigger>
        <DropdownMenuContent
          className="z-[100] w-64 rounded-xl border border-border/80 p-1.5 shadow-lg"
          side={collapsed ? "right" : "top"}
          align="end"
          sideOffset={8}
        >
          <DropdownMenuLabel className="px-2 py-2 font-normal">
            <div className="flex flex-col gap-0.5">
              <span className="truncate text-sm font-semibold text-foreground">
                {name}
              </span>
              {email ? (
                <span className="truncate text-xs text-muted-foreground">{email}</span>
              ) : null}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-border/80" />
          <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-2 py-2">
            <Link href={settingsHref} onClick={closeMobileNav} className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-border/80" />
          <DropdownMenuItem
            className="cursor-pointer rounded-lg px-2 py-2 text-destructive focus:bg-destructive/10 focus:text-destructive flex items-center gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarFooter>
  );
}

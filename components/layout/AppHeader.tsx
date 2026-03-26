"use client";

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const { user } = useAuth();
  const { isMobile, openMobile, toggleSidebar } = useSidebar();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6",
        "md:h-14 md:border-border md:bg-card md:px-4",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {isMobile ? (
          <button
            type="button"
            className="shrink-0 rounded-md p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-foreground"
            onClick={toggleSidebar}
            aria-expanded={openMobile}
            aria-label={openMobile ? "Close navigation menu" : "Open navigation menu"}
          >
            {openMobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        ) : (
          <>
            <SidebarTrigger className="shrink-0" />
            <span className="min-w-0 flex-1 truncate font-body text-sm text-muted-foreground">
              {user?.full_name ?? "Salon"}
            </span>
          </>
        )}
      </div>
    </header>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { PlatformSidebar } from "@/components/layout/PlatformSidebar";
import { PlatformHeader } from "@/components/layout/PlatformHeader";
import { useAuth } from "@/contexts/auth-context";
import { isPlatformSuperAdmin } from "@/lib/auth-roles";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function PlatformAuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && !isPlatformSuperAdmin(user)) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!isPlatformSuperAdmin(user)) {
    return null;
  }

  return <>{children}</>;
}

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PlatformAuthGuard>
          <SidebarProvider>
            <div className="min-h-screen flex w-full">
              <PlatformSidebar />
              <div className="flex-1 flex flex-col">
                <PlatformHeader />
                <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
              </div>
            </div>
          </SidebarProvider>
        </PlatformAuthGuard>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

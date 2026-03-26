"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const PAGE_SIZES = [10, 25, 50] as const;

export function PlatformTableWrap({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden",
        className
      )}
    >
      {children}
    </div>
  );
}

export function PlatformTablePagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  className,
}: {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onPageSizeChange?: (s: number) => void;
  className?: string;
}) {
  const safeTotalPages = Math.max(1, totalPages);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3.5 border-t border-slate-100 bg-slate-50/50",
        className
      )}
    >
      <p className="text-sm text-muted-foreground tabular-nums">
        {total === 0 ? (
          <span>No results</span>
        ) : (
          <>
            Showing <span className="font-medium text-foreground">{from}</span>
            {"–"}
            <span className="font-medium text-foreground">{to}</span>
            <span className="text-muted-foreground"> of </span>
            <span className="font-medium text-foreground">{total}</span>
          </>
        )}
      </p>

      <div className="flex flex-wrap items-center gap-2 justify-end">
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Rows per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => onPageSizeChange(Number(v))}
            >
              <SelectTrigger className="h-8 w-[4.5rem] text-xs bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2 bg-white"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground px-2 tabular-nums min-w-[5.5rem] text-center">
            Page {page} / {safeTotalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2 bg-white"
            disabled={page >= safeTotalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

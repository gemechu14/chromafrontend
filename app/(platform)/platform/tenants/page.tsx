"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { tenantsApi } from "@/lib/api/tenants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  PlatformTablePagination,
  PlatformTableWrap,
} from "@/components/platform/platform-data-table";

export default function PlatformTenantsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ["platform-tenants", "paged", page, pageSize],
    queryFn: () => tenantsApi.list(page, pageSize, { includePlatform: false }),
  });

  const tenants = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.total_pages ?? 1;

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Salon tenants</h1>
        <p className="text-muted-foreground mt-1 leading-relaxed">
          Salon organizations on the platform. The platform tenant itself is omitted from this list.
        </p>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
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
    </div>
  );
}

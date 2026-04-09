"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { productsApi } from "@/lib/api/products";
import { ApiRequestError } from "@/lib/api/client";
import type {
  Brand,
  ProductLine,
  Product,
  ProductCategory,
  PackSizeUnit,
  CreateProductRequest,
  UpdateProductRequest,
  ToneFamilyCode,
  ColorFamily,
} from "@/lib/types";
import { TONE_FAMILY_LABELS, COLOR_FAMILY_LABELS } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  PlatformTablePagination,
  PlatformTableWrap,
} from "@/components/platform/platform-data-table";
import { TableRowActions } from "@/components/ui/table-row-actions";

// ─── Helpers ────────────────────────────────────────────────────────────────────

const TONE_FAMILIES_LIST: ToneFamilyCode[] = ["N", "A", "G", "V", "R", "C", "M", "H", "B", "P", "T"];
const COLOR_FAMILIES_LIST: ColorFamily[] = ["NEUTRAL", "COOL", "WARM", "RED", "SPECIAL"];
const LEVELS_LIST = Array.from({ length: 10 }, (_, i) => i + 1);

/** Radix Select forbids `value=""` on SelectItem. */
const SELECT_NONE = "__none__";

function isColorCategory(category: ProductCategory | undefined): boolean {
  return category === "COLOR" || category === "TONER";
}

function hexForColorPickerValue(hex: string): string {
  return /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : "#000000";
}

// ─── Page ────────────────────────────────────────────────────────────────────────

export default function PlatformCatalogPage() {
  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Global catalog</h1>
        <p className="text-muted-foreground mt-1 leading-relaxed">
          Brands, lines, and products shared across all salons. Salon staff can browse this catalog;
          only platform operators can create or change it.
        </p>
      </div>

      <Tabs defaultValue="brands" className="space-y-6">
        <TabsList className="bg-slate-100/80 p-1 rounded-lg border border-slate-200/80">
          <TabsTrigger value="brands" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Brands
          </TabsTrigger>
          <TabsTrigger value="lines" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Product lines
          </TabsTrigger>
          <TabsTrigger value="products" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Products
          </TabsTrigger>
        </TabsList>
        <TabsContent value="brands"><BrandsPanel /></TabsContent>
        <TabsContent value="lines"><LinesPanel /></TabsContent>
        <TabsContent value="products"><ProductsPanel /></TabsContent>
      </Tabs>
    </div>
  );
}

// ─── BrandsPanel ─────────────────────────────────────────────────────────────────

function BrandsPanel() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data, isLoading } = useQuery({
    queryKey: ["platform-brands-paged", page, pageSize],
    queryFn: () => productsApi.listBrands(page, pageSize),
  });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");

  const invalidateBrands = () => {
    qc.invalidateQueries({ queryKey: ["platform-brands-paged"] });
    qc.invalidateQueries({ queryKey: ["platform-brands-options"] });
  };

  const createMut = useMutation({
    mutationFn: () => productsApi.createBrand({ name: name.trim(), website_url: website || undefined }),
    onSuccess: () => { invalidateBrands(); toast.success("Brand created"); setOpen(false); setName(""); setWebsite(""); setPage(1); },
    onError: (e: unknown) => toast.error(e instanceof ApiRequestError ? e.message : "Could not create brand"),
  });
  const updateMut = useMutation({
    mutationFn: () => editing ? productsApi.updateBrand(editing.id, { name: name.trim(), website_url: website || undefined }) : Promise.reject(),
    onSuccess: () => { invalidateBrands(); toast.success("Brand updated"); setEditing(null); },
    onError: (e: unknown) => toast.error(e instanceof ApiRequestError ? e.message : "Could not update brand"),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => productsApi.deleteBrand(id),
    onSuccess: () => { invalidateBrands(); toast.success("Brand deleted"); },
    onError: (e: unknown) => toast.error(e instanceof ApiRequestError ? e.message : "Could not delete brand"),
  });

  const brands = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.total_pages ?? 1;

  return (
    <Card className="border border-slate-200 shadow-sm bg-white">
      <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-slate-100/80 pb-4">
        <div>
          <CardTitle className="font-display text-lg">Brands</CardTitle>
          <CardDescription>Manufacturers (e.g. Redken, Wella).</CardDescription>
        </div>
        <Button size="sm" className="gradient-primary text-white border-0 shadow-primary" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add brand
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary/60" /></div>
        ) : (
          <PlatformTableWrap>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100 hover:bg-transparent">
                    <TableHead className="bg-slate-50/90 text-muted-foreground font-semibold h-11">Name</TableHead>
                    <TableHead className="bg-slate-50/90 text-muted-foreground font-semibold h-11">Website</TableHead>
                    <TableHead className="text-right bg-slate-50/90 text-muted-foreground font-semibold h-11 w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brands.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">No brands yet.</TableCell></TableRow>
                  ) : brands.map((b) => (
                    <TableRow key={b.id} className="border-slate-100 hover:bg-slate-50/70">
                      <TableCell className="font-medium text-foreground">{b.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-md truncate">{b.website_url ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <TableRowActions
                            itemName={b.name}
                            onEdit={() => {
                              setEditing(b);
                              setName(b.name);
                              setWebsite(b.website_url ?? "");
                            }}
                            onDelete={() => deleteMut.mutate(b.id)}
                            confirmTitle={`Delete brand “${b.name}”?`}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <PlatformTablePagination page={page} pageSize={pageSize} total={total} totalPages={totalPages}
              onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
          </PlatformTableWrap>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">New brand</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Redken" /></div>
            <div className="space-y-2"><Label>Website (optional)</Label><Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => createMut.mutate()} disabled={!name.trim() || createMut.isPending}>
              {createMut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Edit brand</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Website (optional)</Label><Input value={website} onChange={(e) => setWebsite(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => updateMut.mutate()} disabled={!name.trim() || updateMut.isPending}>
              {updateMut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ─── LinesPanel ──────────────────────────────────────────────────────────────────

function LinesPanel() {
  const qc = useQueryClient();
  const [brandId, setBrandId] = useState<string>("");
  const [linePage, setLinePage] = useState(1);
  const [linePageSize, setLinePageSize] = useState(10);
  const { data: brandsOptions } = useQuery({ queryKey: ["platform-brands-options"], queryFn: () => productsApi.listBrands(1, 500) });
  useEffect(() => { setLinePage(1); }, [brandId]);
  const { data: linesPage, isLoading } = useQuery({
    queryKey: ["platform-lines-paged", brandId, linePage, linePageSize],
    queryFn: () => productsApi.listProductLines(brandId, linePage, linePageSize),
    enabled: !!brandId,
  });
  const [open, setOpen] = useState(false);
  const [lineName, setLineName] = useState("");
  const [category, setCategory] = useState<ProductCategory>("COLOR");
  const [editing, setEditing] = useState<ProductLine | null>(null);

  const invalidateLines = () => {
    qc.invalidateQueries({ queryKey: ["platform-lines-paged", brandId] });
    qc.invalidateQueries({ queryKey: ["platform-lines-options", brandId] });
  };

  const createMut = useMutation({
    mutationFn: () => productsApi.createProductLine({ brand_id: brandId, name: lineName.trim(), category }),
    onSuccess: () => { invalidateLines(); toast.success("Line created"); setOpen(false); setLineName(""); setCategory("COLOR"); setLinePage(1); },
    onError: (e: unknown) => toast.error(e instanceof ApiRequestError ? e.message : "Could not create line"),
  });
  const updateMut = useMutation({
    mutationFn: () => editing ? productsApi.updateProductLine(editing.id, { name: lineName.trim(), category }) : Promise.reject(),
    onSuccess: () => { invalidateLines(); toast.success("Line updated"); setEditing(null); },
    onError: (e: unknown) => toast.error(e instanceof ApiRequestError ? e.message : "Could not update line"),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => productsApi.deleteProductLine(id),
    onSuccess: () => { invalidateLines(); toast.success("Line deleted"); },
    onError: (e: unknown) => toast.error(e instanceof ApiRequestError ? e.message : "Could not delete line"),
  });

  const brands = brandsOptions?.items ?? [];
  const lines = linesPage?.items ?? [];
  const linesTotal = linesPage?.total ?? 0;
  const linesTotalPages = linesPage?.total_pages ?? 1;

  const categorySelector = (
    <div className="space-y-2">
      <Label>Category</Label>
      <Select value={category} onValueChange={(v) => setCategory(v as ProductCategory)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="COLOR">Color</SelectItem>
          <SelectItem value="DEVELOPER">Developer</SelectItem>
          <SelectItem value="TONER">Toner</SelectItem>
          <SelectItem value="TREATMENT">Treatment</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Card className="border border-slate-200 shadow-sm bg-white">
      <CardHeader className="border-b border-slate-100/80 pb-4">
        <CardTitle className="font-display text-lg">Product lines</CardTitle>
        <CardDescription>Choose a brand, then manage its product families.</CardDescription>
        <div className="pt-4 max-w-md">
          <Label className="mb-2 block text-foreground">Brand</Label>
          <Select value={brandId || undefined} onValueChange={setBrandId}>
            <SelectTrigger className="bg-white"><SelectValue placeholder="Select brand…" /></SelectTrigger>
            <SelectContent>
              {brands.map((b) => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="flex justify-end">
          <Button size="sm" disabled={!brandId} className="gradient-primary text-white border-0 shadow-primary" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add line
          </Button>
        </div>
        {!brandId ? (
          <p className="text-sm text-muted-foreground text-center py-12 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">Select a brand to load product lines.</p>
        ) : isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary/60" /></div>
        ) : (
          <PlatformTableWrap>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100 hover:bg-transparent">
                    <TableHead className="bg-slate-50/90 text-muted-foreground font-semibold h-11">Name</TableHead>
                    <TableHead className="bg-slate-50/90 text-muted-foreground font-semibold h-11">Category</TableHead>
                    <TableHead className="text-right bg-slate-50/90 text-muted-foreground font-semibold h-11 w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">No lines for this brand yet.</TableCell></TableRow>
                  ) : lines.map((ln) => (
                    <TableRow key={ln.id} className="border-slate-100 hover:bg-slate-50/70">
                      <TableCell className="font-medium">{ln.name}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{ln.category}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <TableRowActions
                            itemName={ln.name}
                            onEdit={() => {
                              setEditing(ln);
                              setLineName(ln.name);
                              setCategory(ln.category);
                            }}
                            onDelete={() => deleteMut.mutate(ln.id)}
                            confirmTitle={`Delete line “${ln.name}”?`}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <PlatformTablePagination page={linePage} pageSize={linePageSize} total={linesTotal} totalPages={linesTotalPages}
              onPageChange={setLinePage} onPageSizeChange={(s) => { setLinePageSize(s); setLinePage(1); }} />
          </PlatformTableWrap>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">New product line</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Name</Label><Input value={lineName} onChange={(e) => setLineName(e.target.value)} /></div>
            {categorySelector}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => createMut.mutate()} disabled={!lineName.trim() || createMut.isPending}>
              {createMut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Edit product line</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Name</Label><Input value={lineName} onChange={(e) => setLineName(e.target.value)} /></div>
            {categorySelector}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => updateMut.mutate()} disabled={!lineName.trim() || updateMut.isPending}>
              {updateMut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ─── ProductsPanel ───────────────────────────────────────────────────────────────

function ProductsPanel() {
  const qc = useQueryClient();
  const [brandId, setBrandId] = useState("");
  const [lineId, setLineId] = useState("");
  const [pPage, setPPage] = useState(1);
  const [pSize, setPSize] = useState(10);

  const { data: brandsOptions } = useQuery({ queryKey: ["platform-brands-options"], queryFn: () => productsApi.listBrands(1, 500) });
  const { data: linesOptionsPage } = useQuery({
    queryKey: ["platform-lines-options", brandId],
    queryFn: () => productsApi.listProductLines(brandId, 1, 500),
    enabled: !!brandId,
  });
  useEffect(() => { setPPage(1); }, [lineId]);

  const { data: productsPage, isLoading } = useQuery({
    queryKey: ["platform-products-paged", lineId, pPage, pSize],
    queryFn: () => productsApi.listProducts({ product_line_id: lineId, page: pPage, page_size: pSize }),
    enabled: !!lineId,
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [code, setCode] = useState("");
  const [pname, setPname] = useState("");
  const [packVal, setPackVal] = useState("60");
  const [packUnit, setPackUnit] = useState<PackSizeUnit>("G");
  const [toneFamily, setToneFamily] = useState("");
  const [level, setLevel] = useState("");
  const [colorFamily, setColorFamily] = useState("");
  const [hexCode, setHexCode] = useState("");

  const brands = brandsOptions?.items ?? [];
  const lines = linesOptionsPage?.items ?? [];
  const products = productsPage?.items ?? [];
  const prodTotal = productsPage?.total ?? 0;
  const prodTotalPages = productsPage?.total_pages ?? 1;
  const selectedLine = lines.find((l) => l.id === lineId);
  const showColor = isColorCategory(selectedLine?.category);
  const hexFormatOk = /^#[0-9A-Fa-f]{6}$/.test(hexCode.trim());
  const hexValid = !showColor || hexFormatOk;

  function resetForm() {
    setCode(""); setPname(""); setPackVal("60"); setPackUnit("G");
    setToneFamily(""); setLevel(""); setColorFamily(""); setHexCode("");
  }

  function openEditDialog(p: Product) {
    setEditing(p); setCode(p.code); setPname(p.name);
    setPackVal(p.pack_size_value.toString()); setPackUnit(p.pack_size_unit);
    setToneFamily(p.tone_family ?? ""); setLevel(p.level?.toString() ?? "");
    setColorFamily(p.color_family ?? ""); setHexCode(p.hex_code ?? "");
  }

  const createMut = useMutation({
    mutationFn: () => {
      const body: CreateProductRequest = {
        product_line_id: lineId, code: code.trim(), name: pname.trim(),
        pack_size_value: parseFloat(packVal) || 0, pack_size_unit: packUnit,
        tone_family: showColor && toneFamily ? (toneFamily as ToneFamilyCode) : null,
        level: showColor && level ? parseInt(level, 10) : null,
        color_family: showColor && colorFamily ? (colorFamily as ColorFamily) : null,
        hex_code: showColor ? hexCode.trim() : null,
        is_active: true,
      };
      return productsApi.createProduct(body);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["platform-products-paged", lineId] }); toast.success("Product created"); setOpen(false); resetForm(); setPPage(1); },
    onError: (e: unknown) => toast.error(e instanceof ApiRequestError ? e.message : "Could not create product"),
  });

  const updateMut = useMutation({
    mutationFn: () => {
      if (!editing) return Promise.reject();
      const body: UpdateProductRequest = {
        code: code.trim(), name: pname.trim(),
        pack_size_value: parseFloat(packVal) || 0, pack_size_unit: packUnit,
        tone_family: showColor && toneFamily ? (toneFamily as ToneFamilyCode) : null,
        level: showColor && level ? parseInt(level, 10) : null,
        color_family: showColor && colorFamily ? (colorFamily as ColorFamily) : null,
        hex_code: showColor ? hexCode.trim() : null,
      };
      return productsApi.updateProduct(editing.id, body);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["platform-products-paged", lineId] }); toast.success("Product updated"); setEditing(null); resetForm(); },
    onError: (e: unknown) => toast.error(e instanceof ApiRequestError ? e.message : "Could not update product"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => productsApi.deleteProduct(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["platform-products-paged", lineId] }); toast.success("Product deleted"); },
    onError: (e: unknown) => toast.error(e instanceof ApiRequestError ? e.message : "Could not delete product"),
  });

  const colorFormFields = showColor && (
    <>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label>Level (1–10)</Label>
          <Select
            value={level || SELECT_NONE}
            onValueChange={(v) => setLevel(v === SELECT_NONE ? "" : v)}
          >
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={SELECT_NONE}>None</SelectItem>
              {LEVELS_LIST.map((l) => (<SelectItem key={l} value={l.toString()}>{l}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Tone</Label>
          <Select
            value={toneFamily || SELECT_NONE}
            onValueChange={(v) => setToneFamily(v === SELECT_NONE ? "" : v)}
          >
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={SELECT_NONE}>None</SelectItem>
              {TONE_FAMILIES_LIST.map((t) => (<SelectItem key={t} value={t}>{t} — {TONE_FAMILY_LABELS[t]}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Color Family</Label>
          <Select
            value={colorFamily || SELECT_NONE}
            onValueChange={(v) => setColorFamily(v === SELECT_NONE ? "" : v)}
          >
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={SELECT_NONE}>None</SelectItem>
              {COLOR_FAMILIES_LIST.map((cf) => (<SelectItem key={cf} value={cf}>{COLOR_FAMILY_LABELS[cf]}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>
          Choose Color{" "}
          <span className="text-destructive" aria-hidden>
            *
          </span>
        </Label>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="color"
            aria-label="Pick color"
            className="h-9 w-12 cursor-pointer shrink-0 rounded-md border border-input bg-background p-0.5"
            value={hexForColorPickerValue(hexCode)}
            onChange={(e) => setHexCode(e.target.value)}
          />
          <Input
            value={hexCode}
            onChange={(e) => setHexCode(e.target.value)}
            placeholder="#A52B1F"
            maxLength={7}
            required={showColor}
            aria-invalid={showColor && hexCode.trim() !== "" && !hexFormatOk}
            className="min-w-[6.5rem] flex-1 font-mono text-sm"
          />
          {hexCode && /^#[0-9A-Fa-f]{6}$/.test(hexCode) && (
            <span className="h-8 w-8 rounded border border-slate-200 shrink-0" style={{ backgroundColor: hexCode }} aria-hidden />
          )}
        </div>
        {showColor && hexCode.trim() !== "" && !hexFormatOk && (
          <p className="text-xs text-destructive">Use a valid hex value like #A52B1F.</p>
        )}
      </div>
    </>
  );

  return (
    <Card className="border border-slate-200 shadow-sm bg-white">
      <CardHeader className="border-b border-slate-100/80 pb-4">
        <CardTitle className="font-display text-lg">Products</CardTitle>
        <CardDescription>Select brand and line, then manage SKUs.</CardDescription>
        <div className="grid gap-4 sm:grid-cols-2 pt-4 max-w-3xl">
          <div className="space-y-2">
            <Label className="text-foreground">Brand</Label>
            <Select value={brandId || undefined} onValueChange={(v) => { setBrandId(v); setLineId(""); }}>
              <SelectTrigger className="bg-white"><SelectValue placeholder="Brand…" /></SelectTrigger>
              <SelectContent>
                {brands.map((b) => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Product line</Label>
            <Select value={lineId || undefined} onValueChange={setLineId} disabled={!brandId}>
              <SelectTrigger className="bg-white"><SelectValue placeholder="Line…" /></SelectTrigger>
              <SelectContent>
                {lines.map((ln) => (
                  <SelectItem key={ln.id} value={ln.id}>
                    {ln.name} <span className="text-xs text-slate-400">({ln.category})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="flex justify-end">
          <Button size="sm" disabled={!lineId} className="gradient-primary text-white border-0 shadow-primary"
            onClick={() => { setEditing(null); resetForm(); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add product
          </Button>
        </div>
        {!lineId ? (
          <p className="text-sm text-muted-foreground text-center py-12 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
            Select a product line to load SKUs.
          </p>
        ) : isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary/60" /></div>
        ) : (
          <PlatformTableWrap>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100 hover:bg-transparent">
                    <TableHead className="bg-slate-50/90 text-muted-foreground font-semibold h-11 w-28">Code</TableHead>
                    <TableHead className="bg-slate-50/90 text-muted-foreground font-semibold h-11">Name</TableHead>
                    {showColor && (
                      <>
                        <TableHead className="bg-slate-50/90 text-muted-foreground font-semibold h-11 w-16 text-center">Lvl</TableHead>
                        <TableHead className="bg-slate-50/90 text-muted-foreground font-semibold h-11 w-20">Tone</TableHead>
                        <TableHead className="bg-slate-50/90 text-muted-foreground font-semibold h-11 w-24">Swatch</TableHead>
                      </>
                    )}
                    <TableHead className="bg-slate-50/90 text-muted-foreground font-semibold h-11 w-32">Pack</TableHead>
                    <TableHead className="text-right bg-slate-50/90 text-muted-foreground font-semibold h-11 w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={showColor ? 7 : 4} className="h-24 text-center text-muted-foreground">No products in this line yet.</TableCell>
                    </TableRow>
                  ) : products.map((p: Product) => (
                    <TableRow key={p.id} className="border-slate-100 hover:bg-slate-50/70">
                      <TableCell className="font-mono text-sm font-medium text-foreground">{p.code}</TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      {showColor && (
                        <>
                          <TableCell className="text-center tabular-nums">{p.level != null ? p.level : "—"}</TableCell>
                          <TableCell className="text-sm">{p.tone_family ?? "—"}</TableCell>
                          <TableCell>
                            {p.hex_code ? (
                              <span className="inline-flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-sm border border-slate-200" style={{ backgroundColor: p.hex_code }} />
                                <span className="text-xs font-mono text-slate-500">{p.hex_code}</span>
                              </span>
                            ) : "—"}
                          </TableCell>
                        </>
                      )}
                      <TableCell className="text-muted-foreground text-sm tabular-nums">{p.pack_size_value}{p.pack_size_unit.toLowerCase()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <TableRowActions
                            itemName={p.name}
                            onEdit={() => openEditDialog(p)}
                            onDelete={() => deleteMut.mutate(p.id)}
                            confirmTitle={`Delete product “${p.name}”?`}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <PlatformTablePagination page={pPage} pageSize={pSize} total={prodTotal} totalPages={prodTotalPages}
              onPageChange={setPPage} onPageSizeChange={(s) => { setPSize(s); setPPage(1); }} />
          </PlatformTableWrap>
        )}
      </CardContent>

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">New product</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Code</Label><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="07N" /></div>
            <div className="space-y-2"><Label>Display name</Label><Input value={pname} onChange={(e) => setPname(e.target.value)} /></div>
            {colorFormFields}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Pack size</Label>
                <Input value={packVal} onChange={(e) => setPackVal(e.target.value)} type="number" min="0" step="0.01" />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={packUnit} onValueChange={(v) => setPackUnit(v as PackSizeUnit)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="G">Grams (g)</SelectItem>
                    <SelectItem value="ML">Milliliters (ml)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createMut.mutate()}
              disabled={!code.trim() || !pname.trim() || !hexValid || createMut.isPending}
            >
              {createMut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) { setEditing(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Edit product</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Code</Label><Input value={code} onChange={(e) => setCode(e.target.value)} /></div>
            <div className="space-y-2"><Label>Display name</Label><Input value={pname} onChange={(e) => setPname(e.target.value)} /></div>
            {colorFormFields}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Pack size</Label>
                <Input value={packVal} onChange={(e) => setPackVal(e.target.value)} type="number" min="0" step="0.01" />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={packUnit} onValueChange={(v) => setPackUnit(v as PackSizeUnit)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="G">Grams (g)</SelectItem>
                    <SelectItem value="ML">Milliliters (ml)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditing(null); resetForm(); }}>Cancel</Button>
            <Button
              onClick={() => updateMut.mutate()}
              disabled={!code.trim() || !pname.trim() || !hexValid || updateMut.isPending}
            >
              {updateMut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

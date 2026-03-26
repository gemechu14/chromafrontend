# Chroma Inventory Pro

**Professional hair salon color mixing and inventory management SaaS.**

Chroma helps salon owners and stylists track every gram of color used, build precise formulas, automatically deduct inventory, and know the exact cost of every service.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| Animations | Framer Motion |
| Charts | Recharts |
| State / Data | TanStack React Query |
| Forms | React Hook Form + Zod |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) — you will see the public landing page.
Navigate to [http://localhost:3000/login](http://localhost:3000/login) to access the app.

---

## Project Structure

```
app/
  page.tsx                    # Public landing page
  login/page.tsx              # Login / sign-in
  (dashboard)/
    layout.tsx                # Dashboard shell (sidebar + header)
    dashboard/page.tsx        # Stats, charts, low-stock alerts
    formulas/page.tsx         # Color formula builder
    inventory/page.tsx        # Product inventory management
    customers/page.tsx        # Client profiles + formula history
components/
  layout/                     # AppSidebar, AppHeader
  landing/                    # Landing page sections
  ui/                         # shadcn/radix UI primitives
data/
  mockData.ts                 # Mock data + TypeScript interfaces
lib/
  utils.ts                    # Tailwind class helper (cn)
hooks/
  use-mobile.tsx
  use-toast.ts
docs/
  index.qmd                   # Full system design documentation
```

---

## System Design

The full data model and architecture is documented in [`docs/index.qmd`](docs/index.qmd).

Key entities:

- **Tenants** — one paying salon business per tenant
- **Locations** — branches within a tenant
- **Users** — stylists, managers, admins
- **Customers** — salon clients with complete formula history
- **Products** — global catalog: Brands → Product Lines → Products
- **Tenant Products** — salon-specific product catalog with custom pricing
- **Inventory Items** — per-location stock tracked in grams / milliliters
- **Formulas** — saved color recipes linked to customers
- **Formula Items** — individual products + amounts used in a formula
- **Inventory Transactions** — full audit log of all stock movements

---

## Color Palette

| Purpose | Color | Hex |
|---|---|---|
| Primary | Blue | `#2563EB` |
| Secondary | Sky Blue | `#38BDF8` |
| Accent | Emerald | `#10B981` |
| Background | Light | `#F8FAFC` |
| Foreground | Dark Navy | `#0F172A` |

// Mock data for Chroma SaaS

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  lastVisit: string;
  totalVisits: number;
}

export interface Product {
  id: string;
  brand: string;
  line: string;
  code: string;
  name: string;
  toneFamily: string;
  packSize: number;
  packUnit: "g" | "ml";
  unitCost: number;
  onHandQty: number;
  reorderLevel: number;
}

export interface FormulaItem {
  productId: string;
  productName: string;
  brand: string;
  amount: number;
  unit: "g" | "ml";
  cost: number;
}

export interface Formula {
  id: string;
  customerId: string;
  customerName: string;
  stylist: string;
  date: string;
  serviceType: string;
  items: FormulaItem[];
  totalCost: number;
  notes: string;
}

export const customers: Customer[] = [
  { id: "c1", name: "Sarah Mitchell", phone: "(555) 123-4567", email: "sarah@email.com", notes: "Sensitive scalp, prefers ammonia-free", lastVisit: "2026-03-05", totalVisits: 12 },
  { id: "c2", name: "Jessica Rivera", phone: "(555) 234-5678", email: "jessica@email.com", notes: "Always wants warm tones", lastVisit: "2026-03-08", totalVisits: 8 },
  { id: "c3", name: "Amanda Chen", phone: "(555) 345-6789", email: "amanda@email.com", notes: "Balayage specialist client", lastVisit: "2026-02-28", totalVisits: 15 },
  { id: "c4", name: "Lauren Brooks", phone: "(555) 456-7890", email: "lauren@email.com", notes: "Platinum blonde maintenance", lastVisit: "2026-03-01", totalVisits: 20 },
  { id: "c5", name: "Emily Watson", phone: "(555) 567-8901", email: "emily@email.com", notes: "New client - color correction", lastVisit: "2026-03-09", totalVisits: 2 },
  { id: "c6", name: "Maria Santos", phone: "(555) 678-9012", email: "maria@email.com", notes: "Grey coverage every 4 weeks", lastVisit: "2026-03-03", totalVisits: 24 },
];

export const products: Product[] = [
  { id: "p1", brand: "Redken", line: "Shades EQ", code: "09N", name: "Café Au Lait", toneFamily: "Natural", packSize: 60, packUnit: "g", unitCost: 0.18, onHandQty: 240, reorderLevel: 120 },
  { id: "p2", brand: "Redken", line: "Shades EQ", code: "07N", name: "Mirage", toneFamily: "Natural", packSize: 60, packUnit: "g", unitCost: 0.18, onHandQty: 180, reorderLevel: 120 },
  { id: "p3", brand: "Redken", line: "Shades EQ", code: "07A", name: "Smoky Quartz", toneFamily: "Ash", packSize: 60, packUnit: "g", unitCost: 0.18, onHandQty: 90, reorderLevel: 120 },
  { id: "p4", brand: "Redken", line: "Shades EQ", code: "06G", name: "Mango", toneFamily: "Gold", packSize: 60, packUnit: "g", unitCost: 0.18, onHandQty: 300, reorderLevel: 120 },
  { id: "p5", brand: "Wella", line: "Koleston Perfect", code: "7/0", name: "Medium Blonde", toneFamily: "Natural", packSize: 60, packUnit: "g", unitCost: 0.22, onHandQty: 150, reorderLevel: 100 },
  { id: "p6", brand: "Wella", line: "Koleston Perfect", code: "8/1", name: "Light Ash Blonde", toneFamily: "Ash", packSize: 60, packUnit: "g", unitCost: 0.22, onHandQty: 60, reorderLevel: 100 },
  { id: "p7", brand: "Redken", line: "Processing", code: "DEV20", name: "20 Vol Developer", toneFamily: "-", packSize: 1000, packUnit: "ml", unitCost: 0.02, onHandQty: 2500, reorderLevel: 1000 },
  { id: "p8", brand: "Redken", line: "Processing", code: "DEV30", name: "30 Vol Developer", toneFamily: "-", packSize: 1000, packUnit: "ml", unitCost: 0.02, onHandQty: 1800, reorderLevel: 1000 },
  { id: "p9", brand: "Schwarzkopf", line: "Igora Royal", code: "6-0", name: "Dark Blonde Natural", toneFamily: "Natural", packSize: 60, packUnit: "g", unitCost: 0.20, onHandQty: 120, reorderLevel: 100 },
  { id: "p10", brand: "Schwarzkopf", line: "Igora Royal", code: "9-1", name: "Extra Light Ash Blonde", toneFamily: "Ash", packSize: 60, packUnit: "g", unitCost: 0.20, onHandQty: 45, reorderLevel: 100 },
];

export const formulas: Formula[] = [
  {
    id: "f1", customerId: "c1", customerName: "Sarah Mitchell", stylist: "Mike Johnson", date: "2026-03-05", serviceType: "Root Touch-Up",
    items: [
      { productId: "p2", productName: "7N Mirage", brand: "Redken Shades EQ", amount: 30, unit: "g", cost: 5.40 },
      { productId: "p3", productName: "7A Smoky Quartz", brand: "Redken Shades EQ", amount: 15, unit: "g", cost: 2.70 },
      { productId: "p7", productName: "20 Vol Developer", brand: "Redken", amount: 45, unit: "ml", cost: 0.90 },
    ],
    totalCost: 9.00, notes: "Natural ash blend, 30 min processing"
  },
  {
    id: "f2", customerId: "c2", customerName: "Jessica Rivera", stylist: "Lisa Park", date: "2026-03-08", serviceType: "Full Color",
    items: [
      { productId: "p4", productName: "6G Mango", brand: "Redken Shades EQ", amount: 40, unit: "g", cost: 7.20 },
      { productId: "p1", productName: "09N Café Au Lait", brand: "Redken Shades EQ", amount: 20, unit: "g", cost: 3.60 },
      { productId: "p7", productName: "20 Vol Developer", brand: "Redken", amount: 60, unit: "ml", cost: 1.20 },
    ],
    totalCost: 12.00, notes: "Warm golden tones as requested"
  },
  {
    id: "f3", customerId: "c3", customerName: "Amanda Chen", stylist: "Mike Johnson", date: "2026-02-28", serviceType: "Balayage",
    items: [
      { productId: "p5", productName: "7/0 Medium Blonde", brand: "Wella Koleston", amount: 25, unit: "g", cost: 5.50 },
      { productId: "p6", productName: "8/1 Light Ash Blonde", brand: "Wella Koleston", amount: 35, unit: "g", cost: 7.70 },
      { productId: "p8", productName: "30 Vol Developer", brand: "Redken", amount: 60, unit: "ml", cost: 1.20 },
    ],
    totalCost: 14.40, notes: "Sun-kissed balayage, natural grow-out"
  },
  {
    id: "f4", customerId: "c4", customerName: "Lauren Brooks", stylist: "Lisa Park", date: "2026-03-01", serviceType: "Platinum Retouch",
    items: [
      { productId: "p10", productName: "9-1 Extra Light Ash Blonde", brand: "Schwarzkopf Igora", amount: 50, unit: "g", cost: 10.00 },
      { productId: "p8", productName: "30 Vol Developer", brand: "Redken", amount: 75, unit: "ml", cost: 1.50 },
    ],
    totalCost: 11.50, notes: "Full head platinum maintenance, toned with 9-1"
  },
  {
    id: "f5", customerId: "c6", customerName: "Maria Santos", stylist: "Mike Johnson", date: "2026-03-03", serviceType: "Grey Coverage",
    items: [
      { productId: "p9", productName: "6-0 Dark Blonde", brand: "Schwarzkopf Igora", amount: 40, unit: "g", cost: 8.00 },
      { productId: "p7", productName: "20 Vol Developer", brand: "Redken", amount: 40, unit: "ml", cost: 0.80 },
    ],
    totalCost: 8.80, notes: "100% grey coverage, natural look"
  },
];

export const dashboardStats = {
  totalProducts: 10,
  lowStockItems: 3,
  formulasThisMonth: 28,
  avgCostPerService: 11.14,
  totalRevenueSaved: 342.50,
  topProducts: [
    { name: "7N Mirage", usage: 450 },
    { name: "09N Café Au Lait", usage: 380 },
    { name: "6G Mango", usage: 320 },
    { name: "20 Vol Developer", usage: 1200 },
    { name: "7/0 Medium Blonde", usage: 280 },
  ],
  monthlyUsage: [
    { month: "Oct", cost: 280 },
    { month: "Nov", cost: 310 },
    { month: "Dec", cost: 295 },
    { month: "Jan", cost: 340 },
    { month: "Feb", cost: 325 },
    { month: "Mar", cost: 185 },
  ],
};









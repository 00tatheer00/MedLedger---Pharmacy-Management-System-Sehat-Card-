/**
 * MedLedger — Centralized Demo Data
 *
 * All dashboard demo values are defined here to maintain consistency
 * across KPI cards, tables, alerts, and charts.
 *
 * ⚠️ THIS IS FICTIONAL DATA FOR UI DEVELOPMENT ONLY.
 * It does not represent real hospital records or patient information.
 */

// ---- KPI Summary ----
export const kpiData = {
  totalMedicines: 1_247,
  lowStockItems: 23,
  expiringMedicines: 18,
  pendingClaims: 7,
} as const;

// ---- Status types ----
export type ActivityStatus = 'completed' | 'pending' | 'cancelled';
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock' | 'expired';

// ---- Recent Activity ----
export interface ActivityItem {
  id: string;
  refNumber: string;
  type: 'receipt' | 'dispensing' | 'adjustment' | 'return';
  summary: string;
  date: string;
  status: ActivityStatus;
}

export const recentActivity: ActivityItem[] = [
  {
    id: 'act-001',
    refNumber: 'GRN-2026-0451',
    type: 'receipt',
    summary: 'Amoxicillin 500mg × 200 units from Allied Pharma',
    date: '2026-10-12',
    status: 'completed',
  },
  {
    id: 'act-002',
    refNumber: 'DSP-2026-1287',
    type: 'dispensing',
    summary: 'Paracetamol 500mg × 30, Omeprazole 20mg × 14',
    date: '2026-10-12',
    status: 'completed',
  },
  {
    id: 'act-003',
    refNumber: 'GRN-2026-0452',
    type: 'receipt',
    summary: 'Metformin 500mg × 500 units from National Distributors',
    date: '2026-10-12',
    status: 'pending',
  },
  {
    id: 'act-004',
    refNumber: 'DSP-2026-1288',
    type: 'dispensing',
    summary: 'Ciprofloxacin 250mg × 20, Ibuprofen 400mg × 10',
    date: '2026-10-11',
    status: 'completed',
  },
  {
    id: 'act-005',
    refNumber: 'ADJ-2026-0089',
    type: 'adjustment',
    summary: 'Ceftriaxone 1g — expired batch write-off (15 units)',
    date: '2026-10-11',
    status: 'completed',
  },
  {
    id: 'act-006',
    refNumber: 'DSP-2026-1289',
    type: 'dispensing',
    summary: 'Amlodipine 5mg × 28, Losartan 50mg × 28',
    date: '2026-10-11',
    status: 'completed',
  },
];

// ---- Priority Alerts ----
export interface AlertItem {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  timestamp: string;
}

export const priorityAlerts: AlertItem[] = [
  {
    id: 'alert-001',
    severity: 'critical',
    title: 'Insulin Glargine — Out of Stock',
    description: 'Current stock: 0 units. Last supplied: 2026-09-28.',
    timestamp: '2026-10-12T14:30:00',
  },
  {
    id: 'alert-002',
    severity: 'critical',
    title: 'Ceftriaxone 1g — Batch B-2026-047 Expired',
    description: '15 units expired on 2026-10-10. Requires write-off.',
    timestamp: '2026-10-11T09:00:00',
  },
  {
    id: 'alert-003',
    severity: 'warning',
    title: 'Amoxicillin 250mg Suspension — Low Stock',
    description: 'Current stock: 8 bottles. Minimum threshold: 20.',
    timestamp: '2026-10-12T11:15:00',
  },
  {
    id: 'alert-004',
    severity: 'warning',
    title: 'Claim CLM-2026-019 — Awaiting Finance Review',
    description: 'Submitted 5 days ago. Total: PKR 142,350.',
    timestamp: '2026-10-07T16:00:00',
  },
  {
    id: 'alert-005',
    severity: 'info',
    title: 'Metformin 500mg — Batch Expiring in 45 Days',
    description: 'Batch B-2026-031: 120 units expiring 2026-11-27.',
    timestamp: '2026-10-12T08:00:00',
  },
];

// ---- Inventory Summary (for chart) ----
export const inventorySummary = {
  inStock: 1_189,
  lowStock: 23,
  outOfStock: 12,
  expired: 23,
  total: 1_247,
} as const;

// ---- Quick Actions ----
export interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  available: boolean;
}

export const quickActions: QuickAction[] = [
  {
    id: 'qa-add-medicine',
    label: 'Add Medicine',
    description: 'Register a new medicine in the catalogue',
    icon: 'pill',
    available: false,
  },
  {
    id: 'qa-receive-stock',
    label: 'Receive Stock',
    description: 'Record goods receipt from a supplier',
    icon: 'package-plus',
    available: false,
  },
  {
    id: 'qa-dispense',
    label: 'Record Dispensing',
    description: 'Dispense medicines against a prescription',
    icon: 'clipboard-check',
    available: false,
  },
  {
    id: 'qa-review-claims',
    label: 'Review Claims',
    description: 'Review pending hospital claims',
    icon: 'file-check',
    available: false,
  },
];

// ---- Demo Catalogue Medicines (for Search & Preview) ----
export interface DemoMedicine {
  id: string;
  name: string;
  genericName: string;
  dosageForm: string;
  strength: string;
  category: string;
}

export const catalogueMedicines: DemoMedicine[] = [
  {
    id: 'med-001',
    name: 'Amoxicillin 500mg',
    genericName: 'Amoxicillin Trihydrate',
    dosageForm: 'Capsule',
    strength: '500mg',
    category: 'Antibiotics & Antimicrobials',
  },
  {
    id: 'med-002',
    name: 'Ceftriaxone 1g',
    genericName: 'Ceftriaxone Sodium',
    dosageForm: 'Vial',
    strength: '1g',
    category: 'Antibiotics & Antimicrobials',
  },
  {
    id: 'med-003',
    name: 'Metformin 500mg',
    genericName: 'Metformin HCl',
    dosageForm: 'Tablet',
    strength: '500mg',
    category: 'Diabetes & Endocrine',
  },
  {
    id: 'med-004',
    name: 'Paracetamol 500mg',
    genericName: 'Acetaminophen',
    dosageForm: 'Tablet',
    strength: '500mg',
    category: 'Analgesics & Anti-inflammatory',
  },
  {
    id: 'med-005',
    name: 'Omeprazole 20mg',
    genericName: 'Omeprazole Magnesium',
    dosageForm: 'Capsule',
    strength: '20mg',
    category: 'Gastrointestinal',
  },
  {
    id: 'med-006',
    name: 'Amlodipine 5mg',
    genericName: 'Amlodipine Besylate',
    dosageForm: 'Tablet',
    strength: '5mg',
    category: 'Cardiovascular & Antihypertensives',
  },
  {
    id: 'med-007',
    name: 'Insulin Glargine 100 IU/ml',
    genericName: 'Insulin Glargine',
    dosageForm: 'Vial',
    strength: '100 IU/ml',
    category: 'Diabetes & Endocrine',
  },
];

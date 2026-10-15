'use client';

/**
 * MedLedger — 1-Screen Fast Dispense Counter (فوری پرچی کاؤنٹر)
 *
 * Designed for DHQ Hospital Kohat pharmacy counter staff for maximum speed,
 * effortless usability, vibrant colors, thin crisp borders, and on-hover vibrancy.
 */

import { useState, useTransition } from 'react';
import {
  Zap,
  Printer,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Search,
  Bed,
  User,
  Clock,
  RotateCcw,
  Pill,
  Sparkles,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatPKR, multiplyMoney, addMoney } from '@/lib/decimal';
import { DispensingWithDetails } from '@/modules/dispensing/types';
import { quickDispenseRequisitionAction } from '@/modules/dispensing/actions';

interface BillItem {
  medicine_id: string;
  item_code: string;
  name: string;
  dosage_form: string;
  strength: string;
  quantity: number;
  unit_price: number;
}

const COMMON_QUICK_ITEMS = [
  {
    id: 'med-454',
    code: '454',
    name: 'Drip Set (I.V Set)',
    dosage: 'Piece',
    strength: 'Sterile',
    rate: 100.0,
    icon: '💧',
    color:
      'border-emerald-300 bg-emerald-50/60 text-emerald-800 hover:border-emerald-500 hover:bg-emerald-100 hover:shadow-emerald-200',
  },
  {
    id: 'med-031',
    code: '31',
    name: 'Syringe 10cc (D/S)',
    dosage: 'Piece',
    strength: '10ml',
    rate: 60.0,
    icon: '💉',
    color:
      'border-blue-300 bg-blue-50/60 text-blue-800 hover:border-blue-500 hover:bg-blue-100 hover:shadow-blue-200',
  },
  {
    id: 'med-019',
    code: '19',
    name: 'Syringe 5cc (D/S)',
    dosage: 'Piece',
    strength: '5ml',
    rate: 30.0,
    icon: '💉',
    color:
      'border-sky-300 bg-sky-50/60 text-sky-800 hover:border-sky-500 hover:bg-sky-100 hover:shadow-sky-200',
  },
  {
    id: 'med-033',
    code: '33',
    name: 'I/V Cannula 20G/22G',
    dosage: 'Piece',
    strength: '20G/22G',
    rate: 350.0,
    icon: '🩹',
    color:
      'border-indigo-300 bg-indigo-50/60 text-indigo-800 hover:border-indigo-500 hover:bg-indigo-100 hover:shadow-indigo-200',
  },
  {
    id: 'med-150',
    code: '150',
    name: 'N/Saline 100ml Inf',
    dosage: 'Bottle',
    strength: '100ml',
    rate: 86.0,
    icon: '🧪',
    color:
      'border-teal-300 bg-teal-50/60 text-teal-800 hover:border-teal-500 hover:bg-teal-100 hover:shadow-teal-200',
  },
  {
    id: 'med-135',
    code: '135',
    name: 'R/L 1L Infusion (RL)',
    dosage: 'Bottle',
    strength: '1000ml',
    rate: 128.0,
    icon: '🍼',
    color:
      'border-cyan-300 bg-cyan-50/60 text-cyan-800 hover:border-cyan-500 hover:bg-cyan-100 hover:shadow-cyan-200',
  },
  {
    id: 'med-134',
    code: '134',
    name: 'Provas 100ml Inf',
    dosage: 'Bottle',
    strength: '1000mg',
    rate: 225.0,
    icon: '💊',
    color:
      'border-amber-300 bg-amber-50/60 text-amber-800 hover:border-amber-500 hover:bg-amber-100 hover:shadow-amber-200',
  },
  {
    id: 'med-183',
    code: '183',
    name: 'Gen-M 120mg Inj',
    dosage: 'Ampoule',
    strength: '120mg',
    rate: 330.0,
    icon: '💉',
    color:
      'border-rose-300 bg-rose-50/60 text-rose-800 hover:border-rose-500 hover:bg-rose-100 hover:shadow-rose-200',
  },
  {
    id: 'med-1300',
    code: '1300',
    name: 'Risek / Rapid 40mg',
    dosage: 'Vial',
    strength: '40mg',
    rate: 450.0,
    icon: '✨',
    color:
      'border-purple-300 bg-purple-50/60 text-purple-800 hover:border-purple-500 hover:bg-purple-100 hover:shadow-purple-200',
  },
  {
    id: 'med-914',
    code: '914',
    name: 'Zinacef 750mg Inj',
    dosage: 'Vial',
    strength: '750mg',
    rate: 228.0,
    icon: '🛡️',
    color:
      'border-orange-300 bg-orange-50/60 text-orange-800 hover:border-orange-500 hover:bg-orange-100 hover:shadow-orange-200',
  },
  {
    id: 'med-3021',
    code: '3021',
    name: 'Duobactum 2gm Inj',
    dosage: 'Vial',
    strength: '2g',
    rate: 561.0,
    icon: '⚡',
    color:
      'border-emerald-300 bg-emerald-50/60 text-emerald-800 hover:border-emerald-500 hover:bg-emerald-100 hover:shadow-emerald-200',
  },
  {
    id: 'med-002-stick',
    code: '2',
    name: 'Sticking Plaster',
    dosage: 'Spool',
    strength: '1 Inch',
    rate: 150.0,
    icon: '🩹',
    color:
      'border-slate-300 bg-slate-50/60 text-slate-800 hover:border-slate-500 hover:bg-slate-100 hover:shadow-slate-200',
  },
];

const CATALOGUE_MEDICINES = [
  ...COMMON_QUICK_ITEMS,
  {
    id: 'med-001',
    code: 'MED-AMX',
    name: 'Amoxicillin 500mg',
    dosage: 'Capsule',
    strength: '500mg',
    rate: 18.5,
    icon: '💊',
    color: 'border-slate-200 bg-white text-slate-800 hover:border-emerald-500',
  },
  {
    id: 'med-002',
    code: 'MED-CTX',
    name: 'Ceftriaxone 1g Inj',
    dosage: 'Vial',
    strength: '1g',
    rate: 250.0,
    icon: '💉',
    color: 'border-slate-200 bg-white text-slate-800 hover:border-emerald-500',
  },
  {
    id: 'med-004',
    code: 'MED-PCM',
    name: 'Paracetamol 500mg',
    dosage: 'Tablet',
    strength: '500mg',
    rate: 3.5,
    icon: '💊',
    color: 'border-slate-200 bg-white text-slate-800 hover:border-emerald-500',
  },
  {
    id: 'med-005',
    code: 'MED-OMP',
    name: 'Omeprazole 20mg',
    dosage: 'Capsule',
    strength: '20mg',
    rate: 14.0,
    icon: '💊',
    color: 'border-slate-200 bg-white text-slate-800 hover:border-emerald-500',
  },
  {
    id: 'med-008',
    code: 'MED-CIP',
    name: 'Ciprofloxacin 250mg',
    dosage: 'Tablet',
    strength: '250mg',
    rate: 14.0,
    icon: '💊',
    color: 'border-slate-200 bg-white text-slate-800 hover:border-emerald-500',
  },
  {
    id: 'med-009',
    code: 'MED-IBU',
    name: 'Ibuprofen 400mg',
    dosage: 'Tablet',
    strength: '400mg',
    rate: 6.0,
    icon: '💊',
    color: 'border-slate-200 bg-white text-slate-800 hover:border-emerald-500',
  },
];

const PRESET_WARODS = [
  'Medical-A Ward',
  'Urology Ward',
  'Female Surgical Ward',
  'Male Medical Ward',
  'Emergency / Trauma',
  'Pediatrics Ward',
  'ICU / CCU',
];

interface FastCounterWorkspaceProps {
  onDispenseSuccess: (record: DispensingWithDetails) => void;
}

export function FastCounterWorkspace({ onDispenseSuccess }: FastCounterWorkspaceProps) {
  const [isPending, startTransition] = useTransition();

  // Header / Patient info
  const [sspVisitNo, setSspVisitNo] = useState('37634827');
  const [patientName, setPatientName] = useState('Arsalan');
  const [mrNumber, setMrNumber] = useState('MRN-2026-00101');
  const [selectedWard, setSelectedWard] = useState('Medical-A Ward');
  const [prescriber, setPrescriber] = useState('Dr. Asad Qureshi (Ward MO)');

  // Active Bill Items
  const [billItems, setBillItems] = useState<BillItem[]>([
    {
      medicine_id: 'med-183',
      item_code: '183',
      name: 'GEN-M 120mg Injection',
      dosage_form: 'Ampoule',
      strength: '120mg',
      quantity: 2,
      unit_price: 330.0,
    },
    {
      medicine_id: 'med-134',
      item_code: '134',
      name: 'PROVAS 100ml Infusion',
      dosage_form: 'Bottle',
      strength: '1000mg',
      quantity: 1,
      unit_price: 225.0,
    },
    {
      medicine_id: 'med-135',
      item_code: '135',
      name: 'R/L 1L Infusion (RL)',
      dosage_form: 'Bottle',
      strength: '1000ml',
      quantity: 2,
      unit_price: 128.0,
    },
    {
      medicine_id: 'med-1300',
      item_code: '1300',
      name: 'RAPID / RISEK 40mg Injection',
      dosage_form: 'Vial',
      strength: '40mg',
      quantity: 1,
      unit_price: 450.0,
    },
    {
      medicine_id: 'med-454',
      item_code: '454',
      name: 'DRIP SET (I.V Set)',
      dosage_form: 'Piece',
      strength: 'Sterile',
      quantity: 2,
      unit_price: 100.0,
    },
    {
      medicine_id: 'med-031',
      item_code: '31',
      name: 'Disposable Syringe 10cc (D/S)',
      dosage_form: 'Piece',
      strength: '10ml',
      quantity: 3,
      unit_price: 60.0,
    },
  ]);

  // Search & Add autocomplete
  const [searchQuery, setSearchQuery] = useState('');
  const [customQty, setCustomQty] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter catalogue for search dropdown
  const searchResults = searchQuery.trim()
    ? CATALOGUE_MEDICINES.filter(
        (m) =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.id.toLowerCase().includes(searchQuery.toLowerCase()),
      ).slice(0, 5)
    : [];

  function addItemToBill(
    item: {
      id: string;
      code: string;
      name: string;
      dosage?: string;
      strength?: string;
      rate: number;
    },
    qty = 1,
  ) {
    setBillItems((prev) => {
      const existingIdx = prev.findIndex((b) => b.medicine_id === item.id);
      if (existingIdx !== -1) {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: next[existingIdx].quantity + qty,
        };
        return next;
      }
      return [
        ...prev,
        {
          medicine_id: item.id,
          item_code: item.code,
          name: item.name,
          dosage_form: item.dosage || 'Unit',
          strength: item.strength || 'Standard',
          quantity: qty,
          unit_price: item.rate,
        },
      ];
    });
    setSearchQuery('');
    setCustomQty(1);
    setErrorMessage(null);
  }

  function updateQuantity(medicineId: string, delta: number) {
    setBillItems(
      (prev) =>
        prev
          .map((it) => {
            if (it.medicine_id === medicineId) {
              const nextQty = it.quantity + delta;
              return nextQty > 0 ? { ...it, quantity: nextQty } : null;
            }
            return it;
          })
          .filter(Boolean) as BillItem[],
    );
  }

  function removeItem(medicineId: string) {
    setBillItems((prev) => prev.filter((it) => it.medicine_id !== medicineId));
  }

  function clearBill() {
    setBillItems([]);
    setErrorMessage(null);
  }

  // Calculate grand total
  const grandTotal = billItems.reduce(
    (sum, it) => addMoney(sum, multiplyMoney(it.quantity, it.unit_price)),
    0,
  );
  const totalUnits = billItems.reduce((sum, it) => sum + it.quantity, 0);

  function handleCompleteAndPrint() {
    if (billItems.length === 0) {
      setErrorMessage('Please add at least one medicine or surgical consumable item to dispense.');
      return;
    }

    setErrorMessage(null);
    startTransition(async () => {
      const res = await quickDispenseRequisitionAction({
        ssp_visit_no: sspVisitNo || null,
        patient_name: patientName,
        mr_number: mrNumber,
        ward: selectedWard,
        prescriber_name: prescriber,
        items: billItems.map((b) => ({
          medicine_id: b.medicine_id,
          quantity: b.quantity,
          unit_price: b.unit_price,
        })),
      });

      if (res.success && res.data) {
        onDispenseSuccess(res.data);
      } else {
        setErrorMessage(res.error || 'Failed to complete dispensing transaction.');
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Top Banner: Vibrant, Thin Border, Easy Workflow */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 rounded-xl p-4 sm:p-5 text-white shadow-md border border-emerald-400/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 transform skew-x-12 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-white/20 backdrop-blur-xs text-white shadow-xs">
                <Zap className="h-5 w-5 text-amber-300 fill-amber-300" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                1-Screen Fast Dispense Counter • فوری پرچی کاؤنٹر
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1 font-medium max-w-xl">
              Just enter Visit Number, tap the medicines from the yellow slip, and click{' '}
              <strong>Print Hospital Bill</strong>. Everything is recorded in 1 click!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-white/15 px-3 py-1.5 rounded-lg border border-white/20 font-bold backdrop-blur-xs flex items-center gap-1.5 text-white">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              Real-time DHQ Rates & FEFO Batches
            </span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-300 text-rose-800 px-4 py-3 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Row 1: Patient, Visit No, and Ward Quick Select (3 Crisp Thin-Bordered Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: Visit No / SSP Sehat Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs hover:border-emerald-500 hover:shadow-md hover:shadow-emerald-500/10 transition-all duration-200">
          <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              SSP Visit # / Party Code (پرچی وزٹ نمبر)
            </span>
            <span className="text-[10px] text-slate-400 font-normal">From Paper Slip</span>
          </label>
          <div className="mt-1.5 relative">
            <Input
              type="text"
              placeholder="e.g. 37634827"
              value={sspVisitNo}
              onChange={(e) => setSspVisitNo(e.target.value)}
              className="font-mono text-sm font-bold text-emerald-950 border-emerald-300 bg-emerald-50/40 focus:border-emerald-600 focus:ring-emerald-500/20"
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            Matches computerized invoice <strong>Party Code</strong>.
          </p>
        </div>

        {/* Card 2: Patient Name & MRN */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs hover:border-blue-500 hover:shadow-md hover:shadow-blue-500/10 transition-all duration-200">
          <label className="text-[11px] font-bold uppercase tracking-wider text-blue-800 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-blue-600" />
              Patient Name & MRN (مریض کا نام)
            </span>
          </label>
          <div className="grid grid-cols-2 gap-2 mt-1.5">
            <Input
              type="text"
              placeholder="e.g. Arsalan"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="text-xs font-semibold text-slate-900 border-slate-300 focus:border-blue-600"
            />
            <Input
              type="text"
              placeholder="MRN"
              value={mrNumber}
              onChange={(e) => setMrNumber(e.target.value)}
              className="text-xs font-mono text-slate-700 border-slate-300 focus:border-blue-600"
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Admission & file record identifier.</p>
        </div>

        {/* Card 3: Ward Selector */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs hover:border-indigo-500 hover:shadow-md hover:shadow-indigo-500/10 transition-all duration-200">
          <label className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Bed className="h-3.5 w-3.5 text-indigo-600" />
              Ward / Department (وارڈ کا نام)
            </span>
            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
              {selectedWard}
            </span>
          </label>
          <div className="mt-1.5 flex items-center gap-1 overflow-x-auto pb-1 text-xs">
            {PRESET_WARODS.slice(0, 4).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setSelectedWard(w)}
                className={`px-2 py-1 rounded text-[11px] font-semibold border transition-all duration-150 whitespace-nowrap cursor-pointer ${
                  selectedWard === w
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50'
                }`}
              >
                {w.replace(' Ward', '')}
              </button>
            ))}
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
            <span>Doctor: {prescriber}</span>
          </div>
        </div>
      </div>

      {/* Row 2: 1-Tap Quick Consumables Bar (ایک کلک سے شامل کریں) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-emerald-400 transition-all duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-md bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs border border-emerald-300">
              ⚡
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
              One-Tap Quick Hospital Consumables (عام استعمال شدہ ادویات و سامان — ایک کلک پر شامل
              کریں)
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Click any item below to add it directly to current bill
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {COMMON_QUICK_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => addItemToBill(item, 1)}
              className={`p-2 rounded-lg border text-left transition-all duration-200 shadow-2xs hover:scale-102 hover:shadow-md cursor-pointer flex flex-col justify-between ${item.color}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-base">{item.icon}</span>
                <span className="font-mono text-[10px] font-bold opacity-80">#{item.code}</span>
              </div>
              <div className="mt-1">
                <span className="font-bold text-xs block leading-tight line-clamp-1">
                  {item.name}
                </span>
                <span className="text-[10px] opacity-75 font-mono block mt-0.5">
                  {formatPKR(item.rate)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Row 3: Catalogue Search Bar + Manual Add */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col sm:flex-row items-center gap-2 relative">
        <div className="relative flex-1 w-full">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            placeholder="Search any medicine by Name, Generic, or Item Code (e.g. Gen-M, 183, Risek, Duobactum, Zinacef)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20"
          />

          {/* Autocomplete Popup */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-300 rounded-lg shadow-xl z-30 divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {searchResults.map((m) => (
                <div
                  key={m.id}
                  onClick={() => addItemToBill(m, customQty)}
                  className="p-2.5 hover:bg-emerald-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                >
                  <div>
                    <span className="font-bold text-slate-900">{m.name}</span>
                    <span className="text-[11px] text-slate-500 ml-2 font-mono">
                      Code #{m.code} • {m.dosage} ({m.strength})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-emerald-700">
                      {formatPKR(m.rate)}
                    </span>
                    <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded shadow-xs">
                      + Add
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-600">Qty:</span>
          <Input
            type="number"
            min={1}
            max={100}
            value={customQty}
            onChange={(e) => setCustomQty(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-16 text-center text-xs font-bold border-slate-300"
          />
        </div>
      </div>

      {/* Row 4: Active Dispensing Bill Table (Crisp Thin Borders, Vibrant Highlight) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:border-emerald-400 transition-all duration-200">
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Active Medicines & Surgical Items on Bill ({billItems.length} items)
            </h3>
          </div>

          {billItems.length > 0 && (
            <button
              type="button"
              onClick={clearBill}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Clear All Items
            </button>
          )}
        </div>

        {billItems.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-2">
            <Pill className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No items on this bill yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Tap any of the colorful quick buttons above or search for medicine names to begin
              dispensing.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 border-r border-slate-200 w-10 text-center">#</th>
                  <th className="py-2.5 px-3 border-r border-slate-200 w-24">Code</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">
                    Particulars (Medicine & Consumable)
                  </th>
                  <th className="py-2.5 px-3 border-r border-slate-200 text-right w-28">
                    Rate (PKR)
                  </th>
                  <th className="py-2.5 px-3 border-r border-slate-200 text-center w-36">
                    Quantity
                  </th>
                  <th className="py-2.5 px-3 border-r border-slate-200 text-right w-32">
                    Net Total
                  </th>
                  <th className="py-2.5 px-2 text-center w-12">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {billItems.map((it, idx) => {
                  const lineTotal = multiplyMoney(it.quantity, it.unit_price);
                  return (
                    <tr
                      key={it.medicine_id}
                      className="hover:bg-emerald-50/70 transition-colors group"
                    >
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-medium text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 font-mono font-bold text-slate-700">
                        #{it.item_code}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200">
                        <span className="font-bold text-slate-900 block">{it.name}</span>
                        <span className="text-[10px] text-slate-500">
                          {it.strength} • {it.dosage_form}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono text-slate-700">
                        {formatPKR(it.unit_price)}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center">
                        <div className="inline-flex items-center gap-1.5 border border-slate-300 rounded-lg p-0.5 bg-slate-50 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => updateQuantity(it.medicine_id, -1)}
                            className="h-6 w-6 rounded bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center font-bold text-xs text-slate-950 font-mono">
                            {it.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(it.medicine_id, 1)}
                            className="h-6 w-6 rounded bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono font-bold text-emerald-900">
                        {formatPKR(lineTotal)}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(it.medicine_id)}
                          className="h-7 w-7 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer: Live Grand Total & Giant Action Button */}
        <div className="bg-gradient-to-r from-slate-50 via-emerald-50/50 to-teal-50/50 border-t border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Total Items & Units
              </span>
              <span className="text-base font-extrabold text-slate-800">
                {billItems.length} items{' '}
                <span className="text-slate-400 font-normal">({totalUnits} units)</span>
              </span>
            </div>

            <div className="border-l border-slate-200 pl-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                Grand Bill Total (کل رقم)
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-900 font-mono tracking-tight">
                {formatPKR(grandTotal)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              type="button"
              disabled={billItems.length === 0 || isPending}
              onClick={handleCompleteAndPrint}
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm px-6 py-5 rounded-xl shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:scale-102 active:scale-98 transition-all duration-200 border border-emerald-400 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Printer className="h-5 w-5" />
              <span>
                {isPending
                  ? 'Dispensing & Generating...'
                  : '⚡ Complete Dispense & Print Invoice (بل پرنٹ کریں)'}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

/**
 * MedLedger — Eligible Dispensing Item Picker
 *
 * Allows pharmacy finance staff to browse finalized dispensing records eligible for
 * hospital claims, select specific items, adjust claimable quantities, and verify traceability.
 */

import { useState, useEffect } from 'react';
import { Search, CheckSquare, Square, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatPKR, multiplyMoney } from '@/lib/decimal';
import { EligibleDispensingItem } from '@/modules/claims/types';
import { getEligibleDispensingItemsAction } from '@/modules/claims/actions';

export interface SelectedClaimItem {
  dispensing_item_id: string;
  quantity: number;
  unit_rate: number;
  item: EligibleDispensingItem;
}

interface EligibleDispensingPickerProps {
  onSelectionChange: (selected: SelectedClaimItem[]) => void;
}

export function EligibleDispensingPicker({ onSelectionChange }: EligibleDispensingPickerProps) {
  const [items, setItems] = useState<EligibleDispensingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  // Map of selected items: id -> quantity
  const [selectedMap, setSelectedMap] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    async function loadEligible() {
      setLoading(true);
      const res = await getEligibleDispensingItemsAction();
      if (res.success && res.data) {
        setItems(res.data);
      }
      setLoading(false);
    }
    loadEligible();
  }, []);

  const filtered = items.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      item.patient_name.toLowerCase().includes(term) ||
      item.mr_number.toLowerCase().includes(term) ||
      item.dispensing_number.toLowerCase().includes(term) ||
      item.prescription_number.toLowerCase().includes(term) ||
      item.medicine_name.toLowerCase().includes(term) ||
      item.batch_number.toLowerCase().includes(term)
    );
  });

  function toggleItem(item: EligibleDispensingItem) {
    const next = new Map(selectedMap);
    if (next.has(item.dispensing_item_id)) {
      next.delete(item.dispensing_item_id);
    } else {
      next.set(item.dispensing_item_id, item.claimable_quantity);
    }
    setSelectedMap(next);
    emitSelection(next);
  }

  function handleQuantityChange(item: EligibleDispensingItem, newQty: number) {
    const bounded = Math.max(1, Math.min(item.claimable_quantity, Math.floor(newQty || 1)));
    const next = new Map(selectedMap);
    next.set(item.dispensing_item_id, bounded);
    setSelectedMap(next);
    emitSelection(next);
  }

  function handleSelectAll() {
    const next = new Map(selectedMap);
    filtered.forEach((it) => {
      next.set(it.dispensing_item_id, it.claimable_quantity);
    });
    setSelectedMap(next);
    emitSelection(next);
  }

  function handleClearAll() {
    setSelectedMap(new Map());
    onSelectionChange([]);
  }

  function emitSelection(map: Map<string, number>) {
    const selectedList: SelectedClaimItem[] = [];
    items.forEach((it) => {
      if (map.has(it.dispensing_item_id)) {
        selectedList.push({
          dispensing_item_id: it.dispensing_item_id,
          quantity: map.get(it.dispensing_item_id)!,
          unit_rate: it.unit_rate,
          item: it,
        });
      }
    });
    onSelectionChange(selectedList);
  }

  return (
    <div className="space-y-3">
      {/* Search and Selection Bulk Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            id="eligible-items-search"
            type="text"
            placeholder="Search patient, MRN, medicine, batch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white border-slate-200 text-sm"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          <span className="text-slate-500 mr-1">
            {selectedMap.size} of {items.length} selected
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="h-8 px-2.5 text-blue-600 border-blue-200 hover:bg-blue-50"
            disabled={filtered.length === 0}
          >
            Select Filtered
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-8 px-2.5 text-slate-600"
            disabled={selectedMap.size === 0}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Eligible Items Table */}
      <Card className="overflow-hidden border-slate-200 bg-white">
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-slate-500 tracking-wider sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2.5 w-8">
                  <span className="sr-only">Select</span>
                </th>
                <th className="px-3 py-2.5">Patient / MRN</th>
                <th className="px-3 py-2.5">Dispensing Ref</th>
                <th className="px-3 py-2.5">Medicine & Batch</th>
                <th className="px-3 py-2.5 text-center">Dispensed</th>
                <th className="px-3 py-2.5 text-center">Claimable</th>
                <th className="px-3 py-2.5 text-center w-24">Claim Qty</th>
                <th className="px-3 py-2.5 text-right">Unit Rate</th>
                <th className="px-3 py-2.5 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    Loading eligible dispensing items...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    <Info className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                    <p className="font-medium text-slate-700">
                      No eligible dispensing items available
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      All finalized dispensations have already been claimed or no completed records
                      exist.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isSelected = selectedMap.has(item.dispensing_item_id);
                  const selectedQty =
                    selectedMap.get(item.dispensing_item_id) || item.claimable_quantity;
                  const lineTotal = multiplyMoney(selectedQty, item.unit_rate);

                  return (
                    <tr
                      key={item.dispensing_item_id}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                      onClick={() => toggleItem(item)}
                    >
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => toggleItem(item)}
                          className="text-blue-600 focus:outline-none"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-semibold text-slate-900">{item.patient_name}</div>
                        <div className="text-[11px] text-slate-400">
                          {item.mr_number} {item.ward ? `• ${item.ward}` : ''}
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-slate-600">
                        <div>{item.dispensing_number}</div>
                        <div className="text-slate-400">{item.prescription_number}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-slate-800">
                          {item.medicine_name} ({item.strength})
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Batch: {item.batch_number} • Exp: {item.expiry_date}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center text-slate-600 font-medium">
                        {item.quantity_dispensed}
                      </td>
                      <td className="px-3 py-2 text-center text-emerald-700 font-bold">
                        {item.claimable_quantity}
                        {item.already_claimed_quantity > 0 && (
                          <span className="text-[10px] text-slate-400 block font-normal">
                            ({item.already_claimed_quantity} prior)
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          min={1}
                          max={item.claimable_quantity}
                          value={isSelected ? selectedQty : item.claimable_quantity}
                          disabled={!isSelected}
                          onChange={(e) => handleQuantityChange(item, parseInt(e.target.value, 10))}
                          className={`w-16 px-2 py-1 text-center font-semibold rounded border text-xs ${
                            isSelected
                              ? 'border-blue-400 bg-white text-blue-900'
                              : 'border-slate-200 bg-slate-100 text-slate-400'
                          }`}
                        />
                      </td>
                      <td className="px-3 py-2 text-right text-slate-600 font-mono">
                        {formatPKR(item.unit_rate)}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-slate-900 font-mono">
                        {isSelected ? formatPKR(lineTotal) : formatPKR(item.total_claimable_amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

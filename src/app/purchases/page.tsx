import React from 'react';
import Link from 'next/link';
import { connection } from 'next/server';
import { ShoppingCart, PackageCheck, FileText, Plus, Building2 } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { buttonVariants } from '@/components/ui/button';
import {
  PurchaseOrdersTable,
  GoodsReceiptsTable,
  SupplierInvoicesTable,
} from '@/components/purchasing';
import {
  getPurchaseOrdersAction,
  getGoodsReceiptsAction,
  getSupplierInvoicesAction,
} from '@/modules/purchasing/actions';
import {
  PaginatedPurchaseOrdersResponse,
  PaginatedGoodsReceiptsResponse,
  PaginatedSupplierInvoicesResponse,
  PurchaseOrderStatus,
  SupplierInvoiceStatus,
} from '@/modules/purchasing/types';
import { getSuppliersAction } from '@/modules/suppliers/actions';

interface PurchasesPageProps {
  searchParams: Promise<{
    tab?: 'orders' | 'receipts' | 'invoices';
    search?: string;
    status?: string;
    supplierId?: string;
    page?: string;
  }>;
}

export const instant = false;

export default async function PurchasesPage({ searchParams }: PurchasesPageProps) {
  await connection();
  const resolvedParams = await searchParams;
  const currentTab = resolvedParams.tab || 'orders';
  const page = parseInt(resolvedParams.page || '1', 10) || 1;
  const search = resolvedParams.search || '';
  const status = resolvedParams.status || 'all';
  const supplierId = resolvedParams.supplierId || '';

  // 1. Always fetch suppliers for dropdowns & payment dialog
  const suppliersRes = await getSuppliersAction({ pageSize: 100 });
  const suppliers = suppliersRes.success && suppliersRes.data ? suppliersRes.data.suppliers : [];

  // 2. Fetch specific dataset based on active tab
  let poData: PaginatedPurchaseOrdersResponse = {
    orders: [],
    totalRecords: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 10,
    isLiveDatabase: false,
  };

  let grnData: PaginatedGoodsReceiptsResponse = {
    receipts: [],
    totalRecords: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 10,
    isLiveDatabase: false,
  };

  let invoicesData: PaginatedSupplierInvoicesResponse = {
    invoices: [],
    totalRecords: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 10,
    isLiveDatabase: false,
  };

  if (currentTab === 'orders') {
    const res = await getPurchaseOrdersAction({
      search,
      status: status === 'all' ? undefined : (status as PurchaseOrderStatus),
      page,
      pageSize: 10,
    });
    if (res.success && res.data) poData = res.data;
  } else if (currentTab === 'receipts') {
    const res = await getGoodsReceiptsAction({
      search,
      page,
      pageSize: 10,
    });
    if (res.success && res.data) grnData = res.data;
  } else if (currentTab === 'invoices') {
    const res = await getSupplierInvoicesAction({
      search,
      status: status === 'all' ? undefined : (status as SupplierInvoiceStatus),
      supplier_id: supplierId || undefined,
      page,
      pageSize: 10,
    });
    if (res.success && res.data) invoicesData = res.data;
  }

  return (
    <AppShell
      title="Procurement & Goods Receiving"
      subtitle="Purchase Orders, Physical Receiving Inspection (GRN) & Accounts Payable"
    >
      <div className="space-y-6">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between pb-1">
          <div>
            <p className="text-xs text-text-muted">
              Central Pharmacy Procurement Hub • DHQ Hospital Kohat
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/suppliers"
              className={buttonVariants({
                variant: 'outline',
                className: 'h-9 text-xs',
              })}
            >
              <Building2 className="w-3.5 h-3.5 mr-1.5" />
              Suppliers
            </Link>
            <Link
              href="/purchases/new"
              className={buttonVariants({
                className: 'h-9 text-xs bg-navy-deep hover:bg-navy-deep/90 text-white',
              })}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New Purchase Order
            </Link>
          </div>
        </div>

        {/* Module Sub-Navigation Tabs */}
        <div className="flex border-b border-border bg-card rounded-t-lg px-2 pt-2 gap-1 overflow-x-auto">
          <Link
            href="/purchases?tab=orders"
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              currentTab === 'orders'
                ? 'border-teal-primary text-teal-dark font-semibold bg-teal-50/40 rounded-t-md'
                : 'border-transparent text-text-muted hover:text-foreground hover:border-border'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Purchase Orders
          </Link>
          <Link
            href="/purchases?tab=receipts"
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              currentTab === 'receipts'
                ? 'border-teal-primary text-teal-dark font-semibold bg-teal-50/40 rounded-t-md'
                : 'border-transparent text-text-muted hover:text-foreground hover:border-border'
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            Goods Receipts (GRN)
          </Link>
          <Link
            href="/purchases?tab=invoices"
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              currentTab === 'invoices'
                ? 'border-teal-primary text-teal-dark font-semibold bg-teal-50/40 rounded-t-md'
                : 'border-transparent text-text-muted hover:text-foreground hover:border-border'
            }`}
          >
            <FileText className="w-4 h-4" />
            Invoices & Payables
          </Link>
        </div>

        {/* Tab Content Display */}
        {currentTab === 'orders' && (
          <PurchaseOrdersTable initialData={poData} currentSearch={search} currentStatus={status} />
        )}

        {currentTab === 'receipts' && (
          <GoodsReceiptsTable initialData={grnData} currentSearch={search} />
        )}

        {currentTab === 'invoices' && (
          <SupplierInvoicesTable
            initialData={invoicesData}
            suppliers={suppliers}
            currentSearch={search}
            currentStatus={status}
            currentSupplierId={supplierId}
          />
        )}
      </div>
    </AppShell>
  );
}

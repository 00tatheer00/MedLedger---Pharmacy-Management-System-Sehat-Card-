'use client';

import { useState } from 'react';
import { FileSpreadsheet, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/feedback/toast';

export interface CsvColumn<T> {
  header: string;
  accessor: (item: T) => string | number | boolean | null | undefined;
}

/**
 * Universal client-side CSV Exporter
 * Formats values safely with UTF-8 BOM for flawless Excel compatibility in Pakistan / international locales.
 */
export function exportToCsv<T extends Record<string, unknown>>(
  filename: string,
  data: T[],
  columns?: CsvColumn<T>[],
): boolean {
  if (!data || data.length === 0) {
    toast.warning('No records available to export.');
    return false;
  }

  try {
    const resolvedColumns: CsvColumn<T>[] =
      columns && columns.length > 0
        ? columns
        : Object.keys(data[0] || {}).map((key) => ({
            header: key,
            accessor: (item: T) => item[key],
          }));

    const headers = resolvedColumns.map((col) => `"${col.header.replace(/"/g, '""')}"`).join(',');

    const rows = data.map((item) => {
      return resolvedColumns
        .map((col) => {
          const val = col.accessor(item);
          if (val === null || val === undefined) return '""';
          const stringVal = String(val).replace(/"/g, '""');
          return `"${stringVal}"`;
        })
        .join(',');
    });

    const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${data.length} records to ${filename}`);
    return true;
  } catch (err) {
    console.error('Failed to export CSV:', err);
    toast.error('Failed to generate CSV export file.');
    return false;
  }
}

export interface ExportCsvButtonProps<T extends Record<string, unknown>> {
  filename: string;
  data: T[];
  columns?: CsvColumn<T>[];
  label?: string;
  className?: string;
  variant?: 'outline' | 'secondary' | 'ghost' | 'primary';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Interactive Export CSV Button with live downloaded feedback state
 */
export function ExportCsvButton<T extends Record<string, unknown>>({
  filename,
  data,
  columns,
  label = 'Export CSV',
  className = '',
  variant = 'outline',
  size = 'sm',
}: ExportCsvButtonProps<T>) {
  const [downloaded, setDownloaded] = useState(false);

  const handleExport = () => {
    const success = exportToCsv(filename, data, columns);
    if (success) {
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleExport}
      className={`h-9 gap-1.5 font-medium transition-all duration-150 active:scale-95 cursor-pointer border-slate-300 hover:border-teal-500 hover:text-teal-700 hover:bg-teal-50/60 ${className}`}
      title={`Download ${data.length} records as CSV`}
    >
      {downloaded ? (
        <>
          <Check className="h-4 w-4 text-emerald-600 animate-in zoom-in-75 duration-150" />
          <span className="text-emerald-700 font-semibold">Exported!</span>
        </>
      ) : (
        <>
          <FileSpreadsheet className="h-4 w-4 text-teal-600" />
          <span>{label}</span>
          <span className="ml-1 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-mono">
            {data.length}
          </span>
        </>
      )}
    </Button>
  );
}

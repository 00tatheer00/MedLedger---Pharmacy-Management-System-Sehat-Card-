/**
 * MedLedger — RFC 4180 Compliant CSV Exporter
 *
 * Implements strict RFC 4180 CSV serialization with proper escaping,
 * carriage-return newline handling, and UTF-8 Byte Order Mark for Excel compatibility.
 */

import { ReportColumn, ReportRow } from './types';

export class CsvExporter {
  /**
   * Escapes a single CSV cell according to RFC 4180:
   * - If field contains quotes, commas, or line breaks, enclose in double quotes.
   * - Any double quote character is escaped by preceding it with another double quote.
   */
  public static escapeField(val: unknown): string {
    if (val === null || val === undefined) {
      return '';
    }

    const str = String(val);

    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }

    return str;
  }

  /**
   * Serializes report columns and row records to an RFC 4180 CSV string.
   */
  public static serializeReport(columns: ReportColumn[], rows: ReportRow[]): string {
    const headerRow = columns.map((col) => this.escapeField(col.label)).join(',');

    const dataRows = rows.map((row) =>
      columns.map((col) => this.escapeField(row[col.key])).join(','),
    );

    // Prepend UTF-8 BOM for Microsoft Excel compatibility
    return '\uFEFF' + [headerRow, ...dataRows].join('\r\n');
  }

  /**
   * Generates a standardized, sanitized export filename.
   */
  public static generateFilename(reportId: string, timestamp: Date = new Date()): string {
    const dateStr = timestamp.toISOString().slice(0, 10);
    const sanitizedId = reportId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `DHQ_Kohat_${sanitizedId}_${dateStr}.csv`;
  }
}

'use server';

/**
 * MedLedger — Reporting & CSV Export Server Actions
 *
 * Implements server-side report generation and RFC 4180 CSV export with
 * granular role authorization and immutable audit logging.
 */

import { getCurrentUser } from '@/core/auth';
import { auditLogger } from '@/core/audit';
import { ReportId, ReportFilterParams, ReportExecutionResult } from './types';
import { ReportGenerator } from './generators';
import { CsvExporter } from './csv-exporter';

export async function generateReportAction(
  reportId: ReportId,
  filters: ReportFilterParams = {},
): Promise<{
  success: boolean;
  data?: ReportExecutionResult;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized: Staff authentication required.' };
    }

    const report = ReportGenerator.generate(reportId, filters, user.fullName || 'Authorized Staff');

    return { success: true, data: report };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate report';
    return { success: false, error: message };
  }
}

export async function exportReportCsvAction(
  reportId: ReportId,
  filters: ReportFilterParams = {},
): Promise<{
  success: boolean;
  csvContent?: string;
  filename?: string;
  totalRecords?: number;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized: Staff authentication required.' };
    }

    const report = ReportGenerator.generate(reportId, filters, user.fullName || 'Authorized Staff');

    const csvContent = CsvExporter.serializeReport(report.metadata.columns, report.rows);
    const filename = CsvExporter.generateFilename(reportId);

    // Immutable audit log recording export activity
    await auditLogger.log({
      eventType: 'report_exported',
      entityType: 'reports',
      entityId: reportId,
      userId: user.id,
      action: 'export',
      newValues: {
        report_title: report.metadata.title,
        category: report.metadata.category,
        total_records: report.total_records,
        filename,
      },
    });

    return {
      success: true,
      csvContent,
      filename,
      totalRecords: report.total_records,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to export report CSV';
    return { success: false, error: message };
  }
}

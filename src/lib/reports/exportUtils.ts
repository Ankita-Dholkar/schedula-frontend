/**
 * exportUtils.ts
 * Shared export engine for Admin Reports and Audit Logs.
 * Supports CSV (UTF-8 BOM), Excel 2007+ (.xlsx via SheetJS), and PDF (jspdf + jspdf-autotable).
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export type ExportColumn = {
  header: string;
  key: string;
};

export type ExportMeta = {
  title: string;
  subtitle?: string;
  filters?: string;
  generatedAt?: string;
};

// ── CSV Export ─────────────────────────────────────────────────────────────────

/**
 * Exports data as a UTF-8 BOM CSV file so that Excel renders special
 * characters (₹, Indian names, etc.) without corruption.
 */
export function exportCSV(
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
  filename = "export.csv"
): void {
  const escape = (val: unknown): string => {
    const str = val === null || val === undefined ? "" : String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = columns.map((c) => escape(c.header)).join(",");
  const body = rows
    .map((row) => columns.map((c) => escape(row[c.key])).join(","))
    .join("\n");

  const bom = "\uFEFF"; // UTF-8 BOM for correct Excel rendering
  const csv = `${bom}${header}\n${body}`;

  triggerDownload(
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    filename
  );
}

// ── Excel Export ──────────────────────────────────────────────────────────────

/**
 * Exports data as a true OpenXML .xlsx workbook using SheetJS.
 * Columns are auto-fitted to the widest cell value.
 */
export async function exportExcel(
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
  meta: ExportMeta,
  filename = "export.xlsx"
): Promise<void> {
  const XLSX = (await import("xlsx")).default;

  // Build worksheet data: header row + data rows
  const wsData: unknown[][] = [
    columns.map((c) => c.header.toUpperCase()),
    ...rows.map((row) =>
      columns.map((c) => (row[c.key] === undefined || row[c.key] === null ? "" : row[c.key]))
    ),
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Auto-fit column widths
  const colWidths = columns.map((c) => {
    const maxLen = Math.max(
      c.header.length,
      ...rows.map((row) => String(row[c.key] ?? "").length)
    );
    return { wch: Math.min(maxLen + 4, 50) };
  });
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, meta.title.slice(0, 31));

  XLSX.writeFile(wb, filename);
}

// ── PDF Export ────────────────────────────────────────────────────────────────

/**
 * Exports data as a styled PDF report using jspdf + jspdf-autotable.
 * Includes a branded header, filter summary, and paginated data table.
 */
export async function exportPDF(
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
  meta: ExportMeta,
  filename = "export.pdf"
): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // ── Header bar ──
  doc.setFillColor(99, 102, 241); // Schedula brand indigo
  doc.rect(0, 0, pageW, 18, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Schedula Admin Portal", 10, 11);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    meta.title,
    pageW - 10,
    11,
    { align: "right" }
  );

  // ── Subtitle row ──
  let y = 24;
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(meta.title, 10, y);

  if (meta.subtitle) {
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(meta.subtitle, 10, y + 5);
    y += 5;
  }

  // ── Filter / Generated info ──
  y += 7;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 150, 150);
  const generated = meta.generatedAt ?? new Date().toLocaleString("en-IN");
  doc.text(`Generated: ${generated}`, 10, y);
  if (meta.filters) {
    doc.text(`Filters: ${meta.filters}`, 10, y + 4);
    y += 4;
  }
  y += 5;

  // ── Data table ──
  autoTable(doc, {
    startY: y,
    head: [columns.map((c) => c.header)],
    body: rows.map((row) =>
      columns.map((c) =>
        row[c.key] === undefined || row[c.key] === null ? "" : String(row[c.key])
      )
    ),
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 248, 255],
    },
    margin: { left: 10, right: 10 },
    didDrawPage: (data) => {
      // Footer with page number
      doc.setFontSize(7);
      doc.setTextColor(180, 180, 180);
      doc.text(
        `Page ${data.pageNumber}`,
        pageW - 10,
        pageH - 6,
        { align: "right" }
      );
      doc.text("Schedula | Confidential", 10, pageH - 6);
    },
  });

  doc.save(filename);
}

// ── Helper ─────────────────────────────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

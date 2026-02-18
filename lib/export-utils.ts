export interface ExportSection {
  title: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
}

function escapeCSV(value: string): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function downloadCSV(sections: ExportSection[], filename: string): void {
  const lines: string[] = [];
  const timestamp = new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' });
  lines.push(`# Wingside Export`);
  lines.push(`# Generated: ${timestamp}`);
  lines.push('');

  for (const section of sections) {
    lines.push(`## ${section.title}`);
    lines.push(section.headers.map(escapeCSV).join(','));
    for (const row of section.rows) {
      lines.push(row.map(cell => escapeCSV(String(cell ?? ''))).join(','));
    }
    lines.push('');
  }

  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${filename}.csv`);
}

export function downloadJSON(sections: ExportSection[], filename: string): void {
  const payload = {
    exported_at: new Date().toISOString(),
    source: 'Wingside Admin',
    sections: sections.map(s => ({
      title: s.title,
      data: s.rows.map(row =>
        Object.fromEntries(s.headers.map((h, i) => [h, row[i] ?? null]))
      ),
    })),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  triggerDownload(blob, `${filename}.json`);
}

export async function downloadXLSX(sections: ExportSection[], filename: string): Promise<void> {
  const XLSX = await import('@e965/xlsx');
  const wb = XLSX.utils.book_new();

  for (const section of sections) {
    const wsData = [
      section.headers,
      ...section.rows.map(row => row.map(cell => cell ?? '')),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Auto-width columns based on content
    const colWidths = section.headers.map((h, i) => {
      const maxLen = Math.max(
        h.length,
        ...section.rows.map(r => String(r[i] ?? '').length)
      );
      return { wch: Math.min(maxLen + 2, 50) };
    });
    ws['!cols'] = colWidths;

    // Sheet name max 31 chars
    const sheetName = section.title.slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

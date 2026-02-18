"use client";

import { useState, useRef, useEffect } from 'react';
import { downloadCSV, downloadJSON, downloadXLSX, ExportSection } from '@/lib/export-utils';

interface ExportButtonProps {
  filename: string;
  getExportData: () => ExportSection[];
}

const FORMAT_OPTIONS = [
  {
    key: 'csv' as const,
    label: 'Export as CSV',
    badge: 'CSV',
    badgeColor: 'text-green-700 bg-green-50',
    description: 'Comma-separated, opens in Excel/Sheets',
  },
  {
    key: 'xlsx' as const,
    label: 'Export as Excel',
    badge: 'XLSX',
    badgeColor: 'text-emerald-700 bg-emerald-50',
    description: 'Native Excel workbook, multiple sheets',
  },
  {
    key: 'json' as const,
    label: 'Export as JSON',
    badge: 'JSON',
    badgeColor: 'text-blue-700 bg-blue-50',
    description: 'Structured data for developers',
  },
];

export default function ExportButton({ filename, getExportData }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (format: 'csv' | 'json' | 'xlsx') => {
    setLoading(format);
    setOpen(false);
    try {
      const data = getExportData();
      const ts = new Date().toISOString().slice(0, 10);
      const name = `${filename}-${ts}`;
      if (format === 'csv') downloadCSV(data, name);
      else if (format === 'json') downloadJSON(data, name);
      else await downloadXLSX(data, name);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={!!loading}
        className="flex items-center gap-2 px-4 py-2 bg-[#552627] text-white rounded-lg hover:bg-[#6b3031] disabled:opacity-60 text-sm font-medium transition-colors"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Exporting…
          </>
        ) : (
          <>
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
            <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Download format</p>
          </div>
          <div className="py-1">
            {FORMAT_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => handleExport(opt.key)}
                className="flex items-start gap-3 w-full px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
              >
                <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-xs font-bold shrink-0 ${opt.badgeColor}`}>
                  {opt.badge}
                </span>
                <div>
                  <div className="text-sm font-medium text-gray-800">{opt.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{opt.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

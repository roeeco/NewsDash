import React from 'react';
import { CheckSquare, FileDown, Table, Trash2, Eye, AlertCircle } from 'lucide-react';

interface FloatingSelectionBarProps {
  selectedCount: number;
  hiddenSelectedCount: number;
  onOpenPdfExport: () => void;
  onOpenDataExport: () => void;
  onClearSelection: () => void;
  onShowOnlySelected: () => void;
  isShowingOnlySelected: boolean;
}

export const FloatingSelectionBar: React.FC<FloatingSelectionBarProps> = ({
  selectedCount,
  hiddenSelectedCount,
  onOpenPdfExport,
  onOpenDataExport,
  onClearSelection,
  onShowOnlySelected,
  isShowingOnlySelected,
}) => {
  if (selectedCount === 0) return null;

  return (
    <aside
      aria-label="סרגל פעולות על פריטים נבחרים"
      className="fixed bottom-5 inset-x-0 z-40 max-w-2xl mx-auto px-4 pointer-events-none font-sans-hebrew"
    >
      <div className="pointer-events-auto bg-[#FAF8F5] p-3 sm:p-4 rounded-2xl shadow-[0_16px_40px_rgba(20,24,31,0.22)] border border-[#DDD6CB] flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#8F4824] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
            {selectedCount}
          </div>
          <div>
            <div className="text-sm font-bold font-serif-hebrew text-[#14181F]">
              נבחרו {selectedCount} פריטים
            </div>
            {hiddenSelectedCount > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-[#B45309] font-medium">
                <AlertCircle className="w-3 h-3 text-[#B45309] shrink-0" />
                <span>{hiddenSelectedCount} פריטים נבחרים מוסתרים עקב המסננים</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <button
            id="bar-btn-toggle-show"
            onClick={onShowOnlySelected}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all active:translate-y-px flex items-center gap-1.5 ${
              isShowingOnlySelected
                ? 'bg-[#F0EDE6] text-[#14181F] border-[#1C2024]'
                : 'bg-white hover:bg-[#FAF8F5] text-[#556070] border-[#DDD6CB]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isShowingOnlySelected ? 'הצג את כל הפריטים' : 'הצגת הבחירה'}</span>
          </button>

          <button
            id="bar-btn-pdf"
            onClick={onOpenPdfExport}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#1C2024] hover:bg-[#2D3540] text-white shadow-xs border border-[#14181F] transition-all active:translate-y-px flex items-center gap-1.5"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>ייצוא ל־PDF</span>
          </button>

          <button
            id="bar-btn-data"
            onClick={onOpenDataExport}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-[#FAF8F5] text-[#14181F] border border-[#DDD6CB] shadow-2xs transition-all active:translate-y-px flex items-center gap-1.5"
          >
            <Table className="w-3.5 h-3.5 text-[#8F4824]" />
            <span>ייצוא נתונים</span>
          </button>

          <button
            id="bar-btn-clear"
            onClick={onClearSelection}
            className="p-1.5 rounded-xl text-[#7E8896] hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
            title="ניקוי הבחירה"
            aria-label="ניקוי הבחירה"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

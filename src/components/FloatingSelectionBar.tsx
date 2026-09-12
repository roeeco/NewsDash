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
      className="fixed bottom-5 inset-x-0 z-40 max-w-2xl mx-auto px-4 pointer-events-none"
    >
      <div className="pointer-events-auto glass-panel-opaque p-3 sm:p-4 shadow-2xl border border-[#536BD9]/30 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#536BD9] text-white flex items-center justify-center font-bold text-sm shrink-0">
            {selectedCount}
          </div>
          <div>
            <div className="text-sm font-bold text-[#17243A]">
              נבחרו {selectedCount} פריטים
            </div>
            {hiddenSelectedCount > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-amber-700 font-medium">
                <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                <span>{hiddenSelectedCount} פריטים נבחרים מוסתרים עקב המסננים</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <button
            id="bar-btn-toggle-show"
            onClick={onShowOnlySelected}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              isShowingOnlySelected
                ? 'bg-indigo-100 text-[#334BB8] border-indigo-200'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isShowingOnlySelected ? 'הצג את כל הפריטים' : 'הצגת הבחירה'}</span>
          </button>

          <button
            id="bar-btn-pdf"
            onClick={onOpenPdfExport}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#536BD9] hover:bg-[#4357c2] text-white shadow-xs transition-colors flex items-center gap-1.5"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>ייצוא ל־PDF</span>
          </button>

          <button
            id="bar-btn-data"
            onClick={onOpenDataExport}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Table className="w-3.5 h-3.5 text-[#536BD9]" />
            <span>ייצוא נתונים</span>
          </button>

          <button
            id="bar-btn-clear"
            onClick={onClearSelection}
            className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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

import React, { useState } from 'react';
import {
  AlertTriangle,
  Trash2,
  RefreshCw,
  X,
  Download,
  Database,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { resetDatabase } from '../lib/api.ts';

interface ResetDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  totalItems: number;
  totalBriefings: number;
  totalLogs?: number;
}

export const ResetDatabaseModal: React.FC<ResetDatabaseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  totalItems,
  totalBriefings,
  totalLogs = 0,
}) => {
  const [confirmed, setConfirmed] = useState(false);
  const [resetType, setResetType] = useState<'empty' | 'sample'>('empty');
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadQuickBackup = async () => {
    try {
      const res = await fetch('/api/backup?scope=full');
      if (!res.ok) throw new Error('שגיאה ביצירת קובץ גיבוי');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inspiration-library-pre-reset-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      alert((err as Error).message || 'שגיאה בהורדת גיבוי');
    }
  };

  const handleExecuteReset = async () => {
    if (!confirmed) return;
    try {
      setIsResetting(true);
      setError(null);
      const result = await resetDatabase(resetType === 'sample');
      setSuccessMessage(result.message);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: unknown) {
      setError((err as Error).message || 'אירעה שגיאה בעת איפוס המאגר');
      setIsResetting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14181F]/60 backdrop-blur-xs animate-in fade-in duration-200 font-sans-hebrew"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-modal-title"
    >
      <div
        className="bg-[#FAF8F5] paper-sheet rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-rose-300 space-y-5 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center shrink-0 shadow-xs">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h2 id="reset-modal-title" className="text-lg font-bold font-serif-hebrew text-rose-950">
                איפוס ומחיקת כל המאגר
              </h2>
              <p className="text-xs text-[#556070]">
                פעולה זו תאפס את כל המידע השמור במסד הנתונים
              </p>
            </div>
          </div>
          <button
            id="btn-close-reset-modal"
            onClick={onClose}
            disabled={isResetting}
            className="p-2 rounded-xl text-[#7E8896] hover:text-[#14181F] hover:bg-[#EAE5DC] transition-colors cursor-pointer"
            aria-label="סגור חלון"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Database Summary */}
        <div className="p-3.5 bg-[#F0EDE6] rounded-xl border border-[#DDD6CB] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#14181F]">
            <Database className="w-4 h-4 text-[#8F4824]" />
            <span className="font-bold">מצב המאגר הנוכחי:</span>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-white border border-[#DDD6CB] font-bold text-[#14181F]">
              {totalItems} פריטים
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white border border-[#DDD6CB] font-bold text-[#14181F]">
              {totalBriefings} תדריכים
            </span>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="p-4 rounded-xl bg-[#FFF5F5] border border-rose-200 text-rose-950 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-rose-900 text-sm font-serif-hebrew">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-700" />
            <span>אזהרה: פעולה בלתי הפיכה</span>
          </div>
          <p className="leading-relaxed text-rose-900/90">
            איפוס המאגר ימחק לחלוטין את כל הפריטים, הקישורים לתדריכים, יומני הייבוא, והדירוגים והסטטוסים האישיים שלך.
          </p>
          <div className="pt-1">
            <button
              type="button"
              id="btn-download-backup-before-reset"
              onClick={handleDownloadQuickBackup}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-rose-300 text-rose-900 font-bold text-xs hover:bg-rose-50 shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-rose-700" />
              <span>הורדת קובץ גיבוי מלא (JSON) לפני המחיקה</span>
            </button>
          </div>
        </div>

        {/* Reset Mode Options */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#14181F]">בחר את אופן האיפוס:</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                resetType === 'empty'
                  ? 'bg-[#FFF5F5] border-rose-400 ring-1 ring-rose-400 shadow-2xs'
                  : 'bg-[#FAF8F5] border-[#DDD6CB] hover:bg-white'
              }`}
            >
              <input
                type="radio"
                name="reset-type"
                value="empty"
                checked={resetType === 'empty'}
                onChange={() => setResetType('empty')}
                className="mt-1 text-rose-700 focus:ring-rose-700"
              />
              <div className="space-y-0.5">
                <span className="block text-xs font-bold text-rose-950 font-serif-hebrew">
                  ריקון מוחלט (0 פריטים)
                </span>
                <span className="block text-[11px] text-[#556070] leading-tight">
                  מחיקת כל התוכן. המאגר יהיה ריק ומוכן לייבוא תדריך חדש.
                </span>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                resetType === 'sample'
                  ? 'bg-white border-[#1C2024] ring-1 ring-[#1C2024] shadow-2xs'
                  : 'bg-[#FAF8F5] border-[#DDD6CB] hover:bg-white'
              }`}
            >
              <input
                type="radio"
                name="reset-type"
                value="sample"
                checked={resetType === 'sample'}
                onChange={() => setResetType('sample')}
                className="mt-1 text-[#1C2024] focus:ring-[#1C2024]"
              />
              <div className="space-y-0.5">
                <span className="block text-xs font-bold text-[#14181F] font-serif-hebrew flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#8F4824]" />
                  <span>איפוס לתדריך דוגמה</span>
                </span>
                <span className="block text-[11px] text-[#556070] leading-tight">
                  מחיקת שינויים וטעינה מחדש של תדריך הדוגמה המקורי (5 פריטים).
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Safety Checkbox Confirmation */}
        <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#FDF9F0] border border-[#E8DCC4] cursor-pointer text-xs select-none">
          <input
            id="chk-confirm-reset"
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="w-4 h-4 rounded text-rose-700 focus:ring-rose-700 border-[#DDD6CB]"
          />
          <span className="font-bold text-[#78350F]">
            אני מאשר/ת מחיקה מלאה של כל נתוני המאגר
          </span>
        </label>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-[#FEF2F2] border border-red-200 rounded-xl text-xs text-red-950 font-medium">
            {error}
          </div>
        )}

        {/* Success message */}
        {successMessage && (
          <div className="p-3 bg-[#F2F8F4] border border-[#24523B]/30 rounded-xl text-xs text-[#24523B] font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#24523B]" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#DDD6CB]">
          <button
            type="button"
            id="btn-cancel-reset"
            onClick={onClose}
            disabled={isResetting}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#556070] hover:text-[#14181F] hover:bg-[#EAE5DC] transition-colors cursor-pointer"
          >
            ביטול
          </button>

          <button
            type="button"
            id="btn-confirm-clear-database"
            onClick={handleExecuteReset}
            disabled={!confirmed || isResetting}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 active:bg-rose-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs border border-rose-800 transition-all flex items-center gap-2 cursor-pointer active:translate-y-px"
          >
            {isResetting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>מאפס את המאגר...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>{resetType === 'empty' ? 'מחק את כל המאגר' : 'אפס וטען תדריך דוגמה'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import {
  Database,
  Download,
  Upload,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Info,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import type { BackupFormat, LibraryItem } from '../types.ts';
import { restoreBackup } from '../lib/api.ts';
import { generateCsvString } from '../lib/csv.ts';

interface BackupExportViewProps {
  allItems: LibraryItem[];
  selectedItemIds: Set<string>;
  filteredItems: LibraryItem[];
  onDataRestored: () => void;
  onOpenResetModal?: () => void;
}

export const BackupExportView: React.FC<BackupExportViewProps> = ({
  allItems,
  selectedItemIds,
  filteredItems,
  onDataRestored,
  onOpenResetModal,
}) => {
  const [exportScope, setExportScope] = useState<'full' | 'filtered' | 'selected'>('full');
  const [includePersonalInCsv, setIncludePersonalInCsv] = useState(false);
  const [restoreJsonText, setRestoreJsonText] = useState('');
  const [parsedBackup, setParsedBackup] = useState<BackupFormat | null>(null);
  const [restoreValidationErrors, setRestoreValidationErrors] = useState<string[]>([]);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreReceipt, setRestoreReceipt] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate scope items count
  const targetItems =
    exportScope === 'full'
      ? allItems
      : exportScope === 'filtered'
      ? filteredItems
      : allItems.filter((it) => selectedItemIds.has(it.id));

  // Handle Full JSON Backup Download
  const handleDownloadJson = async () => {
    try {
      const idsParam =
        exportScope !== 'full' ? `&ids=${targetItems.map((i) => i.id).join(',')}` : '';
      const res = await fetch(`/api/backup?scope=${exportScope}${idsParam}`);
      if (!res.ok) throw new Error('שגיאה ביצירת קובץ הגיבוי');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inspiration-library-backup-${exportScope}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      alert((err as Error).message || 'שגיאה בהורדת קובץ הגיבוי');
    }
  };

  // Handle CSV Export Download
  const handleDownloadCsv = () => {
    try {
      const csvData = generateCsvString(targetItems, includePersonalInCsv);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inspiration-library-${exportScope}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      alert((err as Error).message || 'שגיאה ביצירת קובץ CSV');
    }
  };

  // Validate Backup JSON
  const handleValidateRestoreFile = (content: string) => {
    setRestoreValidationErrors([]);
    setParsedBackup(null);
    setRestoreReceipt(null);

    try {
      let clean = content.trim();
      if (clean.charCodeAt(0) === 0xfeff) clean = clean.slice(1);
      const parsed = JSON.parse(clean);

      if (parsed.format !== 'inspiration-library-backup') {
        setRestoreValidationErrors([
          'הקובץ אינו קובץ גיבוי תקני של ספריית השראה (חסר מזהה inspiration-library-backup).',
        ]);
        return;
      }

      if (parsed.version !== 1) {
        setRestoreValidationErrors([`גרסת גיבוי שאינה נתמכת: ${parsed.version}`]);
        return;
      }

      if (!Array.isArray(parsed.items)) {
        setRestoreValidationErrors(['הקובץ אינו מכיל רשימת פריטים תקינה']);
        return;
      }

      setParsedBackup(parsed as BackupFormat);
    } catch (err: unknown) {
      setRestoreValidationErrors([`שגיאת פענוח JSON: ${(err as Error).message}`]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setRestoreJsonText(text);
        handleValidateRestoreFile(text);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExecuteRestore = async () => {
    if (!parsedBackup) return;

    if (restoreMode === 'replace') {
      const ok = confirm(
        'אזהרה: החלפה מלאה תמחק את כל הנתונים הקיימים כרגע בספרייה ותחליפם בקובץ הגיבוי!\nהאם לבצע החלפה מלאה?'
      );
      if (!ok) return;
    }

    setIsRestoring(true);
    try {
      const res = await restoreBackup(parsedBackup, restoreMode);
      setRestoreReceipt(res.message);
      onDataRestored();
      setParsedBackup(null);
      setRestoreJsonText('');
    } catch (err: unknown) {
      alert((err as Error).message || 'שגיאה בשחזור הנתונים');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-in fade-in duration-200 font-sans-hebrew">
      {/* Top Banner */}
      <div className="paper-sheet p-6 sm:p-8 rounded-2xl">
        <div className="flex items-center gap-3.5 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#1C2024] text-[#FAF8F5] flex items-center justify-center border border-[#14181F] shadow-xs">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-serif-hebrew text-[#14181F]">גיבוי, שחזור וייצוא נתונים</h2>
            <p className="text-sm text-[#556070]">
              ניהול עותקי גיבוי מלאים (JSON) לשחזור הספרייה, וייצוא נתונים לטבלאות (CSV)
            </p>
          </div>
        </div>
      </div>

      {/* Scope Selector for Export */}
      <div className="paper-sheet p-6 sm:p-8 space-y-6 rounded-2xl">
        <div>
          <h3 className="text-lg font-bold font-serif-hebrew text-[#14181F]">1. ייצוא וגיבוי הנתונים</h3>
          <p className="text-xs text-[#556070] mt-1">
            בחרו את היקף הנתונים ואת הפורמט הרצוי להורדה.
          </p>
        </div>

        {/* Scope selector */}
        <div className="p-4 rounded-xl bg-[#F2EFEB] border border-[#DDD6CB] space-y-3">
          <label className="text-xs font-bold text-[#14181F] block">היקף הייצוא:</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setExportScope('full')}
              className={`p-3 rounded-xl text-right border transition-all cursor-pointer ${
                exportScope === 'full'
                  ? 'bg-white border-[#1C2024] ring-1 ring-[#1C2024] text-[#14181F] shadow-2xs'
                  : 'bg-[#FAF8F5] border-[#DDD6CB] text-[#556070] hover:bg-white hover:text-[#14181F]'
              }`}
            >
              <span className="font-bold text-sm block font-serif-hebrew">כל המאגר ({allItems.length} פריטים)</span>
              <span className="text-[11px] text-[#7E8896] block mt-0.5">
                כולל כל התדריכים, הארכיון והיומנים
              </span>
            </button>

            <button
              type="button"
              onClick={() => setExportScope('filtered')}
              className={`p-3 rounded-xl text-right border transition-all cursor-pointer ${
                exportScope === 'filtered'
                  ? 'bg-white border-[#1C2024] ring-1 ring-[#1C2024] text-[#14181F] shadow-2xs'
                  : 'bg-[#FAF8F5] border-[#DDD6CB] text-[#556070] hover:bg-white hover:text-[#14181F]'
              }`}
            >
              <span className="font-bold text-sm block font-serif-hebrew">תוצאות מסוננות ({filteredItems.length} פריטים)</span>
              <span className="text-[11px] text-[#7E8896] block mt-0.5">
                בהתאם למסנני החיפוש הפעילים בספרייה
              </span>
            </button>

            <button
              type="button"
              onClick={() => setExportScope('selected')}
              disabled={selectedItemIds.size === 0}
              className={`p-3 rounded-xl text-right border transition-all ${
                exportScope === 'selected'
                  ? 'bg-white border-[#1C2024] ring-1 ring-[#1C2024] text-[#14181F] shadow-2xs cursor-pointer'
                  : 'bg-[#FAF8F5] border-[#DDD6CB] text-[#556070] hover:bg-white hover:text-[#14181F] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed'
              }`}
            >
              <span className="font-bold text-sm block font-serif-hebrew">פריטים מסומנים ({selectedItemIds.size} פריטים)</span>
              <span className="text-[11px] text-[#7E8896] block mt-0.5">
                הפריטים שסומנו ידנית באמצעות תיבות הסימון
              </span>
            </button>
          </div>
        </div>

        {/* Action Cards: JSON vs CSV */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* JSON Full Backup Card */}
          <div className="p-6 rounded-xl bg-[#FAF8F5] border border-[#DDD6CB] shadow-2xs flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#14181F]">
                <FileCode className="w-5 h-5 text-[#8F4824]" />
                <h4 className="font-bold text-base font-serif-hebrew text-[#14181F]">גיבוי מלא — JSON</h4>
              </div>
              <p className="text-xs text-[#556070] leading-relaxed">
                כולל את כל נתוני המערכת לשחזור מושלם: תוכן מלא, שדות מקוננים, מזהים יציבים, קשרי
                תדריכים, דירוגים, הערות, תאריכים ויומן ייבוא.
              </p>
              <div className="text-[11px] text-[#8F4824] bg-[#FDF9F0] border border-[#E8DCC4] p-2 rounded-lg font-medium">
                מיועד לשחזור מלא ומעבר בין מכשירים.
              </div>
            </div>

            <button
              id="btn-download-backup-json"
              onClick={handleDownloadJson}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-bold bg-[#1C2024] hover:bg-[#2D3540] text-white shadow-xs border border-[#14181F] flex items-center justify-center gap-2 transition-all active:translate-y-px cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>הורדת גיבוי JSON ({targetItems.length} פריטים)</span>
            </button>
          </div>

          {/* CSV Export Card */}
          <div className="p-6 rounded-xl bg-[#FAF8F5] border border-[#DDD6CB] shadow-2xs flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#24523B]">
                <FileSpreadsheet className="w-5 h-5 text-[#24523B]" />
                <h4 className="font-bold text-base font-serif-hebrew text-[#14181F]">ייצוא לטבלה — CSV</h4>
              </div>
              <p className="text-xs text-[#556070] leading-relaxed">
                קובץ UTF-8 עם BOM מותאם במיוחד לאקסל בעברית, הגנה מפני הזרקת נוסחאות (Formula Injection)
                ושמירת מידע מקונן.
              </p>

              <label className="flex items-center gap-2 text-xs text-[#556070] cursor-pointer pt-1 font-medium">
                <input
                  type="checkbox"
                  checked={includePersonalInCsv}
                  onChange={(e) => setIncludePersonalInCsv(e.target.checked)}
                  className="w-4 h-4 rounded border-[#DDD6CB] text-[#1C2024] focus:ring-[#1C2024]"
                />
                <span>כלול דירוגים, סטטוסים והערות אישיות בטבלה</span>
              </label>
            </div>

            <button
              id="btn-download-export-csv"
              onClick={handleDownloadCsv}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-white hover:bg-[#FAF8F5] text-[#14181F] border border-[#DDD6CB] shadow-2xs flex items-center justify-center gap-2 transition-all active:translate-y-px cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#24523B]" />
              <span>ייצוא CSV לאקסל ({targetItems.length} פריטים)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Restore Section */}
      <div className="paper-sheet p-6 sm:p-8 space-y-6 rounded-2xl">
        <div>
          <h3 className="text-lg font-bold font-serif-hebrew text-[#14181F]">2. שחזור מגיבוי JSON</h3>
          <p className="text-xs text-[#556070] mt-1">
            העלו או הדביקו קובץ גיבוי בפורמט <code className="font-mono bg-[#F2EFEB] px-1 py-0.5 rounded border border-[#DDD6CB]">inspiration-library-backup</code> לשחזור הספרייה.
          </p>
        </div>

        {/* Restore Receipt Banner */}
        {restoreReceipt && (
          <div className="p-4 rounded-xl bg-[#F2F8F4] border border-[#24523B]/30 text-[#24523B] flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-[#24523B] shrink-0" />
            <span className="text-sm font-bold">{restoreReceipt}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="restore-json-input" className="text-xs font-bold text-[#14181F]">
              הדבקת תוכן קובץ הגיבוי:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".json,application/json"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#FAF8F5] hover:bg-white text-[#14181F] border border-[#DDD6CB] shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-[#8F4824]" />
                <span>העלאת קובץ גיבוי</span>
              </button>
            </div>
          </div>

          <textarea
            id="restore-json-input"
            dir="ltr"
            value={restoreJsonText}
            onChange={(e) => {
              setRestoreJsonText(e.target.value);
              handleValidateRestoreFile(e.target.value);
            }}
            rows={5}
            placeholder='{\n  "format": "inspiration-library-backup",\n  "version": 1,\n  "items": [...]\n}'
            className="w-full font-mono text-xs p-3 rounded-xl border border-[#DDD6CB] bg-[#FAF8F5] text-[#14181F] focus:bg-white focus:border-[#1C2024] shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)]"
          />

          {/* Validation Errors */}
          {restoreValidationErrors.length > 0 && (
            <div className="p-4 rounded-xl bg-[#FEF2F2] border border-red-200 text-red-950 space-y-1 text-xs">
              <span className="font-bold block">שגיאה באימות קובץ הגיבוי:</span>
              <ul className="list-disc list-inside">
                {restoreValidationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Backup Summary & Confirmation */}
          {parsedBackup && (
            <div className="p-5 rounded-xl bg-[#FAF8F5] border border-[#DDD6CB] shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-base font-serif-hebrew text-[#14181F]">קובץ גיבוי מאומת ומוכן לשחזור</h4>
                  <span className="text-xs text-[#556070]">
                    תאריך ייצוא מקורי: {parsedBackup.exported_at} | היקף: {parsedBackup.scope}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-[#24523B]/10 text-[#24523B] border border-[#24523B]/20 font-bold">
                    {parsedBackup.items?.length || 0} פריטים
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#F0EDE6] text-[#14181F] border border-[#DDD6CB] font-bold">
                    {parsedBackup.briefings?.length || 0} תדריכים
                  </span>
                </div>
              </div>

              {/* Mode Selection: Merge vs Replace */}
              <div className="p-3 bg-[#F2EFEB] rounded-xl space-y-2 text-xs border border-[#DDD6CB]">
                <span className="font-bold text-[#14181F] block">בחירת אופן השחזור:</span>
                <div className="flex flex-col sm:flex-row gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[#14181F]">
                    <input
                      type="radio"
                      name="restore-mode"
                      value="merge"
                      checked={restoreMode === 'merge'}
                      onChange={() => setRestoreMode('merge')}
                      className="text-[#1C2024] focus:ring-[#1C2024]"
                    />
                    <span>מיזוג ללא מחיקה (מומלץ — שומר פריטים קיימים ומוסיף/מעדכן)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-red-700">
                    <input
                      type="radio"
                      name="restore-mode"
                      value="replace"
                      checked={restoreMode === 'replace'}
                      onChange={() => setRestoreMode('replace')}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span>החלפה מלאה (מוחק את המאגר הנוכחי ומחליפו בקובץ)</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-[#7E8896]">
                  כל המזהים והקשרים המקוריים יישמרו בדיוק כפי שהיו.
                </span>
                <button
                  id="btn-execute-restore"
                  onClick={handleExecuteRestore}
                  disabled={isRestoring}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#1C2024] hover:bg-[#2D3540] text-white shadow-xs border border-[#14181F] disabled:opacity-50 flex items-center gap-2 transition-all active:translate-y-px cursor-pointer"
                >
                  {isRestoring ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>משחזר נתונים...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>בצע שחזור</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone: Database Reset & Purge */}
      <div className="paper-sheet p-6 rounded-2xl border-rose-300 bg-[#FFF5F5] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base font-serif-hebrew text-rose-950">אזור סכנה: איפוס ומחיקת כל המאגר</h3>
              <p className="text-xs text-rose-900/80 mt-0.5 leading-relaxed">
                מחיקת כל הפריטים, הקישורים לתדריכים, יומני הייבוא והדירוגים האישיים השמורים במערכת ({allItems.length} פריטים כעת).
                פעולה זו תאפשר ריקון מוחלט של מסד הנתונים או איפוס לתדריך דוגמה נקי.
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-reset-database"
            onClick={onOpenResetModal}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-700 hover:bg-rose-800 active:bg-rose-900 text-white shadow-xs border border-rose-800 transition-colors flex items-center gap-2 shrink-0 self-start sm:self-center cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>איפוס ומחיקת כל המאגר...</span>
          </button>
        </div>
      </div>
    </div>
  );
};

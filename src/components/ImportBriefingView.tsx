import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileCode,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Layers,
  ArrowLeft,
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type {
  BriefingPayload,
  BriefingRecord,
  BriefingValidationResult,
  ImportLogRecord,
  ValidationPreviewItem,
} from '../types.ts';
import { validateBriefing, importBriefing } from '../lib/api.ts';
import { formatDateHebrew, formatDateTimeHebrew } from '../lib/dateUtils.ts';
import { SAMPLE_BRIEFING } from '../data/sample-briefing.ts';
import { Sparkles } from 'lucide-react';

interface ImportBriefingViewProps {
  importLogs: ImportLogRecord[];
  onImportComplete: () => void;
  onGoToLibrary: () => void;
  onGoToBackup: () => void;
}

export const ImportBriefingView: React.FC<ImportBriefingViewProps> = ({
  importLogs,
  onImportComplete,
  onGoToLibrary,
  onGoToBackup,
}) => {
  const [jsonInput, setJsonInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<BriefingValidationResult | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [importReceipt, setImportReceipt] = useState<{
    added_count: number;
    updated_count: number;
    skipped_count: number;
    unaccepted_count: number;
    log_id: string;
  } | null>(null);
  const [expandedDiffIndex, setExpandedDiffIndex] = useState<number | null>(null);
  const [parsedPayload, setParsedPayload] = useState<BriefingPayload | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleValidate = async () => {
    if (!jsonInput.trim()) {
      alert('נא להדביק תוכן JSON מהתדריך');
      return;
    }

    setIsValidating(true);
    setValidationResult(null);
    setImportReceipt(null);

    try {
      const result = await validateBriefing(jsonInput);
      setValidationResult(result);

      if (result.valid_envelope) {
        try {
          // Keep parsed payload ready for execution
          const cleanText = jsonInput.trim().replace(/^\uFEFF/, '').replace(/^```(?:json)?\s*\n([\s\S]*?)\n\s*```$/i, '$1');
          setParsedPayload(JSON.parse(cleanText));
        } catch {
          // Handled by envelope validation
        }

        // Initialize selections: select all 'new', 'proposed_update', and 'suspected_duplicate' by default; uncheck 'existing_unchanged' and 'invalid'
        const initialSelected = new Set<number>();
        for (const item of result.items_preview) {
          if (item.selected_for_import && item.status !== 'invalid') {
            initialSelected.add(item.index);
          }
        }
        setSelectedIndices(initialSelected);
      }
    } catch (err: unknown) {
      alert((err as Error).message || 'שגיאה באימות התדריך');
    } finally {
      setIsValidating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setJsonInput(content);
        setValidationResult(null);
        setImportReceipt(null);
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleToggleItemSelect = (index: number) => {
    const copy = new Set(selectedIndices);
    if (copy.has(index)) {
      copy.delete(index);
    } else {
      copy.add(index);
    }
    setSelectedIndices(copy);
  };

  const handleSelectAll = (select: boolean) => {
    if (!validationResult) return;
    if (!select) {
      setSelectedIndices(new Set());
    } else {
      const validIndices = validationResult.items_preview
        .filter((it) => it.status !== 'invalid')
        .map((it) => it.index);
      setSelectedIndices(new Set(validIndices));
    }
  };

  const handleExecuteImport = async () => {
    if (!parsedPayload) {
      alert('נתוני התדריך אינם זמינים לקליטה');
      return;
    }

    if (selectedIndices.size === 0) {
      if (!confirm('לא נבחרו פריטים לקליטה. האם להמשיך בשמירת התדריך והסקירה בלבד?')) {
        return;
      }
    }

    const hasInvalid = validationResult?.counts.invalid && validationResult.counts.invalid > 0;
    if (hasInvalid) {
      if (
        !confirm(
          `קיימים ${validationResult.counts.invalid} פריטים לא תקינים בתדריך. האם לאשר ייבוא חלקי של הפריטים התקינים שנבחרו בלבד?`
        )
      ) {
        return;
      }
    }

    setIsImporting(true);
    try {
      const receipt = await importBriefing(parsedPayload, Array.from(selectedIndices), true);
      setImportReceipt(receipt);
      onImportComplete();
    } catch (err: unknown) {
      alert((err as Error).message || 'שגיאה בעת שמירת התדריך');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="glass-panel p-6 sm:p-8">
        <div className="flex items-center gap-3.5 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-[#536BD9] text-white flex items-center justify-center">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#17243A]">ייבוא תדריך מחקר</h2>
            <p className="text-sm text-[#4A5568]">
              הדבקת פלט הסוכן (JSON) ובדיקת תאימות לסכמה Draft 2020-12 לפני שמירה בספרייה
            </p>
          </div>
        </div>
      </div>

      {/* Import Receipt if completed */}
      {importReceipt && (
        <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-300 shadow-sm animate-in zoom-in-95 duration-200 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
            <div>
              <h3 className="text-xl font-bold text-emerald-950">קבלת ייבוא — הנתונים נקלטו בהצלחה!</h3>
              <p className="text-xs text-emerald-800">
                מזהה רישום ביומן: <code className="font-mono">{importReceipt.log_id}</code>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-white/80 rounded-2xl border border-emerald-200">
              <span className="text-2xl font-black text-emerald-700">{importReceipt.added_count}</span>
              <span className="block text-xs font-semibold text-slate-600 mt-0.5">פריטים חדשים נוספו</span>
            </div>
            <div className="p-3 bg-white/80 rounded-2xl border border-emerald-200">
              <span className="text-2xl font-black text-indigo-700">{importReceipt.updated_count}</span>
              <span className="block text-xs font-semibold text-slate-600 mt-0.5">פריטים עודכנו</span>
            </div>
            <div className="p-3 bg-white/80 rounded-2xl border border-emerald-200">
              <span className="text-2xl font-black text-slate-500">{importReceipt.skipped_count}</span>
              <span className="block text-xs font-semibold text-slate-600 mt-0.5">פריטים דולגו</span>
            </div>
            <div className="p-3 bg-white/80 rounded-2xl border border-emerald-200">
              <span className="text-2xl font-black text-amber-600">{importReceipt.unaccepted_count}</span>
              <span className="block text-xs font-semibold text-slate-600 mt-0.5">לא נקלטו / חריגים</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onGoToLibrary}
              className="px-5 py-2.5 rounded-xl font-bold text-sm bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs flex items-center gap-2"
            >
              <span>מעבר לספרייה לצפייה בפריטים</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setImportReceipt(null);
                setValidationResult(null);
                setJsonInput('');
              }}
              className="px-4 py-2.5 rounded-xl text-sm font-medium bg-white text-slate-700 border border-emerald-300 hover:bg-emerald-100/50"
            >
              ייבוא תדריך נוסף
            </button>
          </div>
        </div>
      )}

      {/* Input Section */}
      <div className="glass-panel p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <label htmlFor="briefing-json-input" className="text-base font-bold text-[#17243A] block">
              הדבקת JSON מהתדריך
            </label>
            <p className="text-xs text-[#526078]">
              הדביקו את פלט הסוכן. לפני השמירה תוכלו לבדוק ולבחור את הפריטים.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setJsonInput(JSON.stringify(SAMPLE_BRIEFING, null, 2));
                setValidationResult(null);
                setImportReceipt(null);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-[#334BB8] border border-indigo-200 shadow-xs flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#536BD9]" />
              <span>טעינת תדריך דוגמה (תואם סכמה)</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json,application/json"
              className="hidden"
              id="file-upload-input"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-xs flex items-center gap-1.5"
            >
              <FileCode className="w-3.5 h-3.5 text-[#536BD9]" />
              <span>העלאת קובץ JSON</span>
            </button>
          </div>
        </div>

        {/* Textarea strictly LTR inside RTL layout as specified */}
        <div className="relative">
          <textarea
            id="briefing-json-input"
            dir="ltr"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            rows={10}
            placeholder='{\n  "schema_version": 1,\n  "briefing_id": "inspiration-2026-05-12",\n  "briefing_date": "2026-05-12",\n  "timezone": "Asia/Jerusalem",\n  "status": "complete",\n  ...\n}'
            className="w-full font-mono text-xs sm:text-sm p-4 rounded-2xl border border-slate-300 bg-white/95 focus:ring-2 focus:ring-[#536BD9] focus:border-[#536BD9] shadow-inner resize-y leading-normal"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-500">
            תמיכה מלאה בהסרת BOM, בלוקי קוד Markdown, ובדיקת פורמט תאריכים וכתובות.
          </div>

          <div className="flex items-center gap-3">
            {jsonInput && (
              <button
                type="button"
                onClick={() => {
                  setJsonInput('');
                  setValidationResult(null);
                }}
                className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800"
              >
                ניקוי שדה
              </button>
            )}

            <button
              id="btn-validate-briefing"
              type="button"
              onClick={handleValidate}
              disabled={isValidating || !jsonInput.trim()}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#536BD9] hover:bg-[#4357c2] text-white shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              {isValidating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>בודק תאימות...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>בדיקת הנתונים ותצוגה מקדימה</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Validation Results & Preview Section */}
      {validationResult && (
        <div className="space-y-6">
          {/* Backup file pasted warning redirect */}
          {validationResult.is_backup_file && (
            <div className="p-6 rounded-3xl bg-amber-50 border border-amber-300 text-amber-950 space-y-3">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
                <h3 className="font-bold text-lg">זיהינו קובץ גיבוי של הספרייה!</h3>
              </div>
              <p className="text-sm">
                הקובץ שהודבק הוא קובץ גיבוי של הספרייה ("inspiration-library-backup") ולא פלט סוכן תדריך.
              </p>
              <button
                onClick={onGoToBackup}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
              >
                מעבר למסך גיבוי ושחזור נתונים ←
              </button>
            </div>
          )}

          {/* Envelope Errors (Blocking) */}
          {!validationResult.valid_envelope && !validationResult.is_backup_file && (
            <div className="p-6 rounded-3xl bg-red-50 border border-red-300 text-red-950 space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
                <h3 className="font-bold text-lg">שגיאה במעטפת התדריך — לא ניתן לייבא</h3>
              </div>
              <p className="text-xs text-red-800">
                נמצאו שגיאות תאימות לסכמה Draft 2020-12 ברמת מעטפת המסמך:
              </p>
              <ul className="list-disc list-inside text-xs space-y-1 font-mono bg-white/70 p-3 rounded-xl border border-red-200">
                {validationResult.envelope_errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Valid Envelope -> Show Summary and Items Preview */}
          {validationResult.valid_envelope && (
            <div className="glass-panel p-6 sm:p-8 space-y-6">
              {/* Envelope Meta Summary */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/90 border border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-[#17243A]">
                      תדריך {validationResult.briefing_id}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        validationResult.agent_status === 'complete'
                          ? 'bg-emerald-100 text-emerald-800'
                          : validationResult.agent_status === 'partial'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      סטטוס מחקר: {validationResult.agent_status}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 mt-1 block">
                    תאריך תדריך: {formatDateHebrew(validationResult.briefing_date)} | אזור זמן: Asia/Jerusalem
                  </span>
                </div>

                {/* Status counts pills */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                    {validationResult.counts.new} חדשים
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-indigo-50 text-[#334BB8] border border-indigo-200 font-semibold">
                    {validationResult.counts.proposed_update} עדכונים מוצעים
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                    {validationResult.counts.existing_unchanged} קיימים ללא שינוי
                  </span>
                  {validationResult.counts.suspected_duplicate > 0 && (
                    <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                      {validationResult.counts.suspected_duplicate} חשד לכפילות
                    </span>
                  )}
                  {validationResult.counts.invalid > 0 && (
                    <span className="px-3 py-1 rounded-xl bg-red-50 text-red-800 border border-red-200 font-semibold">
                      {validationResult.counts.invalid} לא תקינים
                    </span>
                  )}
                </div>
              </div>

              {/* Coverage checklist */}
              {validationResult.coverage && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    כיסוי 4 ערוצי המחקר (סוכן):
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    {validationResult.coverage.map((cov, i) => (
                      <div
                        key={i}
                        className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#17243A]">{cov.channel}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              cov.status === 'complete'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {cov.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{cov.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Selection Bar for Preview */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[#17243A]">
                    בחירת פריטים לקליטה ({selectedIndices.size} מתוך {validationResult.total_items} נבחרו)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className="text-xs text-[#536BD9] hover:underline font-medium"
                  >
                    בחר הכל
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className="text-xs text-slate-500 hover:underline font-medium"
                  >
                    נקה הכל
                  </button>
                </div>

                <button
                  id="btn-execute-import"
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={isImporting}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#536BD9] hover:bg-[#4357c2] text-white shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>שומר פריטים בספרייה...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>אישור ייבוא {selectedIndices.size} פריטים</span>
                    </>
                  )}
                </button>
              </div>

              {/* Items Preview List */}
              <div className="space-y-3">
                {validationResult.items_preview.map((previewItem) => {
                  const isSelected = selectedIndices.has(previewItem.index);
                  const isInvalid = previewItem.status === 'invalid';
                  const isDiffExpanded = expandedDiffIndex === previewItem.index;

                  return (
                    <div
                      key={previewItem.index}
                      className={`p-4 rounded-2xl border transition-all ${
                        isInvalid
                          ? 'bg-red-50/70 border-red-300'
                          : isSelected
                          ? 'bg-white border-[#536BD9] shadow-xs'
                          : 'bg-white/60 border-slate-200 opacity-80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isInvalid}
                            onChange={() => handleToggleItemSelect(previewItem.index)}
                            className="w-5 h-5 rounded-md border-slate-300 text-[#536BD9] focus:ring-[#536BD9] mt-0.5 cursor-pointer disabled:opacity-30"
                          />
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              {/* Status Badge */}
                              {previewItem.status === 'new' && (
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                  חדש
                                </span>
                              )}
                              {previewItem.status === 'proposed_update' && (
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-100 text-[#334BB8]">
                                  עדכון מוצע לפריט קיים
                                </span>
                              )}
                              {previewItem.status === 'existing_unchanged' && (
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
                                  קיים ללא שינוי
                                </span>
                              )}
                              {previewItem.status === 'suspected_duplicate' && (
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800">
                                  חשד לכפילות
                                </span>
                              )}
                              {previewItem.status === 'invalid' && (
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-100 text-red-800">
                                  לא תקין
                                </span>
                              )}

                              <span className="text-xs text-slate-500 font-medium">
                                {previewItem.item.source_name}
                              </span>
                            </div>

                            <h4 className="text-base font-bold text-[#17243A]">
                              {previewItem.item.title || '(ללא כותרת)'}
                            </h4>
                            <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                              {previewItem.item.summary}
                            </p>

                            {/* Match Reasons / Conflict Note */}
                            {previewItem.match_reasons && (
                              <div className="mt-2 text-xs text-slate-600 flex items-center gap-1.5">
                                <span className="font-semibold">סיבת זיהוי:</span>
                                <span>{previewItem.match_reasons.join(', ')}</span>
                                {previewItem.existing_title && (
                                  <span className="text-slate-400">
                                    (מול: {previewItem.existing_title})
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Validation Errors for Invalid items */}
                            {previewItem.validation_errors && (
                              <ul className="mt-2 text-xs text-red-700 list-disc list-inside">
                                {previewItem.validation_errors.map((err, eIdx) => (
                                  <li key={eIdx}>{err}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>

                        {/* Proposed Diff Toggle button */}
                        {previewItem.diff_fields && previewItem.diff_fields.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedDiffIndex(
                                isDiffExpanded ? null : previewItem.index
                              )
                            }
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-[#334BB8] hover:bg-indigo-100 shrink-0 flex items-center gap-1"
                          >
                            <span>שינויים ב־{previewItem.diff_fields.length} שדות</span>
                            {isDiffExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Expanded Diff preview */}
                      {isDiffExpanded && previewItem.diff_fields && (
                        <div className="mt-3 pt-3 border-t border-indigo-100 text-xs text-slate-700 space-y-1">
                          <strong className="text-indigo-950 block">שדות שהשתנו:</strong>
                          <div className="flex flex-wrap gap-1.5">
                            {previewItem.diff_fields.map((f) => (
                              <span
                                key={f}
                                className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 font-medium"
                              >
                                {f}
                              </span>
                            ))}
                          </div>
                          <span className="text-[11px] text-slate-500 block pt-1">
                            הערה: דירוגים והערות אישיות יישמרו ולא יושפעו מהעדכון.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Import Logs History Table per spec */}
      <div className="glass-panel p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#536BD9]" />
          <h3 className="text-lg font-bold text-[#17243A]">יומן ייבוא תדריכים</h3>
        </div>
        <p className="text-xs text-[#526078]">
          תיעוד כל מחזורי הייבוא שנקלטו באתר, מועדים, סטטוס סוכן ותוצאות קליטה בפועל.
        </p>

        {importLogs.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-white/60 rounded-2xl border border-slate-200">
            טרם בוצע ייבוא תדריכים בספרייה.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 px-3 font-semibold">מועד ייבוא</th>
                  <th className="py-2.5 px-3 font-semibold">מזהה תדריך</th>
                  <th className="py-2.5 px-3 font-semibold">תאריך תדריך</th>
                  <th className="py-2.5 px-3 font-semibold">מצב מחקר</th>
                  <th className="py-2.5 px-3 font-semibold">מצב קליטה</th>
                  <th className="py-2.5 px-3 font-semibold">נוספו / עודכנו</th>
                  <th className="py-2.5 px-3 font-semibold">מגבלות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {importLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/70 transition-colors">
                    <td className="py-2.5 px-3 text-[#17243A] font-medium">
                      {formatDateTimeHebrew(log.timestamp)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">{log.briefing_id}</td>
                    <td className="py-2.5 px-3">{formatDateHebrew(log.briefing_date)}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          log.agent_status === 'complete'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.agent_status === 'partial'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {log.agent_status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          log.import_status === 'success'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {log.import_status === 'success' ? 'הושלם' : 'חלקי'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#17243A]">
                      +{log.added_count} חדשים | {log.updated_count} עודכנו
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">
                      {log.limitations && log.limitations.length > 0
                        ? log.limitations.join('; ')
                        : 'ללא'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

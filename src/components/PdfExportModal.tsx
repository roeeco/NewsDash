import React, { useState } from 'react';
import {
  X,
  Printer,
  FileText,
  ArrowUp,
  ArrowDown,
  Trash2,
  Calendar,
  ExternalLink,
  Download,
  AlertCircle,
  GraduationCap,
  Star,
  Info,
} from 'lucide-react';
import type { LibraryItem } from '../types.ts';
import { formatDateHebrew, formatDateTimeHebrew } from '../lib/dateUtils.ts';

interface PdfExportModalProps {
  selectedItems: LibraryItem[];
  onClose: () => void;
  onRemoveItemFromSelection: (id: string) => void;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  selectedItems,
  onClose,
  onRemoveItemFromSelection,
}) => {
  const [docTitle, setDocTitle] = useState('ספריית השראה — פריטים נבחרים לפיתוח הוראה');
  const [includePersonalData, setIncludePersonalData] = useState(false);
  const [orderedItems, setOrderedItems] = useState<LibraryItem[]>(selectedItems);
  const [activeTab, setActiveTab] = useState<'preview' | 'order'>('preview');

  // Keep orderedItems in sync if items removed
  React.useEffect(() => {
    setOrderedItems((prev) => {
      const currentIds = new Set(selectedItems.map((it) => it.id));
      const filtered = prev.filter((it) => currentIds.has(it.id));
      const missing = selectedItems.filter((it) => !filtered.some((f) => f.id === it.id));
      return [...filtered, ...missing];
    });
  }, [selectedItems]);

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= orderedItems.length) return;
    const copy = [...orderedItems];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    setOrderedItems(copy);
  };

  const handlePrint = () => {
    // Print window targeting print stylesheet
    window.print();
  };

  const handleDownloadHtml = () => {
    const printDoc = document.getElementById('printable-document-content');
    if (!printDoc) return;

    const fullHtml = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>${docTitle}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 20mm;
      color: #17243A;
      background: #FFFFFF;
      line-height: 1.6;
    }
    h1 { font-size: 24pt; margin-bottom: 4pt; color: #17243A; }
    h2 { font-size: 16pt; margin-top: 20pt; margin-bottom: 6pt; color: #17243A; }
    .meta { font-size: 10pt; color: #526078; margin-bottom: 24pt; border-bottom: 1pt solid #E2E8F0; padding-bottom: 12pt; }
    .item { page-break-inside: avoid; break-inside: avoid; margin-bottom: 28pt; padding-bottom: 20pt; border-bottom: 1pt solid #E2E8F0; }
    .badge { display: inline-block; padding: 2pt 6pt; border-radius: 4pt; font-size: 9pt; font-weight: bold; background: #DDE4FF; color: #334BB8; margin-left: 6pt; }
    .caveat { background: #FEF3C7; border: 1pt solid #F59E0B; padding: 8pt; border-radius: 6pt; font-size: 10pt; margin: 8pt 0; }
    .programs { background: #F8FAFC; border: 1pt solid #E2E8F0; padding: 10pt; border-radius: 6pt; margin-top: 10pt; }
    .source-url { font-size: 9pt; color: #526078; direction: ltr; display: block; margin-top: 4pt; }
    a { color: #536BD9; text-decoration: underline; }
  </style>
</head>
<body>
  ${printDoc.innerHTML}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docTitle.replace(/[\s/\\:]+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generationDate = new Date().toISOString();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-[#17243A]/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
    >
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Top Control Bar (Screen only, hidden in print) */}
        <div className="no-print sticky top-0 z-20 px-6 py-4 bg-white/95 border-b border-slate-200 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 id="pdf-modal-title" className="text-xl font-bold text-[#17243A]">
              ייצוא מסמך קריאה ו־PDF
            </h2>
            <p className="text-xs text-slate-500">
              הפקת מסמך מעוצב להדפסה או שמירה כ־PDF עבור {orderedItems.length} פריטים נבחרים
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="pdf-btn-download-html"
              onClick={handleDownloadHtml}
              className="px-3.5 py-2 rounded-xl text-xs font-medium bg-white hover:bg-slate-50 text-[#17243A] border border-slate-300 shadow-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-[#536BD9]" />
              <span>הורדת מסמך HTML</span>
            </button>

            <button
              id="pdf-btn-print"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#536BD9] hover:bg-[#4357c2] text-white shadow-sm flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>שמירה כ־PDF דרך הדפדפן</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              aria-label="סגור חלון"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Configuration Strip (Screen only) */}
        <div className="no-print px-6 py-3 bg-[#F8FAFC] border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex-1 min-w-[280px]">
            <label htmlFor="doc-title-input" className="font-semibold text-slate-700 block mb-1">
              כותרת המסמך:
            </label>
            <input
              id="doc-title-input"
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="w-full px-3 py-1.5 bg-white rounded-lg border border-slate-300 text-sm font-medium focus:ring-[#536BD9]"
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={includePersonalData}
                onChange={(e) => setIncludePersonalData(e.target.checked)}
                className="w-4 h-4 rounded text-[#536BD9] focus:ring-[#536BD9]"
              />
              <span>כלול דירוגים והערות אישיות (ברירת מחדל: כבוי)</span>
            </label>

            <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 text-xs font-medium ${
                  activeTab === 'preview' ? 'bg-[#536BD9] text-white' : 'text-slate-600'
                }`}
              >
                תצוגה מקדימה
              </button>
              <button
                onClick={() => setActiveTab('order')}
                className={`px-3 py-1 text-xs font-medium ${
                  activeTab === 'order' ? 'bg-[#536BD9] text-white' : 'text-slate-600'
                }`}
              >
                סדר פריטים ({orderedItems.length})
              </button>
            </div>
          </div>
        </div>

        {/* Instructions banner */}
        <div className="no-print mx-6 mt-4 p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-[#334BB8]">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>הנחיות להפקה:</strong> לחיצה על "שמירה כ־PDF דרך הדפדפן" תפתח את חלונית ההדפסה של
            הדפדפן. ביעד ההדפסה (Destination) יש לבחור <strong>"שמור כ-PDF" (Save as PDF)</strong>.
            המסמך מותאם לגודל A4, עברית וקישורים פעילים.
          </span>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1">
          {activeTab === 'order' ? (
            /* Item Reordering Tab (Up/Down buttons per spec) */
            <div className="space-y-2 max-w-2xl mx-auto">
              <h3 className="text-sm font-bold text-slate-700 mb-3">
                שינוי סדר הופעת הפריטים במסמך (למעלה / למטה):
              </h3>
              {orderedItems.map((it, idx) => (
                <div
                  key={it.id}
                  className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-sm text-[#17243A] line-clamp-1">
                      {it.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => moveItem(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                      title="העבר למעלה"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveItem(idx, 'down')}
                      disabled={idx === orderedItems.length - 1}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                      title="העבר למטה"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onRemoveItemFromSelection(it.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 mr-1"
                      title="הסר מהבחירה"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* High-fidelity Printable Document Preview */
            <div
              id="printable-document-content"
              className="print-document max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-2xl border border-slate-200/80 shadow-xs space-y-8"
            >
              {/* Document Header */}
              <div className="border-b-2 border-slate-900 pb-6 mb-8">
                <h1 className="text-3xl font-extrabold text-[#17243A] mb-2 leading-tight">
                  {docTitle}
                </h1>
                <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                  <span>ספריית השראה — פדגוגיה, טכנולוגיה ומייקינג</span>
                  <span>מועד הפקה: {formatDateTimeHebrew(generationDate)}</span>
                  <span>מספר פריטים: {orderedItems.length}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-8">
                {orderedItems.map((item, index) => (
                  <div key={item.id} className="print-item space-y-3 pb-8 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                        #{index + 1}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-0.5 bg-indigo-50 text-[#334BB8] rounded">
                        {item.content_type}
                      </span>
                      <span className="text-xs text-slate-500">
                        {item.source_name} | {formatDateHebrew(item.event_date || item.published_date)}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-[#17243A] leading-snug">
                      {item.title}
                    </h2>

                    <p className="text-sm leading-relaxed text-[#17243A]">
                      {item.summary}
                    </p>

                    <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                      <strong>רלוונטיות: </strong> {item.relevance}
                    </div>

                    {/* Details if present */}
                    {item.details && (item.details.participant_actions || item.details.pedagogical_rationale) && (
                      <div className="text-xs space-y-1.5 bg-white p-3 rounded-lg border border-slate-200">
                        {item.details.participant_actions && (
                          <p>
                            <strong>מה המשתתפים עושים: </strong>
                            {item.details.participant_actions}
                          </p>
                        )}
                        {item.details.pedagogical_rationale && (
                          <p>
                            <strong>היגיון פדגוגי ({item.details.rationale_basis === 'inferred' ? 'פרשנות על בסיס המקור' : 'מופיע בתיאור המקור'}): </strong>
                            {item.details.pedagogical_rationale}
                          </p>
                        )}
                        {item.details.practical_takeaway && (
                          <p>
                            <strong>מה אפשר ללמוד: </strong>
                            {item.details.practical_takeaway}
                          </p>
                        )}
                      </div>
                    )}

                    {/* College Program Matches */}
                    {item.program_matches && item.program_matches.length > 0 && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                        <strong className="text-slate-900 block">
                          התאמה לתוכניות לימוד בסמינר הקיבוצים (התאמה מוצעת על בסיס המקורות):
                        </strong>
                        {item.program_matches.map((pm, pIdx) => (
                          <div key={pIdx} className="mr-2 space-y-0.5">
                            <span className="font-semibold text-[#17243A]">
                              • {pm.name} ({pm.level}):
                            </span>{' '}
                            <span>{pm.reason}</span>
                            <span className="block text-slate-500">
                              רעיון לסדנה: {pm.workshop_idea}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Caveat */}
                    {item.caveat && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                        <strong>הסתייגות: </strong> {item.caveat}
                      </div>
                    )}

                    {/* Optional Personal Notes & Ratings if explicitly enabled */}
                    {includePersonalData && item.user_state && (
                      <div className="p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-lg text-xs text-slate-800 space-y-1">
                        <div className="flex items-center gap-2">
                          <strong>דירוג אישי: </strong>
                          <span>{item.user_state.rating ? `${item.user_state.rating} / 5 כוכבים` : 'ללא דירוג'}</span>
                          <span className="mr-4"><strong>סטטוס: </strong>{item.user_state.status}</span>
                        </div>
                        {item.user_state.personal_note && (
                          <p><strong>הערה אישית: </strong>{item.user_state.personal_note}</p>
                        )}
                      </div>
                    )}

                    {/* Source link for digital and paper readers */}
                    <div className="text-xs pt-1">
                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="print-url text-[#536BD9] font-medium underline"
                        dir="ltr"
                      >
                        {item.source_url}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

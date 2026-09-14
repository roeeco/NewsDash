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
  Loader2,
  Check,
} from 'lucide-react';
import type { LibraryItem } from '../types.ts';
import { formatDateHebrew, formatDateTimeHebrew } from '../lib/dateUtils.ts';
import { getContentTypeMeta } from '../lib/contentTypes.ts';
// @ts-ignore
import html2pdf from 'html2pdf.js';

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
  const [includeCurriculumAlignment, setIncludeCurriculumAlignment] = useState(true);
  const [includePersonalData, setIncludePersonalData] = useState(false);
  const [orderedItems, setOrderedItems] = useState<LibraryItem[]>(selectedItems);
  const [activeTab, setActiveTab] = useState<'preview' | 'order'>('preview');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);
  const [pdfErrorMessage, setPdfErrorMessage] = useState<string | null>(null);

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

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      setPdfErrorMessage(null);
      setPdfSuccessMessage(null);

      // If active tab is 'order', switch to 'preview' so the element is rendered in DOM
      if (activeTab !== 'preview') {
        setActiveTab('preview');
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      const printDoc = document.getElementById('printable-document-content');
      if (!printDoc) {
        throw new Error('מסמך התצוגה המקדימה לא נמצא');
      }

      const safeFilename = `${docTitle.trim().replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, '_') || 'inspiration_library'}.pdf`;

      const opt = {
        margin: [10, 10, 12, 10], // top, left, bottom, right in mm
        filename: safeFilename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          scrollY: 0,
          backgroundColor: '#FFFFFF',
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
        },
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy'],
          avoid: ['.print-item'],
        },
      };

      const exporter = typeof html2pdf === 'function' ? html2pdf : (html2pdf as any).default;
      await exporter().set(opt).from(printDoc).save();

      setPdfSuccessMessage(`קובץ ה־PDF (${safeFilename}) נוצר והורד בהצלחה למחשב שלך!`);
      setTimeout(() => setPdfSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('PDF export failed:', err);
      setPdfErrorMessage(
        'אירעה שגיאה בעת הפקת ה־PDF. ניתן לנסות שנית או להשתמש באפשרות "הדפסה / שמירה דרך הדפדפן".'
      );
    } finally {
      setIsGeneratingPdf(false);
    }
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
  const itemsWithProgramsCount = orderedItems.filter(
    (it) => it.program_matches && it.program_matches.length > 0
  ).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-[#14181F]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 font-sans-hebrew"
    >
      <div className="relative w-full max-w-5xl bg-[#FAF8F5] paper-sheet rounded-2xl shadow-2xl border border-[#DDD6CB] overflow-hidden my-6 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Top Control Bar (Screen only, hidden in print) */}
        <div className="no-print sticky top-0 z-20 px-6 py-4 bg-[#FAF8F5]/95 border-b border-[#DDD6CB] backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 id="pdf-modal-title" className="text-xl font-bold font-serif-hebrew text-[#14181F]">
              ייצוא מסמך קריאה ו־PDF
            </h2>
            <p className="text-xs text-[#556070]">
              הפקת מסמך מעוצב והורדת קובץ PDF עבור {orderedItems.length} פריטים נבחרים
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Primary Action Button: Direct PDF Generation and Download */}
            <button
              id="pdf-btn-download-pdf"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#1C2024] hover:bg-[#2D3540] disabled:bg-[#556070] text-white shadow-xs border border-[#14181F] flex items-center gap-2 transition-all active:translate-y-px cursor-pointer disabled:cursor-wait"
              title="הפקת קובץ PDF והורדתו ישירות למחשב"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#F2D8C2]" />
                  <span>מייצר ומוריד PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-[#F2D8C2]" />
                  <span>הורדת קובץ PDF</span>
                </>
              )}
            </button>

            {/* Secondary Action: Browser print dialog */}
            <button
              id="pdf-btn-print"
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-[#FAF8F5] text-[#14181F] border border-[#DDD6CB] shadow-2xs flex items-center gap-1.5 transition-all active:translate-y-px cursor-pointer"
              title="הדפסה או שמירה דרך דיאלוג ההדפסה של הדפדפן"
            >
              <Printer className="w-3.5 h-3.5 text-[#556070]" />
              <span className="hidden sm:inline">הדפסה / שמירה בדפדפן</span>
            </button>

            {/* Secondary Action: Download HTML */}
            <button
              id="pdf-btn-download-html"
              onClick={handleDownloadHtml}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-[#FAF8F5] text-[#14181F] border border-[#DDD6CB] shadow-2xs flex items-center gap-1.5 transition-all active:translate-y-px cursor-pointer"
              title="הורדת מסמך כקובץ HTML עצמאי"
            >
              <FileText className="w-3.5 h-3.5 text-[#556070]" />
              <span className="hidden md:inline">הורדת HTML</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#7E8896] hover:text-[#14181F] hover:bg-[#EAE5DC] transition-colors cursor-pointer mr-1"
              aria-label="סגור חלון"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications / Alerts */}
        {pdfSuccessMessage && (
          <div className="no-print mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{pdfSuccessMessage}</span>
            </div>
            <button
              onClick={() => setPdfSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
            >
              סגור
            </button>
          </div>
        )}

        {pdfErrorMessage && (
          <div className="no-print mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-900 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{pdfErrorMessage}</span>
            </div>
            <button
              onClick={() => setPdfErrorMessage(null)}
              className="text-red-700 hover:text-red-900 text-xs font-bold"
            >
              סגור
            </button>
          </div>
        )}

        {/* Configuration Strip (Screen only) */}
        <div className="no-print px-6 py-3 bg-[#F0EDE6] border-b border-[#DDD6CB] flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex-1 min-w-[280px]">
            <label htmlFor="doc-title-input" className="font-bold text-[#14181F] block mb-1">
              כותרת המסמך:
            </label>
            <input
              id="doc-title-input"
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#DDD6CB] text-[#14181F] text-sm font-medium focus:bg-white focus:border-[#1C2024] focus:ring-1 focus:ring-[#1C2024]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {/* Toggle: Include/Exclude Curriculum Alignment ("התאמה לתוכניות") */}
            <label
              id="toggle-curriculum-alignment-label"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-pointer select-none ${
                includeCurriculumAlignment
                  ? 'bg-white border-[#DDD6CB] text-[#14181F] shadow-2xs'
                  : 'bg-[#EAE5DC]/60 border-[#D9D2C5] text-[#7E8896]'
              }`}
              title="סמן כדי לכלול את שדה ההתאמה לתוכניות לימודים בסמינר הקיבוצים, או בטל סימון כדי להשמיטו מהייצוא"
            >
              <input
                id="toggle-curriculum-alignment"
                type="checkbox"
                checked={includeCurriculumAlignment}
                onChange={(e) => setIncludeCurriculumAlignment(e.target.checked)}
                className="w-4 h-4 rounded border-[#DDD6CB] text-[#1C2024] focus:ring-[#1C2024] cursor-pointer"
              />
              <div className="flex items-center gap-1.5">
                <GraduationCap className={`w-3.5 h-3.5 ${includeCurriculumAlignment ? 'text-[#8F4824]' : 'text-[#8E97A4]'}`} />
                <span className="font-semibold text-xs">
                  התאמה לתוכניות
                </span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  includeCurriculumAlignment ? 'bg-[#FAF8F5] text-[#556070] border border-[#DDD6CB]' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {includeCurriculumAlignment ? 'כלול' : 'מושמט מהייצוא'}
                </span>
              </div>
            </label>

            {/* Toggle: Include/Exclude Personal ratings & notes */}
            <label
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-pointer select-none ${
                includePersonalData
                  ? 'bg-white border-[#DDD6CB] text-[#14181F] shadow-2xs'
                  : 'bg-[#EAE5DC]/60 border-[#D9D2C5] text-[#7E8896]'
              }`}
            >
              <input
                type="checkbox"
                checked={includePersonalData}
                onChange={(e) => setIncludePersonalData(e.target.checked)}
                className="w-4 h-4 rounded border-[#DDD6CB] text-[#1C2024] focus:ring-[#1C2024] cursor-pointer"
              />
              <span className="font-semibold text-xs">
                דירוגים והערות אישיות
              </span>
            </label>

            {/* Tab view switcher */}
            <div className="flex rounded-lg border border-[#DDD6CB] overflow-hidden bg-[#FAF8F5] p-0.5">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  activeTab === 'preview' ? 'bg-[#1C2024] text-white shadow-2xs' : 'text-[#556070] hover:text-[#14181F]'
                }`}
              >
                תצוגה מקדימה
              </button>
              <button
                onClick={() => setActiveTab('order')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  activeTab === 'order' ? 'bg-[#1C2024] text-white shadow-2xs' : 'text-[#556070] hover:text-[#14181F]'
                }`}
              >
                סדר פריטים ({orderedItems.length})
              </button>
            </div>
          </div>
        </div>

        {/* Informational Guidance Banner */}
        <div className="no-print mx-6 mt-3 p-3 bg-[#FDF9F0] border border-[#E8DCC4] rounded-xl flex items-center justify-between gap-3 text-xs text-[#78350F]">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 shrink-0 text-[#8F4824]" />
            <span>
              <strong>אפשרויות ייצוא:</strong> לחיצה על <strong>"הורדת קובץ PDF"</strong> מפיקה ישירות קובץ PDF מעוצב.
              {!includeCurriculumAlignment && (
                <span className="mr-1 text-[#8F4824] font-semibold">
                  (שימו לב: שדה ההתאמה לתוכניות לימודים לא ייכלל בקובץ שיופק).
                </span>
              )}
            </span>
          </div>

          {!includeCurriculumAlignment && (
            <button
              onClick={() => setIncludeCurriculumAlignment(true)}
              className="text-[#8F4824] hover:underline font-semibold shrink-0 cursor-pointer"
            >
              החזר שדה התאמה
            </button>
          )}
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1">
          {activeTab === 'order' ? (
            /* Item Reordering Tab (Up/Down buttons per spec) */
            <div className="space-y-2 max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold font-serif-hebrew text-[#14181F]">
                  שינוי סדר הופעת הפריטים במסמך (למעלה / למטה):
                </h3>
                <span className="text-xs text-[#556070]">
                  סה"כ {orderedItems.length} פריטים
                </span>
              </div>

              {orderedItems.map((it, idx) => {
                const typeMeta = getContentTypeMeta(it.content_type);
                return (
                  <div
                    key={it.id}
                    className="p-3 bg-white border border-[#DDD6CB] rounded-xl flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-md bg-[#F0EDE6] text-[#14181F] flex items-center justify-center text-xs font-bold font-mono shrink-0">
                        {idx + 1}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${typeMeta.badgeClass} shrink-0`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${typeMeta.dotClass}`} />
                        {typeMeta.label}
                      </span>
                      <span className="font-semibold text-sm text-[#14181F] line-clamp-1">
                        {it.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => moveItem(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg border border-[#DDD6CB] text-[#556070] hover:bg-[#F0EDE6] hover:text-[#14181F] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                        title="העבר למעלה"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveItem(idx, 'down')}
                        disabled={idx === orderedItems.length - 1}
                        className="p-1.5 rounded-lg border border-[#DDD6CB] text-[#556070] hover:bg-[#F0EDE6] hover:text-[#14181F] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                        title="העבר למטה"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onRemoveItemFromSelection(it.id)}
                        className="p-1.5 rounded-lg text-[#7E8896] hover:text-red-700 hover:bg-red-50 mr-1 cursor-pointer"
                        title="הסר מהבחירה"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* High-fidelity Printable Document Preview */
            <div
              id="printable-document-content"
              dir="rtl"
              className="print-document max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-2xl border border-[#DDD6CB] shadow-xs space-y-8 font-sans-hebrew"
            >
              {/* Document Header */}
              <div className="border-b-2 border-[#14181F] pb-6 mb-8">
                <h1 className="text-3xl font-extrabold font-serif-hebrew text-[#14181F] mb-2 leading-tight">
                  {docTitle}
                </h1>
                <div className="flex flex-wrap items-center justify-between text-xs text-[#556070] gap-2 font-mono">
                  <span>ספריית השראה — פדגוגיה, טכנולוגיה ומייקינג</span>
                  <span>מועד הפקה: {formatDateTimeHebrew(generationDate)}</span>
                  <span>מספר פריטים: {orderedItems.length}</span>
                  <span>
                    {includeCurriculumAlignment
                      ? 'כולל התאמה לתוכניות לימודים'
                      : 'ללא שדה התאמה לתוכניות'}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-8">
                {orderedItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="print-item space-y-3 pb-8 border-b border-[#DDD6CB]"
                    style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-2 py-0.5 bg-[#F0EDE6] text-[#14181F] rounded border border-[#DDD6CB] font-mono">
                        #{index + 1}
                      </span>
                      {(() => {
                        const typeMeta = getContentTypeMeta(item.content_type);
                        return (
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border shadow-2xs inline-flex items-center gap-1.5 ${typeMeta.badgeClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${typeMeta.dotClass}`} />
                            {typeMeta.label}
                          </span>
                        );
                      })()}
                      <span className="text-xs text-[#556070]">
                        {item.source_name} | {formatDateHebrew(item.event_date || item.published_date)}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold font-serif-hebrew text-[#14181F] leading-snug">
                      {item.title}
                    </h2>

                    <p className="text-sm leading-relaxed text-[#14181F]">
                      {item.summary}
                    </p>

                    <div className="text-xs text-[#14181F] bg-[#FAF8F5] p-3 rounded-lg border border-[#DDD6CB]">
                      <strong>רלוונטיות: </strong> {item.relevance}
                    </div>

                    {/* Details if present */}
                    {item.details && (item.details.participant_actions || item.details.pedagogical_rationale) && (
                      <div className="text-xs space-y-1.5 bg-[#FAF8F5] p-3 rounded-lg border border-[#DDD6CB]">
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

                    {/* College Program Matches - rendered ONLY when includeCurriculumAlignment is true */}
                    {includeCurriculumAlignment && item.program_matches && item.program_matches.length > 0 && (
                      <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#DDD6CB] text-xs space-y-2">
                        <div className="flex items-center gap-1.5 font-bold font-serif-hebrew text-[#14181F]">
                          <GraduationCap className="w-4 h-4 text-[#8F4824] shrink-0" />
                          <span>התאמה לתוכניות לימוד בסמינר הקיבוצים (התאמה מוצעת על בסיס המקורות):</span>
                        </div>
                        {item.program_matches.map((pm, pIdx) => (
                          <div key={pIdx} className="mr-5 space-y-0.5 border-r-2 border-[#8F4824]/30 pr-2.5">
                            <span className="font-bold text-[#14181F]">
                              • {pm.name} ({pm.level}):
                            </span>{' '}
                            <span className="text-[#2D3540]">{pm.reason}</span>
                            <span className="block text-[#556070] text-[11px]">
                              רעיון לסדנה: {pm.workshop_idea}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Caveat */}
                    {item.caveat && (
                      <div className="p-2.5 bg-[#FDF9F0] border-r-4 border-r-[#8F4824] border border-[#E8DCC4] rounded-lg text-xs text-[#78350F]">
                        <strong>הסתייגות: </strong> {item.caveat}
                      </div>
                    )}

                    {/* Optional Personal Notes & Ratings if explicitly enabled */}
                    {includePersonalData && item.user_state && (
                      <div className="p-2.5 bg-[#F0EDE6] border border-[#DDD6CB] rounded-lg text-xs text-[#14181F] space-y-1">
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
                        className="print-url text-[#14181F] font-medium underline"
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


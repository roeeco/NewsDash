import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Star,
  Calendar,
  AlertCircle,
  GraduationCap,
  FileText,
  Edit3,
  Save,
  Tag,
  BookOpen,
  Info,
  CheckCircle2,
} from 'lucide-react';
import type { LibraryItem, UserStatus } from '../types.ts';
import { formatDateHebrew } from '../lib/dateUtils.ts';

interface ItemDetailModalProps {
  item: LibraryItem | null;
  onClose: () => void;
  onUpdateRating: (id: string, rating: 1 | 2 | 3 | 4 | 5 | null) => void;
  onUpdateStatus: (id: string, status: UserStatus) => void;
  onUpdateNote: (id: string, note: string) => Promise<void>;
  onSaveContentEdit: (id: string, editedContent: Partial<LibraryItem>) => Promise<void>;
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  workshop: 'סדנה',
  webinar: 'וובינר',
  research: 'מחקר',
  article: 'מאמר',
  tool: 'כלי',
  product_update: 'עדכון מוצר',
  case_study: 'מקרה בוחן',
  teaching_resource: 'משאב הוראה',
  program_update: 'עדכון תוכנית לימודים',
};

const CHANNEL_LABELS: Record<string, string> = {
  workshops: 'סדנאות למורים',
  education_ai: 'חינוך ובינה מלאכותית',
  builder_updates: 'עדכוני כלי בנייה',
  college_programs: 'תוכניות לימוד',
};

const NOVELTY_LABELS: Record<string, { label: string; desc: string }> = {
  newly_published: { label: 'פורסם לאחרונה', desc: 'תוכן חדש שפורסם בסמוך למועד התדריך' },
  newly_discovered: { label: 'התגלה בסקירה', desc: 'תוכן קיים שהתגלה בסקירת הסוכן (לא בהכרח פורסם לאחרונה)' },
  material_update: { label: 'עדכון מהותי', desc: 'שינוי מהותי בתוכן קיים' },
};

const STATUS_OPTIONS: Array<{ value: UserStatus; label: string }> = [
  { value: 'new', label: 'חדש' },
  { value: 'to_read', label: 'לקריאה' },
  { value: 'saved', label: 'נשמר' },
  { value: 'tried', label: 'נוסה' },
  { value: 'archived', label: 'ארכיון' },
];

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  onClose,
  onUpdateRating,
  onUpdateStatus,
  onUpdateNote,
  onSaveContentEdit,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteSaveStatus, setNoteSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editRelevance, setEditRelevance] = useState('');
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [imageError, setImageError] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const noteDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (item) {
      setNoteText(item.user_state?.personal_note || '');
      setEditTitle(item.title);
      setEditSummary(item.summary);
      setEditRelevance(item.relevance);
      setIsEditingContent(false);
      setImageError(false);
    }
  }, [item]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  const currentRating = item.user_state?.rating ?? null;
  const currentStatus = item.user_state?.status || 'new';

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNoteText(val);
    setNoteSaveStatus('saving');

    if (noteDebounceTimer.current) {
      clearTimeout(noteDebounceTimer.current);
    }

    noteDebounceTimer.current = setTimeout(async () => {
      try {
        await onUpdateNote(item.id, val);
        setNoteSaveStatus('saved');
        setTimeout(() => setNoteSaveStatus('idle'), 2500);
      } catch (err) {
        setNoteSaveStatus('error');
      }
    }, 800);
  };

  const handleSaveManualContent = async () => {
    setIsSavingContent(true);
    try {
      await onSaveContentEdit(item.id, {
        title: editTitle,
        summary: editSummary,
        relevance: editRelevance,
      });
      setIsEditingContent(false);
    } catch (err) {
      alert('שגיאה בשמירת עריכת התוכן');
    } finally {
      setIsSavingContent(false);
    }
  };

  const noveltyInfo = NOVELTY_LABELS[item.novelty] || { label: item.novelty, desc: '' };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-[#17243A]/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Sticky Modal Header */}
        <div className="sticky top-0 z-20 px-6 py-4 bg-white/95 border-b border-slate-200 backdrop-blur-md flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-[#DDE4FF] text-[#334BB8]">
              {CONTENT_TYPE_LABELS[item.content_type] || item.content_type}
            </span>
            <span
              className="px-2.5 py-1 rounded-xl text-xs font-medium bg-[#DCF2E9] text-[#136142]"
              title={noveltyInfo.desc}
            >
              {noveltyInfo.label}
            </span>
            {item.channels &&
              item.channels.map((ch) => (
                <span
                  key={ch}
                  className="px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-100 text-slate-700"
                >
                  {CHANNEL_LABELS[ch] || ch}
                </span>
              ))}
          </div>

          <button
            id="modal-btn-close"
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-500 hover:text-[#17243A] hover:bg-slate-100 transition-colors focus:ring-2 focus:ring-[#536BD9]"
            aria-label="סגור חלונית (Escape)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-[#17243A]">
          {/* Title & Edit mode */}
          <div>
            {isEditingContent ? (
              <div className="space-y-3 p-4 rounded-2xl bg-amber-50/50 border border-amber-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-900">
                    עריכת תוכן ידנית (עריכה זו תישמר ולא תידרס בייבוא עתידי)
                  </span>
                </div>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-xl font-bold p-3 rounded-xl border border-slate-300 focus:ring-[#536BD9]"
                  placeholder="כותרת הפריט"
                />
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <h1 id="modal-title" className="text-2xl sm:text-3xl font-bold leading-tight text-[#17243A]">
                  {item.title}
                </h1>
                <button
                  onClick={() => setIsEditingContent(true)}
                  className="p-2 rounded-xl text-slate-400 hover:text-[#536BD9] hover:bg-slate-50 transition-colors shrink-0"
                  title="ערוך תוכן ידנית"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Metadata bar: Dates & Source */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-[#4A5568]">
              <div className="flex items-center gap-1.5 font-medium">
                <span>מקור:</span>
                <span className="text-[#17243A] font-semibold">{item.source_name}</span>
              </div>

              {item.published_date && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#536BD9]" />
                  <span>פורסם: {formatDateHebrew(item.published_date)}</span>
                </div>
              )}

              {item.event_date && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EEF2FF] text-[#334BB8] font-semibold">
                  <Calendar className="w-4 h-4" />
                  <span>מועד אירוע: {formatDateHebrew(item.event_date)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Primary Action Buttons: Open source & Copy URL */}
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <a
              id="modal-open-source"
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#536BD9] text-white hover:bg-[#4357c2] shadow-sm transition-colors"
            >
              <span>מעבר למקור המלא ({item.source_name})</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={() => handleCopyUrl(item.source_url)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium bg-white hover:bg-slate-100 text-[#17243A] border border-slate-300 transition-colors"
            >
              {copiedUrl ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">הכתובת הועתקה!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>העתקת כתובת מקור</span>
                </>
              )}
            </button>

            <span className="text-xs text-slate-400 mr-auto font-mono truncate max-w-xs" dir="ltr">
              {item.source_url}
            </span>
          </div>

          {/* Image if available */}
          {item.image && !imageError && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
              <img
                src={item.image.url}
                alt={item.image.alt || item.title}
                onError={() => setImageError(true)}
                referrerPolicy="no-referrer"
                className="w-full max-h-80 object-cover"
              />
              {item.image.usage_note && (
                <div className="p-3 bg-white/90 text-xs text-slate-600 border-t border-slate-100 flex items-center justify-between">
                  <span>{item.image.usage_note}</span>
                  {item.image.source_url && (
                    <a
                      href={item.image.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#536BD9] underline"
                    >
                      מקור התמונה
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Caveat Banner (Never hidden if present) */}
          {item.caveat && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm mb-0.5">הסתייגות ושימת לב:</h3>
                <p className="text-sm leading-relaxed">{item.caveat}</p>
              </div>
            </div>
          )}

          {/* Summary & Relevance */}
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">
                תקציר
              </h2>
              {isEditingContent ? (
                <textarea
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  rows={4}
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-[#536BD9] text-base leading-relaxed"
                />
              ) : (
                <p className="text-base sm:text-lg leading-relaxed text-[#17243A] bg-[#F8FAFC] p-4 rounded-2xl border border-slate-200/70">
                  {item.summary}
                </p>
              )}
            </div>

            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">
                למה זה מעניין / רלוונטיות
              </h2>
              {isEditingContent ? (
                <textarea
                  value={editRelevance}
                  onChange={(e) => setEditRelevance(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-[#536BD9] text-base leading-relaxed"
                />
              ) : (
                <p className="text-base leading-relaxed text-[#17243A] bg-[#F8FAFC] p-4 rounded-2xl border border-slate-200/70">
                  {item.relevance}
                </p>
              )}
            </div>

            {isEditingContent && (
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSaveManualContent}
                  disabled={isSavingContent}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#536BD9] text-white hover:bg-[#4357c2] flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>שמור שינויים</span>
                </button>
                <button
                  onClick={() => setIsEditingContent(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  ביטול
                </button>
              </div>
            )}
          </div>

          {/* Subjects */}
          {item.subjects && item.subjects.length > 0 && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">
                נושאים ותגיות
              </h2>
              <div className="flex flex-wrap gap-2">
                {item.subjects.map((sub) => (
                  <span
                    key={sub}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium bg-white border border-slate-200 text-[#17243A] shadow-xs"
                  >
                    <Tag className="w-3.5 h-3.5 text-[#536BD9]" />
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Experiential Details (Details Section - Hide empty fields!) */}
          {item.details && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-[#17243A] flex items-center gap-2 border-b pb-2">
                <BookOpen className="w-4 h-4 text-[#536BD9]" />
                <span>פרטי התנסות ופדגוגיה</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {item.details.audience && (
                  <div>
                    <span className="font-semibold text-slate-500 block text-xs">קהל יעד:</span>
                    <p className="mt-0.5 text-[#17243A]">{item.details.audience}</p>
                  </div>
                )}

                {item.details.participant_actions && (
                  <div>
                    <span className="font-semibold text-slate-500 block text-xs">מה המשתתפים עושים:</span>
                    <p className="mt-0.5 text-[#17243A]">{item.details.participant_actions}</p>
                  </div>
                )}

                {item.details.pedagogical_rationale && (
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-500 text-xs">היגיון פדגוגי:</span>
                      {item.details.rationale_basis && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-indigo-50 text-[#536BD9]">
                          {item.details.rationale_basis === 'inferred'
                            ? 'פרשנות על בסיס המקור'
                            : 'מופיע בתיאור המקור'}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[#17243A]">{item.details.pedagogical_rationale}</p>
                  </div>
                )}

                {item.details.practical_takeaway && (
                  <div className="md:col-span-2">
                    <span className="font-semibold text-slate-500 block text-xs">מה אפשר ללמוד / לקחת:</span>
                    <p className="mt-0.5 text-[#17243A]">{item.details.practical_takeaway}</p>
                  </div>
                )}

                {item.details.access_notes && (
                  <div className="md:col-span-2">
                    <span className="font-semibold text-slate-500 block text-xs">הערות גישה ועלויות:</span>
                    <p className="mt-0.5 text-[#17243A]">{item.details.access_notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* College Program Matches Section */}
          {item.program_matches && item.program_matches.length > 0 && (
            <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#DDE4FF] space-y-4">
              <div>
                <h2 className="text-base font-bold text-[#17243A] flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#536BD9]" />
                  <span>התאמה לתוכניות הלימוד</span>
                </h2>
                <p className="text-xs text-[#526078] mt-0.5">
                  התאמה מוצעת על בסיס המקורות — לא המלצה רשמית של המכללה
                </p>
              </div>

              <div className="space-y-3">
                {item.program_matches.map((match, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#17243A]">{match.name}</span>
                        <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800">
                          {match.level}
                        </span>
                      </div>
                      <a
                        href={match.program_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#536BD9] hover:underline"
                      >
                        <span>דף תוכנית בסמינר</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <p className="text-sm text-slate-700">
                      <strong className="text-slate-900">נימוק התאמה: </strong>
                      {match.reason}
                    </p>

                    <div className="p-2.5 rounded-lg bg-indigo-50/70 text-xs text-[#334BB8]">
                      <strong>רעיון לסדנה / יישום: </strong>
                      {match.workshop_idea}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Program Change (if program update) */}
          {item.program_change && (
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
              <h3 className="font-bold text-sm text-amber-900">עדכון בתוכנית לימודים:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="font-semibold block text-slate-500">סוג שינוי:</span>
                  <span>{item.program_change.kind}</span>
                </div>
                <div>
                  <span className="font-semibold block text-slate-500">מצב קודם:</span>
                  <span>{item.program_change.previous}</span>
                </div>
                <div>
                  <span className="font-semibold block text-slate-500">מצב נוכחי:</span>
                  <span>{item.program_change.current}</span>
                </div>
                <div className="sm:col-span-3">
                  <span className="font-semibold block text-slate-500">בסיס ההשוואה:</span>
                  <span>{item.program_change.comparison_basis}</span>
                </div>
              </div>
            </div>
          )}

          {/* Citations & Sources list */}
          {item.sources && item.sources.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                אסמכתאות ומקורות תומכים
              </h2>
              <ul className="space-y-2">
                {item.sources.map((s, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <span className="text-[#17243A] font-medium">{s.supports}</span>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#536BD9] hover:underline shrink-0"
                      dir="ltr"
                    >
                      <span className="truncate max-w-xs">{s.url}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Personal User Section: Rating, Status, Personal Note (Stored separately) */}
          <div className="p-5 rounded-2xl bg-[#EEF2FF]/60 border border-[#DDE4FF] space-y-4">
            <h2 className="text-base font-bold text-[#17243A] flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
              <span>המנהל האישי שלך — דירוג, סטטוס והערות</span>
            </h2>

            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Star Rating */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">דירוג:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() =>
                        onUpdateRating(
                          item.id,
                          currentRating === star ? null : (star as 1 | 2 | 3 | 4 | 5)
                        )
                      }
                      className="p-1 hover:scale-125 transition-transform"
                      aria-label={`דירוג ${star} כוכבים`}
                    >
                      <Star
                        className={`w-5 h-5 ${
                          currentRating && star <= currentRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300 hover:text-amber-300'
                        }`}
                      />
                    </button>
                  ))}
                  {currentRating && (
                    <button
                      onClick={() => onUpdateRating(item.id, null)}
                      className="text-xs text-slate-500 hover:text-slate-800 underline mr-2"
                    >
                      הסרת דירוג
                    </button>
                  )}
                </div>
              </div>

              {/* Status Picker */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">סטטוס:</span>
                <select
                  value={currentStatus}
                  onChange={(e) => onUpdateStatus(item.id, e.target.value as UserStatus)}
                  className="text-sm font-medium py-1.5 px-3 rounded-xl border border-slate-300 bg-white text-[#17243A]"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Personal Note Textarea with Autosave */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="personal-note" className="text-xs font-semibold text-slate-700">
                  הערה אישית (נשמרת אוטומטית):
                </label>
                {noteSaveStatus === 'saving' && (
                  <span className="text-xs text-[#536BD9] animate-pulse">שומר...</span>
                )}
                {noteSaveStatus === 'saved' && (
                  <span className="text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    נשמר בהצלחה
                  </span>
                )}
                {noteSaveStatus === 'error' && (
                  <span className="text-xs text-red-600">שגיאה בשמירה</span>
                )}
              </div>
              <textarea
                id="personal-note"
                value={noteText}
                onChange={handleNoteChange}
                rows={3}
                placeholder="כתבו הערות, רעיונות ליישום, מחשבות אישיות..."
                className="w-full p-3 rounded-xl border border-slate-300 bg-white text-sm focus:ring-[#536BD9] focus:border-[#536BD9]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

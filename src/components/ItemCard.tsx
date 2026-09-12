import React from 'react';
import {
  ExternalLink,
  Star,
  Calendar,
  Layers,
  GraduationCap,
  MessageSquare,
  AlertCircle,
  Tag,
} from 'lucide-react';
import type { LibraryItem, UserStatus } from '../types.ts';
import { formatDateHebrew } from '../lib/dateUtils.ts';

interface ItemCardProps {
  item: LibraryItem;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onOpenDetails: (item: LibraryItem) => void;
  onUpdateRating: (id: string, rating: 1 | 2 | 3 | 4 | 5 | null) => void;
  onUpdateStatus: (id: string, status: UserStatus) => void;
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
  education_ai: 'חינוך ו-AI',
  builder_updates: 'כלי בנייה',
  college_programs: 'תוכניות לימוד',
};

const STATUS_OPTIONS: Array<{ value: UserStatus; label: string; color: string }> = [
  { value: 'new', label: 'חדש', color: 'bg-slate-100 text-slate-700' },
  { value: 'to_read', label: 'לקריאה', color: 'bg-amber-100 text-amber-800' },
  { value: 'saved', label: 'נשמר', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'tried', label: 'נוסה', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'archived', label: 'ארכיון', color: 'bg-zinc-200 text-zinc-600' },
];

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  isSelected,
  onToggleSelect,
  onOpenDetails,
  onUpdateRating,
  onUpdateStatus,
}) => {
  const currentRating = item.user_state?.rating ?? null;
  const currentStatus = item.user_state?.status || 'new';

  return (
    <article
      id={`item-card-${item.id}`}
      className={`glass-card p-5 sm:p-6 transition-all relative flex flex-col justify-between ${
        isSelected ? 'ring-2 ring-[#536BD9] bg-white/95' : 'hover:bg-white/95'
      }`}
    >
      <div>
        {/* Header Row: Checkbox, Badges, Dates */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id={`select-item-${item.id}`}
              checked={isSelected}
              onChange={() => onToggleSelect(item.id)}
              className="w-5 h-5 rounded-md border-slate-300 text-[#536BD9] focus:ring-[#536BD9] cursor-pointer"
              aria-label={`בחר פריט ${item.title} לייצוא`}
            />

            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#DDE4FF] text-[#334BB8]">
              {CONTENT_TYPE_LABELS[item.content_type] || item.content_type}
            </span>

            {item.channels && item.channels.length > 0 && (
              <div className="hidden sm:flex items-center gap-1.5">
                {item.channels.map((ch) => (
                  <span
                    key={ch}
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#DCF2E9] text-[#136142]"
                  >
                    {CHANNEL_LABELS[ch] || ch}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-[#526078] shrink-0">
            {item.event_date ? (
              <span className="inline-flex items-center gap-1 font-medium text-[#536BD9] bg-[#EEF2FF] px-2 py-0.5 rounded-md">
                <Calendar className="w-3.5 h-3.5" />
                <span>מועד: {formatDateHebrew(item.event_date)}</span>
              </span>
            ) : item.published_date ? (
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDateHebrew(item.published_date)}</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Title */}
        <h2
          onClick={() => onOpenDetails(item)}
          className="text-lg sm:text-xl font-bold text-[#17243A] hover:text-[#536BD9] cursor-pointer leading-snug mb-2 transition-colors"
        >
          {item.title}
        </h2>

        {/* Short Summary */}
        <p className="text-sm text-[#4A5568] leading-relaxed line-clamp-3 mb-4">
          {item.summary}
        </p>

        {/* Subjects chips */}
        {item.subjects && item.subjects.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {item.subjects.map((sub) => (
              <span
                key={sub}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-white border border-slate-200 text-[#4A5568]"
              >
                <Tag className="w-3 h-3 text-[#536BD9]" />
                {sub}
              </span>
            ))}
          </div>
        )}

        {/* College Program Matches Badge */}
        {item.program_matches && item.program_matches.length > 0 && (
          <div className="mb-4 p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-[#17243A]">
              <GraduationCap className="w-4 h-4 text-[#536BD9] shrink-0" />
              <span className="font-medium line-clamp-1">
                התאמה: {item.program_matches.map((p) => p.name).join(', ')}
              </span>
            </div>
            <span className="text-[11px] text-[#526078] shrink-0 font-medium">
              ({item.program_matches.length})
            </span>
          </div>
        )}

        {/* Caveat banner if present */}
        {item.caveat && (
          <div className="mb-4 px-3 py-2 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2 text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="leading-tight">{item.caveat}</span>
          </div>
        )}
      </div>

      {/* Footer Row: Source Button (Prominently visible), Rating, Status */}
      <div className="pt-3.5 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-3">
        {/* Prominently visible Open Source link */}
        <div className="flex items-center gap-2">
          <a
            id={`open-source-${item.id}`}
            href={item.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-[#17243A] border border-slate-300 shadow-xs transition-colors"
            title={`פתיחת ${item.source_name} בלשונית חדשה`}
          >
            <span>{item.source_name || 'פתיחת מקור'}</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#536BD9]" />
          </a>

          <button
            id={`view-details-${item.id}`}
            onClick={() => onOpenDetails(item)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-[#536BD9] hover:bg-[#EEF2FF] transition-colors"
          >
            פרטים מלאים
          </button>
        </div>

        {/* Rating & User Status */}
        <div className="flex items-center gap-3">
          {/* Star Rating */}
          <div className="flex items-center gap-1" title={currentRating ? `${currentRating} כוכבים` : 'ללא דירוג'}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => onUpdateRating(item.id, currentRating === star ? null : (star as 1 | 2 | 3 | 4 | 5))}
                className="p-0.5 hover:scale-110 transition-transform focus:outline-none"
                aria-label={`דרג ${star} כוכבים`}
              >
                <Star
                  className={`w-4 h-4 ${
                    currentRating && star <= currentRating
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-slate-300 hover:text-amber-300'
                  }`}
                />
              </button>
            ))}
            {currentRating && (
              <button
                type="button"
                onClick={() => onUpdateRating(item.id, null)}
                className="text-[10px] text-slate-400 hover:text-slate-600 px-1"
                title="הסרת דירוג"
              >
                ×
              </button>
            )}
          </div>

          {/* User Status Selector */}
          <select
            id={`select-status-${item.id}`}
            value={currentStatus}
            onChange={(e) => onUpdateStatus(item.id, e.target.value as UserStatus)}
            className="text-xs font-medium py-1 px-2.5 rounded-lg border border-slate-300 bg-white text-[#17243A] cursor-pointer focus:ring-[#536BD9]"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {item.user_state?.personal_note && (
            <span
              className="p-1 text-[#536BD9]"
              title={`הערה אישית: ${item.user_state.personal_note.slice(0, 80)}...`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

import React from 'react';
import {
  ExternalLink,
  Star,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import type { LibraryItem, UserStatus } from '../types.ts';
import { formatDateHebrew } from '../lib/dateUtils.ts';
import { getContentTypeMeta } from '../lib/contentTypes.ts';

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

const STATUS_OPTIONS: Array<{ value: UserStatus; label: string; color: string }> = [
  { value: 'new', label: 'חדש', color: 'bg-[#F0ECE4] text-[#3D352E]' },
  { value: 'to_read', label: 'לקריאה', color: 'bg-[#FBF1E6] text-[#854D18]' },
  { value: 'saved', label: 'נשמר', color: 'bg-[#EEF4F0] text-[#1D5438]' },
  { value: 'tried', label: 'נוסה', color: 'bg-[#EBF0F7] text-[#244572]' },
  { value: 'archived', label: 'ארכיון', color: 'bg-[#ECEAE4] text-[#556070]' },
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
  const typeMeta = getContentTypeMeta(item.content_type);

  return (
    <article
      id={`item-card-${item.id}`}
      className={`relative flex flex-col justify-between p-6 sm:p-7 rounded-2xl transition-all duration-200 ${
        isSelected
          ? 'bg-white border-2 border-[#1C2024] shadow-[0_2px_8px_rgba(20,24,35,0.06),0_16px_36px_-6px_rgba(20,24,35,0.12)]'
          : 'bg-white border border-[#E5DFD5] border-t-white/95 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_12px_28px_-6px_rgba(20,24,35,0.08)] hover:border-[#D5CDBF] hover:shadow-[0_2px_6px_rgba(0,0,0,0.05),0_18px_36px_-6px_rgba(20,24,35,0.11)]'
      }`}
    >
      <div>
        {/* Top Metadata Row: Selection, Category Stamp, Date */}
        <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-[#F0ECE4]">
          <div className="flex items-center gap-2.5 flex-wrap">
            <input
              type="checkbox"
              id={`select-item-${item.id}`}
              checked={isSelected}
              onChange={() => onToggleSelect(item.id)}
              className="w-4 h-4 rounded border-[#D0C7B8] text-[#1C2024] focus:ring-[#1C2024] cursor-pointer"
              aria-label={`בחר פריט ${item.title} לייצוא`}
            />

            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold border shadow-2xs ${typeMeta.badgeClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${typeMeta.dotClass}`} aria-hidden="true" />
              {typeMeta.label}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#556070] shrink-0 font-sans-hebrew">
            {item.event_date ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-[#8F4824] bg-[#FBF1E8] px-2.5 py-0.5 rounded-md border border-[#F0DDCF]">
                <Calendar className="w-3.5 h-3.5" />
                <span>מועד: {formatDateHebrew(item.event_date)}</span>
              </span>
            ) : item.published_date ? (
              <span className="inline-flex items-center gap-1 text-[#6A7382]">
                <Calendar className="w-3.5 h-3.5 text-[#8F98A7]" />
                <span>{formatDateHebrew(item.published_date)}</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Title - Editorial Hebrew Serif with Scholarly Authority */}
        <h2
          onClick={() => onOpenDetails(item)}
          className="text-xl sm:text-2xl font-bold text-[#14181F] hover:text-[#2D3540] cursor-pointer leading-snug mb-3 tracking-tight font-serif-hebrew transition-colors"
        >
          {item.title}
        </h2>

        {/* Excerpt - Exhibition Catalog Pull-Quote Styling */}
        <p className="text-[14.5px] sm:text-[15px] text-[#3A4350] leading-relaxed line-clamp-3 mb-4 font-sans-hebrew">
          {item.summary}
        </p>
      </div>

      {/* Footer Row: Beveled Badge Button, Details, Brass Stars, Tactile Status Selector */}
      <div className="pt-4 border-t border-[#F0ECE4] flex flex-wrap items-center justify-between gap-3 font-sans-hebrew">
        {/* Prominently visible Open Source link - Crisp Beveled Badge */}
        <div className="flex items-center gap-2">
          <a
            id={`open-source-${item.id}`}
            href={item.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#FAF8F5] hover:bg-white text-[#14181F] border border-[#DDD6CB] shadow-xs active:translate-y-px transition-all"
            title={`פתיחת ${item.source_name} בלשונית חדשה`}
          >
            <span>{item.source_name || 'פתיחת מקור'}</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#556070]" />
          </a>

          <button
            id={`view-details-${item.id}`}
            onClick={() => onOpenDetails(item)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#1C2024] hover:bg-[#F2EFEB] active:translate-y-px transition-all"
          >
            פרטים מלאים
          </button>
        </div>

        {/* Rating & User Status */}
        <div className="flex items-center gap-3">
          {/* Star Rating - Warm Brass / Amber Stars */}
          <div className="flex items-center gap-1" title={currentRating ? `${currentRating} כוכבים` : 'ללא דירוג'}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => onUpdateRating(item.id, currentRating === star ? null : (star as 1 | 2 | 3 | 4 | 5))}
                className="p-0.5 hover:scale-115 transition-transform focus:outline-none"
                aria-label={`דרג ${star} כוכבים`}
              >
                <Star
                  className={`w-4 h-4 transition-colors ${
                    currentRating && star <= currentRating
                      ? 'text-[#D9822B] fill-[#D9822B]'
                      : 'text-[#DDD5C7] hover:text-[#D9822B]'
                  }`}
                />
              </button>
            ))}
            {currentRating && (
              <button
                type="button"
                onClick={() => onUpdateRating(item.id, null)}
                className="text-[11px] text-[#8E97A4] hover:text-[#14181F] px-1 transition-colors"
                title="הסרת דירוג"
              >
                ×
              </button>
            )}
          </div>

          {/* User Status Selector - Tactile Dropdown */}
          <select
            id={`select-status-${item.id}`}
            value={currentStatus}
            onChange={(e) => onUpdateStatus(item.id, e.target.value as UserStatus)}
            className="text-xs font-semibold py-1.5 px-3 rounded-xl border border-[#DDD6CB] bg-[#FAF8F5] hover:bg-white text-[#14181F] cursor-pointer focus:ring-1 focus:ring-[#1C2024] focus:border-[#1C2024] shadow-2xs transition-all"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {item.user_state?.personal_note && (
            <span
              className="p-1 text-[#8F4824]"
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

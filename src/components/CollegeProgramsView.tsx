import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  ExternalLink,
  BookOpen,
  Filter,
  Lightbulb,
  Sparkles,
  Info,
  Calendar,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type { AcademicLevel, BriefingRecord, LibraryItem } from '../types.ts';
import { formatDateHebrew } from '../lib/dateUtils.ts';
import { getContentTypeMeta } from '../lib/contentTypes.ts';

interface CollegeProgramsViewProps {
  items: LibraryItem[];
  briefings: BriefingRecord[];
  onOpenItemDetails: (item: LibraryItem) => void;
}

const ACADEMIC_LEVELS: AcademicLevel[] = ['תואר ראשון', 'תואר שני', 'לימודי תעודה', 'הסבת אקדמאים'];

interface GroupedProgram {
  key: string;
  name: string;
  level: AcademicLevel;
  url: string;
  items: Array<{
    item: LibraryItem;
    reason: string;
    workshop_idea: string;
  }>;
}

export const CollegeProgramsView: React.FC<CollegeProgramsViewProps> = ({
  items,
  briefings,
  onOpenItemDetails,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<AcademicLevel | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Group items by official program URL and academic level (per spec!)
  const groupedPrograms = useMemo(() => {
    const map = new Map<string, GroupedProgram>();

    for (const item of items) {
      if (!item.program_matches || item.program_matches.length === 0) continue;

      for (const match of item.program_matches) {
        // Unique key by official URL + level
        const key = `${match.program_url}::${match.level}`;
        if (!map.has(key)) {
          map.set(key, {
            key,
            name: match.name,
            level: match.level,
            url: match.program_url,
            items: [],
          });
        }
        const prog = map.get(key)!;
        prog.items.push({
          item,
          reason: match.reason,
          workshop_idea: match.workshop_idea,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'he'));
  }, [items]);

  // Filter grouped programs
  const filteredPrograms = useMemo(() => {
    return groupedPrograms.filter((prog) => {
      if (selectedLevel !== 'all' && prog.level !== selectedLevel) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchProg =
          prog.name.toLowerCase().includes(q) || prog.level.toLowerCase().includes(q);
        const matchItem = prog.items.some(
          (pi) =>
            pi.item.title.toLowerCase().includes(q) ||
            pi.reason.toLowerCase().includes(q) ||
            pi.workshop_idea.toLowerCase().includes(q)
        );
        if (!matchProg && !matchItem) return false;
      }
      return true;
    });
  }, [groupedPrograms, selectedLevel, searchQuery]);

  // Latest program catalog review metadata
  const latestBriefingWithReview = useMemo(() => {
    return briefings.find((b) => b.program_catalog_review) || null;
  }, [briefings]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-in fade-in duration-200 font-sans-hebrew">
      {/* View Header */}
      <div className="paper-sheet p-6 sm:p-8 rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1C2024] text-[#FAF8F5] flex items-center justify-center border border-[#14181F] shadow-xs">
                <GraduationCap className="w-5 h-5 text-[#FAF8F5]" />
              </div>
              <h2 className="text-2xl font-bold font-serif-hebrew text-[#14181F]">
                התאמה לתוכניות הלימוד בסמינר הקיבוצים
              </h2>
            </div>
            <p className="text-sm text-[#556070] mt-2 max-w-3xl leading-relaxed">
              מבט ממוקד על ממצאים, סדנאות וכלים שחוברו לתוכניות הלימוד השונות במכללה.
              <span className="block text-xs font-semibold text-[#8F4824] mt-1">
                תווית חשובה: התאמה מוצעת על בסיס המקורות — לא המלצה רשמית של המכללה.
              </span>
            </p>
          </div>

          <div className="text-xs text-[#556070] bg-[#F2EFEB] p-3 rounded-xl border border-[#DDD6CB] self-start md:self-auto shadow-2xs">
            <span className="font-bold text-[#14181F] block font-serif-hebrew">סטטיסטיקת תוכניות:</span>
            <span>{groupedPrograms.length} תוכניות מיוצגות בנתונים</span>
          </div>
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-[#EAE5DC]">
          <div className="flex-1 min-w-[240px]">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="סינון תוכניות לפי שם, רעיון לסדנה או נושא..."
              className="w-full text-sm px-4 py-2 rounded-xl bg-white border border-[#DDD6CB] text-[#14181F] shadow-[inset_0_1px_3px_rgba(0,0,0,0.04)] focus:border-[#1C2024]"
            />
          </div>

          {/* Academic Level Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedLevel('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:translate-y-px ${
                selectedLevel === 'all'
                  ? 'bg-[#1C2024] text-white shadow-xs border border-[#14181F]'
                  : 'bg-[#FAF8F5] text-[#556070] hover:bg-white border border-[#DDD6CB]'
              }`}
            >
              כל הרמות ({groupedPrograms.length})
            </button>
            {ACADEMIC_LEVELS.map((level) => {
              const count = groupedPrograms.filter((p) => p.level === level).length;
              return (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:translate-y-px ${
                    selectedLevel === level
                      ? 'bg-[#1C2024] text-white shadow-xs border border-[#14181F]'
                      : 'bg-[#FAF8F5] text-[#556070] hover:bg-white border border-[#DDD6CB]'
                  }`}
                >
                  {level} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Program Catalog Review Note per spec */}
      {latestBriefingWithReview?.program_catalog_review && (
        <div className="p-4 rounded-xl bg-[#FDF9F0] border-r-4 border-r-[#8F4824] border border-[#E8DCC4] text-xs text-[#556070] flex items-start gap-3 shadow-2xs">
          <Info className="w-4 h-4 text-[#8F4824] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold font-serif-hebrew text-[#14181F]">
              תיעוד סקירת תוכניות מהתדריך האחרון ({latestBriefingWithReview.briefing_date}):
            </span>
            <p>
              מצב סקירה: <strong>{latestBriefingWithReview.program_catalog_review.mode}</strong> |{' '}
              סטטוס השוואה: <strong>{latestBriefingWithReview.program_catalog_review.comparison_status}</strong>
              {latestBriefingWithReview.program_catalog_review.note && (
                <span> — {latestBriefingWithReview.program_catalog_review.note}</span>
              )}
            </p>
            <span className="text-[11px] text-[#7E8896] block">
              הערת מתודולוגיה: תוכניות מאומתות הן תיעוד מחקר מהתדריך ואינן בהכרח מייצגות את כל תוכניות המכללה.
            </span>
          </div>
        </div>
      )}

      {/* Programs List */}
      {filteredPrograms.length === 0 ? (
        <div className="p-12 text-center paper-sheet rounded-2xl border border-[#DDD6CB]">
          <GraduationCap className="w-12 h-12 text-[#DDD6CB] mx-auto mb-3" />
          <h3 className="text-lg font-bold font-serif-hebrew text-[#14181F] mb-1">
            לא נמצאו תוכניות לימוד מתאימות
          </h3>
          <p className="text-sm text-[#7E8896]">
            {items.length === 0
              ? 'טרם יובאו ממצאים לספרייה. ייבאו תדריך ראשון כדי לצפות בהתאמות.'
              : 'נסו לשנות את מסנני הרמה האקדמית או מונח החיפוש.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPrograms.map((prog) => (
            <section
              key={prog.key}
              id={`program-section-${prog.key.replace(/[^a-zA-Z0-9]/g, '_')}`}
              className="paper-sheet p-6 sm:p-7 space-y-4 rounded-2xl border border-[#DDD6CB]"
            >
              {/* Program header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE5DC] pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-xl font-bold font-serif-hebrew text-[#14181F]">{prog.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#24523B]/10 text-[#24523B] border border-[#24523B]/20">
                      {prog.level}
                    </span>
                  </div>
                  <span className="text-xs text-[#556070] mt-1 block">
                    {prog.items.length} ממצאים מותאמים לתוכנית זו
                  </span>
                </div>

                <a
                  href={prog.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#FAF8F5] hover:bg-white text-[#14181F] border border-[#DDD6CB] shadow-2xs transition-all active:translate-y-px"
                >
                  <span>דף רשמי בסמינר הקיבוצים</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#8F4824]" />
                </a>
              </div>

              {/* Items matched to this program */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prog.items.map(({ item, reason, workshop_idea }, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#F2EFEB] border border-[#DDD6CB] shadow-2xs hover:border-[#1C2024]/40 transition-colors flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        {(() => {
                          const typeMeta = getContentTypeMeta(item.content_type);
                          return (
                            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-lg border shadow-2xs ${typeMeta.badgeClass}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${typeMeta.dotClass}`} aria-hidden="true" />
                              {typeMeta.label}
                            </span>
                          );
                        })()}
                        <span className="text-xs text-[#7E8896]">
                          {formatDateHebrew(item.event_date || item.published_date)}
                        </span>
                      </div>

                      <h4
                        onClick={() => onOpenItemDetails(item)}
                        className="font-bold font-serif-hebrew text-base text-[#14181F] hover:text-[#8F4824] cursor-pointer line-clamp-2 leading-snug mb-2"
                      >
                        {item.title}
                      </h4>

                      <div className="text-xs text-[#2D3540] bg-[#FAF8F5] border border-[#DDD6CB] p-3 rounded-xl space-y-1.5">
                        <p>
                          <strong className="text-[#14181F]">נימוק התאמה: </strong>
                          {reason}
                        </p>
                        <p className="text-[#8F4824] font-medium">
                          <strong>רעיון לסדנה / יישום: </strong>
                          {workshop_idea}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#EAE5DC] text-xs">
                      <span className="text-[#7E8896] font-medium">{item.source_name}</span>
                      <button
                        onClick={() => onOpenItemDetails(item)}
                        className="text-[#8F4824] font-bold hover:underline"
                      >
                        לפרטים מלאים ←
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

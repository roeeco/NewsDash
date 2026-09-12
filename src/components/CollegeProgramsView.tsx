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
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-in fade-in duration-200">
      {/* View Header */}
      <div className="glass-panel p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#536BD9] text-white flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-[#17243A]">
                התאמה לתוכניות הלימוד בסמינר הקיבוצים
              </h2>
            </div>
            <p className="text-sm text-[#4A5568] mt-2 max-w-3xl leading-relaxed">
              מבט ממוקד על ממצאים, סדנאות וכלים שחוברו לתוכניות הלימוד השונות במכללה.
              <span className="block text-xs font-semibold text-[#536BD9] mt-1">
                תווית חשובה: התאמה מוצעת על בסיס המקורות — לא המלצה רשמית של המכללה.
              </span>
            </p>
          </div>

          <div className="text-xs text-slate-500 bg-white/80 p-3 rounded-xl border border-slate-200 self-start md:self-auto">
            <span className="font-bold text-[#17243A] block">סטטיסטיקת תוכניות:</span>
            <span>{groupedPrograms.length} תוכניות מיוצגות בנתונים</span>
          </div>
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-slate-200/70">
          <div className="flex-1 min-w-[240px]">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="סינון תוכניות לפי שם, רעיון לסדנה או נושא..."
              className="w-full text-sm px-4 py-2 rounded-xl bg-white border border-slate-200 focus:ring-[#536BD9]"
            />
          </div>

          {/* Academic Level Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedLevel('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                selectedLevel === 'all'
                  ? 'bg-[#536BD9] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    selectedLevel === level
                      ? 'bg-[#536BD9] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
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
        <div className="p-4 rounded-2xl bg-white/80 border border-slate-200 text-xs text-slate-600 flex items-start gap-3 shadow-xs">
          <Info className="w-4 h-4 text-[#536BD9] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-[#17243A]">
              תיעוד סקירת תוכניות מהתדריך האחרון ({latestBriefingWithReview.briefing_date}):
            </span>
            <p>
              מצב סקירה: <strong>{latestBriefingWithReview.program_catalog_review.mode}</strong> |{' '}
              סטטוס השוואה: <strong>{latestBriefingWithReview.program_catalog_review.comparison_status}</strong>
              {latestBriefingWithReview.program_catalog_review.note && (
                <span> — {latestBriefingWithReview.program_catalog_review.note}</span>
              )}
            </p>
            <span className="text-[11px] text-slate-400 block">
              הערת מתודולוגיה: תוכניות מאומתות הן תיעוד מחקר מהתדריך ואינן בהכרח מייצגות את כל תוכניות המכללה.
            </span>
          </div>
        </div>
      )}

      {/* Programs List */}
      {filteredPrograms.length === 0 ? (
        <div className="p-12 text-center glass-panel">
          <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#17243A] mb-1">
            לא נמצאו תוכניות לימוד מתאימות
          </h3>
          <p className="text-sm text-slate-500">
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
              className="glass-panel p-6 sm:p-7 space-y-4"
            >
              {/* Program header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-xl font-bold text-[#17243A]">{prog.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#DCF2E9] text-[#136142]">
                      {prog.level}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 mt-1 block">
                    {prog.items.length} ממצאים מותאמים לתוכנית זו
                  </span>
                </div>

                <a
                  href={prog.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-[#17243A] border border-slate-200 shadow-xs"
                >
                  <span>דף רשמי בסמינר הקיבוצים</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#536BD9]" />
                </a>
              </div>

              {/* Items matched to this program */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prog.items.map(({ item, reason, workshop_idea }, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs hover:border-[#536BD9]/40 transition-colors flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#DDE4FF] text-[#334BB8]">
                          {item.content_type}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatDateHebrew(item.event_date || item.published_date)}
                        </span>
                      </div>

                      <h4
                        onClick={() => onOpenItemDetails(item)}
                        className="font-bold text-base text-[#17243A] hover:text-[#536BD9] cursor-pointer line-clamp-2 leading-snug mb-2"
                      >
                        {item.title}
                      </h4>

                      <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl space-y-1.5">
                        <p>
                          <strong className="text-[#17243A]">נימוק התאמה: </strong>
                          {reason}
                        </p>
                        <p className="text-[#334BB8] font-medium">
                          <strong>רעיון לסדנה / יישום: </strong>
                          {workshop_idea}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-500">{item.source_name}</span>
                      <button
                        onClick={() => onOpenItemDetails(item)}
                        className="text-[#536BD9] font-semibold hover:underline"
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

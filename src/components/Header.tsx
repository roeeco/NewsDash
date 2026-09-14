import React from 'react';
import { BookOpen, UploadCloud, Database, GraduationCap, Clock } from 'lucide-react';
import { formatDateHebrew, formatDateTimeHebrew } from '../lib/dateUtils.ts';
import type { LibraryStats, NavigationTab } from '../types.ts';

interface HeaderProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  stats: LibraryStats | null;
  onOpenImport?: () => void;
  onOpenBackup?: () => void;
  onOpenReset?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  stats,
}) => {
  const safeStats = stats || {
    total_items: 0,
    total_briefings: 0,
    last_import_at: null,
    last_briefing_date: null,
    last_briefing_id: null,
  };

  return (
    <header className="sticky top-0 z-30 w-full transition-all border-b border-[#E5DFD5] bg-[#FDFCFB]/95 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Brand & Subtitle - Editorial Masthead */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#1C2024] text-[#F8F6F1] flex items-center justify-center shadow-xs border border-[#14181F] shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#14181F] font-serif-hebrew">
                  ספריית השראה
                </h1>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#F0ECE4] text-[#3D352E] font-semibold border border-[#DDD6CB]">
                  {safeStats.total_items} פריטים
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#556070] line-clamp-1 font-sans-hebrew">
                ממצאים, רעיונות וכלים לפיתוח הוראה וסדנאות בחיבור בין מייקינג, טכנולוגיה ופדגוגיה
              </p>
            </div>
          </div>

          {/* Quick Metrics & Direct Actions */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto font-sans-hebrew">
            {safeStats.last_import_at && (
              <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#556070] bg-[#FAF8F5] px-3 py-1.5 rounded-xl border border-[#E5DFD5]">
                <Clock className="w-3.5 h-3.5 text-[#1C2024]" />
                <span>ייבוא אחרון: {formatDateTimeHebrew(safeStats.last_import_at)}</span>
                {safeStats.last_briefing_date && (
                  <span className="text-[#8B93A0]">
                    (תדריך {formatDateHebrew(safeStats.last_briefing_date)})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Primary Navigation Tabs - Tactile Stamped Toggles */}
        <nav className="flex items-center gap-2 mt-3.5 pt-3 border-t border-[#EAE5DC] overflow-x-auto no-scrollbar font-sans-hebrew">
          <button
            id="nav-tab-library"
            onClick={() => onTabChange('library')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all shrink-0 flex items-center gap-2 ${
              currentTab === 'library'
                ? 'bg-[#1C2024] text-[#F8F6F1] shadow-xs border border-[#14181F]'
                : 'bg-[#FAF8F5] text-[#556070] border border-[#E5DFD5] hover:bg-white hover:text-[#14181F]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>ספרייה</span>
          </button>

          <button
            id="nav-tab-programs"
            onClick={() => onTabChange('programs')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all shrink-0 flex items-center gap-2 ${
              currentTab === 'programs'
                ? 'bg-[#1C2024] text-[#F8F6F1] shadow-xs border border-[#14181F]'
                : 'bg-[#FAF8F5] text-[#556070] border border-[#E5DFD5] hover:bg-white hover:text-[#14181F]'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>לפי תוכנית לימודים</span>
          </button>

          <button
            id="nav-tab-import"
            onClick={() => onTabChange('import')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all shrink-0 flex items-center gap-2 ${
              currentTab === 'import'
                ? 'bg-[#1C2024] text-[#F8F6F1] shadow-xs border border-[#14181F]'
                : 'bg-[#FAF8F5] text-[#556070] border border-[#E5DFD5] hover:bg-white hover:text-[#14181F]'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>ייבוא תדריך</span>
          </button>

          <button
            id="nav-tab-backup"
            onClick={() => onTabChange('backup')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all shrink-0 flex items-center gap-2 ${
              currentTab === 'backup'
                ? 'bg-[#1C2024] text-[#F8F6F1] shadow-xs border border-[#14181F]'
                : 'bg-[#FAF8F5] text-[#556070] border border-[#E5DFD5] hover:bg-white hover:text-[#14181F]'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>גיבוי וייצוא</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

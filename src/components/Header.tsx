import React from 'react';
import { BookOpen, Sparkles, UploadCloud, Database, Eye, GraduationCap, Clock } from 'lucide-react';
import { formatDateHebrew, formatDateTimeHebrew } from '../lib/dateUtils.ts';
import type { LibraryStats, NavigationTab } from '../types.ts';

interface HeaderProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  stats: LibraryStats | null;
  reducedTransparency: boolean;
  onToggleReducedTransparency: () => void;
  onOpenImport: () => void;
  onOpenBackup: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  stats,
  reducedTransparency,
  onToggleReducedTransparency,
  onOpenImport,
  onOpenBackup,
}) => {
  const safeStats = stats || {
    total_items: 0,
    total_briefings: 0,
    last_import_at: null,
    last_briefing_date: null,
    last_briefing_id: null,
  };

  return (
    <header className="sticky top-0 z-30 w-full transition-all border-b border-white/60 glass-panel shadow-xs backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Brand & Subtitle */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#536BD9] text-white flex items-center justify-center shadow-sm shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#17243A]">
                  ספריית השראה
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#DDE4FF] text-[#334BB8] font-medium">
                  {safeStats.total_items} פריטים
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#4A5568] line-clamp-1">
                ממצאים, רעיונות וכלים לפיתוח הוראה וסדנאות בחיבור בין מייקינג, טכנולוגיה ופדגוגיה
              </p>
            </div>
          </div>

          {/* Quick Metrics & Direct Actions */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            {safeStats.last_import_at && (
              <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#526078] bg-white/70 px-3 py-1.5 rounded-xl border border-white/80">
                <Clock className="w-3.5 h-3.5 text-[#536BD9]" />
                <span>ייבוא אחרון: {formatDateTimeHebrew(safeStats.last_import_at)}</span>
                {safeStats.last_briefing_date && (
                  <span className="text-[#8898AA]">
                    (תדריך {formatDateHebrew(safeStats.last_briefing_date)})
                  </span>
                )}
              </div>
            )}

            <button
              id="header-toggle-transparency"
              onClick={onToggleReducedTransparency}
              className={`p-2 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                reducedTransparency
                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                  : 'bg-white/70 text-[#4A5568] border-white/80 hover:bg-white'
              }`}
              title={reducedTransparency ? 'בטל מצב הפחתת שקיפות' : 'הפעל מצב הפחתת שקיפות'}
              aria-label="הפחתת שקיפות"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">הפחתת שקיפות</span>
            </button>

            <button
              id="header-btn-backup"
              onClick={onOpenBackup}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white/80 hover:bg-white text-[#17243A] border border-white/90 shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Database className="w-4 h-4 text-[#536BD9]" />
              <span>גיבוי הנתונים</span>
            </button>

            <button
              id="header-btn-import"
              onClick={onOpenImport}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#536BD9] hover:bg-[#4357c2] text-white shadow-sm transition-colors flex items-center gap-1.5"
            >
              <UploadCloud className="w-4 h-4" />
              <span>ייבוא תדריך</span>
            </button>
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <nav className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-200/50 overflow-x-auto no-scrollbar">
          <button
            id="nav-tab-library"
            onClick={() => onTabChange('library')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all shrink-0 flex items-center gap-2 ${
              currentTab === 'library'
                ? 'bg-[#536BD9] text-white shadow-xs'
                : 'text-[#4A5568] hover:text-[#17243A] hover:bg-white/60'
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
                ? 'bg-[#536BD9] text-white shadow-xs'
                : 'text-[#4A5568] hover:text-[#17243A] hover:bg-white/60'
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
                ? 'bg-[#536BD9] text-white shadow-xs'
                : 'text-[#4A5568] hover:text-[#17243A] hover:bg-white/60'
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
                ? 'bg-[#536BD9] text-white shadow-xs'
                : 'text-[#4A5568] hover:text-[#17243A] hover:bg-white/60'
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

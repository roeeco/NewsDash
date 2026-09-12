import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  SlidersHorizontal,
  X,
  Calendar,
  Star,
  ChevronDown,
  ArrowUpDown,
  BookOpen,
  Sparkles,
  UploadCloud,
  CheckSquare,
  Square,
  Tag,
  GraduationCap,
  RotateCcw,
} from 'lucide-react';
import type {
  AcademicLevel,
  Channel,
  ContentType,
  FilterState,
  LibraryItem,
  SortField,
  SortOrder,
  UserStatus,
} from '../types.ts';
import { ItemCard } from './ItemCard.tsx';

interface LibraryViewProps {
  items: LibraryItem[];
  selectedItemIds: Set<string>;
  onToggleSelectItem: (id: string) => void;
  onSelectAllVisible: (ids: string[]) => void;
  onSelectAllResults: (ids: string[]) => void;
  onClearSelection: () => void;
  onOpenItemDetails: (item: LibraryItem) => void;
  onUpdateRating: (id: string, rating: 1 | 2 | 3 | 4 | 5 | null) => void;
  onUpdateStatus: (id: string, status: UserStatus) => void;
  onOpenImport: () => void;
  onFilteredItemsChange?: (filtered: LibraryItem[]) => void;
  latestBriefingId: string | null;
}

const CONTENT_TYPES: Array<{ value: ContentType; label: string }> = [
  { value: 'workshop', label: 'סדנה' },
  { value: 'webinar', label: 'וובינר' },
  { value: 'research', label: 'מחקר' },
  { value: 'article', label: 'מאמר' },
  { value: 'tool', label: 'כלי' },
  { value: 'product_update', label: 'עדכון מוצר' },
  { value: 'case_study', label: 'מקרה בוחן' },
  { value: 'teaching_resource', label: 'משאב הוראה' },
  { value: 'program_update', label: 'עדכון תוכנית' },
];

const CHANNELS: Array<{ value: Channel; label: string }> = [
  { value: 'workshops', label: 'סדנאות למורים' },
  { value: 'education_ai', label: 'חינוך ו-AI' },
  { value: 'builder_updates', label: 'כלי בנייה' },
  { value: 'college_programs', label: 'תוכניות לימוד' },
];

const ACADEMIC_LEVELS: AcademicLevel[] = ['תואר ראשון', 'תואר שני', 'לימודי תעודה', 'הסבת אקדמאים'];

const INITIAL_FILTERS: FilterState = {
  search: '',
  quickView: 'all',
  dateRange: 'all',
  dateField: 'briefing_date',
  contentTypes: [],
  channels: [],
  subjects: [],
  subjectMatchAll: false,
  source: '',
  program: '',
  academicLevel: '',
  minRating: null,
  userStatus: '',
  hasPersonalNote: false,
  hasProgramMatch: false,
};

const ITEMS_PER_PAGE = 30;

export const LibraryView: React.FC<LibraryViewProps> = ({
  items,
  selectedItemIds,
  onToggleSelectItem,
  onSelectAllVisible,
  onSelectAllResults,
  onClearSelection,
  onOpenItemDetails,
  onUpdateRating,
  onUpdateStatus,
  onOpenImport,
  onFilteredItemsChange,
  latestBriefingId,
}) => {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('briefing_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Extract unique subjects and sources from all existing items
  const { allSubjects, allSources, allPrograms } = useMemo(() => {
    const subjectsSet = new Set<string>();
    const sourcesSet = new Set<string>();
    const programsSet = new Set<string>();

    for (const item of items) {
      if (item.source_name) sourcesSet.add(item.source_name);
      for (const s of item.subjects || []) subjectsSet.add(s);
      for (const p of item.program_matches || []) programsSet.add(p.name);
    }

    return {
      allSubjects: Array.from(subjectsSet).sort((a, b) => a.localeCompare(b, 'he')),
      allSources: Array.from(sourcesSet).sort((a, b) => a.localeCompare(b, 'he')),
      allPrograms: Array.from(programsSet).sort((a, b) => a.localeCompare(b, 'he')),
    };
  }, [items]);

  // Comprehensive Filtering
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search input (searches title, summary, relevance, source, subjects, details, program matches, personal note)
      if (filters.search.trim()) {
        const q = filters.search.trim().toLowerCase();
        const inTitle = item.title.toLowerCase().includes(q);
        const inSummary = item.summary.toLowerCase().includes(q);
        const inRelevance = item.relevance.toLowerCase().includes(q);
        const inSource = item.source_name.toLowerCase().includes(q);
        const inSubjects = (item.subjects || []).some((s) => s.toLowerCase().includes(q));
        const inDetails =
          item.details &&
          ((item.details.participant_actions && item.details.participant_actions.toLowerCase().includes(q)) ||
            (item.details.pedagogical_rationale && item.details.pedagogical_rationale.toLowerCase().includes(q)) ||
            (item.details.practical_takeaway && item.details.practical_takeaway.toLowerCase().includes(q)) ||
            (item.details.audience && item.details.audience.toLowerCase().includes(q)));
        const inPrograms = (item.program_matches || []).some(
          (pm) => pm.name.toLowerCase().includes(q) || pm.reason.toLowerCase().includes(q)
        );
        const inNote = item.user_state?.personal_note?.toLowerCase().includes(q);

        if (!inTitle && !inSummary && !inRelevance && !inSource && !inSubjects && !inDetails && !inPrograms && !inNote) {
          return false;
        }
      }

      // Quick View filters
      if (filters.quickView === 'latest_briefing' && latestBriefingId) {
        if (item.briefing_id !== latestBriefingId) return false;
      } else if (filters.quickView === 'high_rating') {
        if (!item.user_state?.rating || item.user_state.rating < 4) return false;
      } else if (filters.quickView === 'saved') {
        if (item.user_state?.status !== 'saved') return false;
      } else if (filters.quickView === 'tried') {
        if (item.user_state?.status !== 'tried') return false;
      } else if (filters.quickView === 'unrated') {
        if (item.user_state?.rating !== null && item.user_state?.rating !== undefined) return false;
      } else if (filters.quickView === 'archived') {
        if (item.user_state?.status !== 'archived') return false;
      } else {
        // By default 'all' view excludes archived unless specifically viewing archived
        if (filters.quickView === 'all' && item.user_state?.status === 'archived' && filters.userStatus !== 'archived') {
          return false;
        }
      }

      // Date Range Filter
      if (filters.dateRange !== 'all') {
        const dateValStr =
          filters.dateField === 'briefing_date'
            ? item.briefing_date
            : filters.dateField === 'created_at'
            ? item.created_at?.slice(0, 10)
            : filters.dateField === 'published_date'
            ? item.published_date
            : item.event_date;

        if (!dateValStr) return false;
        const itemDate = new Date(dateValStr);
        const now = new Date();

        if (filters.dateRange === 'today') {
          const todayStr = now.toISOString().slice(0, 10);
          if (dateValStr !== todayStr) return false;
        } else if (filters.dateRange === '7_days') {
          const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays < 0 || diffDays > 7) return false;
        } else if (filters.dateRange === '30_days') {
          const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays < 0 || diffDays > 30) return false;
        } else if (filters.dateRange === 'custom') {
          if (filters.customDateStart && dateValStr < filters.customDateStart) return false;
          if (filters.customDateEnd && dateValStr > filters.customDateEnd) return false;
        }
      }

      // Content Types (OR within category)
      if (filters.contentTypes.length > 0) {
        if (!filters.contentTypes.includes(item.content_type)) return false;
      }

      // Channels (OR within category)
      if (filters.channels.length > 0) {
        const hasChannel = (item.channels || []).some((ch) => filters.channels.includes(ch));
        if (!hasChannel) return false;
      }

      // Subjects
      if (filters.subjects.length > 0) {
        if (filters.subjectMatchAll) {
          // AND - item must contain all selected subjects
          const hasAll = filters.subjects.every((s) => (item.subjects || []).includes(s));
          if (!hasAll) return false;
        } else {
          // OR - item must contain at least one
          const hasAny = filters.subjects.some((s) => (item.subjects || []).includes(s));
          if (!hasAny) return false;
        }
      }

      // Source
      if (filters.source && item.source_name !== filters.source) {
        return false;
      }

      // Program Name
      if (filters.program) {
        const match = (item.program_matches || []).some((pm) => pm.name === filters.program);
        if (!match) return false;
      }

      // Academic Level
      if (filters.academicLevel) {
        const match = (item.program_matches || []).some((pm) => pm.level === filters.academicLevel);
        if (!match) return false;
      }

      // Min Rating / Unrated
      if (filters.minRating !== null) {
        const r = item.user_state?.rating;
        if (filters.minRating === -1) {
          // Unrated
          if (r !== null && r !== undefined) return false;
        } else {
          if (!r || r < filters.minRating) return false;
        }
      }

      // Personal User Status
      if (filters.userStatus && item.user_state?.status !== filters.userStatus) {
        return false;
      }

      // Has Personal Note
      if (filters.hasPersonalNote && !item.user_state?.personal_note?.trim()) {
        return false;
      }

      // Has Program Match
      if (filters.hasProgramMatch && (!item.program_matches || item.program_matches.length === 0)) {
        return false;
      }

      return true;
    });
  }, [items, filters, latestBriefingId]);

  // Notify parent of filtered items (e.g. for selection/export)
  useEffect(() => {
    if (onFilteredItemsChange) {
      onFilteredItemsChange(filteredItems);
    }
  }, [filteredItems, onFilteredItemsChange]);

  // Hebrew Sorting with missing values placed at the end and secondary stable sort
  const sortedItems = useMemo(() => {
    const list = [...filteredItems];

    list.sort((a, b) => {
      let res = 0;

      if (sortField === 'briefing_date') {
        const va = a.briefing_date || '';
        const vb = b.briefing_date || '';
        if (!va && !vb) res = 0;
        else if (!va) return 1;
        else if (!vb) return -1;
        else res = va.localeCompare(vb);
      } else if (sortField === 'created_at') {
        const va = a.created_at || '';
        const vb = b.created_at || '';
        if (!va && !vb) res = 0;
        else if (!va) return 1;
        else if (!vb) return -1;
        else res = va.localeCompare(vb);
      } else if (sortField === 'published_date') {
        const va = a.published_date || '';
        const vb = b.published_date || '';
        if (!va && !vb) res = 0;
        else if (!va) return 1;
        else if (!vb) return -1;
        else res = va.localeCompare(vb);
      } else if (sortField === 'event_date') {
        const va = a.event_date || '';
        const vb = b.event_date || '';
        if (!va && !vb) res = 0;
        else if (!va) return 1;
        else if (!vb) return -1;
        else res = va.localeCompare(vb);
      } else if (sortField === 'rating') {
        const ra = a.user_state?.rating ?? null;
        const rb = b.user_state?.rating ?? null;
        if (ra === null && rb === null) res = 0;
        else if (ra === null) return 1; // missing ratings placed at the end per spec
        else if (rb === null) return -1;
        else res = ra - rb;
      } else if (sortField === 'title') {
        res = a.title.localeCompare(b.title, 'he');
      } else if (sortField === 'content_type') {
        res = a.content_type.localeCompare(b.content_type, 'he');
      } else if (sortField === 'subject') {
        // Multi-subject display string sort
        const sa = (a.subjects || []).slice().sort().join(', ');
        const sb = (b.subjects || []).slice().sort().join(', ');
        if (!sa && !sb) res = 0;
        else if (!sa) return 1;
        else if (!sb) return -1;
        else res = sa.localeCompare(sb, 'he');
      }

      // Apply direction
      if (sortOrder === 'desc') {
        res = -res;
      }

      // Stable secondary tie-breaker
      if (res === 0) {
        res = (a.id || '').localeCompare(b.id || '');
      }

      return res;
    });

    return list;
  }, [filteredItems, sortField, sortOrder]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedItems.length / ITEMS_PER_PAGE) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedItems.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedItems, currentPage]);

  const visibleIds = useMemo(() => paginatedItems.map((it) => it.id), [paginatedItems]);
  const allResultIds = useMemo(() => sortedItems.map((it) => it.id), [sortedItems]);

  const areAllVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedItemIds.has(id));

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortField, sortOrder]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.quickView !== 'all') count++;
    if (filters.dateRange !== 'all') count++;
    if (filters.contentTypes.length > 0) count++;
    if (filters.channels.length > 0) count++;
    if (filters.subjects.length > 0) count++;
    if (filters.source) count++;
    if (filters.program) count++;
    if (filters.academicLevel) count++;
    if (filters.minRating !== null) count++;
    if (filters.userStatus) count++;
    if (filters.hasPersonalNote) count++;
    if (filters.hasProgramMatch) count++;
    return count;
  }, [filters]);

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Search Bar & Quick Filters */}
      <div className="glass-panel p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
            <input
              id="library-search-input"
              type="search"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="חיפוש לפי כותרת, נושא, מקור, תוכנית לימודים או הערה…"
              className="w-full pl-4 pr-12 py-3 rounded-2xl bg-white border border-slate-200 text-sm focus:ring-2 focus:ring-[#536BD9] text-[#17243A] shadow-inner placeholder:text-slate-400"
            />
          </div>

          {/* Detailed Filters Toggle Button */}
          <button
            id="btn-toggle-filters"
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className={`px-4 py-3 rounded-2xl text-sm font-semibold border transition-all flex items-center justify-center gap-2 shrink-0 ${
              isFilterPanelOpen || activeFiltersCount > 0
                ? 'bg-indigo-50 border-[#536BD9] text-[#334BB8]'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-xs'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>מסננים מתקדמים</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#536BD9] text-white text-xs flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Quick Views Bar per spec */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="text-slate-400 shrink-0 font-medium ml-1">תצוגה מהירה:</span>
          {[
            { id: 'all', label: 'הכול' },
            { id: 'latest_briefing', label: 'מהתדריך האחרון' },
            { id: 'high_rating', label: 'דירוג גבוה (4-5★)' },
            { id: 'saved', label: 'נשמרו' },
            { id: 'tried', label: 'נוסו' },
            { id: 'unrated', label: 'ללא דירוג' },
            { id: 'archived', label: 'ארכיון' },
          ].map((qv) => (
            <button
              key={qv.id}
              onClick={() =>
                setFilters({
                  ...filters,
                  quickView: qv.id as FilterState['quickView'],
                })
              }
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-colors ${
                filters.quickView === qv.id
                  ? 'bg-[#17243A] text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {qv.label}
            </button>
          ))}
        </div>
      </div>

      {/* Expandable Advanced Filter Panel */}
      {isFilterPanelOpen && (
        <div className="glass-panel p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#536BD9]" />
              <h3 className="font-bold text-sm text-[#17243A]">סינון מותאם</h3>
            </div>
            <button
              onClick={handleResetFilters}
              className="text-xs text-[#536BD9] hover:underline font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>איפוס כל המסננים</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            {/* Column 1: Dates & Content Types */}
            <div className="space-y-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">סינון תאריכים:</label>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  <select
                    value={filters.dateRange}
                    onChange={(e) =>
                      setFilters({ ...filters, dateRange: e.target.value as FilterState['dateRange'] })
                    }
                    className="p-2 rounded-xl bg-white border border-slate-200 text-xs"
                  >
                    <option value="all">כל התאריכים</option>
                    <option value="today">היום</option>
                    <option value="7_days">7 ימים אחרונים</option>
                    <option value="30_days">30 ימים אחרונים</option>
                    <option value="custom">טווח מותאם אישית</option>
                  </select>

                  <select
                    value={filters.dateField}
                    onChange={(e) =>
                      setFilters({ ...filters, dateField: e.target.value as FilterState['dateField'] })
                    }
                    className="p-2 rounded-xl bg-white border border-slate-200 text-xs"
                  >
                    <option value="briefing_date">לפי תאריך תדריך</option>
                    <option value="created_at">לפי הוספה לספרייה</option>
                    <option value="published_date">לפי תאריך פרסום</option>
                    <option value="event_date">לפי מועד אירוע</option>
                  </select>
                </div>

                {filters.dateRange === 'custom' && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <input
                      type="date"
                      value={filters.customDateStart || ''}
                      onChange={(e) => setFilters({ ...filters, customDateStart: e.target.value })}
                      className="p-2 rounded-xl bg-white border border-slate-200 text-xs"
                    />
                    <input
                      type="date"
                      value={filters.customDateEnd || ''}
                      onChange={(e) => setFilters({ ...filters, customDateEnd: e.target.value })}
                      className="p-2 rounded-xl bg-white border border-slate-200 text-xs"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">סוג תוכן:</label>
                <div className="flex flex-wrap gap-1.5">
                  {CONTENT_TYPES.map((ct) => {
                    const isSelected = filters.contentTypes.includes(ct.value);
                    return (
                      <button
                        key={ct.value}
                        type="button"
                        onClick={() => {
                          const next = isSelected
                            ? filters.contentTypes.filter((t) => t !== ct.value)
                            : [...filters.contentTypes, ct.value];
                          setFilters({ ...filters, contentTypes: next });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                          isSelected
                            ? 'bg-[#536BD9] text-white'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {ct.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Column 2: Channels, Sources & Subjects */}
            <div className="space-y-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">ערוצי איסוף:</label>
                <div className="flex flex-wrap gap-1.5">
                  {CHANNELS.map((ch) => {
                    const isSelected = filters.channels.includes(ch.value);
                    return (
                      <button
                        key={ch.value}
                        type="button"
                        onClick={() => {
                          const next = isSelected
                            ? filters.channels.filter((c) => c !== ch.value)
                            : [...filters.channels, ch.value];
                          setFilters({ ...filters, channels: next });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                          isSelected
                            ? 'bg-[#136142] text-white'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {ch.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700">נושאים (בחירה מרובה):</label>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.subjectMatchAll}
                      onChange={(e) => setFilters({ ...filters, subjectMatchAll: e.target.checked })}
                      className="w-3.5 h-3.5 rounded text-[#536BD9]"
                    />
                    <span>כל הנושאים שנבחרו (AND)</span>
                  </label>
                </div>
                <div className="max-h-28 overflow-y-auto p-2 bg-white rounded-xl border border-slate-200 flex flex-wrap gap-1">
                  {allSubjects.map((sub) => {
                    const isSelected = filters.subjects.includes(sub);
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => {
                          const next = isSelected
                            ? filters.subjects.filter((s) => s !== sub)
                            : [...filters.subjects, sub];
                          setFilters({ ...filters, subjects: next });
                        }}
                        className={`px-2 py-0.5 rounded-md text-[11px] ${
                          isSelected
                            ? 'bg-[#536BD9] text-white font-medium'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {sub}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">מקור ראשי:</label>
                <select
                  value={filters.source}
                  onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                  className="w-full p-2 rounded-xl bg-white border border-slate-200 text-xs"
                >
                  <option value="">כל המקורות</option>
                  {allSources.map((src) => (
                    <option key={src} value={src}>
                      {src}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Column 3: College Programs, Rating & Personal Status */}
            <div className="space-y-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">תוכנית ורמת לימודים:</label>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  <select
                    value={filters.academicLevel}
                    onChange={(e) =>
                      setFilters({ ...filters, academicLevel: e.target.value as AcademicLevel | '' })
                    }
                    className="p-2 rounded-xl bg-white border border-slate-200 text-xs"
                  >
                    <option value="">כל הרמות האקדמיות</option>
                    {ACADEMIC_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filters.program}
                    onChange={(e) => setFilters({ ...filters, program: e.target.value })}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-xs"
                  >
                    <option value="">כל תוכניות הלימוד</option>
                    {allPrograms.map((prg) => (
                      <option key={prg} value={prg}>
                        {prg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">דירוג וסטטוס אישי:</label>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  <select
                    value={filters.minRating === null ? '' : String(filters.minRating)}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFilters({ ...filters, minRating: v === '' ? null : parseInt(v, 10) });
                    }}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-xs"
                  >
                    <option value="">כל הדירוגים</option>
                    <option value="5">5 כוכבים בלבד</option>
                    <option value="4">4 כוכבים ומעלה</option>
                    <option value="3">3 כוכבים ומעלה</option>
                    <option value="-1">ללא דירוג (null)</option>
                  </select>

                  <select
                    value={filters.userStatus}
                    onChange={(e) =>
                      setFilters({ ...filters, userStatus: e.target.value as UserStatus | '' })
                    }
                    className="p-2 rounded-xl bg-white border border-slate-200 text-xs"
                  >
                    <option value="">כל הסטטוסים</option>
                    <option value="new">חדש</option>
                    <option value="to_read">לקריאה</option>
                    <option value="saved">נשמר</option>
                    <option value="tried">נוסה</option>
                    <option value="archived">ארכיון</option>
                  </select>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={filters.hasPersonalNote}
                      onChange={(e) => setFilters({ ...filters, hasPersonalNote: e.target.checked })}
                      className="w-3.5 h-3.5 rounded text-[#536BD9]"
                    />
                    <span>יש הערה אישית בלבד</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={filters.hasProgramMatch}
                      onChange={(e) => setFilters({ ...filters, hasProgramMatch: e.target.checked })}
                      className="w-3.5 h-3.5 rounded text-[#536BD9]"
                    />
                    <span>יש התאמה לתוכנית לימודים בלבד</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Chips Bar */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">מסננים פעילים:</span>
          {filters.search && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-[#334BB8]">
              חיפוש: "{filters.search}"
              <X
                className="w-3.5 h-3.5 cursor-pointer"
                onClick={() => setFilters({ ...filters, search: '' })}
              />
            </span>
          )}
          {filters.contentTypes.map((ct) => (
            <span
              key={ct}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200 text-slate-800"
            >
              {ct}
              <X
                className="w-3.5 h-3.5 cursor-pointer"
                onClick={() =>
                  setFilters({
                    ...filters,
                    contentTypes: filters.contentTypes.filter((t) => t !== ct),
                  })
                }
              />
            </span>
          ))}
          {filters.subjects.map((sub) => (
            <span
              key={sub}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200 text-slate-800"
            >
              נושא: {sub}
              <X
                className="w-3.5 h-3.5 cursor-pointer"
                onClick={() =>
                  setFilters({
                    ...filters,
                    subjects: filters.subjects.filter((s) => s !== sub),
                  })
                }
              />
            </span>
          ))}
          {filters.source && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200 text-slate-800">
              מקור: {filters.source}
              <X
                className="w-3.5 h-3.5 cursor-pointer"
                onClick={() => setFilters({ ...filters, source: '' })}
              />
            </span>
          )}
          <button
            onClick={handleResetFilters}
            className="text-[#536BD9] hover:underline font-semibold pr-2"
          >
            איפוס הכל
          </button>
        </div>
      )}

      {/* Sorting & Selection Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 pt-2 border-b border-slate-200/80 pb-3">
        {/* Results Counter & Selection options */}
        <div className="flex items-center gap-4">
          <span className="font-bold text-[#17243A] text-sm">
            נמצאו {sortedItems.length} פריטים מתוך {items.length}
          </span>

          {sortedItems.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onSelectAllVisible(visibleIds)}
                className="text-[#536BD9] hover:underline font-medium flex items-center gap-1"
              >
                {areAllVisibleSelected ? (
                  <CheckSquare className="w-3.5 h-3.5" />
                ) : (
                  <Square className="w-3.5 h-3.5" />
                )}
                <span>בחירת עמוד זה ({visibleIds.length})</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectAllResults(allResultIds)}
                className="text-[#536BD9] hover:underline font-medium"
              >
                בחירת כל {sortedItems.length} התוצאות
              </button>
            </div>
          )}
        </div>

        {/* Sorting Dropdown & Asc/Desc */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400">מיון לפי:</span>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-xs text-[#17243A] font-medium"
          >
            <option value="briefing_date">תאריך תדריך</option>
            <option value="created_at">תאריך הוספה לספרייה</option>
            <option value="published_date">תאריך פרסום</option>
            <option value="event_date">מועד אירוע</option>
            <option value="rating">דירוג אישי</option>
            <option value="title">כותרת (א–ת)</option>
            <option value="content_type">סוג תוכן</option>
            <option value="subject">נושא</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1 font-medium"
            title={`סדר ${sortOrder === 'asc' ? 'עולה' : 'יורד'}`}
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#536BD9]" />
            <span>{sortOrder === 'asc' ? 'עולה' : 'יורד'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {items.length === 0 ? (
        /* Empty State (Initial application state per Section 13) */
        <div className="p-12 sm:p-16 text-center glass-panel max-w-2xl mx-auto my-8 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-[#DDE4FF] text-[#334BB8] flex items-center justify-center mx-auto shadow-sm">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-[#17243A]">
            כאן תיבנה ספריית ההשראה שלך
          </h2>
          <p className="text-sm text-[#4A5568] max-w-md mx-auto leading-relaxed">
            הדביקו תדריך ראשון כדי להתחיל. סוכן המחקר יפיק ממצאים, סדנאות, כלים והתאמות לתוכניות הלימוד בסמינר הקיבוצים.
          </p>
          <div className="pt-2">
            <button
              id="empty-state-btn-import"
              onClick={onOpenImport}
              className="px-6 py-3 rounded-2xl text-sm font-bold bg-[#536BD9] hover:bg-[#4357c2] text-white shadow-md transition-all flex items-center gap-2 mx-auto"
            >
              <UploadCloud className="w-4 h-4" />
              <span>ייבוא תדריך</span>
            </button>
          </div>
        </div>
      ) : sortedItems.length === 0 ? (
        /* No Search Results */
        <div className="p-12 text-center glass-panel">
          <Filter className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#17243A] mb-1">לא נמצאו פריטים תואמים</h3>
          <p className="text-xs text-slate-500 mb-4">
            נסו לשנות את מונח החיפוש או לאפס חלק מהמסננים הפעילים.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-[#536BD9] border border-slate-200 hover:bg-slate-50"
          >
            איפוס כל המסננים
          </button>
        </div>
      ) : (
        /* Items Grid / List */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {paginatedItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                isSelected={selectedItemIds.has(item.id)}
                onToggleSelect={onToggleSelectItem}
                onOpenDetails={onOpenItemDetails}
                onUpdateRating={onUpdateRating}
                onUpdateStatus={onUpdateStatus}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-slate-200 text-xs">
              <span className="text-slate-500">
                מציג פריטים {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(currentPage * ITEMS_PER_PAGE, sortedItems.length)} מתוך {sortedItems.length}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  הקודם
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => setCurrentPage(pg)}
                    className={`w-8 h-8 rounded-xl font-medium ${
                      currentPage === pg
                        ? 'bg-[#536BD9] text-white font-bold'
                        : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    {pg}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  הבא
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

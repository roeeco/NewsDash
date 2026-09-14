import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  BriefingRecord,
  ImportLogRecord,
  LibraryItem,
  LibraryStats,
  NavigationTab,
  UserStatus,
} from './types.ts';
import {
  fetchItems,
  fetchStats,
  fetchBriefings,
  fetchImportLogs,
  updateItemUserState,
  updateItemContent,
} from './lib/api.ts';
import { Header } from './components/Header.tsx';
import { LibraryView } from './components/LibraryView.tsx';
import { CollegeProgramsView } from './components/CollegeProgramsView.tsx';
import { ImportBriefingView } from './components/ImportBriefingView.tsx';
import { BackupExportView } from './components/BackupExportView.tsx';
import { ItemDetailModal } from './components/ItemDetailModal.tsx';
import { FloatingSelectionBar } from './components/FloatingSelectionBar.tsx';
import { PdfExportModal } from './components/PdfExportModal.tsx';
import { ResetDatabaseModal } from './components/ResetDatabaseModal.tsx';
import { RefreshCw, AlertCircle } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('library');
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [briefings, setBriefings] = useState<BriefingRecord[]>([]);
  const [importLogs, setImportLogs] = useState<ImportLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selection state
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [filteredItems, setFilteredItems] = useState<LibraryItem[]>([]);
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  // Modals
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<LibraryItem | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Load all data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [itemsData, statsData, briefingsData, logsData] = await Promise.all([
        fetchItems(),
        fetchStats(),
        fetchBriefings(),
        fetchImportLogs(),
      ]);
      setItems(itemsData);
      setStats(statsData);
      setBriefings(briefingsData);
      setImportLogs(logsData);
    } catch (err: unknown) {
      console.error('Error loading data:', err);
      setError('לא ניתן לטעון את נתוני הספרייה מהשרת. נסו לרענן.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Keep selectedItemForDetail updated if items change
  useEffect(() => {
    if (selectedItemForDetail) {
      const refreshed = items.find((it) => it.id === selectedItemForDetail.id);
      if (refreshed) setSelectedItemForDetail(refreshed);
    }
  }, [items, selectedItemForDetail]);

  // Selection handlers
  const handleToggleSelectItem = useCallback((id: string) => {
    setSelectedItemIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  }, []);

  const handleSelectAllVisible = useCallback((visibleIds: string[]) => {
    setSelectedItemIds((prev) => {
      const allSelected = visibleIds.every((id) => prev.has(id));
      const copy = new Set(prev);
      if (allSelected) {
        // Deselect visible
        for (const id of visibleIds) copy.delete(id);
      } else {
        // Select all visible
        for (const id of visibleIds) copy.add(id);
      }
      return copy;
    });
  }, []);

  const handleSelectAllResults = useCallback((allResultIds: string[]) => {
    setSelectedItemIds(new Set(allResultIds));
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedItemIds(new Set());
    setShowOnlySelected(false);
  }, []);

  // Update item rating
  const handleUpdateRating = async (id: string, rating: 1 | 2 | 3 | 4 | 5 | null) => {
    try {
      const updated = await updateItemUserState(id, { rating });
      setItems((prev) => prev.map((it) => (it.id === id ? updated : it)));
      // Refresh stats
      fetchStats().then(setStats).catch(console.error);
    } catch (err) {
      console.error('Failed to update rating:', err);
    }
  };

  // Update item status
  const handleUpdateStatus = async (id: string, status: UserStatus) => {
    try {
      const updated = await updateItemUserState(id, { status });
      setItems((prev) => prev.map((it) => (it.id === id ? updated : it)));
      // Refresh stats
      fetchStats().then(setStats).catch(console.error);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Full user state & content update from modal
  const handleSaveItemModal = async (
    id: string,
    userPatch: { rating: 1 | 2 | 3 | 4 | 5 | null; status: UserStatus; personal_note: string },
    contentPatch?: Partial<LibraryItem>
  ) => {
    try {
      let currentItem = items.find((it) => it.id === id);
      if (!currentItem) return;

      // Update user state
      let updated = await updateItemUserState(id, userPatch);

      // If content was edited
      if (contentPatch && Object.keys(contentPatch).length > 0) {
        updated = await updateItemContent(id, contentPatch);
      }

      setItems((prev) => prev.map((it) => (it.id === id ? updated : it)));
      setSelectedItemForDetail(updated);
      fetchStats().then(setStats).catch(console.error);
    } catch (err) {
      console.error('Failed to save item details:', err);
      alert('שגיאה בשמירת פרטי הפריט');
    }
  };

  // Selected items objects
  const selectedItemsList = useMemo(() => {
    return items.filter((it) => selectedItemIds.has(it.id));
  }, [items, selectedItemIds]);

  // Calculate hidden selected count
  const hiddenSelectedCount = useMemo(() => {
    const filteredIdSet = new Set(filteredItems.map((it) => it.id));
    let count = 0;
    for (const id of selectedItemIds) {
      if (!filteredIdSet.has(id)) count++;
    }
    return count;
  }, [selectedItemIds, filteredItems]);

  // Items to display in library view (optionally constrained by "הצגת הבחירה")
  const displayedLibraryItems = useMemo(() => {
    if (showOnlySelected) {
      return items.filter((it) => selectedItemIds.has(it.id));
    }
    return items;
  }, [items, showOnlySelected, selectedItemIds]);

  return (
    <div
      className="min-h-screen flex flex-col selection:bg-[#1C2024] selection:text-[#F8F6F1] font-sans-hebrew bg-[#F8F6F1]"
      dir="rtl"
    >
      {/* Global Header */}
      <Header
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        stats={stats}
        onOpenImport={() => {
          setCurrentTab('import');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenBackup={() => {
          setCurrentTab('backup');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenReset={() => setIsResetModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-28">
        {loading && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
            <RefreshCw className="w-7 h-7 text-[#1C2024] animate-spin" />
            <p className="text-sm font-medium text-[#556070]">טוען את ספריית ההשראה מתוך הארכיון...</p>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto my-12 p-8 paper-sheet text-center space-y-4">
            <AlertCircle className="w-8 h-8 text-[#B85D38] mx-auto" />
            <p className="text-base font-bold font-serif-hebrew text-[#14181F]">{error}</p>
            <button
              onClick={loadData}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#1C2024] hover:bg-[#2D3540] active:translate-y-px text-white shadow-xs transition-all"
            >
              נסה שוב
            </button>
          </div>
        ) : (
          <>
            {currentTab === 'library' && (
              <LibraryView
                items={displayedLibraryItems}
                selectedItemIds={selectedItemIds}
                onToggleSelectItem={handleToggleSelectItem}
                onSelectAllVisible={handleSelectAllVisible}
                onSelectAllResults={handleSelectAllResults}
                onClearSelection={handleClearSelection}
                onOpenItemDetails={(item) => setSelectedItemForDetail(item)}
                onUpdateRating={handleUpdateRating}
                onUpdateStatus={handleUpdateStatus}
                onOpenImport={() => setCurrentTab('import')}
                onOpenReset={() => setIsResetModalOpen(true)}
                onFilteredItemsChange={setFilteredItems}
                latestBriefingId={stats?.latest_briefing_id || null}
              />
            )}

            {currentTab === 'programs' && (
              <CollegeProgramsView
                items={items}
                briefings={briefings}
                onOpenItemDetails={(item) => setSelectedItemForDetail(item)}
              />
            )}

            {currentTab === 'import' && (
              <ImportBriefingView
                importLogs={importLogs}
                onImportComplete={loadData}
                onGoToLibrary={() => setCurrentTab('library')}
                onGoToBackup={() => setCurrentTab('backup')}
              />
            )}

            {currentTab === 'backup' && (
              <BackupExportView
                allItems={items}
                selectedItemIds={selectedItemIds}
                filteredItems={filteredItems}
                onDataRestored={loadData}
                onOpenResetModal={() => setIsResetModalOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Floating Selection Action Bar */}
      <FloatingSelectionBar
        selectedCount={selectedItemIds.size}
        hiddenSelectedCount={hiddenSelectedCount}
        onOpenPdfExport={() => setIsPdfModalOpen(true)}
        onOpenDataExport={() => setCurrentTab('backup')}
        onClearSelection={handleClearSelection}
        onShowOnlySelected={() => setShowOnlySelected((prev) => !prev)}
        isShowingOnlySelected={showOnlySelected}
      />

      {/* Item Details & Editing Modal */}
      {selectedItemForDetail && (
        <ItemDetailModal
          item={selectedItemForDetail}
          onClose={() => setSelectedItemForDetail(null)}
          onSave={handleSaveItemModal}
        />
      )}

      {/* PDF / Printable Reading Document Export Modal */}
      {isPdfModalOpen && (
        <PdfExportModal
          selectedItems={selectedItemsList}
          onClose={() => setIsPdfModalOpen(false)}
          onRemoveItemFromSelection={(id) => {
            handleToggleSelectItem(id);
            if (selectedItemIds.size <= 1) {
              setIsPdfModalOpen(false);
            }
          }}
        />
      )}

      {/* Reset & Clear Database Modal */}
      <ResetDatabaseModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onSuccess={() => {
          setSelectedItemIds(new Set());
          setFilteredItems([]);
          loadData();
        }}
        totalItems={items.length}
        totalBriefings={briefings.length}
        totalLogs={importLogs.length}
      />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAppState } from './hooks/useAppState';
import { MacSidebar } from './components/MacSidebar';
import { DashboardView } from './components/DashboardView';
import { MonthFolderView } from './components/MonthFolderView';
import { ContentPopup } from './components/ContentPopup';
import { ContentEntry } from './types';

import { MONTH_NAMES } from './utils/initialState';

function App() {
  const {
    years,
    folders,
    profiles,
    addYear,
    deleteYear,
    addContent,
    editContent,
    deleteContent,
    updateProfile,
    exportData,
    importData
  } = useAppState();

  // 1. Dynamic Dates based on Device System Clock
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    const currentYr = today.getFullYear();
    // Default to device year if within 2024-2030, else fallback to 2026 for mock data view
    return currentYr >= 2024 && currentYr <= 2030 ? currentYr : 2026;
  });
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth());

  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Navigation Routing States
  const [activeView, setActiveView] = useState<'dashboard' | 'instagram' | 'tiktok' | 'folder'>('dashboard');

  // Modal / Popup States for Content Form
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ContentEntry | null>(null);

  // 2. Custom macOS Sequoia Deletion Warning States
  const [contentToDeleteId, setContentToDeleteId] = useState<string | null>(null);
  const [yearToDelete, setYearToDelete] = useState<number | null>(null);

  // 3. Dark & Light Theme State and Synchronizer
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('asrep_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    // System preferences checking
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark'; // Premium dark mode by default!
  });

  // Sync dark class on loading
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // 2.5. Custom macOS Sequoia Notification Toast State
  const [notification, setNotification] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showNotification = (title: string, message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ title, message, type });
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleExportData = async () => {
    const result = await exportData();
    if (result.success) {
      showNotification("Export Successful", result.message || "Data successfully exported.", "success");
    } else {
      showNotification("Export Failed", result.error || "Failed to export data.", "error");
    }
  };

  const handleImportData = async (file: File): Promise<boolean> => {
    const success = await importData(file);
    if (success) {
      showNotification("Import Successful", "Your backup data has been successfully loaded.", "success");
    }
    return success;
  };

  const handleToggleTheme = () => {
    setTheme(prev => {
      const nextTheme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('asrep_theme', nextTheme);
      return nextTheme;
    });
  };

  const handleSelectView = (
    view: 'dashboard' | 'instagram' | 'tiktok' | 'folder', 
    year?: number | null, 
    month?: number | null
  ) => {
    setActiveView(view);
    if (year !== undefined && year !== null) {
      setSelectedYear(year);
    }
    if (month !== undefined && month !== null) {
      setSelectedMonth(month);
    }
  };

  const handleOpenAddPopup = () => {
    setEditingEntry(null);
    setIsPopupOpen(true);
  };

  const handleOpenEditPopup = (entry: ContentEntry) => {
    setEditingEntry(entry);
    setIsPopupOpen(true);
  };

  const handleSaveContent = (entry: Omit<ContentEntry, 'id'>) => {
    if (editingEntry) {
      editContent(selectedYear, selectedMonth, editingEntry.id, entry);
    } else {
      addContent(selectedYear, selectedMonth, entry);
    }
  };

  // Deletion confirmers
  const executeContentDeletion = () => {
    if (contentToDeleteId) {
      deleteContent(selectedYear, selectedMonth, contentToDeleteId);
      setContentToDeleteId(null);
    }
  };

  const executeYearDeletion = () => {
    if (yearToDelete !== null) {
      deleteYear(yearToDelete);
      // If we deleted the year currently selected, default back to 2026 or another active year
      if (selectedYear === yearToDelete) {
        const remaining = years.filter(y => y !== yearToDelete);
        if (remaining.length > 0) {
          setSelectedYear(remaining[0]);
        }
      }
      setYearToDelete(null);
    }
  };

  const isDarkMode = theme === 'dark';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[color:var(--md-sys-color-background)] text-[color:var(--md-sys-color-on-surface)] font-sans">
      
      {/* Left macOS Panel Sidebar */}
      <MacSidebar
        years={years}
        profiles={profiles}
        activeView={activeView}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onSelectView={handleSelectView}
        onAddYear={addYear}
        onDeleteYear={setYearToDelete} // Triggers custom deletion modal!
        onUpdateProfile={updateProfile}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onExportData={handleExportData}
        onImportData={handleImportData}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
      />

      {/* 2. Right Pane content routing */}
      {activeView === 'folder' ? (
        <MonthFolderView
          year={selectedYear}
          monthIndex={selectedMonth}
          contents={folders[selectedYear]?.[selectedMonth] || []}
          onAddContentClick={handleOpenAddPopup}
          onEditContentClick={handleOpenEditPopup}
          onDeleteContent={setContentToDeleteId} // Triggers custom deletion modal!
        />
      ) : (
        <DashboardView
          folders={folders}
          profiles={profiles}
          activeView={activeView}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onSelectMonth={setSelectedMonth}
          onSelectYear={setSelectedYear}
          years={years}
          isDarkMode={isDarkMode}
        />
      )}

      {/* 3. Popup Overlay Form */}
      <ContentPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onSave={handleSaveContent}
        year={selectedYear}
        monthIndex={selectedMonth}
        initialEntry={editingEntry}
      />

      {/* 4. M3 Deletion Warning Dialog (Content) */}
      {contentToDeleteId && (() => {
        const item = folders[selectedYear]?.[selectedMonth]?.find(c => c.id === contentToDeleteId);
        return (
          <div className="fixed inset-0 z-50 mac-backdrop flex items-center justify-center p-4 md-backdrop-enter">
            <div className="
              bg-[color:var(--md-sys-color-surface)]
              border border-[color:var(--md-sys-color-outline-variant)]
              shadow-[var(--md-elevation-3)]
              rounded-3xl p-6 max-w-[360px] w-full
              flex flex-col gap-5 select-none
              md-dialog-enter
            ">
              {/* Icon + Title */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[color:var(--md-sys-color-error-container)] text-[color:var(--md-sys-color-on-error-container)] flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="md-title-medium text-[color:var(--md-sys-color-on-surface)]">Delete Content?</h3>
                  <p className="md-body-medium text-[color:var(--md-sys-color-on-surface-variant)] mt-1">
                    Delete <span className="font-semibold text-[color:var(--md-sys-color-on-surface)]">&ldquo;{item?.title}&rdquo;</span> from {MONTH_NAMES[selectedMonth]} {selectedYear}? This cannot be undone.
                  </p>
                </div>
              </div>
              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setContentToDeleteId(null)} className="gai-btn-text">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeContentDeletion}
                  className="gai-btn-filled"
                  style={{ backgroundColor: 'var(--md-sys-color-error)', color: 'var(--md-sys-color-on-error)' }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 5. M3 Deletion Warning Dialog (Year) */}
      {yearToDelete !== null && (
        <div className="fixed inset-0 z-50 mac-backdrop flex items-center justify-center p-4 md-backdrop-enter">
          <div className="
            bg-[color:var(--md-sys-color-surface)]
            border border-[color:var(--md-sys-color-outline-variant)]
            shadow-[var(--md-elevation-3)]
            rounded-3xl p-6 max-w-[360px] w-full
            flex flex-col gap-5 select-none
            md-dialog-enter
          ">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[color:var(--md-sys-color-error-container)] text-[color:var(--md-sys-color-on-error-container)] flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="md-title-medium text-[color:var(--md-sys-color-on-surface)]">Delete Folder?</h3>
                <p className="md-body-medium text-[color:var(--md-sys-color-on-surface-variant)] mt-1">
                  Deleting the <span className="font-semibold text-[color:var(--md-sys-color-on-surface)]">{yearToDelete}</span> folder will permanently remove all its content.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setYearToDelete(null)} className="gai-btn-text">
                Cancel
              </button>
              <button
                type="button"
                onClick={executeYearDeletion}
                className="gai-btn-filled"
                style={{ backgroundColor: 'var(--md-sys-color-error)', color: 'var(--md-sys-color-on-error)' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. M3 Snackbar Notification */}
      {notification && (
        <div
          className="
            fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]
            max-w-[480px] w-auto min-w-[280px]
            bg-[color:var(--md-sys-color-surface-container-highest,var(--md-sys-color-surface-variant))]
            text-[color:var(--md-sys-color-on-surface)]
            px-4 py-4 rounded-2xl
            flex items-center gap-3
            shadow-[var(--md-elevation-3)]
            pointer-events-auto select-none
            md-snackbar-enter
          "
        >
          {/* Status icon */}
          <div className={`shrink-0 ${
            notification.type === 'success' ? 'text-[color:var(--md-sys-color-primary)]' :
            notification.type === 'error' ? 'text-[color:var(--md-sys-color-error)]' :
            'text-[color:var(--md-sys-color-secondary,var(--md-sys-color-primary))]'
          }`}>
            {notification.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : notification.type === 'error' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="md-label-large text-[color:var(--md-sys-color-on-surface)] leading-tight">{notification.title}</p>
            <p className="md-body-small text-[color:var(--md-sys-color-on-surface-variant)] mt-0.5 leading-snug">{notification.message}</p>
          </div>

          {/* Dismiss */}
          <button
            onClick={() => setNotification(null)}
            className="md-icon-btn-sm shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

    </div>
  );
}

export default App;

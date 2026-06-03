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
    <div className="flex h-screen w-screen overflow-hidden bg-mac-canvas text-mac-text font-sans mac-transition">
      
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
          isDarkMode={isDarkMode}
          onToggleTheme={handleToggleTheme}
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
          onToggleTheme={handleToggleTheme}
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

      {/* 4. Custom macOS Tahoe Deletion Warning Dialog (Content) */}
      {contentToDeleteId && (() => {
        const item = folders[selectedYear]?.[selectedMonth]?.find(c => c.id === contentToDeleteId);
        return (
          <div className="fixed inset-0 z-50 mac-backdrop flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-mac-panel p-5 max-w-[280px] w-full flex flex-col items-center text-center mac-spring-popup border border-mac-border shadow-2xl rounded-2xl select-none">
              <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-3 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-sm font-bold text-mac-text mb-2">Delete Content?</h3>
              <p className="text-xs text-mac-muted mb-5 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-mac-text">"{item?.title}"</span> from {MONTH_NAMES[selectedMonth]} {selectedYear}? This cannot be undone.
              </p>
              <div className="flex flex-col gap-2 w-full text-xs">
                <button
                  type="button"
                  onClick={executeContentDeletion}
                  className="w-full py-2 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold mac-transition cursor-pointer"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setContentToDeleteId(null)}
                  className="w-full py-2 rounded-full border border-mac-border bg-mac-canvas hover:bg-mac-surface text-mac-text font-bold mac-transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 5. Custom macOS Tahoe Deletion Warning Dialog (Year) */}
      {yearToDelete !== null && (
        <div className="fixed inset-0 z-50 mac-backdrop flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-mac-panel p-5 max-w-[280px] w-full flex flex-col items-center text-center mac-spring-popup border border-mac-border shadow-2xl rounded-2xl select-none">
            <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-3 shrink-0">
              <AlertTriangle size={20} />
            </div>
            <h3 className="text-sm font-bold text-mac-text mb-2">Delete Folder?</h3>
            <p className="text-xs text-mac-muted mb-5 leading-relaxed font-sans">
              Deleting the folder <span className="font-bold text-mac-text">{yearToDelete}</span> will remove all content inside it. This action cannot be undone.
            </p>
            <div className="flex flex-col gap-2 w-full text-xs">
              <button
                type="button"
                onClick={executeYearDeletion}
                className="w-full py-2 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold mac-transition cursor-pointer"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setYearToDelete(null)}
                className="w-full py-2 rounded-full border border-mac-border bg-mac-canvas hover:bg-mac-surface text-mac-text font-bold mac-transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Custom macOS Sequoia Notification Banner */}
      {notification && (
        <div className="fixed top-4 right-4 z-[100] max-w-[320px] w-full bg-mac-panel/85 backdrop-blur-md border border-mac-border/80 shadow-2xl p-3.5 rounded-2xl flex gap-3 animate-in slide-in-from-right fade-in duration-300 pointer-events-auto select-none">
          {/* App Icon or Type Icon */}
          <div className="w-10 h-10 rounded-xl bg-mac-accent/15 flex items-center justify-center shrink-0">
            {notification.type === 'success' ? (
              <svg className="w-5 h-5 text-mac-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : notification.type === 'error' ? (
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          
          {/* Notification Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h4 className="text-[11px] font-bold text-mac-text leading-tight truncate">{notification.title}</h4>
            <p className="text-[10px] text-mac-muted leading-snug mt-0.5 whitespace-pre-wrap break-words">{notification.message}</p>
          </div>

          {/* Close Button */}
          <button 
            onClick={() => setNotification(null)}
            className="text-mac-muted hover:text-mac-text p-0.5 self-start rounded-md hover:bg-mac-surface/50 mac-transition shrink-0 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

    </div>
  );
}

export default App;

import { useState, useEffect } from 'react';
import { AlertTriangle, Sparkles, Search, Bell, HelpCircle } from 'lucide-react';
import { useAppState } from './hooks/useAppState';
import { MacSidebar } from './components/MacSidebar';
import { DashboardView } from './components/DashboardView';
import { MonthFolderView } from './components/MonthFolderView';
import { ContentPopup } from './components/ContentPopup';
import { ContentEntry, ApiKeyConfig } from './types';
import { M3Dialog } from './components/M3Dialog';

import { MONTH_NAMES } from './utils/initialState';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { generateGeminiReport, generateHuggingFaceReport, GeminiReportResponse } from './utils/geminiService';
import { ReportProgressModal } from './components/ReportProgressModal';
import { ReportTemplate } from './components/ReportTemplate';
import { ReportConfigModal, ReportConfigOptions } from './components/ReportConfigModal';
import { AiAssistantDrawer } from './components/AiAssistantDrawer';

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

  // Cache to preserve info during M3Dialog fade out
  const [lastContentToDeleteItem, setLastContentToDeleteItem] = useState<ContentEntry | null>(null);
  const [lastYearToDelete, setLastYearToDelete] = useState<number | null>(null);

  useEffect(() => {
    if (contentToDeleteId) {
      const item = folders[selectedYear]?.[selectedMonth]?.find(c => c.id === contentToDeleteId);
      if (item) setLastContentToDeleteItem(item);
    }
  }, [contentToDeleteId, folders, selectedYear, selectedMonth]);

  useEffect(() => {
    if (yearToDelete !== null) {
      setLastYearToDelete(yearToDelete);
    }
  }, [yearToDelete]);

  // AI Assistant Chat Drawer State
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);

  // 3. Dark & Light Theme State and Synchronizer
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    let saved = localStorage.getItem('aswrapped_theme');
    if (!saved) {
      saved = localStorage.getItem('asrep_theme');
      if (saved) {
        localStorage.setItem('aswrapped_theme', saved);
      }
    }
    if (saved === 'light' || saved === 'dark') return saved;
    // System preferences checking
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark'; // Premium dark mode by default!
  });

  // 3.5. Multi-Provider API Configuration State
  const [apiKeys, setApiKeys] = useState<ApiKeyConfig[]>(() => {
    const saved = localStorage.getItem('aswrapped_api_keys');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {}
    }
    
    // Auto-migration for legacy API Key
    const oldKey = localStorage.getItem('aswrapped_gemini_api_key') || '';
    const oldModel = localStorage.getItem('aswrapped_gemini_model') || 'gemini-2.5-flash';
    const initialKeys: ApiKeyConfig[] = [
      {
        id: 'default-gemini',
        provider: 'gemini',
        apiKey: oldKey,
        model: oldModel,
        label: 'Gemini (Default)'
      }
    ];
    localStorage.setItem('aswrapped_api_keys', JSON.stringify(initialKeys));
    return initialKeys;
  });

  const [activeApiKeyId, setActiveApiKeyId] = useState<string>(() => {
    const savedActive = localStorage.getItem('aswrapped_active_api_key_id');
    return savedActive || 'default-gemini';
  });

  const handleSelectActiveApiKey = (id: string) => {
    setActiveApiKeyId(id);
    localStorage.setItem('aswrapped_active_api_key_id', id);
    showNotification("Setelan Disimpan", "API aktif berhasil diubah.", "success");
  };

  const handleCreateApiKey = (provider: 'gemini' | 'huggingface', key: string, model: string, label: string) => {
    const newKey: ApiKeyConfig = {
      id: `api-key-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      provider,
      apiKey: key,
      model,
      label: label.trim() || `${provider === 'gemini' ? 'Gemini' : 'Hugging Face'} Key`
    };
    const updated = [...apiKeys, newKey];
    setApiKeys(updated);
    localStorage.setItem('aswrapped_api_keys', JSON.stringify(updated));
    
    setActiveApiKeyId(newKey.id);
    localStorage.setItem('aswrapped_active_api_key_id', newKey.id);
    
    showNotification("Kunci API Ditambahkan", `Kunci untuk ${provider === 'gemini' ? 'Gemini' : 'Hugging Face'} berhasil ditambahkan.`, "success");
  };

  const handleDeleteApiKey = (id: string) => {
    if (apiKeys.length <= 1) {
      showNotification("Hapus Gagal", "Anda harus menyisakan minimal satu API Key.", "error");
      return;
    }
    const updated = apiKeys.filter(k => k.id !== id);
    setApiKeys(updated);
    localStorage.setItem('aswrapped_api_keys', JSON.stringify(updated));
    
    if (activeApiKeyId === id) {
      const fallbackId = updated[0].id;
      setActiveApiKeyId(fallbackId);
      localStorage.setItem('aswrapped_active_api_key_id', fallbackId);
    }
    showNotification("Kunci API Dihapus", "Kunci API berhasil dihapus.", "info");
  };

  const handleUpdateApiKeyModel = (id: string, model: string) => {
    const updated = apiKeys.map(k => k.id === id ? { ...k, model } : k);
    setApiKeys(updated);
    localStorage.setItem('aswrapped_api_keys', JSON.stringify(updated));
  };

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

  // 7. AI PDF Report Generation State
  const [isReportConfigModalOpen, setIsReportConfigModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportStep, setReportStep] = useState(1);
  const [reportStatus, setReportStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportAiAnalysis, setReportAiAnalysis] = useState<GeminiReportResponse | null>(null);
  const [reportPeriodType, setReportPeriodType] = useState<'month' | 'year'>('month');
  const [reportPeriodLabel, setReportPeriodLabel] = useState('');
  const [reportEntries, setReportEntries] = useState<ContentEntry[]>([]);
  const [reportChartData, setReportChartData] = useState<any[]>([]);

  const handleGenerateReport = async (periodType: 'month' | 'year') => {
    // 1. Data compilation
    let entries: ContentEntry[] = [];
    let label = "";
    let chartData: any[] = [];

    const now = new Date();
    const currentYr = now.getFullYear();
    const currentMonth = now.getMonth();

    if (periodType === 'month') {
      entries = folders[selectedYear]?.[selectedMonth] || [];
      if (entries.length === 0) {
        showNotification("Laporan Gagal", `Tidak ada data konten di bulan ${MONTH_NAMES[selectedMonth]} ${selectedYear}.`, "error");
        return;
      }
      label = `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;

      // Build daily chart data
      const totalDays = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      for (let d = 1; d <= totalDays; d++) {
        const dContents = entries.filter(item => item.day === d);
        const dViews = dContents.reduce((sum, item) => sum + item.instagram.views + item.tiktok.views, 0);
        chartData.push({
          day: d,
          label: `${d}`,
          views: dViews
        });
      }
    } else {
      // Yearly report: limit to current month if selectedYear is currentYear
      let maxMonth = 11;
      if (selectedYear === currentYr) {
        maxMonth = currentMonth;
      } else if (selectedYear > currentYr) {
        maxMonth = -1; // Future year
      }

      if (maxMonth === -1) {
        showNotification("Laporan Gagal", `Tidak dapat menarik laporan untuk tahun depan (${selectedYear}).`, "error");
        return;
      }

      for (let m = 0; m <= maxMonth; m++) {
        const mContents = folders[selectedYear]?.[m] || [];
        mContents.forEach(item => entries.push(item));
      }

      if (entries.length === 0) {
        showNotification("Laporan Gagal", `Tidak ada data konten pada tahun ${selectedYear}.`, "error");
        return;
      }

      label = `Tahun ${selectedYear} (Januari - ${MONTH_NAMES[maxMonth]})`;

      // Build monthly chart data
      for (let m = 0; m <= maxMonth; m++) {
        const mContents = folders[selectedYear]?.[m] || [];
        const mViews = mContents.reduce((sum, item) => sum + item.instagram.views + item.tiktok.views, 0);
        chartData.push({
          index: m,
          name: MONTH_NAMES[m],
          shortName: MONTH_NAMES[m].substring(0, 3),
          views: mViews
        });
      }
    }

    // Set initial progress states
    setReportPeriodType(periodType);
    setReportPeriodLabel(label);
    setReportEntries(entries);
    setReportChartData(chartData);
    setReportAiAnalysis(null);
    setReportError(null);
    setIsReportConfigModalOpen(true);
  };

  const startReportGeneration = async (options: ReportConfigOptions) => {
    setIsReportConfigModalOpen(false);
    setReportStep(1);
    setReportStatus('loading');
    setIsReportModalOpen(true);

    try {
      // 1. Re-compile entries based on custom range selection
      let filteredEntries = [...reportEntries];
      let label = reportPeriodLabel;
      let chartData: any[] = [];

      if (reportPeriodType === 'month') {
        const sDay = options.startDay ?? 1;
        const eDay = options.endDay ?? 31;
        filteredEntries = reportEntries.filter(e => e.day >= sDay && e.day <= eDay);
        
        if (filteredEntries.length === 0) {
          throw new Error(`Tidak ada data konten di rentang tanggal ${sDay} - ${eDay}.`);
        }
        
        label = `${sDay}-${eDay} ${MONTH_NAMES[selectedMonth]} ${selectedYear}`;

        // Rebuild daily chart data for selected range
        for (let d = sDay; d <= eDay; d++) {
          const dContents = filteredEntries.filter(item => item.day === d);
          const dViews = dContents.reduce((sum, item) => sum + item.instagram.views + item.tiktok.views, 0);
          chartData.push({
            day: d,
            label: `${d}`,
            views: dViews
          });
        }
      } else {
        const sMonth = options.startMonth ?? 0;
        const eMonth = options.endMonth ?? 11;
        
        // Filter entries by month range
        filteredEntries = [];
        for (let m = sMonth; m <= eMonth; m++) {
          const mContents = folders[selectedYear]?.[m] || [];
          mContents.forEach(item => filteredEntries.push(item));
        }

        if (filteredEntries.length === 0) {
          throw new Error(`Tidak ada data konten di rentang bulan ${MONTH_NAMES[sMonth]} - ${MONTH_NAMES[eMonth]}.`);
        }

        label = `Tahun ${selectedYear} (${MONTH_NAMES[sMonth]} - ${MONTH_NAMES[eMonth]})`;

        // Rebuild monthly chart data
        for (let m = sMonth; m <= eMonth; m++) {
          const mContents = folders[selectedYear]?.[m] || [];
          const mViews = mContents.reduce((sum, item) => sum + item.instagram.views + item.tiktok.views, 0);
          chartData.push({
            index: m,
            name: MONTH_NAMES[m],
            shortName: MONTH_NAMES[m].substring(0, 3),
            views: mViews
          });
        }
      }

      // Update states with filtered data
      setReportPeriodLabel(label);
      setReportEntries(filteredEntries);
      setReportChartData(chartData);

      // Delay slightly to show Step 1
      await new Promise(r => setTimeout(r, 1000));

      // Step 2: AI Analysis
      setReportStep(2);
      const activeKey = apiKeys.find(k => k.id === activeApiKeyId) || apiKeys[0];

      // Build options text to inject into API call
      const presetInstructions = `
PENTING - Ikuti Kriteria Output Berikut:
1. Gaya Bahasa: ${options.languageStyle === 'casual' ? 'Santai, Gaul, Bersahabat (gunakan bahasa kekinian kreator konten Indonesia, gunakan istilah sosmed kekinian seperti FYP, pecah, rame, dsb)' : 'Profesional, Formal, Resmi'}.
2. Panjang Teks: ${options.textLength === 'simple' ? 'Simpel & Padat (To-the-point, fokus pada data statistik konkret, kurangi penjelasan naratif panjang, hindari walls of text, buat kesimpulan/insight sesingkat dan sepadat mungkin, contoh: "In May, you shared 12 reels", "Views are way up 254% compared to last month"). JANGAN membuat penjelasan paragraf yang bertele-tele.' : 'Detail & Panjang (Penjelasan mendalam dan narasi yang lengkap)'}.
3. Kedalaman Analisis: ${options.analysisDepth === 'quick' ? 'Analisis Cepat (Fokus pada metrik makro views/engagement)' : 'Analisis Mendalam (Mengevaluasi tren tipologi, anomali mikro, dan saran taktis tak terduga)'}.
4. Target Pembaca: ${options.targetAudience === 'beginner' ? 'Bahasa Pemula (Mudah dicerna oleh pembuat konten pemula, hindari jargon bisnis/pemasaran yang rumit)' : 'Profesional (Gunakan jargon bisnis dan media sosial tingkat lanjut seperti ROI, conversion rate, dll)'}.
`;

      const combinedCustomInstructions = options.customInstructions 
        ? `${presetInstructions}\n\nInstruksi Khusus Tambahan dari Pengguna:\n${options.customInstructions}`
        : presetInstructions;

      let analysis;
      if (activeKey.provider === 'gemini') {
        analysis = await generateGeminiReport(
          activeKey.apiKey,
          activeKey.model,
          reportPeriodType,
          label,
          profiles,
          filteredEntries,
          combinedCustomInstructions
        );
      } else {
        analysis = await generateHuggingFaceReport(
          activeKey.apiKey,
          activeKey.model,
          reportPeriodType,
          label,
          profiles,
          filteredEntries,
          combinedCustomInstructions
        );
      }
      setReportAiAnalysis(analysis);

      // Step 3: Wait for render and charts to settle
      setReportStep(3);
      await new Promise(r => setTimeout(r, 1500));

      // Step 4: Capture elements to PDF
      setReportStep(4);

      // Temporarily monkeypatch window.getComputedStyle to translate oklch and oklab to rgb for html2canvas
      const originalGetComputedStyle = window.getComputedStyle;
      const colorCache = new Map<string, string>();
      
      const modernColorToRgbSingle = (colorStr: string): string => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 1;
          canvas.height = 1;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) return colorStr;
          ctx.fillStyle = colorStr;
          ctx.fillRect(0, 0, 1, 1);
          const data = ctx.getImageData(0, 0, 1, 1).data;
          return `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${(data[3] / 255).toFixed(3)})`;
        } catch {
          return colorStr;
        }
      };

      const convertModernColorsToRgb = (val: string): string => {
        if (colorCache.has(val)) return colorCache.get(val)!;
        const regex = /(oklch|oklab)\([^)]+\)/g;
        let result = val;
        const matches = val.match(regex);
        if (matches) {
          for (const m of matches) {
            result = result.replace(m, modernColorToRgbSingle(m));
          }
        }
        colorCache.set(val, result);
        return result;
      };

      window.getComputedStyle = function(el, pseudoElt) {
        const style = originalGetComputedStyle(el, pseudoElt);
        return new Proxy(style, {
          get(target, prop) {
            if (prop === 'getPropertyValue') {
              return function(propertyName: string) {
                const val = target.getPropertyValue(propertyName);
                if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
                  return convertModernColorsToRgb(val);
                }
                return val;
              };
            }
            const value = (target as any)[prop];
            if (typeof value === 'string' && (value.includes('oklch') || value.includes('oklab'))) {
              return convertModernColorsToRgb(value);
            }
            if (typeof value === 'function') {
              return value.bind(target);
            }
            return value;
          }
        });
      };

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1120, 790] // Match exact page style width/height
      });

      const pages = ['report-page-1', 'report-page-2', 'report-page-3', 'report-page-4', 'report-page-5'];
      
      try {
        for (let i = 0; i < pages.length; i++) {
          const pageId = pages[i];
          const element = document.getElementById(pageId);
          if (!element) {
            throw new Error(`Elemen halaman ${pageId} tidak ditemukan.`);
          }

          const canvas = await html2canvas(element, {
            scale: 2, // Higher resolution
            useCORS: true,
            logging: false
          });

          const imgData = canvas.toDataURL('image/png');
          
          if (i > 0) {
            doc.addPage([1120, 790], 'landscape');
          }
          
          doc.addImage(imgData, 'PNG', 0, 0, 1120, 790);
        }
      } finally {
        window.getComputedStyle = originalGetComputedStyle;
      }

      // Save PDF document
      const sanitizedFilename = `aswrapped_report_${reportPeriodType}_${reportPeriodLabel.toLowerCase().replace(/[\s\(\)-]+/g, '_')}.pdf`;
      doc.save(sanitizedFilename);
      
      setReportStatus('success');
      showNotification("Laporan Berhasil", `PDF Laporan ${reportPeriodLabel} berhasil diunduh.`, "success");
    } catch (err: any) {
      console.error(err);
      setReportStatus('error');
      setReportError(err.message || String(err));
      showNotification("Laporan Gagal", err.message || "Gagal membuat laporan PDF.", "error");
    }
  };

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
      localStorage.setItem('aswrapped_theme', nextTheme);
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
        apiKeys={apiKeys}
        activeApiKeyId={activeApiKeyId}
        onSelectActiveApiKey={handleSelectActiveApiKey}
        onCreateApiKey={handleCreateApiKey}
        onDeleteApiKey={handleDeleteApiKey}
        onUpdateApiKeyModel={handleUpdateApiKeyModel}
      />

      {/* 2. Right Pane content routing with Universal Top Header Bar */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Universal Top Header Bar */}
        <div className="h-14 flex items-center justify-between px-8 bg-[color:var(--md-sys-color-surface)] border-b border-[color:var(--md-sys-color-outline-variant)] shrink-0 select-none">
          <div className="flex items-center gap-4 flex-1">
            <span className="text-[13px] font-bold text-[color:var(--md-sys-color-on-surface)] uppercase tracking-wider font-sans">
              Analytics Engine
            </span>
            <div className="relative max-w-xs w-full hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[color:var(--md-sys-color-on-surface-variant)]" />
              <input
                type="text"
                placeholder="Search data points..."
                className="w-full bg-[color:var(--md-sys-color-surface-container-low)] text-[color:var(--md-sys-color-on-surface)] pl-9 pr-4 py-1.5 rounded-full text-xs border border-[color:var(--md-sys-color-outline-variant)] focus:outline-none focus:border-[color:var(--md-sys-color-primary)] placeholder-[color:var(--md-sys-color-on-surface-variant)]/60"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsAiAssistantOpen(true)}
              className="relative p-1.5 rounded-full hover:bg-[color:var(--md-sys-color-surface-container-high)] text-[color:var(--md-sys-color-on-surface-variant)] hover:text-[color:var(--md-sys-color-on-surface)] transition-all cursor-pointer"
              title="Notifikasi As-Istent AI"
            >
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[color:var(--md-sys-color-primary)]" />
            </button>
            <button className="p-1.5 rounded-full hover:bg-[color:var(--md-sys-color-surface-container-high)] text-[color:var(--md-sys-color-on-surface-variant)] hover:text-[color:var(--md-sys-color-on-surface)] transition-all cursor-pointer">
              <HelpCircle size={16} />
            </button>
            <div className="w-8 h-8 rounded-full bg-[color:var(--md-sys-color-primary-container)] text-[color:var(--md-sys-color-primary)] flex items-center justify-center font-bold text-xs select-none">
              AV
            </div>
          </div>
        </div>

        {/* Routed views content container */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeView === 'folder' ? (
            <MonthFolderView
              year={selectedYear}
              monthIndex={selectedMonth}
              contents={folders[selectedYear]?.[selectedMonth] || []}
              onAddContentClick={handleOpenAddPopup}
              onEditContentClick={handleOpenEditPopup}
              onDeleteContent={setContentToDeleteId} // Triggers custom deletion modal!
              onGenerateReportClick={handleGenerateReport}
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
              onGenerateReportClick={handleGenerateReport}
              onSelectView={handleSelectView}
            />
          )}
        </div>
      </div>

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
      <M3Dialog
        isOpen={contentToDeleteId !== null}
        onClose={() => setContentToDeleteId(null)}
        maxWidthClass="max-w-[360px]"
      >
        {/* Icon + Title */}
        <div className="flex items-start gap-4 text-left">
          <div className="w-10 h-10 rounded-full bg-[color:var(--md-sys-color-error-container)] text-[color:var(--md-sys-color-on-error-container)] flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="md-title-medium text-[color:var(--md-sys-color-on-surface)]">Delete Content?</h3>
            <p className="md-body-medium text-[color:var(--md-sys-color-on-surface-variant)] mt-1">
              Delete <span className="font-semibold text-[color:var(--md-sys-color-on-surface)]">&ldquo;{lastContentToDeleteItem?.title || ''}&rdquo;</span> from {MONTH_NAMES[selectedMonth]} {selectedYear}? This cannot be undone.
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
      </M3Dialog>

      {/* 5. M3 Deletion Warning Dialog (Year) */}
      <M3Dialog
        isOpen={yearToDelete !== null}
        onClose={() => setYearToDelete(null)}
        maxWidthClass="max-w-[360px]"
      >
        <div className="flex items-start gap-4 text-left">
          <div className="w-10 h-10 rounded-full bg-[color:var(--md-sys-color-error-container)] text-[color:var(--md-sys-color-on-error-container)] flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="md-title-medium text-[color:var(--md-sys-color-on-surface)]">Delete Folder?</h3>
            <p className="md-body-medium text-[color:var(--md-sys-color-on-surface-variant)] mt-1">
              Deleting the <span className="font-semibold text-[color:var(--md-sys-color-on-surface)]">{lastYearToDelete}</span> folder will permanently remove all its content.
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
      </M3Dialog>

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

      {/* 8. Report Modals & Print Templates */}
      <ReportConfigModal
        isOpen={isReportConfigModalOpen}
        onClose={() => setIsReportConfigModalOpen(false)}
        onConfirm={startReportGeneration}
        periodType={reportPeriodType}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        activeApiKey={apiKeys.find(k => k.id === activeApiKeyId) || apiKeys[0]}
        folders={folders}
      />

      <ReportProgressModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        currentStep={reportStep}
        status={reportStatus}
        errorMessage={reportError}
        provider={apiKeys.find(k => k.id === activeApiKeyId)?.provider}
      />

      <ReportTemplate
        periodType={reportPeriodType}
        periodLabel={reportPeriodLabel}
        profiles={profiles}
        entries={reportEntries}
        aiAnalysis={reportAiAnalysis}
        chartData={reportChartData}
      />

      {/* Floating Action Button (FAB) untuk membuka Asisten AI */}
      <button
        onClick={() => setIsAiAssistantOpen(true)}
        className="fixed bottom-6 right-6 z-30 w-12 h-12 rounded-full flex items-center justify-center bg-[color:var(--md-sys-color-primary)] text-[color:var(--md-sys-color-on-primary)] shadow-[var(--md-elevation-3)] hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
        title="Buka Asisten AI"
      >
        <Sparkles size={20} />
      </button>

      {/* Slide-out AI Assistant Drawer */}
      <AiAssistantDrawer
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        profiles={profiles}
        folders={folders}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        apiKeys={apiKeys}
        activeApiKeyId={activeApiKeyId}
      />

    </div>
  );
}

export default App;

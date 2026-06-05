import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  LayoutDashboard,
  Folder, 
  FolderOpen, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  X,
  Edit,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  Download,
  Upload,
  Sun,
  Moon
} from 'lucide-react';
import { PlatformProfiles, PlatformType } from '../types';
import { MONTH_NAMES } from '../utils/initialState';

interface MacSidebarProps {
  years: number[];
  profiles: PlatformProfiles;
  activeView: 'dashboard' | 'instagram' | 'tiktok' | 'folder';
  selectedYear: number | null;
  selectedMonth: number | null;
  onSelectView: (view: 'dashboard' | 'instagram' | 'tiktok' | 'folder', year?: number | null, month?: number | null) => void;
  onAddYear: (year: number) => boolean;
  onDeleteYear: (year: number) => void;
  onUpdateProfile: (platform: PlatformType, username: string, fullName: string, followers: number) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onExportData: () => void;
  onImportData: (file: File) => Promise<boolean>;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

// Full TikTok music-note path (original 0-24 space, spans ~x:2.3-20.7, y:0-24.3)
const _ttPath = "M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.07-2.88-.52-4.13-1.32-.73-.47-1.35-1.07-1.78-1.81V17c-.02 1.62-.48 3.24-1.37 4.61C14 23.42 11.58 24.32 9.15 23.95c-2.43-.37-4.63-1.87-5.74-4.07C2.3 17.68 2.06 15.07 2.73 12.8c.67-2.28 2.4-4.17 4.63-4.96 1.17-.41 2.42-.51 3.65-.3v4.05c-.88-.23-1.85-.14-2.69.25-1.25.59-2.09 1.86-2.22 3.25-.13 1.38.47 2.77 1.51 3.62 1.05.85 2.5 1.06 3.73.55 1.23-.51 1.99-1.75 2.03-3.08.01-3.03.01-6.07.01-9.11 0-2.32.01-4.64.01-6.96z";

// 2px padding on bg rect to match Lucide icon visual weight
export const TikTokIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <rect x="2" y="2" width="20" height="20" rx="5" fill="#010101" />
    {/* Cyan shadow — left */}
    <path d={_ttPath} fill="#25F4EE" transform="translate(2.65,3.1) scale(0.74)" />
    {/* Red shadow — right */}
    <path d={_ttPath} fill="#FE2C55" transform="translate(3.55,3.1) scale(0.74)" />
    {/* White main — centered */}
    <path d={_ttPath} fill="#FFFFFF" transform="translate(3.1,3.1) scale(0.74)" />
  </svg>
);

// 2px padding on bg rect to match Lucide icon visual weight
export const InstagramIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => {
  const uid = React.useId ? React.useId().replace(/:/g, '') : 'ig';
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <defs>
        <radialGradient id={`ig-rg-${uid}`} cx="30%" cy="107%" r="130%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="5%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" fill={`url(#ig-rg-${uid})`} />
      {/* Camera border */}
      <rect x="6" y="6" width="12" height="12" rx="3" fill="none" stroke="#fff" strokeWidth="1.4" />
      {/* Lens */}
      <circle cx="12" cy="12" r="3" fill="none" stroke="#fff" strokeWidth="1.4" />
      {/* Dot */}
      <circle cx="16.5" cy="7.5" r="0.9" fill="#fff" />
    </svg>
  );
};

/* ─── Small Dialog wrapper with M3 animation ─── */
interface SmallDialogProps {
  show: boolean;
  onClose: () => void;
  children: React.ReactNode;
}
const SmallDialog: React.FC<SmallDialogProps> = ({ show, onClose, children }) => {
  const [rendered, setRendered] = useState(false);
  const [animClass, setAnimClass] = useState('');

  React.useEffect(() => {
    let t: any;
    if (show) {
      setRendered(true);
      t = setTimeout(() => setAnimClass('md-dialog-enter'), 16);
    } else {
      setAnimClass('md-dialog-exit');
      t = setTimeout(() => { setRendered(false); setAnimClass(''); }, 200);
    }
    return () => clearTimeout(t);
  }, [show]);

  if (!rendered) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 mac-backdrop ${show ? 'md-backdrop-enter' : 'md-backdrop-exit'}`}
      onClick={onClose}
    >
      <div
        className={animClass}
        style={{ willChange: 'transform, opacity' }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

export const MacSidebar: React.FC<MacSidebarProps> = React.memo(({
  years,
  profiles,
  activeView,
  selectedYear,
  selectedMonth,
  onSelectView,
  onAddYear,
  onDeleteYear,
  onUpdateProfile,
  isCollapsed,
  onToggleCollapse,
  onExportData,
  onImportData,
  isDarkMode,
  onToggleTheme
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onImportData(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const [collapsedYears, setCollapsedYears] = useState<Record<number, boolean>>({ 2026: false });
  const [isAddingYear, setIsAddingYear] = useState(false);
  const [isSystemCollapsed, setIsSystemCollapsed] = useState(true);
  const [newYearInput, setNewYearInput] = useState('');
  const [editingPlatform, setEditingPlatform] = useState<PlatformType | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editFollowers, setEditFollowers] = useState(0);

  const toggleYearCollapse = (year: number) => {
    if (isCollapsed) onToggleCollapse();
    setCollapsedYears(prev => ({ ...prev, [year]: !prev[year] }));
  };

  const handleAddYearSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const yr = parseInt(newYearInput);
    if (!isNaN(yr) && yr >= 2000 && yr <= 2100) {
      const success = onAddYear(yr);
      if (success) {
        setIsAddingYear(false);
        setNewYearInput('');
        setCollapsedYears(prev => ({ ...prev, [yr]: false }));
      } else {
        alert('Tahun sudah ada!');
      }
    } else {
      alert('Masukkan tahun yang valid (2000 - 2100)');
    }
  };

  const openEditProfile = (platform: PlatformType) => {
    const prof = profiles[platform];
    setEditingPlatform(platform);
    setEditUsername(prof.username);
    setEditFullName(prof.fullName);
    setEditFollowers(prof.followers);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPlatform) {
      onUpdateProfile(editingPlatform, editUsername, editFullName, editFollowers);
      setEditingPlatform(null);
    }
  };

  /* ── Shared nav item base style ── */
  const navItemBase = `
    flex items-center rounded-full select-none cursor-pointer
    transition-colors duration-150 text-left relative overflow-hidden
  `;
  const navItemExpanded = `${navItemBase} gap-3 px-4 h-11 w-full`;
  const navItemCollapsed = `${navItemBase} justify-center p-2.5 w-11 h-11`;

  const getActiveNavItemClass = (view: 'dashboard' | 'instagram' | 'tiktok' | 'folder') => {
    switch (view) {
      case 'dashboard':
        return 'bg-[color:var(--md-sys-color-primary-container)] text-[color:var(--md-sys-color-on-primary-container)] font-semibold';
      case 'instagram':
        return 'bg-[color:var(--md-sys-color-error-container)] text-[color:var(--md-sys-color-on-error-container)] font-semibold';
      case 'tiktok':
        return 'bg-[color:var(--md-sys-color-cyan-container)] text-[color:var(--md-sys-color-on-cyan-container)] font-semibold';
      case 'folder':
        return 'bg-[color:var(--md-sys-color-yellow-container)] text-[color:var(--md-sys-color-on-yellow-container)] font-semibold';
      default:
        return 'bg-[color:var(--md-sys-color-primary-container)] text-[color:var(--md-sys-color-on-primary-container)] font-semibold';
    }
  };
  const navItemDefault = 'text-[color:var(--md-sys-color-on-surface-variant)] hover:bg-[color:var(--md-sys-color-surface-container-high)] hover:text-[color:var(--md-sys-color-on-surface)]';

  /* ── Section label style ── */
  const sectionLabel = 'text-[12px] font-medium text-[color:var(--md-sys-color-on-surface-variant)] px-4 mb-1 tracking-[.5px] select-none uppercase';

  return (
    <div
      className={`flex flex-col h-screen select-none relative z-10 transition-[width] duration-300 shrink-0
        bg-[color:var(--md-sys-color-surface-container)]
        border-r border-[color:var(--md-sys-color-outline-variant)]
        ${isCollapsed ? 'w-[64px]' : 'w-[240px]'}
      `}
    >
      {/* ─── Header ─────────────────── */}
      <div className={`h-14 flex items-center shrink-0 ${isCollapsed ? 'justify-center px-0' : 'justify-between px-4 gap-3'}`}>
        <span
          className={`text-[15px] font-semibold tracking-tight text-[color:var(--md-sys-color-on-surface)] truncate transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${isCollapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[150px] opacity-100'}`}
          style={{ fontFamily: "'Google Sans Display', sans-serif" }}
        >
          As-Wrapped Tracker
        </span>
        <button
          onClick={onToggleCollapse}
          className="md-icon-btn-sm shrink-0"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* ─── Divider ─── */}
      <div className="md-divider mx-4" />

      {/* ─── Scrollable Nav ──────────── */}
      <div className={`flex-1 overflow-y-auto overflow-x-hidden py-3 flex flex-col gap-5 ${isCollapsed ? 'px-2 items-center' : 'px-3'}`}>

        {/* Dashboard */}
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => onSelectView('dashboard')}
            className={`${isCollapsed ? navItemCollapsed : navItemExpanded} ${activeView === 'dashboard' ? getActiveNavItemClass('dashboard') : navItemDefault}`}
            title={isCollapsed ? "Dashboard" : undefined}
          >
            <LayoutDashboard size={18} className="shrink-0" />
            <span className={`text-[13px] font-medium transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${isCollapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[150px] opacity-100'}`}>
              Dashboard
            </span>
          </button>
        </div>

        {/* ─── Divider ─── */}
        {!isCollapsed && <div className="md-divider" />}
        {isCollapsed && <div className="md-divider w-6 self-center" />}

        {/* Accounts */}
        <div className="flex flex-col gap-0.5">
          <div className={`${sectionLabel} transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${isCollapsed ? 'max-w-0 opacity-0 py-0 my-0 h-0 pointer-events-none' : 'max-w-[150px] opacity-100'}`}>
            Accounts
          </div>

          {/* Instagram */}
          <div className="group relative">
            <button
              onClick={() => onSelectView('instagram')}
              className={`${isCollapsed ? navItemCollapsed : navItemExpanded} ${activeView === 'instagram' ? getActiveNavItemClass('instagram') : navItemDefault}`}
              title={isCollapsed ? `Instagram (${profiles.instagram.username})` : undefined}
            >
              <InstagramIcon size={18} className="shrink-0" />
              <span className={`text-[13px] font-medium flex-1 truncate transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${isCollapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[150px] opacity-100'}`}>
                {profiles.instagram.username}
              </span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); openEditProfile('instagram'); }}
              className={`absolute right-2 top-1/2 -translate-y-1/2 md-icon-btn-sm transition-all duration-300 ease-in-out
                ${isCollapsed ? 'opacity-0 scale-50 pointer-events-none' : 'group-hover:opacity-100 opacity-0'}
                ${activeView === 'instagram'
                  ? 'text-[color:var(--md-sys-color-on-error-container)] hover:bg-[color:var(--md-sys-color-error)]/10'
                  : 'text-[color:var(--md-sys-color-on-surface-variant)] hover:bg-[color:var(--md-sys-color-surface-variant)] hover:text-[color:var(--md-sys-color-on-surface)]'}`}
              title="Edit Profile"
            >
              <Edit size={14} />
            </button>
          </div>

          {/* TikTok */}
          <div className="group relative">
            <button
              onClick={() => onSelectView('tiktok')}
              className={`${isCollapsed ? navItemCollapsed : navItemExpanded} ${activeView === 'tiktok' ? getActiveNavItemClass('tiktok') : navItemDefault}`}
              title={isCollapsed ? `TikTok (${profiles.tiktok.username})` : undefined}
            >
              <TikTokIcon size={18} className="shrink-0" />
              <span className={`text-[13px] font-medium flex-1 truncate transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${isCollapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[150px] opacity-100'}`}>
                {profiles.tiktok.username}
              </span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); openEditProfile('tiktok'); }}
              className={`absolute right-2 top-1/2 -translate-y-1/2 md-icon-btn-sm transition-all duration-300 ease-in-out
                ${isCollapsed ? 'opacity-0 scale-50 pointer-events-none' : 'group-hover:opacity-100 opacity-0'}
                ${activeView === 'tiktok'
                  ? 'text-[color:var(--md-sys-color-on-cyan-container)] hover:bg-[color:var(--md-sys-color-cyan)]/10'
                  : 'text-[color:var(--md-sys-color-on-surface-variant)] hover:bg-[color:var(--md-sys-color-surface-variant)] hover:text-[color:var(--md-sys-color-on-surface)]'}`}
              title="Edit Profile"
            >
              <Edit size={14} />
            </button>
          </div>
        </div>

        {/* ─── Divider ─── */}
        {!isCollapsed && <div className="md-divider" />}
        {isCollapsed && <div className="md-divider w-6 self-center" />}

        {/* Year Folders */}
        <div className="flex flex-col gap-0.5">
          {isCollapsed ? (
            <div className="flex justify-center w-full mb-1">
              <button
                onClick={() => { onToggleCollapse(); setIsAddingYear(true); }}
                className="md-icon-btn-sm"
                title="Add Year"
              >
                <Plus size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between px-4 mb-1">
              <span className={`${sectionLabel} px-0`}>Folders</span>
              <button
                onClick={() => setIsAddingYear(true)}
                className="md-icon-btn-sm shrink-0"
                title="Add Year"
              >
                <Plus size={16} />
              </button>
            </div>
          )}

          {years.map(year => {
            const isOpen = collapsedYears[year] === false;
            return (
              <div key={year} className="flex flex-col">
                <div className="group relative">
                  <button
                    onClick={() => toggleYearCollapse(year)}
                    className={`${isCollapsed ? navItemCollapsed : navItemExpanded} ${navItemDefault} w-full`}
                    title={isCollapsed ? `Folder ${year}` : undefined}
                  >
                    <span className={`text-[color:var(--md-sys-color-on-surface-variant)] shrink-0 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${isCollapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[20px] opacity-100 mr-1'}`}>
                      {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                    <span className="text-[color:var(--md-sys-color-yellow,var(--md-sys-color-primary))] shrink-0">
                      {isOpen && !isCollapsed ? <FolderOpen size={16} /> : <Folder size={16} />}
                    </span>
                    <span className={`text-[13px] font-medium transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${isCollapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[150px] opacity-100'}`}>
                      {year}
                    </span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteYear(year); }}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 md-icon-btn-sm transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 scale-50 pointer-events-none' : 'group-hover:opacity-100 opacity-0'} hover:text-red-500`}
                    title="Delete Year"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Month sub-items */}
                {isOpen && !isCollapsed && (
                  <div className="pl-6 flex flex-col gap-0.5 mt-0.5">
                    {MONTH_NAMES.map((mName, mIdx) => {
                      const isActive = activeView === 'folder' && selectedYear === year && selectedMonth === mIdx;
                      return (
                        <button
                          key={mIdx}
                          onClick={() => onSelectView('folder', year, mIdx)}
                          className={`${navItemExpanded} ${isActive ? getActiveNavItemClass('folder') : navItemDefault} pl-3`}
                        >
                          <Folder size={14} className="shrink-0" />
                          <span className={`text-[13px] font-medium truncate transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${isCollapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[150px] opacity-100'}`}>
                            {mName}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Bottom: System Actions ───── */}
      <div className="shrink-0 border-t border-[color:var(--md-sys-color-outline-variant)] py-3 px-3 flex flex-col">
        {isCollapsed ? (
          <button
            onClick={() => setIsSystemCollapsed(!isSystemCollapsed)}
            className="w-11 h-11 rounded-full md-icon-btn self-center flex items-center justify-center text-[color:var(--md-sys-color-on-surface-variant)] hover:bg-[color:var(--md-sys-color-surface-container-high)] hover:text-[color:var(--md-sys-color-on-surface)]"
            title={isSystemCollapsed ? "Expand System Actions" : "Collapse System Actions"}
          >
            <ChevronDown
              size={18}
              className={`transform transition-transform duration-200 ${isSystemCollapsed ? '' : 'rotate-180'}`}
            />
          </button>
        ) : (
          <button
            onClick={() => setIsSystemCollapsed(!isSystemCollapsed)}
            className="flex items-center justify-between w-full text-[12px] font-medium text-[color:var(--md-sys-color-on-surface-variant)] px-1 mb-1 tracking-[.5px] select-none uppercase hover:text-[color:var(--md-sys-color-on-surface)] transition-colors duration-150"
            title={isSystemCollapsed ? "Expand System Actions" : "Collapse System Actions"}
          >
            <span>System</span>
            <ChevronDown
              size={14}
              className={`transform transition-transform duration-200 ${isSystemCollapsed ? '' : 'rotate-180'}`}
            />
          </button>
        )}

        <div
          className={`flex flex-col gap-2 transition-all duration-300 ease-in-out overflow-hidden
            ${isSystemCollapsed ? 'max-h-0 opacity-0 pointer-events-none' : 'max-h-[200px] opacity-100 mt-2'}`}
        >
          <button
            onClick={onToggleTheme}
            className={`flex items-center justify-center transition-all duration-300 shrink-0 select-none cursor-pointer overflow-hidden
              ${isCollapsed
                ? 'w-11 h-11 rounded-full md-icon-btn self-center'
                : 'gai-btn-outlined w-full h-11 px-4 rounded-xl text-sm gap-2'
              }`}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun size={14} className="shrink-0" /> : <Moon size={14} className="shrink-0" />}
            <span className={`transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${isCollapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[150px] opacity-100'}`}>
              {isDarkMode ? "Switch to Light" : "Switch to Dark"}
            </span>
          </button>

          <button
            onClick={onExportData}
            className={`flex items-center justify-center transition-all duration-300 shrink-0 select-none cursor-pointer overflow-hidden
              ${isCollapsed
                ? 'w-11 h-11 rounded-full md-icon-btn self-center'
                : 'gai-btn-outlined w-full h-11 px-4 rounded-xl text-sm gap-2'
              }`}
            title={isCollapsed ? "Export Backup" : "Export data ke JSON"}
          >
            <Upload size={14} className="shrink-0" />
            <span className={`transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${isCollapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[150px] opacity-100'}`}>
              Export
            </span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center justify-center transition-all duration-300 shrink-0 select-none cursor-pointer overflow-hidden
              ${isCollapsed
                ? 'w-11 h-11 rounded-full md-icon-btn self-center'
                : 'gai-btn-tonal w-full h-11 px-4 rounded-xl text-sm gap-2'
              }`}
            style={isCollapsed ? undefined : { border: '1px solid var(--md-sys-color-outline)' }}
            title={isCollapsed ? "Import Backup" : "Import dari file JSON"}
          >
            <Download size={14} className="shrink-0" />
            <span className={`transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${isCollapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[150px] opacity-100'}`}>
              Import
            </span>
          </button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          className="absolute w-0 h-0 opacity-0 pointer-events-none"
        />
      </div>

      {/* ══ Dialog: Add Year ══════════════════ */}
      <SmallDialog show={isAddingYear} onClose={() => setIsAddingYear(false)}>
        <form
          onSubmit={handleAddYearSubmit}
          className="
            bg-[color:var(--md-sys-color-surface)]
            border border-[color:var(--md-sys-color-outline-variant)]
            rounded-3xl shadow-[var(--md-elevation-3)]
            w-[280px] flex flex-col gap-6 p-6 select-none
          "
        >
          {/* Dialog Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="md-title-large text-[color:var(--md-sys-color-on-surface)]">Add Year</h2>
              <p className="md-body-small text-[color:var(--md-sys-color-on-surface-variant)] mt-1">Create a new yearly folder to track content.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingYear(false)}
              className="md-icon-btn-sm -mr-1 -mt-1 shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          {/* Input */}
          <div className="flex flex-col gap-2">
            <label className="md-label-medium text-[color:var(--md-sys-color-on-surface-variant)]">Year Value</label>
            <input
              type="number"
              placeholder="e.g. 2027"
              value={newYearInput}
              onChange={e => setNewYearInput(e.target.value)}
              className="gai-input"
              autoFocus
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setIsAddingYear(false)} className="gai-btn-text">Cancel</button>
            <button type="submit" className="gai-btn-filled">Create</button>
          </div>
        </form>
      </SmallDialog>

      {/* ══ Dialog: Edit Profile ══════════════ */}
      <SmallDialog show={!!editingPlatform} onClose={() => setEditingPlatform(null)}>
        <form
          onSubmit={handleSaveProfile}
          className="
            bg-[color:var(--md-sys-color-surface)]
            border border-[color:var(--md-sys-color-outline-variant)]
            rounded-3xl shadow-[var(--md-elevation-3)]
            w-[320px] flex flex-col gap-6 p-6 select-none
          "
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="md-title-large text-[color:var(--md-sys-color-on-surface)]">
                Edit {editingPlatform === 'instagram' ? 'Instagram' : 'TikTok'}
              </h2>
              <p className="md-body-small text-[color:var(--md-sys-color-on-surface-variant)] mt-1">Update your account details below.</p>
            </div>
            <button type="button" onClick={() => setEditingPlatform(null)} className="md-icon-btn-sm -mr-1 -mt-1 shrink-0">
              <X size={16} />
            </button>
          </div>

          {/* Fields */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="md-label-medium text-[color:var(--md-sys-color-on-surface-variant)]">Username</label>
              <input
                type="text"
                value={editUsername}
                onChange={e => setEditUsername(e.target.value)}
                className="gai-input"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="md-label-medium text-[color:var(--md-sys-color-on-surface-variant)]">Full Name</label>
              <input
                type="text"
                value={editFullName}
                onChange={e => setEditFullName(e.target.value)}
                className="gai-input"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="md-label-medium text-[color:var(--md-sys-color-on-surface-variant)]">Followers</label>
              <input
                type="number"
                value={editFollowers}
                onChange={e => setEditFollowers(parseInt(e.target.value) || 0)}
                className="gai-input"
                min="0"
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setEditingPlatform(null)} className="gai-btn-text">Cancel</button>
            <button type="submit" className="gai-btn-filled">Save</button>
          </div>
        </form>
      </SmallDialog>

    </div>
  );
});

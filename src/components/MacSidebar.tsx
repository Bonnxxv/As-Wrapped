import React, { useState, useRef } from 'react';
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
  Upload
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
}

export const TikTokIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className}>
    <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.07-2.88-.52-4.13-1.32-.73-.47-1.35-1.07-1.78-1.81V17c-.02 1.62-.48 3.24-1.37 4.61C14 23.42 11.58 24.32 9.15 23.95c-2.43-.37-4.63-1.87-5.74-4.07C2.3 17.68 2.06 15.07 2.73 12.8c.67-2.28 2.4-4.17 4.63-4.96 1.17-.41 2.42-.51 3.65-.3v4.05c-.88-.23-1.85-.14-2.69.25-1.25.59-2.09 1.86-2.22 3.25-.13 1.38.47 2.77 1.51 3.62 1.05.85 2.5 1.06 3.73.55 1.23-.51 1.99-1.75 2.03-3.08.01-3.03.01-6.07.01-9.11 0-2.32.01-4.64.01-6.96z"/>
  </svg>
);

export const InstagramIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

export const MacSidebar: React.FC<MacSidebarProps> = ({
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
  onImportData
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onImportData(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const [collapsedYears, setCollapsedYears] = useState<Record<number, boolean>>({
    2026: false 
  });

  const [isAddingYear, setIsAddingYear] = useState(false);
  const [newYearInput, setNewYearInput] = useState('');

  const [editingPlatform, setEditingPlatform] = useState<PlatformType | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editFollowers, setEditFollowers] = useState(0);

  const toggleYearCollapse = (year: number) => {
    // If sidebar is collapsed, expanding a year should also open the sidebar for better UX
    if (isCollapsed) {
      onToggleCollapse();
    }
    setCollapsedYears(prev => ({
      ...prev,
      [year]: !prev[year]
    }));
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

  return (
    <div 
      className={`bg-mac-sidebar border-r border-mac-border/50 flex flex-col h-screen select-none relative z-10 text-sm transition-[width] duration-300 ease-in-out ${
        isCollapsed ? 'w-[52px]' : 'w-64'
      }`}
    >
      {/* 1. Header (macOS window draggable area) */}
      <div className={`h-12 flex items-center px-4 shrink-0 mt-2 ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}>
        <div className={`font-semibold text-mac-text whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
          Socmed Report
        </div>
        <button 
          onClick={onToggleCollapse}
          className="text-mac-muted hover:text-mac-text p-1 rounded-full hover:bg-mac-surface/80 mac-transition"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* 2. Navigation & Folders Container */}
      <div className={`flex-1 overflow-y-auto py-2 flex flex-col gap-6 overflow-x-hidden ${isCollapsed ? 'px-1.5' : 'px-3'}`}>
        
        {/* Main Tab Navigation */}
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => onSelectView('dashboard')}
            className={`w-full flex items-center rounded-full mac-transition text-left ${isCollapsed ? 'justify-center p-2' : 'gap-2 px-3 py-1.5'} ${
              activeView === 'dashboard'
                ? 'bg-mac-accent text-white shadow-sm font-medium'
                : 'text-mac-text hover:bg-mac-surface/80'
            }`}
            title={isCollapsed ? "Dashboard" : undefined}
          >
            <LayoutDashboard size={14} className={`shrink-0 ${activeView === 'dashboard' ? 'text-white' : 'text-mac-accent'}`} />
            <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'} ${activeView === 'dashboard' ? 'font-medium' : ''}`}>
              Dashboard
            </span>
          </button>
        </div>

        <div className="h-px bg-mac-border/50 mx-2" />

        {/* Platform Profiles */}
        <div className="flex flex-col gap-0.5">
          {!isCollapsed && <div className="text-[11px] font-semibold text-mac-muted px-2 mb-1 transition-opacity duration-300">ACCOUNT</div>}
          
          <div className="group relative">
            <button
              onClick={() => onSelectView('instagram')}
              className={`w-full flex items-center rounded-full mac-transition text-left ${isCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-1.5'} ${
                activeView === 'instagram'
                  ? 'bg-mac-accent text-white shadow-sm font-medium'
                  : 'text-mac-text hover:bg-mac-surface/80'
              }`}
              title={isCollapsed ? `Instagram (@${profiles.instagram.username})` : undefined}
            >
              <div className="flex items-center gap-2">
                <InstagramIcon size={14} className={`shrink-0 ${activeView === 'instagram' ? 'text-white' : 'text-pink-500'}`} />
                <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'} ${activeView === 'instagram' ? 'font-medium' : ''}`}>
                  @{profiles.instagram.username}
                </span>
              </div>
            </button>
            {!isCollapsed && (
              <button 
                onClick={(e) => { e.stopPropagation(); openEditProfile('instagram'); }}
                className={`absolute right-2 top-1.5 p-0.5 rounded-full mac-transition opacity-0 group-hover:opacity-100 ${
                  activeView === 'instagram' ? 'text-white/80 hover:text-white hover:bg-white/20' : 'text-mac-muted hover:text-mac-text hover:bg-mac-border/50'
                }`}
                title="Edit Profile"
              >
                <Edit size={12} />
              </button>
            )}
          </div>

          <div className="group relative">
            <button
              onClick={() => onSelectView('tiktok')}
              className={`w-full flex items-center rounded-full mac-transition text-left ${isCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-1.5'} ${
                activeView === 'tiktok'
                  ? 'bg-mac-accent text-white shadow-sm font-medium'
                  : 'text-mac-text hover:bg-mac-surface/80'
              }`}
              title={isCollapsed ? `TikTok (@${profiles.tiktok.username})` : undefined}
            >
              <div className="flex items-center gap-2">
                <TikTokIcon size={14} className={`shrink-0 ${activeView === 'tiktok' ? 'text-white' : 'text-cyan-400'}`} />
                <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'} ${activeView === 'tiktok' ? 'font-medium' : ''}`}>
                  @{profiles.tiktok.username}
                </span>
              </div>
            </button>
            {!isCollapsed && (
              <button 
                onClick={(e) => { e.stopPropagation(); openEditProfile('tiktok'); }}
                className={`absolute right-2 top-1.5 p-0.5 rounded-full mac-transition opacity-0 group-hover:opacity-100 ${
                  activeView === 'tiktok' ? 'text-white/80 hover:text-white hover:bg-white/20' : 'text-mac-muted hover:text-mac-text hover:bg-mac-border/50'
                }`}
                title="Edit Profile"
              >
                <Edit size={12} />
              </button>
            )}
          </div>
        </div>
        
        <div className="h-px bg-mac-border/50 mx-2" />

        {/* Year Folders Tree */}
        <div className="flex flex-col gap-0.5">
          {!isCollapsed && (
            <div className="flex items-center justify-between px-2 mb-1 transition-opacity duration-300">
              <span className="text-[11px] font-semibold text-mac-muted">FOLDERS</span>
              <button 
                onClick={() => setIsAddingYear(true)}
                className="text-mac-muted hover:text-mac-text mac-transition"
                title="Tambah Tahun"
              >
                <Plus size={14} />
              </button>
            </div>
          )}
          {isCollapsed && (
             <div className="flex justify-center mb-1">
                <button 
                  onClick={() => {
                    onToggleCollapse();
                    setIsAddingYear(true);
                  }}
                  className="text-mac-muted hover:text-mac-text p-1 mac-transition"
                  title="Tambah Tahun"
                >
                  <Plus size={14} />
                </button>
             </div>
          )}

          <div className="flex flex-col gap-0.5">
            {years.map(year => {
              const isOpen = collapsedYears[year] === false;
              // If collapsed, we might just show a folder icon for the year, or we can hide the tree entirely to keep it clean, but let's show the year as an icon.
              return (
                <div key={year} className="flex flex-col">
                  {/* Year Folder Header */}
                  <div className="group relative">
                    <button
                      onClick={() => toggleYearCollapse(year)}
                      className={`w-full flex items-center rounded-full hover:bg-mac-surface/80 text-left mac-transition text-mac-text ${isCollapsed ? 'justify-center p-2' : 'gap-1.5 px-3 py-1.5'}`}
                      title={isCollapsed ? `Folder ${year}` : undefined}
                    >
                      {!isCollapsed && (
                        <span className="text-mac-muted shrink-0">
                          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </span>
                      )}
                      <span className="text-mac-accent shrink-0">
                        {isOpen && !isCollapsed ? <FolderOpen size={14} /> : <Folder size={14} />}
                      </span>
                      <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                        {year}
                      </span>
                    </button>
                    {!isCollapsed && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteYear(year); }}
                        className="absolute right-2 top-1.5 p-0.5 opacity-0 group-hover:opacity-100 text-mac-muted hover:text-red-500 hover:bg-mac-border/50 rounded-full mac-transition"
                        title="Hapus Tahun"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>

                  {/* Months inside year */}
                  {isOpen && !isCollapsed && (
                    <div className="pl-6 flex flex-col gap-0.5 mt-0.5">
                      {MONTH_NAMES.map((mName, mIdx) => {
                        const isActive = activeView === 'folder' && selectedYear === year && selectedMonth === mIdx;
                        return (
                          <button
                            key={mIdx}
                            onClick={() => onSelectView('folder', year, mIdx)}
                            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-full text-left mac-transition ${
                              isActive
                                ? 'bg-mac-accent text-white shadow-sm font-medium'
                                : 'text-mac-text hover:bg-mac-surface/80'
                            }`}
                          >
                            <Folder size={14} className={`shrink-0 ${isActive ? 'text-white' : 'text-mac-accent'}`} />
                            <span className={`whitespace-nowrap overflow-hidden ${isActive ? 'font-medium' : ''}`}>{mName}</span>
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
      </div>

      {/* Backup & Restore Section (Pinned at Bottom) */}
      <div className={`shrink-0 border-t border-mac-border/30 py-3 flex flex-col gap-1.5 overflow-hidden ${isCollapsed ? 'px-1.5 items-center' : 'px-3'}`}>
        {!isCollapsed && (
          <div className="text-[10px] font-semibold text-mac-muted uppercase tracking-wider px-2 select-none mb-1">
            System
          </div>
        )}
        
        <div className={`flex w-full ${isCollapsed ? 'flex-col gap-2' : 'gap-2 px-1'}`}>
          <button
            onClick={onExportData}
            className={`flex items-center text-xs font-semibold text-mac-text rounded-full border border-mac-border/80 bg-mac-surface/40 hover:bg-mac-surface/80 hover:border-mac-border shadow-sm mac-transition cursor-pointer ${
              isCollapsed ? 'p-2 justify-center w-8 h-8' : 'flex-1 gap-1.5 px-3 py-1.5 justify-center'
            }`}
            title={isCollapsed ? "Ekspor Backup" : "Ekspor data ke file cadangan JSON"}
          >
            <Upload size={12} className="text-mac-accent shrink-0" />
            {!isCollapsed && <span>Export</span>}
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center text-xs font-semibold text-mac-text rounded-full border border-mac-border/80 bg-mac-surface/40 hover:bg-mac-surface/80 hover:border-mac-border shadow-sm mac-transition cursor-pointer ${
              isCollapsed ? 'p-2 justify-center w-8 h-8' : 'flex-1 gap-1.5 px-3 py-1.5 justify-center'
            }`}
            title={isCollapsed ? "Impor Backup" : "Impor data dari file cadangan JSON"}
          >
            <Download size={12} className="text-mac-accent shrink-0" />
            {!isCollapsed && <span>Import</span>}
          </button>
        </div>

        {/* Hidden File Input for Import (Using opacity and absolute position to bypass WebKit click blocks) */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          className="absolute w-0 h-0 opacity-0 pointer-events-none"
        />
      </div>

      {/* 4. inline Add Year Panel */}
      {isAddingYear && (
        <div className="fixed inset-0 mac-backdrop flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <form onSubmit={handleAddYearSubmit} className="bg-mac-panel border border-mac-border shadow-2xl p-5 w-full max-w-[220px] flex flex-col gap-4 rounded-2xl mac-spring-popup select-none">
            <div className="flex items-center justify-between border-b border-mac-border/30 pb-2">
              <span className="text-xs font-bold text-mac-text">Add Year Folder</span>
              <button type="button" onClick={() => setIsAddingYear(false)} className="text-mac-muted hover:text-mac-text rounded-full p-0.5 hover:bg-mac-surface mac-transition cursor-pointer">
                <X size={14} />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-mac-muted font-bold uppercase tracking-wider">Year Value</label>
              <input 
                type="number"
                placeholder="e.g. 2031"
                value={newYearInput}
                onChange={e => setNewYearInput(e.target.value)}
                className="bg-mac-canvas border border-mac-border rounded-lg px-3 py-2 text-sm text-mac-text outline-none focus:border-mac-accent focus:ring-1 focus:ring-mac-accent/20 mac-transition w-full text-left h-10"
                autoFocus
              />
            </div>
            <button 
              type="submit" 
              className="w-full py-2 rounded-full bg-mac-accent text-white hover:bg-mac-accentHover font-bold mac-transition cursor-pointer text-xs shadow-sm"
            >
              Create Folder
            </button>
          </form>
        </div>
      )}

      {/* 5. Update Profile Modal */}
      {editingPlatform && (
        <div className="fixed inset-0 mac-backdrop flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <form onSubmit={handleSaveProfile} className="bg-mac-panel border border-mac-border shadow-2xl p-5 w-full max-w-[250px] flex flex-col gap-4 rounded-2xl mac-spring-popup select-none">
            <div className="flex items-center justify-between border-b border-mac-border/30 pb-2">
              <span className="text-xs font-bold text-mac-text flex items-center gap-1.5">
                Edit {editingPlatform === 'instagram' ? 'Instagram' : 'TikTok'} Profile
              </span>
              <button type="button" onClick={() => setEditingPlatform(null)} className="text-mac-muted hover:text-mac-text rounded-full p-0.5 hover:bg-mac-surface mac-transition cursor-pointer">
                <X size={14} />
              </button>
            </div>

            <div className="flex flex-col gap-3.5 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-mac-muted font-bold uppercase tracking-wider">Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-mac-muted font-semibold">@</span>
                  <input 
                    type="text" 
                    value={editUsername}
                    onChange={e => setEditUsername(e.target.value)}
                    className="bg-mac-canvas border border-mac-border rounded-lg pl-7 pr-3 py-2 text-sm text-mac-text outline-none focus:border-mac-accent focus:ring-1 focus:ring-mac-accent/20 mac-transition w-full h-10"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-mac-muted font-bold uppercase tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  value={editFullName}
                  onChange={e => setEditFullName(e.target.value)}
                  className="bg-mac-canvas border border-mac-border rounded-lg px-3 py-2 text-sm text-mac-text outline-none focus:border-mac-accent focus:ring-1 focus:ring-mac-accent/20 mac-transition w-full h-10"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-mac-muted font-bold uppercase tracking-wider">Followers</label>
                <input 
                  type="number" 
                  value={editFollowers}
                  onChange={e => setEditFollowers(parseInt(e.target.value) || 0)}
                  className="bg-mac-canvas border border-mac-border rounded-lg px-3 py-2 text-sm text-mac-text outline-none focus:border-mac-accent focus:ring-1 focus:ring-mac-accent/20 mac-transition w-full h-10"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 text-xs pt-2 border-t border-mac-border/30">
              <button 
                type="button" 
                onClick={() => setEditingPlatform(null)} 
                className="flex-1 py-2 rounded-full bg-mac-surface hover:bg-mac-surface/80 text-mac-text font-bold mac-transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex-1 py-2 rounded-full bg-mac-accent text-white hover:bg-mac-accentHover font-bold mac-transition cursor-pointer shadow-sm"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

import React, { useState } from 'react';
import { 
  Plus,
  Trash2, 
  Edit3, 
  FolderOpen, 
  Sparkles,
  Search,
  Sun,
  Moon
} from 'lucide-react';
import { ContentEntry } from '../types';
import { MONTH_NAMES } from '../utils/initialState';
import { TikTokIcon, InstagramIcon } from './MacSidebar';

interface MonthFolderViewProps {
  year: number;
  monthIndex: number;
  contents: ContentEntry[];
  onAddContentClick: () => void;
  onEditContentClick: (entry: ContentEntry) => void;
  onDeleteContent: (id: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const MonthFolderView: React.FC<MonthFolderViewProps> = ({
  year,
  monthIndex,
  contents,
  onAddContentClick,
  onEditContentClick,
  onDeleteContent,
  isDarkMode,
  onToggleTheme
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState<'none' | 'instagram' | 'tiktok' | 'fyp'>('none');

  const fmtFull = (n: number) => {
    return n.toLocaleString('id-ID');
  };

  const filteredContents = contents.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getGroupedData = () => {
    if (groupBy === 'none') {
      return [{ title: 'All Content', items: filteredContents }];
    }

    if (groupBy === 'fyp') {
      const fypItems = filteredContents.filter(item => item.instagram.views > 20000 || item.tiktok.views > 20000);
      const regularItems = filteredContents.filter(item => !(item.instagram.views > 20000 || item.tiktok.views > 20000));
      const groups = [];
      if (fypItems.length > 0) {
        groups.push({ title: '🌟 FYP Hits (Views > 20K)', items: fypItems });
      }
      if (regularItems.length > 0) {
        groups.push({ title: '📁 Regular Content', items: regularItems });
      }
      return groups;
    }

    if (groupBy === 'instagram') {
      const activeItems = filteredContents.filter(item => item.instagram.views > 0);
      const inactiveItems = filteredContents.filter(item => item.instagram.views === 0);
      const groups = [];
      if (activeItems.length > 0) {
        groups.push({ title: '📸 Instagram Active', items: activeItems });
      }
      if (inactiveItems.length > 0) {
        groups.push({ title: '💨 Instagram Inactive', items: inactiveItems });
      }
      return groups;
    }

    if (groupBy === 'tiktok') {
      const activeItems = filteredContents.filter(item => item.tiktok.views > 0);
      const inactiveItems = filteredContents.filter(item => item.tiktok.views === 0);
      const groups = [];
      if (activeItems.length > 0) {
        groups.push({ title: '🎵 TikTok Active', items: activeItems });
      }
      if (inactiveItems.length > 0) {
        groups.push({ title: '💨 TikTok Inactive', items: inactiveItems });
      }
      return groups;
    }

    return [];
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-mac-canvas text-mac-text">
      
      {/* Top Toolbar (macOS Style) */}
      <div className="flex flex-wrap sm:flex-nowrap gap-4 items-center justify-between py-2 px-6 shrink-0 border-b border-mac-border/50">
        <div className="flex items-center gap-2">
          <FolderOpen className="text-mac-accent" size={16} />
          <h1 className="text-sm font-semibold text-mac-text">
            {MONTH_NAMES[monthIndex]} {year}
          </h1>
          <span className="ml-2 font-medium text-mac-muted text-xs">
            {contents.length} items
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onAddContentClick}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-mac-text hover:opacity-90 text-mac-canvas text-[11px] font-bold rounded-full mac-transition"
          >
            <Plus size={12} />
            New Content
          </button>

          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-full bg-mac-surface hover:bg-mac-border/50 border border-mac-border text-mac-text mac-transition"
            title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {isDarkMode ? <Sun size={14} className="text-mac-text" /> : <Moon size={14} className="text-mac-text" />}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-6 py-2 border-b border-mac-border/50 flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1.5 text-mac-muted" size={12} />
          <input
            type="text"
            placeholder="Search content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-mac-surface/40 hover:bg-mac-surface/80 focus:bg-mac-surface border border-mac-border/50 rounded-full pl-7 pr-3 py-1.5 text-xs text-mac-text outline-none focus:border-mac-accent focus:ring-1 focus:ring-mac-accent/20 mac-transition placeholder-mac-muted h-9"
          />
        </div>

        {/* macOS Style Segmented Control for Group By */}
        <div className="flex items-center gap-2 mt-2 sm:mt-0 select-none">
          <span className="text-[10px] font-semibold text-mac-muted uppercase tracking-wider">Group By:</span>
          <div className="flex bg-mac-surface border border-mac-border/80 rounded-full p-0.5 shadow-sm">
            {(['none', 'instagram', 'tiktok', 'fyp'] as const).map((type) => {
              const isActive = groupBy === type;
              const label = type === 'none' ? 'None' : type === 'fyp' ? 'FYP' : type === 'instagram' ? 'Instagram' : 'TikTok';
              return (
                <button
                  key={type}
                  onClick={() => setGroupBy(type)}
                  type="button"
                  className={`px-3 py-1 text-[11px] font-bold rounded-full mac-transition cursor-pointer ${
                    isActive 
                      ? 'bg-mac-text text-mac-canvas shadow-sm' 
                      : 'text-mac-text hover:bg-mac-border/30'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {filteredContents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-mac-muted gap-3 py-10">
            <FolderOpen size={40} className="opacity-20" />
            <div className="text-center">
              <p className="text-sm font-semibold text-mac-text">Empty Folder</p>
              <p className="text-xs text-mac-muted mt-1 max-w-[280px]">
                {contents.length === 0 
                  ? 'No content has been added to this month yet.'
                  : 'No content matches your search.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs select-none">
              
              <thead>
                <tr className="text-mac-muted uppercase font-semibold tracking-wider text-[10px]">
                  <th className="py-2 px-4 text-center w-12 border-b border-mac-border/50">Day</th>
                  <th className="py-2 px-4 min-w-[200px] border-b border-mac-border/50">Title</th>
                  <th className="py-2 px-2 text-center w-12 border-b border-mac-border/50">App</th>
                  <th className="py-2 px-3 text-right border-b border-mac-border/50">Views</th>
                  <th className="py-2 px-3 text-right border-b border-mac-border/50">Likes</th>
                  <th className="py-2 px-3 text-right border-b border-mac-border/50">Comments</th>
                  <th className="py-2 px-3 text-right border-b border-mac-border/50">Saves</th>
                  <th className="py-2 px-3 text-right border-b border-mac-border/50">Shares</th>
                  <th className="py-2 px-4 text-center w-20 border-b border-mac-border/50">Badge</th>
                  <th className="py-2 px-4 text-center w-20 border-b border-mac-border/50">Actions</th>
                </tr>
              </thead>

              {getGroupedData().map((group) => (
                <React.Fragment key={group.title}>
                  {groupBy !== 'none' && (
                    <tbody className="bg-mac-surface/20 border-y border-mac-border/20">
                      <tr>
                        <td colSpan={10} className="py-2 px-4 font-bold text-mac-accent text-[10px] uppercase tracking-wider align-middle">
                          {group.title} ({group.items.length} items)
                        </td>
                      </tr>
                    </tbody>
                  )}
                  {group.items.map((item) => {
                    const showIg = groupBy === 'none' || groupBy === 'instagram' || (groupBy === 'fyp' && item.instagram.views > 20000);
                    const showTt = groupBy === 'none' || groupBy === 'tiktok' || (groupBy === 'fyp' && item.tiktok.views > 20000);
                    const rowCount = (showIg ? 1 : 0) + (showTt ? 1 : 0);

                    const igFyp = item.instagram.views > 20000;
                    const ttFyp = item.tiktok.views > 20000;

                    if (rowCount === 0) return null;

                    return (
                      <tbody key={item.id} className="group border-b border-mac-border/30 hover:bg-mac-surface/40 mac-transition">
                        {/* INSTAGRAM ROW */}
                        {showIg && (
                          <tr>
                            <td rowSpan={rowCount} className="py-3 px-4 text-center text-mac-muted font-medium align-middle">{item.day}</td>
                            <td rowSpan={rowCount} className="py-3 px-4 font-medium text-mac-text truncate max-w-[200px] align-middle">{item.title}</td>
                            
                            <td className="py-3 px-2 text-center border-b border-mac-border/10">
                              <InstagramIcon size={14} className="text-pink-500 mx-auto" />
                            </td>
                            <td className="py-3 px-3 text-right text-mac-text font-medium border-b border-mac-border/10">{fmtFull(item.instagram.views)}</td>
                            <td className="py-3 px-3 text-right text-mac-text font-medium border-b border-mac-border/10">{fmtFull(item.instagram.likes)}</td>
                            <td className="py-3 px-3 text-right text-mac-text font-medium border-b border-mac-border/10">{fmtFull(item.instagram.comments)}</td>
                            <td className="py-3 px-3 text-right text-mac-text font-medium border-b border-mac-border/10">{fmtFull(item.instagram.saves)}</td>
                            <td className="py-3 px-3 text-right text-mac-text font-medium border-b border-mac-border/10">{fmtFull(item.instagram.shares)}</td>
                            <td className="py-3 px-4 text-center border-b border-mac-border/10">
                              {igFyp ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-bold uppercase tracking-wider"><Sparkles size={8} /> FYP</span> : <span className="text-mac-muted/40 text-[10px]">-</span>}
                            </td>
                            
                            <td rowSpan={rowCount} className="py-3 px-4 text-center align-middle">
                              <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 mac-transition">
                                <button
                                  onClick={() => onEditContentClick(item)}
                                  className="p-1 text-mac-muted hover:text-mac-text hover:bg-mac-border/50 rounded-full mac-transition"
                                  title="Edit"
                                >
                                  <Edit3 size={12} />
                                </button>
                                <button
                                  onClick={() => onDeleteContent(item.id)}
                                  className="p-1 text-mac-muted hover:text-red-500 hover:bg-red-500/10 rounded-full mac-transition"
                                  title="Delete"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}

                        {/* TIKTOK ROW */}
                        {showTt && (
                          <tr>
                            {!showIg && (
                              <>
                                <td className="py-3 px-4 text-center text-mac-muted font-medium align-middle">{item.day}</td>
                                <td className="py-3 px-4 font-medium text-mac-text truncate max-w-[200px] align-middle">{item.title}</td>
                              </>
                            )}
                            
                            <td className="py-3 px-2 text-center">
                              <TikTokIcon size={14} className="text-cyan-400 mx-auto" />
                            </td>
                            <td className="py-3 px-3 text-right text-mac-text font-medium">{fmtFull(item.tiktok.views)}</td>
                            <td className="py-3 px-3 text-right text-mac-text font-medium">{fmtFull(item.tiktok.likes)}</td>
                            <td className="py-3 px-3 text-right text-mac-text font-medium">{fmtFull(item.tiktok.comments)}</td>
                            <td className="py-3 px-3 text-right text-mac-text font-medium">{fmtFull(item.tiktok.saves)}</td>
                            <td className="py-3 px-3 text-right text-mac-text font-medium">{fmtFull(item.tiktok.shares)}</td>
                            <td className="py-3 px-4 text-center">
                              {ttFyp ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-bold uppercase tracking-wider"><Sparkles size={8} /> FYP</span> : <span className="text-mac-muted/40 text-[10px]">-</span>}
                            </td>

                            {!showIg && (
                              <td className="py-3 px-4 text-center align-middle">
                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 mac-transition">
                                  <button
                                    onClick={() => onEditContentClick(item)}
                                    className="p-1 text-mac-muted hover:text-mac-text hover:bg-mac-border/50 rounded-full mac-transition"
                                    title="Edit"
                                  >
                                    <Edit3 size={12} />
                                  </button>
                                  <button
                                    onClick={() => onDeleteContent(item.id)}
                                    className="p-1 text-mac-muted hover:text-red-500 hover:bg-red-500/10 rounded-full mac-transition"
                                    title="Delete"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        )}
                      </tbody>
                    );
                  })}
                </React.Fragment>
              ))}

            </table>
          </div>
        )}
      </div>
    </div>
  );
};

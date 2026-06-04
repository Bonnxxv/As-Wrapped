import React, { useState } from 'react';
import { 
  Plus,
  Trash2, 
  Edit3, 
  FolderOpen, 
  Sparkles,
  Search
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
}

export const MonthFolderView: React.FC<MonthFolderViewProps> = ({
  year,
  monthIndex,
  contents,
  onAddContentClick,
  onEditContentClick,
  onDeleteContent
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState<'none' | 'instagram' | 'tiktok' | 'fyp'>('none');

  const fmtFull = (n: number) => n.toLocaleString('id-ID');

  const filteredContents = contents.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getGroupedData = () => {
    if (groupBy === 'none') return [{ title: 'All Content', items: filteredContents }];

    if (groupBy === 'fyp') {
      const fypItems = filteredContents.filter(item => item.instagram.views > 20000 || item.tiktok.views > 20000);
      const regularItems = filteredContents.filter(item => !(item.instagram.views > 20000 || item.tiktok.views > 20000));
      const groups = [];
      if (fypItems.length > 0) groups.push({ title: '🌟 FYP Hits (Views > 20K)', items: fypItems });
      if (regularItems.length > 0) groups.push({ title: '📁 Regular Content', items: regularItems });
      return groups;
    }

    if (groupBy === 'instagram') {
      const activeItems = filteredContents.filter(item => item.instagram.views > 0);
      const inactiveItems = filteredContents.filter(item => item.instagram.views === 0);
      const groups = [];
      if (activeItems.length > 0) groups.push({ title: '📸 Instagram Active', items: activeItems });
      if (inactiveItems.length > 0) groups.push({ title: '💨 Instagram Inactive', items: inactiveItems });
      return groups;
    }

    if (groupBy === 'tiktok') {
      const activeItems = filteredContents.filter(item => item.tiktok.views > 0);
      const inactiveItems = filteredContents.filter(item => item.tiktok.views === 0);
      const groups = [];
      if (activeItems.length > 0) groups.push({ title: '🎵 TikTok Active', items: activeItems });
      if (inactiveItems.length > 0) groups.push({ title: '💨 TikTok Inactive', items: inactiveItems });
      return groups;
    }

    return [];
  };

  const filterOptions: { key: typeof groupBy; label: string }[] = [
    { key: 'none', label: 'All' },
    { key: 'instagram', label: 'Instagram' },
    { key: 'tiktok', label: 'TikTok' },
    { key: 'fyp', label: 'FYP' },
  ];

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[color:var(--md-sys-color-background)] text-[color:var(--md-sys-color-on-surface)]">

      {/* ── Top Toolbar ──────────────── */}
      <div className="
        flex flex-wrap sm:flex-nowrap items-center justify-between gap-4
        px-8 py-4 shrink-0
        border-b border-[color:var(--md-sys-color-outline-variant)]
        bg-[color:var(--md-sys-color-surface)]
      ">
        {/* Left: Breadcrumb / Title */}
        <div className="flex items-center gap-3">
          <FolderOpen size={20} className="text-[color:var(--md-sys-color-primary)] shrink-0" />
          <div>
            <h1
              className="text-[16px] font-semibold leading-tight text-[color:var(--md-sys-color-on-surface)]"
              style={{ fontFamily: "'Google Sans Display', sans-serif" }}
            >
              {MONTH_NAMES[monthIndex]} {year}
            </h1>
            <p className="text-[12px] text-[color:var(--md-sys-color-on-surface-variant)] mt-0.5">
              {contents.length} {contents.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onAddContentClick}
            className="gai-btn-filled gap-2"
          >
            <Plus size={14} />
            <span>New Content</span>
          </button>
        </div>
      </div>

      {/* ── Filter + Search Bar ──────── */}
      <div className="
        flex flex-col sm:flex-row items-center gap-4
        px-8 py-3 shrink-0
        border-b border-[color:var(--md-sys-color-outline-variant)]
        bg-[color:var(--md-sys-color-surface)]
      ">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--md-sys-color-on-surface-variant)]" size={15} />
          <input
            type="text"
            placeholder="Search content…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="
              w-full h-10 pl-11 pr-4
              bg-[color:var(--md-sys-color-surface-container)]
              border border-[color:var(--md-sys-color-outline-variant)]
              rounded-full text-sm
              text-[color:var(--md-sys-color-on-surface)]
              placeholder:text-[color:var(--md-sys-color-on-surface-variant)]
              outline-none transition-[border-color] duration-150
              focus:border-[color:var(--md-sys-color-primary)] focus:border-2
            "
          />
        </div>

        {/* Group-by filter chips */}
        <div className="flex items-center gap-2 select-none">
          <span className="md-label-medium text-[color:var(--md-sys-color-on-surface-variant)] whitespace-nowrap">Group by:</span>
          <div className="flex gap-1.5">
            {filterOptions.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setGroupBy(key)}
                type="button"
                className={`md-chip ${groupBy === key ? 'active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Table Content ─────────────── */}
      <div className="flex-1 overflow-y-auto px-8 py-6 bg-[color:var(--md-sys-color-background)]">
        {filteredContents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 py-16">
            <FolderOpen size={48} className="text-[color:var(--md-sys-color-primary)] opacity-20" />
            <div className="text-center">
              <p className="md-title-medium text-[color:var(--md-sys-color-on-surface)]">Empty Folder</p>
              <p className="md-body-medium text-[color:var(--md-sys-color-on-surface-variant)] mt-1 max-w-[280px]">
                {contents.length === 0
                  ? 'No content has been added to this month yet.'
                  : 'No content matches your search.'}
              </p>
            </div>
            {contents.length === 0 && (
              <button onClick={onAddContentClick} className="gai-btn-tonal gap-2 mt-2">
                <Plus size={14} />
                Add First Content
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-[color:var(--md-sys-color-outline-variant)] shadow-[var(--md-elevation-1)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs select-none">

              {/* Head */}
              <thead>
                <tr className="bg-[color:var(--md-sys-color-surface-container)]">
                  <th className="py-4 px-4 text-center w-12 border-b border-[color:var(--md-sys-color-outline-variant)]">
                    <span className="md-label-small text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-widest">Day</span>
                  </th>
                  <th className="py-4 px-4 min-w-[200px] border-b border-[color:var(--md-sys-color-outline-variant)]">
                    <span className="md-label-small text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-widest">Title</span>
                  </th>
                  <th className="py-4 px-3 text-center w-12 border-b border-[color:var(--md-sys-color-outline-variant)]">
                    <span className="md-label-small text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-widest">App</span>
                  </th>
                  <th className="py-4 px-4 text-right border-b border-[color:var(--md-sys-color-outline-variant)]">
                    <span className="md-label-small text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-widest">Views</span>
                  </th>
                  <th className="py-4 px-4 text-right border-b border-[color:var(--md-sys-color-outline-variant)]">
                    <span className="md-label-small text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-widest">Likes</span>
                  </th>
                  <th className="py-4 px-4 text-right border-b border-[color:var(--md-sys-color-outline-variant)]">
                    <span className="md-label-small text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-widest">Comments</span>
                  </th>
                  <th className="py-4 px-4 text-right border-b border-[color:var(--md-sys-color-outline-variant)]">
                    <span className="md-label-small text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-widest">Saves</span>
                  </th>
                  <th className="py-4 px-4 text-right border-b border-[color:var(--md-sys-color-outline-variant)]">
                    <span className="md-label-small text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-widest">Shares</span>
                  </th>
                  <th className="py-4 px-4 text-center w-20 border-b border-[color:var(--md-sys-color-outline-variant)]">
                    <span className="md-label-small text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-widest">Badge</span>
                  </th>
                  <th className="py-4 px-4 text-center w-20 border-b border-[color:var(--md-sys-color-outline-variant)]">
                    <span className="md-label-small text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-widest">Actions</span>
                  </th>
                </tr>
              </thead>

              {getGroupedData().map((group) => (
                <React.Fragment key={group.title}>
                  {/* Group Header */}
                  {groupBy !== 'none' && (
                    <tbody>
                      <tr className="bg-[color:var(--md-sys-color-surface-container-high)]">
                        <td colSpan={10} className="py-2.5 px-5">
                          <span className="md-label-medium text-[color:var(--md-sys-color-primary)] uppercase tracking-[.5px]">
                            {group.title} ({group.items.length})
                          </span>
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

                    const rowBase = 'transition-colors duration-100';
                    const rowHover = 'hover:bg-[color:var(--md-sys-color-surface-container)]';

                    return (
                      <tbody key={item.id} className={`group border-b border-[color:var(--md-sys-color-outline-variant)] bg-[color:var(--md-sys-color-surface)] ${rowHover}`}>

                        {/* Instagram row */}
                        {showIg && (
                          <tr className={`${rowBase} text-[color:var(--md-sys-color-on-surface)]`}>
                            <td rowSpan={rowCount} className="py-4 px-4 text-center font-semibold text-[color:var(--md-sys-color-on-surface-variant)] align-middle border-r border-[color:var(--md-sys-color-outline-variant)]/40">
                              {item.day}
                            </td>
                            <td rowSpan={rowCount} className="py-4 px-4 font-semibold text-[color:var(--md-sys-color-on-surface)] align-middle truncate max-w-[200px] border-r border-[color:var(--md-sys-color-outline-variant)]/40 group-hover:text-[color:var(--md-sys-color-primary)] transition-colors duration-150">
                              {item.title}
                            </td>

                            <td className="py-4 px-3 text-center border-b border-[color:var(--md-sys-color-outline-variant)]/30">
                              <InstagramIcon size={15} className="mx-auto" />
                            </td>
                            <td className="py-4 px-4 text-right tabular-nums border-b border-[color:var(--md-sys-color-outline-variant)]/30">{fmtFull(item.instagram.views)}</td>
                            <td className="py-4 px-4 text-right tabular-nums border-b border-[color:var(--md-sys-color-outline-variant)]/30">{fmtFull(item.instagram.likes)}</td>
                            <td className="py-4 px-4 text-right tabular-nums border-b border-[color:var(--md-sys-color-outline-variant)]/30">{fmtFull(item.instagram.comments)}</td>
                            <td className="py-4 px-4 text-right tabular-nums border-b border-[color:var(--md-sys-color-outline-variant)]/30">{fmtFull(item.instagram.saves)}</td>
                            <td className="py-4 px-4 text-right tabular-nums border-b border-[color:var(--md-sys-color-outline-variant)]/30">{fmtFull(item.instagram.shares)}</td>
                            <td className="py-4 px-4 text-center border-b border-[color:var(--md-sys-color-outline-variant)]/30">
                              {igFyp
                                ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[color:var(--md-sys-color-yellow-container)] text-[color:var(--md-sys-color-on-yellow-container)] text-[12px] font-semibold"><Sparkles size={11} /> FYP</span>
                                : <span className="text-[color:var(--md-sys-color-outline)]/40 text-[12px]">—</span>
                              }
                            </td>

                            <td rowSpan={rowCount} className="py-4 px-4 text-center align-middle border-l border-[color:var(--md-sys-color-outline-variant)]/40">
                              <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                <button
                                  onClick={() => onEditContentClick(item)}
                                  className="md-icon-btn-sm hover:text-[color:var(--md-sys-color-primary)]"
                                  title="Edit"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  onClick={() => onDeleteContent(item.id)}
                                  className="md-icon-btn-sm hover:text-red-500 hover:bg-red-500/10"
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}

                        {/* TikTok row */}
                        {showTt && (
                          <tr className={`${rowBase} text-[color:var(--md-sys-color-on-surface)]`}>
                            {!showIg && (
                              <>
                                <td className="py-4 px-4 text-center font-semibold text-[color:var(--md-sys-color-on-surface-variant)] align-middle border-r border-[color:var(--md-sys-color-outline-variant)]/40">
                                  {item.day}
                                </td>
                                <td className="py-4 px-4 font-semibold text-[color:var(--md-sys-color-on-surface)] align-middle truncate max-w-[200px] border-r border-[color:var(--md-sys-color-outline-variant)]/40 group-hover:text-[color:var(--md-sys-color-primary)] transition-colors duration-150">
                                  {item.title}
                                </td>
                              </>
                            )}
                            <td className="py-4 px-3 text-center">
                              <TikTokIcon size={15} className="mx-auto" />
                            </td>
                            <td className="py-4 px-4 text-right tabular-nums">{fmtFull(item.tiktok.views)}</td>
                            <td className="py-4 px-4 text-right tabular-nums">{fmtFull(item.tiktok.likes)}</td>
                            <td className="py-4 px-4 text-right tabular-nums">{fmtFull(item.tiktok.comments)}</td>
                            <td className="py-4 px-4 text-right tabular-nums">{fmtFull(item.tiktok.saves)}</td>
                            <td className="py-4 px-4 text-right tabular-nums">{fmtFull(item.tiktok.shares)}</td>
                            <td className="py-4 px-4 text-center">
                              {ttFyp
                                ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[color:var(--md-sys-color-yellow-container)] text-[color:var(--md-sys-color-on-yellow-container)] text-[12px] font-semibold"><Sparkles size={11} /> FYP</span>
                                : <span className="text-[color:var(--md-sys-color-outline)]/40 text-[12px]">—</span>
                              }
                            </td>
                            {!showIg && (
                              <td className="py-4 px-4 text-center align-middle border-l border-[color:var(--md-sys-color-outline-variant)]/40">
                                <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                  <button
                                    onClick={() => onEditContentClick(item)}
                                    className="md-icon-btn-sm hover:text-[color:var(--md-sys-color-primary)]"
                                    title="Edit"
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                  <button
                                    onClick={() => onDeleteContent(item.id)}
                                    className="md-icon-btn-sm hover:text-red-500 hover:bg-red-500/10"
                                    title="Delete"
                                  >
                                    <Trash2 size={14} />
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
        </div>
      )}
      </div>
    </div>
  );
};

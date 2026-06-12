// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  TrendingUp, 
  FileText
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { ContentEntry } from '../types';
import { MONTH_NAMES } from '../utils/initialState';
import { InstagramIcon, TikTokIcon } from './MacSidebar';

interface UnifiedWorkspaceProps {
  entries: ContentEntry[];
  onAddContent: () => void;
  onEditContent: (entry: ContentEntry) => void;
  onDeleteContent: (id: string) => void;
  onSaveInlineContent: (id: string, entry: Omit<ContentEntry, 'id'>) => void;
  onGenerateReport: (periodType: 'month' | 'year') => void;
  // Filters passed from Sidebar or managed locally
  filterType: 'all' | 'year' | 'month' | 'custom';
  filterYear: number;
  filterMonth: number;
  customStartDate: string;
  customEndDate: string;
}

export const UnifiedWorkspace: React.FC<UnifiedWorkspaceProps> = ({
  entries,
  onAddContent,
  onEditContent,
  onDeleteContent,
  onSaveInlineContent,
  onGenerateReport,
  filterType,
  filterYear,
  filterMonth,
  customStartDate,
  customEndDate
}) => {
  // Inline editing state
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [inlineTitle, setInlineTitle] = useState('');
  const [inlineTimestamp, setInlineTimestamp] = useState('');
  const [inlineIgViews, setInlineIgViews] = useState(0);
  const [inlineIgLikes, setInlineIgLikes] = useState(0);
  const [inlineTtViews, setInlineTtViews] = useState(0);
  const [inlineTtLikes, setInlineTtLikes] = useState(0);

  // Filter entries based on the global sidebar filter selections
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const date = new Date(entry.timestamp);
      const year = date.getFullYear();
      const month = date.getMonth();

      if (filterType === 'all') {
        return true;
      }
      if (filterType === 'year') {
        return year === filterYear;
      }
      if (filterType === 'month') {
        return year === filterYear && month === filterMonth;
      }
      if (filterType === 'custom') {
        const entryTime = entry.timestamp;
        const start = customStartDate ? new Date(customStartDate).getTime() : 0;
        const end = customEndDate ? new Date(customEndDate).getTime() + 86400000 : Infinity; // Include full end day
        return entryTime >= start && entryTime <= end;
      }
      return true;
    });
  }, [entries, filterType, filterYear, filterMonth, customStartDate, customEndDate]);

  // Aggregate Metrics over filtered entries
  const metrics = useMemo(() => {
    let igViews = 0, igLikes = 0, igComments = 0, igSaves = 0, igShares = 0;
    let ttViews = 0, ttLikes = 0, ttComments = 0, ttSaves = 0, ttShares = 0;

    filteredEntries.forEach(e => {
      igViews += e.instagram.views;
      igLikes += e.instagram.likes;
      igComments += e.instagram.comments;
      igSaves += e.instagram.saves;
      igShares += e.instagram.shares;

      ttViews += e.tiktok.views;
      ttLikes += e.tiktok.likes;
      ttComments += e.tiktok.comments;
      ttSaves += e.tiktok.saves;
      ttShares += e.tiktok.shares;
    });

    const totalViews = igViews + ttViews;
    const totalEngagement = igLikes + igComments + igSaves + igShares + ttLikes + ttComments + ttSaves + ttShares;
    const er = totalViews > 0 ? ((totalEngagement / totalViews) * 100).toFixed(2) : '0.00';

    return {
      totalViews,
      totalLikes: igLikes + ttLikes,
      totalEngagement,
      engagementRate: er,
      ig: { views: igViews, likes: igLikes },
      tt: { views: ttViews, likes: ttLikes }
    };
  }, [filteredEntries]);

  // Prepare chart data for Recharts (Chronological views trend)
  const chartData = useMemo(() => {
    // Reverse filteredEntries to get chronological order (oldest to newest)
    const chronoEntries = [...filteredEntries].reverse();
    return chronoEntries.map(entry => {
      const d = new Date(entry.timestamp);
      const dateLabel = `${d.getDate()} ${MONTH_NAMES[d.getMonth()].substring(0, 3)}`;
      return {
        name: dateLabel,
        views: entry.instagram.views + entry.tiktok.views,
        instagram: entry.instagram.views,
        tiktok: entry.tiktok.views,
        title: entry.title
      };
    });
  }, [filteredEntries]);

  // Start inline editing
  const startInlineEdit = (entry: ContentEntry) => {
    setEditingRowId(entry.id);
    setInlineTitle(entry.title);
    setInlineTimestamp(new Date(entry.timestamp).toISOString().split('T')[0]);
    setInlineIgViews(entry.instagram.views);
    setInlineIgLikes(entry.instagram.likes);
    setInlineTtViews(entry.tiktok.views);
    setInlineTtLikes(entry.tiktok.likes);
  };

  // Cancel inline editing
  const cancelInlineEdit = () => {
    setEditingRowId(null);
  };

  // Save inline editing
  const saveInlineEdit = (id: string, originalEntry: ContentEntry) => {
    if (!inlineTitle.trim()) {
      alert('Judul konten tidak boleh kosong.');
      return;
    }
    const newTimestamp = inlineTimestamp ? new Date(inlineTimestamp).getTime() : originalEntry.timestamp;
    
    const updatedEntry: Omit<ContentEntry, 'id'> = {
      title: inlineTitle.trim(),
      timestamp: newTimestamp,
      instagram: {
        ...originalEntry.instagram,
        views: inlineIgViews,
        likes: inlineIgLikes
      },
      tiktok: {
        ...originalEntry.tiktok,
        views: inlineTtViews,
        likes: inlineTtLikes
      }
    };
    onSaveInlineContent(id, updatedEntry);
    setEditingRowId(null);
  };

  // Custom tooltips for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[color:var(--mac-bg-surface)] border border-[color:var(--mac-border)] px-2.5 py-1.5 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.1)] text-xs text-left border-none select-none pointer-events-none">
          <span className="text-[10px] font-medium text-[color:var(--mac-text-secondary)] block">{data.name}</span>
          <span className="text-sm font-bold text-[color:var(--mac-accent)] block mt-0.5">{data.views.toLocaleString('id-ID')}</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[color:var(--mac-bg-window)] text-[color:var(--mac-text-primary)] font-sans">
      
      {/* Top Header / Bar */}
      <div className="h-14 px-6 border-b border-[color:var(--mac-border)] flex items-center justify-between shrink-0 bg-transparent">
        <div className="flex items-center gap-3">
          {/* Traffic Lights (Visual Only for HIG decoration) */}
          <div className="flex gap-1.5 mr-2">
            <span className="mac-traffic-dot mac-traffic-red"></span>
            <span className="mac-traffic-dot mac-traffic-yellow"></span>
            <span className="mac-traffic-dot mac-traffic-green"></span>
          </div>
          <h1 className="text-[15px] font-semibold tracking-tight text-[color:var(--mac-text-primary)]">
            {filterType === 'all' && 'Semua Riwayat Konten'}
            {filterType === 'year' && `Riwayat Konten Tahun ${filterYear}`}
            {filterType === 'month' && `Riwayat Konten ${MONTH_NAMES[filterMonth]} ${filterYear}`}
            {filterType === 'custom' && 'Rentang Tanggal Kustom'}
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onGenerateReport(filterType === 'year' ? 'year' : 'month')}
            className="gai-btn-tonal text-xs font-semibold py-1.5 h-8 flex items-center gap-1.5 cursor-pointer"
            title="Ekspor Laporan PDF"
          >
            <FileText size={14} className="stroke-[1.5]" />
            Laporan PDF
          </button>
          <button
            onClick={onAddContent}
            className="gai-btn-filled text-xs font-semibold py-1.5 h-8 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} className="stroke-[2.5]" />
            Konten Baru
          </button>
        </div>
      </div>

      {/* Workspace Panel Split View */}
      <div className="flex-1 flex flex-col overflow-hidden p-6 gap-6 min-h-0">
        
        {/* Top Pane: Screen Time Dashboard Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
          
          {/* Metrics Panel */}
          <div className="lg:col-span-1 grid grid-cols-2 gap-4">
            
            {/* Total Views Card */}
            <div className="bg-[color:var(--mac-bg-surface)] border border-[color:var(--mac-border)] rounded-xl p-4 text-left flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.03)] h-[105px]">
              <div>
                <span className="text-[10px] font-semibold text-[color:var(--mac-text-secondary)] uppercase tracking-wider block">Total Tayangan</span>
                <span className="text-2xl font-bold tracking-tight mt-1 block">
                  {metrics.totalViews.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-[color:var(--mac-text-secondary)] font-medium mt-1">
                <span className="flex items-center gap-0.5"><InstagramIcon size={10} /> {metrics.ig.views >= 1000 ? `${(metrics.ig.views/1000).toFixed(0)}k` : metrics.ig.views}</span>
                <span>•</span>
                <span className="flex items-center gap-0.5"><TikTokIcon size={10} /> {metrics.tt.views >= 1000 ? `${(metrics.tt.views/1000).toFixed(0)}k` : metrics.tt.views}</span>
              </div>
            </div>

            {/* Engagement Rate Card */}
            <div className="bg-[color:var(--mac-bg-surface)] border border-[color:var(--mac-border)] rounded-xl p-4 text-left flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.03)] h-[105px]">
              <div>
                <span className="text-[10px] font-semibold text-[color:var(--mac-text-secondary)] uppercase tracking-wider block">Tingkat Interaksi</span>
                <span className="text-2xl font-bold tracking-tight mt-1 block">
                  {metrics.engagementRate}%
                </span>
              </div>
              <span className="text-[9px] text-[color:var(--mac-text-secondary)] font-medium block">
                Likes, comments, shares, saves / views
              </span>
            </div>

            {/* Total Postings Card */}
            <div className="bg-[color:var(--mac-bg-surface)] border border-[color:var(--mac-border)] rounded-xl p-4 text-left flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.03)] h-[105px]">
              <div>
                <span className="text-[10px] font-semibold text-[color:var(--mac-text-secondary)] uppercase tracking-wider block">Total Postingan</span>
                <span className="text-2xl font-bold tracking-tight mt-1 block">
                  {filteredEntries.length}
                </span>
              </div>
              <span className="text-[9px] text-[color:var(--mac-text-secondary)] font-medium block">
                Unggahan aktif di kedua platform
              </span>
            </div>

            {/* Total Likes Card */}
            <div className="bg-[color:var(--mac-bg-surface)] border border-[color:var(--mac-border)] rounded-xl p-4 text-left flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.03)] h-[105px]">
              <div>
                <span className="text-[10px] font-semibold text-[color:var(--mac-text-secondary)] uppercase tracking-wider block">Total Disukai</span>
                <span className="text-2xl font-bold tracking-tight mt-1 block">
                  {metrics.totalLikes.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-[color:var(--mac-text-secondary)] font-medium mt-1">
                <span className="flex items-center gap-0.5"><InstagramIcon size={10} /> {metrics.ig.likes >= 1000 ? `${(metrics.ig.likes/1000).toFixed(0)}k` : metrics.ig.likes}</span>
                <span>•</span>
                <span className="flex items-center gap-0.5"><TikTokIcon size={10} /> {metrics.tt.likes >= 1000 ? `${(metrics.tt.likes/1000).toFixed(0)}k` : metrics.tt.likes}</span>
              </div>
            </div>

          </div>

          {/* Sparkline / Trend Panel */}
          <div className="lg:col-span-2 bg-[color:var(--mac-bg-surface)] border border-[color:var(--mac-border)] rounded-xl p-4 flex flex-col shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-left h-[230px]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[color:var(--mac-text-primary)] flex items-center gap-1">
                <TrendingUp size={14} className="text-[color:var(--mac-accent)]" />
                Tren Pertumbuhan Tayangan Konten
              </span>
              <span className="text-[10px] text-[color:var(--mac-text-secondary)] font-medium">Secara Kronologis</span>
            </div>
            
            {chartData.length > 0 ? (
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="viewsTrendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--mac-accent)" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="var(--mac-accent)" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--mac-border)" opacity={0.6} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fill: 'var(--mac-text-secondary)' }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fill: 'var(--mac-text-secondary)' }}
                      tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="views" 
                      stroke="var(--mac-accent)" 
                      strokeWidth={2.2}
                      fillOpacity={1} 
                      fill="url(#viewsTrendGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-[color:var(--mac-text-secondary)] font-medium">
                Belum ada data untuk direpresentasikan di bagan.
              </div>
            )}
          </div>

        </div>

        {/* Bottom Pane: macOS Finder Data Table */}
        <div className="flex-1 flex flex-col bg-[color:var(--mac-bg-surface)] border border-[color:var(--mac-border)] rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.03)] min-h-0 overflow-hidden text-left">
          
          {/* Table Header Bar */}
          <div className="px-5 py-3 border-b border-[color:var(--mac-border)] flex items-center justify-between shrink-0 bg-transparent">
            <span className="text-[11px] font-bold text-[color:var(--mac-text-secondary)] uppercase tracking-wider">
              Daftar Entri Konten ({filteredEntries.length})
            </span>
            <span className="text-[10px] text-[color:var(--mac-text-secondary)] font-medium">
              Double-click baris untuk melakukan edit langsung
            </span>
          </div>

          {/* Table Content Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-transparent border-b border-[color:var(--mac-border)] sticky top-0 bg-[color:var(--mac-bg-surface)] z-10 select-none">
                  <th className="px-5 py-2.5 text-[11px] font-semibold text-[color:var(--mac-text-secondary)] w-[140px]">Tanggal</th>
                  <th className="px-5 py-2.5 text-[11px] font-semibold text-[color:var(--mac-text-secondary)]">Judul Konten</th>
                  <th className="px-5 py-2.5 text-[11px] font-semibold text-[color:var(--mac-text-secondary)] text-right w-[120px]"><InstagramIcon size={12} className="inline mr-1" /> IG Views</th>
                  <th className="px-5 py-2.5 text-[11px] font-semibold text-[color:var(--mac-text-secondary)] text-right w-[120px]"><TikTokIcon size={12} className="inline mr-1" /> TT Views</th>
                  <th className="px-5 py-2.5 text-[11px] font-semibold text-[color:var(--mac-text-secondary)] text-right w-[140px]">Total Tayangan</th>
                  <th className="px-5 py-2.5 text-[11px] font-semibold text-[color:var(--mac-text-secondary)] text-center w-[100px]">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map(entry => {
                  const isEditing = editingRowId === entry.id;
                  const dateStr = new Date(entry.timestamp).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  });

                  return (
                    <tr 
                      key={entry.id}
                      onDoubleClick={() => !isEditing && startInlineEdit(entry)}
                      className={`border-b border-[color:var(--mac-border)] text-xs h-[40px] last:border-b-0 transition-colors duration-100 ${isEditing ? 'bg-blue-500/5' : 'hover:bg-[color:var(--mac-text-primary)]/[0.02]'}`}
                    >
                      {/* Date / Timestamp */}
                      <td className="px-5 py-2 font-medium">
                        {isEditing ? (
                          <input
                            type="date"
                            value={inlineTimestamp}
                            onChange={(e) => setInlineTimestamp(e.target.value)}
                            className="gai-input h-[26px] w-full text-xs font-medium"
                          />
                        ) : (
                          dateStr
                        )}
                      </td>

                      {/* Title */}
                      <td className="px-5 py-2 font-semibold">
                        {isEditing ? (
                          <input
                            type="text"
                            value={inlineTitle}
                            onChange={(e) => setInlineTitle(e.target.value)}
                            className="gai-input h-[26px] w-full text-xs"
                            placeholder="Judul konten..."
                          />
                        ) : (
                          <span className="truncate max-w-[400px] block" title={entry.title}>
                            {entry.title}
                          </span>
                        )}
                      </td>

                      {/* Instagram Views */}
                      <td className="px-5 py-2 text-right">
                        {isEditing ? (
                          <div className="flex items-center gap-1 justify-end">
                            <span className="text-[10px] text-[color:var(--mac-text-secondary)]">V:</span>
                            <input
                              type="number"
                              value={inlineIgViews}
                              onChange={(e) => setInlineIgViews(Math.max(0, parseInt(e.target.value) || 0))}
                              className="gai-input h-[26px] w-[64px] text-xs text-right"
                            />
                            <span className="text-[10px] text-[color:var(--mac-text-secondary)] ml-1">L:</span>
                            <input
                              type="number"
                              value={inlineIgLikes}
                              onChange={(e) => setInlineIgLikes(Math.max(0, parseInt(e.target.value) || 0))}
                              className="gai-input h-[26px] w-[54px] text-xs text-right"
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col text-right">
                            <span className="font-semibold">{entry.instagram.views.toLocaleString('id-ID')}</span>
                            <span className="text-[9px] text-[color:var(--mac-text-secondary)]">Likes: {entry.instagram.likes.toLocaleString('id-ID')}</span>
                          </div>
                        )}
                      </td>

                      {/* TikTok Views */}
                      <td className="px-5 py-2 text-right">
                        {isEditing ? (
                          <div className="flex items-center gap-1 justify-end">
                            <span className="text-[10px] text-[color:var(--mac-text-secondary)]">V:</span>
                            <input
                              type="number"
                              value={inlineTtViews}
                              onChange={(e) => setInlineTtViews(Math.max(0, parseInt(e.target.value) || 0))}
                              className="gai-input h-[26px] w-[64px] text-xs text-right"
                            />
                            <span className="text-[10px] text-[color:var(--mac-text-secondary)] ml-1">L:</span>
                            <input
                              type="number"
                              value={inlineTtLikes}
                              onChange={(e) => setInlineTtLikes(Math.max(0, parseInt(e.target.value) || 0))}
                              className="gai-input h-[26px] w-[54px] text-xs text-right"
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col text-right">
                            <span className="font-semibold">{entry.tiktok.views.toLocaleString('id-ID')}</span>
                            <span className="text-[9px] text-[color:var(--mac-text-secondary)]">Likes: {entry.tiktok.likes.toLocaleString('id-ID')}</span>
                          </div>
                        )}
                      </td>

                      {/* Total Views */}
                      <td className="px-5 py-2 text-right font-bold text-[color:var(--mac-accent)]">
                        {isEditing ? (
                          <span>{(inlineIgViews + inlineTtViews).toLocaleString('id-ID')}</span>
                        ) : (
                          <span>{(entry.instagram.views + entry.tiktok.views).toLocaleString('id-ID')}</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-2 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => saveInlineEdit(entry.id, entry)}
                              className="p-1 rounded bg-green-500/10 text-green-500 hover:bg-green-500/20 cursor-pointer"
                              title="Simpan"
                            >
                              <Check size={14} className="stroke-[2.5]" />
                            </button>
                            <button
                              onClick={cancelInlineEdit}
                              className="p-1 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 cursor-pointer"
                              title="Batal"
                            >
                              <X size={14} className="stroke-[2.5]" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onEditContent(entry)}
                              className="p-1 rounded text-[color:var(--mac-text-secondary)] hover:text-[color:var(--mac-accent)] hover:bg-[color:var(--mac-text-primary)]/[0.05] cursor-pointer"
                              title="Edit Detail"
                            >
                              <Edit size={13} className="stroke-[1.8]" />
                            </button>
                            <button
                              onClick={() => onDeleteContent(entry.id)}
                              className="p-1 rounded text-[color:var(--mac-text-secondary)] hover:text-red-500 hover:bg-[color:var(--mac-text-primary)]/[0.05] cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 size={13} className="stroke-[1.8]" />
                            </button>
                          </div>
                        )}
                      </td>

                    </tr>
                  );
                })}

                {filteredEntries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-[color:var(--mac-text-secondary)] font-medium">
                      Tidak ada entri konten yang cocok dengan filter aktif.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>

    </div>
  );
};

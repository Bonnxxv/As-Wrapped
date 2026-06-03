import React, { useState, useEffect } from 'react';
import { X, Calendar, Copy, RotateCcw } from 'lucide-react';
import { ContentEntry, ContentMetrics } from '../types';
import { getDaysInMonth } from '../utils/initialState';
import { TikTokIcon, InstagramIcon } from './MacSidebar';
import { MacDropdown } from './MacDropdown';

interface ContentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Omit<ContentEntry, 'id'>) => void;
  year: number;
  monthIndex: number;
  initialEntry?: ContentEntry | null; // If editing
}

const emptyMetrics: ContentMetrics = {
  views: 0,
  likes: 0,
  comments: 0,
  saves: 0,
  shares: 0
};

interface MetricInputProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
}

const MetricInput: React.FC<MetricInputProps> = ({ 
  label, 
  value, 
  onChange 
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-[9px] text-mac-muted uppercase font-medium">{label}</span>
    <input 
      type="number" 
      value={value === 0 ? '' : value}
      onChange={(e) => {
        const parsed = parseInt(e.target.value, 10);
        onChange(isNaN(parsed) ? 0 : Math.max(0, parsed));
      }}
      onFocus={(e) => e.target.select()}
      placeholder="0"
      className="bg-mac-canvas border border-mac-border/80 rounded-lg px-3 py-2 text-xs text-mac-text outline-none focus:border-mac-accent focus:ring-1 focus:ring-mac-accent/20 mac-transition h-10 w-full"
      min="0"
    />
  </div>
);

export const ContentPopup: React.FC<ContentPopupProps> = ({
  isOpen,
  onClose,
  onSave,
  year,
  monthIndex,
  initialEntry
}) => {
  const [day, setDay] = useState<number>(1);
  const [title, setTitle] = useState<string>('');
  
  const [igMetrics, setIgMetrics] = useState<ContentMetrics>(emptyMetrics);
  const [ttMetrics, setTtMetrics] = useState<ContentMetrics>(emptyMetrics);

  // Platform active states
  const [isInstagramActive, setIsInstagramActive] = useState<boolean>(true);
  const [isTiktokActive, setIsTiktokActive] = useState<boolean>(true);

  const totalDays = getDaysInMonth(year, monthIndex);
  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);
  const dateOptions = daysArray.map(d => ({ value: d, label: `Day ${d}` }));

  useEffect(() => {
    if (initialEntry) {
      setDay(initialEntry.day);
      setTitle(initialEntry.title);
      setIgMetrics(initialEntry.instagram);
      setTtMetrics(initialEntry.tiktok);

      const hasIg = initialEntry.instagram.views > 0 || initialEntry.instagram.likes > 0 || initialEntry.instagram.comments > 0 || initialEntry.instagram.saves > 0 || initialEntry.instagram.shares > 0;
      const hasTt = initialEntry.tiktok.views > 0 || initialEntry.tiktok.likes > 0 || initialEntry.tiktok.comments > 0 || initialEntry.tiktok.saves > 0 || initialEntry.tiktok.shares > 0;

      if (hasIg && !hasTt) {
        setIsInstagramActive(true);
        setIsTiktokActive(false);
      } else if (!hasIg && hasTt) {
        setIsInstagramActive(false);
        setIsTiktokActive(true);
      } else {
        setIsInstagramActive(true);
        setIsTiktokActive(true);
      }
    } else {
      setDay(1);
      setTitle('');
      setIgMetrics(emptyMetrics);
      setTtMetrics(emptyMetrics);
      setIsInstagramActive(true);
      setIsTiktokActive(true);
    }
  }, [initialEntry, isOpen, year, monthIndex]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Content title is required!');
      return;
    }
      
    onSave({
      day,
      title: title.trim(),
      instagram: isInstagramActive ? igMetrics : emptyMetrics,
      tiktok: isTiktokActive ? ttMetrics : emptyMetrics
    });
    
    onClose();
  };

  // UX Actions
  const mirrorToTiktok = () => {
    setTtMetrics({ ...igMetrics });
  };

  const mirrorToInstagram = () => {
    setIgMetrics({ ...ttMetrics });
  };

  const clearInstagram = () => {
    setIgMetrics(emptyMetrics);
  };

  const clearTiktok = () => {
    setTtMetrics(emptyMetrics);
  };

  return (
    <div className="fixed inset-0 z-50 mac-backdrop flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-mac-panel border border-mac-border shadow-mac-popover w-full max-w-2xl overflow-hidden mac-spring-popup rounded-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-mac-border/50 bg-mac-sidebar">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-mac-text">
              {initialEntry ? 'Edit Mirrored Content' : 'New Mirrored Content'}
            </h2>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-mac-muted hover:text-mac-text rounded-full p-1.5 mac-transition"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-5 text-sm bg-mac-canvas">
          
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-mac-muted font-bold flex items-center gap-1.5 select-none">
                <Calendar size={13} />
                Select Date
              </label>
              <MacDropdown
                value={day}
                onChange={setDay}
                options={dateOptions}
                className="w-full"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-mac-muted font-bold select-none">Content Title</label>
              <input 
                type="text" 
                placeholder="Enter title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-mac-canvas border border-mac-border/80 rounded-lg px-3 py-2 text-sm text-mac-text outline-none focus:border-mac-accent focus:ring-1 focus:ring-mac-accent/20 mac-transition h-[44px] w-full"
                required
              />
            </div>
          </div>

          <div className="border-t border-mac-border/30 my-1"></div>

          {/* TWO COLUMNS FOR METRICS */}
          <div className="grid grid-cols-2 gap-8">
            
            {/* INSTAGRAM COLUMN */}
            <div className="flex flex-col min-h-[290px]">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-mac-border/30 select-none">
                <div className="flex items-center gap-2">
                  <InstagramIcon size={14} className={isInstagramActive ? "text-pink-500" : "text-mac-muted"} />
                  <label className={`text-xs font-bold ${isInstagramActive ? "text-mac-text" : "text-mac-muted"}`}>Instagram Metrics</label>
                </div>
                
                {/* Custom Toggle Switch */}
                <button
                  type="button"
                  onClick={() => setIsInstagramActive(!isInstagramActive)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                    isInstagramActive ? 'bg-mac-accent' : 'bg-mac-surface'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isInstagramActive ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {isInstagramActive ? (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="grid grid-cols-2 gap-3">
                    <MetricInput label="Views" value={igMetrics.views} onChange={(v) => setIgMetrics({...igMetrics, views: v})} />
                    <MetricInput label="Likes" value={igMetrics.likes} onChange={(v) => setIgMetrics({...igMetrics, likes: v})} />
                    <MetricInput label="Comments" value={igMetrics.comments} onChange={(v) => setIgMetrics({...igMetrics, comments: v})} />
                    <MetricInput label="Saves" value={igMetrics.saves} onChange={(v) => setIgMetrics({...igMetrics, saves: v})} />
                    <MetricInput label="Shares" value={igMetrics.shares} onChange={(v) => setIgMetrics({...igMetrics, shares: v})} />
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    {isTiktokActive && (
                      <button
                        type="button"
                        onClick={mirrorToTiktok}
                        className="flex items-center gap-1 text-[10px] font-bold text-mac-accent hover:text-mac-accentHover mac-transition cursor-pointer"
                        title="Copy Instagram metrics to TikTok"
                      >
                        <Copy size={10} /> Mirror to TikTok
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={clearInstagram}
                      className="flex items-center gap-1 text-[10px] font-bold text-mac-muted hover:text-red-500 mac-transition cursor-pointer ml-auto"
                    >
                      <RotateCcw size={10} /> Reset
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-mac-border/30 bg-mac-sidebar/40 rounded-2xl min-h-[220px] mac-transition select-none">
                  <InstagramIcon size={24} className="text-mac-muted opacity-30 mb-2" />
                  <span className="text-xs font-bold text-mac-muted mb-1">Instagram Off</span>
                  <p className="text-[10px] text-mac-muted max-w-[170px] leading-relaxed mb-3">No stats are being tracked on Instagram for this entry.</p>
                  <button 
                    type="button" 
                    onClick={() => setIsInstagramActive(true)}
                    className="px-3 py-1 rounded-full bg-mac-surface hover:bg-mac-border/50 text-[10px] font-bold text-mac-text mac-transition border border-mac-border"
                  >
                    Enable Stats
                  </button>
                </div>
              )}
            </div>

            {/* TIKTOK COLUMN */}
            <div className="flex flex-col min-h-[290px]">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-mac-border/30 select-none">
                <div className="flex items-center gap-2">
                  <TikTokIcon size={14} className={isTiktokActive ? "text-cyan-400" : "text-mac-muted"} />
                  <label className={`text-xs font-bold ${isTiktokActive ? "text-mac-text" : "text-mac-muted"}`}>TikTok Metrics</label>
                </div>
                
                {/* Custom Toggle Switch */}
                <button
                  type="button"
                  onClick={() => setIsTiktokActive(!isTiktokActive)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                    isTiktokActive ? 'bg-mac-accent' : 'bg-mac-surface'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isTiktokActive ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {isTiktokActive ? (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="grid grid-cols-2 gap-3">
                    <MetricInput label="Views" value={ttMetrics.views} onChange={(v) => setTtMetrics({...ttMetrics, views: v})} />
                    <MetricInput label="Likes" value={ttMetrics.likes} onChange={(v) => setTtMetrics({...ttMetrics, likes: v})} />
                    <MetricInput label="Comments" value={ttMetrics.comments} onChange={(v) => setTtMetrics({...ttMetrics, comments: v})} />
                    <MetricInput label="Saves" value={ttMetrics.saves} onChange={(v) => setTtMetrics({...ttMetrics, saves: v})} />
                    <MetricInput label="Shares" value={ttMetrics.shares} onChange={(v) => setTtMetrics({...ttMetrics, shares: v})} />
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    {isInstagramActive && (
                      <button
                        type="button"
                        onClick={mirrorToInstagram}
                        className="flex items-center gap-1 text-[10px] font-bold text-mac-accent hover:text-mac-accentHover mac-transition cursor-pointer"
                        title="Copy TikTok metrics to Instagram"
                      >
                        <Copy size={10} /> Mirror to Instagram
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={clearTiktok}
                      className="flex items-center gap-1 text-[10px] font-bold text-mac-muted hover:text-red-500 mac-transition cursor-pointer ml-auto"
                    >
                      <RotateCcw size={10} /> Reset
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-mac-border/30 bg-mac-sidebar/40 rounded-2xl min-h-[220px] mac-transition select-none">
                  <TikTokIcon size={24} className="text-mac-muted opacity-30 mb-2" />
                  <span className="text-xs font-bold text-mac-muted mb-1">TikTok Off</span>
                  <p className="text-[10px] text-mac-muted max-w-[170px] leading-relaxed mb-3">No stats are being tracked on TikTok for this entry.</p>
                  <button 
                    type="button" 
                    onClick={() => setIsTiktokActive(true)}
                    className="px-3 py-1 rounded-full bg-mac-surface hover:bg-mac-border/50 text-[10px] font-bold text-mac-text mac-transition border border-mac-border"
                  >
                    Enable Stats
                  </button>
                </div>
              )}
            </div>

          </div>

          <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-mac-border/30 text-xs select-none">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2 rounded-full border border-mac-border bg-mac-canvas hover:bg-mac-surface text-mac-text font-bold text-xs mac-transition"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-5 py-2 rounded-full bg-mac-accent hover:bg-mac-accentHover text-white font-bold text-xs mac-transition shadow-sm"
            >
              {initialEntry ? 'Save Changes' : 'Add Mirrored Content'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

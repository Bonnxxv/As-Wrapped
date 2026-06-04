import React, { useState, useEffect, useRef } from 'react';
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
  initialEntry?: ContentEntry | null;
}

const emptyMetrics: ContentMetrics = { views: 0, likes: 0, comments: 0, saves: 0, shares: 0 };

/* ── Metric number input ──────────────────── */
interface MetricInputProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
}

const MetricInput: React.FC<MetricInputProps> = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-1.5">
    <span className="md-label-small text-[color:var(--md-sys-color-on-surface-variant)] uppercase tracking-[.5px] select-none">
      {label}
    </span>
    <input
      type="number"
      value={value === 0 ? '' : value}
      onChange={(e) => {
        const parsed = parseInt(e.target.value, 10);
        onChange(isNaN(parsed) ? 0 : Math.max(0, parsed));
      }}
      onFocus={(e) => e.target.select()}
      placeholder="0"
      className="gai-input h-[44px] text-sm"
      min="0"
    />
  </div>
);

/* ── M3 Toggle Switch ─────────────────────── */
interface SwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}
const MdSwitch: React.FC<SwitchProps> = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`
      relative inline-flex h-[28px] w-[52px] shrink-0 cursor-pointer rounded-full items-center px-[3px]
      transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--md-sys-color-primary)]
      ${checked
        ? 'bg-[color:var(--md-sys-color-primary)]'
        : 'bg-[color:var(--md-sys-color-surface-container-highest,var(--md-sys-color-surface-variant))] border-2 border-[color:var(--md-sys-color-outline)]'
      }
    `}
    style={{ transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)' }}
  >
    <span
      className={`
        pointer-events-none rounded-full shadow-sm flex items-center justify-center
        transition-all duration-200
        ${checked
          ? 'h-[22px] w-[22px] bg-white translate-x-[24px]'
          : 'h-[16px] w-[16px] bg-[color:var(--md-sys-color-outline)] translate-x-0'
        }
      `}
      style={{ transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)' }}
    />
  </button>
);

export const ContentPopup: React.FC<ContentPopupProps> = ({
  isOpen,
  onClose,
  onSave,
  year,
  monthIndex,
  initialEntry
}) => {
  /* ── Form state ──────────────────── */
  const [day, setDay] = useState<number>(1);
  const [title, setTitle] = useState<string>('');
  const [igMetrics, setIgMetrics] = useState<ContentMetrics>(emptyMetrics);
  const [ttMetrics, setTtMetrics] = useState<ContentMetrics>(emptyMetrics);
  const [isInstagramActive, setIsInstagramActive] = useState(true);
  const [isTiktokActive, setIsTiktokActive] = useState(true);

  /* ── M3 Dialog Animation state ──── */
  // Phase: 'hidden' | 'visible' | 'exiting'
  const [phase, setPhase] = useState<'hidden' | 'visible' | 'exiting'>('hidden');
  const exitTimerRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset any ongoing exit
      clearTimeout(exitTimerRef.current);
      setPhase('visible');
    } else {
      if (phase !== 'hidden') {
        setPhase('exiting');
        exitTimerRef.current = setTimeout(() => setPhase('hidden'), 300);
      }
    }
    return () => clearTimeout(exitTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  /* ── Populate form on entry change ─ */
  useEffect(() => {
    if (initialEntry) {
      setDay(initialEntry.day);
      setTitle(initialEntry.title);
      setIgMetrics(initialEntry.instagram);
      setTtMetrics(initialEntry.tiktok);
      const hasIg = Object.values(initialEntry.instagram).some(v => v > 0);
      const hasTt = Object.values(initialEntry.tiktok).some(v => v > 0);
      if (hasIg && !hasTt) { setIsInstagramActive(true); setIsTiktokActive(false); }
      else if (!hasIg && hasTt) { setIsInstagramActive(false); setIsTiktokActive(true); }
      else { setIsInstagramActive(true); setIsTiktokActive(true); }
    } else {
      setDay(1); setTitle('');
      setIgMetrics(emptyMetrics); setTtMetrics(emptyMetrics);
      setIsInstagramActive(true); setIsTiktokActive(true);
    }
  }, [initialEntry, isOpen, year, monthIndex]);

  if (phase === 'hidden') return null;

  /* ── Derived ─────────────────────── */
  const totalDays = getDaysInMonth(year, monthIndex);
  const dateOptions = Array.from({ length: totalDays }, (_, i) => ({ value: i + 1, label: `Day ${i + 1}` }));

  const isVisible = phase === 'visible';

  /* ── Handlers ───────────────────── */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { alert('Content title is required!'); return; }
    onSave({
      day,
      title: title.trim(),
      instagram: isInstagramActive ? igMetrics : emptyMetrics,
      tiktok: isTiktokActive ? ttMetrics : emptyMetrics
    });
    onClose();
  };

  /* ── CSS classes for animation ──── */
  // Backdrop
  const backdropCls = [
    'fixed inset-0 z-50 flex items-center justify-center p-4',
    'transition-[background-color,backdrop-filter]',
    isVisible
      ? 'bg-black/40 backdrop-blur-[3px]'
      : 'bg-black/0 backdrop-blur-none pointer-events-none',
  ].join(' ');

  // Panel (enter: standard-decelerate, exit: standard-accelerate)
  const panelStyle: React.CSSProperties = {
    transitionProperty: 'opacity, transform',
    transitionDuration: isVisible ? '300ms' : '180ms',
    transitionTimingFunction: isVisible
      ? 'cubic-bezier(0.2, 0, 0, 1)'        // M3 standard / decelerate
      : 'cubic-bezier(0.3, 0, 1, 1)',        // M3 standard / accelerate
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(12px)',
    willChange: 'transform, opacity',
  };

  return (
    <div className={backdropCls} style={{ transitionDuration: isVisible ? '300ms' : '200ms', transitionProperty: 'background-color, backdrop-filter', transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)' }}>
      <div
        className="
          bg-[color:var(--md-sys-color-surface)]
          border border-[color:var(--md-sys-color-outline-variant)]
          shadow-[var(--md-elevation-3)]
          w-full max-w-2xl rounded-3xl overflow-hidden
          max-h-[90vh] flex flex-col
        "
        style={panelStyle}
        onClick={e => e.stopPropagation()}
      >
        {/* ─── Header ───────────────────── */}
        <div className="
          flex items-center justify-between px-6 py-5
          border-b border-[color:var(--md-sys-color-outline-variant)]
        ">
          <h2 className="md-title-large text-[color:var(--md-sys-color-on-surface)]">
            {initialEntry ? 'Edit Content' : 'New Content'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="md-icon-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* ─── Form ─────────────────────── */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6 overflow-y-auto min-h-0 flex-1">

          {/* Row 1: Date + Title */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="md-label-medium text-[color:var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5">
                <Calendar size={13} />
                Date
              </label>
              <MacDropdown value={day} onChange={setDay} options={dateOptions} className="w-full" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="md-label-medium text-[color:var(--md-sys-color-on-surface-variant)]">
                Content Title
              </label>
              <input
                type="text"
                placeholder="Enter title…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="gai-input h-[44px]"
                required
              />
            </div>
          </div>

          {/* Divider */}
          <div className="md-divider" />

          {/* Row 2: Platform Metrics */}
          <div className="grid grid-cols-2 gap-8">

            {/* ── Instagram ─── */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-4 select-none">
                <div className="flex items-center gap-2">
                  <InstagramIcon size={16} className={isInstagramActive ? 'shrink-0' : 'shrink-0 grayscale opacity-40'} />
                  <span className={`md-label-large ${isInstagramActive ? 'text-[color:var(--md-sys-color-on-surface)]' : 'text-[color:var(--md-sys-color-on-surface-variant)]'}`}>
                    Instagram
                  </span>
                </div>
                <MdSwitch checked={isInstagramActive} onChange={setIsInstagramActive} />
              </div>

              {isInstagramActive ? (
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-3">
                    <MetricInput label="Views"    value={igMetrics.views}    onChange={v => setIgMetrics({...igMetrics, views: v})} />
                    <MetricInput label="Likes"    value={igMetrics.likes}    onChange={v => setIgMetrics({...igMetrics, likes: v})} />
                    <MetricInput label="Comments" value={igMetrics.comments} onChange={v => setIgMetrics({...igMetrics, comments: v})} />
                    <MetricInput label="Saves"    value={igMetrics.saves}    onChange={v => setIgMetrics({...igMetrics, saves: v})} />
                    <MetricInput label="Shares"   value={igMetrics.shares}   onChange={v => setIgMetrics({...igMetrics, shares: v})} />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    {isTiktokActive && (
                      <button type="button" onClick={() => setTtMetrics({...igMetrics})}
                        className="flex items-center gap-1 text-xs font-medium text-[color:var(--md-sys-color-primary)] hover:underline cursor-pointer transition-colors duration-150"
                        title="Mirror to TikTok">
                        <Copy size={11} /> Mirror to TikTok
                      </button>
                    )}
                    <button type="button" onClick={() => setIgMetrics(emptyMetrics)}
                      className="flex items-center gap-1 text-xs font-medium text-[color:var(--md-sys-color-on-surface-variant)] hover:text-red-500 cursor-pointer transition-colors duration-150 ml-auto">
                      <RotateCcw size={11} /> Reset
                    </button>
                  </div>
                </div>
              ) : (
                <div className="
                  flex-1 flex flex-col items-center justify-center text-center p-6
                  bg-[color:var(--md-sys-color-surface-container)]
                  rounded-2xl min-h-[200px] select-none gap-3
                ">
                  <InstagramIcon size={28} className="grayscale opacity-30" />
                  <div>
                    <p className="md-label-large text-[color:var(--md-sys-color-on-surface-variant)]">Instagram Off</p>
                    <p className="md-body-small text-[color:var(--md-sys-color-on-surface-variant)] mt-1 max-w-[160px]">Not tracking Instagram stats for this entry.</p>
                  </div>
                  <button type="button" onClick={() => setIsInstagramActive(true)} className="gai-btn-outlined">
                    Enable
                  </button>
                </div>
              )}
            </div>

            {/* ── TikTok ─── */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-4 select-none">
                <div className="flex items-center gap-2">
                  <TikTokIcon size={16} className={isTiktokActive ? 'shrink-0' : 'shrink-0 grayscale opacity-40'} />
                  <span className={`md-label-large ${isTiktokActive ? 'text-[color:var(--md-sys-color-on-surface)]' : 'text-[color:var(--md-sys-color-on-surface-variant)]'}`}>
                    TikTok
                  </span>
                </div>
                <MdSwitch checked={isTiktokActive} onChange={setIsTiktokActive} />
              </div>

              {isTiktokActive ? (
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-3">
                    <MetricInput label="Views"    value={ttMetrics.views}    onChange={v => setTtMetrics({...ttMetrics, views: v})} />
                    <MetricInput label="Likes"    value={ttMetrics.likes}    onChange={v => setTtMetrics({...ttMetrics, likes: v})} />
                    <MetricInput label="Comments" value={ttMetrics.comments} onChange={v => setTtMetrics({...ttMetrics, comments: v})} />
                    <MetricInput label="Saves"    value={ttMetrics.saves}    onChange={v => setTtMetrics({...ttMetrics, saves: v})} />
                    <MetricInput label="Shares"   value={ttMetrics.shares}   onChange={v => setTtMetrics({...ttMetrics, shares: v})} />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    {isInstagramActive && (
                      <button type="button" onClick={() => setIgMetrics({...ttMetrics})}
                        className="flex items-center gap-1 text-xs font-medium text-[color:var(--md-sys-color-primary)] hover:underline cursor-pointer transition-colors duration-150"
                        title="Mirror to Instagram">
                        <Copy size={11} /> Mirror to Instagram
                      </button>
                    )}
                    <button type="button" onClick={() => setTtMetrics(emptyMetrics)}
                      className="flex items-center gap-1 text-xs font-medium text-[color:var(--md-sys-color-on-surface-variant)] hover:text-red-500 cursor-pointer transition-colors duration-150 ml-auto">
                      <RotateCcw size={11} /> Reset
                    </button>
                  </div>
                </div>
              ) : (
                <div className="
                  flex-1 flex flex-col items-center justify-center text-center p-6
                  bg-[color:var(--md-sys-color-surface-container)]
                  rounded-2xl min-h-[200px] select-none gap-3
                ">
                  <TikTokIcon size={28} className="grayscale opacity-30" />
                  <div>
                    <p className="md-label-large text-[color:var(--md-sys-color-on-surface-variant)]">TikTok Off</p>
                    <p className="md-body-small text-[color:var(--md-sys-color-on-surface-variant)] mt-1 max-w-[160px]">Not tracking TikTok stats for this entry.</p>
                  </div>
                  <button type="button" onClick={() => setIsTiktokActive(true)} className="gai-btn-outlined">
                    Enable
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* ─── Footer Actions ────────── */}
          <div className="flex gap-3 justify-end pt-2 border-t border-[color:var(--md-sys-color-outline-variant)]">
            <button type="button" onClick={onClose} className="gai-btn-text">
              Cancel
            </button>
            <button type="submit" className="gai-btn-filled">
              {initialEntry ? 'Save Changes' : 'Add Content'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

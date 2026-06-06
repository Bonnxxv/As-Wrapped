import React, { useState, useEffect } from 'react';
import { X, Sparkles, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { ApiKeyConfig, FolderDataState } from '../types';
import { MacDropdown } from './MacDropdown';
import { simplifyModelName } from '../utils/geminiService';
import { M3Dialog } from './M3Dialog';

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export interface ReportConfigOptions {
  customInstructions: string;
  startDay?: number;
  endDay?: number;
  startMonth?: number;
  endMonth?: number;
  languageStyle: 'casual' | 'formal';
  textLength: 'simple' | 'detailed';
  analysisDepth: 'quick' | 'deep';
  targetAudience: 'beginner' | 'expert';
}

interface ReportConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: ReportConfigOptions) => void;
  periodType: 'month' | 'year';
  selectedYear: number;
  selectedMonth: number;
  activeApiKey: ApiKeyConfig | undefined;
  folders: FolderDataState;
}

export const ReportConfigModal: React.FC<ReportConfigModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  periodType,
  selectedYear,
  selectedMonth,
  activeApiKey,
  folders
}) => {
  const [instructions, setInstructions] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isFullPeriod, setIsFullPeriod] = useState(true);
  
  // Dynamic ranges
  const totalDaysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const [startDay, setStartDay] = useState(1);
  const [endDay, setEndDay] = useState(totalDaysInMonth);
  const [startMonth, setStartMonth] = useState(0);
  const [endMonth, setEndMonth] = useState(11);

  // Preset states (defaults preferred by user: dense, simple, casual, deep, easy)
  const [languageStyle, setLanguageStyle] = useState<'casual' | 'formal'>('casual');
  const [textLength, setTextLength] = useState<'simple' | 'detailed'>('simple');
  const [analysisDepth, setAnalysisDepth] = useState<'quick' | 'deep'>('deep');
  const [targetAudience, setTargetAudience] = useState<'beginner' | 'expert'>('beginner');

  // Reset inputs when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setInstructions('');
      setStartDay(1);
      setEndDay(totalDaysInMonth);
      setStartMonth(0);
      setIsFullPeriod(true);
      setShowAdvanced(false);
      
      const now = new Date();
      const currentYr = now.getFullYear();
      const currentMonthVal = now.getMonth();
      const maxM = selectedYear === currentYr ? currentMonthVal : 11;
      setEndMonth(maxM);
      
      setLanguageStyle('casual');
      setTextLength('simple');
      setAnalysisDepth('deep');
      setTargetAudience('beginner');
    }
  }, [isOpen, selectedYear, selectedMonth, totalDaysInMonth]);

  // Ensure end boundaries don't go below start boundaries
  useEffect(() => {
    if (endDay < startDay) {
      setEndDay(startDay);
    }
  }, [startDay]);

  useEffect(() => {
    if (endMonth < startMonth) {
      setEndMonth(startMonth);
    }
  }, [startMonth]);

  // Hitung set hari aktif yang memiliki data postingan di bulan terpilih
  const activeDays = React.useMemo(() => {
    const currentMonthEntries = folders[selectedYear]?.[selectedMonth] || [];
    return new Set(currentMonthEntries.map(e => e.day));
  }, [folders, selectedYear, selectedMonth, isOpen]);

  // Hitung set bulan aktif yang memiliki data postingan di tahun terpilih
  const activeMonths = React.useMemo(() => {
    const active = new Set<number>();
    const yearData = folders[selectedYear] || {};
    Object.keys(yearData).forEach(mStr => {
      const mIdx = parseInt(mStr);
      if (yearData[mIdx] && yearData[mIdx].length > 0) {
        active.add(mIdx);
      }
    });
    return active;
  }, [folders, selectedYear, isOpen]);

  const modelLabel = activeApiKey
    ? `${activeApiKey.provider === 'gemini' ? 'Gemini' : 'Hugging Face'} - ${simplifyModelName(activeApiKey.model)}`
    : 'Belum diatur';

  // Dropdown options arrays dengan bullet indicator jika ada data
  const startDayOptions = Array.from({ length: totalDaysInMonth }, (_, i) => {
    const d = i + 1;
    const hasData = activeDays.has(d);
    return {
      value: d,
      label: `Hari ${d}${hasData ? ' •' : ''}`
    };
  });

  const endDayOptions = Array.from({ length: totalDaysInMonth }, (_, i) => {
    const d = i + 1;
    const hasData = activeDays.has(d);
    return {
      value: d,
      label: `Hari ${d}${hasData ? ' •' : ''}`
    };
  }).filter(opt => opt.value >= startDay);

  const startMonthOptions = Array.from({ length: 12 }, (_, i) => {
    const hasData = activeMonths.has(i);
    return {
      value: i,
      label: `${MONTH_NAMES[i].substring(0, 3)}${hasData ? ' •' : ''}`
    };
  });

  const endMonthOptions = Array.from({ length: 12 }, (_, i) => {
    const hasData = activeMonths.has(i);
    return {
      value: i,
      label: `${MONTH_NAMES[i].substring(0, 3)}${hasData ? ' •' : ''}`
    };
  }).filter(opt => opt.value >= startMonth);

  const languageStyleOptions = [
    { value: 'casual', label: 'Santai & Gaul (Kreator)' },
    { value: 'formal', label: 'Profesional & Formal' }
  ];

  const textLengthOptions = [
    { value: 'simple', label: 'Simpel & Padat' },
    { value: 'detailed', label: 'Detail & Panjang' }
  ];

  const analysisDepthOptions = [
    { value: 'deep', label: 'Analisis Mendalam' },
    { value: 'quick', label: 'Analisis Cepat' }
  ];

  const targetAudienceOptions = [
    { value: 'beginner', label: 'Pemula (Mudah Dipahami)' },
    { value: 'expert', label: 'Profesional (Analisis Pakar)' }
  ];

  const handleConfirmClick = () => {
    onConfirm({
      customInstructions: instructions,
      startDay: periodType === 'month' ? (isFullPeriod ? 1 : startDay) : undefined,
      endDay: periodType === 'month' ? (isFullPeriod ? totalDaysInMonth : endDay) : undefined,
      startMonth: periodType === 'year' ? (isFullPeriod ? 0 : startMonth) : undefined,
      endMonth: periodType === 'year' ? (isFullPeriod ? 11 : endMonth) : undefined,
      languageStyle,
      textLength,
      analysisDepth,
      targetAudience
    });
  };

  return (
    <M3Dialog isOpen={isOpen} onClose={onClose} maxWidthClass="max-w-[460px]">
      <div className="flex flex-col w-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="text-left">
            <h2 className="md-title-large text-[color:var(--md-sys-color-on-surface)] flex items-center gap-2">
              <Sparkles size={20} className="text-[color:var(--md-sys-color-primary)] shrink-0" />
              Laporan AI
            </h2>
            <p className="text-[12px] text-[color:var(--md-sys-color-on-surface-variant)] mt-1.5 leading-snug">
              Analisis untuk model <span className="font-semibold text-[color:var(--md-sys-color-primary)]">{modelLabel}</span>
            </p>
          </div>
          <button onClick={onClose} className="md-icon-btn-sm shrink-0 -mr-1 -mt-1">
            <X size={16} />
          </button>
        </div>

        {/* Minimal Setup (Always Visible) */}
        <div className="flex flex-col gap-4 text-left">
          
          {/* Toggle Analisis Periode Penuh */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[color:var(--md-sys-color-surface-container-low)] border border-[color:var(--md-sys-color-outline-variant)]/40">
            <input
              type="checkbox"
              id="full-period-toggle"
              checked={isFullPeriod}
              onChange={(e) => setIsFullPeriod(e.target.checked)}
              className="w-4 h-4 rounded border-[color:var(--md-sys-color-outline)] text-[color:var(--md-sys-color-primary)] focus:ring-[color:var(--md-sys-color-primary)] cursor-pointer"
            />
            <label htmlFor="full-period-toggle" className="text-xs font-semibold text-[color:var(--md-sys-color-on-surface)] cursor-pointer flex-1">
              {periodType === 'month' 
                ? `Analisis Satu Bulan Penuh (${MONTH_NAMES[selectedMonth]} ${selectedYear})`
                : `Analisis Satu Tahun Penuh (Tahun ${selectedYear})`
              }
            </label>
          </div>

          {/* Rentang Waktu (Custom Date Range) - Hanya muncul jika isFullPeriod adalah false */}
          {!isFullPeriod && (
            <div className="flex flex-col gap-3 p-3 rounded-2xl border border-[color:var(--md-sys-color-outline-variant)]/60 bg-[color:var(--md-sys-color-surface-container-lowest)] md-dialog-enter">
              <label className="text-[10px] font-bold text-[color:var(--md-sys-color-on-surface-variant)]/80 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={12} />
                Pilih Rentang Analisis:
              </label>
              
              <div className="flex gap-2.5 items-center">
                {periodType === 'month' ? (
                  <>
                    <MacDropdown 
                      value={startDay} 
                      onChange={setStartDay}
                      options={startDayOptions}
                      size="sm"
                      className="flex-1 w-full text-left"
                    />
                    <span className="text-xs text-[color:var(--md-sys-color-on-surface-variant)] shrink-0">s/d</span>
                    <MacDropdown 
                      value={endDay} 
                      onChange={setEndDay}
                      options={endDayOptions}
                      size="sm"
                      className="flex-1 w-full text-left"
                    />
                  </>
                ) : (
                  <>
                    <MacDropdown 
                      value={startMonth} 
                      onChange={setStartMonth}
                      options={startMonthOptions}
                      size="sm"
                      className="flex-1 w-full text-left"
                    />
                    <span className="text-xs text-[color:var(--md-sys-color-on-surface-variant)] shrink-0">s/d</span>
                    <MacDropdown 
                      value={endMonth} 
                      onChange={setEndMonth}
                      options={endMonthOptions}
                      size="sm"
                      className="flex-1 w-full text-left"
                    />
                  </>
                )}
              </div>

              {/* Quick Presets */}
              <div className="flex flex-col gap-1.5 mt-1 pt-2 border-t border-[color:var(--md-sys-color-outline-variant)]/40">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[color:var(--md-sys-color-on-surface-variant)]/70">Pintasan Cepat:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {periodType === 'month' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => { setStartDay(1); setEndDay(15); }}
                        className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-[color:var(--md-sys-color-surface-container-high)] hover:bg-[color:var(--md-sys-color-primary-container)] hover:text-[color:var(--md-sys-color-on-primary-container)] border border-[color:var(--md-sys-color-outline-variant)]/40 cursor-pointer transition-colors"
                      >
                        15 Hari Pertama (1-15)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setStartDay(16); setEndDay(totalDaysInMonth); }}
                        className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-[color:var(--md-sys-color-surface-container-high)] hover:bg-[color:var(--md-sys-color-primary-container)] hover:text-[color:var(--md-sys-color-on-primary-container)] border border-[color:var(--md-sys-color-outline-variant)]/40 cursor-pointer transition-colors"
                      >
                        15 Hari Terakhir (16-{totalDaysInMonth})
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => { setStartMonth(0); setEndMonth(2); }}
                        className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-[color:var(--md-sys-color-surface-container-high)] hover:bg-[color:var(--md-sys-color-primary-container)] hover:text-[color:var(--md-sys-color-on-primary-container)] border border-[color:var(--md-sys-color-outline-variant)]/40 cursor-pointer transition-colors"
                      >
                        Q1 (Jan-Mar)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setStartMonth(3); setEndMonth(5); }}
                        className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-[color:var(--md-sys-color-surface-container-high)] hover:bg-[color:var(--md-sys-color-primary-container)] hover:text-[color:var(--md-sys-color-on-primary-container)] border border-[color:var(--md-sys-color-outline-variant)]/40 cursor-pointer transition-colors"
                      >
                        Q2 (Apr-Jun)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setStartMonth(6); setEndMonth(8); }}
                        className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-[color:var(--md-sys-color-surface-container-high)] hover:bg-[color:var(--md-sys-color-primary-container)] hover:text-[color:var(--md-sys-color-on-primary-container)] border border-[color:var(--md-sys-color-outline-variant)]/40 cursor-pointer transition-colors"
                      >
                        Q3 (Jul-Sep)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setStartMonth(9); setEndMonth(11); }}
                        className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-[color:var(--md-sys-color-surface-container-high)] hover:bg-[color:var(--md-sys-color-primary-container)] hover:text-[color:var(--md-sys-color-on-primary-container)] border border-[color:var(--md-sys-color-outline-variant)]/40 cursor-pointer transition-colors"
                      >
                        Q4 (Okt-Des)
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Custom Instructions Textarea */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-[color:var(--md-sys-color-on-surface-variant)]/80 uppercase tracking-wider">
              Catatan/Instruksi Kustom (Opsional):
            </label>
            <textarea
              className="
                gai-input h-24 py-3 px-4 resize-none transition-all text-xs
                bg-[color:var(--md-sys-color-surface-container-high)]
                border-[color:var(--md-sys-color-outline-variant)]/60
                text-[color:var(--md-sys-color-on-surface)]
                placeholder:text-[color:var(--md-sys-color-on-surface-variant)]/50
              "
              placeholder="Fokuskan analisis pada hal tertentu jika ada..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              maxLength={1000}
            />
            <div className="flex justify-between items-center text-[10px] text-[color:var(--md-sys-color-on-surface-variant)] opacity-70 px-0.5 mt-0.5">
              <span>Maksimal 1000 karakter</span>
              <span>{instructions.length}/1000</span>
            </div>
          </div>

          {/* Collapsible Advanced Settings Trigger */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold self-start hover:bg-[color:var(--md-sys-color-surface-container-low)] text-[color:var(--md-sys-color-primary)] transition-colors"
          >
            {showAdvanced ? (
              <>
                Sembunyikan Setelan Lanjutan <ChevronUp size={14} />
              </>
            ) : (
              <>
                Tampilkan Setelan Lanjutan <ChevronDown size={14} />
              </>
            )}
          </button>

          {/* Advanced Preset Settings Panel (Revealed on showAdvanced) */}
          <div className={`
            grid grid-cols-2 gap-x-4 gap-y-4 pt-3 border-t border-[color:var(--md-sys-color-outline-variant)]/30
            transition-[max-height,opacity] duration-200 ease-[cubic-bezier(0.2,0,0,1)] origin-top
            ${showAdvanced ? 'max-h-[300px] opacity-100 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden pointer-events-none !pt-0 !border-t-0'}
          `}>
            {/* Gaya Bahasa */}
            <div className="flex flex-col gap-1.5 text-left col-span-2 sm:col-span-1">
              <label className="text-[10px] font-bold text-[color:var(--md-sys-color-on-surface-variant)]/70 uppercase tracking-wider">
                Gaya Bahasa:
              </label>
              <MacDropdown 
                value={languageStyle} 
                onChange={setLanguageStyle}
                options={languageStyleOptions}
                size="sm"
                direction="up"
                className="w-full text-left"
              />
            </div>

            {/* Panjang Teks */}
            <div className="flex flex-col gap-1.5 text-left col-span-2 sm:col-span-1">
              <label className="text-[10px] font-bold text-[color:var(--md-sys-color-on-surface-variant)]/70 uppercase tracking-wider">
                Panjang Teks:
              </label>
              <MacDropdown 
                value={textLength} 
                onChange={setTextLength}
                options={textLengthOptions}
                size="sm"
                direction="up"
                className="w-full text-left"
              />
            </div>

            {/* Kedalaman Analisis */}
            <div className="flex flex-col gap-1.5 text-left col-span-2 sm:col-span-1">
              <label className="text-[10px] font-bold text-[color:var(--md-sys-color-on-surface-variant)]/70 uppercase tracking-wider">
                Kedalaman Analisis:
              </label>
              <MacDropdown 
                value={analysisDepth} 
                onChange={setAnalysisDepth}
                options={analysisDepthOptions}
                size="sm"
                direction="up"
                className="w-full text-left"
              />
            </div>

            {/* Target Pembaca */}
            <div className="flex flex-col gap-1.5 text-left col-span-2 sm:col-span-1">
              <label className="text-[10px] font-bold text-[color:var(--md-sys-color-on-surface-variant)]/70 uppercase tracking-wider">
                Target Pembaca:
              </label>
              <MacDropdown 
                value={targetAudience} 
                onChange={setTargetAudience}
                options={targetAudienceOptions}
                size="sm"
                direction="up"
                className="w-full text-left"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex justify-end gap-3 items-center border-t border-[color:var(--md-sys-color-outline-variant)]/30 pt-4">
          <button 
            type="button" 
            onClick={onClose} 
            className="gai-btn-text"
          >
            Batal
          </button>
          <button 
            type="button" 
            onClick={handleConfirmClick} 
            className="gai-btn-filled flex items-center gap-2"
          >
            <Sparkles size={14} />
            Mulai Analisis
          </button>
        </div>
      </div>
    </M3Dialog>
  );
};

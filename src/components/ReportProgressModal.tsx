import React from 'react';
import { X, Check, Loader2, AlertCircle } from 'lucide-react';

interface ProgressStep {
  label: string;
  description: string;
}

interface ReportProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep: number; // 1 to 4
  status: 'loading' | 'success' | 'error';
  errorMessage: string | null;
  provider?: 'gemini' | 'huggingface';
}

export const ReportProgressModal: React.FC<ReportProgressModalProps> = ({
  isOpen,
  onClose,
  currentStep,
  status,
  errorMessage,
  provider
}) => {
  if (!isOpen) return null;

  const providerLabel = provider === 'huggingface' ? 'Hugging Face' : 'Gemini';
  const steps: ProgressStep[] = [
    { label: 'Mengompilasi Data', description: 'Memfilter dan mempersiapkan metrik konten.' },
    { label: `Analisis AI ${providerLabel}`, description: 'Mengidentifikasi tren, pola, dan anomali konten.' },
    { label: 'Mendesain Grafik', description: 'Merender chart visualisasi dalam format cetak.' },
    { label: 'Menyusun Berkas PDF', description: 'Mengompilasi halaman laporan dan mengunduh berkas.' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 mac-backdrop md-backdrop-enter">
      <div className="
        bg-[color:var(--md-sys-color-surface)]
        border border-[color:var(--md-sys-color-outline-variant)]
        rounded-3xl shadow-[var(--md-elevation-3)]
        w-full max-w-[420px] flex flex-col p-6 select-none md-dialog-enter
      ">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="md-title-large text-[color:var(--md-sys-color-on-surface)]">
              Membuat Laporan
            </h2>
            <p className="md-body-small text-[color:var(--md-sys-color-on-surface-variant)] mt-1">
              Harap tunggu selagi AI menyusun dokumen PDF Anda.
            </p>
          </div>
          {status !== 'loading' && (
            <button onClick={onClose} className="md-icon-btn-sm shrink-0">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-5">
          {steps.map((step, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < currentStep || (stepNum === currentStep && status === 'success');
            const isActive = stepNum === currentStep && status === 'loading';
            const isFailed = stepNum === currentStep && status === 'error';

            return (
              <div key={idx} className="flex gap-4 items-start">
                {/* Step icon/number */}
                <div className={`
                  w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold
                  transition-colors duration-200
                  ${isCompleted 
                    ? 'bg-green-500 text-white' 
                    : isFailed 
                      ? 'bg-[color:var(--md-sys-color-error)] text-white' 
                      : isActive 
                        ? 'bg-[color:var(--md-sys-color-primary)] text-white' 
                        : 'bg-[color:var(--md-sys-color-surface-variant)] text-[color:var(--md-sys-color-on-surface-variant)]'
                  }
                `}>
                  {isCompleted ? (
                    <Check size={13} strokeWidth={3} />
                  ) : isActive ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : isFailed ? (
                    <AlertCircle size={13} />
                  ) : (
                    stepNum
                  )}
                </div>

                {/* Step Info */}
                <div className="flex flex-col">
                  <span className={`
                    text-[13px] font-medium leading-tight
                    ${isActive ? 'text-[color:var(--md-sys-color-primary)] font-semibold' : 'text-[color:var(--md-sys-color-on-surface)]'}
                  `}>
                    {step.label}
                  </span>
                  <span className="text-[11px] text-[color:var(--md-sys-color-on-surface-variant)] mt-0.5 leading-snug">
                    {step.description}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Status Actions */}
        {status === 'error' && (
          <div className="mt-6 p-4 rounded-xl bg-[color:var(--md-sys-color-error-container)] text-[color:var(--md-sys-color-on-error-container)] text-xs flex gap-2.5 items-start">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold">Terjadi Kesalahan</p>
              <p className="mt-1 leading-normal break-words">{errorMessage || 'Gagal membuat laporan.'}</p>
            </div>
          </div>
        )}

        {status !== 'loading' && (
          <div className="mt-6 flex justify-end">
            <button 
              onClick={onClose} 
              className={`gai-btn-filled ${status === 'error' ? 'bg-[color:var(--md-sys-color-error)] text-white hover:bg-[color:var(--md-sys-color-error)]/90' : ''}`}
            >
              {status === 'error' ? 'Tutup' : 'Selesai'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface M3DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClass?: string; // e.g. "max-w-[460px]" or "max-w-[360px]"
}

export const M3Dialog: React.FC<M3DialogProps> = ({
  isOpen,
  onClose,
  children,
  maxWidthClass = 'max-w-[360px]'
}) => {
  const [phase, setPhase] = useState<'hidden' | 'visible' | 'exiting'>('hidden');
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      clearTimeout(timerRef.current);
      setPhase('visible');
    } else {
      if (phase !== 'hidden') {
        setPhase('exiting');
        timerRef.current = setTimeout(() => {
          setPhase('hidden');
        }, 200); // matches md-dialog-exit animation duration (200ms)
      }
    }
    return () => clearTimeout(timerRef.current);
  }, [isOpen, phase]);

  // Close on Escape key press
  useEffect(() => {
    if (phase !== 'visible') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, onClose]);

  if (phase === 'hidden') return null;

  const backdropCls = `
    fixed inset-0 z-50 flex items-center justify-center p-4 mac-backdrop
    ${phase === 'visible' ? 'md-backdrop-enter' : 'md-backdrop-exit'}
  `;

  const dialogCls = `
    bg-[color:var(--md-sys-color-surface)]
    border border-[color:var(--md-sys-color-outline-variant)]
    shadow-[var(--md-elevation-3)]
    rounded-3xl p-6 w-full ${maxWidthClass}
    flex flex-col gap-5 select-none
    ${phase === 'visible' ? 'md-dialog-enter' : 'md-dialog-exit'}
  `;

  return createPortal(
    <div className={backdropCls} onClick={onClose} style={{ willChange: 'opacity' }}>
      <div
        className={dialogCls}
        style={{ willChange: 'transform, opacity' }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

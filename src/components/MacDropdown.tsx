import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface DropdownOption {
  value: string | number;
  label: string;
}

interface MacDropdownProps {
  value: string | number;
  onChange: (value: any) => void;
  options: DropdownOption[];
  className?: string;
  placeholder?: string;
  size?: 'sm' | 'md';
  direction?: 'down' | 'up';
}

export const MacDropdown: React.FC<MacDropdownProps> = ({
  value,
  onChange,
  options,
  className = '',
  placeholder = 'Select…',
  size = 'md',
  direction = 'down'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPhase, setMenuPhase] = useState<'hidden' | 'visible' | 'exiting'>('hidden');
  const menuTimerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const openMenu = () => {
    clearTimeout(menuTimerRef.current);
    setIsOpen(true);
    menuTimerRef.current = setTimeout(() => setMenuPhase('visible'), 10);
  };

  const closeMenu = () => {
    setMenuPhase('exiting');
    menuTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      setMenuPhase('hidden');
    }, 120);
  };

  const toggleMenu = () => {
    if (isOpen) closeMenu();
    else openMenu();
  };

  useEffect(() => () => clearTimeout(menuTimerRef.current), []);

  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  const handleSelect = (val: any) => {
    onChange(val);
    closeMenu();
  };

  /* Animation: simple fade + slight scale, standard M3 easing */
  const menuStyle: React.CSSProperties = {
    transitionProperty: 'opacity, transform',
    transitionDuration: menuPhase === 'visible' ? '150ms' : '100ms',
    transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
    opacity: menuPhase === 'visible' ? 1 : 0,
    transform: menuPhase === 'visible' ? 'scaleY(1)' : 'scaleY(0.95)',
    transformOrigin: direction === 'up' ? 'bottom center' : 'top center',
  };

  return (
    <div ref={containerRef} className={`relative inline-block select-none ${className}`}>

      {/* Trigger — adaptable height & radius */}
      <button
        type="button"
        onClick={toggleMenu}
        className={`
          w-full flex items-center justify-between gap-1.5
          bg-[color:var(--md-sys-color-surface)]
          border border-[color:var(--md-sys-color-outline-variant)]
          cursor-pointer outline-none
          text-[color:var(--md-sys-color-on-surface)] font-medium
          transition-[border-color,background-color] duration-100
          hover:border-[color:var(--md-sys-color-outline)]
          hover:bg-[color:var(--md-sys-color-surface-container-low)]
          focus-visible:border-[color:var(--md-sys-color-primary)] focus-visible:border-2
          ${size === 'sm'
            ? 'h-9 text-xs px-3 rounded-[8px]'
            : 'h-11 text-sm px-4 rounded-[12px]'
          }
        `}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          size={size === 'sm' ? 12 : 14}
          className="shrink-0 text-[color:var(--md-sys-color-on-surface-variant)] transition-transform duration-150"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* Menu — 8px gap from trigger, responsive radius, compact items */}
      {isOpen && (
        <div
          className={`
            absolute left-0 z-50 min-w-full
            bg-[color:var(--md-sys-color-surface-container)]
            border border-[color:var(--md-sys-color-outline-variant)]
            shadow-[var(--md-elevation-2)]
            overflow-hidden
            ${direction === 'up' ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]'}
            ${size === 'sm' ? 'rounded-[8px]' : 'rounded-[12px]'}
          `}
          style={menuStyle}
        >
          <div className="overflow-y-auto overflow-x-hidden max-h-52 py-1">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <div
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`
                    flex items-center justify-between gap-3
                    cursor-pointer transition-colors duration-75
                    ${size === 'sm'
                      ? 'px-2 py-[6px] mx-0.5 rounded-[6px] text-xs'
                      : 'px-3.5 py-[10px] mx-1 rounded-[8px] text-sm'
                    }
                    ${isSelected
                      ? 'bg-[color:var(--md-sys-color-primary-container)] text-[color:var(--md-sys-color-on-primary-container)] font-semibold'
                      : 'text-[color:var(--md-sys-color-on-surface)] hover:bg-[color:var(--md-sys-color-surface-container-high)]'
                    }
                  `}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check size={size === 'sm' ? 12 : 14} className="shrink-0 text-[color:var(--md-sys-color-primary)]" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

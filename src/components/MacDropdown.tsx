import React, { useState } from 'react';
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
}

export const MacDropdown: React.FC<MacDropdownProps> = ({
  value,
  onChange,
  options,
  className = '',
  placeholder = 'Select...'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  const handleSelect = (val: any) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left select-none ${className}`}>
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-mac-canvas hover:bg-mac-surface/40 border border-mac-border/80 rounded-md px-2.5 py-1 text-xs font-medium text-mac-text flex items-center justify-between gap-2 shadow-sm mac-transition cursor-pointer focus:outline-none focus:border-mac-accent focus:ring-1 focus:ring-mac-accent/20"
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown size={11} className={`text-mac-muted mac-transition transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 cursor-default" 
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
        />
      )}

      {/* Popover */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[120px] bg-mac-panel border border-mac-border/80 rounded-md shadow-mac-popover p-1 overflow-y-auto max-h-56 animate-in fade-in slide-in-from-top-1 duration-100 origin-top-right select-none">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between gap-3 cursor-pointer mac-transition ${
                  isSelected
                    ? 'bg-mac-accent text-white font-medium'
                    : 'text-mac-text hover:bg-mac-surface/60 hover:text-mac-text'
                }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check size={11} className="shrink-0 text-white" />}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

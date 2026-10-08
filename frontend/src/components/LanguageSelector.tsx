import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { SupportedLanguage } from '../lib/translations';

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'pills' | 'header';
  className?: string;
  showIcon?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'dropdown',
  className = '',
  showIcon = true,
}) => {
  const { currentLanguage, setLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentOption = languages.find((l) => l.code === currentLanguage) || languages[0];

  // 1. Pills variant (ideal for dialogs and detail headers)
  if (variant === 'pills') {
    return (
      <div className={`inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold ${className}`}>
        {languages.map((lang) => {
          const isActive = currentLanguage === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code as SupportedLanguage)}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-white text-brand-900 shadow-sm font-bold border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              title={`Switch language to ${lang.name}`}
            >
              <span>{lang.nativeName}</span>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />}
            </button>
          );
        })}
      </div>
    );
  }

  // 2. Header / Compact dropdown variant
  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors focus:outline-none"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {showIcon && <Globe className="w-3.5 h-3.5 text-brand-600" />}
        <span>{currentOption.nativeName}</span>
        <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-36 rounded-2xl bg-white border border-slate-200 shadow-xl py-1.5 z-50 animate-fade-in text-xs font-medium">
          <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-100 mb-1">
            Choose Language
          </div>
          {languages.map((lang) => {
            const isActive = currentLanguage === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLanguage(lang.code as SupportedLanguage);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-900 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-xs">{lang.nativeName}</span>
                  <span className="text-[10px] text-slate-400">{lang.name}</span>
                </div>
                {isActive && <Check className="w-3.5 h-3.5 text-brand-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

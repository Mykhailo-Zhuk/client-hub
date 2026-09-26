'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Languages } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLanguage } from '@/lib/i18n/context';
import type { Locale } from '@/lib/i18n/types';
import { cn } from '@/lib/utils';

const LANGUAGES: { code: Locale; label: string; nativeName: string }[] = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'uk', label: 'Ukrainian', nativeName: 'Українська' },
];

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const current = mounted ? locale : 'en';
  const currentLang = LANGUAGES.find((l) => l.code === current) ?? LANGUAGES[0];

  return (
    <div ref={menuRef} className={cn('relative inline-block text-left', className)}>
      <button
        type="button"
        id="language-menu-button"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Language switcher"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          isOpen && 'bg-muted'
        )}
      >
        <Languages size={14} className="text-muted-foreground" />
        <span className="font-semibold uppercase tracking-wide">{currentLang.code}</span>
        <ChevronDown
          size={12}
          className={cn('text-muted-foreground transition-transform duration-200', isOpen && 'rotate-180')}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="language-menu-button"
            className="absolute right-0 top-full mt-1.5 w-40 origin-top-right rounded-md border border-border bg-card p-1 shadow-lg z-50 focus:outline-none"
          >
            {LANGUAGES.map((lang) => {
              const isSelected = current === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setLocale(lang.code);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded px-2.5 py-1.5 text-xs transition-colors',
                    isSelected
                      ? 'bg-accent/10 font-semibold text-accent'
                      : 'text-foreground hover:bg-muted'
                  )}
                >
                  <span className="font-medium">{lang.nativeName}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase text-muted-foreground">{lang.code}</span>
                    {isSelected && <Check size={13} className="text-accent" />}
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

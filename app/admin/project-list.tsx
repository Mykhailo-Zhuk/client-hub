'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Sparkles, Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';

type Item = {
  id: string;
  title: string;
  client?: string | null;
  status: 'active' | 'completed' | 'paused';
  progress: number;
};

export default function ProjectList({
  projects,
  activeId,
}: {
  projects: Item[];
  activeId?: string;
}) {
  const { t } = useLanguage();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    setLoadingId(null);
  }, [activeId]);

  return (
    <nav className="space-y-1">
      <div className="mb-2 flex items-center gap-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Sparkles size={11} />
        {t('admin.projects')}
      </div>
      <ul className="space-y-0.5">
        {projects.length === 0 && (
          <li className="px-3 py-2 text-xs text-muted-foreground">
            {t('admin.noProjectsFound')}
          </li>
        )}
        {projects.map((p) => {
          const active = p.id === activeId;
          const isLoading = loadingId === p.id && !active;
          return (
            <li key={p.id}>
              <Link
                href={`/admin/${p.id}`}
                onClick={() => {
                  if (!active) setLoadingId(p.id);
                }}
                className={cn(
                  'block rounded-md px-3 py-2 text-xs transition-colors',
                  active
                    ? 'bg-accent/10 text-accent'
                    : 'hover:bg-muted text-foreground/80',
                  isLoading && 'opacity-70'
                )}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="truncate font-medium">{p.title}</span>
                  {isLoading && <Loader2 size={12} className="flex-shrink-0 animate-spin text-accent" />}
                </div>
                <div className="mt-0.5 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="truncate">{p.client ?? '—'}</span>
                  <span>{p.progress}%</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

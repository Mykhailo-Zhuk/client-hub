'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Sparkles, Loader2, ArrowUpDown, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';

export type SortOption =
  | 'newest'
  | 'oldest'
  | 'progressDesc'
  | 'progressAsc'
  | 'titleAsc'
  | 'titleDesc'
  | 'clientAsc';

export type StatusFilter = 'all' | 'active' | 'completed' | 'paused';

type Item = {
  id: string;
  title: string;
  client?: string | null;
  status: 'active' | 'completed' | 'paused';
  progress: number;
  startDate?: string | null;
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
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    try {
      const savedSort = localStorage.getItem('client-hub-project-sort') as SortOption | null;
      if (savedSort) {
        setSortBy(savedSort);
      }
      const savedFilter = localStorage.getItem('client-hub-project-filter') as StatusFilter | null;
      if (savedFilter) {
        setStatusFilter(savedFilter);
      }
    } catch {}
  }, []);

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    try {
      localStorage.setItem('client-hub-project-sort', newSort);
    } catch {}
  };

  const handleFilterChange = (newFilter: StatusFilter) => {
    setStatusFilter(newFilter);
    try {
      localStorage.setItem('client-hub-project-filter', newFilter);
    } catch {}
  };

  useEffect(() => {
    setLoadingId(null);
  }, [activeId]);

  // Compute counts for status badges
  const counts = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.status === 'active').length;
    const completed = projects.filter((p) => p.status === 'completed').length;
    const paused = projects.filter((p) => p.status === 'paused').length;
    return { total, active, completed, paused };
  }, [projects]);

  const filteredAndSortedProjects = useMemo(() => {
    const filtered = projects.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) {
        return false;
      }
      return true;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest': {
          const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
          const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
          return dateB - dateA;
        }
        case 'oldest': {
          const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
          const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
          return dateA - dateB;
        }
        case 'progressDesc':
          return (b.progress ?? 0) - (a.progress ?? 0);
        case 'progressAsc':
          return (a.progress ?? 0) - (b.progress ?? 0);
        case 'titleAsc':
          return a.title.localeCompare(b.title);
        case 'titleDesc':
          return b.title.localeCompare(a.title);
        case 'clientAsc':
          return (a.client ?? '').localeCompare(b.client ?? '');
        default:
          return 0;
      }
    });
  }, [projects, statusFilter, sortBy]);

  return (
    <nav className="space-y-2.5">
      <div className="flex items-center justify-between gap-1.5 px-1">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Sparkles size={11} />
          {t('admin.projects')}
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">
          {statusFilter === 'all'
            ? projects.length
            : `${filteredAndSortedProjects.length}/${projects.length}`}
        </span>
      </div>

      {/* Status Filter Buttons */}
      <div className={cn('grid gap-1', counts.paused > 0 ? 'grid-cols-4' : 'grid-cols-3')}>
        <button
          type="button"
          onClick={() => handleFilterChange('all')}
          className={cn(
            'rounded py-1 px-1 text-center text-[11px] font-medium transition-colors truncate',
            statusFilter === 'all'
              ? 'bg-accent text-accent-foreground'
              : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          {t('admin.filter.all')} ({counts.total})
        </button>
        <button
          type="button"
          onClick={() => handleFilterChange('active')}
          className={cn(
            'rounded py-1 px-1 text-center text-[11px] font-medium transition-colors truncate',
            statusFilter === 'active'
              ? 'bg-accent text-accent-foreground'
              : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          {t('admin.filter.active')} ({counts.active})
        </button>
        <button
          type="button"
          onClick={() => handleFilterChange('completed')}
          className={cn(
            'rounded py-1 px-1 text-center text-[11px] font-medium transition-colors truncate',
            statusFilter === 'completed'
              ? 'bg-emerald-500 text-white dark:bg-emerald-600'
              : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          {t('admin.filter.completed')} ({counts.completed})
        </button>
        {counts.paused > 0 && (
          <button
            type="button"
            onClick={() => handleFilterChange('paused')}
            className={cn(
              'rounded py-1 px-1 text-center text-[11px] font-medium transition-colors truncate',
              statusFilter === 'paused'
                ? 'bg-amber-500 text-white dark:bg-amber-600'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {t('admin.filter.paused')} ({counts.paused})
          </button>
        )}
      </div>

      {/* Sort Selector */}
      <div className="relative">
        <ArrowUpDown size={12} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <select
          aria-label={t('admin.sort.label')}
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value as SortOption)}
          className="h-7 w-full appearance-none rounded-md border border-border bg-background pl-6 pr-6 text-[11px] font-medium text-foreground outline-none hover:bg-muted focus:border-accent cursor-pointer"
        >
          <option value="newest">{t('admin.sort.newest')}</option>
          <option value="oldest">{t('admin.sort.oldest')}</option>
          <option value="progressDesc">{t('admin.sort.progressDesc')}</option>
          <option value="progressAsc">{t('admin.sort.progressAsc')}</option>
          <option value="titleAsc">{t('admin.sort.titleAsc')}</option>
          <option value="titleDesc">{t('admin.sort.titleDesc')}</option>
          <option value="clientAsc">{t('admin.sort.clientAsc')}</option>
        </select>
        <ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
      </div>

      {/* Projects List */}
      <ul className="space-y-0.5 pt-0.5">
        {filteredAndSortedProjects.length === 0 && (
          <li className="px-3 py-2 text-xs text-muted-foreground">
            {t('admin.noProjectsFound')}
          </li>
        )}
        {filteredAndSortedProjects.map((p) => {
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

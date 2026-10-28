'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Reveal } from '@/components/ui/reveal';
import { useLanguage } from '@/lib/i18n/context';
import type { Project } from '@/lib/types';
import {
  ArrowUpDown,
  Search,
  X,
  ArrowUpRight,
  Filter,
  Layers,
  FolderOpen,
} from 'lucide-react';

type SortOption =
  | 'newest'
  | 'oldest'
  | 'progressDesc'
  | 'progressAsc'
  | 'titleAsc'
  | 'titleDesc'
  | 'clientAsc';

type StatusFilter = 'all' | 'active' | 'completed' | 'paused';

export function AdminProjectsList({
  initialProjects,
}: {
  initialProjects: Project[];
}) {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Compute counts for status badges
  const counts = useMemo(() => {
    const total = initialProjects.length;
    const active = initialProjects.filter((p) => p.status === 'active').length;
    const completed = initialProjects.filter((p) => p.status === 'completed').length;
    const paused = initialProjects.filter((p) => p.status === 'paused').length;
    return { total, active, completed, paused };
  }, [initialProjects]);

  // Filter & sort
  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = initialProjects.filter((p) => {
      // Status filter
      if (statusFilter !== 'all' && p.status !== statusFilter) {
        return false;
      }

      // Search query
      if (q) {
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesClient = (p.client ?? '').toLowerCase().includes(q);
        const matchesEmail = (p.clientEmail ?? '').toLowerCase().includes(q);
        const matchesTags = (p.tags ?? []).some((tag) =>
          tag.toLowerCase().includes(q)
        );
        const matchesId = p.id.toLowerCase().includes(q);
        if (!matchesTitle && !matchesClient && !matchesEmail && !matchesTags && !matchesId) {
          return false;
        }
      }

      return true;
    });

    // Sorting
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
  }, [initialProjects, search, statusFilter, sortBy]);

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <Reveal>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{t('admin.projects')}</h2>
            <Badge className="bg-muted text-muted-foreground text-xs font-mono">
              {filteredProjects.length}
            </Badge>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center">
              <ArrowUpDown size={13} className="pointer-events-none absolute left-2.5 text-muted-foreground" />
              <select
                aria-label={t('admin.sort.label')}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-8 appearance-none rounded-md border border-border bg-background pl-7 pr-8 text-xs font-medium text-foreground outline-none hover:bg-muted focus:border-accent cursor-pointer"
              >
                <option value="newest">{t('admin.sort.newest')}</option>
                <option value="oldest">{t('admin.sort.oldest')}</option>
                <option value="progressDesc">{t('admin.sort.progressDesc')}</option>
                <option value="progressAsc">{t('admin.sort.progressAsc')}</option>
                <option value="titleAsc">{t('admin.sort.titleAsc')}</option>
                <option value="titleDesc">{t('admin.sort.titleDesc')}</option>
                <option value="clientAsc">{t('admin.sort.clientAsc')}</option>
              </select>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Filter and Search Bar */}
      <Reveal delay={0.02}>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          {/* Search box */}
          <div className="relative flex-1">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin.search.placeholder')}
              className="h-8 w-full rounded-md border border-border bg-background pl-9 pr-8 text-xs text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-accent"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {t('admin.filter.all')} ({counts.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                statusFilter === 'active'
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {t('admin.filter.active')} ({counts.active})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-emerald-500 text-white dark:bg-emerald-600'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {t('admin.filter.completed')} ({counts.completed})
            </button>
            {counts.paused > 0 && (
              <button
                type="button"
                onClick={() => setStatusFilter('paused')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  statusFilter === 'paused'
                    ? 'bg-amber-500 text-white dark:bg-amber-600'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {t('admin.filter.paused')} ({counts.paused})
              </button>
            )}
          </div>
        </div>
      </Reveal>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <Reveal delay={0.04}>
          <Card className="flex flex-col items-center justify-center p-8 text-center text-xs text-muted-foreground">
            <FolderOpen size={28} className="mb-2 text-muted-foreground/60" />
            <p className="font-medium text-foreground">{t('admin.noProjectsFound')}</p>
            {(search || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                }}
                className="mt-3 rounded-md bg-muted px-3 py-1.5 text-xs text-foreground hover:bg-muted/80 transition-colors"
              >
                {t('admin.clearFilters')}
              </button>
            )}
          </Card>
        </Reveal>
      ) : (
        <div className="space-y-3">
          {filteredProjects.map((p, i) => (
            <Reveal key={p.id} delay={Math.min(i * 0.04, 0.3)}>
              <Card className="p-5 transition-colors hover:border-accent/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/${p.id}`}
                        className="font-semibold text-foreground hover:text-accent truncate"
                      >
                        {p.title}
                      </Link>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {p.client}
                      {p.clientEmail ? ` · ${p.clientEmail}` : ''}
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {(p.tags ?? []).map((tag) => (
                        <Badge key={tag} className="text-[10px] py-0.5">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <Badge
                      className={
                        p.status === 'active'
                          ? 'bg-accent/10 text-accent border-accent/20'
                          : p.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }
                    >
                      {p.status}
                    </Badge>
                    <div className="text-xs font-mono text-muted-foreground">
                      {p.progress}%
                    </div>
                    <Link
                      href={`/admin/${p.id}`}
                      className="inline-flex items-center gap-1 text-xs text-accent hover:underline font-medium"
                    >
                      {t('admin.manage')} <ArrowUpRight size={11} />
                    </Link>
                  </div>
                </div>
                {p.dayCurrent !== undefined && p.dayTotal ? (
                  <div className="mt-3.5 space-y-1">
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-accent transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (p.dayCurrent / p.dayTotal) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>
                        {t('admin.dayProgress')
                          .replace('{current}', String(p.dayCurrent))
                          .replace('{total}', String(p.dayTotal))}
                      </span>
                      <span>
                        {Math.round((p.dayCurrent / p.dayTotal) * 100)}%
                      </span>
                    </div>
                  </div>
                ) : null}
              </Card>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

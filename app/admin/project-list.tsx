'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

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
  return (
    <nav className="space-y-1">
      <div className="mb-2 flex items-center gap-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Sparkles size={11} />
        Projects
      </div>
      <ul className="space-y-0.5">
        {projects.length === 0 && (
          <li className="px-3 py-2 text-xs text-muted-foreground">
            No projects yet.
          </li>
        )}
        {projects.map((p) => {
          const active = p.id === activeId;
          return (
            <li key={p.id}>
              <Link
                href={`/admin/${p.id}`}
                className={cn(
                  'block rounded-md px-3 py-2 text-xs transition-colors',
                  active
                    ? 'bg-accent/10 text-accent'
                    : 'hover:bg-muted text-foreground/80'
                )}
              >
                <div className="truncate font-medium">{p.title}</div>
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

import { Card } from '@/components/ui/card';
import { formatDate, timeAgo } from '@/lib/utils';
import { Calendar, Activity, Hash, Mail } from 'lucide-react';

type Project = {
  id: string;
  title: string;
  description?: string | null;
  client_name: string;
  client_email?: string | null;
  status: string;
  progress: number;
  day_current?: number;
  day_total?: number;
  start_date?: string | null;
  estimated_end?: string | null;
  completed_date?: string | null;
  tags?: string[];
  demo?: string | null;
  github?: string | null;
};

export default function ProjectStats({ project }: { project: Project }) {
  const rows: { icon: React.ReactNode; label: string; value: React.ReactNode }[] = [
    { icon: <Hash size={12} />, label: 'Project ID', value: <span className="font-mono text-foreground">{project.id}</span> },
    {
      icon: <Mail size={12} />,
      label: 'Client email',
      value: project.client_email ?? <span className="text-muted-foreground">—</span>,
    },
    {
      icon: <Calendar size={12} />,
      label: 'Started',
      value: project.start_date ? formatDate(project.start_date) : '—',
    },
    {
      icon: <Calendar size={12} />,
      label: 'Est. end',
      value: project.estimated_end ? formatDate(project.estimated_end) : '—',
    },
    ...(project.day_current !== undefined && project.day_total
      ? [
          {
            icon: <Activity size={12} />,
            label: 'Day',
            value: (
              <span className="text-foreground">
                {project.day_current} / {project.day_total}
              </span>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold">Overview</h3>
        {project.description ? (
          <p className="text-sm text-muted-foreground">{project.description}</p>
        ) : (
          <p className="text-xs text-muted-foreground">No description.</p>
        )}
        <div className="mt-4 space-y-2">
          {project.demo && (
            <a
              href={project.demo}
              target="_blank"
              rel="noreferrer"
              className="block text-xs text-accent hover:underline"
            >
              Demo ↗
            </a>
          )}
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noreferrer"
              className="block text-xs text-accent hover:underline"
            >
              Repository ↗
            </a>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold">Metadata</h3>
        <dl className="space-y-2 text-xs">
          {rows.map((r) => (
            <div key={r.label} className="flex items-start justify-between gap-2">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                {r.icon}
                {r.label}
              </dt>
              <dd className="text-right">{r.value}</dd>
            </div>
          ))}
          {project.completed_date && (
            <div className="flex items-start justify-between gap-2">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar size={12} /> Completed
              </dt>
              <dd className="text-right text-foreground">
                {formatDate(project.completed_date)}
              </dd>
            </div>
          )}
        </dl>
        <div className="mt-3 text-[10px] text-muted-foreground">
          Last touched {timeAgo(project.start_date ?? new Date().toISOString())}
        </div>
      </Card>
    </div>
  );
}

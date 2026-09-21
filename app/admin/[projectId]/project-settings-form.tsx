'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';

type Project = {
  id: string;
  title: string;
  description?: string | null;
  client_name: string;
  client_email?: string | null;
  status: 'active' | 'completed' | 'paused';
  progress: number;
  day_current?: number;
  day_total?: number;
  demo?: string | null;
  github?: string | null;
};

export default function ProjectSettingsForm({
  project,
}: {
  project: Project;
}) {
  const [title, setTitle] = useState(project.title);
  const [clientName, setClientName] = useState(project.client_name);
  const [clientEmail, setClientEmail] = useState(project.client_email ?? '');
  const [status, setStatus] = useState(project.status);
  const [progress, setProgress] = useState(project.progress);
  const [dayCurrent, setDayCurrent] = useState(project.day_current ?? 0);
  const [dayTotal, setDayTotal] = useState(project.day_total ?? 0);
  const [demo, setDemo] = useState(project.demo ?? '');
  const [github, setGithub] = useState(project.github ?? '');
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const router = useRouter();

  function save() {
    setFeedback(null);
    startTransition(async () => {
      const res = await fetch('/api/projects/update', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          title: title.trim(),
          client_name: clientName.trim(),
          client_email: clientEmail.trim() || null,
          status,
          progress,
          day_current: dayCurrent,
          day_total: dayTotal,
          demo: demo.trim() || null,
          github: github.trim() || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setFeedback(`❌ ${d.error ?? 'failed'}`);
        return;
      }
      setFeedback('✅ Saved');
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Title">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
          />
        </Field>
        <Field label="Client name">
          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
          />
        </Field>
        <Field label="Client email">
          <input
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
          />
        </Field>
        <Field label="Status">
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as 'active' | 'completed' | 'paused')
            }
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </Field>
        <Field label={`Progress: ${progress}%`}>
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="w-full"
          />
        </Field>
        <Field label="Day">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={dayCurrent}
              onChange={(e) => setDayCurrent(Number(e.target.value))}
              className="w-20 rounded-md border border-border bg-background px-2 py-1 text-sm"
            />
            <span className="text-xs text-muted-foreground">/</span>
            <input
              type="number"
              value={dayTotal}
              onChange={(e) => setDayTotal(Number(e.target.value))}
              className="w-20 rounded-md border border-border bg-background px-2 py-1 text-sm"
            />
          </div>
        </Field>
        <Field label="Demo URL">
          <input
            value={demo}
            onChange={(e) => setDemo(e.target.value)}
            placeholder="https://…"
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
          />
        </Field>
        <Field label="GitHub URL">
          <input
            value={github}
            onChange={(e) => setGithub(e.target.value)}
            placeholder="https://github.com/…"
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
          />
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
        >
          {pending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save settings
        </button>
        {feedback && (
          <div className="text-xs text-muted-foreground">{feedback}</div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

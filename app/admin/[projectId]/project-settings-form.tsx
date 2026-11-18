'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Info, Loader2, Save } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';

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
  telegram_bot_token?: string | null;
  telegram_chat_id?: string | null;
  client_telegram_token?: string | null;
  client_telegram_chat_id?: string | null;
};

export default function ProjectSettingsForm({
  project,
}: {
  project: Project;
}) {
  const { t } = useLanguage();
  const [title, setTitle] = useState(project.title);
  const [clientName, setClientName] = useState(project.client_name);
  const [clientEmail, setClientEmail] = useState(project.client_email ?? '');
  const [clientPassword, setClientPassword] = useState('');
  const [status, setStatus] = useState(project.status);
  const [progress, setProgress] = useState(project.progress);
  const [dayCurrent, setDayCurrent] = useState(project.day_current ?? 0);
  const [dayTotal, setDayTotal] = useState(project.day_total ?? 0);
  const [demo, setDemo] = useState(project.demo ?? '');
  const [github, setGithub] = useState(project.github ?? '');
  const [telegramBotToken, setTelegramBotToken] = useState(project.telegram_bot_token ?? '');
  const [telegramChatId, setTelegramChatId] = useState(project.telegram_chat_id ?? '');
  const [clientTelegramToken, setClientTelegramToken] = useState(project.client_telegram_token ?? '');
  const [clientTelegramChatId, setClientTelegramChatId] = useState(project.client_telegram_chat_id ?? '');
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
    savedAt?: string;
  } | null>(null);
  const router = useRouter();

  function save() {
    setFeedback(null);
    startTransition(async () => {
      try {
        const res = await fetch('/api/projects/update', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            projectId: project.id,
            title: title.trim(),
            client_name: clientName.trim(),
            client_email: clientEmail.trim() || null,
            client_password: clientPassword.trim() || undefined,
            status,
            progress,
            day_current: dayCurrent,
            day_total: dayTotal,
            demo: demo.trim() || null,
            github: github.trim() || null,
            telegram_bot_token: telegramBotToken.trim() || null,
            telegram_chat_id: telegramChatId.trim() || null,
            client_telegram_token: clientTelegramToken.trim() || null,
            client_telegram_chat_id: clientTelegramChatId.trim() || null,
          }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          setFeedback({
            type: 'error',
            text: d.error ?? t('admin.settings.saveError'),
          });
          return;
        }
        setClientPassword('');
        setFeedback({
          type: 'success',
          text: t('admin.settings.savedSuccess'),
          savedAt: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
        });
        router.refresh();
      } catch (err: any) {
        setFeedback({
          type: 'error',
          text: err?.message ?? t('admin.settings.saveError'),
        });
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Title" hint={t('admin.settings.hint.title')}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
          />
        </Field>
        <Field label="Client name" hint={t('admin.settings.hint.clientName')}>
          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
          />
        </Field>
        <Field label="Client email" hint={t('admin.settings.hint.clientEmail')}>
          <input
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
          />
        </Field>
        <Field label="Client password (leave blank to keep unchanged)" hint={t('admin.settings.hint.clientPassword')}>
          <input
            type="text"
            value={clientPassword}
            onChange={(e) => setClientPassword(e.target.value)}
            placeholder="Default: email username before @"
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
          />
        </Field>
        <Field label="Status" hint={t('admin.settings.hint.status')}>
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
        <Field label={`Progress: ${progress}%`} hint={t('admin.settings.hint.progress')}>
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="w-full"
          />
        </Field>
        <Field label="Day" hint={t('admin.settings.hint.day')}>
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
        <Field label="Demo URL" hint={t('admin.settings.hint.demo')}>
          <input
            value={demo}
            onChange={(e) => setDemo(e.target.value)}
            placeholder="https://…"
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
          />
        </Field>
        <Field label="GitHub URL" hint={t('admin.settings.hint.github')}>
          <input
            value={github}
            onChange={(e) => setGithub(e.target.value)}
            placeholder="https://github.com/…"
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
          />
        </Field>
        <Field label={t('admin.settings.telegramBotTokenLabel')} hint={t('admin.settings.hint.telegramBotToken')}>
          <input
            value={telegramBotToken}
            onChange={(e) => setTelegramBotToken(e.target.value)}
            placeholder={t('admin.settings.telegramBotTokenPlaceholder')}
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent font-mono text-xs"
          />
        </Field>
        <Field label={t('admin.settings.telegramChatIdLabel')} hint={t('admin.settings.hint.telegramChatId')}>
          <input
            value={telegramChatId}
            onChange={(e) => setTelegramChatId(e.target.value)}
            placeholder={t('admin.settings.telegramChatIdPlaceholder')}
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent font-mono text-xs"
          />
        </Field>
        <Field label={t('admin.settings.clientTelegramBotTokenLabel')} hint={t('admin.settings.hint.clientTelegramBotToken')}>
          <input
            value={clientTelegramToken}
            onChange={(e) => setClientTelegramToken(e.target.value)}
            placeholder={t('admin.settings.clientTelegramBotTokenPlaceholder')}
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent font-mono text-xs"
          />
        </Field>
        <Field label={t('admin.settings.clientTelegramChatIdLabel')} hint={t('admin.settings.hint.clientTelegramChatId')}>
          <input
            value={clientTelegramChatId}
            onChange={(e) => setClientTelegramChatId(e.target.value)}
            placeholder={t('admin.settings.clientTelegramChatIdPlaceholder')}
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent font-mono text-xs"
          />
        </Field>
      </div>

      {feedback && (
        <div
          role="status"
          className={`flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-xs transition-all ${
            feedback.type === 'success'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300'
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            {feedback.type === 'success' ? (
              <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle size={15} className="shrink-0 text-red-500" />
            )}
            <span>{feedback.text}</span>
          </div>
          {feedback.savedAt && (
            <span className="shrink-0 font-mono text-[11px] opacity-75">
              {feedback.savedAt}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-1">
        <button
          onClick={save}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              {t('admin.settings.saving')}
            </>
          ) : (
            <>
              <Save size={14} />
              {t('admin.settings.save')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: React.ReactNode;
  hint?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="block">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <span>{label}</span>
        {hint && (
          <div className="relative inline-flex items-center">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              onBlur={() => setOpen(false)}
              title={hint}
              aria-label={hint}
              className="group inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground focus:outline-none"
            >
              <Info size={12} />
              <span
                role="tooltip"
                className={`pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 w-60 -translate-x-1/2 rounded-md border border-border bg-popover px-2.5 py-1.5 text-left text-[11px] font-normal leading-snug text-popover-foreground shadow-md transition-opacity ${
                  open ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
                }`}
              >
                {hint}
              </span>
            </button>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

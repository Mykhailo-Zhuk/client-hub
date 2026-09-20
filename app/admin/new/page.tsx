import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Reveal } from '@/components/ui/reveal';
import { ArrowLeft } from 'lucide-react';
import { createProject } from '@/lib/projects-db';

export const dynamic = 'force-dynamic';

async function createProjectAction(formData: FormData) {
  'use server';

  const id = (formData.get('id') as string)?.trim();
  const clientName = (formData.get('client_name') as string)?.trim();
  const clientEmail = (formData.get('client_email') as string)?.trim();
  const title = (formData.get('title') as string)?.trim();

  if (!id || !clientName || !clientEmail || !title) {
    throw new Error('Missing required fields: id, client_name, client_email, title');
  }
  // slug sanity: lowercase, hyphens only
  if (!/^[a-z0-9-]+$/.test(id)) {
    throw new Error('Project ID must be lowercase letters, digits and hyphens only (e.g. iron-master).');
  }

  const tagsRaw = (formData.get('tags') as string) ?? '';
  const tags = tagsRaw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const row = {
    id,
    client_name: clientName,
    client_email: clientEmail,
    title,
    description: ((formData.get('description') as string) ?? '').trim() || null,
    status: 'active' as const,
    progress: clamp(parseInt((formData.get('progress') as string) || '0', 10), 0, 100),
    day_current: parseInt((formData.get('day_current') as string) || '0', 10) || 0,
    day_total: parseInt((formData.get('day_total') as string) || '30', 10) || 30,
    start_date: ((formData.get('start_date') as string) || '').trim() || null,
    estimated_end: ((formData.get('estimated_end') as string) || '').trim() || null,
    tags,
    github: ((formData.get('github') as string) ?? '').trim() || null,
    demo: ((formData.get('demo') as string) ?? '').trim() || null,
    cover: ((formData.get('cover') as string) ?? '').trim() || null,
  };

  // createProject() throws on duplicate id / supabase error.
  await createProject(row);
  redirect(`/admin/${id}`);
}

function clamp(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function Field({
  name,
  label,
  required,
  type = 'text',
  placeholder,
  defaultValue,
}: {
  name: string;
  label: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
      />
    </div>
  );
}

function Textarea({ name, label }: { name: string; label: string }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={3}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
      />
    </div>
  );
}

export default function NewProjectPage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <Reveal>
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={12} /> Back to admin
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create new project</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Inserts a row into the Supabase <code>projects</code> table. After creation the
          client can sign in via magic link using the email you provide.
        </p>
      </Reveal>

      <Reveal delay={0.05}>
        <Card className="mt-6 p-6">
          <form action={createProjectAction} className="space-y-6">
            <Field
              name="id"
              label="Project ID (slug)"
              required
              placeholder="iron-master"
            />
            <Field
              name="client_name"
              label="Client name"
              required
              placeholder="СТО IRON MASTER"
            />
            <Field
              name="client_email"
              label="Client email (for magic link)"
              required
              type="email"
              placeholder="client@example.com"
            />
            <Field
              name="title"
              label="Project title"
              required
              placeholder="Iron Master — MVP"
            />
            <Textarea name="description" label="Description" />

            <div className="grid grid-cols-3 gap-4">
              <Field
                name="progress"
                label="Progress %"
                type="number"
                defaultValue="0"
              />
              <Field
                name="day_current"
                label="Day current"
                type="number"
                defaultValue="0"
              />
              <Field
                name="day_total"
                label="Day total"
                type="number"
                defaultValue="30"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field
                name="start_date"
                label="Start date"
                type="date"
                required
              />
              <Field
                name="estimated_end"
                label="Estimated end"
                type="date"
                required
              />
            </div>

            <Field
              name="tags"
              label="Tags (comma-separated)"
              placeholder="Next.js, Tailwind, Booking"
            />
            <Field
              name="github"
              label="GitHub URL"
              placeholder="https://github.com/..."
            />
            <Field
              name="demo"
              label="Live demo URL"
              placeholder="https://...vercel.app"
            />
            <Field
              name="cover"
              label="Cover image URL"
              placeholder="https://images.unsplash.com/..."
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <Link
                href="/admin"
                className="inline-flex items-center rounded-md border border-border bg-background px-4 py-2 text-xs hover:bg-muted"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="inline-flex items-center rounded-md bg-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
              >
                Create project
              </button>
            </div>
          </form>
        </Card>
      </Reveal>
    </section>
  );
}
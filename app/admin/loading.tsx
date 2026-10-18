import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function AdminLoading() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <div className="flex items-center gap-2">
        <Loader2 size={18} className="animate-spin text-accent" />
        <h1 className="text-xl font-bold tracking-tight">Завантаження адмін-панелі…</h1>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <Card className="h-28 animate-pulse bg-muted/40 p-5" />
          <Card className="h-28 animate-pulse bg-muted/40 p-5" />
          <Card className="h-28 animate-pulse bg-muted/40 p-5" />
        </div>
        <div className="space-y-3">
          <Card className="h-20 animate-pulse bg-muted/40 p-3" />
          <Card className="h-20 animate-pulse bg-muted/40 p-3" />
        </div>
      </div>
    </section>
  );
}

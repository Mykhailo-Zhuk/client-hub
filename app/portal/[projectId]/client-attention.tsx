'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Send, Loader2, ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/ui/reveal';
import { submitRequestResponseAction } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { timeAgo } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/context';
import type { ProjectRequest } from '@/lib/types';

export function ClientAttention({ requests }: { requests: ProjectRequest[] }) {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const pending = requests.filter((r) => r.status === 'pending');
  if (pending.length === 0) return null;

  const handleSubmitReply = async (requestId: string) => {
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    try {
      await submitRequestResponseAction(requestId, replyText.trim());
      setReplyingId(null);
      setReplyText('');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit response';
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Reveal delay={0.05}>
      <Card className="border-amber-500/30 bg-amber-500/5 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <AlertCircle size={15} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">{t('attention.title')}</h2>
              <p className="text-xs text-muted-foreground">
                {t('attention.subtitle')}
              </p>
            </div>
          </div>
          <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-500 text-[11px] font-medium">
            {pending.length} {t('attention.pendingBadge')}
          </Badge>
        </div>

        <div className="space-y-3">
          {pending.map((req) => (
            <div
              key={req.id}
              className="rounded-lg border border-border bg-card p-4 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <Badge className="shrink-0 mt-0.5 border-amber-500/30 bg-amber-500/10 text-amber-500 text-[10px] font-medium">
                    {t('attention.actionNeeded')}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-snug break-words">
                      {req.text}
                    </p>
                    <span className="text-[11px] text-muted-foreground mt-1 inline-block">
                      {timeAgo(req.created_at, locale)}
                    </span>
                  </div>
                </div>

                {replyingId !== req.id && (
                  <button
                    onClick={() => {
                      setReplyingId(req.id);
                      setReplyText('');
                    }}
                    className="shrink-0 inline-flex items-center gap-1 rounded-md bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent/20 transition-colors"
                  >
                    {t('attention.reply')} <ArrowRight size={12} />
                  </button>
                )}
              </div>

              {replyingId === req.id && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmitReply(req.id);
                  }}
                  className="mt-3 border-t border-border/60 pt-3 flex flex-col gap-2"
                >
                  <textarea
                    autoFocus
                    rows={2}
                    className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
                    placeholder={t('attention.placeholder')}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        handleSubmitReply(req.id);
                      }
                    }}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground">
                      {t('attention.hint')}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingId(null);
                          setReplyText('');
                        }}
                        className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        {t('attention.cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !replyText.trim()}
                        className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1 text-xs font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 size={12} className="animate-spin" /> {t('attention.sending')}
                          </>
                        ) : (
                          <>
                            <Send size={12} /> {t('attention.sendReply')}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      </Card>
    </Reveal>
  );
}

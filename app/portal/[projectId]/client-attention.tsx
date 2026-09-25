'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Send } from 'lucide-react';
import { Reveal } from '@/components/ui/reveal';
import { submitRequestResponseAction } from '@/app/actions';
import { useRouter } from 'next/navigation';

interface Request {
  id: string;
  text: string;
  status: 'pending' | 'fulfilled';
  created_at: string;
}

export function ClientAttention({ requests }: { requests: Request[] }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const pending = requests.filter(r => r.status === 'pending');

  const handleSubmitReply = async (requestId: string) => {
    if (!replyText.trim()) return;
    
    setIsSubmitting(true);
    try {
      await submitRequestResponseAction(requestId, replyText.trim());
      setReplyingId(null);
      setReplyText('');
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to submit response');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Reveal delay={0.05}>
      <Card className="mb-8 border-amber-500 bg-amber-500/10 p-6 shadow-sm ring-1 ring-amber-500/20">
        <div className="flex items-center gap-2 mb-4 text-amber-600">
          <AlertCircle size={20} className="animate-pulse" />
          <h2 className="text-lg font-bold">Attention Required</h2>
        </div>
        
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            Наразі запитів немає
          </p>
        ) : (
          <div className="grid gap-3">
            {pending.map((req) => (
              <div 
                key={req.id} 
                className="flex flex-col gap-3 rounded-lg border border-amber-200/50 bg-background/50 p-3"
              >
                <div className="flex items-start gap-3">
                  <Badge className="mt-1 shrink-0 text-amber-600 border-amber-200">
                    Action Needed
                  </Badge>
                  <p className="text-sm text-foreground/90">{req.text}</p>
                </div>

                {replyingId === req.id ? (
                  <div className="flex gap-2 mt-2">
                    <input 
                      autoFocus
                      className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Your response..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSubmitReply(req.id);
                      }}
                    />
                    <button 
                      onClick={() => handleSubmitReply(req.id)}
                      disabled={isSubmitting || !replyText.trim()}
                      className="inline-flex items-center justify-center rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                    >
                      <Send size={14} className="mr-2" />
                      Send
                    </button>
                    <button 
                      onClick={() => setReplyingId(null)}
                      className="text-xs text-muted-foreground px-2 py-1 hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setReplyingId(req.id)}
                    className="self-start text-xs font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1"
                  >
                    Reply to this request →
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        
        {pending.length > 0 && (
          <p className="mt-4 text-xs text-muted-foreground">
            Please provide the requested information via the portal.
          </p>
        )}
      </Card>
    </Reveal>
  );
}

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { Reveal } from '@/components/ui/reveal';

interface Request {
  id: string;
  text: string;
  status: 'pending' | 'fulfilled';
  created_at: string;
}

export function ClientAttention({ requests }: { requests: Request[] }) {
  const pending = requests.filter(r => r.status === 'pending');

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
                className="flex items-start gap-3 rounded-lg border border-amber-200/50 bg-background/50 p-3"
              >
                <Badge className="mt-1 shrink-0 text-amber-600 border-amber-200">
                  Action Needed
                </Badge>
                <p className="text-sm text-foreground/90">{req.text}</p>
              </div>
            ))}
          </div>
        )}
        
        {pending.length > 0 && (
          <p className="mt-4 text-xs text-muted-foreground">
            Please provide the requested information via the project timeline or your account manager.
          </p>
        )}
      </Card>
    </Reveal>
  );
}

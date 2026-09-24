'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, CheckCircle2, Clock } from 'lucide-react';
import { createRequestAction, updateRequestStatusAction } from '@/app/actions';

interface Request {
  id: string;
  text: string;
  status: 'pending' | 'fulfilled';
  created_at: string;
}

export default function ClientRequestsManager({ 
  projectId, 
  initialRequests = [] 
}: { 
  projectId: string; 
  initialRequests: Request[];
}) {
  const [requests, setRequests] = useState<Request[]>(initialRequests);
  const [newRequestText, setNewRequestText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequestText.trim()) return;

    setIsSubmitting(true);
    try {
      await createRequestAction({
        projectId,
        text: newRequestText.trim(),
      });
      
      setNewRequestText('');
      
      const response = await fetch(`/api/projects/${projectId}/requests`);
      if (!response.ok) throw new Error('Failed to refresh requests');
      const updated = await response.json();
      setRequests(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to create request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkFulfilled = async (requestId: string) => {
    try {
      await updateRequestStatusAction(requestId, 'fulfilled');
      setRequests(prev => 
        prev.map(r => r.id === requestId ? { ...r, status: 'fulfilled' } : r)
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-accent/5 border border-accent/20 p-3 text-sm text-muted-foreground">
        Створіть запит, щоб клієнт побачив його у блоці 'Потрібна ваша увага' на своєму порталі. 
        Після отримання інформації позначте запит як виконаний.
      </div>
      <form onSubmit={handleCreateRequest} className="flex gap-2">
        <input 
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder="Enter a request for the client (e.g. 'Please send the logo file')" 
          value={newRequestText}
          onChange={(e) => setNewRequestText(e.target.value)}
          disabled={isSubmitting}
        />
        <button 
          type="submit" 
          disabled={isSubmitting || !newRequestText.trim()}
          className="inline-flex items-center justify-center rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
        >
          <Send size={16} className="mr-2" />
          Send
        </button>
      </form>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Request History
        </h3>
        {requests.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
            No requests created yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {requests.map((req) => (
              <Card key={req.id} className="p-3 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3 overflow-hidden">
                  <Badge className={`shrink-0 mt-1 ${req.status === 'pending' ? '' : 'bg-secondary text-secondary-foreground'}`}>
                    {req.status === 'pending' ? (
                      <span className="flex items-center gap-1">
                        <Clock size={10} /> Pending
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-500">
                        <CheckCircle2 size={10} /> Fulfilled
                      </span>
                    )}
                  </Badge>
                  <p className="text-sm truncate">{req.text}</p>
                </div>
                {req.status === 'pending' && (
                  <button 
                    onClick={() => handleMarkFulfilled(req.id)}
                    className="text-xs rounded-md px-2 py-1 hover:bg-muted transition-colors"
                  >
                    Mark Fulfilled
                  </button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

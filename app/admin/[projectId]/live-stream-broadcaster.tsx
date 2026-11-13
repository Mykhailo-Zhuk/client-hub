'use client';

import { useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Radio, Square, Users, Bell, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { STREAM_CHANNEL_PREFIX, STREAM_ICE_SERVERS } from '@/lib/stream';

export default function LiveStreamBroadcaster({ projectId }: { projectId: string }) {
  const [live, setLive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [note, setNote] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [notifyStatus, setNotifyStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  function closePeer(viewerId: string) {
    const pc = peersRef.current.get(viewerId);
    if (pc) {
      pc.close();
      peersRef.current.delete(viewerId);
      setViewerCount(peersRef.current.size);
    }
  }

  async function stopStream() {
    peersRef.current.forEach((pc) => pc.close());
    peersRef.current.clear();
    setViewerCount(0);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (channelRef.current) {
      try {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'stream-ended',
          payload: {},
        });
        await channelRef.current.untrack();
        await channelRef.current.unsubscribe();
      } catch {
        // ignore cleanup errors
      }
      channelRef.current = null;
    }

    setLive(false);
  }

  useEffect(() => {
    return () => {
      void stopStream();
    };
  }, []);

  async function createOfferForViewer(
    viewerId: string,
    stream: MediaStream,
    channel: RealtimeChannel
  ) {
    closePeer(viewerId);

    const pc = new RTCPeerConnection({ iceServers: STREAM_ICE_SERVERS });
    peersRef.current.set(viewerId, pc);
    setViewerCount(peersRef.current.size);

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        void channel.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: {
            viewerId,
            from: 'broadcaster',
            candidate: ev.candidate.toJSON(),
          },
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === 'failed' ||
        pc.connectionState === 'closed' ||
        pc.connectionState === 'disconnected'
      ) {
        closePeer(viewerId);
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await channel.send({
      type: 'broadcast',
      event: 'offer',
      payload: {
        viewerId,
        sdp: pc.localDescription,
      },
    });
  }

  async function startStream() {
    setError(null);
    setNotifyStatus(null);

    const sb = getSupabaseBrowser();
    if (!sb) {
      setError('Supabase Realtime is not configured.');
      return;
    }

    if (!navigator.mediaDevices?.getDisplayMedia) {
      setError('Screen sharing is not supported in this browser.');
      return;
    }

    setStarting(true);
    try {
      // Screen + system/tab audio (no microphone)
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30 } },
        audio: true,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          void stopStream();
        };
      }

      const channel = sb.channel(`${STREAM_CHANNEL_PREFIX}${projectId}`, {
        config: { presence: { key: 'broadcaster' } },
      });
      channelRef.current = channel;

      channel.on('broadcast', { event: 'viewer-join' }, ({ payload }) => {
        const viewerId = payload?.viewerId as string | undefined;
        if (viewerId && streamRef.current) {
          void createOfferForViewer(viewerId, streamRef.current, channel);
        }
      });

      channel.on('broadcast', { event: 'viewer-leave' }, ({ payload }) => {
        const viewerId = payload?.viewerId as string | undefined;
        if (viewerId) closePeer(viewerId);
      });

      channel.on('broadcast', { event: 'answer' }, async ({ payload }) => {
        const viewerId = payload?.viewerId as string | undefined;
        const sdp = payload?.sdp as RTCSessionDescriptionInit | undefined;
        if (!viewerId || !sdp) return;
        const pc = peersRef.current.get(viewerId);
        if (pc && pc.signalingState !== 'stable') {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        }
      });

      channel.on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
        if (payload?.from !== 'viewer') return;
        const viewerId = payload?.viewerId as string | undefined;
        const candidate = payload?.candidate as RTCIceCandidateInit | undefined;
        if (!viewerId || !candidate) return;
        const pc = peersRef.current.get(viewerId);
        if (pc) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
        }
      });

      await new Promise<void>((resolve, reject) => {
        channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              role: 'broadcaster',
              live: true,
              note: note.trim() || undefined,
              startedAt: new Date().toISOString(),
            });
            resolve();
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            reject(new Error(`Realtime channel error: ${status}`));
          }
        });
      });

      setLive(true);

      // Notify client in Telegram if client_telegram_chat_id is set
      const notifyRes = await fetch('/api/stream/notify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ projectId, note: note.trim() }),
      }).catch(() => null);

      if (notifyRes?.ok) {
        const data = await notifyRes.json().catch(() => ({}));
        setNotifyStatus(
          data.notified
            ? 'Telegram: клієнта сповіщено'
            : 'Telegram: у клієнта не вказано Chat ID'
        );
      }
    } catch (err: unknown) {
      await stopStream();
      const msg = err instanceof Error ? err.message : 'Failed to start stream';
      if (!msg.toLowerCase().includes('permission denied') && !msg.toLowerCase().includes('cancelled')) {
        setError(msg);
      }
    } finally {
      setStarting(false);
    }
  }

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className={`inline-flex h-2.5 w-2.5 rounded-full ${
              live ? 'animate-pulse bg-red-500' : 'bg-muted-foreground/40'
            }`}
          />
          <div>
            <div className="text-sm font-semibold">
              {live ? 'LIVE трансляція активна' : 'Live-трансляція для клієнта'}
            </div>
            <div className="text-xs text-muted-foreground">
              {live
                ? 'Клієнт бачить ваш екран та звук вкладки/системи в реальному часі (без мікрофона).'
                : 'Запустіть показ екрану та музики (напр. cliamp), щоб клієнт бачив роботу над проєктом.'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {live && (
            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground">
              <Users size={12} /> {viewerCount}
            </span>
          )}
          {!live ? (
            <button
              type="button"
              onClick={startStream}
              disabled={starting}
              className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              <Radio size={13} />
              {starting ? 'Запуск…' : 'Почати трансляцію'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void stopStream()}
              className="inline-flex items-center gap-1.5 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/20"
            >
              <Square size={12} />
              Зупинити
            </button>
          )}
        </div>
      </div>

      {!live && (
        <div className="mt-3">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Короткий опис (опціонально, напр.: Працюю над формою замовлення)…"
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-accent"
          />
        </div>
      )}

      {notifyStatus && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Bell size={12} className="text-accent" />
          {notifyStatus}
        </div>
      )}

      {error && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-red-500">
          <AlertCircle size={12} />
          {error}
        </div>
      )}

      <div className={live ? 'mt-3 overflow-hidden rounded-lg border border-border bg-black' : 'hidden'}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="max-h-56 w-full object-contain"
        />
      </div>
    </Card>
  );
}

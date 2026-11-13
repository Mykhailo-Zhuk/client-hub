'use client';

import { useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Maximize2, Radio, Volume2, VolumeX } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import {
  STREAM_CHANNEL_PREFIX,
  STREAM_ICE_SERVERS,
  type StreamPresence,
} from '@/lib/stream';

export default function LiveStreamViewer({ projectId }: { projectId: string }) {
  const [isLive, setIsLive] = useState(false);
  const [streamNote, setStreamNote] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [muted, setMuted] = useState(false);
  const [needsUnmuteClick, setNeedsUnmuteClick] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const viewerIdRef = useRef<string>(
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `viewer-${Math.random().toString(36).slice(2)}`
  );

  useEffect(() => {
    const sb = getSupabaseBrowser();
    if (!sb) return;

    const viewerId = viewerIdRef.current;
    const channel = sb.channel(`${STREAM_CHANNEL_PREFIX}${projectId}`, {
      config: { presence: { key: viewerId } },
    });
    channelRef.current = channel;

    function closePeer() {
      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setConnecting(false);
    }

    function requestStream() {
      setConnecting(true);
      void channel.send({
        type: 'broadcast',
        event: 'viewer-join',
        payload: { viewerId },
      });
    }

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<StreamPresence>();
      const allPresences = Object.values(state).flat();
      const broadcaster = allPresences.find((p) => p.role === 'broadcaster' && p.live);

      if (broadcaster) {
        setIsLive(true);
        setStreamNote(broadcaster.note ?? null);
        if (!peerRef.current) {
          requestStream();
        }
      } else {
        setIsLive(false);
        setStreamNote(null);
        closePeer();
      }
    });

    channel.on('broadcast', { event: 'stream-ended' }, () => {
      setIsLive(false);
      setStreamNote(null);
      closePeer();
    });

    channel.on('broadcast', { event: 'offer' }, async ({ payload }) => {
      if (payload?.viewerId !== viewerId || !payload?.sdp) return;

      closePeer();
      const pc = new RTCPeerConnection({ iceServers: STREAM_ICE_SERVERS });
      peerRef.current = pc;

      pc.ontrack = async (ev) => {
        const [remoteStream] = ev.streams;
        if (videoRef.current && remoteStream) {
          videoRef.current.srcObject = remoteStream;
          try {
            videoRef.current.muted = false;
            await videoRef.current.play();
            setMuted(false);
            setNeedsUnmuteClick(false);
          } catch {
            // Browser blocked unmuted autoplay: fall back to muted + show unmute prompt
            if (videoRef.current) {
              videoRef.current.muted = true;
              await videoRef.current.play().catch(() => {});
              setMuted(true);
              setNeedsUnmuteClick(true);
            }
          }
          setConnecting(false);
        }
      };

      pc.onicecandidate = (ev) => {
        if (ev.candidate) {
          void channel.send({
            type: 'broadcast',
            event: 'ice-candidate',
            payload: {
              viewerId,
              from: 'viewer',
              candidate: ev.candidate.toJSON(),
            },
          });
        }
      };

      await pc.setRemoteDescription(
        new RTCSessionDescription(payload.sdp as RTCSessionDescriptionInit)
      );
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await channel.send({
        type: 'broadcast',
        event: 'answer',
        payload: {
          viewerId,
          sdp: pc.localDescription,
        },
      });
    });

    channel.on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
      if (payload?.viewerId !== viewerId || payload?.from !== 'broadcaster') return;
      const candidate = payload?.candidate as RTCIceCandidateInit | undefined;
      if (candidate && peerRef.current) {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      }
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ role: 'viewer', viewerId });
      }
    });

    return () => {
      void channel.send({
        type: 'broadcast',
        event: 'viewer-leave',
        payload: { viewerId },
      });
      closePeer();
      void channel.untrack();
      void channel.unsubscribe();
    };
  }, [projectId]);

  if (!isLive) {
    return null;
  }

  function toggleMute() {
    if (!videoRef.current) return;
    const nextMuted = !videoRef.current.muted;
    videoRef.current.muted = nextMuted;
    setMuted(nextMuted);
    setNeedsUnmuteClick(false);
  }

  function handleFullscreen() {
    if (videoRef.current?.requestFullscreen) {
      void videoRef.current.requestFullscreen();
    }
  }

  return (
    <Card className="overflow-hidden border-red-500/30 bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-red-500/5 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            <Radio size={10} className="animate-pulse" />
            LIVE
          </span>
          <span className="text-xs font-medium text-foreground">
            {streamNote || 'Розробник зараз працює над проєктом'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleMute}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs hover:bg-muted"
          >
            {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            {muted ? 'Увімкнути звук' : 'Звук увімкнено'}
          </button>
          <button
            type="button"
            onClick={handleFullscreen}
            aria-label="Fullscreen"
            className="inline-flex items-center rounded-md border border-border bg-background p-1.5 text-xs hover:bg-muted"
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      <div className="relative bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="max-h-[480px] w-full object-contain"
        />
        {connecting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-xs text-white/80">
            Підключення до трансляції…
          </div>
        )}
        {needsUnmuteClick && !connecting && (
          <button
            type="button"
            onClick={toggleMute}
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-black"
          >
            <Volume2 size={14} /> Увімкнути звук трансляції
          </button>
        )}
      </div>
    </Card>
  );
}

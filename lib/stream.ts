export const STREAM_CHANNEL_PREFIX = 'project-stream:';

const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

export const STREAM_ICE_SERVERS: RTCIceServer[] = [
  {
    urls: [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
    ],
  },
  ...(turnUrl
    ? [
        {
          urls: turnUrl,
          ...(turnUsername ? { username: turnUsername } : {}),
          ...(turnCredential ? { credential: turnCredential } : {}),
        },
      ]
    : []),
];

export interface StreamPresence {
  role: 'broadcaster' | 'viewer';
  live?: boolean;
  note?: string;
  startedAt?: string;
  viewerId?: string;
}

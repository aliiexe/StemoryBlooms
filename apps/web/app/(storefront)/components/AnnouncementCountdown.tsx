'use client';

import { useEffect, useState } from 'react';

type Props = {
  target: Date;
  textColor: string;
  endBehavior: string;
  replacementText: string | null;
};

function pad(n: number) { return String(n).padStart(2, '0'); }

export default function AnnouncementCountdown({ target, textColor, endBehavior, replacementText }: Props) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const calc = () => {
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) {
        setEnded(true);
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ d, h, m, s });
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [target]);

  if (ended) {
    if (endBehavior === 'REPLACE' && replacementText) {
      return <span style={{ color: textColor, fontSize: '0.8rem', fontWeight: 600 }}>{replacementText}</span>;
    }
    if (endBehavior === 'HIDE') return null;
  }

  if (!timeLeft) return null;

  const parts: string[] = [];
  if (timeLeft.d > 0) parts.push(`${timeLeft.d}d`);
  parts.push(`${pad(timeLeft.h)}h ${pad(timeLeft.m)}m ${pad(timeLeft.s)}s`);

  return (
    <span
      style={{ color: textColor, fontSize: '0.8rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: 0.5 }}
      aria-live="off"
      aria-label={`Time remaining: ${parts.join(' ')}`}
    >
      {parts.join(' ')}
    </span>
  );
}

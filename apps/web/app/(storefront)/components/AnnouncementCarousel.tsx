'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import AnnouncementSlide from './AnnouncementSlide';

type Announcement = {
  id: string;
  message: string;
  highlightedText: string | null;
  ctaLabel: string | null;
  linkUrl: string | null;
  wholeBarClickable: boolean;
  openInNewTab: boolean;
  decorativeAsset: string | null;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  linkColor: string;
  barHeight: string;
  textAlignment: string;
  animationType: string;
  isDismissible: boolean;
  dismissalDuration: string;
  dismissalVersion: string;
  countdownEnabled: boolean;
  countdownTarget: Date | null;
  countdownEndBehavior: string;
  countdownReplacementText: string | null;
};

type Settings = {
  autoPlay: boolean;
  loop: boolean;
  intervalSeconds: number;
  transitionType: string;
  transitionDurationMs: number;
  pauseOnHover: boolean;
  showArrows: boolean;
  showIndicators: boolean;
  allowDismissal: boolean;
};

function getDismissalKey(ann: Announcement) {
  return `sb_ann_dismissed_${ann.id}_${ann.dismissalVersion}`;
}

function isDismissed(ann: Announcement): boolean {
  if (!ann.isDismissible) return false;
  try {
    const key = getDismissalKey(ann);
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (data.duration === 'SESSION') return false; // sessions handled by sessionStorage
    if (data.duration === '24H') return Date.now() < data.until;
    if (data.duration === 'CAMPAIGN') return true;
    return false;
  } catch { return false; }
}

function dismiss(ann: Announcement) {
  try {
    const key = getDismissalKey(ann);
    if (ann.dismissalDuration === 'SESSION') {
      sessionStorage.setItem(key, '1');
    } else if (ann.dismissalDuration === '24H') {
      localStorage.setItem(key, JSON.stringify({ duration: '24H', until: Date.now() + 86400000 }));
    } else {
      localStorage.setItem(key, JSON.stringify({ duration: 'CAMPAIGN' }));
    }
  } catch {}
}

function isSessionDismissed(ann: Announcement): boolean {
  try { return !!sessionStorage.getItem(getDismissalKey(ann)); } catch { return false; }
}

export default function AnnouncementCarousel({
  announcements,
  settings,
}: {
  announcements: Announcement[];
  settings: Settings;
}) {
  const prefersReduced = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  const [visible, setVisible] = useState<Announcement[]>([]);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Filter dismissed on client
  useEffect(() => {
    setVisible(
      announcements.filter(a => !isDismissed(a) && !isSessionDismissed(a))
    );
  }, [announcements]);

  const goTo = useCallback((next: number, filtered: Announcement[]) => {
    if (filtered.length <= 1 || prefersReduced.current) {
      setCurrent(next);
      return;
    }
    setExiting(true);
    setTimeout(() => {
      setCurrent(next);
      setExiting(false);
    }, settings.transitionDurationMs);
  }, [settings.transitionDurationMs]);

  const advance = useCallback(() => {
    setVisible(prev => {
      if (prev.length <= 1) return prev;
      setCurrent(c => {
        const next = (c + 1) % prev.length;
        if (!settings.loop && next === 0) return c;
        goTo(next, prev);
        return c; // actual update happens in goTo's setTimeout
      });
      return prev;
    });
  }, [settings.loop, goTo]);

  useEffect(() => {
    if (!settings.autoPlay || visible.length <= 1 || paused) return;
    timerRef.current = setInterval(advance, settings.intervalSeconds * 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [settings.autoPlay, settings.intervalSeconds, visible.length, paused, advance]);

  const handleDismiss = (ann: Announcement) => {
    dismiss(ann);
    setVisible(prev => {
      const next = prev.filter(a => a.id !== ann.id);
      if (current >= next.length) setCurrent(Math.max(0, next.length - 1));
      return next;
    });
  };

  if (visible.length === 0) return null;

  const ann = visible[current] || visible[0];
  const transitionClass = prefersReduced.current ? 'ann-reduced' : `ann-${settings.transitionType.toLowerCase()}`;

  return (
    <div
      style={{
        width: '100%',
        minHeight: ann.barHeight,
        backgroundColor: ann.backgroundColor,
        borderBottom: ann.textColor ? `1px solid ${ann.textColor}18` : undefined,
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={() => settings.pauseOnHover && setPaused(true)}
      onMouseLeave={() => settings.pauseOnHover && setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className={exiting ? `ann-exit ${transitionClass}` : `ann-enter ${transitionClass}`} style={{ width: '100%' }}>
        <AnnouncementSlide
          announcement={ann}
          onDismiss={() => handleDismiss(ann)}
          showDismiss={settings.allowDismissal && ann.isDismissible}
        />
      </div>

      {/* Navigation arrows */}
      {settings.showArrows && visible.length > 1 && (
        <>
          <button
            aria-label="Previous announcement"
            onClick={() => goTo((current - 1 + visible.length) % visible.length, visible)}
            style={arrowStyle('left', ann.textColor)}
          >‹</button>
          <button
            aria-label="Next announcement"
            onClick={() => goTo((current + 1) % visible.length, visible)}
            style={arrowStyle('right', ann.textColor)}
          >›</button>
        </>
      )}

      {/* Indicators */}
      {settings.showIndicators && visible.length > 1 && (
        <div style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4 }}>
          {visible.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to announcement ${i + 1}`}
              onClick={() => goTo(i, visible)}
              style={{
                width: 6, height: 6, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0,
                background: i === current ? ann.textColor : `${ann.textColor}50`,
                transition: 'background 0.2s',
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        .ann-enter { animation: ann-fade-in 0.3s ease; }
        .ann-exit { animation: ann-fade-out 0.3s ease; }
        .ann-slide_h.ann-enter { animation: ann-slide-in-h 0.3s ease; }
        .ann-slide_h.ann-exit { animation: ann-slide-out-h 0.3s ease; }
        .ann-slide_v.ann-enter { animation: ann-slide-in-v 0.3s ease; }
        .ann-slide_v.ann-exit { animation: ann-slide-out-v 0.3s ease; }
        .ann-reduced { animation: none !important; }
        @keyframes ann-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ann-fade-out { from { opacity: 1; } to { opacity: 0; } }
        @keyframes ann-slide-in-h { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes ann-slide-out-h { from { transform: translateX(0); } to { transform: translateX(-100%); } }
        @keyframes ann-slide-in-v { from { transform: translateY(-100%); } to { transform: translateY(0); } }
        @keyframes ann-slide-out-v { from { transform: translateY(0); } to { transform: translateY(100%); } }
        @media (prefers-reduced-motion: reduce) { [class*="ann-"] { animation: none !important; } }
      `}</style>
    </div>
  );
}

function arrowStyle(side: 'left' | 'right', color: string): React.CSSProperties {
  return {
    position: 'absolute',
    top: '50%',
    [side]: 8,
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.2rem',
    color,
    opacity: 0.6,
    padding: '0 4px',
    lineHeight: 1,
  };
}

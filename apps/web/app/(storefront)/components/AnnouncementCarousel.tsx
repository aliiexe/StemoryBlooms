'use client';

import { useEffect, useRef, useState, useCallback, useSyncExternalStore } from 'react';
import {usePathname} from 'next/navigation';
import {announcementMatchesPath} from '@/lib/announcement-visibility';
import AnnouncementSlide from './AnnouncementSlide';

type Announcement = {
  id: string;
  targetMode:string;includedPaths:string[]|null;excludedPaths:string[]|null;showMobile:boolean;showTablet:boolean;showDesktop:boolean;
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
  animationType: string;desktopFontSize:string;mobileFontSize:string;
  isDismissible: boolean;
  dismissalDuration: string;
  dismissalVersion: string;
  countdownEnabled: boolean;
  countdownTarget: Date | null;
  countdownEndBehavior: string;
  countdownReplacementText: string | null;
};

type Settings = {
  mode:string;
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

const subscribeViewport=(notify:()=>void)=>{window.addEventListener('resize',notify);return()=>window.removeEventListener('resize',notify);};
const viewportSnapshot=()=>window.innerWidth<600?'MOBILE':window.innerWidth<1024?'TABLET':'DESKTOP';
const subscribeDismissal=(notify:()=>void)=>{window.addEventListener('storage',notify);window.addEventListener('sb-ann-dismissed',notify);return()=>{window.removeEventListener('storage',notify);window.removeEventListener('sb-ann-dismissed',notify);};};
const subscribeMotion=(notify:()=>void)=>{const query=window.matchMedia('(prefers-reduced-motion: reduce)');query.addEventListener('change',notify);return()=>query.removeEventListener('change',notify);};
const motionSnapshot=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const subscribeTime=(notify:()=>void)=>{const timer=window.setInterval(notify,1000);return()=>window.clearInterval(timer);};
const timeSnapshot=()=>Math.floor(Date.now()/1000);
const noSubscription=()=>()=>{};

export default function AnnouncementCarousel({
  announcements,
  settings,
}: {
  announcements: Announcement[];
  settings: Settings;
}) {
  const pathname=usePathname();
  const device=useSyncExternalStore(subscribeViewport,viewportSnapshot,()=> 'SERVER');
  const reduced=useSyncExternalStore(subscribeMotion,motionSnapshot,()=>true);
  const dismissed=useSyncExternalStore(subscribeDismissal,()=>JSON.stringify(announcements.filter(ann=>ann.isDismissible&&(isDismissed(ann)||isSessionDismissed(ann))).map(ann=>ann.id)),()=> '[]');
  const now=useSyncExternalStore(announcements.some(ann=>ann.countdownEnabled)?subscribeTime:noSubscription,timeSnapshot,()=>0);
  const hidden:string[]=JSON.parse(dismissed);
  const visible=device==='SERVER'?[]:announcements.filter(ann=>!hidden.includes(ann.id)&&announcementMatchesPath(ann,pathname)&&(device==='MOBILE'?ann.showMobile:device==='TABLET'?ann.showTablet:ann.showDesktop)&&!(ann.countdownEnabled&&ann.countdownTarget&&ann.countdownEndBehavior==='HIDE'&&new Date(ann.countdownTarget).getTime()<=now*1000));
  const [current,setCurrent]=useState(0);const [paused,setPaused]=useState(false);const [exiting,setExiting]=useState(false);const transition=useRef<ReturnType<typeof setTimeout>|null>(null);
  const activeIndex=Math.min(current,Math.max(0,visible.length-1));
  const goTo=useCallback((next:number,count:number)=>{if(transition.current)clearTimeout(transition.current);if(count<=1||reduced){setCurrent(next);return;}setExiting(true);transition.current=setTimeout(()=>{setCurrent(next);setExiting(false);},settings.transitionDurationMs);},[reduced,settings.transitionDurationMs]);
  useEffect(()=>()=>{if(transition.current)clearTimeout(transition.current);},[]);
  useEffect(()=>{if(settings.mode==='MANUAL'||!settings.autoPlay||reduced||visible.length<=1||paused)return;const timer=setInterval(()=>{const next=(activeIndex+1)%visible.length;if(!settings.loop&&next===0)return;goTo(next,visible.length);},Math.max(1,settings.intervalSeconds)*1000);return()=>clearInterval(timer);},[settings.mode,settings.autoPlay,settings.loop,settings.intervalSeconds,reduced,visible.length,paused,activeIndex,goTo]);
  function handleDismiss(ann:Announcement){dismiss(ann);window.dispatchEvent(new Event('sb-ann-dismissed'));}
  if(!visible.length)return null;
  const ann=visible[activeIndex];const animation=ann.animationType==='FADE'?settings.transitionType:ann.animationType;const transitionClass=reduced||animation==='NONE'?'ann-reduced':`ann-${animation.toLowerCase()}`;

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
          fontSize={device==='MOBILE'?ann.mobileFontSize:ann.desktopFontSize}
          onDismiss={() => handleDismiss(ann)}
          showDismiss={settings.allowDismissal && ann.isDismissible}
        />
      </div>

      {/* Navigation arrows */}
      {settings.showArrows && visible.length > 1 && (
        <>
          <button
            aria-label="Previous announcement"
            onClick={() => goTo((activeIndex - 1 + visible.length) % visible.length, visible.length)}
            style={arrowStyle('left', ann.textColor)}
          >‹</button>
          <button
            aria-label="Next announcement"
            onClick={() => goTo((activeIndex + 1) % visible.length, visible.length)}
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
              onClick={() => goTo(i, visible.length)}
              style={{
                width: 6, height: 6, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0,
                background: i === activeIndex ? ann.textColor : `${ann.textColor}50`,
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

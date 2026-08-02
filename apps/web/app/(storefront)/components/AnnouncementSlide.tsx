'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import SeasonalDecoration from './SeasonalDecoration';
import AnnouncementCountdown from './AnnouncementCountdown';

type Props = {
  announcement: {
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
    isDismissible: boolean;
    countdownEnabled: boolean;
    countdownTarget: Date | null;
    countdownEndBehavior: string;
    countdownReplacementText: string | null;
  };
  onDismiss?: () => void;
  showDismiss?: boolean;
};

export default function AnnouncementSlide({ announcement: ann, onDismiss, showDismiss }: Props) {
  const textStyle: React.CSSProperties = {
    color: ann.textColor,
    fontFamily: 'var(--font-sans)',
    fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
    textAlign: ann.textAlignment.toLowerCase() as 'left' | 'center' | 'right',
    lineHeight: 1.4,
  };

  const content = (
    <div
      style={{
        minHeight: ann.barHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.5rem 3rem',
        gap: '0.75rem',
        position: 'relative',
        width: '100%',
      }}
    >
      {ann.decorativeAsset && (
        <span aria-hidden="true" style={{ position: 'absolute', left: 12, opacity: 0.5, display: 'flex', alignItems: 'center' }}>
          <SeasonalDecoration asset={ann.decorativeAsset} color={ann.accentColor} size={20} />
        </span>
      )}

      <span style={textStyle}>
        {ann.message}
        {ann.highlightedText && (
          <strong style={{ color: ann.accentColor, marginLeft: '0.35rem' }}>
            {ann.highlightedText}
          </strong>
        )}
      </span>

      {ann.countdownEnabled && ann.countdownTarget && (
        <AnnouncementCountdown
          target={ann.countdownTarget}
          textColor={ann.accentColor}
          endBehavior={ann.countdownEndBehavior}
          replacementText={ann.countdownReplacementText}
        />
      )}

      {ann.ctaLabel && ann.linkUrl && !ann.wholeBarClickable && (
        <Link
          href={ann.linkUrl}
          target={ann.openInNewTab ? '_blank' : '_self'}
          rel={ann.openInNewTab ? 'noopener noreferrer' : undefined}
          style={{
            color: ann.linkColor,
            fontSize: '0.8rem',
            fontWeight: 600,
            textDecoration: 'underline',
            textUnderlineOffset: 2,
            whiteSpace: 'nowrap',
          }}
          onClick={e => e.stopPropagation()}
        >
          {ann.ctaLabel}
        </Link>
      )}

      {ann.decorativeAsset && (
        <span aria-hidden="true" style={{ position: 'absolute', right: showDismiss ? 36 : 12, opacity: 0.5, display: 'flex', alignItems: 'center' }}>
          <SeasonalDecoration asset={ann.decorativeAsset} color={ann.accentColor} size={20} />
        </span>
      )}

      {showDismiss && (
        <button
          aria-label="Dismiss announcement"
          onClick={onDismiss}
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: ann.textColor,
            opacity: 0.5,
            display: 'flex',
            alignItems: 'center',
            padding: 4,
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );

  if (ann.wholeBarClickable && ann.linkUrl) {
    return (
      <Link
        href={ann.linkUrl}
        target={ann.openInNewTab ? '_blank' : '_self'}
        rel={ann.openInNewTab ? 'noopener noreferrer' : undefined}
        style={{ display: 'block', textDecoration: 'none', width: '100%' }}
        aria-label={ann.message}
      >
        {content}
      </Link>
    );
  }

  return content;
}

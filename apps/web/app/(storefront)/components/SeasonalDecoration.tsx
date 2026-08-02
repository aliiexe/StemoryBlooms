// SVG botanical decoration assets per campaign theme
type Props = { asset: string; color: string; size: number };

const DECORATIONS: Record<string, (color: string, size: number) => React.ReactNode> = {
  valentines: (c, s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c} aria-hidden="true">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  ),
  mothers: (c, s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" aria-hidden="true">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
    </svg>
  ),
  graduation: (c, s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c} aria-hidden="true">
      <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18V17l7 4 7-4v-3.82L12 17l-7-3.82z"/>
    </svg>
  ),
  ramadan: (c, s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c} aria-hidden="true">
      <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/>
    </svg>
  ),
  eid: (c, s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c} aria-hidden="true">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
    </svg>
  ),
  blackfriday: (c, s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c} aria-hidden="true">
      <path d="M11.5 2C6.81 2 3 5.81 3 10.5S6.81 19 11.5 19h.5v3c4.86-2.34 8-7 8-11.5C20 5.81 16.19 2 11.5 2zm1 14.5h-2v-2h2v2zm0-4h-2c0-3.25 3-3 3-5 0-1.1-.9-2-2-2s-2 .9-2 2h-2c0-2.21 1.79-4 4-4s4 1.79 4 4c0 2.5-3 2.75-3 5z"/>
    </svg>
  ),
  default: (c, s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" aria-hidden="true">
      <path d="M12 22c4.97-5 9-8.82 9-12a9 9 0 1 0-18 0c0 3.18 4.03 7 9 12z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
};

export default function SeasonalDecoration({ asset, color, size }: Props) {
  const render = DECORATIONS[asset] ?? DECORATIONS.default;
  return <>{render(color, size)}</>;
}

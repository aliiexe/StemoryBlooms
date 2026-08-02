'use client';

import { useState } from 'react';
import styles from '../dashboard.module.css';

type Template = { id: string; name: string; slug: string; description: string | null; eventType: string; previewColor: string; defaultConfig: any };
type Announcement = Partial<{
  internalTitle: string; message: string; highlightedText: string; ctaLabel: string; linkUrl: string;
  wholeBarClickable: boolean; openInNewTab: boolean; decorativeAsset: string; templateId: string;
  status: string; order: number; startAt: string; endAt: string; noEndDate: boolean;
  isDismissible: boolean; dismissalDuration: string; backgroundColor: string; textColor: string;
  accentColor: string; linkColor: string; textAlignment: string; desktopFontSize: string;
  mobileFontSize: string; barHeight: string; animationType: string;
  showDesktop: boolean; showTablet: boolean; showMobile: boolean; targetMode: string;
  countdownEnabled: boolean; countdownTarget: string; countdownEndBehavior: string; countdownReplacementText: string;
}>;

type Props = {
  action: (formData: FormData) => Promise<void>;
  templates: Template[];
  existing?: Announcement;
};

const ANIM_TYPES = ['FADE', 'SLIDE_H', 'SLIDE_V', 'DISSOLVE', 'NONE'];
const ALIGNMENTS = ['LEFT', 'CENTER', 'RIGHT'];
const TARGET_MODES = ['ALL', 'HOMEPAGE', 'SHOP', 'CHECKOUT', 'CUSTOM'];
const DISMISSAL_DURATIONS = ['SESSION', '24H', 'CAMPAIGN'];
const COUNTDOWN_END = ['HIDE', 'KEEP', 'REPLACE'];

export default function AnnouncementEditorForm({ action, templates, existing }: Props) {
  const [preview, setPreview] = useState({
    message: existing?.message ?? 'Your announcement message goes here ✨',
    highlightedText: existing?.highlightedText ?? '',
    ctaLabel: existing?.ctaLabel ?? '',
    backgroundColor: existing?.backgroundColor ?? '#F6F4EC',
    textColor: existing?.textColor ?? '#4A4A4A',
    accentColor: existing?.accentColor ?? '#D6CFE6',
    linkColor: existing?.linkColor ?? '#6F7E59',
    barHeight: existing?.barHeight ?? '40px',
    textAlignment: existing?.textAlignment ?? 'CENTER',
    decorativeAsset: existing?.decorativeAsset ?? '',
  });
  const [noEndDate, setNoEndDate] = useState(existing?.noEndDate ?? true);
  const [countdownEnabled, setCountdownEnabled] = useState(existing?.countdownEnabled ?? false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const applyTemplate = (slug: string) => {
    const t = templates.find(t => t.slug === slug);
    if (!t) return;
    const cfg = t.defaultConfig as any;
    setPreview(prev => ({
      ...prev,
      message: cfg.message ?? prev.message,
      backgroundColor: cfg.backgroundColor ?? prev.backgroundColor,
      textColor: cfg.textColor ?? prev.textColor,
      accentColor: cfg.accentColor ?? prev.accentColor,
      linkColor: cfg.linkColor ?? prev.linkColor,
      decorativeAsset: cfg.decorativeAsset ?? prev.decorativeAsset,
    }));
    setSelectedTemplate(slug);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
      {/* Editor */}
      <form action={action}>
        {/* Template picker */}
        {templates.length > 0 && (
          <div className={styles.card} style={{ marginBottom: '1.5rem' }}>
            <h3 className={styles.cardTitle}>Seasonal Template</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {templates.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t.slug)}
                  style={{
                    padding: '0.5rem 1rem', borderRadius: '8px', border: '2px solid',
                    borderColor: selectedTemplate === t.slug ? '#6F7E59' : '#EAE6DF',
                    background: t.previewColor, fontSize: '0.8rem', cursor: 'pointer',
                    fontFamily: 'var(--font-sans)', fontWeight: 500,
                  }}
                >
                  {t.name}
                </button>
              ))}
            </div>
            <input type="hidden" name="templateId" value={templates.find(t => t.slug === selectedTemplate)?.id ?? existing?.templateId ?? ''} />
          </div>
        )}

        {/* Content */}
        <div className={styles.card} style={{ marginBottom: '1.5rem' }}>
          <h3 className={styles.cardTitle}>Content</h3>
          <div className={styles.form}>
            <div>
              <label style={labelStyle}>Internal Title *</label>
              <input name="internalTitle" required defaultValue={existing?.internalTitle} placeholder="e.g. Valentine's Day 2026" className={styles.input} />
            </div>
            <div>
              <label style={labelStyle}>Public Message * (max 200 characters, no HTML)</label>
              <textarea
                name="message" required maxLength={200} rows={2}
                defaultValue={existing?.message}
                placeholder="Free delivery in Casablanca on orders over 299 MAD 🌸"
                className={styles.input}
                onChange={e => setPreview(p => ({ ...p, message: e.target.value }))}
              />
            </div>
            <div>
              <label style={labelStyle}>Highlighted phrase (optional)</label>
              <input name="highlightedText" defaultValue={existing?.highlightedText ?? ''} placeholder="Limited time only" className={styles.input}
                onChange={e => setPreview(p => ({ ...p, highlightedText: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>CTA Label (optional)</label>
                <input name="ctaLabel" defaultValue={existing?.ctaLabel ?? ''} placeholder="Shop Now" className={styles.input}
                  onChange={e => setPreview(p => ({ ...p, ctaLabel: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Link URL (optional)</label>
                <input name="linkUrl" type="url" defaultValue={existing?.linkUrl ?? ''} placeholder="https://..." className={styles.input} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input type="checkbox" name="wholeBarClickable" defaultChecked={existing?.wholeBarClickable} />
                Make entire bar clickable
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input type="checkbox" name="openInNewTab" defaultChecked={existing?.openInNewTab} />
                Open link in new tab
              </label>
            </div>
            <div>
              <label style={labelStyle}>Decorative Asset</label>
              <select name="decorativeAsset" className={styles.input}
                defaultValue={existing?.decorativeAsset ?? ''}
                onChange={e => setPreview(p => ({ ...p, decorativeAsset: e.target.value }))}
              >
                <option value="">None</option>
                <option value="valentines">💜 Valentine's Day</option>
                <option value="mothers">🌸 Mother's Day</option>
                <option value="graduation">🎓 Graduation</option>
                <option value="ramadan">🌙 Ramadan</option>
                <option value="eid">✨ Eid</option>
                <option value="blackfriday">🏷️ Black Friday</option>
                <option value="default">🌿 Botanical</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Priority Order</label>
              <input name="order" type="number" defaultValue={existing?.order ?? 0} className={styles.input} style={{ width: 100 }} />
            </div>
          </div>
        </div>

        {/* Display */}
        <div className={styles.card} style={{ marginBottom: '1.5rem' }}>
          <h3 className={styles.cardTitle}>Display & Style</h3>
          <div className={styles.form}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              {[
                ['backgroundColor', 'Background', '#F6F4EC'],
                ['textColor', 'Text', '#4A4A4A'],
                ['accentColor', 'Accent', '#D6CFE6'],
                ['linkColor', 'CTA / Link', '#6F7E59'],
              ].map(([name, label, def]) => (
                <div key={name as string}>
                  <label style={labelStyle}>{label}</label>
                  <input
                    type="color" name={name as string}
                    defaultValue={(existing as any)?.[name as string] ?? def}
                    onChange={e => setPreview(p => ({ ...p, [name as string]: e.target.value }))}
                    style={{ width: '100%', height: 36, borderRadius: 8, border: '1px solid #EAE6DF', cursor: 'pointer', padding: 2 }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Text Alignment</label>
                <select name="textAlignment" className={styles.input} defaultValue={existing?.textAlignment ?? 'CENTER'}
                  onChange={e => setPreview(p => ({ ...p, textAlignment: e.target.value }))}>
                  {ALIGNMENTS.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Animation</label>
                <select name="animationType" className={styles.input} defaultValue={existing?.animationType ?? 'FADE'}>
                  {ANIM_TYPES.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Bar Height</label>
                <input name="barHeight" className={styles.input} defaultValue={existing?.barHeight ?? '40px'}
                  onChange={e => setPreview(p => ({ ...p, barHeight: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              {[['showDesktop', 'Show on Desktop'], ['showTablet', 'Show on Tablet'], ['showMobile', 'Show on Mobile']].map(([n, l]) => (
                <label key={n} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                  <input type="checkbox" name={n} defaultChecked={(existing as any)?.[n] !== false} />
                  {l}
                </label>
              ))}
            </div>
            <div>
              <label style={labelStyle}>Page Targeting</label>
              <select name="targetMode" className={styles.input} defaultValue={existing?.targetMode ?? 'ALL'}>
                {TARGET_MODES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Scheduling */}
        <div className={styles.card} style={{ marginBottom: '1.5rem' }}>
          <h3 className={styles.cardTitle}>Scheduling</h3>
          <div className={styles.form}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Start Date & Time (Casablanca)</label>
                <input name="startAt" type="datetime-local" className={styles.input} defaultValue={existing?.startAt?.slice(0, 16) ?? ''} />
              </div>
              <div>
                <label style={labelStyle}>End Date & Time</label>
                <input name="endAt" type="datetime-local" className={styles.input} defaultValue={existing?.endAt?.slice(0, 16) ?? ''} disabled={noEndDate} />
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
              <input type="checkbox" name="noEndDate" checked={noEndDate} onChange={e => setNoEndDate(e.target.checked)} />
              No end date (run indefinitely)
            </label>
            <div>
              <label style={labelStyle}>Dismissal</label>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                  <input type="checkbox" name="isDismissible" defaultChecked={existing?.isDismissible} />
                  Allow users to dismiss
                </label>
                <select name="dismissalDuration" className={styles.input} style={{ width: 'auto' }} defaultValue={existing?.dismissalDuration ?? 'SESSION'}>
                  {DISMISSAL_DURATIONS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Countdown */}
        <div className={styles.card} style={{ marginBottom: '1.5rem' }}>
          <h3 className={styles.cardTitle}>Countdown Timer</h3>
          <div className={styles.form}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
              <input type="checkbox" name="countdownEnabled" checked={countdownEnabled} onChange={e => setCountdownEnabled(e.target.checked)} />
              Enable countdown
            </label>
            {countdownEnabled && (
              <>
                <div>
                  <label style={labelStyle}>Target Date & Time</label>
                  <input name="countdownTarget" type="datetime-local" className={styles.input} defaultValue={existing?.countdownTarget?.slice(0, 16) ?? ''} />
                </div>
                <div>
                  <label style={labelStyle}>When countdown ends</label>
                  <select name="countdownEndBehavior" className={styles.input} defaultValue={existing?.countdownEndBehavior ?? 'HIDE'}>
                    {COUNTDOWN_END.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Replacement text (if REPLACE)</label>
                  <input name="countdownReplacementText" className={styles.input} defaultValue={existing?.countdownReplacementText ?? ''} placeholder="The offer has ended" />
                </div>
              </>
            )}
          </div>
        </div>

        <button type="submit" className={styles.submitBtn}>Save Announcement</button>
      </form>

      {/* Live Preview */}
      <div style={{ position: 'sticky', top: 24 }}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Live Preview</h3>
          <div style={{ marginBottom: '1rem' }}>
            <div
              style={{
                minHeight: preview.barHeight,
                backgroundColor: preview.backgroundColor,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: preview.textAlignment === 'CENTER' ? 'center' : preview.textAlignment === 'LEFT' ? 'flex-start' : 'flex-end',
                padding: '0.5rem 1rem',
                gap: '0.5rem',
                border: '1px solid #EAE6DF',
                overflow: 'hidden',
              }}
            >
              <span style={{ color: preview.textColor, fontSize: '0.8rem', fontFamily: 'var(--font-sans)', lineHeight: 1.4 }}>
                {preview.message || 'Your message here'}
                {preview.highlightedText && (
                  <strong style={{ color: preview.accentColor, marginLeft: '0.3rem' }}>{preview.highlightedText}</strong>
                )}
              </span>
              {preview.ctaLabel && (
                <span style={{ color: preview.linkColor, fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap', textDecoration: 'underline' }}>
                  {preview.ctaLabel}
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.7rem', color: '#7A7571', marginTop: '0.5rem', textAlign: 'center' }}>Desktop preview</p>
          </div>
          <div>
            <div
              style={{
                minHeight: preview.barHeight,
                backgroundColor: preview.backgroundColor,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.4rem 0.75rem',
                gap: '0.4rem',
                border: '1px solid #EAE6DF',
                overflow: 'hidden',
                maxWidth: 200,
                margin: '0 auto',
              }}
            >
              <span style={{ color: preview.textColor, fontSize: '0.7rem', fontFamily: 'var(--font-sans)', lineHeight: 1.3, textAlign: 'center' }}>
                {(preview.message || 'Your message').slice(0, 50)}{preview.message?.length > 50 ? '…' : ''}
              </span>
            </div>
            <p style={{ fontSize: '0.7rem', color: '#7A7571', marginTop: '0.5rem', textAlign: 'center' }}>Mobile preview</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.8rem', color: '#5A5551', marginBottom: '0.35rem', fontWeight: 500 };

'use client';
import {clientOperationId} from '@/lib/client-operation-id';
import ConfirmModal from '../components/ConfirmModal';
import {casablancaLocal} from '@/lib/business-time';

import { useState, useRef } from 'react';
import styles from '../dashboard.module.css';

function readTemplateConfig(value:unknown):Record<string,string>{return value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([,entry])=>typeof entry==='string')):{};}

type Template = { id: string; name: string; slug: string; description: string | null; eventType: string; previewColor: string; defaultConfig: unknown };
type Announcement = Partial<{
  updatedAt:string;includedPaths:string[]|null;excludedPaths:string[]|null;
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
  preselectedTemplateId?: string;
};

const ANIM_TYPES = ['FADE', 'SLIDE_H', 'SLIDE_V', 'DISSOLVE', 'NONE'];
const TARGET_MODES = ['ALL', 'HOMEPAGE', 'SHOP', 'CHECKOUT', 'CUSTOM'];
const DISMISSAL_DURATIONS = ['SESSION', '24H', 'CAMPAIGN'];
const COUNTDOWN_END = ['HIDE', 'KEEP', 'REPLACE'];

import CustomDropdown from '../components/CustomDropdown';

export default function AnnouncementEditorForm({ action, templates, existing, preselectedTemplateId }: Props) {
  const [saving,setSaving]=useState(false);const [error,setError]=useState('');const submission=useRef('');
  const pending=useRef<FormData|null>(null);const [confirmLive,setConfirmLive]=useState(false);
  // Find default template config if we have a preselected ID and no existing announcement
  const presetTemplate = !existing && preselectedTemplateId ? templates.find(t => t.id === preselectedTemplateId) : null;
  const presetCfg = presetTemplate ? readTemplateConfig(presetTemplate.defaultConfig) : null;

  const [preview, setPreview] = useState({
    message: existing?.message ?? presetCfg?.message ?? 'Your announcement message goes here ✨',
    highlightedText: existing?.highlightedText ?? presetCfg?.highlightedText ?? '',
    ctaLabel: existing?.ctaLabel ?? presetCfg?.ctaLabel ?? '',
    backgroundColor: existing?.backgroundColor ?? presetCfg?.backgroundColor ?? '#F6F4EC',
    textColor: existing?.textColor ?? presetCfg?.textColor ?? '#4A4A4A',
    accentColor: existing?.accentColor ?? presetCfg?.accentColor ?? '#D6CFE6',
    linkColor: existing?.linkColor ?? presetCfg?.linkColor ?? '#6F7E59',
    barHeight: existing?.barHeight ?? presetCfg?.barHeight ?? '40px',
    textAlignment: existing?.textAlignment ?? presetCfg?.textAlignment ?? 'CENTER',
    decorativeAsset: existing?.decorativeAsset ?? presetCfg?.decorativeAsset ?? '',
  });
  const [noEndDate, setNoEndDate] = useState(existing?.noEndDate ?? true);
  const [countdownEnabled, setCountdownEnabled] = useState(existing?.countdownEnabled ?? false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(presetTemplate?.slug ?? templates.find(template=>template.id===existing?.templateId)?.slug ?? '');
  const [internalTitle,setInternalTitle]=useState(existing?.internalTitle||presetTemplate?.name||'');
  const [linkUrl,setLinkUrl]=useState(existing?.linkUrl||presetCfg?.linkUrl||'');
  
  // Custom dropdown states
  const [animationType, setAnimationType] = useState(existing?.animationType ?? presetCfg?.animationType ?? 'FADE');
  const [targetMode, setTargetMode] = useState(existing?.targetMode ?? presetCfg?.targetMode ?? 'ALL');
  const [dismissalDuration, setDismissalDuration] = useState(existing?.dismissalDuration ?? presetCfg?.dismissalDuration ?? 'SESSION');
  const [countdownEndBehavior, setCountdownEndBehavior] = useState(existing?.countdownEndBehavior ?? presetCfg?.countdownEndBehavior ?? 'HIDE');

  const applyTemplate = (slug: string) => {
    const t = templates.find(t => t.slug === slug);
    if (!t) return;
    const cfg = readTemplateConfig(t.defaultConfig);
    setInternalTitle(value=>value||t.name);if(cfg.linkUrl)setLinkUrl(cfg.linkUrl);
    setPreview(prev => ({
      ...prev,
      message: cfg.message ?? prev.message,
      backgroundColor: cfg.backgroundColor ?? prev.backgroundColor,
      textColor: cfg.textColor ?? prev.textColor,
      accentColor: cfg.accentColor ?? prev.accentColor,
      linkColor: cfg.linkColor ?? prev.linkColor,
      textAlignment: cfg.textAlignment ?? prev.textAlignment,
      decorativeAsset: cfg.decorativeAsset ?? prev.decorativeAsset,
    }));
    
    // Also update separate dropdown states if present in config
    if (cfg.animationType) setAnimationType(cfg.animationType);
    if (cfg.targetMode) setTargetMode(cfg.targetMode);
    if (cfg.dismissalDuration) setDismissalDuration(cfg.dismissalDuration);
    if (cfg.countdownEndBehavior) setCountdownEndBehavior(cfg.countdownEndBehavior);
    
    setSelectedTemplate(slug);
  };

  async function save(data:FormData){if(saving)return;if(!submission.current)submission.current=clientOperationId();data.set('submissionId',submission.current);if(existing?.updatedAt)data.set('expectedUpdatedAt',existing.updatedAt);setSaving(true);setError('');try{await action(data);}catch{setError('The announcement could not be saved. Check its dates and page paths. If it changed elsewhere, reload before retrying.');}finally{setSaving(false);setConfirmLive(false);}}
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,320px),1fr))', gap: '2rem', alignItems: 'start' }}>
      {/* Editor */}
      <form onSubmit={event=>{event.preventDefault();if(saving)return;const data=new FormData(event.currentTarget);if(existing?.status==='ACTIVE'){pending.current=data;setConfirmLive(true);}else void save(data);}}>
        {error&&<p role="alert">{error}</p>}<fieldset disabled={saving} style={{border:0,padding:0,minWidth:0}}>
        {/* Template picker */}
        {templates.length > 0 && (
          <details className={styles.card} style={{ marginBottom: '1.5rem' }}>
            <summary className={styles.disclosureTitle}>Seasonal Template</summary>
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
          </details>
        )}

        {/* Content */}
        <div className={styles.card} style={{ marginBottom: '1.5rem' }}>
          <h3 className={styles.cardTitle}>Content</h3>
          <div className={styles.form}>
            <div>
              <label style={labelStyle}>Internal title</label>
              <input name="internalTitle" aria-label="Internal title" required value={internalTitle} onChange={event=>setInternalTitle(event.target.value)} placeholder="e.g. Valentine's Day 2026" className={styles.input} />
            </div>
            <div>
              <label style={labelStyle}>Customer message · up to 200 characters</label>
              <textarea
                name="message" aria-label="Customer message" required maxLength={200} rows={2}
                value={preview.message}
                placeholder="Free delivery in Casablanca on orders over 299 MAD 🌸"
                className={styles.input}
                onChange={e => setPreview(p => ({ ...p, message: e.target.value }))}
              />
            </div>
            <div>
              <label style={labelStyle}>Highlighted phrase (optional)</label>
              <input name="highlightedText" aria-label="Highlighted phrase" value={preview.highlightedText} placeholder="Limited time only" className={styles.input}
                onChange={e => setPreview(p => ({ ...p, highlightedText: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Button text · optional</label>
                <input name="ctaLabel" aria-label="Button text" value={preview.ctaLabel} placeholder="Shop Now" className={styles.input}
                  onChange={e => setPreview(p => ({ ...p, ctaLabel: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Link · optional</label>
                <input name="linkUrl" aria-label="Announcement link" type="text" value={linkUrl} onChange={event=>setLinkUrl(event.target.value)} placeholder="/shop or https://..." className={styles.input} />
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
              <CustomDropdown
                name="decorativeAsset" label="Decoration"
                value={preview.decorativeAsset}
                onChange={val => setPreview(p => ({ ...p, decorativeAsset: val }))}
                options={[
                  { value: '', label: 'None' },
                  { value: 'valentines', label: '💜 Valentine\'s Day' },
                  { value: 'mothers', label: '🌸 Mother\'s Day' },
                  { value: 'graduation', label: '🎓 Graduation' },
                  { value: 'ramadan', label: '🌙 Ramadan' },
                  { value: 'eid', label: '✨ Eid' },
                  { value: 'blackfriday', label: '🏷️ Black Friday' },
                  { value: 'default', label: '🌿 Botanical' }
                ]}
              />
            </div>
            <div>
              <label style={labelStyle}>Priority Order</label>
              <input name="order" aria-label="Announcement priority" type="number" defaultValue={existing?.order ?? 0} className={styles.input} style={{ width: 100 }} />
            </div>
          </div>
        </div>

        {/* Display */}
        <details className={styles.card} style={{ marginBottom: '1.5rem' }}>
          <summary className={styles.disclosureTitle}>Display & Style</summary>
          <div className={styles.form}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              {[
                ['backgroundColor', 'Background', '#F6F4EC'],
                ['textColor', 'Text', '#4A4A4A'],
                ['accentColor', 'Accent', '#D6CFE6'],
                ['linkColor', 'CTA / Link', '#6F7E59'],
              ].map(([name, label]) => (
                <div key={name as string}>
                  <label style={labelStyle}>{label}</label>
                  <input
                    type="color" aria-label={label} name={name as string}
                    value={preview[name as 'backgroundColor'|'textColor'|'accentColor'|'linkColor']}
                    onChange={e => setPreview(p => ({ ...p, [name as string]: e.target.value }))}
                    style={{ width: '100%', height: 36, borderRadius: 8, border: '1px solid #EAE6DF', cursor: 'pointer', padding: 2 }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Text Alignment</label>
                <CustomDropdown
                  name="textAlignment" label="Text alignment"
                  value={preview.textAlignment}
                  onChange={val => setPreview(p => ({ ...p, textAlignment: val }))}
                  options={[
                    { value: 'LEFT', label: 'Left' },
                    { value: 'CENTER', label: 'Center' },
                    { value: 'RIGHT', label: 'Right' }
                  ]}
                />
              </div>
              <div>
                <label style={labelStyle}>Animation</label>
                <CustomDropdown
                  name="animationType" label="Animation style"
                  value={animationType}
                  onChange={setAnimationType}
                  options={ANIM_TYPES.map(value=>({value,label:({FADE:'Fade',SLIDE_H:'Slide horizontally',SLIDE_V:'Slide vertically',DISSOLVE:'Dissolve',NONE:'No animation'} as Record<string,string>)[value]}))}
                />
              </div>
              <div>
                <label style={labelStyle}>Bar Height</label>
                <input name="barHeight" aria-label="Bar height" className={styles.input} value={preview.barHeight}
                  onChange={e => setPreview(p => ({ ...p, barHeight: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              {[['showDesktop', 'Show on Desktop'], ['showTablet', 'Show on Tablet'], ['showMobile', 'Show on Mobile']].map(([n, l]) => (
                <label key={n} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                  <input type="checkbox" name={n} defaultChecked={existing?.[n as 'showDesktop'|'showTablet'|'showMobile'] !== false} />
                  {l}
                </label>
              ))}
            </div>
            <div>
              <label style={labelStyle}>Page Targeting</label>
              <CustomDropdown
                name="targetMode" label="Pages to show"
                value={targetMode}
                onChange={setTargetMode}
                options={TARGET_MODES.map(value=>({value,label:({ALL:'Every page',HOMEPAGE:'Homepage',SHOP:'Collection pages',CHECKOUT:'Checkout',CUSTOM:'Selected pages'} as Record<string,string>)[value]}))}
              />
            </div>
          </div>
        </details>

        <div className={styles.card}><h3>Page paths</h3><p>Custom targeting requires local paths. Use /shop/* to include descendants.</p>{targetMode==='CUSTOM'&&<label>Included paths<textarea name="includedPaths" aria-label="Included page paths" maxLength={5000} defaultValue={existing?.includedPaths?.join('\n')||''} className={styles.textarea}/></label>}<label>Excluded paths (optional)<textarea name="excludedPaths" aria-label="Excluded page paths" maxLength={5000} defaultValue={existing?.excludedPaths?.join('\n')||''} className={styles.textarea}/></label></div>
        {/* Scheduling */}
        <details className={styles.card} style={{ marginBottom: '1.5rem' }}>
          <summary className={styles.disclosureTitle}>Scheduling · Casablanca time</summary>
          <div className={styles.form}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Start Date & Time (Casablanca)</label>
                <input name="startAt" aria-label="Start date and time in Casablanca" type="datetime-local" className={styles.input} defaultValue={casablancaLocal(existing?.startAt)} />
              </div>
              <div>
                <label style={labelStyle}>End Date & Time</label>
                <input name="endAt" aria-label="End date and time in Casablanca" type="datetime-local" className={styles.input} defaultValue={casablancaLocal(existing?.endAt)} disabled={noEndDate} />
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
                <CustomDropdown
                  name="dismissalDuration" label="Dismissal duration"
                  value={dismissalDuration}
                  onChange={setDismissalDuration}
                  options={DISMISSAL_DURATIONS.map(value=>({value,label:({SESSION:'This visit','24H':'For 24 hours',CAMPAIGN:'Until the message changes'} as Record<string,string>)[value]}))}
                />
              </div>
            </div>
          </div>
        </details>

        {/* Countdown */}
        <details className={styles.card} style={{ marginBottom: '1.5rem' }}>
          <summary className={styles.disclosureTitle}>Countdown · Casablanca time</summary>
          <div className={styles.form}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
              <input type="checkbox" name="countdownEnabled" checked={countdownEnabled} onChange={e => setCountdownEnabled(e.target.checked)} />
              Enable countdown
            </label>
            {countdownEnabled && (
              <>
                <div>
                  <label style={labelStyle}>Target Date & Time</label>
                  <input name="countdownTarget" aria-label="Countdown target in Casablanca" type="datetime-local" className={styles.input} defaultValue={casablancaLocal(existing?.countdownTarget)} />
                </div>
                <div>
                  <label style={labelStyle}>When countdown ends</label>
                  <CustomDropdown
                    name="countdownEndBehavior" label="Countdown ending"
                    value={countdownEndBehavior}
                    onChange={setCountdownEndBehavior}
                    options={COUNTDOWN_END.map(value=>({value,label:({HIDE:'Hide the message',KEEP:'Keep showing it',REPLACE:'Show replacement text'} as Record<string,string>)[value]}))}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Replacement text (if REPLACE)</label>
                  <input name="countdownReplacementText" aria-label="Countdown replacement text" className={styles.input} defaultValue={existing?.countdownReplacementText ?? ''} placeholder="The offer has ended" />
                </div>
              </>
            )}
          </div>
        </details>

        <button type="submit" disabled={saving} className={styles.submitBtn}>{saving?'Saving…':existing?.status==='ACTIVE'?'Save live changes':'Save announcement draft'}</button>
        </fieldset>
      </form>

      {/* Draft preview */}
      <div style={{ position: 'sticky', top: 24 }}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Draft preview</h3>
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
      <ConfirmModal busy={saving} isOpen={confirmLive} title="Update a live announcement?" message="Saving replaces the active message visitors can see. Review the draft preview before applying this change." confirmText={saving?'Saving…':'Save live changes'} isDestructive={false} onCancel={()=>{if(!saving)setConfirmLive(false);}} onConfirm={()=>{if(pending.current)void save(pending.current);}}/>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.8rem', color: '#5A5551', marginBottom: '0.35rem', fontWeight: 500 };

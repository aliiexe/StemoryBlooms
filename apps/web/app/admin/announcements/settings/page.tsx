import { prisma } from '@stemory/database';
import styles from '../../dashboard.module.css';
import { updateBarSettings } from '../actions';

export default async function AnnouncementSettingsPage() {
  const settings = await prisma.announcementBarSettings.findFirst();

  const TRANSITIONS = ['FADE', 'SLIDE_H', 'SLIDE_V', 'DISSOLVE', 'NONE'];
  const MODES = ['AUTO', 'STATIC', 'CAROUSEL'];
  const INTERVALS = [3, 5, 10];

  return (
    <div className={styles.dashboard}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-editorial)', fontWeight: 500 }}>Announcement Bar Settings</h1>
      </header>

      <div className={styles.card} style={{ maxWidth: 700 }}>
        <form action={updateBarSettings} className={styles.form}>
          {/* Master toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: settings?.enabled ? '#E8F5E9' : '#FCE4EC', borderRadius: 12 }}>
            <div>
              <strong style={{ fontSize: '1rem', color: settings?.enabled ? '#1B5E20' : '#880E4F' }}>
                {settings?.enabled ? '🟢 Announcement Bar is Enabled' : '🔴 Announcement Bar is Disabled'}
              </strong>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#7A7571' }}>
                When disabled, no bar appears even if active announcements exist.
              </p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" name="enabled" defaultChecked={settings?.enabled ?? false} style={{ width: 20, height: 20 }} />
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Enabled</span>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={ls}>Mode</label>
              <select name="mode" className={styles.input} defaultValue={settings?.mode ?? 'AUTO'}>
                {MODES.map(m => <option key={m} value={m}>{m} — {m === 'AUTO' ? 'Auto-detect based on count' : m === 'STATIC' ? 'Always show first' : 'Always carousel'}</option>)}
              </select>
            </div>
            <div>
              <label style={ls}>Transition Style</label>
              <select name="transitionType" className={styles.input} defaultValue={settings?.transitionType ?? 'FADE'}>
                {TRANSITIONS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={ls}>Rotation Interval (seconds)</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {INTERVALS.map(n => (
                <label key={n} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                  <input type="radio" name="intervalSeconds" value={n} defaultChecked={(settings?.intervalSeconds ?? 5) === n} />
                  {n}s
                </label>
              ))}
              <span style={{ fontSize: '0.8rem', color: '#7A7571' }}>or custom:</span>
              <input
                name="intervalSeconds"
                type="number" min={1} max={60}
                defaultValue={!INTERVALS.includes(settings?.intervalSeconds ?? 5) ? settings?.intervalSeconds : undefined}
                placeholder="e.g. 7"
                className={styles.input} style={{ width: 80 }}
              />
            </div>
          </div>

          <div>
            <label style={ls}>Transition Duration (ms)</label>
            <input name="transitionDurationMs" type="number" min={100} max={2000} defaultValue={settings?.transitionDurationMs ?? 400} className={styles.input} style={{ width: 120 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              ['autoPlay', 'Auto-play carousel', settings?.autoPlay !== false],
              ['loop', 'Loop continuously', settings?.loop !== false],
              ['pauseOnHover', 'Pause on hover', settings?.pauseOnHover !== false],
              ['showArrows', 'Show navigation arrows', settings?.showArrows !== false],
              ['showIndicators', 'Show slide indicators', settings?.showIndicators !== false],
              ['allowDismissal', 'Allow users to dismiss', settings?.allowDismissal ?? false],
            ].map(([name, label, checked]) => (
              <label key={name as string} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input type="checkbox" name={name as string} defaultChecked={checked as boolean} />
                {label}
              </label>
            ))}
          </div>

          <button type="submit" className={styles.submitBtn}>Save Settings</button>
        </form>
      </div>
    </div>
  );
}

const ls: React.CSSProperties = { display: 'block', fontSize: '0.8rem', color: '#5A5551', marginBottom: '0.35rem', fontWeight: 500 };

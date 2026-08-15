"use client";

import React, { useState } from 'react';
import styles from '../../dashboard.module.css';
import CustomDropdown from '../../components/CustomDropdown';

export default function SettingsForm({ settings, updateAction }: { settings: any, updateAction: (formData: FormData) => void }) {
  const [enabled, setEnabled] = useState(settings?.enabled ?? false);
  const [mode, setMode] = useState(settings?.mode ?? 'AUTO');
  const [transitionType, setTransitionType] = useState(settings?.transitionType ?? 'FADE');
  const [intervalSeconds, setIntervalSeconds] = useState(settings?.intervalSeconds ?? 5);

  const ls = { display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: 600, color: '#3A3531' };

  return (
    <form action={updateAction} className={styles.form}>
      {/* Master toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: enabled ? '#E8F5E9' : '#FCE4EC', borderRadius: 12 }}>
        <div>
          <strong style={{ fontSize: '1rem', color: enabled ? '#1B5E20' : '#880E4F' }}>
            {enabled ? '🟢 Announcement Bar is Enabled' : '🔴 Announcement Bar is Disabled'}
          </strong>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#7A7571' }}>
            When disabled, no bar appears even if active announcements exist.
          </p>
        </div>
        <div 
          onClick={() => setEnabled(!enabled)}
          style={{ 
            width: '44px', height: '24px', background: enabled ? '#4CAF50' : '#E5E7EB',
            borderRadius: '99px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
          }}
        >
          <div style={{ 
            width: '20px', height: '20px', background: 'white', borderRadius: '50%',
            position: 'absolute', top: '2px', left: enabled ? '22px' : '2px', transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
          }} />
        </div>
        <input type="hidden" name="enabled" value={enabled ? 'on' : 'off'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={ls}>Mode</label>
          <CustomDropdown 
            name="mode" 
            value={mode} 
            onChange={setMode} 
            options={[
              { value: 'AUTO', label: 'AUTO — Auto-detect based on count' },
              { value: 'STATIC', label: 'STATIC — Always show first' },
              { value: 'CAROUSEL', label: 'CAROUSEL — Always carousel' }
            ]} 
          />
        </div>
        <div>
          <label style={ls}>Transition Style</label>
          <CustomDropdown 
            name="transitionType" 
            value={transitionType} 
            onChange={setTransitionType} 
            options={[
              { value: 'FADE', label: 'FADE' },
              { value: 'SLIDE_H', label: 'SLIDE_H' },
              { value: 'SLIDE_V', label: 'SLIDE_V' },
              { value: 'DISSOLVE', label: 'DISSOLVE' },
              { value: 'NONE', label: 'NONE' }
            ]} 
          />
        </div>
      </div>

      <div>
        <label style={ls}>Rotation Interval (seconds)</label>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {[3, 5, 10].map(n => (
            <div 
              key={n} 
              onClick={() => setIntervalSeconds(n)}
              style={{ 
                padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer',
                background: intervalSeconds === n ? '#E8F5E9' : '#F3F4F6',
                border: `1px solid ${intervalSeconds === n ? '#4CAF50' : '#E5E7EB'}`,
                color: intervalSeconds === n ? '#1B5E20' : '#4B5563',
                fontWeight: intervalSeconds === n ? 600 : 400,
                fontSize: '0.875rem'
              }}
            >
              {n}s
            </div>
          ))}
          <span style={{ fontSize: '0.8rem', color: '#7A7571' }}>or custom:</span>
          <input 
            type="number" 
            name="intervalSeconds" 
            className={styles.input} 
            style={{ width: '80px', padding: '0.4rem', border: '1px solid #E5E7EB' }} 
            min="1" 
            max="60"
            value={intervalSeconds}
            onChange={(e) => setIntervalSeconds(Number(e.target.value))}
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
          ['showDots', 'Show pagination dots', settings?.showDots !== false],
        ].map(([name, label, defaultChecked]) => (
          <ToggleSwitch key={name as string} name={name as string} label={label as string} defaultChecked={defaultChecked as boolean} />
        ))}
      </div>

      <div>
        <button type="submit" className={styles.btnPrimary}>Save Global Settings</button>
      </div>
    </form>
  );
}

function ToggleSwitch({ name, label, defaultChecked }: { name: string, label: string, defaultChecked: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div 
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#F9FAFB', borderRadius: '8px', cursor: 'pointer' }}
      onClick={() => setChecked(!checked)}
    >
      <span style={{ fontSize: '0.875rem', color: '#374151', fontWeight: 500 }}>{label}</span>
      <div style={{ 
        width: '40px', height: '22px', background: checked ? '#4CAF50' : '#E5E7EB',
        borderRadius: '99px', position: 'relative', transition: 'background 0.2s'
      }}>
        <div style={{ 
          width: '18px', height: '18px', background: 'white', borderRadius: '50%',
          position: 'absolute', top: '2px', left: checked ? '20px' : '2px', transition: 'left 0.2s',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
        }} />
      </div>
      <input type="hidden" name={name} value={checked ? 'on' : 'off'} />
    </div>
  );
}

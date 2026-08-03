'use client';

import React from 'react';
import { markMessageRead, markMessageResolved } from './actions';

export function MessageActions({ id, status }: { id: string, status: string }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      {status === 'UNREAD' && (
        <button 
          onClick={() => markMessageRead(id)}
          style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #D6CFE6', backgroundColor: '#E8F5E9', color: '#1B5E20', cursor: 'pointer', fontSize: '0.8rem' }}
        >
          Mark Read
        </button>
      )}
      {status !== 'RESOLVED' && (
        <button 
          onClick={() => markMessageResolved(id)}
          style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', backgroundColor: '#F5F5F5', color: '#616161', cursor: 'pointer', fontSize: '0.8rem' }}
        >
          Resolve
        </button>
      )}
    </div>
  );
}

'use client';

import { deleteAnnouncement } from './actions';

export default function DeleteButton({ id }: { id: string }) {
  return (
    <form
      action={async () => {
        if (!confirm('Delete this announcement?')) return;
        await deleteAnnouncement(id);
      }}
      style={{ display: 'inline' }}
    >
      <button
        type="submit"
        style={{
          padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500,
          background: '#FCE4EC', color: '#880E4F', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
        }}
      >
        Delete
      </button>
    </form>
  );
}

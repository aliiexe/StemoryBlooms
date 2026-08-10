'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  page: number;
  totalPages: number;
  totalItems: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
}

export function TablePagination({
  page,
  totalPages,
  totalItems,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange
}: Props) {
  if (totalItems === 0) return null;

  const startItem = (page - 1) * rowsPerPage + 1;
  const endItem = Math.min(page * rowsPerPage, totalItems);

  // Generate page numbers to show (e.g. 1 2 3 ... 10)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (page >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', page - 1, page, page + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid #EAE6DF', backgroundColor: '#fff', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
      <div style={{ color: '#7A7571', fontSize: '0.9rem' }}>
        Showing <span style={{ fontWeight: 600, color: '#3A3531' }}>{startItem}-{endItem}</span> of <span style={{ fontWeight: 600, color: '#3A3531' }}>{totalItems}</span> results
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: '#7A7571', fontSize: '0.9rem' }}>Rows per page:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              onRowsPerPageChange(Number(e.target.value));
              onPageChange(1);
            }}
            style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #D6CFE6', backgroundColor: '#fff', fontSize: '0.9rem', cursor: 'pointer' }}
          >
            {[10, 20, 30, 50].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            style={{ padding: '0.35rem', borderRadius: '4px', border: '1px solid #D6CFE6', backgroundColor: '#fff', color: page === 1 ? '#C4BCAF' : '#5A5551', cursor: page === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronLeft size={16} />
          </button>
          
          {getPageNumbers().map((p, idx) => (
            p === '...' ? (
              <span key={`dots-${idx}`} style={{ padding: '0 0.5rem', color: '#9A9591' }}>...</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                style={{
                  minWidth: '32px',
                  height: '32px',
                  padding: '0 0.25rem',
                  borderRadius: '4px',
                  border: p === page ? '1px solid var(--brand-primary)' : '1px solid transparent',
                  backgroundColor: p === page ? '#F1F5EC' : 'transparent',
                  color: p === page ? 'var(--brand-primary)' : '#5A5551',
                  fontWeight: p === page ? 600 : 400,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem'
                }}
              >
                {p}
              </button>
            )
          ))}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            style={{ padding: '0.35rem', borderRadius: '4px', border: '1px solid #D6CFE6', backgroundColor: '#fff', color: page === totalPages ? '#C4BCAF' : '#5A5551', cursor: page === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

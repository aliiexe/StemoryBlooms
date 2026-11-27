import { useMemo } from 'react';
import { useRememberedState } from '@/components/navigation/useRememberedState';

export function usePagination<T>(items: T[], initialRowsPerPage = 10) {
  const [page, setPage] = useRememberedState('page', 1);
  const [rowsPerPage, setRowsPerPage] = useRememberedState('rowsPerPage', initialRowsPerPage);

  const totalPages = Math.max(1, Math.ceil(items.length / rowsPerPage));

  // Ensure page is within bounds if items change
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return items.slice(start, start + rowsPerPage);
  }, [items, currentPage, rowsPerPage]);

  return {
    page: currentPage,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    totalPages,
    paginatedItems,
    totalItems: items.length
  };
}

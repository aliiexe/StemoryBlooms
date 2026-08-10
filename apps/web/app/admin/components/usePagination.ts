import { useState, useMemo } from 'react';

export function usePagination<T>(items: T[], initialRowsPerPage = 10) {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

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

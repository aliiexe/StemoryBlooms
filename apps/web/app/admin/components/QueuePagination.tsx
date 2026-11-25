import Link from 'next/link';
import styles from '../workspace.module.css';
export default function QueuePagination({ path, page, count, search, status }: { path: string; page: number; count: number; search: string; status: string }) {
  const pages = Math.max(1, Math.ceil(count / 25));
  const url = (next: number) => `${path}?${new URLSearchParams({ search, status, page: String(next) })}`;
  return <nav aria-label="Results pages" className={styles.pagination}>{page > 1 && <Link href={url(page - 1)}>Previous</Link>}<span>{count} results · Page {page} of {pages}</span>{page < pages && <Link href={url(page + 1)}>Next</Link>}</nav>;
}

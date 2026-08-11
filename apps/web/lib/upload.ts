/**
 * Universal image upload helper.
 *
 * • In production (Vercel) where BLOB_READ_WRITE_TOKEN is set → uploads to Vercel Blob
 *   and returns a public CDN URL.
 * • In development (no token) → saves to public/uploads on disk and returns a /uploads/…
 *   relative URL, exactly as before.
 *
 * This means you never touch the filesystem in production, solving the Vercel
 * read-only filesystem crash entirely.
 */

import crypto from 'crypto';
import path from 'path';

function makeSafeFilename(originalName: string): string {
  const safeName = originalName
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .toLowerCase();
  const ext = path.extname(safeName) || '.jpg';
  const base = path.basename(safeName, ext) || 'upload';
  return `${Date.now()}-${crypto.randomUUID()}-${base}${ext}`;
}

export async function uploadImage(file: File): Promise<string> {
  const fileName = makeSafeFilename(file.name);

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    // ── Production / Vercel Blob ───────────────────────────────────────
    const { put } = await import('@vercel/blob');
    const blob = await put(`uploads/${fileName}`, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  } else {
    // ── Development / local disk ───────────────────────────────────────
    const { mkdir, writeFile } = await import('fs/promises');
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, fileName);
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, bytes);
    return `/uploads/${fileName}`;
  }
}

/**
 * Upload multiple files and return all URLs.
 */
export async function uploadImages(files: File[]): Promise<string[]> {
  return Promise.all(files.map(uploadImage));
}

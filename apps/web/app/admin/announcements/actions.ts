'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, eq, sql, announcement, announcementBarSettings } from '@stemory/database';
import { asc, desc } from 'drizzle-orm';
import crypto from 'crypto';
import { parseIntegerInput } from '../../../lib/form-values';

function validateUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function sanitizeText(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim().slice(0, 500);
}

function validateColor(color: string): string {
  return /^#[0-9A-Fa-f]{3,8}$/.test(color) ? color : '#F6F4EC';
}

export async function createAnnouncement(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  await db.insert(announcement).values({
      id: crypto.randomUUID(),
      internalTitle: sanitizeText(raw.internalTitle as string),
      message: sanitizeText(raw.message as string),
      highlightedText: raw.highlightedText ? sanitizeText(raw.highlightedText as string) : null,
      ctaLabel: raw.ctaLabel ? sanitizeText(raw.ctaLabel as string) : null,
      linkUrl: validateUrl(raw.linkUrl as string),
      wholeBarClickable: raw.wholeBarClickable === 'on',
      openInNewTab: raw.openInNewTab === 'on',
      decorativeAsset: (raw.decorativeAsset as string) || null,
      templateId: (raw.templateId as string) || null,
      status: 'DRAFT',
      order: parseIntegerInput(raw.order as string | null) ?? 0,
      startAt: raw.startAt ? new Date(raw.startAt as string) : null,
      endAt: raw.endAt ? new Date(raw.endAt as string) : null,
      noEndDate: raw.noEndDate === 'on',
      isDismissible: raw.isDismissible === 'on',
      dismissalDuration: (raw.dismissalDuration as string) || 'SESSION',
      backgroundColor: validateColor(raw.backgroundColor as string || '#F6F4EC'),
      textColor: validateColor(raw.textColor as string || '#4A4A4A'),
      accentColor: validateColor(raw.accentColor as string || '#D6CFE6'),
      linkColor: validateColor(raw.linkColor as string || '#6F7E59'),
      textAlignment: (raw.textAlignment as string) || 'CENTER',
      desktopFontSize: (raw.desktopFontSize as string) || '0.875rem',
      mobileFontSize: (raw.mobileFontSize as string) || '0.8rem',
      barHeight: (raw.barHeight as string) || '40px',
      animationType: (raw.animationType as string) || 'FADE',
      showDesktop: raw.showDesktop !== 'off',
      showTablet: raw.showTablet !== 'off',
      showMobile: raw.showMobile !== 'off',
      targetMode: (raw.targetMode as string) || 'ALL',
      countdownEnabled: raw.countdownEnabled === 'on',
      countdownTarget: raw.countdownTarget ? new Date(raw.countdownTarget as string) : null,
      countdownEndBehavior: (raw.countdownEndBehavior as string) || 'HIDE',
      updatedAt: new Date(),
      dismissalVersion: crypto.randomUUID()
  });
  revalidatePath('/admin/announcements');
  redirect('/admin/announcements');
}

export async function updateAnnouncement(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  await db.update(announcement)
    .set({
      internalTitle: sanitizeText(raw.internalTitle as string),
      message: sanitizeText(raw.message as string),
      highlightedText: raw.highlightedText ? sanitizeText(raw.highlightedText as string) : null,
      ctaLabel: raw.ctaLabel ? sanitizeText(raw.ctaLabel as string) : null,
      linkUrl: validateUrl(raw.linkUrl as string),
      wholeBarClickable: raw.wholeBarClickable === 'on',
      openInNewTab: raw.openInNewTab === 'on',
      decorativeAsset: (raw.decorativeAsset as string) || null,
      templateId: (raw.templateId as string) || null,
      startAt: raw.startAt ? new Date(raw.startAt as string) : null,
      endAt: raw.endAt ? new Date(raw.endAt as string) : null,
      noEndDate: raw.noEndDate === 'on',
      isDismissible: raw.isDismissible === 'on',
      dismissalDuration: (raw.dismissalDuration as string) || 'SESSION',
      backgroundColor: validateColor(raw.backgroundColor as string || '#F6F4EC'),
      textColor: validateColor(raw.textColor as string || '#4A4A4A'),
      accentColor: validateColor(raw.accentColor as string || '#D6CFE6'),
      linkColor: validateColor(raw.linkColor as string || '#6F7E59'),
      textAlignment: (raw.textAlignment as string) || 'CENTER',
      desktopFontSize: (raw.desktopFontSize as string) || '0.875rem',
      mobileFontSize: (raw.mobileFontSize as string) || '0.8rem',
      barHeight: (raw.barHeight as string) || '40px',
      animationType: (raw.animationType as string) || 'FADE',
      showDesktop: raw.showDesktop !== 'off',
      showTablet: raw.showTablet !== 'off',
      showMobile: raw.showMobile !== 'off',
      targetMode: (raw.targetMode as string) || 'ALL',
      countdownEnabled: raw.countdownEnabled === 'on',
      countdownTarget: raw.countdownTarget ? new Date(raw.countdownTarget as string) : null,
      countdownEndBehavior: (raw.countdownEndBehavior as string) || 'HIDE',
      updatedAt: new Date()
    })
    .where(eq(announcement.id, id));
  revalidatePath('/admin/announcements');
  revalidatePath('/');
  redirect('/admin/announcements');
}

export async function publishAnnouncement(id: string) {
  await db.update(announcement).set({ status: 'ACTIVE', updatedAt: new Date() }).where(eq(announcement.id, id));
  revalidatePath('/admin/announcements');
  revalidatePath('/');
}

export async function pauseAnnouncement(id: string) {
  await db.update(announcement).set({ status: 'PAUSED', updatedAt: new Date() }).where(eq(announcement.id, id));
  revalidatePath('/admin/announcements');
  revalidatePath('/');
}

export async function archiveAnnouncement(id: string) {
  await db.update(announcement).set({ status: 'ARCHIVED', archivedAt: new Date(), updatedAt: new Date() }).where(eq(announcement.id, id));
  revalidatePath('/admin/announcements');
  revalidatePath('/');
}

export async function deleteAnnouncement(id: string) {
  await db.delete(announcement).where(eq(announcement.id, id));
  revalidatePath('/admin/announcements');
  revalidatePath('/');
}

export async function duplicateAnnouncement(id: string) {
  const src = await db.query.announcement.findFirst({ where: eq(announcement.id, id) });
  if (!src) return;
  const { id: _id, createdAt: _c, updatedAt: _u, archivedAt: _a, dismissalVersion: _dv, ...rest } = src;
  await db.insert(announcement).values({
    id: crypto.randomUUID(),
    ...rest, 
    internalTitle: `${rest.internalTitle} (Copy)`, 
    status: 'DRAFT', 
    updatedAt: new Date(),
    dismissalVersion: crypto.randomUUID()
  });
  revalidatePath('/admin/announcements');
}

export async function reorderAnnouncements(ids: string[]) {
  await db.transaction(async (tx) => {
    for (let i = 0; i < ids.length; i++) {
      await tx.update(announcement).set({ order: i, updatedAt: new Date() }).where(eq(announcement.id, ids[i]));
    }
  });
  revalidatePath('/admin/announcements');
  revalidatePath('/');
}

export async function updateBarSettings(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const existing = await db.query.announcementBarSettings.findFirst();
  const data = {
    enabled: raw.enabled === 'on',
    mode: (raw.mode as string) || 'AUTO',
    autoPlay: raw.autoPlay !== 'off',
    loop: raw.loop !== 'off',
    intervalSeconds: parseIntegerInput(raw.intervalSeconds as string | null) ?? 5,
    transitionType: (raw.transitionType as string) || 'FADE',
    transitionDurationMs: parseIntegerInput(raw.transitionDurationMs as string | null) ?? 400,
    pauseOnHover: raw.pauseOnHover !== 'off',
    showArrows: raw.showArrows !== 'off',
    showIndicators: raw.showIndicators !== 'off',
    allowDismissal: raw.allowDismissal === 'on',
    defaultTheme: (raw.defaultTheme as string) || 'DEFAULT',
  };
  if (existing) {
    await db.update(announcementBarSettings).set({ ...data, updatedAt: new Date() }).where(eq(announcementBarSettings.id, existing.id));
  } else {
    await db.insert(announcementBarSettings).values({ id: crypto.randomUUID(), ...data, updatedAt: new Date() });
  }
  revalidatePath('/admin/announcements/settings');
  revalidatePath('/');
}

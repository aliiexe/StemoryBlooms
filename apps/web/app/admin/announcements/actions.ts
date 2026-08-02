'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@stemory/database';

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
  await prisma.announcement.create({
    data: {
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
      order: parseInt(raw.order as string) || 0,
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
    }
  });
  revalidatePath('/admin/announcements');
  redirect('/admin/announcements');
}

export async function updateAnnouncement(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  await prisma.announcement.update({
    where: { id },
    data: {
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
    }
  });
  revalidatePath('/admin/announcements');
  revalidatePath('/');
  redirect('/admin/announcements');
}

export async function publishAnnouncement(id: string) {
  await prisma.announcement.update({ where: { id }, data: { status: 'ACTIVE' } });
  revalidatePath('/admin/announcements');
  revalidatePath('/');
}

export async function pauseAnnouncement(id: string) {
  await prisma.announcement.update({ where: { id }, data: { status: 'PAUSED' } });
  revalidatePath('/admin/announcements');
  revalidatePath('/');
}

export async function archiveAnnouncement(id: string) {
  await prisma.announcement.update({ where: { id }, data: { status: 'ARCHIVED', archivedAt: new Date() } });
  revalidatePath('/admin/announcements');
  revalidatePath('/');
}

export async function deleteAnnouncement(id: string) {
  await prisma.announcement.delete({ where: { id } });
  revalidatePath('/admin/announcements');
  revalidatePath('/');
}

export async function duplicateAnnouncement(id: string) {
  const src = await prisma.announcement.findUnique({ where: { id } });
  if (!src) return;
  const { id: _id, createdAt: _c, updatedAt: _u, archivedAt: _a, dismissalVersion: _dv, ...rest } = src;
  await prisma.announcement.create({
    data: { ...rest, internalTitle: `${rest.internalTitle} (Copy)`, status: 'DRAFT' }
  });
  revalidatePath('/admin/announcements');
}

export async function reorderAnnouncements(ids: string[]) {
  await Promise.all(ids.map((id, index) =>
    prisma.announcement.update({ where: { id }, data: { order: index } })
  ));
  revalidatePath('/admin/announcements');
  revalidatePath('/');
}

export async function updateBarSettings(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const existing = await prisma.announcementBarSettings.findFirst();
  const data = {
    enabled: raw.enabled === 'on',
    mode: (raw.mode as string) || 'AUTO',
    autoPlay: raw.autoPlay !== 'off',
    loop: raw.loop !== 'off',
    intervalSeconds: parseInt(raw.intervalSeconds as string) || 5,
    transitionType: (raw.transitionType as string) || 'FADE',
    transitionDurationMs: parseInt(raw.transitionDurationMs as string) || 400,
    pauseOnHover: raw.pauseOnHover !== 'off',
    showArrows: raw.showArrows !== 'off',
    showIndicators: raw.showIndicators !== 'off',
    allowDismissal: raw.allowDismissal === 'on',
    defaultTheme: (raw.defaultTheme as string) || 'DEFAULT',
  };
  if (existing) {
    await prisma.announcementBarSettings.update({ where: { id: existing.id }, data });
  } else {
    await prisma.announcementBarSettings.create({ data });
  }
  revalidatePath('/admin/announcements/settings');
  revalidatePath('/');
}

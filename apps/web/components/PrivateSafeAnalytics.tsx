'use client';
import { Analytics } from '@vercel/analytics/react';
import { publicAnalyticsUrl } from '@/lib/analytics-privacy';
export default function PrivateSafeAnalytics() {
  return <Analytics beforeSend={event=>{const url=publicAnalyticsUrl(event.url);return url?{...event,url}:null;}}/>;
}

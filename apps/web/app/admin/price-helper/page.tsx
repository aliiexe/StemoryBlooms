import React from 'react';
import PriceHelperClient from './PriceHelperClient';
import { assertAdmin } from '@/lib/user-sync';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Price Helper | Stemory Blooms Admin',
};

export default async function PriceHelperPage() {
  await assertAdmin();
  return <PriceHelperClient />;
}

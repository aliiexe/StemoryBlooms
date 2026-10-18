'use client';

import { CustomSelect } from '@/components/ui/CustomSelect';
import type { ComponentProps } from 'react';

export default function CustomDropdown(props: ComponentProps<typeof CustomSelect>) {
  return <CustomSelect {...props} />;
}

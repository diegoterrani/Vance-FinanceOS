'use client';
import { mockCashflowData } from '@/lib/mock-data';
import CashflowPage from './_cashflow';

export default function Page() {
  return <CashflowPage mockCashflowData={mockCashflowData} />;
}

'use client';

// ---------------------------------------------------------------------------
// FASE 2 — Substituir imports de mock-data por:
//   const { data: transactions } = useQuery({ queryKey: ['transactions'], ... })
//   const { data: alerts } = useQuery({ queryKey: ['alerts'], ... })
// ---------------------------------------------------------------------------
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  initialTransactions,
  initialAlerts,
  mockCashflowData,
} from '@/lib/mock-data';
import type { Alert } from '@/lib/types';

// Inlining o componente original (copiado do Vite) sem alterações de lógica
import OverviewPage from './_overview';

export default function Page() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);

  const handleResolveAlert = (id: string) =>
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'resolved' as const } : a))
    );

  return (
    <OverviewPage
      transactions={initialTransactions}
      alerts={alerts}
      onNavigate={(view) => router.push(`/${view}`)}
      onResolveAlert={handleResolveAlert}
      mockCashflowData={mockCashflowData}
    />
  );
}

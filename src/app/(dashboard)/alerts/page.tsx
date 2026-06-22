'use client';
import { useState } from 'react';
import { initialAlerts } from '@/lib/mock-data';
import type { Alert } from '@/lib/types';
import AlertsPage from './_alerts';

export default function Page() {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);

  const handleResolve = (id: string) =>
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'resolved' as const } : a)));

  const handleSnooze = (id: string, hours: number) => {
    const d = new Date();
    d.setHours(d.getHours() + hours);
    const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'snoozed' as any, snoozedUntil: `${time} (Hoje)` } : a))
    );
  };

  return <AlertsPage alerts={alerts} onResolveAlert={handleResolve} onSnoozeAlert={handleSnooze} />;
}

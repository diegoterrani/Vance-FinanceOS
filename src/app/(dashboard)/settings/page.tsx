'use client';
import { useState } from 'react';
import {
  initialUsers,
  initialPluggyAccounts,
  initialWebhookLogs,
  initialAuditLogs,
} from '@/lib/mock-data';
import { useUIStore } from '@/store/ui.store';
import type { User, PluggyAccount } from '@/lib/types';
import SettingsPage from './_settings';

export default function Page() {
  const { appState, updateAppState } = useUIStore();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [pluggyAccounts, setPluggyAccounts] = useState<PluggyAccount[]>(initialPluggyAccounts);

  const handleAddUser = (u: User) => setUsers((prev) => [...prev, u]);
  const handleUpdateRole = (id: string, role: any) =>
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
  const handleToggleStatus = (id: string) =>
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u
      )
    );

  return (
    <SettingsPage
      appState={appState}
      onUpdateState={updateAppState}
      users={users}
      onAddUser={handleAddUser}
      onUpdateUserRole={handleUpdateRole}
      onToggleUserStatus={handleToggleStatus}
      pluggyAccounts={pluggyAccounts}
      onAddPluggyAccount={(acc) => setPluggyAccounts((prev) => [...prev, acc])}
      webhookLogs={initialWebhookLogs}
      auditLogs={initialAuditLogs}
    />
  );
}

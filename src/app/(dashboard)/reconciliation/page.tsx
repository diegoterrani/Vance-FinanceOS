'use client';
import { useState } from 'react';
import { initialTransactions } from '@/lib/mock-data';
import type { Transaction } from '@/lib/types';
import ReconciliationPage from './_reconciliation';

export default function Page() {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);

  const handleUpdateStatus = (id: string, newStatus: any) =>
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));

  const handleAddTransaction = (tx: Transaction) =>
    setTransactions((prev) => [tx, ...prev]);

  return (
    <ReconciliationPage
      transactions={transactions}
      onUpdateStatus={handleUpdateStatus}
      onAddTransaction={handleAddTransaction}
    />
  );
}

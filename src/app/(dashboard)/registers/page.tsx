'use client';
import { useState } from 'react';
import { initialTransactions } from '@/lib/mock-data';
import type { Transaction } from '@/lib/types';
import RegistersPage from './_registers';

export default function Page() {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const handleAdd = (tx: Transaction) => setTransactions((prev) => [tx, ...prev]);
  return <RegistersPage transactions={transactions} onAddTransaction={handleAdd} />;
}

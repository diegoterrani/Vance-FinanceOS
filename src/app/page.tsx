import { redirect } from 'next/navigation';

/**
 * Rota raiz '/' redireciona para '/overview' (dashboard principal).
 * Server Component — sem 'use client'.
 */
export default function RootPage() {
  redirect('/overview');
}

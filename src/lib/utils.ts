import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge de classes Tailwind com suporte a condicionais.
 * Padrão adotado pelo shadcn/ui — evita conflitos de utilidades duplicadas.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

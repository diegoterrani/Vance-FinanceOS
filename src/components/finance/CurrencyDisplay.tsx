import React from 'react';
import { formatCurrency } from '../../lib/formatters';

interface CurrencyDisplayProps {
  value: number;
  variant?: 'inline' | 'large' | 'table';
  showSign?: boolean;
  colorize?: boolean;
}

export default function CurrencyDisplay({
  value,
  variant = 'inline',
  showSign = false,
  colorize = false
}: CurrencyDisplayProps) {
  const isNegative = value < 0;
  
  // Decide color styles based on value and colorize setting
  let colorClass = 'text-primary';
  if (colorize) {
    if (value > 0) {
      colorClass = 'text-green-500 font-medium'; // --color-credit style
    } else if (value < 0) {
      colorClass = 'text-red-500 font-medium'; // --color-debit style
    } else {
      colorClass = 'text-foreground opacity-70';
    }
  }

  const textStyle = {
    inline: 'font-mono tracking-tight',
    large: 'font-mono tracking-tight text-2xl lg:text-3xl font-semibold',
    table: 'font-mono text-[13px] tracking-tight text-right'
  }[variant];

  // For visual consistency, let's keep negative value's minus sign embedded or formatted
  const formattedText = formatCurrency(value, showSign);

  return (
    <span className={`${textStyle} ${colorClass} inline-flex items-center`}>
      {formattedText}
    </span>
  );
}

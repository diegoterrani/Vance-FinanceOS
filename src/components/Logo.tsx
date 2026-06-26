import React, { useState } from 'react';
import { Image } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  src?: string;
}

export default function Logo({ 
  className = '', 
  size = 'md', 
  showText = true,
  src = '/logo-vance.png' // Caminho padrão preparado para receber a imagem do logo
}: LogoProps) {
  const [hasError, setHasError] = useState(false);

  // Dimensions based on size preset for the logo container/image
  const dimensions = {
    sm: { width: 'w-8', height: 'h-8', iconSize: 14 },
    md: { width: 'w-32', height: 'h-10', iconSize: 18 },
    lg: { width: 'w-44', height: 'h-12', iconSize: 22 },
    xl: { width: 'w-56', height: 'h-16', iconSize: 28 }
  }[size];

  // For collapsed state (showText is false), we want a compact square/circle logo
  const isCompact = !showText || size === 'sm';

  return (
    <div className={`flex items-center justify-start select-none ${className}`} id="vance-logo-container">
      {!hasError ? (
        <img
          src={src}
          alt="VANCE Logo"
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className={`object-contain transition-all duration-300 ${
            isCompact ? 'w-8 h-8' : `${dimensions.width} ${dimensions.height}`
          }`}
          id="vance-logo-img"
        />
      ) : (
        /* Estado Preparado: Placeholder altamente polido aguardando upload da imagem do logo */
        <div 
          className={`flex items-center justify-center gap-2 border border-dashed border-brand/30 bg-brand/5 hover:bg-brand/10 rounded-lg transition-all duration-300 group cursor-pointer ${
            isCompact 
              ? 'w-8 h-8 p-1' 
              : `${dimensions.width} ${dimensions.height} px-3 py-1.5`
          }`}
          title="Preparado para receber a imagem de logo do VANCE (/logo-vance.png)"
          id="vance-logo-placeholder"
        >
          <Image 
            size={isCompact ? 14 : dimensions.iconSize} 
            className="text-brand/60 group-hover:text-brand transition-colors shrink-0" 
          />
          {!isCompact && (
            <div className="flex flex-col text-left leading-none min-w-0">
              <span className="text-[10px] font-bold text-brand uppercase tracking-wider truncate">Logo Vance</span>
              <span className="text-[8px] text-[var(--text-muted)] group-hover:text-brand/80 transition-colors truncate font-mono">/logo-vance.png</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


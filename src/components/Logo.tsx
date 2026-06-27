import React, { useState } from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  src?: string;
}

// VANCE EXPERT logo. The metallic shield/arrow mark is a scalable SVG at
// /logo-vance.svg. Drop a /logo-vance.png to override with a raster version.
export default function Logo({
  className = '',
  size = 'md',
  showText = true,
  src = '/logo-vance.svg'
}: LogoProps) {
  const [hasError, setHasError] = useState(false);

  const preset = {
    sm: { mark: 'h-8 w-8', title: 'text-sm', sub: 'text-[7px] tracking-[0.25em]' },
    md: { mark: 'h-9 w-9', title: 'text-lg', sub: 'text-[8px] tracking-[0.3em]' },
    lg: { mark: 'h-11 w-11', title: 'text-xl', sub: 'text-[9px] tracking-[0.32em]' },
    xl: { mark: 'h-14 w-14', title: 'text-3xl', sub: 'text-[11px] tracking-[0.34em]' }
  }[size];

  const isCompact = !showText || size === 'sm';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`} id="vance-logo-container">
      {!hasError ? (
        <img
          src={src}
          alt="VANCE Expert"
          onError={() => setHasError(true)}
          className={`object-contain shrink-0 ${preset.mark}`}
          id="vance-logo-img"
        />
      ) : (
        // Fallback monogram if the asset fails to load.
        <div className={`shrink-0 grid place-items-center rounded-lg bg-gradient-to-br from-slate-200 to-slate-500 text-slate-900 font-black ${preset.mark}`}>
          V
        </div>
      )}

      {!isCompact && (
        <div className="flex flex-col leading-none">
          <span className={`font-extrabold tracking-tight ${preset.title}`}>VANCE</span>
          <span className={`font-semibold uppercase opacity-70 ${preset.sub}`}>Expert</span>
        </div>
      )}
    </div>
  );
}

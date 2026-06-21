import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export default function Logo({ className = '', size = 'md', showText = true }: LogoProps) {
  // Dimensions based on size preset
  const iconSize = {
    sm: { width: 28, height: 28 },
    md: { width: 36, height: 36 },
    lg: { width: 48, height: 48 },
    xl: { width: 64, height: 64 }
  }[size];

  const textSize = {
    sm: 'text-lg tracking-wider font-semibold',
    md: 'text-2xl tracking-widest font-bold',
    lg: 'text-3xl tracking-widest font-extrabold',
    xl: 'text-4xl tracking-widest font-black'
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* VANCE GROWTH & HEART ICON */}
      <svg
        width={iconSize.width}
        height={iconSize.height}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-brand flex-shrink-0"
      >
        {/* Draw the custom 'V' with a heart and up-arrow symbol */}
        {/* Rounded left bar of the V */}
        <rect
          x="28"
          y="28"
          width="12"
          height="32"
          rx="6"
          transform="rotate(-25 28 28)"
          fill="currentColor"
        />
        
        {/* Heart icon in the inner hub */}
        <path
          d="M45.5 35.5C44.3 33.3 40.7 33.3 39.5 35.5C38.2 37.8 40.5 41.5 42.5 43.5C44.5 41.5 46.8 37.8 45.5 35.5Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        
        {/* Standard Heart nestled at the top crook */}
        <path
          d="M50 28C48 24.5 43.5 24.5 41.5 27C39.5 29.5 41.5 34 50 40C58.5 34 60.5 29.5 58.5 27C56.5 24.5 52 24.5 50 28Z"
          fill="currentColor"
        />

        {/* Right shooting upward arrow of the V */}
        <path
          d="M32 50L50 78L72 32"
          stroke="currentColor"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Arrow top-right arrowhead */}
        <path
          d="M66.5 22L78 30L62 38"
          stroke="currentColor"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {showText && (
        <span className={`font-sans font-bold uppercase tracking-[0.25em] text-foreground ${textSize}`}>
          vance
        </span>
      )}
    </div>
  );
}

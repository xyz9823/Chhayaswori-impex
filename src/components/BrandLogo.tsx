import React from 'react';

interface BrandLogoProps {
  logoUrl?: string;
  invert?: boolean;
  compact?: boolean;
}

/**
 * Renders the authentic CHHAYASWORI IMPEX shoe-silhouette + wordmark logo
 * matching the owner's uploaded brand asset, or the custom uploaded logoUrl if set in Admin Settings.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  logoUrl,
  invert = false,
  compact = false,
}) => {
  if (logoUrl && logoUrl.trim() !== '') {
    return (
      <img
        src={logoUrl}
        alt="CHHAYASWORI IMPEX"
        referrerPolicy="no-referrer"
        className={`${compact ? 'h-8' : 'h-10'} w-auto object-contain`}
      />
    );
  }

  const strokeColor = invert ? '#FFFFFF' : '#0A0A0A';
  const textColor = invert ? 'text-white' : 'text-neutral-950';

  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      <svg
        viewBox="0 0 180 78"
        fill="none"
        className={compact ? 'h-7 w-auto' : 'h-9 w-auto'}
        aria-hidden="true"
      >
        {/* Exact Chhayaswori Impex stylized shoe silhouette & sole wave */}
        <path
          d="M20 50 C24 27, 33 15, 42 15 C50 15, 56 26, 72 26 C88 26, 99 18, 106 6 C109 1, 113 1, 118 5 L142 26 C150 33, 164 44, 173 48 C178 51, 179 58, 171 61 C154 65, 125 62, 95 52 C68 43, 43 46, 20 60 Z"
          stroke={strokeColor}
          strokeWidth="4.5"
          strokeLinejoin="round"
        />
        <path
          d="M17 65 C43 48, 72 47, 114 60"
          stroke={strokeColor}
          strokeWidth="3.8"
          strokeLinecap="round"
        />
      </svg>
      <div className="flex flex-col leading-none">
        <span
          className={`font-display font-extrabold tracking-[0.12em] uppercase ${
            compact ? 'text-sm' : 'text-base md:text-lg'
          } ${textColor}`}
        >
          CHHAYASWORI
        </span>
        <span
          className={`text-[9px] font-semibold tracking-[0.36em] uppercase mt-0.5 ${
            invert ? 'text-neutral-300' : 'text-neutral-500'
          }`}
        >
          — IMPEX —
        </span>
      </div>
    </div>
  );
};

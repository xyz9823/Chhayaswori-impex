import React, { useState } from 'react';
import { Footprints } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  className = '',
  priority = false,
}) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-neutral-100 text-neutral-500 p-6 text-center select-none ${className}`}
        role="img"
        aria-label={alt}
      >
        <Footprints className="w-8 h-8 stroke-[1.25] text-neutral-400 mb-2" />
        <span className="text-xs font-medium tracking-wide uppercase text-neutral-600 line-clamp-2">
          {alt || 'Chhayaswori Impex Footwear'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading={priority ? 'eager' : 'lazy'}
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

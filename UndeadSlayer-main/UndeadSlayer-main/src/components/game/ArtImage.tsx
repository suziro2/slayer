"use client";

import React, { useState } from "react";

interface ArtImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackText?: string;
  style?: React.CSSProperties;
}

/**
 * Image wrapper for generated SVG character art. If a source ever fails,
 * replace the broken-image icon with a themed fallback that keeps the layout.
 */
export default function ArtImage({
  src,
  alt,
  className = "",
  fallbackText,
  style,
}: ArtImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = failedSrc === src;

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-800 via-purple-950 to-slate-950 text-amber-200 font-black ${className}`}
        style={style}
        role="img"
        aria-label={alt}
        title={alt}
      >
        <span className="drop-shadow-[0_0_12px_rgba(251,191,36,.35)]">
          {fallbackText || alt.slice(0, 1).toUpperCase() || "✦"}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      decoding="async"
      onError={() => setFailedSrc(src)}
    />
  );
}

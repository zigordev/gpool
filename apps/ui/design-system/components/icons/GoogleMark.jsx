import React from 'react';

/** Google's "G" mark, monochrome-white-on-color variant — the correct
 * official treatment for a colored button background (the 4-color G is
 * for white/light buttons only). Real vendored artwork, not a generic
 * Icon glyph — belongs here for the same reason Flag does. */
export function GoogleMark({ size = 18, className = '', style, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 18 18"
      className={className}
      style={{ display: 'block', flexShrink: 0, ...style }}
      aria-hidden="true"
      {...props}
    >
      <path fill="#fff" d="M17.64 9.2c0-.637-.057-1.25-.164-1.84H9v3.48h4.844c-.209 1.18-.843 2.18-1.796 2.85v2.26h2.908c1.702-1.567 2.684-3.874 2.684-6.75z" />
      <path fill="#fff" opacity="0.85" d="M9 18c2.43 0 4.467-.806 5.965-2.18l-2.908-2.26c-.806.54-1.837.86-3.057.86-2.35 0-4.34-1.587-5.053-3.72H.957v2.332C2.438 15.983 5.482 18 9 18z" />
      <path fill="#fff" opacity="0.7" d="M3.947 10.72c-.18-.54-.282-1.117-.282-1.72 0-.603.102-1.18.282-1.72V4.948H.957C.348 6.173 0 7.548 0 9s.348 2.827.957 4.052l2.99-2.332z" />
      <path fill="#fff" opacity="0.85" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.948L3.947 7.28C4.66 5.145 6.65 3.58 9 3.58z" />
    </svg>
  );
}

import React from 'react';

/**
 * SkillSync Logo — Geometric Isometric S Monogram
 */
export default function SkillSyncLogo({ className = "w-8 h-8", color = "currentColor" }) {
  return (
    <svg
      viewBox="0 0 100 116"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Top Geometric S Segment */}
      <path
        d="M 50 6 L 92 30 L 92 53 L 38 84 L 16 71 L 16 49 L 38 62 L 38 40 Z"
        fill={color}
      />
      {/* Bottom Geometric S Segment */}
      <path
        d="M 50 110 L 8 86 L 8 63 L 62 32 L 84 45 L 84 67 L 62 54 L 62 76 Z"
        fill={color}
      />
    </svg>
  );
}

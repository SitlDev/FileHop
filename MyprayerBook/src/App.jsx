import { useState, useCallback, useEffect, useRef } from "react";

// ─── Sacred SVG Icon System ───────────────────────────────────────────────────
// All icons hand-drawn in the manuscript / illuminated gospel aesthetic.
// Stroke color inherits from `color` CSS prop via `currentColor`.
const ICONS = {
  // Prayer type icons
  confession: (s=24) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* Kneeling figure before a cross */}
      <line x1="12" y1="2" x2="12" y2="10"/>
      <line x1="8" y1="6" x2="16" y2="6"/>
      {/* Bowed head */}
      <circle cx="12" cy="15" r="2.2" strokeWidth="1.3"/>
      {/* Arms outstretched low */}
      <path d="M7 19 Q9.5 17 12 17 Q14.5 17 17 19"/>
      <path d="M5 21 Q6 19 7 19"/>
      <path d="M17 19 Q18 19 19 21"/>
    </svg>
  ),
  forgiveness: (s=24) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* Dove in flight */}
      <path d="M4 13 Q7 9 12 11 Q17 9 20 11"/>
      <path d="M12 11 Q13 7 16 6 Q14 9 15 11"/>
      <path d="M12 11 L12 16"/>
      <path d="M10 15 Q12 17 14 15"/>
      <path d="M4 13 Q3 15 5 16 Q4 14 4 13"/>
      {/* Olive branch suggestion */}
      <path d="M17 14 Q19 13 20 15"/>
      <path d="M18 13.5 L18 16"/>
    </svg>
  ),
  deliverance: (s=24) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* Broken chain link */}
      <path d="M8 10 Q6 8 7 6 Q8 4 10 5 L13 8"/>
      <path d="M11 14 L14 17 Q16 20 14 21 Q12 22 11 20 Q10 18 12 17"/>
      {/* Break gap */}
      <line x1="10" y1="13" x2="8.5" y2="11.5" strokeDasharray="1.5 1.5"/>
      {/* Light rays from break */}
      <line x1="12" y1="12" x2="15" y2="9"/>
      <line x1="12" y1="12" x2="16" y2="12"/>
      <line x1="12" y1="12" x2="15" y2="15"/>
    </svg>
  ),
  healing: (s=24) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* Cross with gentle rays — healing light */}
      <line x1="12" y1="4" x2="12" y2="20"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
      {/* Small rays */}
      <line x1="12" y1="4" x2="10.5" y2="2" strokeWidth="1"/>
      <line x1="12" y1="4" x2="13.5" y2="2" strokeWidth="1"/>
      <line x1="19" y1="12" x2="21" y2="10.5" strokeWidth="1"/>
      <line x1="19" y1="12" x2="21" y2="13.5" strokeWidth="1"/>
      <line x1="12" y1="20" x2="10.5" y2="22" strokeWidth="1"/>
      <line x1="12" y1="20" x2="13.5" y2="22" strokeWidth="1"/>
      <line x1="5" y1="12" x2="3" y2="10.5" strokeWidth="1"/>
      <line x1="5" y1="12" x2="3" y2="13.5" strokeWidth="1"/>
    </svg>
  ),
  gratitude: (s=24) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* Chalice / cup of thanksgiving */}
      <path d="M8 4 L7 12 Q7 17 12 17 Q17 17 17 12 L16 4 Z"/>
      <line x1="9.5" y1="4" x2="14.5" y2="4"/>
      <line x1="10" y1="17" x2="10" y2="20"/>
      <line x1="14" y1="17" x2="14" y2="20"/>
      <line x1="8" y1="20" x2="16" y2="20"/>
      {/* Small rising lines — thankfulness */}
      <line x1="12" y1="8" x2="12" y2="6" strokeWidth="1"/>
      <line x1="10.5" y1="9" x2="9.5" y2="7.2" strokeWidth="1"/>
      <line x1="13.5" y1="9" x2="14.5" y2="7.2" strokeWidth="1"/>
    </svg>
  ),
  intercession: (s=24) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* Two figures — one uplifting the other toward heaven */}
      <circle cx="8" cy="5" r="2"/>
      <circle cx="16" cy="5" r="2"/>
      <path d="M8 7 L8 13 L6 17"/>
      <path d="M8 7 L10 11"/>
      <path d="M16 7 L16 12"/>
      <path d="M14 10 L16 8 L18 10"/>
      {/* Arc of intercession */}
      <path d="M10 9 Q12 6 14 9" strokeWidth="1" strokeDasharray="1.5 1"/>
    </svg>
  ),
  praise: (s=24) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* Radiant star / glory burst */}
      <circle cx="12" cy="12" r="3"/>
      <line x1="12" y1="3" x2="12" y2="6"/>
      <line x1="12" y1="18" x2="12" y2="21"/>
      <line x1="3" y1="12" x2="6" y2="12"/>
      <line x1="18" y1="12" x2="21" y2="12"/>
      <line x1="5.6" y1="5.6" x2="7.8" y2="7.8"/>
      <line x1="16.2" y1="16.2" x2="18.4" y2="18.4"/>
      <line x1="18.4" y1="5.6" x2="16.2" y2="7.8"/>
      <line x1="7.8" y1="16.2" x2="5.6" y2="18.4"/>
    </svg>
  ),

  // Bottom nav tab icons
  "tab-pray": (s=22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      {/* Latin cross */}
      <line x1="12" y1="2" x2="12" y2="22"/>
      <line x1="5" y1="8" x2="19" y2="8"/>
    </svg>
  ),
  "tab-journal": (s=22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* Open book */}
      <path d="M12 5 Q9 3 4 4 L4 20 Q9 19 12 21 Q15 19 20 20 L20 4 Q15 3 12 5 Z"/>
      <line x1="12" y1="5" x2="12" y2="21"/>
      <line x1="7" y1="9" x2="10" y2="9" strokeWidth="1"/>
      <line x1="7" y1="12" x2="10" y2="12" strokeWidth="1"/>
      <line x1="7" y1="15" x2="10" y2="15" strokeWidth="1"/>
      <line x1="14" y1="9" x2="17" y2="9" strokeWidth="1"/>
      <line x1="14" y1="12" x2="17" y2="12" strokeWidth="1"/>
    </svg>
  ),
  "tab-verses": (s=22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* Scroll / parchment */}
      <path d="M6 4 Q4 4 4 6 Q4 8 6 8 L18 8 Q20 8 20 6 Q20 4 18 4 Z"/>
      <path d="M6 4 L6 18 Q6 20 8 20 L18 20 Q20 20 20 18 L20 8"/>
      <path d="M6 18 Q4 18 4 20 Q4 22 6 22 Q8 22 8 20 L8 4"/>
      <line x1="9" y1="12" x2="17" y2="12" strokeWidth="1"/>
      <line x1="9" y1="15" x2="15" y2="15" strokeWidth="1"/>
    </svg>
  ),
  "tab-streak": (s=22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* Oil lamp / eternal flame */}
      <path d="M9 20 L15 20"/>
      <line x1="12" y1="20" x2="12" y2="16"/>
      <ellipse cx="12" cy="14" rx="4" ry="2.5"/>
      {/* Flame */}
      <path d="M12 14 Q10 10 12 7 Q14 10 12 14"/>
      <path d="M12 11 Q11 9 12 8 Q13 9 12 11"/>
    </svg>
  ),
  "tab-notes": (s=22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* Quill & parchment */}
      <rect x="4" y="3" width="13" height="18" rx="2"/>
      <line x1="7" y1="8" x2="14" y2="8" strokeWidth="1"/>
      <line x1="7" y1="12" x2="14" y2="12" strokeWidth="1"/>
      <line x1="7" y1="16" x2="11" y2="16" strokeWidth="1"/>
      {/* Quill nib in corner */}
      <path d="M17 1 Q22 3 21 8 L18 11 L15 8 Z" strokeWidth="1.2"/>
      <line x1="15" y1="8" x2="18" y2="11" strokeWidth="1"/>
    </svg>
  ),

  // Music track icons
  "music-piano": (s=20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* Lyre */}
      <path d="M8 18 L8 7 Q8 4 12 4 Q16 4 16 7 L16 18"/>
      <line x1="8" y1="18" x2="16" y2="18"/>
      <line x1="10" y1="16" x2="10" y2="8"/>
      <line x1="12" y1="16" x2="12" y2="6"/>
      <line x1="14" y1="16" x2="14" y2="8"/>
      <path d="M7 11 Q5 12 5 14 Q5 16 7 16"/>
      <path d="M17 11 Q19 12 19 14 Q19 16 17 16"/>
    </svg>
  ),
  "music-staff": (s=20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      {/* Musical staff with cross note */}
      <line x1="3" y1="8" x2="21" y2="8"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="16" x2="21" y2="16"/>
      <ellipse cx="8" cy="14" rx="2" ry="1.4" strokeWidth="1.3"/>
      <line x1="10" y1="14" x2="10" y2="7"/>
      <ellipse cx="15" cy="10" rx="2" ry="1.4" strokeWidth="1.3"/>
      <line x1="17" y1="10" x2="17" y2="4"/>
    </svg>
  ),
  "music-moon": (s=20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      {/* Crescent moon with a star */}
      <path d="M17 12 Q17 7 13 5 Q18 5 20 9 Q22 14 18 18 Q14 22 9 20 Q13 19 15 16 Q17 14 17 12 Z"/>
      <circle cx="8" cy="9" r="1.2" strokeWidth="1"/>
    </svg>
  ),
  "music-halo": (s=20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      {/* Halo / glory ring */}
      <ellipse cx="12" cy="8" rx="6" ry="2.5"/>
      {/* Angel figure below */}
      <circle cx="12" cy="14" r="2.2"/>
      <path d="M9 17 Q10 19 12 19 Q14 19 15 17"/>
      <path d="M7 12 Q5 10 6 8 Q8 9 9 11"/>
      <path d="M17 12 Q19 10 18 8 Q16 9 15 11"/>
    </svg>
  ),
  "music-dove": (s=20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* Simple dove */}
      <path d="M4 14 Q8 9 13 11 Q17 9 20 11 Q17 13 15 12 Q13 14 13 16 L10 18 Q8 18 8 16 Q6 16 4 14 Z"/>
      <path d="M13 11 Q14 8 17 7 Q15 10 16 12"/>
      <circle cx="18" cy="10" r="0.8" fill="currentColor" strokeWidth="0"/>
    </svg>
  ),
  "music-note": (s=20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      {/* Double music note */}
      <line x1="9" y1="5" x2="9" y2="17"/>
      <line x1="15" y1="3" x2="15" y2="15"/>
      <line x1="9" y1="5" x2="15" y2="3"/>
      <ellipse cx="7" cy="17" rx="2.2" ry="1.5"/>
      <ellipse cx="13" cy="15" rx="2.2" ry="1.5"/>
    </svg>
  ),
  "music-vigil": (s=20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* Candle */}
      <rect x="9" y="14" width="6" height="8" rx="1"/>
      <path d="M12 14 Q10 10 12 7 Q14 10 12 14"/>
      <path d="M12 11.5 Q11 9.5 12 8.5 Q13 9.5 12 11.5"/>
      <line x1="11" y1="6.5" x2="10" y2="5.5" strokeWidth="1"/>
      <line x1="13" y1="6.5" x2="14" y2="5.5" strokeWidth="1"/>
      <line x1="12" y1="6" x2="12" y2="5" strokeWidth="1"/>
    </svg>
  ),

  // Action button icons
  "read-aloud": (s=16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      {/* Lips with sound waves */}
      <path d="M8 13 Q10 16 12 16 Q14 16 16 13"/>
      <path d="M7 11 Q8 10 10 10 L14 10 Q16 10 17 11"/>
      <path d="M19 9 Q21 12 19 15" strokeWidth="1.2"/>
      <path d="M21 7 Q24 12 21 17" strokeWidth="1"/>
    </svg>
  ),
  "stop": (s=16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <rect x="6" y="6" width="12" height="12" rx="2"/>
    </svg>
  ),
  "copy": (s=16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Parchment copy — two overlapping sheets */}
      <rect x="9" y="9" width="11" height="13" rx="2"/>
      <path d="M5 15 L5 5 Q5 3 7 3 L17 3"/>
    </svg>
  ),
  "share": (s=16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Rising arrow from open hands */}
      <line x1="12" y1="16" x2="12" y2="4"/>
      <path d="M8 8 L12 4 L16 8"/>
      <path d="M4 14 L4 19 Q4 21 6 21 L18 21 Q20 21 20 19 L20 14"/>
    </svg>
  ),
  "print": (s=16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="2" width="12" height="8" rx="1"/>
      <path d="M4 10 L4 17 Q4 18 5 18 L8 18 L8 15 L16 15 L16 18 L19 18 Q20 18 20 17 L20 10 Q20 9 19 9 L5 9 Q4 9 4 10 Z"/>
      <rect x="8" y="15" width="8" height="7" rx="1"/>
    </svg>
  ),
  "vary": (s=16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Quill pen — new writing */}
      <path d="M20 4 Q14 6 10 12 L8 18 L14 16 Q18 12 20 4 Z"/>
      <path d="M10 12 L8 18 L11 15"/>
      <path d="M20 4 Q17 8 14 10"/>
      <line x1="4" y1="20" x2="9" y2="20"/>
    </svg>
  ),
  "save": (s=16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Bookmark ribbon */}
      <path d="M6 3 L18 3 Q19 3 19 4 L19 21 L12 17 L5 21 L5 4 Q5 3 6 3 Z"/>
      <line x1="9" y1="9" x2="15" y2="9" strokeWidth="1.2"/>
      <line x1="12" y1="7" x2="12" y2="11" strokeWidth="1.2"/>
    </svg>
  ),
  "saved": (s=16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3 L18 3 Q19 3 19 4 L19 21 L12 17 L5 21 L5 4 Q5 3 6 3 Z"/>
      <path d="M9 12 L11 14 L15 10"/>
    </svg>
  ),
  "check": (s=16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13 L9 17 L19 7"/>
    </svg>
  ),
  "music-on": (s=20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Harp strings with sound arc */}
      <path d="M6 18 L6 6 Q6 4 12 4 Q18 4 18 6 L18 18 Q15 22 12 22 Q9 22 6 18 Z"/>
      <line x1="9" y1="18" x2="9" y2="7" strokeWidth="1"/>
      <line x1="12" y1="19" x2="12" y2="5" strokeWidth="1"/>
      <line x1="15" y1="18" x2="15" y2="7" strokeWidth="1"/>
    </svg>
  ),
  "music-off": (s=20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 18 L6 6 Q6 4 12 4 Q18 4 18 6 L18 18 Q15 22 12 22 Q9 22 6 18 Z" strokeDasharray="3 2"/>
      <line x1="9" y1="18" x2="9" y2="7" strokeWidth="1" opacity="0.4"/>
      <line x1="12" y1="19" x2="12" y2="5" strokeWidth="1" opacity="0.4"/>
      <line x1="15" y1="18" x2="15" y2="7" strokeWidth="1" opacity="0.4"/>
      <line x1="4" y1="4" x2="20" y2="20" strokeWidth="1.5"/>
    </svg>
  ),
  "light-mode": (s=20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="3" x2="12" y2="5.5"/>
      <line x1="12" y1="18.5" x2="12" y2="21"/>
      <line x1="3" y1="12" x2="5.5" y2="12"/>
      <line x1="18.5" y1="12" x2="21" y2="12"/>
      <line x1="5.6" y1="5.6" x2="7.4" y2="7.4"/>
      <line x1="16.6" y1="16.6" x2="18.4" y2="18.4"/>
      <line x1="18.4" y1="5.6" x2="16.6" y2="7.4"/>
      <line x1="7.4" y1="16.6" x2="5.6" y2="18.4"/>
    </svg>
  ),
  "dark-mode": (s=20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M21 12.8 Q18 14 15 12 Q12 10 12 7 Q12 4 14 2.5 Q9 3 6.5 7 Q4 11 6 15 Q8 19 13 20 Q18 21 21 17 Q22 15 21 12.8 Z"/>
    </svg>
  ),
  "play": (s=16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M7 4 L20 12 L7 20 Z"/>
    </svg>
  ),
  "pause": (s=16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <line x1="8" y1="5" x2="8" y2="19"/>
      <line x1="16" y1="5" x2="16" y2="19"/>
    </svg>
  ),
  "volume": (s=16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9 L3 15 L7 15 L13 20 L13 4 L7 9 Z"/>
      <path d="M16 9 Q18 12 16 15"/>
      <path d="M19 6 Q23 12 19 18"/>
    </svg>
  ),
  "loading": (s=16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{animation:"spin 1s linear infinite"}}>
      <circle cx="12" cy="12" r="9" strokeDasharray="28 56" strokeDashoffset="0"/>
    </svg>
  ),
  "cross": (s=28) => (
    <svg width={s} height={Math.round(s*1.2)} viewBox="0 0 60 70" fill="none">
      <rect x="25" y="0" width="10" height="70" rx="2" fill="#C9963A" opacity="0.75"/>
      <rect x="0" y="18" width="60" height="10" rx="2" fill="#C9963A" opacity="0.75"/>
      <rect x="27" y="2" width="6" height="66" rx="1" fill="#C9963A" opacity="0.28"/>
      <rect x="2" y="20" width="56" height="6" rx="1" fill="#C9963A" opacity="0.28"/>
    </svg>
  ),
  "mastered": (s=16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Laurel wreath suggestion */}
      <path d="M12 5 Q8 3 6 7 Q5 10 7 12"/>
      <path d="M12 5 Q16 3 18 7 Q19 10 17 12"/>
      <path d="M7 12 Q8 16 12 17 Q16 16 17 12"/>
      <path d="M10 14 L12 16 L14 14"/>
    </svg>
  ),
  "mark": (s=16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M5 12 L5 4 Q5 3 6 3 L18 3 Q19 3 19 4 L19 12 Q16 15 12 15 Q8 15 5 12 Z"/>
<line x1="5" y1="7" x2="19" y2="7" strokeWidth="1"/>
    </svg>
  ),
  "flame": (s=18, lit=true) => (
    <svg width={s} height={Math.round(s*1.2)} viewBox="0 0 18 22" fill="none" stroke={lit?"#C9963A":"rgba(201,150,58,0.25)"} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2 Q7 6 8 9 Q6 7 6 5 Q4 8 5 12 Q5 16 9 18 Q13 16 13 12 Q14 8 12 5 Q12 8 10 9 Q11 6 9 2 Z" fill={lit?"rgba(201,150,58,0.15)":"none"}/>
      <path d="M9 13 Q8 11 9 10 Q10 11 9 13 Z" fill={lit?"#C9963A":"none"} stroke="none"/>
    </svg>
  ),
  "ornament": (s=16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
      {/* Four-pointed star ornament */}
      <path d="M12 3 Q13 8 12 12 Q11 8 12 3 Z" fill="currentColor" opacity="0.7"/>
      <path d="M21 12 Q16 13 12 12 Q16 11 21 12 Z" fill="currentColor" opacity="0.7"/>
      <path d="M12 21 Q13 16 12 12 Q11 16 12 21 Z" fill="currentColor" opacity="0.7"/>
      <path d="M3 12 Q8 13 12 12 Q8 11 3 12 Z" fill="currentColor" opacity="0.7"/>
    </svg>
  ),
  "voice-male": (s=20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="14" r="5"/>
      <line x1="14" y1="10" x2="20" y2="4"/>
      <path d="M16 4 L20 4 L20 8"/>
    </svg>
  ),
  "voice-female": (s=20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="9" r="5"/>
      <line x1="12" y1="14" x2="12" y2="21"/>
      <line x1="9" y1="18" x2="15" y2="18"/>
    </svg>
  ),
  "lullaby-on": (s=20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* Crescent moon */}
      <path d="M17 11 Q17 7 14 6 Q19 5 21 9 Q23 13 19 17 Q15 21 10 19 Q14 18 16 15 Q17 13 17 11 Z"/>
      {/* Music note */}
      <line x1="5" y1="8" x2="5" y2="15"/>
      <line x1="5" y1="8" x2="9" y2="7"/>
      <line x1="9" y1="7" x2="9" y2="14"/>
      <circle cx="4.5" cy="15.5" r="1.3" fill="currentColor" stroke="none"/>
      <circle cx="8.5" cy="14.5" r="1.3" fill="currentColor" stroke="none"/>
    </svg>
  ),

  // ── Quick-prayer icons ───────────────────────────────────────────────────────
  "meal-breakfast": (s=24) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* Horizon */}
      <line x1="2" y1="17" x2="22" y2="17"/>
      {/* Rising sun arc */}
      <path d="M7 17 Q7 11 12 11 Q17 11 17 17"/>
      {/* Crown rays */}
      <line x1="12" y1="9" x2="12" y2="7"/>
      <line x1="8.8" y1="10" x2="7.3" y2="8.5"/>
      <line x1="15.2" y1="10" x2="16.7" y2="8.5"/>
      <line x1="7" y1="14" x2="5" y2="14"/>
      <line x1="17" y1="14" x2="19" y2="14"/>
    </svg>
  ),
  "meal-lunch": (s=24) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* Wheat — central stalk */}
      <line x1="12" y1="20" x2="12" y2="6"/>
      {/* Grain heads left */}
      <path d="M12 10 Q9 9 9 7 Q11 7 12 9"/>
      <path d="M12 13 Q9 12 9 10 Q11 10 12 12"/>
      <path d="M12 16 Q9 15 9 13 Q11 13 12 15"/>
      {/* Grain heads right */}
      <path d="M12 10 Q15 9 15 7 Q13 7 12 9"/>
      <path d="M12 13 Q15 12 15 10 Q13 10 12 12"/>
      <path d="M12 16 Q15 15 15 13 Q13 13 12 15"/>
      {/* Root spread */}
      <path d="M12 20 Q9 19 8 21"/>
      <path d="M12 20 Q15 19 16 21"/>
    </svg>
  ),
  "meal-dinner": (s=24) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* Oil lamp — base */}
      <path d="M7 18 L17 18 Q18 18 18 17 Q18 14 16 13 L8 13 Q6 14 6 17 Q6 18 7 18 Z"/>
      {/* Handle */}
      <path d="M16 13 Q20 13 20 10 Q20 8 18 8"/>
      {/* Spout / wick holder */}
      <path d="M8 13 Q7 11 9 10 Q11 9 11 8"/>
      {/* Flame */}
      <path d="M11 8 Q10 5 11 3 Q12.5 5 12 8"/>
      <path d="M11.2 6.5 Q11 5.5 11.5 5 Q12 5.5 11.8 6.5" fill="currentColor" stroke="none" opacity="0.6"/>
    </svg>
  ),
  "devotional-morning": (s=24) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* Cross */}
      <line x1="12" y1="2" x2="12" y2="10"/>
      <line x1="8.5" y1="5" x2="15.5" y2="5"/>
      {/* Horizon */}
      <line x1="2" y1="17" x2="22" y2="17"/>
      {/* Sun rising behind cross */}
      <path d="M8 17 Q8 13 12 13 Q16 13 16 17"/>
      {/* Gentle side rays */}
      <line x1="6" y1="15" x2="4" y2="15" strokeWidth="1"/>
      <line x1="18" y1="15" x2="20" y2="15" strokeWidth="1"/>
      <line x1="6.5" y1="13" x2="5" y2="11.5" strokeWidth="1"/>
      <line x1="17.5" y1="13" x2="19" y2="11.5" strokeWidth="1"/>
    </svg>
  ),
  "devotional-night": (s=24) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* Crescent moon */}
      <path d="M16 10 Q16 6 13 5 Q18 4 20 8 Q22 13 18 17 Q14 21 9 19 Q13 18 15 15 Q16 13 16 10 Z"/>
      {/* Candle below */}
      <rect x="9" y="15" width="4" height="6" rx="1" strokeWidth="1.2"/>
      {/* Candle flame */}
      <path d="M11 15 Q10 12.5 11 11 Q12 12.5 11 15"/>
      <path d="M11 13.5 Q10.5 12.5 11 12 Q11.5 12.5 11 13.5" fill="currentColor" stroke="none" opacity="0.5"/>
    </svg>
  ),
  "devotional-kids": (s=24) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* Lamb — fluffy body */}
      <path d="M6 15 Q6 11 9 11 Q9.5 9 12 9 Q14.5 9 15 11 Q18 11 18 15 Q18 18 12 18 Q6 18 6 15 Z"/>
      {/* Head */}
      <circle cx="19.5" cy="13" r="2" strokeWidth="1.3"/>
      {/* Ear */}
      <path d="M18.5 11.5 Q18 9.5 20 10.5"/>
      {/* Legs */}
      <line x1="9" y1="18" x2="9" y2="21" strokeWidth="1.2"/>
      <line x1="12" y1="18" x2="12" y2="21" strokeWidth="1.2"/>
      <line x1="15" y1="18" x2="15" y2="21" strokeWidth="1.2"/>
      {/* Star above */}
      <path d="M5 2 L5.7 4.3 L8 4.3 L6.2 5.7 L6.8 8 L5 6.6 L3.2 8 L3.8 5.7 L2 4.3 L4.3 4.3 Z" strokeWidth="1"/>
    </svg>
  ),
};

// Helper: render an icon by ID with color + size
function Icon({ id, size=24, color="currentColor", style={} }) {
  const fn = ICONS[id];
  if (!fn) return null;
  // For flame and cross we pass extra args
  if (id === "flame") return <span style={{color, display:"inline-flex", alignItems:"center", ...style}}>{ICONS.flame(size, true)}</span>;
  const el = fn(size);
  return <span style={{color, display:"inline-flex", alignItems:"center", flexShrink:0, ...style}}>{el}</span>;
}

function FlameIcon({lit, size=18}) {
  return ICONS.flame(size, lit);
}

// ─── App constants ────────────────────────────────────────────────────────────

// ─── Constants ────────────────────────────────────────────────────────────────
const APP_NAME = "My Prayer Book";

const PRAYER_TYPES = [
  { value: "confession",   label: "Confession & Repentance",        icon: "confession"   },
  { value: "forgiveness",  label: "Seeking Forgiveness",            icon: "forgiveness"  },
  { value: "deliverance",  label: "Deliverance from Sin",           icon: "deliverance"  },
  { value: "healing",      label: "Healing & Restoration",          icon: "healing"      },
  { value: "gratitude",    label: "Gratitude After Forgiveness",    icon: "gratitude"    },
  { value: "intercession", label: "Intercession for Another",       icon: "intercession" },
  { value: "praise",       label: "Praise & Worship",               icon: "praise"       },
];

const DEPTH_LEVELS = [
  { value: "brief",    label: "Brief",    words: "100–150 words", desc: "One breath before God." },
  { value: "standard", label: "Standard", words: "300–400 words", desc: "A full structured prayer." },
  { value: "deep",     label: "Deep",     words: "600–800 words", desc: "An immersive vigil prayer." },
];

const RELATED_SINS = {
  pride:["envy","arrogance","self-righteousness","vanity"],
  lust:["pornography","adultery","objectification","impurity"],
  anger:["bitterness","resentment","unforgiveness","violence"],
  envy:["covetousness","jealousy","discontentment","greed"],
  greed:["covetousness","stinginess","materialism","dishonesty"],
  sloth:["procrastination","apathy","spiritual laziness","neglect of prayer"],
  lie:["deceit","manipulation","false witness","gossip"],
  gossip:["slander","backbiting","tale-bearing","malice"],
  addiction:["substance abuse","compulsion","idolatry","escapism"],
  fear:["anxiety","unbelief","faithlessness","worry"],
  doubt:["unbelief","faithlessness","skepticism","wavering"],
  default:["ungratefulness","pride","selfishness","idolatry"],
};
function getRelated(o) {
  const lo = o.toLowerCase();
  for (const [k,v] of Object.entries(RELATED_SINS)) { if (k!=="default"&&lo.includes(k)) return v; }
  return RELATED_SINS.default;
}

const TABS = [
  { id:"Forge",   label:"Pray",    icon:"tab-pray"    },
  { id:"Journal", label:"Journal", icon:"tab-journal" },
  { id:"Verses",  label:"Verses",  icon:"tab-verses"  },
  { id:"Streak",  label:"Streak",  icon:"tab-streak"  },
  { id:"Notes",   label:"Notes",   icon:"tab-notes"   },
];

const VARIATION_SEEDS = ["morning mist","broken vessel","prodigal road","desert wilderness","refiner's fire","still waters","the potter's hand","valley of shadows"];
const DEPTH_COLORS = { brief:"#6b8a5a", standard:"#C9963A", deep:"#a04040" };

// ─── ElevenLabs Voice Map ────────────────────────────────────────────────────
const ELEVENLABS_VOICES = {
  // Pre-made voices — available on all ElevenLabs accounts
  male:   { id: "pNInz6obpgDQGcFmaJgB", name: "Adam"    }, // Warm, deep narrator
  female: { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel"  }, // Calm, expressive
  child:  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda" }, // Warm, gentle — ElevenLabs children's narration voice
};

// ─── Meal Prayers ─────────────────────────────────────────────────────────────
const MEAL_PRAYERS = [
  { id:"breakfast", label:"Breakfast", icon:"meal-breakfast", topic:"morning meal \u2014 gratitude for a new day, the gift of nourishment, and strength to walk in God's purposes", type:"gratitude", depth:"brief" },
  { id:"lunch",     label:"Lunch",     icon:"meal-lunch",      topic:"midday meal \u2014 thanksgiving for rest, provision, and God's presence through the busyness of the day", type:"gratitude", depth:"brief" },
  { id:"dinner",   label:"Dinner",    icon:"meal-dinner",     topic:"evening meal \u2014 gratitude for family, togetherness, God's faithful provision, and the day's blessings", type:"gratitude", depth:"brief" },
];

// ─── Devotional Quick Prayers ─────────────────────────────────────────────────
const DEVOTIONAL_PRAYERS = [
  {
    id:"morning", label:"Morning", icon:"devotional-morning", depth:"brief", type:"praise",
    topic:"morning devotion \u2014 surrendering the new day to God, seeking His guidance, strength, and presence for what lies ahead",
  },
  {
    id:"nighttime", label:"Nighttime", icon:"devotional-night", depth:"brief", type:"gratitude",
    topic:"evening devotion \u2014 reflecting on God's faithfulness through the day, seeking His peace, forgiveness for any shortcomings, and restful sleep under His watch",
  },
  {
    id:"kids-bed", label:"Kids' Bedtime", icon:"devotional-kids", depth:"brief", type:"gratitude",
    maxTokens:250,
    topic:"a sweet bedtime prayer for a child \u2014 thanking God for the day, family, and pets, asking for peaceful sleep and sweet dreams",
    systemOverride:"You are a warm Christian prayer writer for young children aged 4-10. STRICT RULES:\n1. Prayer MUST be 30-50 words. Count every word. Stop at 50. No exceptions.\n2. Rhyme gently if natural. Use only simple words.\n3. After the prayer, ONE Bible verse (reference + text) and ONE child-friendly sentence about it.\n4. Total response including verse must be under 85 words.\n5. No headers, labels, or extra text.",
  },
];

// ─── Storage ──────────────────────────────────────────────────────────────────
const load = (k,fb) => { try { const v=localStorage.getItem(k); return v?JSON.parse(v):fb; } catch { return fb; } };
const save = (k,v) => { try { localStorage.setItem(k,JSON.stringify(v)); } catch {} };
const getStoredStreak = () => {
  const last=load("mpb_last_prayed",null); const s=load("mpb_streak",0);
  if (!last) return 0;
  return Math.floor((new Date()-new Date(last))/86400000)>1?0:s;
};

// ─── Haptic feedback ──────────────────────────────────────────────────────────
const haptic = (type="light") => {
  try {
    if (navigator.vibrate) {
      const patterns = { light:30, medium:60, success:[30,50,30], error:[60,30,60] };
      navigator.vibrate(patterns[type]||30);
    }
  } catch {}
};

// ─── Native share ─────────────────────────────────────────────────────────────
async function nativeShare(title, text, url) {
  try {
    if (navigator.share) {
      await navigator.share({ title, text, url });
      return true;
    }
  } catch {}
  // Fallback: copy to clipboard
  try { await navigator.clipboard.writeText(url||text); return "copied"; } catch {}
  return false;
}

// ─── Parse API response ───────────────────────────────────────────────────────
function parseResponse(text) {
  const markers = ["Bible Verses","Scripture","Supporting Verses","Scriptures","Relevant Verses"];
  let prayerText=text, versesRaw="";
  for (const m of markers) { const i=text.indexOf(m); if(i!==-1){prayerText=text.slice(0,i).trim();versesRaw=text.slice(i).trim();break;} }
  const verses=[]; let cur=null;
  if (versesRaw) {
    for (const line of versesRaw.split("\n").filter(l=>l.trim())) {
      const rm=line.match(/^[\d\-\*•]+\.?\s*([1-3]?\s?[A-Z][a-zA-Z]+\s+\d+:\d+[\-\d]*)/);
      if(rm){if(cur)verses.push(cur);cur={ref:rm[1].trim(),text:"",context:""};const rest=line.slice(line.indexOf(rm[1])+rm[1].length).replace(/^[\s\-–—:]+/,"");if(rest)cur.text=rest;}
      else if(cur){if(!cur.text)cur.text=line.trim();else cur.context+=(cur.context?" ":"")+line.trim();}
    }
    if(cur)verses.push(cur);
  }
  return { prayerText, verses };
}

// ─── Build prompt ─────────────────────────────────────────────────────────────
function buildPrompt(offense,prayerType,depth,isVariation,seed) {
  const label=PRAYER_TYPES.find(p=>p.value===prayerType)?.label||prayerType;
  const dObj=DEPTH_LEVELS.find(d=>d.value===depth);
  const depthInstr={
    brief:`Write a SHORT concentrated prayer of ${dObj.words}. Single movement: address God, acknowledge briefly, one core petition, brief close. Only 2–3 Bible verses.`,
    standard:`Write a full structured prayer of ${dObj.words}: opening address, acknowledgment, scripture invocation, earnest petition, closing doxology. Provide 4–5 Bible verses.`,
    deep:`Write a deep multi-movement prayer of ${dObj.words}: (1) extended opening meditating on God's nature, (2) thorough confession, (3) multiple scriptures woven in, (4) sustained petition, (5) surrender, (6) solemn doxology. Provide 6–7 Bible verses with richer notes.`,
  };
  const extras=[
    isVariation?`VARIATION — do NOT reuse phrases/metaphors. Seed theme: "${seed}". Fresh language only.`:"",
    prayerType==="intercession"?"Frame as intercession: standing in the gap for another, lifting them before God.":"",
    prayerType==="praise"?"Frame as praise/adoration — celebrate God's nature in relation to this topic, not confession.":"",
  ].filter(Boolean).join(" ");
  return {
    system:`You are a compassionate Christian prayer writer grounded in Scripture. ${depthInstr[depth]} Write as if the person stands trembling before God. Be specific, never generic. Avoid clichés. Always illuminate grace. ${extras} After the prayer, write a section titled "Bible Verses" with full verse text, reference, and one sentence of spiritual context per verse.`,
    user:`Sin/Offense/Topic: ${offense}\nPrayer Type: ${label}\nDepth: ${dObj.label}${isVariation?`\nSeed: ${seed}`:""}`,
  };
}

// ─── Classical Music Tracks (public domain — Musopen / Internet Archive) ──────
const CLASSICAL_TRACKS = [
  {
    id: "gymnopedie",
    title: "Gymnopédie No. 1",
    composer: "Erik Satie",
    mood: "Peaceful",
    icon: "music-piano",
    // Musopen recording via Internet Archive — public domain performance
    url: "https://archive.org/download/MusopenCollectionAsFlac/Satie%2C%20Erik%20-%20Gymnop%C3%A9die%20No.%201.mp3",
    fallback: "https://freemusicarchive.org/file/music/WFMU/Kevin_MacLeod/Classical_Sampler/Kevin_MacLeod_-_Gymnopedie_No_1.mp3",
  },
  {
    id: "jesu",
    title: "Jesu, Joy of Man's Desiring",
    composer: "J.S. Bach",
    mood: "Devotional",
    icon: "music-staff",
    url: "https://archive.org/download/the-most-relaxing-classical-album-in-the-world...ever/01%20Bach%20Cantata%20%23147%20Jesu%20Joy%20Of%20Man%27s%20Desiring.mp3",
    fallback: "https://archive.org/download/MusopenCollectionAsFlac/Bach%2C%20Johann%20Sebastian%20-%20Jesu%2C%20Joy%20of%20Man%27s%20Desiring.mp3",
  },
  {
    id: "clair",
    title: "Clair de Lune",
    composer: "Claude Debussy",
    mood: "Contemplative",
    icon: "music-moon",
    url: "https://archive.org/download/the-most-relaxing-classical-album-in-the-world...ever/11%20Debussy%20Suite%20Bergamasque%20Clair%20De%20Lune.mp3",
    fallback: "https://archive.org/download/MusopenCollectionAsFlac/Debussy%2C%20Claude%20-%20Clair%20de%20lune.mp3",
  },
  {
    id: "in_paradisum",
    title: "In Paradisum",
    composer: "Gabriel Fauré",
    mood: "Heavenly",
    icon: "music-halo",
    url: "https://archive.org/download/the-most-relaxing-classical-album-in-the-world...ever/08%20Faure%20Requiem%20In%20Paradisum.mp3",
    fallback: "https://archive.org/download/MusopenCollectionAsFlac/Faure%2C%20Gabriel%20-%20In%20Paradisum.mp3",
  },
  {
    id: "swan",
    title: "The Swan",
    composer: "Camille Saint-Saëns",
    mood: "Graceful",
    icon: "music-dove",
    url: "https://archive.org/download/the-most-relaxing-classical-album-in-the-world...ever/08%20Saint-Sa%C3%ABns%20Carnival%20Of%20The%20Animals%20The%20Swan.mp3",
    fallback: "https://archive.org/download/MusopenCollectionAsFlac/Saint-Saens%2C%20Camille%20-%20The%20Swan.mp3",
  },
  {
    id: "goldberg",
    title: "Goldberg Variations — Aria",
    composer: "J.S. Bach",
    mood: "Meditative",
    icon: "music-note",
    url: "https://archive.org/download/MusopenCollectionAsFlac/Johann%20Sebastian%20Bach%20-%2002%20-%20Goldberg%20Variations%2C%20BWV.%20988%20-%20Aria.mp3",
    fallback: "https://archive.org/download/MusopenCollectionAsFlac/Bach%2C%20Johann%20Sebastian%20-%20Goldberg%20Variations%20Aria.mp3",
  },
  {
    id: "sorrowful",
    title: "Symphony of Sorrowful Songs — Lento",
    composer: "Henryk Górecki",
    mood: "Solemn",
    icon: "music-vigil",
    url: "https://archive.org/download/the-most-relaxing-classical-album-in-the-world...ever/09%20Gorecki%20Symphony%20%233%20Lento%20E%20Largo%20Tranquillissimo.mp3",
    fallback: null,
  },
  {
    id: "ave_maria",
    title: "Ave Maria",
    composer: "Franz Schubert",
    mood: "Devotional",
    icon: "music-halo",
    url: "https://archive.org/download/MusopenCollectionAsFlac/Schubert%2C%20Franz%20-%20Ave%20Maria.mp3",
    fallback: null,
  },
  {
    id: "moonlight",
    title: "Moonlight Sonata",
    composer: "Ludwig van Beethoven",
    mood: "Contemplative",
    icon: "music-moon",
    url: "https://archive.org/download/MusopenCollectionAsFlac/Beethoven%2C%20Ludwig%20van%20-%20Piano%20Sonata%20No.%2014%20in%20C%23-minor%20Quasi%20una%20fantasia%20-%201st%20movement.mp3",
    fallback: null,
  },
  {
    id: "pastoral",
    title: "Pastoral Symphony",
    composer: "Ludwig van Beethoven",
    mood: "Peaceful",
    icon: "music-piano",
    url: "https://archive.org/download/MusopenCollectionAsFlac/Beethoven%2C%20Ludwig%20van%20-%20Symphony%20No.%206%20in%20F%20Major%20Pastoral%20I.mp3",
    fallback: null,
  },
  {
    id: "nocturne",
    title: "Nocturne in E-flat Major",
    composer: "Frédéric Chopin",
    mood: "Meditative",
    icon: "music-note",
    url: "https://archive.org/download/MusopenCollectionAsFlac/Chopin%2C%20Fr%C3%A9d%C3%A9ric%20-%20Nocturne%20in%20E-flat%20major.mp3",
    fallback: null,
  },
  {
    id: "canon",
    title: "Canon in D",
    composer: "Johann Pachelbel",
    mood: "Graceful",
    icon: "music-dove",
    url: "https://archive.org/download/MusopenCollectionAsFlac/Pachelbel%2C%20Johann%20-%20Canon%20in%20D.mp3",
    fallback: null,
  },
  {
    id: "prelude",
    title: "Prelude in C Major",
    composer: "J.S. Bach",
    mood: "Peaceful",
    icon: "music-staff",
    url: "https://archive.org/download/MusopenCollectionAsFlac/Bach%2C%20Johann%20Sebastian%20-%20Prelude%20in%20C%20Major%20from%20The%20Well-Tempered%20Clavier.mp3",
    fallback: null,
  },
  {
    id: "andante",
    title: "Andante Cantabile",
    composer: "Pyotr Ilyich Tchaikovsky",
    mood: "Heavenly",
    icon: "music-halo",
    url: "https://archive.org/download/MusopenCollectionAsFlac/Tchaikovsky%2C%20Pyotr%20Ilyich%20-%20Andante%20Cantabile.mp3",
    fallback: null,
  },
  {
    id: "waldstein",
    title: "Waldstein Sonata - Adagio",
    composer: "Ludwig van Beethoven",
    mood: "Solemn",
    icon: "music-vigil",
    url: "https://archive.org/download/MusopenCollectionAsFlac/Beethoven%2C%20Ludwig%20van%20-%20Piano%20Sonata%20No.%2021%20in%20C%20major%20Waldstein%202nd%20movement.mp3",
    fallback: null,
  },
  {
    id: "massenet",
    title: "Méditation from Thaïs",
    composer: "Jules Massenet",
    mood: "Heavenly",
    icon: "music-moon",
    url: "https://archive.org/download/MusopenCollectionAsFlac/Massenet%2C%20Jules%20-%20M%C3%A9ditation%20from%20Tha%C3%AFs.mp3",
    fallback: null,
  },
  {
    id: "air_g",
    title: "Air on the G String",
    composer: "J.S. Bach",
    mood: "Graceful",
    icon: "music-note",
    url: "https://archive.org/download/MusopenCollectionAsFlac/Bach%2C%20Johann%20Sebastian%20-%20Air%20on%20the%20G%20String.mp3",
    fallback: null,
  },
];

// ─── Classical Music Player Hook ──────────────────────────────────────────────
function useClassicalPlayer() {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [loading, setLoading] = useState(false);
  const [volume, setVolumeState] = useState(0.45);
  const [showPicker, setShowPicker] = useState(false);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setPlaying(false);
    setLoading(false);
  }, []);

  const playTrack = useCallback((track) => {
    stop();
    setLoading(true);
    setCurrentTrack(track);
    haptic("light");

    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.volume = volume;
    audio.loop = true;
    audioRef.current = audio;

    const tryUrl = (url, isFallback) => {
      if (!url) { setLoading(false); return; }
      audio.src = url;
      audio.load();
      audio.play()
        .then(() => { setPlaying(true); setLoading(false); haptic("light"); })
        .catch(() => {
          if (!isFallback && track.fallback) {
            tryUrl(track.fallback, true);
          } else {
            setLoading(false);
            setCurrentTrack(t => t ? {...t, error: true} : null);
          }
        });
    };
    tryUrl(track.url, false);
  }, [stop, volume]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
      haptic("light");
    } else {
      audioRef.current.play().then(() => setPlaying(true)).catch(()=>{});
      haptic("light");
    }
  }, [playing]);

  const setVolume = useCallback((v) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { playing, currentTrack, loading, volume, showPicker, setShowPicker, playTrack, togglePlay, stop, setVolume };
}

// ─── Music Picker Modal ───────────────────────────────────────────────────────
function MusicPickerModal({ player, isDark, onClose }) {
  const bg = isDark ? "#1c0e05" : "#fdf5e4";
  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.85)";
  const cardBorder = isDark ? "rgba(201,150,58,0.15)" : "rgba(201,150,58,0.3)";
  const subtitleC = isDark ? "#a8906e" : "#8B6914";

  return (
    <div onClick={e => { if(e.target===e.currentTarget) onClose(); }}
      style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:1100,display:"flex",alignItems:"flex-end"}}>
      <div style={{width:"100%",maxHeight:"85vh",overflowY:"auto",background:bg,borderTopLeftRadius:"24px",borderTopRightRadius:"24px",WebkitOverflowScrolling:"touch",paddingBottom:"env(safe-area-inset-bottom,20px)"}}>
        {/* Handle */}
        <div style={{display:"flex",justifyContent:"center",padding:"12px 0 4px"}}>
          <div style={{width:"40px",height:"4px",background:"rgba(201,150,58,0.3)",borderRadius:"2px"}}/>
        </div>
        <div style={{padding:"8px 20px 24px"}}>
          {/* Header */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
            <div>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:"1rem",fontWeight:"700",color:"#C9963A",letterSpacing:"0.06em"}}>Prayer Music</div>
              <div style={{fontSize:"0.78rem",color:subtitleC,fontStyle:"italic",marginTop:"2px"}}>Public domain classical recordings</div>
            </div>
            {player.currentTrack && player.playing && (
              <button onClick={player.togglePlay}
                style={{background:"rgba(201,150,58,0.12)",border:"1px solid rgba(201,150,58,0.3)",borderRadius:"20px",padding:"6px 14px",color:"#C9963A",fontFamily:"'Cinzel',serif",fontSize:"0.68rem",letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",WebkitTapHighlightColor:"transparent",display:"flex",alignItems:"center",gap:"6px"}}>
                <Icon id="pause" size={12} color="#C9963A"/> Pause
              </button>
            )}
          </div>

          {/* Now playing bar */}
          {player.currentTrack && (
            <div style={{background:isDark?"rgba(201,150,58,0.08)":"rgba(201,150,58,0.06)",border:"1px solid rgba(201,150,58,0.2)",borderRadius:"12px",padding:"12px 16px",marginBottom:"14px",display:"flex",alignItems:"center",gap:"12px"}}>
              <Icon id={player.currentTrack.icon} size={22} color="#C9963A"/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"'Cinzel',serif",fontSize:"0.82rem",color:"#C9963A",fontWeight:"600",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{player.currentTrack.title}</div>
                <div style={{fontSize:"0.75rem",color:subtitleC}}>{player.currentTrack.composer}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:"6px",flexShrink:0}}>
                <Icon id="volume" size={14} color={subtitleC}/>
                <input type="range" min="0" max="1" step="0.05" value={player.volume}
                  onChange={e=>player.setVolume(parseFloat(e.target.value))}
                  style={{width:"64px",accentColor:"#C9963A"}}/>
              </div>
            </div>
          )}

          {/* Track list */}
          <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
            {CLASSICAL_TRACKS.map(t => {
              const isActive = player.currentTrack?.id === t.id;
              const isLoading = isActive && player.loading;
              return (
                <div key={t.id} onClick={() => { if(isActive && player.playing) { player.togglePlay(); } else { player.playTrack(t); } }}
                  style={{display:"flex",alignItems:"center",gap:"12px",padding:"13px 16px",background:isActive ? (isDark?"rgba(201,150,58,0.14)":"rgba(201,150,58,0.1)") : cardBg,border:`1px solid ${isActive?"#C9963A":cardBorder}`,borderRadius:"14px",cursor:"pointer",WebkitTapHighlightColor:"transparent",transition:"all 0.15s"}}>
                  <div style={{width:"40px",height:"40px",borderRadius:"50%",background:isActive?"rgba(201,150,58,0.2)":"rgba(201,150,58,0.06)",border:`1px solid ${isActive?"#C9963A":"rgba(201,150,58,0.15)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {isLoading ? <Icon id="loading" size={16} color="#C9963A"/> : <Icon id={t.icon} size={18} color={isActive?"#C9963A":"#a8906e"}/>}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:"'Cinzel',serif",fontSize:"0.84rem",color:isActive?"#C9963A":isDark?"#F5ECD7":"#2C1810",fontWeight:isActive?"600":"400",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.title}</div>
                    <div style={{fontSize:"0.72rem",color:subtitleC,marginTop:"2px"}}>{t.composer}</div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"3px",flexShrink:0}}>
                    <span style={{background:isDark?"rgba(201,150,58,0.08)":"rgba(201,150,58,0.08)",borderRadius:"8px",padding:"2px 8px",fontSize:"0.62rem",fontFamily:"'Cinzel',serif",letterSpacing:"0.06em",color:"#C9963A",textTransform:"uppercase"}}>{t.mood}</span>
                    {isActive && player.playing && <span style={{display:"flex",alignItems:"center",gap:"3px",fontSize:"0.65rem",color:"#C9963A"}}><Icon id="play" size={8} color="#C9963A"/> Playing</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Attribution */}
          <p style={{fontSize:"0.72rem",color:isDark?"#3a2810":"#c4a87a",fontStyle:"italic",textAlign:"center",marginTop:"16px",lineHeight:"1.5"}}>
            Public domain recordings via Musopen &amp; Internet Archive · Free to use
          </p>

          <button onClick={onClose}
            style={{width:"100%",marginTop:"8px",padding:"14px",background:"linear-gradient(135deg,#8B6914,#C9963A,#8B6914)",border:"none",borderRadius:"12px",color:"#1a0f07",fontFamily:"'Cinzel',serif",fontSize:"0.88rem",fontWeight:"700",letterSpacing:"0.16em",textTransform:"uppercase",cursor:"pointer",WebkitTapHighlightColor:"transparent"}}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TTS ──────────────────────────────────────────────────────────────────────
// ─── TTS (ElevenLabs primary, browser speech fallback) ───────────────────────────
// Lullaby playlist — CC BY-NC-SA 4.0 — "Lullaby and Goodnight" (Kazoomzoom / kzz017)
// Source: https://archive.org/details/kzz017
const LULLABY_TRACKS = [
  "https://archive.org/download/kzz017/lullaby_and_good_night_04_-_howie_mitchell_and_ruth_meyer_-_brahms_lullaby.mp3",
  "https://archive.org/download/kzz017/lullaby_and_good_night_10_-_possimiste_-_butterfly_lullaby.mp3",
  "https://archive.org/download/kzz017/lullaby_and_good_night_07_-_oskar_schuster_-_sneeuwland.mp3",
  "https://archive.org/download/kzz017/lullaby_and_good_night_13_-_john_stebbe_-_all_the_pretty_little_horses.mp3",
  "https://archive.org/download/kzz017/lullaby_and_good_night_01_-_montana_skies_-_soulstice_21.mp3",
  "https://archive.org/download/kzz017/lullaby_and_good_night_09_-_oskar_schuster_and_possimiste_-_stjernen.mp3",
];
const LULLABY_VOL = 0.28;

function useTTS(gender="female", lullabyEnabled=true) {
  const [speaking,setSpeaking]=useState(false);
  const audioRef=useRef(null);
  const lullabyRef=useRef(null);

  const _fadeLullaby=useCallback((targetVol,onDone)=>{
    const audio=lullabyRef.current;
    if(!audio)return;
    const step=targetVol>audio.volume?0.02:-0.02;
    const tid=setInterval(()=>{
      const next=audio.volume+step;
      if((step>0&&next>=targetVol)||(step<0&&next<=targetVol)){
        audio.volume=Math.max(0,targetVol);
        clearInterval(tid);
        if(onDone)onDone();
      } else {
        audio.volume=Math.max(0,Math.min(1,next));
      }
    },80);
  },[]);

  const _stopLullaby=useCallback(()=>{
    const audio=lullabyRef.current;
    if(!audio)return;
    _fadeLullaby(0,()=>{audio.pause();audio.currentTime=0;lullabyRef.current=null;});
  },[_fadeLullaby]);

  const _startLullaby=useCallback(()=>{
    if(lullabyRef.current)return;
    const audio=new Audio();
    audio.volume=0;
    audio.loop=true;
    lullabyRef.current=audio;
    // Pick a random track; if it fails, walk through the rest
    const shuffled=[...LULLABY_TRACKS].sort(()=>Math.random()-0.5);
    const tryTrack=(idx)=>{
      if(idx>=shuffled.length){console.warn("All lullaby tracks failed");lullabyRef.current=null;return;}
      audio.src=shuffled[idx];
      audio.load();
      audio.play()
        .then(()=>_fadeLullaby(LULLABY_VOL))
        .catch((e)=>{console.warn(`Lullaby track ${idx} failed:`,e.message);tryTrack(idx+1);});
    };
    tryTrack(0);
  },[_fadeLullaby]);

  const _hardStop=useCallback(()=>{
    if(audioRef.current){
      audioRef.current.pause();
      if(audioRef.current._url)URL.revokeObjectURL(audioRef.current._url);
      audioRef.current=null;
    }
    window.speechSynthesis?.cancel();
    _stopLullaby();
    setSpeaking(false);
  },[_stopLullaby]);

  const _browserSpeak=useCallback((text,isKids=false)=>{
    if(!("speechSynthesis" in window)){setSpeaking(false);return;}
    window.speechSynthesis.cancel();
    const utt=new SpeechSynthesisUtterance(text);
    utt.rate=isKids?0.72:0.82; utt.pitch=isKids?0.9:0.95; utt.volume=1;
    const voices=window.speechSynthesis.getVoices();
    const pick=voices.find(v=>/Daniel|Samantha|Karen|Moira|en-GB|en-AU/i.test(v.name+v.lang))||voices.find(v=>/en/i.test(v.lang));
    if(pick)utt.voice=pick;
    utt.onstart=()=>{setSpeaking(true);if(isKids)_startLullaby();};
    utt.onend=()=>{setSpeaking(false);_stopLullaby();};
    utt.onerror=()=>{setSpeaking(false);_stopLullaby();};
    window.speechSynthesis.speak(utt);
  },[_startLullaby,_stopLullaby]);

  const speak=useCallback(async(text,isKids=false)=>{
    if(speaking){_hardStop();return;}
    setSpeaking(true);
    haptic("light");
    if(isKids && lullabyEnabled) _startLullaby();
    const voiceKey=isKids?"child":gender;
    const voiceId=ELEVENLABS_VOICES[voiceKey]?.id;
    try{
      const base=(import.meta.env.VITE_API_BASE_URL||"").replace(/\/$/,"");
      const res=await fetch(`${base}/api/tts`,{
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({text,voiceId,isKids}),
      });
      if(!res.ok){_browserSpeak(text,isKids);return;}
      const blob=await res.blob();
      const url=URL.createObjectURL(blob);
      const audio=new Audio(url);
      audio._url=url;
      audioRef.current=audio;
      audio.onended=()=>{URL.revokeObjectURL(url);audioRef.current=null;setSpeaking(false);_stopLullaby();};
      audio.onerror=()=>{URL.revokeObjectURL(url);audioRef.current=null;setSpeaking(false);_stopLullaby();};
      await audio.play();
    }catch(e){
      console.error("TTS error:",e);
      _browserSpeak(text,isKids);
    }
  },[speaking,gender,_hardStop,_browserSpeak,_startLullaby,_stopLullaby]);

  const stop=useCallback(()=>_hardStop(),[_hardStop]);
  useEffect(()=>()=>_hardStop(),[_hardStop]);
  return {speaking,supported:true,speak,stop};
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function CrossSVG({size=44}) { return <Icon id="cross" size={size} />; }
function SpinnerSVG() {
  return <svg width="32" height="32" viewBox="0 0 40 40" fill="none" style={{animation:"spin 1.5s linear infinite"}}><circle cx="20" cy="20" r="16" stroke="rgba(201,150,58,0.2)" strokeWidth="3"/><path d="M20 4 A16 16 0 0 1 36 20" stroke="#C9963A" strokeWidth="3" strokeLinecap="round"/></svg>;
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function SectionDivider({children,c="#C9963A",lc="rgba(201,150,58,0.2)"}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:"10px",fontFamily:"'Cinzel',serif",fontSize:"0.72rem",letterSpacing:"0.14em",color:c,textTransform:"uppercase",marginBottom:"18px"}}>
      <span style={{flex:1,height:"1px",background:lc}}/>{children}<span style={{flex:1,height:"1px",background:lc}}/>
    </div>
  );
}

// Touch-optimized button — min 44px tall per Apple HIG / Material guidelines
function TapBtn({onClick,children,active,disabled,variant="ghost",fullWidth}) {
  const base={minHeight:"44px",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px",borderRadius:"10px",fontFamily:"'Cinzel',serif",fontSize:"0.72rem",letterSpacing:"0.1em",textTransform:"uppercase",cursor:disabled?"not-allowed":"pointer",border:"none",transition:"all 0.15s",padding:"10px 16px",WebkitTapHighlightColor:"transparent",userSelect:"none",width:fullWidth?"100%":undefined,boxSizing:"border-box"};
  const variants={
    ghost:{...base,background:active?"rgba(201,150,58,0.15)":"rgba(255,255,255,0.05)",border:`1px solid ${active?"#C9963A":"rgba(201,150,58,0.25)"}`,color:disabled?"rgba(201,150,58,0.3)":"#C9963A"},
    gold:{...base,background:"linear-gradient(135deg,#8B6914,#C9963A,#8B6914)",backgroundSize:"200%",color:"#1a0f07",fontWeight:"700",fontSize:"1rem",letterSpacing:"0.16em",boxShadow:"0 4px 20px rgba(201,150,58,0.35)",opacity:disabled?0.4:1},
    pill:{...base,background:active?"rgba(201,150,58,0.18)":"rgba(0,0,0,0.2)",border:`1px solid ${active?"#C9963A":"rgba(201,150,58,0.15)"}`,color:active?"#C9963A":"#a8906e",borderRadius:"20px",padding:"8px 16px",fontSize:"0.82rem",fontFamily:"'EB Garamond',serif",letterSpacing:"0.02em"},
  };
  return <button onClick={disabled?undefined:()=>{haptic("light");onClick&&onClick();}} style={variants[variant]||variants.ghost} disabled={disabled}>{children}</button>;
}

// ─── Prayer type selector — horizontal scroll chips ───────────────────────────
function PrayerTypeSelector({value,onChange,isDark}) {
  return (
    <div>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:"0.72rem",letterSpacing:"0.14em",color:isDark?"#C9963A":"#8B6914",textTransform:"uppercase",marginBottom:"10px"}}>Type of Prayer</div>
      <div style={{display:"flex",gap:"8px",overflowX:"auto",paddingBottom:"4px",WebkitOverflowScrolling:"touch",scrollbarWidth:"none",msOverflowStyle:"none"}}>
        {PRAYER_TYPES.map(p=>(
          <button key={p.value} onClick={()=>{haptic("light");onChange(p.value);}}
            style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:"4px",padding:"10px 14px",background:value===p.value?(isDark?"rgba(201,150,58,0.18)":"rgba(201,150,58,0.15)"):(isDark?"rgba(0,0,0,0.3)":"rgba(0,0,0,0.04)"),border:`1px solid ${value===p.value?"#C9963A":isDark?"rgba(201,150,58,0.15)":"rgba(139,105,20,0.2)"}`,borderRadius:"12px",cursor:"pointer",minWidth:"72px",WebkitTapHighlightColor:"transparent",transition:"all 0.15s"}}>
            <Icon id={p.icon} size={22} color={value===p.value?"#C9963A":isDark?"#6b5535":"#a8906e"}/>
            <span style={{fontFamily:"'Cinzel',serif",fontSize:"0.6rem",letterSpacing:"0.06em",color:value===p.value?"#C9963A":isDark?"#6b5535":"#a8906e",textTransform:"uppercase",textAlign:"center",lineHeight:"1.3"}}>{p.label.split(" ")[0]}</span>
          </button>
        ))}
      </div>
      {(value==="intercession"||value==="praise")&&(
        <p style={{fontSize:"0.82rem",color:isDark?"#6b5535":"#a8906e",fontStyle:"italic",margin:"8px 0 0",lineHeight:"1.4"}}>
          {value==="intercession"?"Describe the person's struggle — the prayer will stand in the gap on their behalf.":"Enter a theme or reason for praise. The prayer will celebrate God's nature in that context."}
        </p>
      )}
    </div>
  );
}

// ─── Depth selector ───────────────────────────────────────────────────────────
function DepthSelector({value,onChange,isDark}) {
  return (
    <div>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:"0.72rem",letterSpacing:"0.14em",color:isDark?"#C9963A":"#8B6914",textTransform:"uppercase",marginBottom:"10px"}}>Prayer Depth</div>
      <div style={{display:"flex",gap:"8px"}}>
        {DEPTH_LEVELS.map(d=>(
          <button key={d.value} onClick={()=>{haptic("light");onChange(d.value);}}
            style={{flex:1,padding:"12px 6px",background:value===d.value?(isDark?"rgba(201,150,58,0.14)":"rgba(201,150,58,0.1)"):(isDark?"rgba(0,0,0,0.25)":"rgba(0,0,0,0.04)"),border:`1px solid ${value===d.value?"#C9963A":isDark?"rgba(201,150,58,0.15)":"rgba(139,105,20,0.2)"}`,borderRadius:"10px",cursor:"pointer",textAlign:"center",minHeight:"60px",WebkitTapHighlightColor:"transparent",transition:"all 0.15s",boxSizing:"border-box"}}>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:"0.78rem",letterSpacing:"0.08em",color:value===d.value?"#C9963A":isDark?"#7a6040":"#a8906e",textTransform:"uppercase",marginBottom:"3px"}}>{d.label}</div>
            <div style={{fontSize:"0.66rem",color:isDark?"#4a3520":"#b0906e",lineHeight:"1.3"}}>{d.words}</div>
          </button>
        ))}
      </div>
      <p style={{fontSize:"0.8rem",color:isDark?"#6b5535":"#a8906e",fontStyle:"italic",margin:"8px 0 0"}}>{DEPTH_LEVELS.find(d=>d.value===value)?.desc}</p>
    </div>
  );
}

// ─── Related chips ────────────────────────────────────────────────────────────
function RelatedChips({offense,onSelect,isDark}) {
  return (
    <div style={{marginTop:"12px"}}>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:"0.64rem",letterSpacing:"0.1em",color:isDark?"#5a4525":"#a8906e",textTransform:"uppercase",marginBottom:"8px"}}>Related struggles</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
        {getRelated(offense).map(c=>(
          <TapBtn key={c} variant="pill" onClick={()=>onSelect(c)}>{c}</TapBtn>
        ))}
      </div>
    </div>
  );
}

// ─── Drop cap prayer text ─────────────────────────────────────────────────────
function PrayerWithDropCap({text,darkBg=false}) {
  if(!text) return null;
  const first=text.charAt(0); const rest=text.slice(1);
  const textC=darkBg?"#e8d5b0":"#2C1810"; const dropC=darkBg?"#C9963A":"#8B6914";
  return (
    <p style={{fontSize:"1.08rem",lineHeight:"2",color:textC,whiteSpace:"pre-wrap",fontStyle:"italic",margin:0,wordBreak:"break-word"}}>
      <span style={{float:"left",fontFamily:"'Cinzel',serif",fontSize:"3.8rem",lineHeight:"0.75",paddingRight:"6px",paddingTop:"5px",color:dropC,fontWeight:"700",fontStyle:"normal",animation:"pulseGlow 4s ease-in-out infinite"}}>{first}</span>
      {rest}
    </p>
  );
}

// ─── Flashcards ───────────────────────────────────────────────────────────────
function VerseFlashcards({allVerses,isDark}) {
  const [idx,setIdx]=useState(0);
  const [revealed,setRevealed]=useState(false);
  const [mastered,setMastered]=useState(()=>load("mpb_mastered",[]));
  const touchStart=useRef(null);

  const go=useCallback(dir=>{setIdx(i=>(i+dir+allVerses.length)%allVerses.length);setRevealed(false);haptic("light");},[allVerses.length]);

  // Swipe gesture
  const onTouchStart=e=>touchStart.current=e.touches[0].clientX;
  const onTouchEnd=e=>{
    if(touchStart.current===null)return;
    const dx=e.changedTouches[0].clientX-touchStart.current;
    if(Math.abs(dx)>50){go(dx<0?1:-1);}
    touchStart.current=null;
  };

  const cardBg=isDark?"linear-gradient(145deg,#271509,#1c0e05)":"linear-gradient(145deg,#fdf5e4,#f5e8cc)";
  const cardBorder=isDark?"rgba(201,150,58,0.22)":"rgba(201,150,58,0.3)";

  if(!allVerses.length) return (
    <div style={{background:cardBg,border:`1px solid ${cardBorder}`,borderRadius:"16px",padding:"32px",textAlign:"center"}}>
      <p style={{color:isDark?"#6b5535":"#a8906e",fontStyle:"italic",margin:0,fontSize:"1rem"}}>Save prayers to build your verse library.</p>
    </div>
  );

  const card=allVerses[idx]; const isMastered=mastered.includes(idx); const pct=Math.round(((idx+1)/allVerses.length)*100);
  const mark=()=>{haptic(isMastered?"light":"success");const n=isMastered?mastered.filter(m=>m!==idx):[...mastered,idx];setMastered(n);save("mpb_mastered",n);};

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}>
        <span style={{fontFamily:"'Cinzel',serif",fontSize:"0.68rem",letterSpacing:"0.1em",color:isDark?"#6b5535":"#a8906e",textTransform:"uppercase"}}>{idx+1} / {allVerses.length}</span>
        <span style={{fontFamily:"'Cinzel',serif",fontSize:"0.68rem",letterSpacing:"0.1em",color:"#C9963A",textTransform:"uppercase"}}>{mastered.length} mastered</span>
      </div>
      <div style={{height:"3px",background:"rgba(201,150,58,0.12)",borderRadius:"2px",marginBottom:"16px"}}>
        <div style={{height:"100%",width:`${pct}%`,background:"#C9963A",borderRadius:"2px",transition:"width 0.4s"}}/>
      </div>
      {/* Swipeable card */}
      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onClick={()=>{haptic("light");setRevealed(r=>!r);}}
        style={{background:"linear-gradient(160deg,#f5ecd7,#ede0c4)",border:"1px solid #C9963A",borderRadius:"16px",padding:"36px 28px",color:"#2C1810",textAlign:"center",minHeight:"200px",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",boxShadow:"0 8px 32px rgba(0,0,0,0.35)",cursor:"pointer",userSelect:"none",WebkitTapHighlightColor:"transparent",animation:"fadeInUp 0.4s ease forwards"}}>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:"0.82rem",letterSpacing:"0.12em",color:"#8B6914",textTransform:"uppercase",marginBottom:"14px"}}>{card.ref}</div>
        {revealed
          ?<div style={{fontSize:"1.08rem",lineHeight:"1.85",fontStyle:"italic",color:"#2C1810"}}>"{card.text}"</div>
          :<div style={{fontSize:"0.9rem",color:"#8B6914",fontFamily:"'Cinzel',serif",letterSpacing:"0.08em"}}>Tap to reveal</div>}
        {card.context&&revealed&&<div style={{fontSize:"0.78rem",color:"#a8906e",marginTop:"12px"}}>{card.context}</div>}
        <div style={{fontSize:"0.68rem",color:"#c4a87a",marginTop:"16px",fontFamily:"'Cinzel',serif"}}>Swipe to navigate</div>
      </div>
      <div style={{display:"flex",gap:"8px",justifyContent:"center",marginTop:"14px"}}>
        <TapBtn onClick={()=>go(-1)}><Icon id="vary" size={13} color="#C9963A" style={{transform:"scaleX(-1)"}}/> Prev</TapBtn>
        <TapBtn onClick={mark} active={isMastered}>
          <Icon id={isMastered?"mastered":"mark"} size={13} color="#C9963A"/>
          {isMastered?"Mastered":"Mark Mastered"}
        </TapBtn>
        <TapBtn onClick={()=>go(1)}>Next <Icon id="vary" size={13} color="#C9963A"/></TapBtn>
      </div>
    </div>
  );
}

// ─── Journal list ─────────────────────────────────────────────────────────────
function JournalTab({journal,onOpen,isDark}) {
  const cardBg=isDark?"linear-gradient(145deg,#271509,#1c0e05)":"linear-gradient(145deg,#fdf5e4,#f5e8cc)";
  const cardBorder=isDark?"rgba(201,150,58,0.22)":"rgba(201,150,58,0.3)";
  if(!journal.length) return <div style={{background:cardBg,border:`1px solid ${cardBorder}`,borderRadius:"16px",padding:"32px",textAlign:"center"}}><p style={{color:isDark?"#6b5535":"#a8906e",fontStyle:"italic",margin:0}}>No prayers saved yet. Generate a prayer and save it.</p></div>;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
      {[...journal].reverse().map((e,i)=>(
        <div key={i} onClick={()=>{haptic("light");onOpen(e);}}
          style={{background:isDark?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.8)",border:`1px solid ${isDark?"rgba(201,150,58,0.15)":"rgba(201,150,58,0.25)"}`,borderRadius:"14px",padding:"16px 18px",cursor:"pointer",WebkitTapHighlightColor:"transparent",activeOpacity:0.7}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px",flexWrap:"wrap"}}>
            <Icon id={PRAYER_TYPES.find(p=>p.label===e.type)?.icon||"confession"} size={16} color="#C9963A"/>
            <span style={{fontFamily:"'Cinzel',serif",fontSize:"0.68rem",letterSpacing:"0.1em",color:"#C9963A",textTransform:"uppercase"}}>{e.type}</span>
            {e.depth&&<span style={{background:"rgba(201,150,58,0.12)",borderRadius:"8px",padding:"1px 8px",fontSize:"0.6rem",fontFamily:"'Cinzel',serif",color:"#C9963A",textTransform:"uppercase"}}>{e.depth}</span>}
            <span style={{marginLeft:"auto",fontSize:"0.72rem",color:isDark?"#5a4525":"#a8906e",fontFamily:"'Cinzel',serif"}}>{new Date(e.date).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>
          </div>
          <div style={{fontSize:"0.78rem",color:isDark?"#7a6040":"#a8906e",fontFamily:"'Cinzel',serif",letterSpacing:"0.05em",marginBottom:"6px",textTransform:"uppercase"}}>{e.offense?.slice(0,50)}{e.offense?.length>50?"…":""}</div>
          <div style={{fontSize:"0.92rem",color:isDark?"#c4a87a":"#6b4e2a",fontStyle:"italic",lineHeight:"1.5",overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{e.prayerText}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Journal modal (bottom sheet style) ──────────────────────────────────────
function JournalModal({entry,onClose,tts,isDark}) {
  const sheetRef=useRef(null);
  const dragStart=useRef(null);
  if(!entry) return null;

  const onTouchStart=e=>dragStart.current=e.touches[0].clientY;
  const onTouchEnd=e=>{
    if(dragStart.current===null)return;
    const dy=e.changedTouches[0].clientY-dragStart.current;
    if(dy>80){haptic("light");onClose();}
    dragStart.current=null;
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"flex-end"}}
      onClick={e=>{if(e.target===e.currentTarget){haptic("light");onClose();}}}>
      <div ref={sheetRef} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
        style={{width:"100%",maxHeight:"90vh",overflowY:"auto",background:isDark?"#1c0e05":"#fdf5e4",borderTopLeftRadius:"24px",borderTopRightRadius:"24px",WebkitOverflowScrolling:"touch",paddingBottom:"env(safe-area-inset-bottom,20px)"}}>
        {/* Drag handle */}
        <div style={{display:"flex",justifyContent:"center",padding:"12px 0 0"}}>
          <div style={{width:"40px",height:"4px",background:"rgba(201,150,58,0.3)",borderRadius:"2px"}}/>
        </div>
        <div style={{padding:"16px 20px 32px"}}>
          {/* Prayer */}
          <div style={{background:"linear-gradient(160deg,#f5ecd7,#ede0c4)",border:"1px solid #C9963A",borderRadius:"16px",padding:"32px 24px",color:"#2C1810",position:"relative",marginBottom:"12px"}}>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:"0.85rem",letterSpacing:"0.15em",color:"#8B6914",textTransform:"uppercase",textAlign:"center",marginBottom:"6px"}}>{entry.type}</div>
            {entry.depth&&<div style={{fontFamily:"'Cinzel',serif",fontSize:"0.62rem",letterSpacing:"0.1em",color:"#a8906e",textTransform:"uppercase",textAlign:"center",marginBottom:"18px"}}>{entry.depth} · {new Date(entry.date).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</div>}
            <PrayerWithDropCap text={entry.prayerText} darkBg={false}/>
            {tts.supported&&(
              <div style={{display:"flex",justifyContent:"center",marginTop:"20px"}}>
                <TapBtn onClick={()=>tts.speak(entry.prayerText)} active={tts.speaking}>
                  <Icon id={tts.speaking?"stop":"read-aloud"} size={14} color="#C9963A"/>
                  {tts.speaking?"Stop Reading":"Read Aloud"}
                </TapBtn>
              </div>
            )}
          </div>
          {/* Verses */}
          {entry.verses?.length>0&&(
            <div style={{background:isDark?"rgba(0,0,0,0.3)":"rgba(255,255,255,0.6)",border:`1px solid ${isDark?"rgba(201,150,58,0.18)":"rgba(201,150,58,0.25)"}`,borderRadius:"16px",padding:"20px",marginBottom:"12px"}}>
              <SectionDivider>Scripture</SectionDivider>
              {entry.verses.map((v,i)=>(
                <div key={i} style={{borderLeft:"3px solid #C9963A",paddingLeft:"14px",marginBottom:"16px"}}>
                  <div style={{fontFamily:"'Cinzel',serif",fontSize:"0.72rem",letterSpacing:"0.1em",color:"#C9963A",marginBottom:"4px",textTransform:"uppercase"}}>{v.ref}</div>
                  <div style={{fontSize:"0.96rem",lineHeight:"1.7",color:isDark?"#e8d5b0":"#4a2e0a",fontStyle:"italic",marginBottom:"4px"}}>"{v.text}"</div>
                  {v.context&&<div style={{fontSize:"0.8rem",color:isDark?"#a8906e":"#8B6914",lineHeight:"1.4"}}>{v.context}</div>}
                </div>
              ))}
            </div>
          )}
          <TapBtn variant="gold" fullWidth onClick={()=>{haptic("light");onClose();}}>Close</TapBtn>
        </div>
      </div>
    </div>
  );
}

// ─── Streak tab ───────────────────────────────────────────────────────────────
function StreakTab({streak,journal,isDark}) {
  const days=["S","M","T","W","T","F","S"]; const today=new Date().getDay();
  const last7=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return journal.some(e=>new Date(e.date).toDateString()===d.toDateString());});
  const msg=streak===0?"Begin your journey. Pray today to start your streak.":streak===1?"A single candle lit. Return tomorrow to keep it burning.":streak<7?`${streak} days of faithfulness. Keep the flame alive.`:streak<30?"A week of devotion. God sees your perseverance.":"Thirty days before the Lord. You walk in steadfast grace.";
  const cardBg=isDark?"linear-gradient(145deg,#271509,#1c0e05)":"linear-gradient(145deg,#fdf5e4,#f5e8cc)";
  const cardBorder=isDark?"rgba(201,150,58,0.22)":"rgba(201,150,58,0.35)";
  return (
    <div style={{background:cardBg,border:`1px solid ${cardBorder}`,borderRadius:"16px",padding:"32px 24px"}}>
      <SectionDivider>Prayer Streak</SectionDivider>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:"5rem",fontWeight:"700",color:"#C9963A",textAlign:"center",lineHeight:1,textShadow:"0 0 60px rgba(201,150,58,0.4)"}}>{streak}</div>
      <div style={{fontFamily:"'Cinzel',serif",fontSize:"0.76rem",letterSpacing:"0.2em",color:"#a8906e",textAlign:"center",textTransform:"uppercase",marginTop:"8px",marginBottom:"24px"}}>Day{streak!==1?"s":""} in a Row</div>
      <div style={{display:"flex",justifyContent:"center",gap:"10px",marginBottom:"24px"}}>
        {last7.map((lit,i)=>(
          <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"4px"}}>
            <FlameIcon lit={lit}/>
            <span style={{fontFamily:"'Cinzel',serif",fontSize:"0.56rem",color:lit?"#C9963A":isDark?"#3a2810":"#c4a87a"}}>{days[(today-6+i+7)%7]}</span>
          </div>
        ))}
      </div>
      <p style={{color:isDark?"#6b5535":"#a8906e",fontStyle:"italic",fontSize:"0.95rem",textAlign:"center",margin:"0 0 28px"}}>{msg}</p>
      <SectionDivider>Your Numbers</SectionDivider>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
        {[{num:journal.length,label:"Prayers Forged"},{num:[...new Set(journal.map(e=>e.type))].length,label:"Prayer Types"},{num:journal.reduce((a,e)=>a+(e.verses?.length||0),0),label:"Verses Saved"},{num:journal.filter(e=>e.depth==="deep").length,label:"Deep Prayers"}].map((s,i)=>(
          <div key={i} style={{background:isDark?"rgba(0,0,0,0.2)":"rgba(255,255,255,0.5)",border:`1px solid ${isDark?"rgba(201,150,58,0.1)":"rgba(201,150,58,0.2)"}`,borderRadius:"12px",padding:"16px",textAlign:"center"}}>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:"2rem",color:"#C9963A",lineHeight:1}}>{s.num}</div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:"0.6rem",letterSpacing:"0.1em",color:isDark?"#6b5535":"#a8906e",textTransform:"uppercase",marginTop:"6px",lineHeight:"1.3"}}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Notes tab ────────────────────────────────────────────────────────────────
function NotesTab({ isDark }) {
  const [notes, setNotes] = useState(() => load("mpb_notes", []));
  const [composing, setComposing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const textareaRef = useRef(null);

  const cardBg = isDark ? "linear-gradient(145deg,#271509,#1c0e05)" : "linear-gradient(145deg,#fdf5e4,#f5e8cc)";
  const cardBorder = isDark ? "rgba(201,150,58,0.22)" : "rgba(201,150,58,0.3)";
  const inputBg = isDark ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.75)";
  const inputBorder = isDark ? "rgba(201,150,58,0.2)" : "rgba(139,105,20,0.25)";
  const textC = isDark ? "#F5ECD7" : "#2C1810";
  const subtitleC = isDark ? "#a8906e" : "#8B6914";
  const mutedC = isDark ? "#6b5535" : "#b0906e";

  const persistNotes = (updated) => { setNotes(updated); save("mpb_notes", updated); };

  const openNew = () => {
    setEditingId(null);
    setDraft("");
    setDraftTitle("");
    setComposing(true);
    haptic("light");
    setTimeout(() => textareaRef.current?.focus(), 80);
  };

  const openEdit = (note) => {
    setEditingId(note.id);
    setDraft(note.body);
    setDraftTitle(note.title);
    setComposing(true);
    haptic("light");
    setTimeout(() => textareaRef.current?.focus(), 80);
  };

  const saveNote = () => {
    if (!draft.trim()) { cancelCompose(); return; }
    haptic("success");
    if (editingId !== null) {
      persistNotes(notes.map(n => n.id === editingId
        ? { ...n, title: draftTitle.trim(), body: draft.trim(), updatedAt: new Date().toISOString() }
        : n));
    } else {
      const newNote = {
        id: Date.now(),
        title: draftTitle.trim(),
        body: draft.trim(),
        pinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      persistNotes([newNote, ...notes]);
    }
    cancelCompose();
  };

  const cancelCompose = () => {
    setComposing(false);
    setEditingId(null);
    setDraft("");
    setDraftTitle("");
    document.activeElement?.blur();
  };

  const deleteNote = (id) => {
    haptic("medium");
    persistNotes(notes.filter(n => n.id !== id));
    if (editingId === id) cancelCompose();
  };

  const togglePin = (id) => {
    haptic("light");
    persistNotes(notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
  };

  const sorted = [
    ...notes.filter(n => n.pinned),
    ...notes.filter(n => !n.pinned),
  ];

  const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div style={{ paddingBottom: "24px" }}>
      {/* Composer */}
      {composing ? (
        <div style={{ background: cardBg, border: `1px solid ${ isDark ? "#C9963A" : "#8B6914" }`, borderRadius: "16px", padding: "20px", marginBottom: "16px", animation: "fadeInUp 0.3s ease forwards" }}>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: "0.68rem", letterSpacing: "0.14em", color: "#C9963A", textTransform: "uppercase", marginBottom: "10px" }}>
            {editingId !== null ? "Edit Note" : "New Note"}
          </div>
          {/* Title */}
          <input
            value={draftTitle}
            onChange={e => setDraftTitle(e.target.value)}
            placeholder="Title (optional)…"
            style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: "8px", padding: "9px 12px", color: textC, fontFamily: "'Cinzel',serif", fontSize: "0.88rem", letterSpacing: "0.04em", marginBottom: "10px", boxSizing: "border-box" }}
          />
          {/* Body */}
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Write your reflection, intention, or thought…"
            rows={6}
            style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: "8px", padding: "12px", color: textC, fontFamily: "'EB Garamond',Georgia,serif", lineHeight: "1.7", resize: "none", boxSizing: "border-box", fontSize: "16px" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px", marginBottom: "14px" }}>
            <span style={{ fontSize: "0.72rem", color: mutedC, fontFamily: "'Cinzel',serif", letterSpacing: "0.06em" }}>
              {draft.length} characters
            </span>
            {editingId !== null && (
              <button onClick={() => deleteNote(editingId)}
                style={{ background: "none", border: "none", color: "#c07070", fontFamily: "'Cinzel',serif", fontSize: "0.68rem", letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
                Delete Note
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <TapBtn variant="ghost" onClick={cancelCompose} fullWidth={false}>Cancel</TapBtn>
            <TapBtn variant="gold" onClick={saveNote} fullWidth disabled={!draft.trim()}>
              <Icon id="save" size={14} color="#1a0f07" /> Save Note
            </TapBtn>
          </div>
        </div>
      ) : (
        <TapBtn variant="gold" fullWidth onClick={openNew}>
          <Icon id="vary" size={14} color="#1a0f07" /> New Note
        </TapBtn>
      )}

      {/* Empty state */}
      {!composing && sorted.length === 0 && (
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "36px 24px", textAlign: "center", marginTop: "16px" }}>
          <Icon id="tab-notes" size={36} color={mutedC} />
          <p style={{ color: subtitleC, fontStyle: "italic", margin: "14px 0 0", lineHeight: "1.6", fontSize: "0.95rem" }}>
            Your personal sanctuary for reflections,<br/>intentions &amp; spiritual notes.
          </p>
        </div>
      )}

      {/* Note cards */}
      {sorted.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: composing ? "0" : "14px" }}>
          {sorted.map(note => (
            <div key={note.id}
              style={{ background: note.pinned ? (isDark ? "rgba(201,150,58,0.07)" : "rgba(201,150,58,0.06)") : (isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.75)"), border: `1px solid ${note.pinned ? "#C9963A" : cardBorder}`, borderRadius: "14px", padding: "16px 18px", animation: "fadeInUp 0.35s ease forwards" }}>
              {/* Card header row */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "8px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {note.title ? (
                    <div style={{ fontFamily: "'Cinzel',serif", fontSize: "0.84rem", fontWeight: "600", color: "#C9963A", letterSpacing: "0.04em", marginBottom: "3px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                      {note.title}
                    </div>
                  ) : null}
                  <div style={{ fontSize: "0.68rem", color: mutedC, fontFamily: "'Cinzel',serif", letterSpacing: "0.06em" }}>
                    {fmtDate(note.updatedAt)}{note.pinned && <span style={{ marginLeft: "6px", color: "#C9963A" }}>· Pinned</span>}
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                  <button onClick={() => togglePin(note.id)}
                    title={note.pinned ? "Unpin" : "Pin"}
                    style={{ width: "32px", height: "32px", borderRadius: "50%", background: note.pinned ? "rgba(201,150,58,0.18)" : "transparent", border: `1px solid ${note.pinned ? "#C9963A" : "rgba(201,150,58,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
                    <svg width={13} height={13} viewBox="0 0 24 24" fill={note.pinned ? "#C9963A" : "none"} stroke="#C9963A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2 L15 9 L22 10 L17 15 L18 22 L12 19 L6 22 L7 15 L2 10 L9 9 Z"/>
                    </svg>
                  </button>
                  <button onClick={() => openEdit(note)}
                    title="Edit"
                    style={{ width: "32px", height: "32px", borderRadius: "50%", background: "transparent", border: "1px solid rgba(201,150,58,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
                    <Icon id="vary" size={13} color={subtitleC} />
                  </button>
                  <button onClick={() => deleteNote(note.id)}
                    title="Delete"
                    style={{ width: "32px", height: "32px", borderRadius: "50%", background: "transparent", border: "1px solid rgba(180,80,80,0.25)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#c07070" strokeWidth="2" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
              {/* Body preview */}
              <div style={{ fontSize: "0.95rem", color: isDark ? "#c4a87a" : "#5a3a1a", fontStyle: "italic", lineHeight: "1.6", whiteSpace: "pre-wrap", wordBreak: "break-word", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical" }}>
                {note.body}
              </div>
              {note.body.length > 220 && (
                <button onClick={() => openEdit(note)}
                  style={{ background: "none", border: "none", color: subtitleC, fontFamily: "'Cinzel',serif", fontSize: "0.64rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", marginTop: "6px", padding: 0, WebkitTapHighlightColor: "transparent" }}>
                  Read more…
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Print styles ─────────────────────────────────────────────────────────────
const PRINT_CSS=`@media print{body{background:white!important;color:#1a0a00!important;}.no-print{display:none!important;}.print-prayer{background:white!important;border:1px solid #C9963A!important;box-shadow:none!important;page-break-inside:avoid;padding:24px!important;color:#1a0a00!important;border-radius:0!important;}.print-verses{background:white!important;border:1px solid #ddd!important;page-break-inside:avoid;padding:20px!important;margin-top:16px!important;border-radius:0!important;}@page{margin:0.65in;}}`;

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function MyPrayerBook() {
  const [tab,setTab]=useState("Forge");
  const [offense,setOffense]=useState("");
  const [prayerType,setPrayerType]=useState("confession");
  const depth="standard";
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState(null);
  const [error,setError]=useState("");
  const [saved,setSaved]=useState(false);
  const [shared,setShared]=useState(false);
  const [copied,setCopied]=useState(false);
  const [variationCount,setVariationCount]=useState(0);
  const [journal,setJournal]=useState(()=>load("mpb_journal",[]));
  const [streak,setStreak]=useState(()=>getStoredStreak());
  const [modalEntry,setModalEntry]=useState(null);
  const [isDark,setIsDark]=useState(true);
  const textareaRef=useRef(null);
  const resultRef=useRef(null);
  const music=useClassicalPlayer();
  const [ttsGender,setTtsGender]=useState(()=>load("mpb_tts_gender","female"));
  const [isKidsPrayer,setIsKidsPrayer]=useState(false);
  const [lullabyOn,setLullabyOn]=useState(()=>load("mpb_lullaby_on",true));
  const [resultDepth,setResultDepth]=useState("standard"); // tracks depth of current result
  const tts=useTTS(ttsGender,lullabyOn);
  const allVerses=journal.flatMap(e=>e.verses||[]);
  const maxTokens=depth==="brief"?600:depth==="deep"?2000:1200;

  // Scroll to result on mobile
  useEffect(()=>{
    if(result&&resultRef.current){
      setTimeout(()=>resultRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),100);
    }
  },[result]);

  // Dismiss keyboard when switching tabs
  const switchTab=t=>{
    haptic("light");
    document.activeElement?.blur();
    setTab(t);
  };

  const recordPrayer=useCallback(()=>{
    const last=load("mpb_last_prayed",null);const cur=load("mpb_streak",0);const now=new Date();
    let next=cur;
    if(!last)next=1;
    else{const diff=Math.floor((now-new Date(last))/86400000);next=diff===0?cur:diff===1?cur+1:1;}
    save("mpb_last_prayed",now.toString());save("mpb_streak",next);setStreak(next);
  },[]);

  const quickPray=useCallback(async(entry)=>{
    document.activeElement?.blur();
    setLoading(true);setError("");setResult(null);setSaved(false);setVariationCount(0);
    haptic("medium");
    let system, user;
    if(entry.systemOverride){
      system=entry.systemOverride;
      const kidsSeed=VARIATION_SEEDS[Math.floor(Math.random()*VARIATION_SEEDS.length)];
      user=`Topic: ${entry.topic}\nVariation theme: ${kidsSeed} — use this as inspiration for fresh imagery. Do NOT repeat previous prayers.`;
    } else {
      const qSeed=VARIATION_SEEDS[Math.floor(Math.random()*VARIATION_SEEDS.length)];
      ({system,user}=buildPrompt(entry.topic, entry.type||"gratitude", entry.depth||"brief", true, qSeed));
    }
    try{
      const base=(import.meta.env.VITE_API_BASE_URL||"").replace(/\/$/,"");
      const res=await fetch(`${base}/api/pray`,{
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({system,user,maxTokens:entry.maxTokens||600}),
      });
      if(!res.ok){
        const errText = await res.text();
        let errMsg = `Server error: ${res.status}`;
        try { errMsg = JSON.parse(errText).error || errMsg; } catch(e) {}
        throw new Error(errMsg);
      }
      const data=await res.json();
      const text=data.text||"";
      if(!text)throw new Error("Empty response from server");
      setIsKidsPrayer(entry.id==="kids-bed");
      setResultDepth(entry.depth||"brief");
    setOffense(entry.topic);
      setPrayerType(entry.type||"gratitude");
      setResult(parseResponse(text));
      recordPrayer();
      haptic("success");
    }catch(e){console.error("Quick prayer error:",e);setError(e.message||"Something went wrong. Please try again.");haptic("error");}
    finally{setLoading(false);}
  },[recordPrayer]);

  const callAPI=async(isVariation=false)=>{
    if(!offense.trim())return;
    document.activeElement?.blur();
    setLoading(true);setError("");
    if(!isVariation){setResult(null);setSaved(false);setVariationCount(0);}
    haptic("medium");
    const effectiveDepth = isVariation ? resultDepth : depth;
    const seed=VARIATION_SEEDS[(variationCount+(isVariation?1:0))%VARIATION_SEEDS.length];
    const {system,user}=buildPrompt(offense,prayerType,effectiveDepth,isVariation,seed);
    const effectiveMaxTokens = isVariation
      ? (effectiveDepth==="brief"?600:effectiveDepth==="deep"?2000:1200)
      : maxTokens;
    try{
      const base=(import.meta.env.VITE_API_BASE_URL||"").replace(/\/$/,"");
      const res=await fetch(`${base}/api/pray`,{
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({system,user,maxTokens:effectiveMaxTokens}),
      });
      if(!res.ok){
        const errText = await res.text();
        let errMsg = `Server error: ${res.status}`;
        try { errMsg = JSON.parse(errText).error || errMsg; } catch(e) {}
        throw new Error(errMsg);
      }
      const data=await res.json();
      const text=data.text||"";
      if(!text)throw new Error("Empty response from server");
      if(!isVariation) setResultDepth(depth);
      setResult(parseResponse(text));
      if(isVariation)setVariationCount(v=>v+1);
      recordPrayer();
      haptic("success");
    }catch(e){console.error("Prayer generation error:",e);setError(e.message||"Something went wrong. Please try again.");haptic("error");}
    finally{setLoading(false);}
  };

  const saveToJournal=()=>{
    if(!result||saved)return;
    haptic("success");
    const label=PRAYER_TYPES.find(p=>p.value===prayerType)?.label||prayerType;
    const entry={...result,offense,type:label,depth,date:new Date().toISOString()};
    const updated=[...journal,entry];setJournal(updated);save("mpb_journal",updated);setSaved(true);
  };

  const sharePrayer=async()=>{
    if(!result)return;
    try{
      const shareText=`${result.prayerText}\n\n— Shared from My Prayer Book`;
      const res=await nativeShare("My Prayer Book",shareText,window.location.href);
      if(res==="copied"){setShared(true);setTimeout(()=>setShared(false),2000);}
      haptic("light");
    }catch{}
  };

  const copyPrayer=()=>{
    if(result?.prayerText){navigator.clipboard.writeText(result.prayerText);setCopied(true);haptic("light");setTimeout(()=>setCopied(false),2000);}
  };

  // Theme tokens
  const bg=isDark?"#130b04":"#faf3e0";
  const textC=isDark?"#F5ECD7":"#2C1810";
  const subtitleC=isDark?"#a8906e":"#8B6914";
  const cardBg=isDark?"linear-gradient(145deg,#271509,#1c0e05)":"linear-gradient(145deg,#fdf5e4,#f5e8cc)";
  const cardBorder=isDark?"rgba(201,150,58,0.22)":"rgba(201,150,58,0.3)";
  const inputBg=isDark?"rgba(0,0,0,0.35)":"rgba(255,255,255,0.75)";
  const inputBorder=isDark?"rgba(201,150,58,0.2)":"rgba(139,105,20,0.25)";
  const verseCardBg=isDark?"rgba(0,0,0,0.3)":"rgba(255,255,255,0.6)";
  const verseBorder=isDark?"rgba(201,150,58,0.18)":"rgba(201,150,58,0.25)";
  const verseTextC=isDark?"#e8d5b0":"#4a2e0a";

  const NAV_H=60;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap');
        *{box-sizing:border-box;-webkit-font-smoothing:antialiased;}
        body{margin:0;overscroll-behavior:none;}
        html,body{height:100%;}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
        @keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
        @keyframes pulseGlow{0%,100%{opacity:1;}50%{opacity:0.75;}}
        textarea:focus,select:focus{outline:none;border-color:rgba(201,150,58,0.6)!important;}
        textarea{-webkit-appearance:none;font-size:16px!important;} /* prevent iOS zoom */
        select{-webkit-appearance:none;font-size:16px!important;}
        input{font-size:16px!important;}
        ::-webkit-scrollbar{display:none;}
        .scroll-hide{scrollbar-width:none;-ms-overflow-style:none;}
        .tab-content{overflow-y:auto;-webkit-overflow-scrolling:touch;}
        button{-webkit-tap-highlight-color:transparent;touch-action:manipulation;}
        ${PRINT_CSS}
      `}</style>

      <JournalModal entry={modalEntry} onClose={()=>{setModalEntry(null);tts.stop();}} tts={tts} isDark={isDark}/>
      {music.showPicker && <MusicPickerModal player={music} isDark={isDark} onClose={()=>music.setShowPicker(false)}/>}

      {/* Root — full screen, account for safe areas */}
      <div style={{height:"100dvh",display:"flex",flexDirection:"column",background:bg,color:textC,fontFamily:"'EB Garamond',Georgia,serif",overflow:"hidden",transition:"background 0.3s"}}>

        {/* ── TOP BAR ── */}
        <div className="no-print" style={{flexShrink:0,padding:"env(safe-area-inset-top,12px) 16px 0",background:isDark?"rgba(19,11,4,0.95)":"rgba(250,243,224,0.95)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",borderBottom:`1px solid ${isDark?"rgba(201,150,58,0.1)":"rgba(139,105,20,0.15)"}`,zIndex:10}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0 10px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
              <CrossSVG size={28}/>
              <div>
                <div style={{fontFamily:"'Cinzel',serif",fontSize:"1.05rem",fontWeight:"700",color:"#C9963A",letterSpacing:"0.06em",lineHeight:1}}>{APP_NAME}</div>
                <div style={{fontSize:"0.72rem",color:subtitleC,fontStyle:"italic",lineHeight:1.3}}>Come before God with a sincere heart</div>
              </div>
            </div>
            <div style={{display:"flex",gap:"6px"}}>
              {streak>0&&(
                <div style={{display:"flex",alignItems:"center",gap:"5px",background:"rgba(201,150,58,0.08)",border:"1px solid rgba(201,150,58,0.2)",borderRadius:"20px",padding:"5px 10px"}}>
                  <FlameIcon lit={true} size={14}/>
                  <span style={{fontFamily:"'Cinzel',serif",fontSize:"0.65rem",letterSpacing:"0.08em",color:"#C9963A",textTransform:"uppercase"}}>{streak}</span>
                </div>
              )}
              <button onClick={()=>{haptic("light");music.setShowPicker(true);}} style={{width:"36px",height:"36px",borderRadius:"50%",background:music.playing?"rgba(201,150,58,0.15)":"rgba(255,255,255,0.05)",border:`1px solid ${music.playing?"#C9963A":"rgba(201,150,58,0.2)"}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",WebkitTapHighlightColor:"transparent"}} title="Prayer Music">
                <Icon id={music.loading?"loading":music.playing?"music-on":"music-off"} size={18} color={music.playing?"#C9963A":"#6b5535"}/>
              </button>
              <button onClick={()=>{haptic("light");const n=ttsGender==="male"?"female":"male";setTtsGender(n);save("mpb_tts_gender",n);}} style={{width:"36px",height:"36px",borderRadius:"50%",background:"rgba(255,255,255,0.05)",border:`1px solid rgba(201,150,58,0.2)`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",WebkitTapHighlightColor:"transparent"}} title={`Voice: ${ttsGender}`}>
                <Icon id={ttsGender==="male"?"voice-male":"voice-female"} size={18} color="#6b5535"/>
              </button>
              <button onClick={()=>{haptic("light");const n=!lullabyOn;setLullabyOn(n);save("mpb_lullaby_on",n);}} style={{width:"36px",height:"36px",borderRadius:"50%",background:lullabyOn?"rgba(201,150,58,0.15)":"rgba(255,255,255,0.05)",border:`1px solid ${lullabyOn?"#C9963A":"rgba(201,150,58,0.2)"}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",WebkitTapHighlightColor:"transparent"}} title={lullabyOn?"Lullaby: On (kids prayer)":"Lullaby: Off"}>
                <Icon id="lullaby-on" size={18} color={lullabyOn?"#C9963A":"#6b5535"}/>
              </button>
              <button onClick={()=>{haptic("light");setIsDark(d=>!d);}} style={{width:"36px",height:"36px",borderRadius:"50%",background:"rgba(255,255,255,0.05)",border:`1px solid rgba(201,150,58,0.2)`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",WebkitTapHighlightColor:"transparent"}}>
                <Icon id={isDark?"light-mode":"dark-mode"} size={18} color="#6b5535"/>
              </button>
            </div>
          </div>
        </div>

        {/* ── SCROLLABLE CONTENT ── */}
        <div className="tab-content scroll-hide" style={{flex:1,overflowY:"auto",padding:"16px 16px 0"}}>

          {/* FORGE */}
          {tab==="Forge"&&(
            <div style={{paddingBottom:"24px"}}>
              {/* ── Meal grace quick-buttons ── */}
              <div style={{background:cardBg,border:`1px solid ${cardBorder}`,borderRadius:"16px",padding:"16px 20px",marginBottom:"12px"}}>
                <div style={{fontFamily:"'Cinzel',serif",fontSize:"0.68rem",letterSpacing:"0.14em",color:isDark?"#C9963A":"#8B6914",textTransform:"uppercase",marginBottom:"12px",display:"flex",alignItems:"center",gap:"8px"}}>
                  <Icon id="gratitude" size={13} color="#C9963A"/> Grace Before Meals
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}>
                  {MEAL_PRAYERS.map(m=>(
                    <button key={m.id} onClick={()=>quickPray(m)} disabled={loading}
                      style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"7px",padding:"14px 6px",background:isDark?"rgba(0,0,0,0.3)":"rgba(255,255,255,0.6)",border:`1px solid ${isDark?"rgba(201,150,58,0.15)":"rgba(139,105,20,0.2)"}`,borderRadius:"12px",cursor:loading?"not-allowed":"pointer",WebkitTapHighlightColor:"transparent",transition:"all 0.15s",opacity:loading?0.45:1}}>
                      <Icon id={m.icon} size={26} color="#C9963A"/>
                      <span style={{fontFamily:"'Cinzel',serif",fontSize:"0.62rem",letterSpacing:"0.08em",color:"#C9963A",textTransform:"uppercase"}}>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Devotional quick-buttons ── */}
              <div style={{background:cardBg,border:`1px solid ${cardBorder}`,borderRadius:"16px",padding:"16px 20px",marginBottom:"12px"}}>
                <div style={{fontFamily:"'Cinzel',serif",fontSize:"0.68rem",letterSpacing:"0.14em",color:isDark?"#C9963A":"#8B6914",textTransform:"uppercase",marginBottom:"12px",display:"flex",alignItems:"center",gap:"8px"}}>
                  <Icon id="tab-pray" size={13} color="#C9963A"/> Daily Devotionals
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}>
                  {DEVOTIONAL_PRAYERS.map(d=>(
                    <button key={d.id} onClick={()=>quickPray(d)} disabled={loading}
                      style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"7px",padding:"14px 6px",background:isDark?"rgba(0,0,0,0.3)":"rgba(255,255,255,0.6)",border:`1px solid ${isDark?"rgba(201,150,58,0.15)":"rgba(139,105,20,0.2)"}`,borderRadius:"12px",cursor:loading?"not-allowed":"pointer",WebkitTapHighlightColor:"transparent",transition:"all 0.15s",opacity:loading?0.45:1}}>
                      <Icon id={d.icon} size={26} color="#C9963A"/>
                      <span style={{fontFamily:"'Cinzel',serif",fontSize:"0.58rem",letterSpacing:"0.06em",color:"#C9963A",textTransform:"uppercase",textAlign:"center",lineHeight:"1.3"}}>{d.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Input card */}
              <div style={{background:cardBg,border:`1px solid ${cardBorder}`,borderRadius:"16px",padding:"20px",marginBottom:"12px"}}>
                <div style={{fontFamily:"'Cinzel',serif",fontSize:"0.72rem",letterSpacing:"0.14em",color:isDark?"#C9963A":"#8B6914",textTransform:"uppercase",marginBottom:"10px"}}>What's on your heart?</div>
                <textarea ref={textareaRef}
                  style={{width:"100%",minHeight:"90px",background:inputBg,border:`1px solid ${inputBorder}`,borderRadius:"10px",padding:"12px",color:textC,fontFamily:"'EB Garamond',Georgia,serif",lineHeight:"1.6",resize:"none",boxSizing:"border-box",fontSize:"16px"}}
                  value={offense} onChange={e=>setOffense(e.target.value)}
                  placeholder="Share anything — a burden, a sin, a need for healing, a person to pray for, gratitude, or simply a desire to draw closer to God…" rows={3}/>
                <p style={{fontFamily:"'EB Garamond',Georgia,serif",fontSize:"0.78rem",color:isDark?"rgba(201,150,58,0.55)":"rgba(139,105,20,0.6)",lineHeight:"1.5",marginTop:"10px",marginBottom:0,fontStyle:"italic"}}>
                  You can share anything — a sin or struggle, a grateful heart, a request for healing or provision, someone you're interceding for, a scripture weighing on you, or simply a longing to draw near to God.
                </p>
              </div>

              {/* Type selector */}
              <div style={{background:cardBg,border:`1px solid ${cardBorder}`,borderRadius:"16px",padding:"20px",marginBottom:"12px"}}>
                <PrayerTypeSelector value={prayerType} onChange={setPrayerType} isDark={isDark}/>
              </div>


              {/* Generate */}
              <TapBtn variant="gold" fullWidth onClick={()=>callAPI(false)} disabled={loading||!offense.trim()}>
                {loading?<><SpinnerSVG/><span>Composing…</span></>:<><Icon id="tab-pray" size={16} color="#1a0f07"/> Generate Prayer</>}
              </TapBtn>

              {error&&<div style={{background:"rgba(180,40,40,0.12)",border:"1px solid rgba(180,40,40,0.25)",borderRadius:"10px",padding:"12px 16px",color:"#e8a0a0",fontSize:"0.95rem",fontStyle:"italic",marginTop:"12px"}}>{error}</div>}

              {loading&&(
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"14px",padding:"36px 0",color:subtitleC,fontStyle:"italic",fontSize:"0.95rem"}}>
                  <SpinnerSVG/>
                  <span>{depth==="deep"?"Entering deep prayer… this may take a moment.":"Crafting your prayer from Scripture…"}</span>
                </div>
              )}

              {result&&!loading&&(
                <div ref={resultRef} style={{marginTop:"16px",animation:"fadeInUp 0.5s ease forwards"}}>
                  {/* Prayer card */}
                  <div className="print-prayer" style={{background:"linear-gradient(160deg,#f5ecd7,#ede0c4)",border:"1px solid #C9963A",borderRadius:"16px",padding:"28px 22px",color:"#2C1810",boxShadow:"0 8px 40px rgba(0,0,0,0.4)",marginBottom:"12px",position:"relative"}}>
                    <span style={{position:"absolute",top:"12px",left:"16px",opacity:0.45}}><Icon id="ornament" size={14} color="#C9963A"/></span>
                    <span style={{position:"absolute",top:"12px",right:"16px",opacity:0.45}}><Icon id="ornament" size={14} color="#C9963A"/></span>
                    <div style={{textAlign:"center",marginBottom:"22px"}}>
                      <div style={{fontFamily:"'Cinzel',serif",fontSize:"0.8rem",letterSpacing:"0.15em",color:"#8B6914",textTransform:"uppercase",marginBottom:"8px",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px"}}>
                        <Icon id={PRAYER_TYPES.find(p=>p.value===prayerType)?.icon||"confession"} size={14} color="#8B6914"/>
                        A Prayer of {PRAYER_TYPES.find(p=>p.value===prayerType)?.label}
                      </div>
                      <span style={{background:DEPTH_COLORS[depth],borderRadius:"8px",padding:"2px 10px",fontSize:"0.62rem",fontFamily:"'Cinzel',serif",letterSpacing:"0.1em",color:"#fff",textTransform:"uppercase"}}>
                        {DEPTH_LEVELS.find(d=>d.value===depth)?.label}
                      </span>
                      {variationCount>0&&<span style={{marginLeft:"6px",background:"rgba(80,60,120,0.4)",borderRadius:"8px",padding:"2px 10px",fontSize:"0.62rem",fontFamily:"'Cinzel',serif",letterSpacing:"0.1em",color:"#c8b8e8",textTransform:"uppercase"}}>Var. {variationCount}</span>}
                    </div>
                    <PrayerWithDropCap text={result.prayerText} darkBg={false}/>

                    {/* Action row — 2×3 grid on mobile */}
                    <div className="no-print" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginTop:"22px"}}>
                      {tts.supported&&<TapBtn onClick={()=>tts.speak(result.prayerText,isKidsPrayer)} active={tts.speaking}><Icon id={tts.speaking?"stop":"read-aloud"} size={14} color="#C9963A"/>{tts.speaking?"Stop":"Listen"}</TapBtn>}
                      <TapBtn onClick={copyPrayer}><Icon id={copied?"check":"copy"} size={14} color="#C9963A"/>{copied?"Copied":"Copy"}</TapBtn>
                      <TapBtn onClick={sharePrayer}><Icon id={shared?"check":"share"} size={14} color="#C9963A"/>{shared?"Shared":"Share"}</TapBtn>
                      <TapBtn onClick={()=>window.print()}><Icon id="print" size={14} color="#C9963A"/>Print</TapBtn>
                      <TapBtn onClick={()=>{if(isKidsPrayer){const ke=DEVOTIONAL_PRAYERS.find(d=>d.id==="kids-bed");if(ke)quickPray(ke);}else{callAPI(true);}}} disabled={loading}><Icon id="vary" size={14} color="#C9963A"/>Vary</TapBtn>
                      <TapBtn onClick={saveToJournal} active={saved}><Icon id={saved?"saved":"save"} size={14} color="#C9963A"/>{saved?"Saved":"Save"}</TapBtn>
                    </div>
                  </div>

                  {/* Verses */}
                  {result.verses?.length>0&&(
                    <div className="print-verses" style={{background:verseCardBg,border:`1px solid ${verseBorder}`,borderRadius:"16px",padding:"20px",marginBottom:"12px"}}>
                      <SectionDivider c={isDark?"#C9963A":"#8B6914"} lc={isDark?"rgba(201,150,58,0.2)":"rgba(139,105,20,0.25)"}>Scripture & Meditation</SectionDivider>
                      {result.verses.map((v,i)=>(
                        <div key={i} style={{borderLeft:"3px solid #C9963A",paddingLeft:"14px",marginBottom:"18px"}}>
                          <div style={{fontFamily:"'Cinzel',serif",fontSize:"0.72rem",letterSpacing:"0.1em",color:"#C9963A",marginBottom:"4px",textTransform:"uppercase"}}>{v.ref}</div>
                          <div style={{fontSize:"0.98rem",lineHeight:"1.7",color:verseTextC,fontStyle:"italic",marginBottom:"4px"}}>"{v.text}"</div>
                          {v.context&&<div style={{fontSize:"0.8rem",color:subtitleC,lineHeight:"1.4"}}>{v.context}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* JOURNAL */}
          {tab==="Journal"&&(
            <div style={{paddingBottom:"24px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
                <span style={{fontFamily:"'Cinzel',serif",fontSize:"0.7rem",letterSpacing:"0.1em",color:isDark?"#5a4525":"#a8906e",textTransform:"uppercase"}}>{journal.length} {journal.length===1?"entry":"entries"}</span>
              </div>
              <JournalTab journal={journal} onOpen={setModalEntry} isDark={isDark}/>
            </div>
          )}

          {/* VERSES */}
          {tab==="Verses"&&(
            <div style={{paddingBottom:"24px"}}>
              <p style={{color:subtitleC,fontStyle:"italic",fontSize:"0.9rem",margin:"0 0 14px",lineHeight:"1.5"}}>Tap to reveal · Swipe to navigate · Mark mastered to track progress.</p>
              <VerseFlashcards allVerses={allVerses} isDark={isDark}/>
            </div>
          )}

          {/* STREAK */}
          {tab==="Streak"&&(
            <div style={{paddingBottom:"24px"}}>
              <StreakTab streak={streak} journal={journal} isDark={isDark}/>
            </div>
          )}

          {/* NOTES */}
          {tab==="Notes"&&(
            <NotesTab isDark={isDark}/>
          )}
        </div>

        {/* ── BOTTOM NAV ── */}
        <div className="no-print" style={{flexShrink:0,background:isDark?"rgba(19,11,4,0.97)":"rgba(250,243,224,0.97)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",borderTop:`1px solid ${isDark?"rgba(201,150,58,0.1)":"rgba(139,105,20,0.15)"}`,paddingBottom:"env(safe-area-inset-bottom,0px)",zIndex:10}}>
          <div style={{display:"flex",height:`${NAV_H}px`}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>switchTab(t.id)}
                style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"3px",background:"transparent",border:"none",cursor:"pointer",WebkitTapHighlightColor:"transparent",padding:"6px 0",transition:"opacity 0.15s"}}>
                <Icon id={t.icon} size={22} color={tab===t.id?"#C9963A":isDark?"#5a4525":"#b0906e"} style={{opacity:tab===t.id?1:0.45,transition:"opacity 0.15s"}}/>
                <span style={{fontFamily:"'Cinzel',serif",fontSize:"0.56rem",letterSpacing:"0.1em",textTransform:"uppercase",color:tab===t.id?"#C9963A":isDark?"#5a4525":"#b0906e",transition:"color 0.15s"}}>
                  {t.id==="Journal"&&journal.length>0?`${t.label} (${journal.length})`:t.label}
                </span>
                {tab===t.id&&<div style={{width:"20px",height:"2px",background:"#C9963A",borderRadius:"1px",position:"absolute",bottom:`calc(env(safe-area-inset-bottom,0px) + 4px)`}}/>}
              </button>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}

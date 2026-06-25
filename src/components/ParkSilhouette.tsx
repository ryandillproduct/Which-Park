interface Props {
  parkKey: 'magic-kingdom' | 'epcot' | 'hollywood-studios' | 'animal-kingdom';
  className?: string;
  style?: React.CSSProperties;
}

export function ParkSilhouette({ parkKey, className = '', style }: Props) {
  return (
    <svg
      viewBox="0 0 100 80"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {parkKey === 'magic-kingdom' && <MagicKingdomPath />}
      {parkKey === 'epcot' && <EpcotPath />}
      {parkKey === 'hollywood-studios' && <HollywoodStudiosPath />}
      {parkKey === 'animal-kingdom' && <AnimalKingdomPath />}
    </svg>
  );
}

// Cinderella Castle silhouette — five spires of varying height, narrow conical
// roofs, flag on the tallest center spire, arched doorway in the base.
// Drawn at 0-64 scale and repositioned/rescaled into this file's 0-100x80
// viewBox via the wrapping transform (uniform scale 1.2, recentered on x=50).
function MagicKingdomPath() {
  return (
    <g transform="translate(50,2) scale(1.2) translate(-32,0)">
      <rect x="12" y="44" width="40" height="16" />
      <rect x="15" y="34" width="6" height="10" />
      <path d="M15 34 L18 24 L21 34Z" />
      <rect x="23" y="28" width="6" height="16" />
      <path d="M23 28 L26 16 L29 28Z" />
      <rect x="28" y="18" width="8" height="26" />
      <path d="M28 18 L32 2 L36 18Z" />
      <rect x="31" y="-1" width="2" height="4" />
      <rect x="35" y="28" width="6" height="16" />
      <path d="M35 28 L38 16 L41 28Z" />
      <rect x="43" y="34" width="6" height="10" />
      <path d="M43 34 L46 24 L49 34Z" />
      <path d="M27 50 Q27 44 32 44 Q37 44 37 50 L37 60 L27 60Z" fill="currentColor" opacity="0.4" />
      <rect x="10" y="60" width="44" height="3" rx="1" />
    </g>
  );
}

// Spaceship Earth (geodesic sphere with three filled tripod legs and an
// inner highlight circle). Drawn at 0-64 scale and repositioned/rescaled
// via the same wrapping transform as MagicKingdomPath/AnimalKingdomPath.
function EpcotPath() {
  return (
    <g transform="translate(50,2) scale(1.2) translate(-32,0)">
      <circle cx="32" cy="28" r="20" />
      <path d="M20 44 L12 60 L18 60 L24 46Z" />
      <path d="M32 46 L32 60 L38 60 L38 46Z" />
      <path d="M44 44 L52 60 L46 60 L40 46Z" />
      <circle cx="32" cy="28" r="15" fill="currentColor" opacity="0.25" />
    </g>
  );
}

// Sorcerer Mickey hat — the park's classic icon. Tall cone with a flared
// brim, a crescent moon, and six stars scattered across the cone (the real
// hat has stars/moons printed on the fabric). Same 0-64-to-viewBox
// transform as the other redrawn icons.
function HollywoodStudiosPath() {
  return (
    <g transform="translate(50,2) scale(1.2) translate(-32,0)">
      <path d="M32 1 C29 1 19 24 12 46 C19 41 26 38 32 38 C38 38 45 41 52 46 C45 24 35 1 32 1 Z" />
      <ellipse cx="32" cy="48" rx="27" ry="7.5" />
      <path d="M36 17 a3.2 3.2 0 1 0 0 6.4 a2.4 2.4 0 1 1 0 -6.4Z" fill="currentColor" opacity="0.65" />
      <path d="M19 30 L20.4 33 L23.6 33.5 L21.3 35.7 L21.9 38.9 L19 37.3 L16.1 38.9 L16.7 35.7 L14.4 33.5 L17.6 33Z" fill="currentColor" opacity="0.6" />
      <path d="M27 13 L27.8 14.8 L29.7 15.1 L28.3 16.4 L28.6 18.3 L27 17.4 L25.4 18.3 L25.7 16.4 L24.3 15.1 L26.2 14.8Z" fill="currentColor" opacity="0.6" />
      <path d="M41 27 L41.8 28.6 L43.6 28.9 L42.3 30.1 L42.6 31.9 L41 31 L39.4 31.9 L39.7 30.1 L38.4 28.9 L40.2 28.6Z" fill="currentColor" opacity="0.6" />
      <path d="M23 22 L23.5 23.3 L24.9 23.5 L23.9 24.5 L24.2 25.9 L23 25.2 L21.8 25.9 L22.1 24.5 L21.1 23.5 L22.5 23.3Z" fill="currentColor" opacity="0.6" />
      <path d="M33 33 L33.6 34.6 L35.3 34.8 L34 36 L34.3 37.7 L33 36.9 L31.7 37.7 L32 36 L30.7 34.8 L32.4 34.6Z" fill="currentColor" opacity="0.6" />
      <path d="M44 21 L44.4 22.1 L45.6 22.3 L44.7 23.1 L45 24.3 L44 23.7 L43 24.3 L43.3 23.1 L42.4 22.3 L43.6 22.1Z" fill="currentColor" opacity="0.6" />
    </g>
  );
}

// Tree of Life silhouette — full rounded canopy from seven overlapping
// circles at one even opacity (no opacity layering — that caused uneven
// dark blotches in review), sitting on a flared vase-shaped trunk/base.
// Same 0-64-to-viewBox transform as MagicKingdomPath.
function AnimalKingdomPath() {
  return (
    <g transform="translate(50,2) scale(1.2) translate(-32,0)">
      <circle cx="32" cy="17" r="18" />
      <circle cx="13" cy="23" r="12.5" />
      <circle cx="51" cy="23" r="12.5" />
      <circle cx="22" cy="9" r="10" />
      <circle cx="42" cy="9" r="10" />
      <circle cx="8" cy="29" r="6.5" />
      <circle cx="56" cy="29" r="6.5" />
      <path d="M27 34 L26 42 C24 50 19 55 13 58 L13 62 L51 62 L51 58 C45 55 40 50 38 42 L37 34 Z" />
    </g>
  );
}

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

// Cinderella Castle silhouette
function MagicKingdomPath() {
  return (
    <path d="M50 2 L52 12 L54 10 L54 22 L58 18 L58 28 L62 24 L62 70 L38 70 L38 24 L42 28 L42 18 L46 22 L46 10 L48 12 Z M44 70 L44 48 L56 48 L56 70 Z M36 70 L36 38 L38 38 L38 70 Z M62 70 L62 38 L64 38 L64 70 Z M68 42 L68 70 L64 70 L64 42 Z M32 42 L32 70 L36 70 L36 42 Z M70 70 L30 70 L30 72 L70 72 Z" />
  );
}

// Spaceship Earth (geodesic sphere on tripod legs)
function EpcotPath() {
  return (
    <g>
      <circle cx="50" cy="32" r="28" />
      <path d="M34 57 L24 76" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M50 60 L50 76" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M66 57 L76 76" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    </g>
  );
}

// Hollywood Tower Hotel (Tower of Terror) silhouette
function HollywoodStudiosPath() {
  return (
    <g>
      {/* Water tower roof */}
      <path d="M43 4 L50 0 L57 4Z" />
      {/* Water tower barrel */}
      <rect x="42" y="4" width="16" height="9" rx="2" />
      {/* Narrow top section */}
      <rect x="38" y="13" width="24" height="10" />
      {/* Main building body */}
      <rect x="28" y="23" width="44" height="47" />
      {/* Elevator shaft / drop windows */}
      <rect x="43" y="28" width="14" height="7" rx="1" fill="currentColor" opacity="0.3" />
      <rect x="43" y="41" width="14" height="7" rx="1" fill="currentColor" opacity="0.3" />
      <rect x="43" y="54" width="14" height="7" rx="1" fill="currentColor" opacity="0.3" />
      {/* Side arched windows */}
      <rect x="30" y="34" width="7" height="9" rx="3.5" />
      <rect x="63" y="34" width="7" height="9" rx="3.5" />
      {/* Base/ground line */}
      <rect x="22" y="70" width="56" height="5" rx="1" />
    </g>
  );
}

// Tree of Life silhouette
function AnimalKingdomPath() {
  return (
    <g>
      {/* Wide organic canopy */}
      <path d="M50 2 C36 2 22 10 18 22 C14 34 20 46 32 52 C36 54 40 55 44 56 L44 66 L56 66 L56 56 C60 55 64 54 68 52 C80 46 86 34 82 22 C78 10 64 2 50 2Z" />
      {/* Thick trunk */}
      <rect x="43" y="62" width="14" height="12" rx="2" />
      {/* Widening base/roots */}
      <path d="M36 74 L43 66 L57 66 L64 74Z" />
      <rect x="32" y="74" width="36" height="4" rx="2" />
    </g>
  );
}

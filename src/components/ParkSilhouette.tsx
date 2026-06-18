interface Props {
  parkKey: 'magic-kingdom' | 'epcot' | 'hollywood-studios' | 'animal-kingdom';
  className?: string;
}

export function ParkSilhouette({ parkKey, className = '' }: Props) {
  return (
    <svg
      viewBox="0 0 100 80"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
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

// Spaceship Earth (geodesic sphere) silhouette
function EpcotPath() {
  return (
    <g>
      <circle cx="50" cy="38" r="30" />
      <rect x="46" y="68" width="8" height="10" rx="1" />
      <line x1="50" y1="8" x2="50" y2="68" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
      <line x1="20" y1="38" x2="80" y2="38" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
      <ellipse cx="50" cy="38" rx="30" ry="12" stroke="currentColor" strokeWidth="1.5" opacity="0.2" fill="none" />
    </g>
  );
}

// Chinese Theatre (Grauman's) silhouette
function HollywoodStudiosPath() {
  return (
    <path d="M15 70 L15 40 L20 40 L20 30 L25 25 L25 20 L30 15 L35 20 L35 25 L40 30 L40 40 L60 40 L60 30 L65 25 L65 20 L70 15 L75 20 L75 25 L80 30 L80 40 L85 40 L85 70 Z M38 70 L38 48 L62 48 L62 70 Z M22 55 L22 65 L30 65 L30 55 Z M70 55 L70 65 L78 65 L78 55 Z" />
  );
}

// Tree of Life silhouette
function AnimalKingdomPath() {
  return (
    <g>
      <line x1="50" y1="68" x2="50" y2="30" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 30 C50 30 35 20 30 8 C38 12 44 22 50 30" fill="currentColor" />
      <path d="M50 30 C50 30 65 20 70 8 C62 12 56 22 50 30" fill="currentColor" />
      <path d="M50 40 C50 40 32 32 26 18 C35 22 44 32 50 40" fill="currentColor" />
      <path d="M50 40 C50 40 68 32 74 18 C65 22 56 32 50 40" fill="currentColor" />
      <path d="M50 50 C50 50 36 46 30 34 C38 38 46 46 50 50" fill="currentColor" />
      <path d="M50 50 C50 50 64 46 70 34 C62 38 54 46 50 50" fill="currentColor" />
      <polygon points="46,68 54,68 56,72 44,72" />
      <polygon points="44,72 56,72 58,78 42,78" />
    </g>
  );
}

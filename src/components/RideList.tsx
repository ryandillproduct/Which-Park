import { Ride } from '@/types';

interface Props {
  rides: Ride[];
  headlinerNames: string[];
  showtimesUrl: string;
}

const CHIP_BASE = 'text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0';

// Green ≤20min, amber 21-45min, red 46min+ — see plan's Global Constraints.
function waitTimeChipClass(waitTime: number): string {
  if (waitTime <= 20) return 'bg-[var(--chip-green-bg)] text-[var(--chip-green-tx)]';
  if (waitTime <= 45) return 'bg-[var(--chip-amber-bg)] text-[var(--chip-amber-tx)]';
  return 'bg-[var(--chip-red-bg)] text-[var(--chip-red-tx)]';
}

export function RideList({ rides, headlinerNames, showtimesUrl }: Props) {
  function isHeadliner(rideName: string): boolean {
    return headlinerNames.some((h) =>
      rideName.toLowerCase().includes(h.toLowerCase())
    );
  }

  // Individual shows collapse into the single "Shows & Fireworks" row below.
  const attractions = rides.filter((ride) => !ride.isShow);

  return (
    <ul className="mt-4 space-y-2">
      {attractions.map((ride, index) => {
        const headliner = isHeadliner(ride.name);
        return (
          <li
            key={ride.id}
            data-testid="ride-row"
            className={`animate-ride-row-in flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-[var(--surface-raised)] shadow-[0_2px_8px_rgba(28,16,8,0.05)] transition-all duration-200 hover:shadow-[0_4px_14px_rgba(28,16,8,0.1)] hover:-translate-y-0.5 border-l-[3px] ${headliner ? 'border-l-[#F5C842]' : 'border-l-transparent'}`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <span className="flex items-center gap-2 text-sm text-[var(--text)] min-w-0">
              {headliner && (
                <span aria-label="Headliner attraction" className="text-[#E8A93A] text-xs">★</span>
              )}
              <span className="truncate">{ride.name}</span>
            </span>
            <span className="flex-shrink-0 ml-3">
              {ride.isStatic ? (
                <span className="text-sm font-semibold text-[var(--text-muted)]">—</span>
              ) : !ride.is_open ? (
                <span data-testid="wait-chip" className={`${CHIP_BASE} bg-[var(--chip-gray-bg)] text-[var(--chip-gray-tx)] tracking-wide uppercase`}>
                  Unavailable
                </span>
              ) : (
                <span data-testid="wait-chip" className={`${CHIP_BASE} ${waitTimeChipClass(ride.wait_time)} tabular-nums`}>
                  {ride.wait_time} min
                </span>
              )}
            </span>
          </li>
        );
      })}
      <li
        data-testid="shows-row"
        className="animate-ride-row-in flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-[var(--surface-raised)] shadow-[0_2px_8px_rgba(28,16,8,0.05)] transition-all duration-200 hover:shadow-[0_4px_14px_rgba(28,16,8,0.1)] hover:-translate-y-0.5 border-l-[3px] border-l-transparent"
        style={{ animationDelay: `${attractions.length * 0.05}s` }}
      >
        <span className="text-sm text-[var(--text)] truncate min-w-0">Shows &amp; Fireworks</span>
        <span className="flex-shrink-0 ml-3">
          <a
            href={showtimesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-[var(--text-label)] underline underline-offset-2 hover:text-[var(--text)] transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            Showtimes ↗
          </a>
        </span>
      </li>
    </ul>
  );
}

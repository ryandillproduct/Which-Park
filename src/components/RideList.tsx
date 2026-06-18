import { Ride } from '@/types';

interface Props {
  rides: Ride[];
  headlinerNames: string[];
  showtimesUrl: string;
}

export function RideList({ rides, headlinerNames, showtimesUrl }: Props) {
  function isHeadliner(rideName: string): boolean {
    return headlinerNames.some((h) =>
      rideName.toLowerCase().includes(h.toLowerCase())
    );
  }

  return (
    <ul className="mt-4 space-y-2">
      {rides.map((ride) => (
        <li
          key={ride.id}
          className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#FAF6F0]"
        >
          <span className="flex items-center gap-2 text-sm text-[#1C1008] min-w-0">
            {isHeadliner(ride.name) && (
              <span
                aria-label="Headliner attraction"
                className="text-[#F5C842] text-xs flex-shrink-0"
                title="Headliner attraction"
              >
                ★
              </span>
            )}
            <span className="truncate">{ride.name}</span>
          </span>
          <span className="text-sm font-semibold flex-shrink-0 ml-3">
            {ride.isShow ? (
              <a
                href={showtimesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8B7355] underline underline-offset-2 hover:text-[#5C4A2A] transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Showtimes ↗
              </a>
            ) : !ride.is_open ? (
              <span className="text-[#C4B49A] text-xs font-medium tracking-wide uppercase">Down</span>
            ) : (
              <span className="text-[#8B7355] tabular-nums">{ride.wait_time} min</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

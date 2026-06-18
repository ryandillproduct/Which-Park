import { Ride } from '@/types';

interface Props {
  rides: Ride[];
  headlinerNames: string[];
}

export function RideList({ rides, headlinerNames }: Props) {
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
          className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5"
        >
          <span className="flex items-center gap-2 text-sm text-white/80">
            {isHeadliner(ride.name) && (
              <span
                aria-label="Headliner attraction"
                className="text-[#F5C842] text-xs"
                title="Headliner attraction"
              >
                ★
              </span>
            )}
            {ride.name}
          </span>
          <span className="text-sm font-semibold text-white/60 tabular-nums">
            {ride.wait_time} min
          </span>
        </li>
      ))}
    </ul>
  );
}

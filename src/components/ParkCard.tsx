'use client';

import { useState } from 'react';
import { ScoredPark } from '@/types';
import { ParkSilhouette } from './ParkSilhouette';
import { RideList } from './RideList';

interface Props {
  park: ScoredPark;
  isBest: boolean;
  headlinerNames: string[];
}

// Smoothly interpolate green → amber → red based on 1–10 score
function scoreBarColor(score: number): string {
  const green = { r: 52, g: 211, b: 153 };
  const amber = { r: 251, g: 191, b: 36 };
  const red   = { r: 251, g: 113, b: 133 };

  let r, g, b;
  if (score <= 5) {
    const t = (score - 1) / 4;
    r = Math.round(green.r + t * (amber.r - green.r));
    g = Math.round(green.g + t * (amber.g - green.g));
    b = Math.round(green.b + t * (amber.b - green.b));
  } else {
    const t = (score - 5) / 5;
    r = Math.round(amber.r + t * (red.r - amber.r));
    g = Math.round(amber.g + t * (red.g - amber.g));
    b = Math.round(amber.b + t * (red.b - amber.b));
  }
  return `rgb(${r},${g},${b})`;
}

export function ParkCard({ park, headlinerNames }: Props) {
  const [expanded, setExpanded] = useState(false);
  const fillPercent = park.isOpen ? (park.score / 10) * 100 : 0;
  const barColor = scoreBarColor(park.score);

  return (
    <div className="rounded-2xl bg-white border border-black/[0.06] shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-5 flex items-center gap-4"
        aria-expanded={expanded}
      >
        <ParkSilhouette
          parkKey={park.silhouetteKey}
          className="w-12 h-12 flex-shrink-0"
          style={{ color: park.isOpen ? '#C4B49A' : '#DDD8D0' }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <p className={`font-playfair text-lg font-semibold truncate ${park.isOpen ? 'text-[#1C1008]' : 'text-[#B5A898]'}`}>
              {park.name}
            </p>
            <span className="text-xs flex-shrink-0 text-[#B5A898]">
              {park.isOpen ? park.hours : park.hours ? `Closed · ${park.hours}` : 'Closed'}
            </span>
          </div>
          <div className="mt-2 w-full h-1.5 rounded-full bg-[#EDE8E1] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${fillPercent}%`, backgroundColor: park.isOpen ? barColor : 'transparent' }}
            />
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5">
          <div className="border-t border-black/[0.06] pt-4">
            <RideList rides={park.rides} headlinerNames={headlinerNames} showtimesUrl={park.showtimesUrl} />
          </div>
        </div>
      )}
    </div>
  );
}

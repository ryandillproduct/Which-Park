'use client';

import { useState } from 'react';
import { ScoredPark } from '@/types';
import { ParkSilhouette } from './ParkSilhouette';
import { RideList } from './RideList';

interface Props {
  park: ScoredPark;
  rank: number | null;
  headlinerNames: string[];
}

// Green → amber → red for goScore 10→5→0 (higher goScore = greener)
function goScoreBarColor(goScore: number): string {
  const green = { r: 52, g: 211, b: 153 };
  const amber = { r: 251, g: 191, b: 36 };
  const red   = { r: 251, g: 113, b: 133 };

  let r, g, b;
  if (goScore >= 5) {
    const t = (goScore - 5) / 5;
    r = Math.round(amber.r + t * (green.r - amber.r));
    g = Math.round(amber.g + t * (green.g - amber.g));
    b = Math.round(amber.b + t * (green.b - amber.b));
  } else {
    const t = goScore / 5;
    r = Math.round(red.r + t * (amber.r - red.r));
    g = Math.round(red.g + t * (amber.g - red.g));
    b = Math.round(red.b + t * (amber.b - red.b));
  }
  return `rgb(${r},${g},${b})`;
}

export function ParkCard({ park, rank, headlinerNames }: Props) {
  const [expanded, setExpanded] = useState(false);
  const fillPercent = park.isOpen ? (park.goScore / 10) * 100 : 0;
  const barColor = goScoreBarColor(park.goScore);

  return (
    <div className="relative rounded-2xl bg-white border border-black/[0.06] shadow-sm overflow-hidden">
      {rank !== null && (
        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#F5C842] flex items-center justify-center z-10">
          <span className="text-xs font-bold text-[#1C1008] leading-none">{rank}</span>
        </div>
      )}
      <button
        onClick={() => park.isOpen && setExpanded((v) => !v)}
        className={`w-full text-left p-5 flex items-center gap-4 ${park.isOpen ? '' : 'cursor-default'}`}
        aria-expanded={expanded}
        aria-disabled={!park.isOpen}
      >
        <ParkSilhouette
          parkKey={park.silhouetteKey}
          className="w-12 h-12 flex-shrink-0"
          style={{ color: park.isOpen ? '#C4B49A' : '#DDD8D0' }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <p className={`font-playfair text-lg font-semibold truncate ${park.isOpen ? 'text-[#1C1008]' : 'text-[#B5A898]'}`}>
              {park.name}
            </p>
          </div>
          {(park.hours || !park.isOpen) && (
            <p className="text-xs text-[#B5A898] mt-0.5">
              {park.isOpen ? park.hours : park.hours ? `Closed · ${park.hours}` : 'Closed'}
            </p>
          )}
          {park.isOpen && (
            <>
              <div className="mt-2 w-full h-1.5 rounded-full bg-[#EDE8E1] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${fillPercent}%`, backgroundColor: barColor }}
                />
              </div>
              <p className="text-xs text-[#B5A898] mt-1">Go Score · {(Math.round(park.goScore * 2) / 2).toFixed(1)}/10</p>
              {park.tiebreakerNote && (
                <p className="text-xs text-[#B5A898] mt-0.5 italic">{park.tiebreakerNote}</p>
              )}
            </>
          )}
        </div>
      </button>

      {expanded && park.isOpen && (
        <div className="px-5 pb-5">
          <div className="border-t border-black/[0.06] pt-4">
            {park.isOpen && park.avgWaitMinutes > 0 && (
              <p className="text-xs text-[#B5A898] mb-3">
                <span className="font-semibold text-[#8B7355]">{park.avgWaitMinutes} min</span> avg wait across open attractions
              </p>
            )}
            <RideList rides={park.rides} headlinerNames={headlinerNames} showtimesUrl={park.showtimesUrl} />
          </div>
        </div>
      )}
    </div>
  );
}

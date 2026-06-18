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

function scoreBarColor(score: number): string {
  if (score <= 3) return '#34D399';
  if (score <= 6) return '#FBBF24';
  return '#FB7185';
}

export function ParkCard({ park, headlinerNames }: Props) {
  const [expanded, setExpanded] = useState(false);
  const fillPercent = (park.score / 10) * 100;
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
          style={{ color: '#C4B49A' }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-playfair text-lg text-[#1C1008] font-semibold truncate">
              {park.name}
            </p>
            {park.hours && (
              <span className="text-xs text-[#B5A898] flex-shrink-0">{park.hours}</span>
            )}
          </div>
          <div className="mt-2 w-full h-1.5 rounded-full bg-[#EDE8E1] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${fillPercent}%`, backgroundColor: barColor }}
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

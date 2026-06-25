'use client';

import { useEffect, useState } from 'react';
import { ScoredPark } from '@/types';
import { ParkSilhouette } from './ParkSilhouette';
import { RideList } from './RideList';

interface Props {
  park: ScoredPark;
  rank: number | null;
  headlinerNames: string[];
}

// Green → amber → red for goScore 10→5→0 (higher goScore = greener).
// Returns a two-stop gradient (light → dark of the same hue) plus a glow
// shadow color, instead of a single flat color.
function goScoreBarStyle(goScore: number): { gradient: string; glow: string } {
  const green = { r: 52, g: 211, b: 153 };
  const amber = { r: 251, g: 191, b: 36 };
  const red = { r: 251, g: 113, b: 133 };

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

  const dark = `rgb(${r},${g},${b})`;
  const light = `rgb(${Math.round(r + (255 - r) * 0.45)},${Math.round(g + (255 - g) * 0.45)},${Math.round(b + (255 - b) * 0.45)})`;
  return {
    gradient: `linear-gradient(90deg, ${light}, ${dark})`,
    glow: `0 0 12px rgba(${r},${g},${b},0.5)`,
  };
}

// Matches the rounding RecommendedBanner's deleted SummaryText used to use.
function formatTimeUntilClose(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hrs} hr${hrs > 1 ? 's' : ''}`;
  return `${hrs} hr ${mins} min`;
}

function useLiveMinutesUntilClose(closingTimeMs: number | null): number | null {
  const compute = () =>
    closingTimeMs !== null ? Math.round((closingTimeMs - Date.now()) / 60000) : null;

  const [mins, setMins] = useState<number | null>(compute);

  useEffect(() => {
    setMins(compute());
    const interval = setInterval(() => setMins(compute()), 60000);
    return () => clearInterval(interval);
  }, [closingTimeMs]);

  return mins;
}

function timeFramingSentence(mins: number | null): string {
  if (mins === null) return '';
  if (mins < 60) return ` Only ~${formatTimeUntilClose(mins)} left until close.`;
  if (mins < 300) return ` About ${formatTimeUntilClose(mins)} left until close.`;
  return " There's plenty of time left to enjoy the park.";
}

// route.ts's tiebreakerReason() always returns one of these two exact
// prefixes followed by the losing park's name — parse it back apart so we
// can fold it into the strip's wording instead of showing it as a second note.
function parseTiebreakerNote(note: string): { dimension: string; loserName: string } | null {
  const waitPrefix = 'Lower average wait than ';
  const attractionsPrefix = 'More open attractions than ';
  if (note.startsWith(waitPrefix)) {
    return { dimension: 'average wait', loserName: note.slice(waitPrefix.length) };
  }
  if (note.startsWith(attractionsPrefix)) {
    return { dimension: 'open attractions', loserName: note.slice(attractionsPrefix.length) };
  }
  return null;
}

function TopPickStrip({ park }: { park: ScoredPark }) {
  const mins = useLiveMinutesUntilClose(park.closingTimeMs);
  const tie = park.tiebreakerNote ? parseTiebreakerNote(park.tiebreakerNote) : null;

  return (
    <div data-testid="top-pick-strip" className="mt-2 rounded-lg bg-[#FDF3D6] px-2.5 py-2">
      <p className="text-[11px] leading-snug text-[#1C1008]">
        <span className="font-bold text-[#8B6914]">
          {tie
            ? `Top pick right now — edges out ${tie.loserName} on ${tie.dimension}.`
            : 'Top pick right now —'}
        </span>{' '}
        {park.avgWaitMinutes} min avg wait, crowd level {park.score}/10.
        {timeFramingSentence(mins)}
      </p>
    </div>
  );
}

export function ParkCard({ park, rank, headlinerNames }: Props) {
  const [expanded, setExpanded] = useState(false);
  const fillPercent = park.isOpen ? (park.goScore / 10) * 100 : 0;
  const { gradient: barGradient, glow: barGlow } = goScoreBarStyle(park.goScore);

  return (
    <div
      data-testid="park-card"
      className={`relative rounded-2xl bg-white overflow-hidden shadow-[0_4px_16px_rgba(28,16,8,0.06)] transition-all duration-200 hover:shadow-[0_8px_24px_rgba(28,16,8,0.1)] hover:-translate-y-0.5 ${rank !== null ? 'animate-card-stagger-in' : ''} ${rank === 1 ? 'animate-glow-pulse' : ''}`}
      style={rank !== null ? { animationDelay: `${(rank - 1) * 0.12}s` } : undefined}
    >
      {rank !== null && (
        <div
          className="absolute top-2 left-2 w-6 h-6 rounded-full shadow-[0_2px_8px_rgba(232,169,58,0.5)] flex items-center justify-center z-10"
          style={{ background: 'linear-gradient(135deg, #F5C842, #E8A93A)' }}
        >
          <span className="text-xs font-bold text-[#1C1008] leading-none">{rank}</span>
        </div>
      )}
      <button
        onClick={() => park.isOpen && setExpanded((v) => !v)}
        className={`w-full text-left p-5 flex items-center gap-4 ${park.isOpen ? '' : 'cursor-default'}`}
        aria-expanded={expanded}
        aria-disabled={!park.isOpen}
      >
        <div
          data-testid="icon-badge"
          className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${park.isOpen ? 'icon-badge-open animate-icon-pulse' : ''}`}
          style={park.isOpen ? { background: 'linear-gradient(135deg, #FBF0DC, #F0DCA8)' } : undefined}
        >
          <ParkSilhouette
            parkKey={park.silhouetteKey}
            className="w-8 h-8"
            style={{ color: park.isOpen ? '#B8842E' : '#DDD8D0' }}
          />
        </div>
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
                  className="h-full rounded-full"
                  style={{
                    width: `${fillPercent}%`,
                    background: barGradient,
                    boxShadow: barGlow,
                    transition: 'width 0.7s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.5s ease',
                  }}
                />
              </div>
              <p className="text-xs text-[#B5A898] mt-1">Go Score · {(Math.round(park.goScore * 2) / 2).toFixed(1)}/10</p>
              {rank === 1 ? (
                <TopPickStrip park={park} />
              ) : (
                park.tiebreakerNote && (
                  <p className="text-xs text-[#B5A898] mt-0.5 italic">{park.tiebreakerNote}</p>
                )
              )}
            </>
          )}
        </div>
      </button>

      <div
        data-testid="ride-list-wrapper"
        className={`expand-grid ${expanded && park.isOpen ? 'expand-grid-open' : ''}`}
      >
        <div>
          <div className="px-5 pb-5">
            <div className="border-t border-black/[0.06] pt-4">
              {park.isOpen && park.avgWaitMinutes > 0 && (
                <p className="text-xs text-[#B5A898] mb-3">
                  <span className="font-semibold text-[#8B7355]">{park.avgWaitMinutes} min</span> avg wait across open attractions
                  {' '}· <span className="text-[#E8A93A]">★</span> Headliner attraction
                </p>
              )}
              <RideList rides={park.rides} headlinerNames={headlinerNames} showtimesUrl={park.showtimesUrl} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

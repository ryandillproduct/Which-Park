'use client';

import { useEffect, useState } from 'react';
import { Recommendation } from '@/types';

interface Props {
  recommendation: Recommendation | null;
}

function Highlight({ children }: { children: React.ReactNode }) {
  return <span className="font-semibold text-[#8B6914]">{children}</span>;
}

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

function SummaryText({ recommendation }: { recommendation: Recommendation }) {
  const { opener, avgWaitMinutes: avg, closingTimeMs } = recommendation;
  const mins = useLiveMinutesUntilClose(closingTimeMs);

  if (mins !== null && mins < 60) {
    return (
      <>
        {opener}, with a <Highlight>{avg} min</Highlight> average wait and only{' '}
        ~<Highlight>{formatTimeUntilClose(mins)}</Highlight> until close.
      </>
    );
  }
  if (mins !== null && mins < 300) {
    return (
      <>
        {opener}, with a <Highlight>{avg} min</Highlight> average wait and about{' '}
        <Highlight>{formatTimeUntilClose(mins)}</Highlight> until close.
      </>
    );
  }
  if (mins !== null) {
    return (
      <>
        {opener}, with a <Highlight>{avg} min</Highlight> average wait and plenty of time left to
        enjoy the park.
      </>
    );
  }
  return (
    <>
      {opener}, with a <Highlight>{avg} min</Highlight> average wait.
    </>
  );
}

export function RecommendedBanner({ recommendation }: Props) {
  if (!recommendation) {
    return (
      <div className="mb-6 px-5 py-4 rounded-2xl bg-[#F5EFE6] text-center">
        <p className="text-[#B5A898] text-sm">All parks are closed right now.</p>
      </div>
    );
  }

  return (
    <div className="mb-6 px-5 py-4 rounded-2xl bg-[#FDF3D6] border border-[#F5C842]/30">
      <p className="text-xs font-semibold text-[#8B6914] tracking-widest uppercase mb-1">
        🏆 Best Park to Visit Right Now
      </p>
      <p className="font-playfair text-2xl font-bold text-[#1C1008]">
        {recommendation.parkName}
      </p>
      <p className="mt-1 text-sm text-[#8B7355]">
        <SummaryText recommendation={recommendation} />
      </p>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ApiResponse, ScoredPark, Recommendation } from '@/types';
import { HEADLINERS } from '@/config/headliners';
import { ParkCard } from '@/components/ParkCard';
import { RecommendedBanner } from '@/components/RecommendedBanner';
import { GoScoreInfoModal } from '@/components/GoScoreInfoModal';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export default function Home() {
  const [parks, setParks] = useState<ScoredPark[]>([]);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showGoScoreInfo, setShowGoScoreInfo] = useState(false);

  const loadParks = useCallback(async () => {
    try {
      const res = await fetch('/api/parks', { cache: 'no-store' });
      if (!res.ok) throw new Error('API error');
      const data: ApiResponse = await res.json();
      setParks(data.parks);
      setRecommendation(data.recommendation);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadParks();
    const interval = setInterval(loadParks, REFRESH_INTERVAL_MS);

    // Mobile browsers suspend timers in background tabs and restore pages
    // from the back/forward cache with stale state, so the interval alone
    // isn't enough — refetch whenever the user returns to the page.
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadParks();
    };
    const onPageShow = () => loadParks();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', onPageShow);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [loadParks]);

  return (
    <main className="min-h-screen px-4 pt-4 pb-12 max-w-2xl mx-auto">
      <header className="mb-4 flex items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#F5C842] flex items-center justify-center flex-shrink-0">
          <span className="font-serif text-lg font-bold text-[#1C1008] leading-none mt-0.5">?</span>
        </div>
        <p className="text-xs text-[#B5A898] tracking-wide">
          The question isn&apos;t if. It&apos;s where.
        </p>
      </header>

      {loading && (
        <div className="flex justify-center items-center py-24">
          <span className="text-[#B5A898] text-sm animate-pulse">Loading parks…</span>
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-24">
          <p className="text-[#B5A898] text-sm">
            Unable to load wait times. Please try again shortly.
          </p>
        </div>
      )}

      {!loading && !error && (
        <>
          {!recommendation && <RecommendedBanner />}

          <div className="mb-3">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-[#8B7355] uppercase tracking-widest">
                Live Park Rankings by Go Score
              </p>
              <button
                onClick={() => setShowGoScoreInfo(true)}
                aria-label="What is Go Score?"
                className="w-4 h-4 rounded-full border border-[#C4B49A] text-[#B5A898] text-[10px] leading-none flex items-center justify-center flex-shrink-0"
              >
                i
              </button>
            </div>
            {recommendation && (
              <p className="mt-0.5 text-xs text-[#B5A898]">
                Tap a park to see attraction wait times
              </p>
            )}
          </div>

          {showGoScoreInfo && <GoScoreInfoModal onClose={() => setShowGoScoreInfo(false)} />}

          <div className="space-y-4">
            {(() => {
              let openRank = 0;
              return parks.map((park) => {
                const rank = park.isOpen ? ++openRank : null;
                return (
                  <ParkCard
                    key={park.id}
                    park={park}
                    rank={rank}
                    headlinerNames={HEADLINERS[park.id] ?? []}
                  />
                );
              });
            })()}
          </div>
        </>
      )}

      <footer className="mt-10 text-center">
        <Link href="/about" className="text-xs text-[#B5A898] underline underline-offset-2">
          Meet the Creator
        </Link>
        <p className="mt-2 text-xs text-[#B5A898]">
          WhichPark? is an independent project and is not affiliated with or endorsed by Disney.
        </p>
      </footer>
    </main>
  );
}

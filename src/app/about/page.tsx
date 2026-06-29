import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Meet the Creator | WhichPark?',
  description: 'Why I built WhichPark? — a Disney local’s answer to "which park should I go to right now?"',
};

export default function About() {
  return (
    <main className="min-h-screen px-4 pt-6 pb-16 max-w-xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 -ml-1 px-2 py-2 text-sm text-[#8B7355] hover:text-[#5C4A2A] transition-colors"
      >
        &larr; Back to today&apos;s rankings
      </Link>

      <div data-testid="about-header" className="flex flex-col items-center text-center mt-4 mb-8 animate-bounce-in">
        <div
          data-testid="about-photo-frame"
          className="w-56 h-72 rounded-2xl overflow-hidden border-2 border-[#F5C842] mb-4 shadow-[0_8px_24px_rgba(28,16,8,0.12)]"
        >
          <Image
            src="/ryan-headshot.jpg"
            alt="Ryan, creator of WhichPark?"
            width={672}
            height={864}
            quality={90}
            className="w-full h-full object-cover object-[50%_30%]"
            priority
          />
        </div>
        <p className="font-playfair text-2xl font-bold text-[#1C1008]">Meet the Creator</p>
      </div>

      <div className="space-y-4 text-[#5C4A2A] leading-relaxed">
        <p className="font-playfair text-xl font-semibold text-[#1C1008]">Hi, I&apos;m Ryan.</p>
        <p>
          As a local who visits the parks often, I kept running into the same problem: most
          crowd-tracking tools are built for vacationers planning weeks or months in advance.
          They are great for questions like &quot;What is the best week to visit in October?&quot;
        </p>
        <p>
          But that is not the question I usually need answered. For locals, passholders, and
          frequent visitors, the question is much more immediate:{' '}
          <span className="font-semibold text-[#1C1008]">Which park should I go to right now?</span>
        </p>
        <p>
          So I built WhichPark? to answer that specific question. The app uses live park data
          to compare the factors that matter for a same-day visit, including current crowd
          levels, average wait times, park hours, and access friction like the extra transit
          steps required to reach Magic Kingdom.
        </p>
        <p>
          No long-range forecasts. No planning calendars. Just today&apos;s conditions,
          translated into one clear recommendation:{' '}
          <span className="font-semibold text-[#1C1008]">which park looks best to visit right now.</span>
        </p>
      </div>

      <div className="mt-10 text-center">
        <Link href="/" className="text-sm text-[#8B7355] underline underline-offset-2">
          &larr; Back to today&apos;s rankings
        </Link>
        <p className="mt-6 text-xs text-[#B5A898]">
          WhichPark? is an independent project and is not affiliated with or endorsed by Disney.
        </p>
      </div>
    </main>
  );
}

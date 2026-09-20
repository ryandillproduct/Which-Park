'use client';

import { useEffect, useRef } from 'react';
import { ParkMeta } from '@/types';

const FW_COLORS = ['#F5C842', '#E8A93A', '#FBD46D', '#FF8A5B'];

function Fireworks() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const layer = ref.current;
    if (!layer) return;
    layer.innerHTML = '';
    for (let b = 0; b < 3; b++) {
      const cx = 20 + Math.random() * 60;
      const cy = 15 + Math.random() * 30;
      setTimeout(() => {
        if (!ref.current) return;
        for (let i = 0; i < 14; i++) {
          const s = document.createElement('span');
          s.className = 'egg-spark';
          const ang = (Math.PI * 2 * i) / 14;
          const dist = 26 + Math.random() * 14;
          s.style.left = `${cx}%`;
          s.style.top = `${cy}%`;
          s.style.background = FW_COLORS[i % FW_COLORS.length];
          s.style.setProperty('--dx', `${Math.cos(ang) * dist}px`);
          s.style.setProperty('--dy', `${Math.sin(ang) * dist}px`);
          ref.current.appendChild(s);
        }
        ref.current.classList.remove('egg-boom');
        void ref.current.offsetWidth;
        ref.current.classList.add('egg-boom');
      }, b * 180);
    }
  }, []);
  return <div ref={ref} className="egg-layer egg-fw" data-testid="egg-magic-kingdom" aria-hidden="true" />;
}

function Rocket() {
  return (
    <div className="egg-layer" data-testid="egg-epcot" aria-hidden="true">
      <span className="egg-puff" />
      <svg className="egg-rocket" viewBox="0 0 24 24">
        <path d="M12 1 C15 5 16 10 16 14 L8 14 C8 10 9 5 12 1Z" fill="#ECE6DA" />
        <circle cx="12" cy="8" r="2.2" fill="#6FA8DC" />
        <path d="M8 12 L4 17.5 L8 15.5Z" fill="#E36074" />
        <path d="M16 12 L20 17.5 L16 15.5Z" fill="#E36074" />
        <path d="M9 15 L12 22 L15 15Z" fill="#F5A623" />
      </svg>
    </div>
  );
}

function Searchlights() {
  return (
    <div className="egg-layer" data-testid="egg-hollywood-studios" aria-hidden="true">
      <span className="egg-night" />
      <span className="egg-beam egg-beam1" />
      <span className="egg-beam egg-beam2" />
      <svg className="egg-clapper" viewBox="0 0 64 40">
        <rect x="6" y="16" width="52" height="22" rx="2" fill="#1c1c1c" stroke="#6a6a6a" strokeWidth="1" />
        <line x1="11" y1="25" x2="53" y2="25" stroke="#4a4a4a" strokeWidth="2" />
        <line x1="11" y1="31" x2="42" y2="31" stroke="#4a4a4a" strokeWidth="2" />
        <g className="egg-clap-top">
          <rect x="6" y="8" width="52" height="9" rx="1.5" fill="#1c1c1c" stroke="#6a6a6a" strokeWidth="1" />
          <polygon points="12,8 18,8 14,17 8,17" fill="#f2f2f2" />
          <polygon points="24,8 30,8 26,17 20,17" fill="#f2f2f2" />
          <polygon points="36,8 42,8 38,17 32,17" fill="#f2f2f2" />
          <polygon points="48,8 54,8 50,17 44,17" fill="#f2f2f2" />
        </g>
      </svg>
    </div>
  );
}

function SleepingSloth() {
  return (
    <div className="egg-layer" data-testid="egg-animal-kingdom" aria-hidden="true">
      <span className="egg-zzz">z z z</span>
      <svg className="egg-sloth" viewBox="0 0 64 64">
        <ellipse cx="32" cy="42" rx="17" ry="18" fill="#A89A82" />
        <circle cx="32" cy="24" r="14" fill="#BBAD93" />
        <ellipse cx="25" cy="24" rx="5.5" ry="7" fill="#8C7E67" />
        <ellipse cx="39" cy="24" rx="5.5" ry="7" fill="#8C7E67" />
        <path d="M22 25 q3 2 6 0" stroke="#4A4034" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M36 25 q3 2 6 0" stroke="#4A4034" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <ellipse cx="32" cy="29" rx="2.4" ry="1.8" fill="#5A4E3E" />
        <path d="M28 33 q4 3 8 0" stroke="#5A4E3E" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <path d="M17 40 q-6 6 -2 12" stroke="#8C7E67" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M47 40 q6 6 2 12" stroke="#8C7E67" strokeWidth="6" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function EffectFor({ silhouetteKey }: { silhouetteKey: ParkMeta['silhouetteKey'] }) {
  switch (silhouetteKey) {
    case 'magic-kingdom':
      return <Fireworks />;
    case 'epcot':
      return <Rocket />;
    case 'hollywood-studios':
      return <Searchlights />;
    case 'animal-kingdom':
      return <SleepingSloth />;
  }
}

export function ParkEggEffect({
  silhouetteKey,
  playToken,
}: {
  silhouetteKey: ParkMeta['silhouetteKey'];
  playToken: number;
}) {
  if (playToken === 0) return null;
  return <EffectFor key={playToken} silhouetteKey={silhouetteKey} />;
}

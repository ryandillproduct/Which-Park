'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

function currentTheme(): Theme {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'light' || attr === 'dark') return attr;
  return systemPrefersDark() ? 'dark' : 'light';
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    setTheme(currentTheme());
  }, []);

  function apply(next: Theme) {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {}
    setTheme(next);
  }

  function toggle() {
    const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
    const reduce =
      typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const startVT = (document as unknown as {
      startViewTransition?: (cb: () => void) => { finished: Promise<unknown> };
    }).startViewTransition;
    if (startVT && !reduce) {
      // Light "raises the shade" (wash up, letting light in); dark "lowers the
      // shade" (wash down). The wash keyframe reads --wash-from off the root,
      // which inherits into the ::view-transition pseudo — reliable where a
      // class-scoped pseudo selector is not.
      const root = document.documentElement;
      root.style.setProperty('--wash-from', next === 'light' ? 'inset(100% 0 0 0)' : 'inset(0 0 100% 0)');
      const transition = startVT.call(document, () => apply(next));
      transition.finished.finally(() => root.style.removeProperty('--wash-from'));
    } else {
      apply(next);
    }
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="fixed top-4 right-4 z-20 w-14 h-7 rounded-full bg-[var(--track)] transition-colors"
    >
      <span
        style={{ viewTransitionName: 'theme-thumb' } as React.CSSProperties}
        className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-[var(--surface)] shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-transform duration-300 ${isDark ? 'translate-x-7' : 'translate-x-0'}`}
      />
      <svg
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true"
        className={`absolute top-[7px] left-[7px] w-3.5 h-3.5 z-10 transition-colors ${isDark ? 'text-[var(--text-muted)] opacity-60' : 'text-[#E8A93A]'}`}
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      <svg
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true"
        className={`absolute top-[7px] left-[35px] w-3.5 h-3.5 z-10 transition-colors ${isDark ? 'text-[var(--text)]' : 'text-[var(--text-muted)] opacity-60'}`}
      >
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    </button>
  );
}

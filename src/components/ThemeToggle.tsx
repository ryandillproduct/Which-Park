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
      // shade" (wash down). Set the direction class for the duration of the wash.
      const root = document.documentElement;
      root.classList.toggle('vt-wash-up', next === 'light');
      const transition = startVT.call(document, () => apply(next));
      transition.finished.finally(() => root.classList.remove('vt-wash-up'));
    } else {
      apply(next);
    }
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-label)] hover:text-[var(--text)] transition-colors z-20"
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}

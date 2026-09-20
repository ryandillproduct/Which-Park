import { useState, useCallback } from 'react';

const TAPS_TO_TRIGGER = 1;

export function useClosedParkEgg(): {
  dots: number;
  playToken: number;
  registerTap: () => void;
} {
  const [dots, setDots] = useState(0);
  const [playToken, setPlayToken] = useState(0);

  const registerTap = useCallback(() => {
    setDots((prev) => {
      const next = prev + 1;
      if (next >= TAPS_TO_TRIGGER) {
        setPlayToken((t) => t + 1);
        return 0;
      }
      return next;
    });
  }, []);

  return { dots, playToken, registerTap };
}

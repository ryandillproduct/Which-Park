import { renderHook, act } from '@testing-library/react';
import { useClosedParkEgg } from '@/components/easter-eggs/useClosedParkEgg';

describe('useClosedParkEgg', () => {
  it('triggers on the first tap, keeping dots at zero', () => {
    const { result } = renderHook(() => useClosedParkEgg());
    expect(result.current.dots).toBe(0);
    expect(result.current.playToken).toBe(0);
    act(() => result.current.registerTap());
    expect(result.current.playToken).toBe(1);
    expect(result.current.dots).toBe(0);
  });

  it('replays on each subsequent tap', () => {
    const { result } = renderHook(() => useClosedParkEgg());
    act(() => result.current.registerTap());
    act(() => result.current.registerTap());
    act(() => result.current.registerTap());
    expect(result.current.playToken).toBe(3);
    expect(result.current.dots).toBe(0);
  });
});

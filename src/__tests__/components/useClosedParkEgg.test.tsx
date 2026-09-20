import { renderHook, act } from '@testing-library/react';
import { useClosedParkEgg } from '@/components/easter-eggs/useClosedParkEgg';

describe('useClosedParkEgg', () => {
  it('shows build-up dots for the first two taps without playing', () => {
    const { result } = renderHook(() => useClosedParkEgg());
    expect(result.current.dots).toBe(0);
    expect(result.current.playToken).toBe(0);
    act(() => result.current.registerTap());
    expect(result.current.dots).toBe(1);
    expect(result.current.playToken).toBe(0);
    act(() => result.current.registerTap());
    expect(result.current.dots).toBe(2);
    expect(result.current.playToken).toBe(0);
  });

  it('triggers on the third tap, resets dots, and increments playToken', () => {
    const { result } = renderHook(() => useClosedParkEgg());
    act(() => result.current.registerTap());
    act(() => result.current.registerTap());
    act(() => result.current.registerTap());
    expect(result.current.playToken).toBe(1);
    expect(result.current.dots).toBe(0);
  });

  it('replays on a second full 3-tap cycle', () => {
    const { result } = renderHook(() => useClosedParkEgg());
    for (let i = 0; i < 6; i++) act(() => result.current.registerTap());
    expect(result.current.playToken).toBe(2);
    expect(result.current.dots).toBe(0);
  });
});

import { calculateParkScore, scoreLabel, scoreColorClass, isMeetAndGreet, headlinerWaitMinutes } from '@/lib/scoring';
import { Ride } from '@/types';

function makeRide(name: string, wait_time: number, is_open = true): Ride {
  return { id: 1, name, is_open, wait_time, last_updated: '' };
}

const headliners = ['Seven Dwarfs Mine Train', 'Space Mountain'];

describe('calculateParkScore', () => {
  it('returns 1 when all headliners have 0 min wait and no congestion', () => {
    const rides = [
      makeRide('Seven Dwarfs Mine Train', 0),
      makeRide('Space Mountain', 0),
      makeRide('Small Ride', 5),
    ];
    expect(calculateParkScore(rides, headliners)).toBe(1);
  });

  it('returns 10 when headliners average 90+ min and all rides > 45 min', () => {
    const rides = [
      makeRide('Seven Dwarfs Mine Train', 90),
      makeRide('Space Mountain', 95),
      makeRide('Other Ride', 60),
    ];
    expect(calculateParkScore(rides, headliners)).toBe(10);
  });

  it('falls back to all-ride average when no headliners are open', () => {
    const rides = [
      makeRide('Random Ride A', 10),
      makeRide('Random Ride B', 20),
    ];
    // avg = 15, normalizedHeadliner = 15/60 = 0.25, congestion = 0/2 = 0
    // blended = 0.7 * 0.25 + 0.3 * 0 = 0.175 → round(0.175*9+1) = round(2.575) = 3
    expect(calculateParkScore(rides, headliners)).toBe(3);
  });

  it('ignores closed rides', () => {
    const rides = [
      makeRide('Seven Dwarfs Mine Train', 90),
      makeRide('Space Mountain', 0, false), // closed
    ];
    // Only 1 headliner open: avg=90, congestion=1/1=1.0
    // blended = 0.7*1 + 0.3*1 = 1.0 → score = 10
    expect(calculateParkScore(rides, headliners)).toBe(10);
  });

  it('returns 5 when no rides are open', () => {
    const rides = [makeRide('Seven Dwarfs Mine Train', 0, false)];
    expect(calculateParkScore(rides, headliners)).toBe(5);
  });

  it('clamps output between 1 and 10', () => {
    const rides = [makeRide('Seven Dwarfs Mine Train', 200), makeRide('Space Mountain', 200)];
    expect(calculateParkScore(rides, headliners)).toBe(10);
  });
});

describe('isMeetAndGreet', () => {
  it('flags character meet-and-greets', () => {
    expect(isMeetAndGreet('Meet Mickey at Town Square Theater')).toBe(true);
    expect(isMeetAndGreet('Meet Cinderella and Tiana')).toBe(true);
  });
  it('does not flag rides', () => {
    expect(isMeetAndGreet('Space Mountain')).toBe(false);
    expect(isMeetAndGreet('Meets End Coaster')).toBe(false); // no trailing space after "meet"
  });
});

describe('headlinerWaitMinutes', () => {
  const names = ['Space Mountain', 'Seven Dwarfs Mine Train'];
  it('averages open headliner waits', () => {
    const rides = [
      makeRide('Space Mountain', 40),
      makeRide('Seven Dwarfs Mine Train', 20),
      makeRide('Small Ride', 5),
    ];
    expect(headlinerWaitMinutes(rides, names)).toBe(30);
  });
  it('falls back to all open rides when no headliners are open', () => {
    const rides = [makeRide('Small Ride A', 10), makeRide('Small Ride B', 20)];
    expect(headlinerWaitMinutes(rides, names)).toBe(15);
  });
  it('returns 0 when nothing is open', () => {
    expect(headlinerWaitMinutes([makeRide('Space Mountain', 40, false)], names)).toBe(0);
  });
});

describe('calculateParkScore resolution', () => {
  it('scores a short-wait park meaningfully lower than a long-wait park', () => {
    const short = [makeRide('Space Mountain', 15), makeRide('Seven Dwarfs Mine Train', 20)];
    const long = [makeRide('Space Mountain', 55), makeRide('Seven Dwarfs Mine Train', 50)];
    expect(calculateParkScore(long, headliners) - calculateParkScore(short, headliners)).toBeGreaterThanOrEqual(2);
  });
});

describe('scoreLabel', () => {
  it('returns "Great time to visit" for scores 1-3', () => {
    expect(scoreLabel(1)).toBe('Great time to visit');
    expect(scoreLabel(3)).toBe('Great time to visit');
  });
  it('returns "Moderate crowds" for scores 4-6', () => {
    expect(scoreLabel(4)).toBe('Moderate crowds');
    expect(scoreLabel(6)).toBe('Moderate crowds');
  });
  it('returns "Very busy" for scores 7-10', () => {
    expect(scoreLabel(7)).toBe('Very busy');
    expect(scoreLabel(10)).toBe('Very busy');
  });
});

describe('scoreColorClass', () => {
  it('returns emerald class for 1-3', () => {
    expect(scoreColorClass(1)).toBe('text-emerald-400');
    expect(scoreColorClass(3)).toBe('text-emerald-400');
  });
  it('returns amber class for 4-6', () => {
    expect(scoreColorClass(4)).toBe('text-amber-400');
  });
  it('returns rose class for 7-10', () => {
    expect(scoreColorClass(7)).toBe('text-rose-400');
    expect(scoreColorClass(10)).toBe('text-rose-400');
  });
});

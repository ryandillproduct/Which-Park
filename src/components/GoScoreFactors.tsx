interface Props {
  headlinerWaitMinutes: number;
  crowdScore: number;
  minutesUntilClose: number | null;
}

type Tone = 'good' | 'mid' | 'bad';

const GRADIENT: Record<Tone, string> = {
  good: 'linear-gradient(90deg, #9BE0B4, #34D399)',
  mid: 'linear-gradient(90deg, #F6D97A, #E3B23C)',
  bad: 'linear-gradient(90deg, #F3A8B4, #E36074)',
};
// Bar length follows the raw value on a linear scale (label + color stay banded),
// so two parks sharing a label still show which one is ahead.
const clampFill = (v: number) => Math.max(6, Math.min(100, Math.round(v)));
const waitFill = (mins: number) => clampFill(100 - mins * 1.25); // 0 min full, ~75 min floor
const crowdFill = (score: number) => clampFill((11 - score) * 10); // 1/10 full
const timeFill = (mins: number) => clampFill((mins / 600) * 100); // 10+ hrs full

function formatHours(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function waitBand(mins: number): { label: string; tone: Tone } {
  if (mins <= 20) return { label: 'Short', tone: 'good' };
  if (mins <= 45) return { label: 'Moderate', tone: 'mid' };
  return { label: 'Long', tone: 'bad' };
}
function crowdBand(score: number): { label: string; tone: Tone } {
  if (score <= 3) return { label: 'Light', tone: 'good' };
  if (score <= 6) return { label: 'Moderate', tone: 'mid' };
  return { label: 'Heavy', tone: 'bad' };
}
function timeBand(mins: number): { label: string; tone: Tone } {
  if (mins >= 120) return { label: 'Plenty', tone: 'good' };   // 2+ hrs
  if (mins >= 60) return { label: 'Limited', tone: 'mid' };    // 1–2 hrs
  return { label: 'Closing soon', tone: 'bad' };               // under 1 hr
}

function Meter({ label, value, raw, fill, tone, testid }: { label: string; value: string; raw: string; fill: number; tone: Tone; testid: string }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[var(--text-label)]">{label}</span>
        <span className="text-[var(--text)]">
          <span className="font-semibold">{value}</span>
          <span className="text-[var(--text-muted)]"> · {raw}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--track)] overflow-hidden">
        <div
          data-testid={testid}
          className="h-full rounded-full"
          style={{ width: `${fill}%`, background: GRADIENT[tone] }}
        />
      </div>
    </div>
  );
}

export function GoScoreFactors({ headlinerWaitMinutes, crowdScore, minutesUntilClose }: Props) {
  const waits = waitBand(headlinerWaitMinutes);
  const crowd = crowdBand(crowdScore);
  const time = minutesUntilClose !== null ? timeBand(minutesUntilClose) : null;

  return (
    <div className="mb-4">
      <p className="text-[10px] font-bold tracking-wider uppercase text-[var(--text-muted)] mb-3">Go Score factors</p>
      <Meter label="Headliner attraction wait times" value={waits.label} raw={`${headlinerWaitMinutes} min`} fill={waitFill(headlinerWaitMinutes)} tone={waits.tone} testid="meter-fill-waits" />
      <Meter label="Crowd level" value={crowd.label} raw={`${crowdScore}/10`} fill={crowdFill(crowdScore)} tone={crowd.tone} testid="meter-fill-crowd" />
      {time && minutesUntilClose !== null && (
        <Meter label="Park hours remaining" value={time.label} raw={formatHours(Math.max(0, minutesUntilClose))} fill={timeFill(minutesUntilClose)} tone={time.tone} testid="meter-fill-time" />
      )}
    </div>
  );
}

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
const FILL: Record<Tone, number> = { good: 85, mid: 52, bad: 22 };

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
  if (mins >= 300) return { label: 'Plenty', tone: 'good' };
  if (mins >= 60) return { label: 'Limited', tone: 'mid' };
  return { label: 'Closing soon', tone: 'bad' };
}

function Meter({ label, value, tone, testid }: { label: string; value: string; tone: Tone; testid: string }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[#8B7355]">{label}</span>
        <span className="text-[#1C1008] font-semibold">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#EDE8E1] overflow-hidden">
        <div
          data-testid={testid}
          className="h-full rounded-full"
          style={{ width: `${FILL[tone]}%`, background: GRADIENT[tone] }}
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
      <p className="text-[10px] font-bold tracking-wider uppercase text-[#B5A898] mb-3">Go Score factors</p>
      <Meter label="Headliner attraction wait times" value={waits.label} tone={waits.tone} testid="meter-fill-waits" />
      <Meter label="Crowd level" value={crowd.label} tone={crowd.tone} testid="meter-fill-crowd" />
      {time && <Meter label="Park hours remaining" value={time.label} tone={time.tone} testid="meter-fill-time" />}
    </div>
  );
}

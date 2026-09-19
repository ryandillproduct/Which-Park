import { render, screen } from '@testing-library/react';
import { GoScoreFactors } from '@/components/GoScoreFactors';

describe('GoScoreFactors', () => {
  it('renders the three factor meters under the neutral header', () => {
    render(<GoScoreFactors headlinerWaitMinutes={15} crowdScore={3} minutesUntilClose={400} />);
    expect(screen.getByText('Go Score factors')).toBeInTheDocument();
    expect(screen.getByText('Headliner attraction wait times')).toBeInTheDocument();
    expect(screen.getByText('Crowd level')).toBeInTheDocument();
    expect(screen.getByText('Park hours remaining')).toBeInTheDocument();
  });

  it('labels favorable conditions as Short / Light / Plenty', () => {
    render(<GoScoreFactors headlinerWaitMinutes={15} crowdScore={3} minutesUntilClose={400} />);
    expect(screen.getByText('Short')).toBeInTheDocument();
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Plenty')).toBeInTheDocument();
  });

  it('labels unfavorable conditions as Long / Heavy / Closing soon', () => {
    render(<GoScoreFactors headlinerWaitMinutes={55} crowdScore={8} minutesUntilClose={30} />);
    expect(screen.getByText('Long')).toBeInTheDocument();
    expect(screen.getByText('Heavy')).toBeInTheDocument();
    expect(screen.getByText('Closing soon')).toBeInTheDocument();
  });

  it('labels middle conditions as Moderate / Moderate / Limited', () => {
    render(<GoScoreFactors headlinerWaitMinutes={35} crowdScore={5} minutesUntilClose={120} />);
    expect(screen.getAllByText('Moderate').length).toBe(2);
    expect(screen.getByText('Limited')).toBeInTheDocument();
  });

  it('gives a favorable meter a fuller bar than an unfavorable one', () => {
    render(<GoScoreFactors headlinerWaitMinutes={15} crowdScore={8} minutesUntilClose={400} />);
    const waits = screen.getByTestId('meter-fill-waits');
    const crowd = screen.getByTestId('meter-fill-crowd');
    expect(parseInt(waits.style.width)).toBeGreaterThan(parseInt(crowd.style.width));
  });

  it('omits the time meter when the closing time is unknown', () => {
    render(<GoScoreFactors headlinerWaitMinutes={20} crowdScore={4} minutesUntilClose={null} />);
    expect(screen.queryByText('Park hours remaining')).not.toBeInTheDocument();
  });
});

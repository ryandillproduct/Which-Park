import { render, screen, fireEvent } from '@testing-library/react';
import { ParkCard } from '@/components/ParkCard';
import { ScoredPark } from '@/types';

const openPark: ScoredPark = {
  id: 6,
  name: 'Magic Kingdom',
  silhouetteKey: 'magic-kingdom',
  showtimesUrl: 'https://disneyworld.disney.go.com/entertainment/magic-kingdom/',
  themeParksId: '75ea578a-adc8-4116-a54d-dccb60765ef9',
  score: 4,
  label: 'Moderate crowds',
  rides: [
    { id: 1, name: 'Seven Dwarfs Mine Train', is_open: true, wait_time: 10, last_updated: '' },
  ],
  hours: '9 AM – 10 PM',
  isOpen: true,
  closingTimeMs: Date.now() + 90 * 60 * 1000, // 90 min from now
  avgWaitMinutes: 20,
  goScore: 7,
  openAttractionCount: 12,
};

const closedPark: ScoredPark = {
  ...openPark,
  isOpen: false,
  hours: null,
  closingTimeMs: null,
  goScore: 0,
};

describe('ParkCard', () => {
  it('renders park name', () => {
    render(<ParkCard park={openPark} rank={1} headlinerNames={[]} />);
    expect(screen.getByText('Magic Kingdom')).toBeInTheDocument();
  });

  it('shows a gradient icon badge background when the park is open', () => {
    render(<ParkCard park={openPark} rank={1} headlinerNames={[]} />);
    expect(screen.getByTestId('icon-badge')).toHaveClass('icon-badge-open');
  });

  it('does not show the gradient icon badge background when the park is closed', () => {
    render(<ParkCard park={closedPark} rank={null} headlinerNames={[]} />);
    expect(screen.getByTestId('icon-badge')).not.toHaveClass('icon-badge-open');
  });

  it('expands ride list wrapper on click', () => {
    render(<ParkCard park={openPark} rank={1} headlinerNames={[]} />);
    expect(screen.getByTestId('ride-list-wrapper')).not.toHaveClass('expand-grid-open');
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('ride-list-wrapper')).toHaveClass('expand-grid-open');
  });

  it('collapses ride list wrapper on second click', () => {
    render(<ParkCard park={openPark} rank={1} headlinerNames={[]} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('ride-list-wrapper')).not.toHaveClass('expand-grid-open');
  });

  it('does not expand for closed parks', () => {
    render(<ParkCard park={closedPark} rank={null} headlinerNames={[]} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('ride-list-wrapper')).not.toHaveClass('expand-grid-open');
  });

  it('applies the stagger entrance animation with a delay based on rank', () => {
    render(<ParkCard park={openPark} rank={2} headlinerNames={[]} />);
    const card = screen.getByTestId('park-card');
    expect(card).toHaveClass('animate-card-stagger-in');
    expect(card.style.animationDelay).toBe('0.12s');
  });

  it('applies the continuous glow pulse only to the #1 ranked card', () => {
    render(<ParkCard park={openPark} rank={1} headlinerNames={[]} />);
    expect(screen.getByTestId('park-card')).toHaveClass('animate-glow-pulse');
  });

  it('does not apply the glow pulse to a lower-ranked card', () => {
    render(<ParkCard park={openPark} rank={2} headlinerNames={[]} />);
    expect(screen.getByTestId('park-card')).not.toHaveClass('animate-glow-pulse');
  });

  it('applies the icon idle pulse when the park is open', () => {
    render(<ParkCard park={openPark} rank={1} headlinerNames={[]} />);
    expect(screen.getByTestId('icon-badge')).toHaveClass('animate-icon-pulse');
  });

  it('does not apply the icon idle pulse when the park is closed', () => {
    render(<ParkCard park={closedPark} rank={null} headlinerNames={[]} />);
    expect(screen.getByTestId('icon-badge')).not.toHaveClass('animate-icon-pulse');
  });

  it('renders a top pick strip with avg wait, crowd score, and time framing for the #1 card', () => {
    render(<ParkCard park={openPark} rank={1} headlinerNames={[]} />);
    const strip = screen.getByTestId('top-pick-strip');
    expect(strip).toHaveTextContent('Top pick right now');
    expect(strip).toHaveTextContent('20 min avg wait, crowd level 4/10');
    expect(strip).toHaveTextContent('About 1 hr 30 min left until close.');
  });

  it('does not render the top pick strip for lower-ranked cards', () => {
    render(<ParkCard park={openPark} rank={2} headlinerNames={[]} />);
    expect(screen.queryByTestId('top-pick-strip')).not.toBeInTheDocument();
  });

  it('shows the imminent-closing time framing when under 60 minutes remain', () => {
    const almostClosed: ScoredPark = { ...openPark, closingTimeMs: Date.now() + 30 * 60 * 1000 };
    render(<ParkCard park={almostClosed} rank={1} headlinerNames={[]} />);
    expect(screen.getByTestId('top-pick-strip')).toHaveTextContent('Only ~30 min left until close.');
  });

  it('renders the standalone tiebreaker note for non-#1 cards as before', () => {
    const tied: ScoredPark = { ...openPark, tiebreakerNote: 'Lower average wait than Hollywood Studios' };
    render(<ParkCard park={tied} rank={2} headlinerNames={[]} />);
    expect(screen.getByText('Lower average wait than Hollywood Studios')).toBeInTheDocument();
    expect(screen.queryByTestId('top-pick-strip')).not.toBeInTheDocument();
  });

  it('folds an average-wait tiebreaker reason into the top pick strip instead of a separate note', () => {
    const tied: ScoredPark = { ...openPark, tiebreakerNote: 'Lower average wait than Hollywood Studios' };
    render(<ParkCard park={tied} rank={1} headlinerNames={[]} />);
    const strip = screen.getByTestId('top-pick-strip');
    expect(strip).toHaveTextContent('edges out Hollywood Studios on average wait');
    expect(screen.queryByText('Lower average wait than Hollywood Studios')).not.toBeInTheDocument();
  });

  it('folds an open-attractions tiebreaker reason into the top pick strip using the right wording', () => {
    const tied: ScoredPark = { ...openPark, tiebreakerNote: 'More open attractions than EPCOT' };
    render(<ParkCard park={tied} rank={1} headlinerNames={[]} />);
    expect(screen.getByTestId('top-pick-strip')).toHaveTextContent('edges out EPCOT on open attractions');
  });

  it('shows the headliner legend next to the avg wait line', () => {
    render(<ParkCard park={openPark} rank={1} headlinerNames={[]} />);
    expect(screen.getByText(/Headliner attraction/)).toBeInTheDocument();
  });
});

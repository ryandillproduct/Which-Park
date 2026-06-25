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
  closingTimeMs: Date.now() + 5 * 60 * 60 * 1000,
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
});

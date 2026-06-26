import { render, screen } from '@testing-library/react';
import { RideList } from '@/components/RideList';
import { Ride } from '@/types';

const rides: Ride[] = [
  { id: 1, name: 'Seven Dwarfs Mine Train', is_open: true, wait_time: 60, last_updated: '' },
  { id: 2, name: 'Space Mountain', is_open: true, wait_time: 30, last_updated: '' },
  { id: 3, name: 'Pirates of the Caribbean', is_open: true, wait_time: 10, last_updated: '' },
  { id: 4, name: 'Country Bear Jamboree', is_open: false, wait_time: 0, last_updated: '' },
];
const headlinerNames = ['Seven Dwarfs Mine Train'];
const showtimesUrl = 'https://disneyworld.disney.go.com/entertainment/magic-kingdom/';

describe('RideList', () => {
  it('renders all rides', () => {
    render(<RideList rides={rides} headlinerNames={headlinerNames} showtimesUrl={showtimesUrl} />);
    expect(screen.getByText('Seven Dwarfs Mine Train')).toBeInTheDocument();
    expect(screen.getByText('Space Mountain')).toBeInTheDocument();
  });

  it('shows wait times in minutes', () => {
    render(<RideList rides={rides} headlinerNames={headlinerNames} showtimesUrl={showtimesUrl} />);
    expect(screen.getByText('60 min')).toBeInTheDocument();
    expect(screen.getByText('30 min')).toBeInTheDocument();
  });

  it('marks headliner rides with an aria-label star', () => {
    render(<RideList rides={rides} headlinerNames={headlinerNames} showtimesUrl={showtimesUrl} />);
    expect(screen.getByLabelText('Headliner attraction')).toBeInTheDocument();
  });

  it('applies the red wait-time chip color for waits of 46 minutes or more', () => {
    render(<RideList rides={rides} headlinerNames={headlinerNames} showtimesUrl={showtimesUrl} />);
    const chip = screen.getByText('60 min');
    expect(chip).toHaveClass('bg-[#FCE4E6]');
    expect(chip).toHaveClass('text-[#B3273E]');
  });

  it('applies the amber wait-time chip color for waits between 21 and 45 minutes', () => {
    render(<RideList rides={rides} headlinerNames={headlinerNames} showtimesUrl={showtimesUrl} />);
    const chip = screen.getByText('30 min');
    expect(chip).toHaveClass('bg-[#FEF3D6]');
    expect(chip).toHaveClass('text-[#92660A]');
  });

  it('applies the green wait-time chip color for waits of 20 minutes or less', () => {
    render(<RideList rides={rides} headlinerNames={headlinerNames} showtimesUrl={showtimesUrl} />);
    const chip = screen.getByText('10 min');
    expect(chip).toHaveClass('bg-[#E3F6EC]');
    expect(chip).toHaveClass('text-[#1E8E5A]');
  });

  it('shows a neutral gray chip for closed rides', () => {
    render(<RideList rides={rides} headlinerNames={headlinerNames} showtimesUrl={showtimesUrl} />);
    const chip = screen.getByText('Unavailable');
    expect(chip).toHaveClass('bg-[#F0EBE3]');
  });

  it('gives headliner rows a gold left border and non-headliner rows a transparent one', () => {
    render(<RideList rides={rides} headlinerNames={headlinerNames} showtimesUrl={showtimesUrl} />);
    const rows = screen.getAllByTestId('ride-row');
    expect(rows[0]).toHaveClass('border-l-[#F5C842]'); // Seven Dwarfs Mine Train (headliner)
    expect(rows[1]).toHaveClass('border-l-transparent'); // Space Mountain (not a headliner)
  });

  it('applies a staggered animation delay based on row index', () => {
    render(<RideList rides={rides} headlinerNames={headlinerNames} showtimesUrl={showtimesUrl} />);
    const rows = screen.getAllByTestId('ride-row');
    expect((rows[0] as HTMLElement).style.animationDelay).toBe('0s');
    expect((rows[1] as HTMLElement).style.animationDelay).toBe('0.05s');
    expect((rows[2] as HTMLElement).style.animationDelay).toBe('0.1s');
  });
});

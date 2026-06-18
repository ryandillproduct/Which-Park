import { render, screen } from '@testing-library/react';
import { RideList } from '@/components/RideList';
import { Ride } from '@/types';

const rides: Ride[] = [
  { id: 1, name: 'Seven Dwarfs Mine Train', is_open: true, wait_time: 60, last_updated: '' },
  { id: 2, name: 'Space Mountain', is_open: true, wait_time: 30, last_updated: '' },
];
const headlinerNames = ['Seven Dwarfs Mine Train'];

describe('RideList', () => {
  it('renders all rides', () => {
    render(<RideList rides={rides} headlinerNames={headlinerNames} />);
    expect(screen.getByText('Seven Dwarfs Mine Train')).toBeInTheDocument();
    expect(screen.getByText('Space Mountain')).toBeInTheDocument();
  });

  it('shows wait times in minutes', () => {
    render(<RideList rides={rides} headlinerNames={headlinerNames} />);
    expect(screen.getByText('60 min')).toBeInTheDocument();
    expect(screen.getByText('30 min')).toBeInTheDocument();
  });

  it('marks headliner rides with aria-label star', () => {
    render(<RideList rides={rides} headlinerNames={headlinerNames} />);
    expect(screen.getByLabelText('Headliner attraction')).toBeInTheDocument();
  });
});

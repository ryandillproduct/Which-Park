import { render, screen } from '@testing-library/react';
import { ParkEggEffect } from '@/components/easter-eggs/ParkEggEffect';

describe('ParkEggEffect', () => {
  it('renders nothing before the first trigger', () => {
    const { container } = render(<ParkEggEffect silhouetteKey="epcot" playToken={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it.each([
    ['magic-kingdom'],
    ['epcot'],
    ['hollywood-studios'],
    ['animal-kingdom'],
  ] as const)('renders the %s effect after triggering, aria-hidden', (key) => {
    render(<ParkEggEffect silhouetteKey={key} playToken={1} />);
    const layer = screen.getByTestId(`egg-${key}`);
    expect(layer).toBeInTheDocument();
    expect(layer).toHaveAttribute('aria-hidden', 'true');
  });
});

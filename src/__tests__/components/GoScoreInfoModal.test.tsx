import { render, screen } from '@testing-library/react';
import { GoScoreInfoModal } from '@/components/GoScoreInfoModal';

describe('GoScoreInfoModal', () => {
  it('applies the bounce-in entrance to the modal panel', () => {
    render(<GoScoreInfoModal onClose={() => {}} />);
    expect(screen.getByTestId('goscore-modal-panel')).toHaveClass('animate-bounce-in');
  });
});

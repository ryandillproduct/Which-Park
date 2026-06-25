import fs from 'fs';
import path from 'path';

const css = fs.readFileSync(path.join(process.cwd(), 'src/app/globals.css'), 'utf-8');

describe('globals.css motion utilities', () => {
  it('defines the card stagger-in animation', () => {
    expect(css).toContain('@keyframes cardStaggerIn');
    expect(css).toContain('.animate-card-stagger-in');
  });

  it('defines the glow pulse animation', () => {
    expect(css).toContain('@keyframes glowPulse');
    expect(css).toContain('.animate-glow-pulse');
  });

  it('defines the icon pulse animation', () => {
    expect(css).toContain('@keyframes iconPulse');
    expect(css).toContain('.animate-icon-pulse');
  });

  it('defines the bounce-in animation', () => {
    expect(css).toContain('@keyframes bounceIn');
    expect(css).toContain('.animate-bounce-in');
  });

  it('defines the expand-grid utility for smooth expand/collapse', () => {
    expect(css).toContain('.expand-grid');
    expect(css).toContain('.expand-grid-open');
  });

  it('respects prefers-reduced-motion for the looping/entrance animations', () => {
    expect(css).toContain('prefers-reduced-motion: no-preference');
  });

  it('defines the ride row entrance animation', () => {
    expect(css).toContain('@keyframes rideRowIn');
    expect(css).toContain('.animate-ride-row-in');
  });
});

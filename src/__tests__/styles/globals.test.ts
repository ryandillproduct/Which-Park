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

  it('defines the light theme tokens on :root', () => {
    expect(css).toContain('--bg: #FDF8F0');
    expect(css).toContain('--surface: #FFFFFF');
    expect(css).toContain('--text: #1C1008');
    expect(css).toContain('--chip-red-bg: #FCE4E6');
  });

  it('defines warm-dark overrides for system preference and manual toggle', () => {
    expect(css).toContain('@media (prefers-color-scheme: dark)');
    expect(css).toContain('[data-theme="dark"]');
    expect(css).toContain('[data-theme="light"]');
    expect(css).toContain('#17120D');
  });

  it('defines the top-down theme wash transition', () => {
    expect(css).toContain('@keyframes theme-wash-down');
    expect(css).toContain('::view-transition-new(root)');
    expect(css).toContain('clip-path: inset(0 0 100% 0)');
  });

  it('defines the bottom-up wash for switching to light mode', () => {
    expect(css).toContain('@keyframes theme-wash-up');
    expect(css).toContain('clip-path: inset(100% 0 0 0)');
    expect(css).toContain('.vt-wash-up');
  });
});

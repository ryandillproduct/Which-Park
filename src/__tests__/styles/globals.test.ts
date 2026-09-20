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

  it('defines the theme wash transition driven by a directional custom property', () => {
    expect(css).toContain('@keyframes theme-wash');
    expect(css).toContain('::view-transition-new(root)');
    // direction comes from --wash-from (set per-toggle in ThemeToggle), with a
    // top-down default fallback
    expect(css).toContain('var(--wash-from');
    expect(css).toContain('inset(0 0 100% 0)');
  });
});

describe('globals.css closed-park easter eggs', () => {
  it('defines the fireworks spark animation', () => {
    expect(css).toContain('@keyframes eggSpark');
    expect(css).toContain('.egg-spark');
  });
  it('defines the rocket launch animation', () => {
    expect(css).toContain('@keyframes eggLaunch');
    expect(css).toContain('.egg-rocket');
  });
  it('defines the searchlight night, sweep, and clapper snap animations', () => {
    expect(css).toContain('@keyframes eggNightFade');
    expect(css).toContain('@keyframes eggSweepL');
    expect(css).toContain('@keyframes eggSweepR');
    expect(css).toContain('@keyframes eggSnap');
    expect(css).toContain('.egg-clap-top');
  });
  it('defines the sleeping sloth animation', () => {
    expect(css).toContain('@keyframes eggSlothIn');
    expect(css).toContain('.egg-sloth');
  });
  it('gates egg motion behind prefers-reduced-motion: no-preference', () => {
    const eggSection = css.slice(css.indexOf('Closed-park Easter eggs'));
    expect(eggSection).toContain('prefers-reduced-motion: no-preference');
  });
});

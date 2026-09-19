export function RecommendedBanner() {
  return (
    <div
      data-testid="recommended-banner"
      className="mb-6 px-5 py-4 rounded-2xl bg-[var(--surface)] text-center animate-bounce-in"
    >
      <p className="text-[var(--text-muted)] text-sm">
        All parks are closed right now. Check back once the parks reopen for live rankings.
      </p>
    </div>
  );
}

/**
 * Shared hero backdrop — vertical electric-blue beam + dot grid.
 * Used directly under <TabBar /> on Analyze, Roadmap, and Library so
 * the backdrop looks identical and is anchored in the same place.
 *
 * The wrapper has a fixed height so the absolutely-positioned beam
 * renders consistently; the negative bottom margin lets following
 * content sit inside the glow (matching the original Analyze layout).
 */
export function HeroBeam() {
  return (
    <div
      aria-hidden
      className="relative isolate h-[180px] -mb-[140px] pointer-events-none"
    >
      <div className="hero-beam" />
      <div className="hero-grid absolute inset-0 -z-10" />
    </div>
  );
}

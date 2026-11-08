/**
 * Dark grayscale overlay between the video (z-0) and the UI (z-10) to improve
 * readability (Requirement 1.7). Opacity sits in the 40–60% range.
 */
export function Overlay() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[5] bg-black/55"
      style={{
        background:
          "radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0.75) 100%)",
      }}
    />
  );
}

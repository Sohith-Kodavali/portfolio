export default function GridOverlay() {
  // Three rules, not twelve.
  //
  // This used to be a full 12-column grid with a crosshair at every
  // intersection: 12 lines plus 65 registration marks. At that density it stops
  // reading as structure and starts reading as texture — which is the opposite
  // of the clean, sparsely-ruled feel it was meant to echo.
  return (
    <div className="grid-lines" aria-hidden>
      <div className="grid-frame">
        <div className="grid-cols">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

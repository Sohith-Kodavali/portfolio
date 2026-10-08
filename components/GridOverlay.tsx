export default function GridOverlay() {
  const marks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="grid-lines" aria-hidden>
      <div className="grid-frame">
        <div className="grid-cols">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} />
          ))}
        </div>
        {marks.map((y) =>
          Array.from({ length: 13 }).map((_, i) => (
            <i
              key={`${y}-${i}`}
              className="grid-plus"
              style={{ left: `${(i / 12) * 100}%`, top: `${y * 100}%` }}
            />
          ))
        )}
      </div>
    </div>
  );
}

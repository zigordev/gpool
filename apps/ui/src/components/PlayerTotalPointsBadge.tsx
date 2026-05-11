export function PointsBadge({ points, label }: Readonly<{ points: number; label: string }>) {
  return (
    <span
      title={label}
      aria-label={label}
      style={{
        position: 'absolute',
        top: '-0.45rem',
        right: '-0.45rem',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '1.6rem',
        padding: '0.18rem 0.45rem',
        borderRadius: '999px',
        background: 'linear-gradient(135deg, rgb(var(--gold)), rgb(var(--sunset)))',
        color: 'rgb(var(--accent-fg))',
        fontSize: '0.72rem',
        fontWeight: 800,
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
        border: '2px solid rgb(var(--bg-elevated))',
        boxShadow: '0 4px 12px rgb(15 23 42 / 0.20)',
        zIndex: 2,
        pointerEvents: 'none',
      }}
    >
      {points}
    </span>
  );
}
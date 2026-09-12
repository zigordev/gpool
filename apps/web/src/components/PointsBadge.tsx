export function PointsBadge({
  points,
  label,
  compact = false,
}: Readonly<{
  points: number;
  label: string;
  compact?: boolean;
}>) {
  return (
    <span
      title={label}
      aria-label={label}
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        transform: 'translate(50%, -50%)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: compact ? '1.2rem' : '1.6rem',
        padding: compact ? '0.1rem 0.3rem' : '0.18rem 0.45rem',
        borderRadius: '999px',
        background: 'linear-gradient(135deg, rgb(var(--gold)), rgb(var(--sunset)))',
        color: 'rgb(var(--accent-fg))',
        fontSize: compact ? '0.58rem' : '0.72rem',
        fontWeight: 800,
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
        border: `${compact ? 1 : 2}px solid rgb(var(--bg-elevated))`,
        boxShadow: compact
          ? '0 2px 7px rgb(15 23 42 / 0.18)'
          : '0 4px 12px rgb(15 23 42 / 0.20)',
        zIndex: 2,
        pointerEvents: 'none',
      }}
    >
      {points}
    </span>
  );
}

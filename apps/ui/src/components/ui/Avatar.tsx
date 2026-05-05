'use client';

interface Props {
  label: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  /** When true, the avatar uses the accent gradient. Default true. */
  gradient?: boolean;
  title?: string;
}

function initialsOf(value: string | undefined | null): string {
  if (!value) return '?';
  const trimmed = value.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0] + parts[1]![0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

export function Avatar({ label, size = 'md', className = '', gradient = true, title }: Props) {
  const dim = {
    xs: { box: '1.5rem', font: '0.65rem' },
    sm: { box: '1.75rem', font: '0.7rem' },
    md: { box: '2rem', font: '0.75rem' },
    lg: { box: '2.5rem', font: '0.85rem' },
  }[size];

  const style: React.CSSProperties = {
    width: dim.box,
    height: dim.box,
    fontSize: dim.font,
    background: gradient
      ? 'linear-gradient(135deg, rgb(var(--accent-from)), rgb(var(--accent-to)))'
      : 'rgb(var(--bg-subtle))',
    color: gradient ? 'rgb(var(--accent-fg))' : 'rgb(var(--fg))',
    border: gradient ? '2px solid rgb(var(--bg-elevated))' : '1px solid rgb(var(--border))',
  };

  return (
    <span className={`avatar ${className}`.trim()} style={style} aria-label={title ?? label} title={title}>
      {initialsOf(label)}
    </span>
  );
}

export function AvatarStack({
  labels,
  max = 4,
  size = 'sm',
}: {
  labels: string[];
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}) {
  const visible = labels.slice(0, max);
  const overflow = labels.length - visible.length;

  return (
    <span className="avatar-stack">
      {visible.map((label, i) => (
        <Avatar key={`${label}-${i}`} label={label} size={size} />
      ))}
      {overflow > 0 ? (
        <span
          className="avatar"
          style={{
            width: size === 'sm' ? '1.75rem' : '2rem',
            height: size === 'sm' ? '1.75rem' : '2rem',
            fontSize: '0.7rem',
            background: 'rgb(var(--bg-subtle))',
            color: 'rgb(var(--fg-muted))',
            border: '1px solid rgb(var(--border))',
          }}
          aria-label={`+${overflow} more`}
        >
          +{overflow}
        </span>
      ) : null}
    </span>
  );
}

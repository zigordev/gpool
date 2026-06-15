import { teamKitColors } from '@/lib/team-kit-colors';

export function PlayerShirt({
  teamName,
  size = 28,
}: Readonly<{
  teamName: string;
  size?: number;
}>) {
  const colors = teamKitColors(teamName);
  const renderedSize = size * 1.1;

  return (
    <svg
      aria-hidden
      viewBox="0 0 40 40"
      width={renderedSize}
      height={renderedSize}
      style={{
        display: 'block',
        flexShrink: 0,
        filter: 'drop-shadow(0 1px 1px rgb(15 23 42 / 0.18))',
      }}
    >
      <path
        d="M11 5.5 16 3h8l5 2.5 8 7-5 6-3-2.5V37H11V16l-3 2.5-5-6 8-7Z"
        fill={colors.primary}
        stroke="rgb(15 23 42 / 0.34)"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path
        d="M16 3c.6 2.2 2 3.3 4 3.3S23.4 5.2 24 3"
        fill="none"
        stroke={colors.secondary}
        strokeWidth="2.2"
      />
      <path
        d="M11 14.5 7.7 17 4 12.5l2.2-1.9L11 14.5Zm18 0 3.3 2.5 3.7-4.5-2.2-1.9L29 14.5Z"
        fill={colors.secondary}
      />
      <path d="M11 33h18v4H11z" fill={colors.secondary} opacity="0.9" />
    </svg>
  );
}

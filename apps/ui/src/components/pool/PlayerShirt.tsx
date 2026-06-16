import { teamKitColors } from '@/lib/team-kit-colors';

function hexLuminance(hexColor: string) {
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) return 0;
  const [r, g, b] = [0, 2, 4].map((start) => {
    const channel = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function PlayerShirt({
  teamName,
  shirtNumber,
  size = 28,
}: Readonly<{
  teamName: string;
  shirtNumber?: number | string | null;
  size?: number;
}>) {
  const colors = teamKitColors(teamName);
  const renderedSize = size * 1.1;
  const displayNumber =
    shirtNumber === null || shirtNumber === undefined || String(shirtNumber).trim() === ''
      ? ''
      : String(shirtNumber);
  const isLightShirt = hexLuminance(colors.primary) > 0.48;
  const numberFill = isLightShirt ? '#111827' : '#ffffff';
  const numberStroke = isLightShirt ? 'rgb(255 255 255 / 0.88)' : 'rgb(15 23 42 / 0.62)';

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
      {displayNumber ? (
        <text
          x="20"
          y="25.5"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={numberFill}
          stroke={numberStroke}
          strokeWidth="0.8"
          paintOrder="stroke fill"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize={displayNumber.length > 2 ? 10 : 13}
          fontWeight="800"
        >
          {displayNumber}
        </text>
      ) : null}
    </svg>
  );
}

"use client";

interface SparkLineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
}

export function SparkLine({
  data,
  color,
  width = 64,
  height = 28,
  strokeWidth = 1.5,
}: SparkLineProps) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Auto-detect trend if no color provided
  const last = data[data.length - 1];
  const first = data[0];
  const autoColor = color ?? (last > first ? "#ef4444" : last < first ? "#22c55e" : "#6b7280");

  const pad = strokeWidth;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  const points = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * innerW;
      const y = pad + (1 - (v - min) / range) * innerH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  // Fill area under line
  const firstX = pad;
  const lastX = pad + innerW;
  const bottomY = pad + innerH;
  const fillPoints = `${firstX},${bottomY} ${points} ${lastX},${bottomY}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Sparkline trend chart"
    >
      {/* Gradient fill */}
      <defs>
        <linearGradient id={`sg-${autoColor.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={autoColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={autoColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={fillPoints}
        fill={`url(#sg-${autoColor.replace("#", "")})`}
      />
      <polyline
        points={points}
        stroke={autoColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Last point dot */}
      {(() => {
        const lastIdx = data.length - 1;
        const lx = pad + innerW;
        const ly = pad + (1 - (last - min) / range) * innerH;
        return (
          <circle cx={lx.toFixed(1)} cy={ly.toFixed(1)} r="2" fill={autoColor} />
        );
      })()}
    </svg>
  );
}

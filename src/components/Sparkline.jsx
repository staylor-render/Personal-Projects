// Minimal inline SVG sparkline for flow trend
export default function Sparkline({ data, color = '#34d399', height = 32 }) {
  if (!data || data.length < 2) return null;

  const values = data.map(d => d.v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const w = 120;
  const h = height;
  const pad = 2;

  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });

  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="overflow-visible"
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points.join(' ')}
        opacity="0.8"
      />
    </svg>
  );
}

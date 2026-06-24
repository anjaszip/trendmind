'use client';

interface DataPoint {
  date: string;
  searchAcceleration: number | null;
  videoVelocity: number | null;
}

interface Props {
  data: DataPoint[];
  height?: number;
}

const COLORS = {
  searchAcceleration: '#1d4ed8',
  videoVelocity: '#15803d',
};

export function TrendChart({ data, height = 120 }: Props) {
  if (data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '0.8rem' }}>
        No historical data available
      </div>
    );
  }

  const saValues = data.map((d) => d.searchAcceleration ?? 0);
  const vvValues = data.map((d) => d.videoVelocity ?? 0);
  const allValues = [...saValues, ...vvValues];
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const range = maxVal - minVal || 1;
  const padding = { top: 10, right: 10, bottom: 24, left: 36 };
  const chartW = 400;
  const chartH = height - padding.top - padding.bottom;
  const stepX = data.length > 1 ? chartW / (data.length - 1) : chartW;

  const toY = (v: number) => chartH - ((v - minVal) / range) * chartH;
  const toX = (i: number) => i * stepX;

  const buildPath = (values: number[]) =>
    values
      .map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`)
      .join(' ');

  const labelIndices = [0, Math.floor(data.length / 2), data.length - 1].filter(
    (v, i, a) => a.indexOf(v) === i,
  );

  return (
    <div style={{ width: '100%' }}>
      <svg
        viewBox={`0 0 ${chartW + padding.left + padding.right} ${height}`}
        style={{ width: '100%', height }}
        aria-label="Trend chart"
      >
        <g transform={`translate(${padding.left},${padding.top})`}>
          {/* Y-axis labels */}
          {[minVal, (minVal + maxVal) / 2, maxVal].map((v, i) => (
            <text key={i} x={-4} y={toY(v) + 4} textAnchor="end" fontSize="10" fill="#9ca3af">
              {v.toFixed(1)}
            </text>
          ))}

          {/* Grid lines */}
          {[0, 0.5, 1].map((t) => {
            const y = toY(minVal + t * range);
            return (
              <line key={t} x1={0} y1={y} x2={chartW} y2={y} stroke="#f3f4f6" strokeWidth={1} />
            );
          })}

          {/* Lines */}
          <path d={buildPath(saValues)} fill="none" stroke={COLORS.searchAcceleration} strokeWidth={2} />
          <path d={buildPath(vvValues)} fill="none" stroke={COLORS.videoVelocity} strokeWidth={2} strokeDasharray="4 2" />

          {/* X-axis labels */}
          {labelIndices.map((i) => (
            <text key={i} x={toX(i)} y={chartH + 16} textAnchor="middle" fontSize="10" fill="#9ca3af">
              {data[i].date}
            </text>
          ))}
        </g>
      </svg>

      <div style={{ display: 'flex', gap: 12, fontSize: '0.7rem', color: '#6b7280', marginTop: 4 }}>
        <span><span style={{ color: COLORS.searchAcceleration, fontWeight: 600 }}>—</span> Search accel</span>
        <span><span style={{ color: COLORS.videoVelocity, fontWeight: 600 }}>- -</span> Video velocity</span>
      </div>
    </div>
  );
}

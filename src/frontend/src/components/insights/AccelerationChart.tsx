'use client';

import { useMemo } from 'react';
import type { AccelerationPoint } from '@/hooks/useKeywordDetail';

interface AccelerationChartProps {
  data: AccelerationPoint[];
}

interface Series {
  key: keyof AccelerationPoint;
  label: string;
  color: string;
}

const SERIES: Series[] = [
  { key: 'searchAcceleration', label: 'Search Accel', color: '#2563eb' },
  { key: 'videoVelocity', label: 'Video Velocity', color: '#16a34a' },
  { key: 'creatorAdoptionRate', label: 'Creator Adoption', color: '#9333ea' },
];

const W = 560;
const H = 180;
const PAD = { top: 16, right: 16, bottom: 32, left: 48 };

function normalize(values: (number | null)[]): { min: number; max: number } {
  const nums = values.filter((v): v is number => v != null);
  if (nums.length === 0) return { min: 0, max: 1 };
  const min = Math.min(0, ...nums);
  const max = Math.max(...nums);
  return { min, max: max === min ? min + 1 : max };
}

function toPath(
  points: AccelerationPoint[],
  key: keyof AccelerationPoint,
  min: number,
  max: number,
): string {
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const step = points.length > 1 ? innerW / (points.length - 1) : 0;

  const coords = points
    .map((p, i) => {
      const v = p[key] as number | null;
      if (v == null) return null;
      const x = PAD.left + i * step;
      const y = PAD.top + innerH - ((v - min) / (max - min)) * innerH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .filter(Boolean);

  return coords.length > 1 ? `M${coords.join('L')}` : '';
}

function xLabel(point: AccelerationPoint): string {
  return new Date(point.calculationTimestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function AccelerationChart({ data }: AccelerationChartProps) {
  const allValues = useMemo(
    () => data.flatMap((p) => SERIES.map((s) => p[s.key] as number | null)),
    [data],
  );
  const { min, max } = normalize(allValues);

  if (data.length === 0) {
    return (
      <section className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-3">30-Day Acceleration</h2>
        <p className="text-sm text-gray-400 italic text-center py-8">No historical data yet.</p>
      </section>
    );
  }

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const step = data.length > 1 ? innerW / (data.length - 1) : 0;

  const yTicks = [min, (min + max) / 2, max].map((v) => ({
    value: v,
    y: PAD.top + innerH - ((v - min) / (max - min)) * innerH,
    label: v.toFixed(2),
  }));

  const xTickIndices = data.length <= 7
    ? data.map((_, i) => i)
    : [0, Math.floor(data.length / 2), data.length - 1];

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-5">
      <h2 className="text-base font-semibold text-gray-900 mb-3">30-Day Acceleration</h2>

      <div className="overflow-x-auto">
        <svg width={W} height={H} className="block" aria-label="Acceleration metrics over 30 days">
          {/* Grid lines */}
          {yTicks.map((t) => (
            <g key={t.value}>
              <line
                x1={PAD.left} x2={W - PAD.right}
                y1={t.y} y2={t.y}
                stroke="#f0f0f0" strokeWidth="1"
              />
              <text x={PAD.left - 6} y={t.y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">
                {t.label}
              </text>
            </g>
          ))}

          {/* Axes */}
          <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={H - PAD.bottom} stroke="#e5e7eb" />
          <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} stroke="#e5e7eb" />

          {/* Data lines */}
          {SERIES.map((s) => {
            const path = toPath(data, s.key, min, max);
            return path ? (
              <path key={s.key} d={path} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" />
            ) : null;
          })}

          {/* X-axis labels */}
          {xTickIndices.map((i) => (
            <text
              key={i}
              x={PAD.left + i * step}
              y={H - PAD.bottom + 14}
              textAnchor="middle"
              fontSize="10"
              fill="#9ca3af"
            >
              {xLabel(data[i])}
            </text>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-2">
        {SERIES.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5 text-xs text-gray-600">
            <div className="w-3 h-0.5 rounded" style={{ backgroundColor: s.color }} />
            {s.label}
          </div>
        ))}
      </div>
    </section>
  );
}

import type { TrendPoint } from '../lib/h3ListingsTrend';

interface TrendLineChartProps {
  data: TrendPoint[];
}

const WIDTH = 280;
const HEIGHT = 140;
const PADDING = { top: 12, right: 12, bottom: 28, left: 32 };

function chartPoint(
  index: number,
  count: number,
  value: number,
  maxValue: number,
): [number, number] {
  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const x = PADDING.left + (index / Math.max(1, count - 1)) * plotWidth;
  const y = PADDING.top + plotHeight - (value / maxValue) * plotHeight;
  return [x, y];
}

export default function TrendLineChart({ data }: TrendLineChartProps) {
  const maxValue = Math.max(1, ...data.map((point) => point.listings));
  const linePoints = data
    .map((point, index) => {
      const [x, y] = chartPoint(index, data.length, point.listings, maxValue);
      return `${x},${y}`;
    })
    .join(' ');

  const firstYear = data[0]?.year ?? 2017;
  const lastYear = data[data.length - 1]?.year ?? 2026;
  const midYear = data[Math.floor(data.length / 2)]?.year ?? 2021;

  return (
    <div className="trend-chart">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="trend-chart__svg"
        role="img"
        aria-label={`Listings pro Jahr von ${firstYear} bis ${lastYear}`}
      >
        <line
          x1={PADDING.left}
          y1={PADDING.top + (HEIGHT - PADDING.top - PADDING.bottom)}
          x2={WIDTH - PADDING.right}
          y2={PADDING.top + (HEIGHT - PADDING.top - PADDING.bottom)}
          className="trend-chart__axis"
        />
        <line
          x1={PADDING.left}
          y1={PADDING.top}
          x2={PADDING.left}
          y2={PADDING.top + (HEIGHT - PADDING.top - PADDING.bottom)}
          className="trend-chart__axis"
        />

        <text
          x={PADDING.left - 6}
          y={PADDING.top + (HEIGHT - PADDING.top - PADDING.bottom)}
          className="trend-chart__tick"
          textAnchor="end"
          dominantBaseline="middle"
        >
          0
        </text>
        <text
          x={PADDING.left - 6}
          y={PADDING.top}
          className="trend-chart__tick"
          textAnchor="end"
          dominantBaseline="middle"
        >
          {maxValue}
        </text>

        <polyline points={linePoints} className="trend-chart__line" fill="none" />

        {data.map((point, index) => {
          const [x, y] = chartPoint(index, data.length, point.listings, maxValue);
          return <circle key={point.year} cx={x} cy={y} r={3} className="trend-chart__dot" />;
        })}

        <text
          x={PADDING.left}
          y={HEIGHT - 6}
          className="trend-chart__tick"
          textAnchor="start"
        >
          {firstYear}
        </text>
        <text
          x={WIDTH / 2}
          y={HEIGHT - 6}
          className="trend-chart__tick"
          textAnchor="middle"
        >
          {midYear}
        </text>
        <text
          x={WIDTH - PADDING.right}
          y={HEIGHT - 6}
          className="trend-chart__tick"
          textAnchor="end"
        >
          {lastYear}
        </text>
      </svg>
    </div>
  );
}

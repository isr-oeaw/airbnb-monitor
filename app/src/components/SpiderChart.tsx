import type { RadarAxis } from '../lib/h3Indicators';

interface SpiderChartProps {
  axes: RadarAxis[];
}

const SIZE = 220;
const CENTER = SIZE / 2;
const RADIUS = 78;
const LABEL_OFFSET = 18;

function axisPoint(index: number, count: number, radius: number): [number, number] {
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
  return [
    CENTER + radius * Math.cos(angle),
    CENTER + radius * Math.sin(angle),
  ];
}

function polygonPoints(values: number[]): string {
  return values
    .map((value, index) => {
      const [x, y] = axisPoint(index, values.length, RADIUS * value);
      return `${x},${y}`;
    })
    .join(' ');
}

export default function SpiderChart({ axes }: SpiderChartProps) {
  const count = axes.length;
  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <div className="spider-chart">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="spider-chart__svg"
        role="img"
        aria-label="Radar-Diagramm der H3-Kennzahlen"
      >
        {gridLevels.map((level) => (
          <polygon
            key={level}
            points={polygonPoints(Array(count).fill(level))}
            className="spider-chart__grid"
          />
        ))}

        {axes.map((axis, index) => {
          const [x, y] = axisPoint(index, count, RADIUS);
          return (
            <line
              key={axis.key}
              x1={CENTER}
              y1={CENTER}
              x2={x}
              y2={y}
              className="spider-chart__axis"
            />
          );
        })}

        <polygon
          points={polygonPoints(axes.map((axis) => axis.normalized))}
          className="spider-chart__value"
        />

        {axes.map((axis, index) => {
          const [x, y] = axisPoint(index, count, RADIUS + LABEL_OFFSET);
          return (
            <text
              key={`${axis.key}-label`}
              x={x}
              y={y}
              className="spider-chart__label"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {axis.label}
            </text>
          );
        })}
      </svg>

      <ul className="spider-chart__values">
        {axes.map((axis) => (
          <li key={axis.key} className="spider-chart__value-item">
            <span className="spider-chart__value-label">{axis.label}</span>
            <span className="spider-chart__value-raw">{axis.format(axis.raw)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

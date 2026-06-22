'use client';

import React, { useState } from 'react';
import { formatCurrency } from '@/lib/formatters';

// 1. CASHFLOW CHART
interface CashflowDataPoint {
  month: string;
  inflow: number;
  outflow: number;
  balance: number;
}

interface CashflowChartProps {
  data: CashflowDataPoint[];
}

export function CashflowChart({ data }: CashflowChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeLegend, setActiveLegend] = useState({ inflow: true, outflow: true, balance: true });

  const maxInflow = Math.max(...data.map(d => d.inflow));
  const maxOutflow = Math.max(...data.map(d => d.outflow));
  const maxVal = Math.max(maxInflow, maxOutflow, 50000); // base cap for scaling

  // Svg metrics
  const paddingX = 60;
  const paddingY = 40;
  const svgWidth = 800;
  const svgHeight = 280;
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;

  // Calculating coordinate lines
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  // Map data to coordinates for line chart (Net balance)
  const linePoints = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * chartWidth;
    // Scale balance. Standardize to range [-val, val] to support negative balance gracefully, but for simplicity let's map [0, maxVal]
    const ratio = d.balance / maxVal;
    const y = svgHeight - paddingY - (ratio * chartHeight);
    return { x, y, ...d };
  });

  return (
    <div className="relative p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)]">
      {/* Chart Headers and Toggles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
            Fluxo de Caixa Mensal
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">Projetado &amp; Realizado dos últimos 6 meses</p>
        </div>

        {/* Legend buttons to toggle dataset visibility */}
        <div className="flex items-center gap-4 text-xs">
          <button
            onClick={() => setActiveLegend(l => ({ ...l, inflow: !l.inflow }))}
            className={`flex items-center gap-1.5 transition-opacity ${activeLegend.inflow ? 'opacity-100' : 'opacity-40'}`}
          >
            <span className="w-3 h-3 rounded-sm bg-green-500 block"></span>
            <span className="text-[var(--text-secondary)] font-mono">Entradas</span>
          </button>
          <button
            onClick={() => setActiveLegend(l => ({ ...l, outflow: !l.outflow }))}
            className={`flex items-center gap-1.5 transition-opacity ${activeLegend.outflow ? 'opacity-100' : 'opacity-40'}`}
          >
            <span className="w-3 h-3 rounded-sm bg-red-500 block"></span>
            <span className="text-[var(--text-secondary)] font-mono">Saídas</span>
          </button>
          <button
            onClick={() => setActiveLegend(l => ({ ...l, balance: !l.balance }))}
            className={`flex items-center gap-1.5 transition-opacity ${activeLegend.balance ? 'opacity-100' : 'opacity-40'}`}
          >
            <span className="w-4 h-0.5 bg-blue-400 block"></span>
            <span className="text-[var(--text-secondary)] font-mono">Saldo Líquido</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full min-w-[700px] select-none h-auto"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Y-Axis Gridlines */}
          {gridLines.map((gl, i) => {
            const y = paddingY + gl * chartHeight;
            const val = maxVal * (1 - gl);
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={svgWidth - paddingX}
                  y2={y}
                  stroke="var(--border-soft)"
                  strokeWidth="0.75"
                  strokeDasharray="4 6"
                />
                <text
                  x={paddingX - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="font-mono text-[10px] fill-[var(--text-muted)]"
                >
                  {formatCurrency(val).replace(',00', '')}
                </text>
              </g>
            );
          })}

          {/* Monthly Blocks / Bars */}
          {data.map((d, i) => {
            const barCount = (activeLegend.inflow ? 1 : 0) + (activeLegend.outflow ? 1 : 0);
            const colWidth = chartWidth / data.length;
            const colCenterX = paddingX + i * colWidth + colWidth / 2;
            const isHovered = hoveredIndex === i;

            const inflowHeight = (d.inflow / maxVal) * chartHeight;
            const outflowHeight = (d.outflow / maxVal) * chartHeight;

            // Bar dimensions
            const barWidth = 14;
            const gap = 3;

            // Compute positions
            const inflowX = colCenterX - (barCount === 2 ? barWidth + gap / 2 : barWidth / 2);
            const outflowX = colCenterX + (barCount === 2 ? gap / 2 : -barWidth / 2);

            const inflowY = svgHeight - paddingY - inflowHeight;
            const outflowY = svgHeight - paddingY - outflowHeight;

            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredIndex(i)}
                className="cursor-pointer"
              >
                {/* Column transparent trigger background for easy hovering */}
                <rect
                  x={paddingX + i * colWidth}
                  y={paddingY}
                  width={colWidth}
                  height={chartHeight}
                  fill="transparent"
                />

                {/* Vertical column highlight on hover */}
                {isHovered && (
                  <rect
                    x={paddingX + i * colWidth + 4}
                    y={paddingY}
                    width={colWidth - 8}
                    height={chartHeight}
                    fill="var(--bg-card-hover)"
                    opacity="0.4"
                    rx="6"
                  />
                )}

                {/* INFLOW BAR */}
                {activeLegend.inflow && (
                  <rect
                    x={inflowX}
                    y={inflowY}
                    width={barWidth}
                    height={inflowHeight}
                    fill="currentColor"
                    className="text-green-500 opacity-90 transition-all hover:opacity-100"
                    rx="3"
                  />
                )}

                {/* OUTFLOW BAR */}
                {activeLegend.outflow && (
                  <rect
                    x={outflowX}
                    y={outflowY}
                    width={barWidth}
                    height={outflowHeight}
                    fill="currentColor"
                    className="text-red-500 opacity-90 transition-all hover:opacity-100"
                    rx="3"
                  />
                )}

                {/* X-Axis labels */}
                <text
                  x={colCenterX}
                  y={svgHeight - paddingY + 20}
                  textAnchor="middle"
                  className="font-sans text-[11px] font-semibold fill-[var(--text-secondary)]"
                >
                  {d.month}
                </text>
              </g>
            );
          })}

          {/* NET BALANCE LINE OVERLAY */}
          {activeLegend.balance && (
            <>
              {/* Solid Blue Trend Line */}
              <path
                d={linePoints.reduce((acc, p, i) => {
                  return acc + `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
                }, '')}
                fill="none"
                stroke="var(--color-info)"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="transition-all"
              />

              {/* Data points markers */}
              {linePoints.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={hoveredIndex === i ? 6 : 4}
                  fill="var(--bg-card)"
                  stroke="var(--color-info)"
                  strokeWidth="2.5"
                  className="transition-all"
                  onMouseEnter={() => setHoveredIndex(i)}
                />
              ))}
            </>
          )}
        </svg>
      </div>

      {/* FLOATING HOVER TOOLTIP */}
      {hoveredIndex !== null && (
        <div
          className="absolute z-10 p-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-card)] glow-brand text-xs min-w-[170px]"
          style={{
            left: `${Math.min(sidebarPosition(hoveredIndex, data.length), 80)}%`,
            top: '50px'
          }}
        >
          <p className="font-sans font-bold text-[var(--text-primary)] mb-2.5 border-b border-[var(--border-soft)] pb-1">
            {data[hoveredIndex].month}
          </p>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center gap-4">
              <span className="text-[var(--text-secondary)]">Entradas:</span>
              <span className="font-mono text-green-500 font-semibold">
                {formatCurrency(data[hoveredIndex].inflow)}
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-[var(--text-secondary)]">Saídas:</span>
              <span className="font-mono text-red-500 font-semibold">
                {formatCurrency(data[hoveredIndex].outflow)}
              </span>
            </div>
            <div className="flex justify-between items-center gap-4 border-t border-[var(--border-soft)] pt-1 mt-1 font-semibold">
              <span className="text-[var(--text-primary)]">Saldo:</span>
              <span className="font-mono text-blue-400">
                {formatCurrency(data[hoveredIndex].balance)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple percentage helper to move tooltip along
function sidebarPosition(index: number, total: number) {
  return ((index + 0.3) / total) * 100;
}


// 2. PROJECTION CHART WITH CONFIDENCE BAND
interface ProjectionPoint {
  day: string;
  realized?: number;
  projected: number;
  lowerBound: number;
  upperBound: number;
}

interface ProjectionChartProps {
  data: ProjectionPoint[];
}

export function ProjectionChart({ data }: ProjectionChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const values = data.flatMap(d => [d.upperBound, d.lowerBound, d.projected]);
  const minVal = Math.min(...values) - 5000;
  const maxVal = Math.max(...values) + 5000;
  const range = maxVal - minVal;

  const paddingX = 60;
  const paddingY = 40;
  const svgWidth = 800;
  const svgHeight = 240;
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;

  // Grid line levels
  const levels = [0, 0.25, 0.5, 0.75, 1];

  // Map to coordinates helper
  const getCoords = (d: ProjectionPoint, i: number, key: 'projected' | 'lowerBound' | 'upperBound') => {
    const x = paddingX + (i / (data.length - 1)) * chartWidth;
    const y = svgHeight - paddingY - (((d[key] - minVal) / range) * chartHeight);
    return { x, y };
  };

  const pointsProjected = data.map((d, i) => getCoords(d, i, 'projected'));
  const pointsUpper = data.map((d, i) => getCoords(d, i, 'upperBound'));
  const pointsLower = data.map((d, i) => getCoords(d, i, 'lowerBound'));

  // Building SVG area path for confidence band (upper points connected then reverse lower points)
  let areaD = '';
  if (data.length > 0) {
    const topPath = pointsUpper.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const bottomPath = [...pointsLower]
      .reverse()
      .map((p) => `L ${p.x} ${p.y}`)
      .join(' ');
    areaD = `${topPath} ${bottomPath} Z`;
  }

  return (
    <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
            Previsão Avançada de Caixa
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">Próximos 30 dias com intervalo de confiança de ±15%</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-3 bg-brand/10 border border-brand/30 block rounded-sm"></span>
            <span className="text-[var(--text-muted)]">Zona de Probabilidade</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-t-2 border-brand block"></span>
            <span className="text-[var(--text-muted)] font-mono">Tendência Central</span>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full min-w-[700px] h-auto select-none"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Y levels */}
          {levels.map((lvl, idx) => {
            const y = paddingY + lvl * chartHeight;
            const val = minVal + (1 - lvl) * range;
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={svgWidth - paddingX}
                  y2={y}
                  stroke="var(--border-soft)"
                  strokeWidth="0.5"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="font-mono text-[9px] fill-[var(--text-muted)]"
                >
                  {formatCurrency(val).replace(',00', '')}
                </text>
              </g>
            );
          })}

          {/* Area confidence shadow */}
          {areaD && (
            <path
              d={areaD}
              fill="currentColor"
              className="text-brand"
              opacity="0.1"
              stroke="transparent"
            />
          )}

          {/* Upper bound dashed line */}
          <path
            d={pointsUpper.reduce((acc, p, i) => acc + `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')}
            fill="none"
            stroke="var(--color-brand)"
            strokeWidth="1"
            strokeDasharray="2 3"
            opacity="0.4"
          />

          {/* Lower bound dashed line */}
          <path
            d={pointsLower.reduce((acc, p, i) => acc + `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')}
            fill="none"
            stroke="var(--color-brand)"
            strokeWidth="1"
            strokeDasharray="2 3"
            opacity="0.4"
          />

          {/* Main trend line */}
          <path
            d={pointsProjected.reduce((acc, p, i) => acc + `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')}
            fill="none"
            stroke="var(--color-brand)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Transparent hit boxes for hovering */}
          {data.map((d, i) => {
            const widthPerDay = chartWidth / data.length;
            const x = paddingX + i * widthPerDay;
            const isHovered = hoveredIndex === i;

            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredIndex(i)}
                className="cursor-pointer"
              >
                <rect
                  x={x - widthPerDay / 2}
                  y={paddingY}
                  width={widthPerDay}
                  height={chartHeight}
                  fill="transparent"
                />

                {/* Day ticks on X-axis (render every 5th item to avoid overlap) */}
                {i % 4 === 0 && (
                  <g>
                    <line
                      x1={x}
                      y1={svgHeight - paddingY}
                      x2={x}
                      y2={svgHeight - paddingY + 5}
                      stroke="var(--border-soft)"
                    />
                    <text
                      x={x}
                      y={svgHeight - paddingY + 20}
                      textAnchor="middle"
                      className="font-mono text-[9px] fill-[var(--text-secondary)]"
                    >
                      {d.day}
                    </text>
                  </g>
                )}

                {/* Vertical slider ruler on hover */}
                {isHovered && (
                  <>
                    <line
                      x1={x}
                      y1={paddingY}
                      x2={x}
                      y2={svgHeight - paddingY}
                      stroke="var(--color-brand)"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx={x}
                      cy={pointsProjected[i].y}
                      r={6}
                      fill="var(--bg-card)"
                      stroke="var(--color-brand)"
                      strokeWidth="3"
                    />
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {hoveredIndex !== null && (
        <div
          className="absolute z-10 p-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-card)] text-xs shadow-xl min-w-[200px]"
          style={{
            left: `${Math.min(sidebarPosition(hoveredIndex, data.length), 75)}%`,
            bottom: '20px'
          }}
        >
          <p className="font-semibold text-brand mb-2 border-b border-[var(--border-soft)] pb-0.5">
            Projeção: {data[hoveredIndex].day}
          </p>
          <div className="space-y-1 font-mono">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Upper:</span>
              <span className="text-green-500 font-medium">
                {formatCurrency(data[hoveredIndex].upperBound)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-[var(--text-primary)]">
              <span>Previsto:</span>
              <span>{formatCurrency(data[hoveredIndex].projected)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Lower:</span>
              <span className="text-red-500 font-medium">
                {formatCurrency(data[hoveredIndex].lowerBound)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// 3. CATEGORY RATIO DONUT SVG CHART
interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface CategoryBreakdownChartProps {
  categories: CategoryData[];
  total: number;
  title: string;
}

export function CategoryBreakdownChart({ categories, total, title }: CategoryBreakdownChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Setup donut geometry
  const size = 180;
  const radius = 64;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let accumulatedAngle = 0;

  return (
    <div className="p-4 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] flex flex-col gap-4 w-full h-full min-h-[295px]">
      <div className="border-b border-[var(--border-soft)] pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
          {title}
        </h3>
      </div>

      <div className="flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-6 flex-1 w-full">
        {/* Visual Wheel */}
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {categories.map((cat, i) => {
              const percentage = cat.value / total;
              const strokeDashoffset = circumference - percentage * circumference;
              const rotation = (accumulatedAngle * 360) - 90;
              accumulatedAngle += percentage;

              const isHovered = hoveredIdx === i;

              return (
                <circle
                  key={i}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={cat.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform={`rotate(${rotation} ${center} ${center})`}
                  strokeLinecap="round"
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
            })}
          </svg>

          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--text-secondary)] max-w-[100px] text-center truncate">
              {hoveredIdx !== null ? categories[hoveredIdx].name : 'Total'}
            </span>
            <span className="font-mono text-base font-bold text-[var(--text-primary)]">
              {formatCurrency(hoveredIdx !== null ? categories[hoveredIdx].value : total).replace(',00', '')}
            </span>
          </div>
        </div>

        {/* Legend list */}
        <div className="flex-1 w-full">
          <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
            {categories.map((cat, i) => {
              const isHovered = hoveredIdx === i;
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between p-1.5 rounded transition-all ${isHovered ? 'bg-[var(--bg-card-hover)] font-medium text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }}></span>
                    <span className="text-[11px] truncate" title={cat.name}>{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] flex-shrink-0 ml-2">
                    <span>{formatCurrency(cat.value)}</span>
                    <span className="text-[10px] text-[var(--text-muted)] w-7 text-right">
                      {Math.round((cat.value / total) * 100)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

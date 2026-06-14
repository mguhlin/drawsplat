import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PieController,
  PointElement,
  Title,
  Tooltip,
  ArcElement,
} from 'chart.js';
import { type PointerEvent, useEffect, useRef } from 'react';

import type { ChartDataModel } from './chartData';

Chart.register(
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PieController,
  PointElement,
  Title,
  Tooltip,
);

interface ChartCanvasProps {
  chart: ChartDataModel;
  onPointAdjustStart?: () => void;
  onPointValueChange?: (pointIndex: number, value: number) => void;
}

const chartColors = [
  '#7c3aed',
  '#a855f7',
  '#faa634',
  '#f97316',
  '#22c55e',
  '#6d28d9',
];

export function ChartCanvas({
  chart,
  onPointAdjustStart,
  onPointValueChange,
}: ChartCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const dragPointIndexRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return undefined;
    }

    chartRef.current?.destroy();

    chartRef.current = new Chart(canvas, {
      type: chart.type === 'scatter' ? 'line' : chart.type,
      data: {
        labels: chart.points.map((point) => point.label),
        datasets: [
          {
            label: chart.title,
            data: chart.points.map((point) => point.value),
            backgroundColor:
              chart.type === 'pie'
                ? chart.points.map(
                    (_, index) => chartColors[index % chartColors.length],
                  )
                : '#7c3aed',
            borderColor: '#5b21b6',
            borderWidth: 3,
            pointRadius: chart.type === 'scatter' ? 7 : 4,
            showLine: chart.type !== 'scatter',
          },
        ],
      },
      options: {
        animation: false,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: chart.type === 'pie',
          },
          title: {
            display: true,
            text: chart.title,
            font: {
              size: 22,
              weight: 'bold',
            },
          },
        },
        responsive: true,
        scales:
          chart.type === 'pie'
            ? {}
            : {
                y: {
                  beginAtZero: true,
                },
              },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [chart]);

  function getPointChange(event: PointerEvent<HTMLCanvasElement>) {
    const activeChart = chartRef.current;

    if (!activeChart || chart.type !== 'bar' || !onPointValueChange) {
      return null;
    }

    const xScale = activeChart.scales.x;
    const yScale = activeChart.scales.y;

    if (!xScale || !yScale) {
      return null;
    }

    const position = getChartPointerPosition(event, activeChart);
    const pointIndex = clampIndex(
      Math.round(Number(xScale.getValueForPixel(position.x))),
      chart.points.length,
    );
    const value = Math.max(0, Number(yScale.getValueForPixel(position.y)));

    return {
      pointIndex,
      value,
    };
  }

  function startPointDrag(event: PointerEvent<HTMLCanvasElement>) {
    const change = getPointChange(event);

    if (!change) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    dragPointIndexRef.current = change.pointIndex;
    onPointAdjustStart?.();
    onPointValueChange?.(change.pointIndex, change.value);
  }

  function continuePointDrag(event: PointerEvent<HTMLCanvasElement>) {
    const pointIndex = dragPointIndexRef.current;

    if (pointIndex === null || chart.type !== 'bar') {
      return;
    }

    const activeChart = chartRef.current;
    const yScale = activeChart?.scales.y;

    if (!activeChart || !yScale) {
      return;
    }

    const position = getChartPointerPosition(event, activeChart);

    onPointValueChange?.(
      pointIndex,
      Math.max(0, Number(yScale.getValueForPixel(position.y))),
    );
  }

  function stopPointDrag() {
    dragPointIndexRef.current = null;
  }

  return (
    <canvas
      ref={canvasRef}
      aria-label={`${chart.title} chart`}
      data-testid="chart-canvas"
      role="img"
      onPointerCancel={stopPointDrag}
      onPointerDown={startPointDrag}
      onPointerMove={continuePointDrag}
      onPointerUp={stopPointDrag}
    />
  );
}

function clampIndex(index: number, length: number): number {
  if (length <= 0) {
    return 0;
  }

  return Math.min(Math.max(index, 0), length - 1);
}

function getChartPointerPosition(
  event: PointerEvent<HTMLCanvasElement>,
  chart: Chart,
) {
  const bounds = event.currentTarget.getBoundingClientRect();

  return {
    x: ((event.clientX - bounds.left) / bounds.width) * chart.width,
    y: ((event.clientY - bounds.top) / bounds.height) * chart.height,
  };
}

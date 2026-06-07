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
import { useEffect, useRef } from 'react';

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
}

const chartColors = [
  '#7c3aed',
  '#a855f7',
  '#faa634',
  '#f97316',
  '#22c55e',
  '#6d28d9',
];

export function ChartCanvas({ chart }: ChartCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

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

  return (
    <canvas
      ref={canvasRef}
      aria-label={`${chart.title} chart`}
      data-testid="chart-canvas"
      role="img"
    />
  );
}

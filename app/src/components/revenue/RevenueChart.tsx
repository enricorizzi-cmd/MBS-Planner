import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

interface RevenueData {
  month: number;
  year: number;
  amount: number | null;
  increment_percent: number | null;
}

interface RevenueChartProps {
  data: RevenueData[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Register Chart.js components
    Chart.register(...registerables);

    // Destroy existing chart
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // Sort data by year and month
    const sortedData = [...data].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    // Prepare chart data
    const labels = sortedData.map(item => {
      const date = new Date(item.year, item.month - 1);
      return date.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' });
    });

    const amounts = sortedData.map(item => item.amount || 0);

    // Create chart
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Fatturato (€)',
            data: amounts,
            borderColor: '#00e5ff',
            backgroundColor: 'rgba(0, 229, 255, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#00e5ff',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#00e5ff',
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                const value = context.parsed.y;
                const item = sortedData[context.dataIndex];
                const increment = item.increment_percent;
                
                let label = `Fatturato: €${value.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`;
                
                if (increment !== null) {
                  const trend = increment >= 0 ? '↗' : '↘';
                  label += `\nIncremento: ${trend} ${Math.abs(increment).toFixed(1)}%`;
                }
                
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
            },
            ticks: {
              color: '#9ca3af',
              font: {
                size: 12,
              },
            },
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
            },
            ticks: {
              color: '#9ca3af',
              font: {
                size: 12,
              },
              callback: function(value) {
                return '€' + (value as number).toLocaleString('it-IT');
              }
            },
          },
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
        elements: {
          point: {
            hoverBackgroundColor: '#00e5ff',
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [data]);

  return (
    <div className="relative h-80 w-full">
      <canvas ref={chartRef} />
    </div>
  );
}


'use client';

import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
  ChartOptions
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface HistoricalData {
  dt: number;
  components: {
    co: number;
    no2: number;
    o3: number;
    so2: number;
    pm2_5: number;
    pm10: number;
  };
}

interface AggregatedData {
  date: string;
  components: {
    pm2_5: number;
    pm10: number;
    no2: number;
    so2: number;
    co: number;
  };
}

interface DailySum {
  sum: {
    pm2_5: number;
    pm10: number;
    no2: number;
    so2: number;
    co: number;
  };
  count: number;
}

export default function AQTrendChart() {
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const aggregateDataByDay = (data: HistoricalData[]): AggregatedData[] => {
    const dailyData: Record<string, DailySum> = {};
    
    data.forEach(item => {
      const date = new Date(item.dt * 1000).toLocaleDateString();
      if (!dailyData[date]) {
        dailyData[date] = {
          sum: {
            pm2_5: 0,
            pm10: 0,
            no2: 0,
            so2: 0,
            co: 0
          },
          count: 0
        };
      }
      
      dailyData[date].sum.pm2_5 += item.components.pm2_5;
      dailyData[date].sum.pm10 += item.components.pm10;
      dailyData[date].sum.no2 += item.components.no2;
      dailyData[date].sum.so2 += item.components.so2;
      dailyData[date].sum.co += item.components.co;
      dailyData[date].count += 1;
    });

    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      components: {
        pm2_5: data.sum.pm2_5 / data.count,
        pm10: data.sum.pm10 / data.count,
        no2: data.sum.no2 / data.count,
        so2: data.sum.so2 / data.count,
        co: data.sum.co / data.count
      }
    }));
  };

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        const lat = 25.5941;
        const lon = 85.1376;
        const start = Math.floor((Date.now() / 1000) - (30 * 24 * 60 * 60));
        const end = Math.floor(Date.now() / 1000);

        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/air_pollution/history?lat=${lat}&lon=${lon}&start=${start}&end=${end}&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
        );

        if (!response.ok) throw new Error('Failed to fetch historical data');
        const data = await response.json();
        setHistoricalData(data.list);
      } catch (err) {
        console.error('Error fetching historical data:', err);
        setError('Failed to load historical data');
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalData();
  }, []);

  if (loading) {
    return <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center">Loading historical data...</div>;
  }

  if (error) {
    return <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-red-500">{error}</div>;
  }

  const aggregatedData = aggregateDataByDay(historicalData);
  const processedData = {
    labels: aggregatedData.map(item => item.date),
    datasets: [
      {
        label: 'PM2.5',
        data: aggregatedData.map(item => Number(item.components.pm2_5.toFixed(1))),
        borderColor: '#ff6384',
        backgroundColor: 'rgba(255,99,132,0.2)',
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: '#ff6384',
      },
      {
        label: 'PM10',
        data: aggregatedData.map(item => Number(item.components.pm10.toFixed(1))),
        borderColor: '#36a2eb',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#36a2eb',
      },
      {
        label: 'NO₂',
        data: aggregatedData.map(item => Number(item.components.no2.toFixed(1))),
        borderColor: '#4bc0c0',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#4bc0c0',
      },
      {
        label: 'SO₂',
        data: aggregatedData.map(item => Number(item.components.so2.toFixed(1))),
        borderColor: '#ffcd56',
        backgroundColor: 'rgba(255, 205, 86, 0.2)',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#ffcd56',
      },
      {
        label: 'CO',
        data: aggregatedData.map(item => Number(item.components.co.toFixed(1))),
        borderColor: '#ff9f40',
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#ff9f40',
      }
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: true
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'center',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      title: {
        display: true,
        text: 'Air Quality Trends (Last 30 Days)',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#000',
        bodyColor: '#000',
        borderColor: '#ddd',
        borderWidth: 1,
        padding: 10,
        displayColors: true,
        callbacks: {
          label(context: TooltipItem<'line'>): string {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (value !== null) {
              return `${label}: ${value.toFixed(1)} μg/m³`;
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear',
        title: {
          display: true,
          text: 'Concentration (μg/m³)',
          font: {
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback(tickValue: string | number): string | number {
            return typeof tickValue === 'number' ? tickValue.toFixed(1) : tickValue;
          }
        }
      },
      x: {
        type: 'category',
        title: {
          display: true,
          text: 'Date',
          font: {
            weight: 'bold'
          }
        },
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: 10
        }
      }
    }
  };

  return (
    <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <Line data={processedData} options={options} />
    </div>
  );
}

'use client';

import { useState } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';
import dynamic from 'next/dynamic';
import type { ChartOptions, ChartData as ChartJsData } from 'chart.js';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

ChartJS.register(ArcElement, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

const Pie = dynamic(() => import('react-chartjs-2').then((mod) => mod.Pie), { ssr: false });
const Bar = dynamic(() => import('react-chartjs-2').then((mod) => mod.Bar), { ssr: false });
const Line = dynamic(() => import('react-chartjs-2').then((mod) => mod.Line), { ssr: false });
const Doughnut = dynamic(() => import('react-chartjs-2').then((mod) => mod.Doughnut), { ssr: false });

interface ChartData {
  chartType: 'pie' | 'bar' | 'line' | 'doughnut';
  labels: string[];
  data: number[];
  title: string;
}

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [chartDataList, setChartDataList] = useState<ChartData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3000/deepseek/prompt', { prompt });
      console.log('Backend response:', response.data);
      setChartDataList((prev) => [...prev, response.data]);
    } catch (err: any) {
      console.error('Error fetching chart data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch chart data');
    } finally {
      setLoading(false);
    }
  };

  const handleClearCharts = () => {
    setChartDataList([]);
  };

  const colorPalette = ['#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#F472B6', '#9CA3AF'];

  const baseOptions: ChartOptions<any> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: { size: 12, family: 'Inter, sans-serif' },
          color: '#6B7280',
        },
      },
    },
    maintainAspectRatio: false,
  };

  const pieOptions: ChartOptions<'pie'> = { ...baseOptions };
  const barOptions: ChartOptions<'bar'> = { ...baseOptions };
  const lineOptions: ChartOptions<'line'> = { ...baseOptions };
  const doughnutOptions: ChartOptions<'doughnut'> = { ...baseOptions };

  const generateChartData = (chartData: ChartData): ChartJsData<'pie' | 'bar' | 'line' | 'doughnut', number[], string> | null => {
    if (!chartData) return null;

    if (chartData.chartType === 'pie') {
      return {
        labels: chartData.labels,
        datasets: [
          {
            label: chartData.title,
            data: chartData.data,
            backgroundColor: chartData.labels.map((_, i) => colorPalette[i % colorPalette.length]),
            borderWidth: 1,
          },
        ],
      };
    }

    if (chartData.chartType === 'bar') {
      return {
        labels: chartData.labels,
        datasets: [
          {
            label: chartData.title,
            data: chartData.data,
            backgroundColor: chartData.labels.map((_, i) => colorPalette[i % colorPalette.length]),
            borderRadius: 10,
          },
        ],
      };
    }

    if (chartData.chartType === 'line') {
      return {
        labels: chartData.labels,
        datasets: [
          {
            label: chartData.title,
            data: chartData.data,
            backgroundColor: '#60A5FA66',
            borderColor: '#60A5FA',
            tension: 0.4,
            fill: true,
          },
        ],
      };
    }

    if (chartData.chartType === 'doughnut') {
      return {
        labels: chartData.labels,
        datasets: [
          {
            label: chartData.title,
            data: chartData.data,
            backgroundColor: chartData.labels.map((_, i) => colorPalette[i % colorPalette.length]),
            borderWidth: 1,
          },
        ],
      };
    }

    return null;
  };

  return (
    <div className={`${inter.className} min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center py-6 px-4`}>
      {/* Header */}
      <h1 className="mb-10 text-4xl font-extrabold text-slate-700 tracking-tight">
        AI Dashboard
      </h1>

      {/* Input Form and Clear Button */}
      <div className="w-full max-w-2xl flex items-center justify-between gap-4 mb-12">
        <form onSubmit={handleSubmit} className="flex items-center gap-4 flex-1">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask something like 'All products with price'"
            className="flex-1 px-5 py-4 bg-white border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-gray-700 placeholder-gray-400 transition-all duration-300 hover:shadow-md"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-full font-medium hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Generate'}
          </button>
        </form>
        {chartDataList.length > 0 && (
          <button
            onClick={handleClearCharts}
            className="px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full font-medium hover:scale-105 transition-transform duration-300"
          >
            Clear Charts
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-red-600 text-sm mb-8 bg-red-50 px-6 py-3 rounded-xl shadow-md max-w-md w-full text-center">
          {error}
        </p>
      )}

      {/* Chart Display */}
      {chartDataList.length > 0 && (
        <div className="w-full max-w-[90vw] overflow-x-auto snap-x snap-mandatory">
          <div className="flex flex-row gap-6 pb-4 scroll-smooth">
            {chartDataList.map((chartData, index) => {
              const data = generateChartData(chartData);
              if (!data) return null;

              return (
                <div
                  key={index}
                  className="flex-shrink-0 w-[400px] sm:w-[450px] md:w-[500px] bg-white p-6 rounded-3xl shadow-xl border border-gray-100 snap-center"
                >
                  <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">{chartData.title}</h2>
                  <div className="h-[350px]">
                    {chartData.chartType === 'pie' && <Pie data={data as ChartJsData<'pie', number[], string>} options={pieOptions} />}
                    {chartData.chartType === 'bar' && <Bar data={data as ChartJsData<'bar', number[], string>} options={barOptions} />}
                    {chartData.chartType === 'line' && <Line data={data as ChartJsData<'line', number[], string>} options={lineOptions} />}
                    {chartData.chartType === 'doughnut' && <Doughnut data={data as ChartJsData<'doughnut', number[], string>} options={doughnutOptions} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
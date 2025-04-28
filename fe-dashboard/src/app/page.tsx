'use client';

import { useState } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';
import dynamic from 'next/dynamic';
import type { ChartOptions, ChartData as ChartJsData } from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

// Dynamically import chart components with SSR disabled
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
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setChartData(null);
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3000/deepseek/prompt', { prompt });
      console.log('Backend response:', response.data);
      setChartData(response.data);
    } catch (err: any) {
      console.error('Error fetching chart data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch chart data');
    } finally {
      setLoading(false);
    }
  };

  // Define a curated color palette for better contrast and understanding
  const colorPalette = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#6B7280', // Gray
  ];

  // Shared base options for all chart types
  const baseOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 12,
            family: 'Inter, sans-serif',
          },
          color: '#4B5563',
        },
      },
      title: {
        display: true,
        text: chartData?.title || 'Chart',
        font: {
          size: 16,
          family: 'Inter, sans-serif',
          weight: 600,
        },
        color: '#1F2937',
        padding: {
          bottom: 24,
          top: 16,
        },
      },
    },
    maintainAspectRatio: false,
  };

  // Type-specific options
  const pieOptions: ChartOptions<'pie'> = {
    ...baseOptions,
  };

  const barOptions: ChartOptions<'bar'> = {
    ...baseOptions,
  };

  const lineOptions: ChartOptions<'line'> = {
    ...baseOptions,
  };

  const doughnutOptions: ChartOptions<'doughnut'> = {
    ...baseOptions,
  };

  // Chart.js data for each chart type
  const pieData: ChartJsData<'pie', number[], string> | null = chartData && chartData.chartType === 'pie'
    ? {
      labels: chartData.labels,
      datasets: [
        {
          label: chartData.title,
          data: chartData.data,
          backgroundColor: chartData.labels.map((_, i) => colorPalette[i % colorPalette.length]),
          borderColor: chartData.labels.map((_, i) => colorPalette[i % colorPalette.length]),
          borderWidth: 1,
        },
      ],
    }
    : null;

  // Find the barData configuration (~line 170) and update to:
  const barData: ChartJsData<'bar', number[], string> | null = chartData && chartData.chartType === 'bar'
    ? {
      labels: chartData.labels,
      datasets: [
        {
          label: chartData.title,
          data: chartData.data,
          backgroundColor: chartData.labels.map((_, i) => colorPalette[i % colorPalette.length]),
          borderColor: '#ffffff',
          borderWidth: 1,
          borderRadius: 6, // <-- Add this line
        },
      ],
    }
    : null;

  // Find the lineData configuration (~line 183) and update to:
  const lineData: ChartJsData<'line', number[], string> | null = chartData && chartData.chartType === 'line'
    ? {
      labels: chartData.labels,
      datasets: [
        {
          label: chartData.title,
          data: chartData.data,
          backgroundColor: '#3B82F660', // <-- Add 60 hex for opacity
          borderColor: '#3B82F6',
          borderWidth: 2,
          tension: 0.4, // <-- Add this for curved lines
          fill: true, // <-- Add this for area under line
        },
      ],
    }
    : null;

  const doughnutData: ChartJsData<'doughnut', number[], string> | null = chartData && chartData.chartType === 'doughnut'
    ? {
      labels: chartData.labels,
      datasets: [
        {
          label: chartData.title,
          data: chartData.data,
          backgroundColor: chartData.labels.map((_, i) => colorPalette[i % colorPalette.length]),
          borderColor: chartData.labels.map((_, i) => colorPalette[i % colorPalette.length]),
          borderWidth: 1,
        },
      ],
    }
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center py-2 px-4 font-sans">
      {/* Header */}
      <h1 className="mb-10 p-3 text-slate-600 text-3xl font-bold tracking-tight">
        Dashboard
      </h1>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="w-4/12 max-w-4/12 flex items-center gap-4 mb-12">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Total products?"
          className="flex-1 p-4 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-gray-700 placeholder-gray-400 transition-all duration-300 hover:shadow-md"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-4 bg-indigo-600 text-white rounded-xl shadow-sm hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-300 hover:shadow-md"
        >
          {loading && (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          )}
          {loading ? 'Loading' : 'Generate'}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <p className="text-red-600 text-sm mb-8 bg-red-50 px-6 py-3 rounded-xl shadow-sm max-w-lg w-full text-center">
          {error}
        </p>
      )}

      {/* Chart Display */}
      {chartData && (
        <div className="w-full max-w-3xl bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <div className="h-[450px]">
            {chartData.chartType === 'pie' && pieData && (
              <Pie data={pieData} options={pieOptions} />
            )}
            {chartData.chartType === 'line' && lineData && (
              <Line data={lineData} options={lineOptions} />
            )}
            {chartData.chartType === 'doughnut' && doughnutData && (
              <Doughnut data={doughnutData} options={doughnutOptions} />
            )}
            {chartData.chartType === 'bar' && barData && (
              <Bar data={barData} options={barOptions} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

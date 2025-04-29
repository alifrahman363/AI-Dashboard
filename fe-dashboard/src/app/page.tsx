'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';
import dynamic from 'next/dynamic';
import type { ChartOptions, ChartData as ChartJsData } from 'chart.js';
import { Inter } from 'next/font/google';
import { FiTrash2, FiBookmark } from 'react-icons/fi'; // Import minimalistic line icons

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
  prompt: string;
  query: string;
  pinnedChartId?: number;
}

interface PinnedChart {
  id: number;
  prompt: string;
  query: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [chartDataList, setChartDataList] = useState<ChartData[]>([]);
  const [pinnedCharts, setPinnedCharts] = useState<PinnedChart[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pinMessage, setPinMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'generate' | 'pinned'>('generate');

  const fetchPinnedCharts = async () => {
    try {
      const response = await axios.get('http://localhost:3000/pinned-charts');
      setPinnedCharts(response.data);
      setChartDataList(prev =>
        prev.map(chart => {
          const pinnedChart = response.data.find(
            (pc: PinnedChart) => pc.prompt === chart.prompt && pc.query === chart.query && pc.isPinned
          );
          return { ...chart, pinnedChartId: pinnedChart ? pinnedChart.id : undefined };
        })
      );
    } catch (err: any) {
      console.error('Error fetching pinned charts:', err);
    }
  };

  useEffect(() => {
    fetchPinnedCharts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3000/deepseek/prompt', { prompt });
      console.log('Backend response:', response.data);
      const newChart = { ...response.data, pinnedChartId: undefined };
      setChartDataList(prev => [...prev, newChart]);
      const pinnedResponse = await axios.post('http://localhost:3000/pinned-charts/check', {
        prompt: newChart.prompt,
        query: newChart.query,
      });
      if (pinnedResponse.data) {
        setChartDataList(prev =>
          prev.map(chart =>
            chart.prompt === newChart.prompt && chart.query === newChart.query
              ? { ...chart, pinnedChartId: pinnedResponse.data.id }
              : chart
          )
        );
      }
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

  const handlePinChart = async (chartData: ChartData) => {
    try {
      const response = await axios.post('http://localhost:3000/pinned-charts/pin', {
        prompt: chartData.prompt,
        query: chartData.query,
      });
      console.log('Pinned chart response:', response.data);
      setPinMessage('Chart pinned successfully!');
      setTimeout(() => setPinMessage(null), 3000);
      setChartDataList(prev =>
        prev.map(chart =>
          chart.prompt === chartData.prompt && chart.query === chartData.query
            ? { ...chart, pinnedChartId: response.data.id }
            : chart
        )
      );
      await fetchPinnedCharts();
    } catch (err: any) {
      console.error('Error pinning chart:', err);
      setPinMessage(err.response?.data?.message || err.message || 'Failed to pin chart');
      setTimeout(() => setPinMessage(null), 3000);
    }
  };

  const handleUnpinChart = async (pinnedChartId: number, chartData: ChartData) => {
    try {
      await axios.post(`http://localhost:3000/pinned-charts/${pinnedChartId}/unpin`);
      setPinMessage('Chart unpinned successfully!');
      setTimeout(() => setPinMessage(null), 3000);
      setChartDataList(prev =>
        prev.map(chart =>
          chart.prompt === chartData.prompt && chart.query === chartData.query
            ? { ...chart, pinnedChartId: undefined }
            : chart
        )
      );
      await fetchPinnedCharts();
    } catch (err: any) {
      console.error('Error unpinning chart:', err);
      setPinMessage(err.response?.data?.message || err.message || 'Failed to unpin chart');
      setTimeout(() => setPinMessage(null), 3000);
    }
  };

  const handleViewPinnedChart = async (pinnedChartId: number) => {
    try {
      const response = await axios.get(`http://localhost:3000/pinned-charts/${pinnedChartId}/data`);
      const { prompt, data } = response.data;
      const existingChart = chartDataList.find(chart => chart.prompt === prompt);
      const chartType = existingChart ? existingChart.chartType : 'bar';
      const newChart: ChartData = {
        chartType,
        labels: data.map((item: any) => item.name || Object.keys(item)[0]),
        data: data.map((item: any) => item.price || Object.values(item)[1]),
        title: prompt,
        prompt,
        query: pinnedCharts.find(chart => chart.id === pinnedChartId)!.query,
        pinnedChartId,
      };
      setChartDataList(prev => [...prev, newChart]);
      setActiveTab('generate');
    } catch (err: any) {
      console.error('Error viewing pinned chart:', err);
      setPinMessage(err.response?.data?.message || err.message || 'Failed to view pinned chart');
      setTimeout(() => setPinMessage(null), 3000);
    }
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
    <div className={`${inter.className} min-h-screen bg-gradient-to-b from-[#F9FAFB] to-[#F3F4F6] flex flex-col items-center py-6 px-4`}>
      {/* Header */}
      <h1 className="mt-10 mb-10 text-4xl font-extrabold text-[#374151] tracking-tight">
        AI Dashboard
      </h1>

      {/* Tabs */}
      <div className="w-full max-w-2xl flex justify-center mb-8">
        <div className="flex space-x-4 bg-[#E5E7EB] rounded-full p-1">
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-6 py-2 rounded-full font-medium transition-colors duration-300 ${activeTab === 'generate'
              ? 'bg-[#2DD4BF] text-white'
              : 'bg-transparent text-[#6B7280] hover:bg-[#D1D5DB]'
              }`}
          >
            Generate Charts
          </button>
          <button
            onClick={() => setActiveTab('pinned')}
            className={`px-6 py-2 rounded-full font-medium transition-colors duration-300 ${activeTab === 'pinned'
              ? 'bg-[#2DD4BF] text-white'
              : 'bg-transparent text-[#6B7280] hover:bg-[#D1D5DB]'
              }`}
          >
            Pinned Charts
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-[#F87171] text-sm mb-8 bg-[#FEF2F2] px-6 py-3 rounded-xl shadow-md max-w-md w-full text-center">
          {error}
        </p>
      )}

      {/* Pin Success/Error Message */}
      {pinMessage && (
        <p className={`text-sm mb-8 px-6 py-3 rounded-xl shadow-md max-w-md w-full text-center ${pinMessage.includes('successfully') ? 'text-[#2DD4BF] bg-[#F0FDFA]' : 'text-[#F87171] bg-[#FEF2F2]'
          }`}>
          {pinMessage}
        </p>
      )}

      {/* Generate Charts Tab */}
      {activeTab === 'generate' && (
        <>
          {/* Input Form and Clear Button */}
          <div className="w-full max-w-2xl flex items-center justify-between gap-4 mb-12">
            <form onSubmit={handleSubmit} className="flex items-center gap-4 flex-1">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask something like 'All products with price'"
                className="flex-1 px-5 py-4 bg-white border border-[#E5E7EB] rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:border-transparent text-[#374151] placeholder-gray-400 transition-all duration-300 hover:shadow-md"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-4 bg-gradient-to-r from-[#60A5FA] to-[#34D399] text-white rounded-full font-medium hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Generate'}
              </button>
            </form>
            {chartDataList.length > 0 && (
              <button
                onClick={handleClearCharts}
                className="p-4 bg-gradient-to-r from-[#F87171] to-[#F472B6] text-white rounded-full font-medium hover:scale-105 transition-transform duration-300 flex items-center"
                title="Clear Charts"
              >
                <FiTrash2 size={20} />
              </button>
            )}
          </div>

          {/* Chart Display */}
          {chartDataList.length > 0 && (
            <div className="w-full max-w-[90vw] overflow-x-auto snap-x snap-mandatory">
              <div className="flex flex-row gap-6 pb-4 scroll-smooth justify-center items-center snap-x snap-mandatory">
                {chartDataList.map((chartData, index) => {
                  const data = generateChartData(chartData);
                  if (!data) return null;

                  const isPinned = !!chartData.pinnedChartId;

                  return (
                    <div
                      key={index}
                      className="flex-shrink-0 w-[400px] sm:w-[450px] md:w-[500px] bg-white p-6 rounded-3xl shadow-md border border-[#E5E7EB] snap-center"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-[#374151] text-center flex items-center gap-2">
                          {chartData.title}
                          {isPinned && (
                            <span className="text-[#2DD4BF] text-sm flex items-center gap-1">
                              <FiBookmark size={16} color="#2DD4BF" /> Pinned
                            </span>
                          )}
                        </h2>
                        {isPinned ? (
                          <button
                            onClick={() => handleUnpinChart(chartData.pinnedChartId!, chartData)}
                            className="px-4 py-2 bg-gradient-to-r from-[#F87171] to-[#F472B6] text-white rounded-full font-medium hover:scale-105 transition-transform duration-300"
                          >
                            Unpin
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePinChart(chartData)}
                            className="px-4 py-2 bg-gradient-to-r from-[#34D399] to-[#2DD4BF] text-white rounded-full font-medium hover:scale-105 transition-transform duration-300"
                          >
                            Pin
                          </button>
                        )}
                      </div>
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
        </>
      )}

      {/* Pinned Charts Tab */}
      {activeTab === 'pinned' && (
        <div className="w-full max-w-2xl mb-12">
          <h2 className="text-2xl font-semibold text-[#374151] mb-4 text-center">Pinned Charts</h2>
          {pinnedCharts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pinnedCharts.map(chart => (
                <div
                  key={chart.id}
                  className="bg-white p-4 rounded-xl shadow-md border border-[#E5E7EB] flex items-center justify-between hover:bg-[#F0FDFA] cursor-pointer transition-colors duration-300"
                  onClick={() => handleViewPinnedChart(chart.id)}
                >
                  <span className="text-[#374151] font-medium">{chart.prompt}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnpinChart(chart.id, chart as any);
                    }}
                    className="px-3 py-1 bg-gradient-to-r from-[#F87171] to-[#F472B6] text-white rounded-full font-medium hover:scale-105 transition-transform duration-300"
                  >
                    Unpin
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#6B7280] text-center">No pinned charts available.</p>
          )}
        </div>
      )}
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Inter } from 'next/font/google';
import ChartCard from '../components/ChartCard';
import ChartForm from '../components/ChartForm';
import Message from '../components/Message';
import PinnedChartCard from '../components/PinnedChartCard'; // Fixed import
import Tabs from '../components/Tabs';
import { ChartData, PinnedChart } from '../types';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

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
      const newChart: ChartData = { ...response.data, pinnedChartId: undefined };
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

  const handleUnpinChart = async (pinnedChartId: number, chart: ChartData | PinnedChart) => {
    try {
      await axios.post(`http://localhost:3000/pinned-charts/${pinnedChartId}/unpin`);
      setPinMessage('Chart unpinned successfully!');
      setTimeout(() => setPinMessage(null), 3000);
      setChartDataList(prev =>
        prev.map(chartItem =>
          chartItem.prompt === chart.prompt && chartItem.query === chart.query
            ? { ...chartItem, pinnedChartId: undefined }
            : chartItem
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

  return (
    <div className={`${inter.className} min-h-screen bg-gradient-to-b from-[#E0F2FE] to-[#F8FAFC] flex flex-col items-center py-6 px-4 relative`}>
      <div className="fixed top-4 right-4 flex flex-col gap-2 z-50">
        {error && <Message message={error} type="error" onClose={() => setError(null)} />}
        {pinMessage && (
          <Message
            message={pinMessage}
            type={pinMessage.includes('successfully') ? 'success' : 'error'}
            onClose={() => setPinMessage(null)}
          />
        )}
      </div>

      <h1 className="mt-10 mb-10 text-4xl font-extrabold text-[#1E3A8A] tracking-tight">AI Dashboard</h1>

      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 'generate' && (
        <>
          <ChartForm
            prompt={prompt}
            setPrompt={setPrompt}
            onSubmit={handleSubmit}
            loading={loading}
            chartDataListLength={chartDataList.length}
            onClear={handleClearCharts}
          />
          {chartDataList.length > 0 && (
            <div className="w-full max-w-[90vw] overflow-x-auto snap-x snap-mandatory">
              <div className="flex flex-row gap-6 pb-4 scroll-smooth justify-center items-center snap-x snap-mandatory">
                {chartDataList.map((chartData, index) => (
                  <ChartCard
                    key={index}
                    chartData={chartData}
                    onPin={handlePinChart}
                    onUnpin={handleUnpinChart}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'pinned' && (
        <div className="w-full max-w-2xl mb-12">
          <h2 className="text-2xl font-semibold text-[#1E3A8A] mb-4 text-center">Pinned Charts</h2>
          {pinnedCharts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pinnedCharts.map(chart => (
                <PinnedChartCard
                  key={chart.id}
                  chart={chart}
                  onView={handleViewPinnedChart}
                  onUnpin={handleUnpinChart}
                />
              ))}
            </div>
          ) : (
            <p className="text-[#4B5563] text-center">No pinned charts available.</p>
          )}
        </div>
      )}
    </div>
  );
}
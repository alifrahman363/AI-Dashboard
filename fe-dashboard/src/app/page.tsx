'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import ChartCard from '../components/ChartCard';
import { ChartData } from '../types';
import { FiRefreshCw } from 'react-icons/fi';
import Tabs from '../components/Tabs';
import ChartForm from '../components/ChartForm';

export default function Home() {
  const [prompt, setPrompt] = useState<string>('');
  const [charts, setCharts] = useState<ChartData[]>([]);
  const [pinnedCharts, setPinnedCharts] = useState<ChartData[]>([]);
  const [activeTab, setActiveTab] = useState<'generate' | 'pinned'>('generate');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetchedPinnedCharts, setHasFetchedPinnedCharts] = useState<boolean>(false);

  // Fetch pinned charts only when the "Pinned Charts" tab is clicked
  const fetchPinnedCharts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:3000/deepseek/pinned-charts');
      setPinnedCharts(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch pinned charts');
      setPinnedCharts([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change and fetch pinned charts only when needed
  const handleTabChange = (tab: 'generate' | 'pinned') => {
    setActiveTab(tab);
    if (tab === 'pinned' && !hasFetchedPinnedCharts) {
      fetchPinnedCharts();
      setHasFetchedPinnedCharts(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('http://localhost:3000/deepseek/prompt', { prompt });
      const newChart: ChartData = response.data;
      setCharts((prev) => [...prev, newChart]);
      setPrompt('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate chart');
    } finally {
      setLoading(false);
    }
  };

  const clearCharts = () => {
    setCharts([]);
  };

  const pinChart = async (chartData: ChartData) => {
    try {
      await axios.post('http://localhost:3000/pinned-charts/pin', {
        prompt: chartData.prompt,
        query: chartData.query,
        chartType: chartData.chartType,
      });
      await fetchPinnedCharts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to pin chart');
    }
  };

  const unpinChart = async (pinnedChartId: number) => {
    try {
      await axios.post(`http://localhost:3000/pinned-charts/${pinnedChartId}/unpin`);
      await fetchPinnedCharts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to unpin chart');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] p-8 flex flex-col items-center">
      <h1 className="text-4xl font-extrabold text-[#1F2A44] mb-10 tracking-tight">AI Dashboard</h1>

      {/* Tabs */}
      <Tabs activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* Generate Charts Tab */}
      {activeTab === 'generate' && (
        <div className="w-full max-w-4xl">
          <ChartForm
            prompt={prompt}
            setPrompt={setPrompt}
            onSubmit={handleSubmit}
            loading={loading}
            chartDataListLength={charts.length}
            onClear={clearCharts}
          />

          {error && (
            <div className="w-full mb-6 p-4 bg-[#FFF1F2] text-[#E11D48] rounded-xl shadow-sm border border-[#E11D48]/20">
              {error}
            </div>
          )}

          <div className="w-full overflow-x-auto snap-x snap-mandatory flex gap-6 pb-4 justify-center items-center">
            {charts.length === 0 ? (
              <div></div>
            ) : (
              charts.map((chart, index) => (
                <ChartCard
                  key={index}
                  chartData={chart}
                  onPin={pinChart}
                  onUnpin={unpinChart}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Pinned Charts Tab */}
      {activeTab === 'pinned' && (
        <div className="w-full max-w-5xl">
          {loading ? (
            <div className="w-full flex justify-center items-center p-12">
              <div className="w-12 h-12 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="w-full p-4 bg-[#FFF1F2] text-[#E11D48] rounded-xl shadow-sm border border-[#E11D48]/20">
              {error}
            </div>
          ) : pinnedCharts.length === 0 ? (
            <div className="text-[#6B7280] text-center w-full p-12 border-2 border-dashed border-[#D1D5DB] rounded-xl bg-white shadow-sm">
              <div className="flex flex-col items-center gap-4">
                <div className="text-[#9CA3AF] animate-pulse">
                  <FiRefreshCw size={36} />
                </div>
                <p className="text-lg">No pinned charts available. Generate and pin charts to see them here.</p>
              </div>
            </div>
          ) : (
            <div className="w-full overflow-x-auto snap-x snap-mandatory flex gap-6 pb-4">
              {pinnedCharts.map((chart, index) => (
                <ChartCard
                  key={chart.pinnedChartId || index}
                  chartData={chart}
                  onPin={pinChart}
                  onUnpin={unpinChart}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
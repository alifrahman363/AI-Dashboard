'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import ChartCard from '../components/ChartCard';
import { ChartData } from '../types';

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
    // Assuming you have an endpoint to pin a chart
    try {
      await axios.post('http://localhost:3000/pinned-charts/pin', {
        prompt: chartData.prompt,
        query: chartData.query,
        chartType: chartData.chartType,
      });
      // Fetch pinned charts again to update the list
      await fetchPinnedCharts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to pin chart');
    }
  };

  const unpinChart = async (pinnedChartId: number) => {
    // Assuming you have an endpoint to unpin a chart
    try {
      await axios.post(`http://localhost:3000/pinned-charts/${pinnedChartId}/unpin`);
      // Fetch pinned charts again to update the list
      await fetchPinnedCharts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to unpin chart');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] p-6 flex flex-col items-center">
      <h1 className="text-4xl font-bold text-[#1E3A8A] mb-8">AI Dashboard</h1>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => handleTabChange('generate')}
          className={`px-6 py-3 rounded-full font-medium transition-all duration-200 shadow-sm hover:shadow-lg hover:scale-105 active:scale-95 ${activeTab === 'generate'
            ? 'bg-gradient-to-r from-[#3B82F6] to-[#10B981] text-white'
            : 'bg-white text-[#1E3A8A] border border-[#E5E7EB]'
            }`}
        >
          Generate Charts
        </button>
        <button
          onClick={() => handleTabChange('pinned')}
          className={`px-6 py-3 rounded-full font-medium transition-all duration-200 shadow-sm hover:shadow-lg hover:scale-105 active:scale-95 ${activeTab === 'pinned'
            ? 'bg-gradient-to-r from-[#3B82F6] to-[#10B981] text-white'
            : 'bg-white text-[#1E3A8A] border border-[#E5E7EB]'
            }`}
        >
          Pinned Charts
        </button>
      </div>

      {/* Generate Charts Tab */}
      {activeTab === 'generate' && (
        <>
          <form onSubmit={handleSubmit} className="w-full max-w-2xl mb-6 flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt (e.g., Get all products with a price greater than 500)"
              className="flex-1 px-4 py-3 rounded-full bg-white border border-[#E5E7EB] text-[#1E3A8A] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] shadow-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#10B981] text-white rounded-full font-medium shadow-sm hover:brightness-110 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate'}
            </button>
            <button
              type="button"
              onClick={clearCharts}
              disabled={charts.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-[#EF4444] to-[#EC4899] text-white rounded-full font-medium shadow-sm hover:brightness-110 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear Charts
            </button>
          </form>

          {error && (
            <div className="w-full max-w-2xl mb-6 p-4 bg-[#FEE2E2] text-[#DC2626] rounded-lg shadow-sm">
              {error}
            </div>
          )}

          <div className="w-full overflow-x-auto snap-x snap-mandatory flex gap-6 pb-4 justify-center items-center">
            {charts.length === 0 ? (
              <p className="text-[#6B7280] text-center w-full">No charts generated yet.</p>
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
        </>
      )}

      {/* Pinned Charts Tab */}
      {activeTab === 'pinned' && (
        <div className="w-full max-w-5xl">
          {loading ? (
            <p className="text-[#1E3A8A] text-center">Loading pinned charts...</p>
          ) : error ? (
            <div className="w-full p-4 bg-[#FEE2E2] text-[#DC2626] rounded-lg shadow-sm">
              {error}
            </div>
          ) : pinnedCharts.length === 0 ? (
            <p className="text-[#6B7280] text-center">No pinned charts available.</p>
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
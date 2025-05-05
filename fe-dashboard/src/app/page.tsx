'use client';

import axios from 'axios';
import { useState, useEffect, useRef } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import ChartCard from '../components/ChartCard';
import Tabs from '../components/Tabs';
import { ChartData } from '../types';

interface Message {
  type: 'user' | 'ai';
  content: string | ChartData;
}

export default function Home() {
  const [prompt, setPrompt] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [pinnedCharts, setPinnedCharts] = useState<ChartData[]>([]);
  const [activeTab, setActiveTab] = useState<'generate' | 'pinned'>('generate');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetchedPinnedCharts, setHasFetchedPinnedCharts] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    // Add user message to the conversation
    setMessages((prev) => [...prev, { type: 'user', content: prompt }]);
    setPrompt('');
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:3000/deepseek/prompt', { prompt });
      const newChart: ChartData = response.data;
      // Add AI response (chart) to the conversation
      setMessages((prev) => [...prev, { type: 'ai', content: newChart }]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate chart');
      setMessages((prev) => [
        ...prev,
        { type: 'ai', content: `Error: ${err.response?.data?.message || 'Failed to generate chart'}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-300 p-8 flex flex-col items-center">
      <h1 className="text-4xl font-extrabold text-[#1F2A44] mb-10 tracking-tight">AI Dashboard</h1>

      {/* Tabs */}
      <Tabs activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* Generate Charts Tab (Chat Interface) */}
      {activeTab === 'generate' && (
        <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg p-4">
          {/* Conversation Area */}
          <div className="h-[calc(100vh-300px)] overflow-y-auto mb-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-[#6B7280] text-center p-12 border-2 border-dashed border-[#D1D5DB] rounded-xl">
                <p className="text-lg">Ask me anything about your data!</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`p-3 rounded-lg max-w-[70%] ${message.type === 'user' ? 'bg-blue-100 text-[#1F2A44]' : 'bg-gray-200 text-[#1F2A44]'
                      }`}
                  >
                    {message.type === 'user' ? (
                      <p>{typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}</p>
                    ) : typeof message.content === 'string' ? (
                      <p>{message.content}</p>
                    ) : (
                      <ChartCard
                        chartData={message.content as ChartData}
                        onPin={pinChart}
                        onUnpin={unpinChart}
                      />
                    )}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="p-3 bg-gray-200 rounded-lg max-w-[70%]">
                  <p className="text-gray-600">Generating response...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="flex gap-2">
            <button
              onClick={clearConversation}
              className="px-3 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
            >
              Clear
            </button>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your prompt here..."
              className="flex-1 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Pinned Charts Tab (Unchanged) */}
      {activeTab === 'pinned' && (
        <div className="w-full max-w-7xl">
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
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 pb-4">
              {pinnedCharts.map((chart, index) => (
                <div key={chart.pinnedChartId || index} className="w-full min-w-[350px]">
                  <ChartCard
                    chartData={chart}
                    onPin={pinChart}
                    onUnpin={unpinChart}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
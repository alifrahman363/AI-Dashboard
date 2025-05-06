'use client';

import axios from 'axios';
import { useState, useEffect, useRef } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import ChartCard from '../components/ChartCard';
import { ChartData } from '../types';
import { useTab } from '../components/TabContext';

interface Message {
  type: 'user' | 'ai';
  content: string | ChartData;
}

export default function Home() {
  const { activeTab, setActiveTab } = useTab();
  const [prompt, setPrompt] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [pinnedCharts, setPinnedCharts] = useState<ChartData[]>([]);
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

  // Fetch pinned charts
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

  // Handle tab change
  const handleTabChange = (tab: 'generate' | 'pinned') => {
    setActiveTab(tab);
    if (tab === 'pinned' && !hasFetchedPinnedCharts) {
      fetchPinnedCharts();
      setHasFetchedPinnedCharts(true);
    }
  };

  // Handle prompt submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    setMessages((prev) => [...prev, { type: 'user', content: prompt }]);
    setPrompt('');
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:3000/deepseek/prompt', { prompt });
      const newChart: ChartData = response.data;
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

  // Handle chart pinning
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

  // Handle chart unpinning
  const unpinChart = async (pinnedChartId: number) => {
    try {
      await axios.post(`http://localhost:3000/pinned-charts/${pinnedChartId}/unpin`);
      await fetchPinnedCharts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to unpin chart');
    }
  };

  // Clear conversation
  const clearConversation = () => {
    setMessages([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto">
      {/* Main Content */}
      {activeTab === 'generate' && (
        <div className="flex-1 bg-white rounded-xl shadow-md p-6 flex flex-col h-full">
          {/* Conversation Area */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-gray-500 text-center p-12 border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-lg">Ask me anything about your data!</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`p-3 rounded-lg max-w-[70%] ${message.type === 'user'
                        ? 'bg-blue-100 text-gray-800'
                        : 'bg-gray-100 text-gray-800'
                      }`}
                  >
                    {message.type === 'user' ? (
                      <p>{message.content as string}</p>
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
                <div className="p-3 bg-gray-100 rounded-lg max-w-[70%]">
                  <p className="text-gray-500">Generating response...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="flex gap-2">
            {messages.length > 0 && (
              <button
                onClick={clearConversation}
                className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Clear
              </button>
            )}
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your prompt here..."
              className="flex-1 p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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

      {activeTab === 'pinned' && (
        <div className="flex-1 bg-white rounded-xl shadow-md p-6 flex flex-col h-full">
          {loading ? (
            <div className="flex-1 flex justify-center items-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center p-4 bg-red-50 text-red-600 rounded-xl shadow-sm border border-red-100">
              {error}
            </div>
          ) : pinnedCharts.length === 0 ? (
            <div className="flex-1 flex items-center text-gray-500 text-center p-12 border-2 border-dashed border-gray-200 rounded-xl bg-white shadow-sm">
              <div className="flex flex-col items-center gap-4">
                <FiRefreshCw size={36} className="text-gray-400 animate-pulse" />
                <p className="text-lg">No pinned charts available. Generate and pin charts to see them here.</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 pb-4">
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
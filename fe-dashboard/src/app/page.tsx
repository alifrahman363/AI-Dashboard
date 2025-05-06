'use client';

import axios from 'axios';
import { useState, useEffect, useRef } from 'react';
import { FiBarChart2, FiBookmark, FiRefreshCw, FiSend, FiTrash2 } from 'react-icons/fi';
import ChartCard from '../components/ChartCard';
import { ChartData } from '../types';
import { useTab } from '../components/TabContext';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string | ChartData;
  timestamp: Date;
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
  const conversationRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize text area
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [prompt]);

  // Check if the user is near the bottom of the conversation
  const isNearBottom = () => {
    if (!conversationRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = conversationRef.current;
    return scrollHeight - scrollTop - clientHeight < 100;
  };

  // Scroll to the bottom if the user is near the bottom
  const scrollToBottom = () => {
    if (isNearBottom()) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Auto-scroll when messages or loading state changes
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, loading]);

  // Fetch pinned charts on mount if the initial tab is 'pinned'
  useEffect(() => {
    if (activeTab === 'pinned' && !hasFetchedPinnedCharts) {
      fetchPinnedCharts();
      setHasFetchedPinnedCharts(true);
    }
  }, [activeTab, hasFetchedPinnedCharts]);

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

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: prompt,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setPrompt('');
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:3000/deepseek/prompt', { prompt });
      const newChart: ChartData = response.data;

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: newChart,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to generate chart';

      const aiErrorMessage: Message = {
        id: `ai-error-${Date.now()}`,
        type: 'ai',
        content: `Error: ${errorMessage}`,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, aiErrorMessage]);
      setError(errorMessage);
    } finally {
      setLoading(false);
      if (inputRef.current) {
        inputRef.current.focus();
      }
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col text-white" style={{ height: '80vh' }}>
      {/* Spacer for fixed navbar */}
      <div className="h-16"></div>

      {activeTab === 'generate' && (
        <div className="flex flex-col flex-1 max-w-5xl mx-auto w-full px-4">
          {/* Conversation Area - Scrollable */}
          <div
            ref={conversationRef}
            className="flex-1 overflow-y-auto pt-6 pb-28"
            style={{
              maxHeight: 'calc(100vh - 8rem)', // Account for navbar and prompt bar
            }}
          >
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <div className="flex justify-center mb-6">
                    <div className="bg-blue-500/20 p-6 rounded-full">
                      <FiBarChart2 size={32} color="rgb(96, 165, 250)" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-200 mb-3">Chart Generation Assistant</h2>
                  <p className="text-gray-400 mb-6">
                    Ask me to create charts based on your data or specific visualization needs.
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => setPrompt("Create a bar chart showing monthly sales for 2023")}
                      className="bg-gray-800 hover:bg-gray-700 rounded-lg px-4 py-3 text-left text-gray-300 transition-colors"
                    >
                      Create a bar chart showing monthly sales for 2023
                    </button>
                    <button
                      onClick={() => setPrompt("Generate a line chart for stock prices from 2020 to 2024")}
                      className="bg-gray-800 hover:bg-gray-700 rounded-lg px-4 py-3 text-left text-gray-300 transition-colors"
                    >
                      Generate a line chart for stock prices from 2020 to 2024
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div
                      className={`rounded-2xl max-w-[80%] ${message.type === 'user'
                        ? 'bg-blue-600 text-white py-3 px-4'
                        : 'bg-gray-800 text-white py-3 px-4'
                        }`}
                    >
                      {message.type === 'user' ? (
                        <p className="whitespace-pre-wrap">{message.content as string}</p>
                      ) : typeof message.content === 'string' ? (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        <ChartCard
                          chartData={message.content as ChartData}
                          onPin={pinChart}
                          onUnpin={unpinChart}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {loading && (
              <div className="flex justify-start my-8 animate-fade-in">
                <div className="bg-gray-800 rounded-2xl p-4 max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <span className="text-gray-400">Generating chart</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div
            className={`fixed bottom-0 left-0 right-0 pb-6 pt-4 z-40`}
          >
            <div className="max-w-5xl mx-auto px-4 w-full">
              <form onSubmit={handleSubmit} className="relative">
                <div className="flex items-end rounded-2xl border border-gray-700 focus-within:border-blue-500 transition-colors">
                  <textarea
                    ref={inputRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask me to create a chart..."
                    className="flex-1 py-3 pl-4 pr-12 rounded-2xl bg-transparent text-black placeholder-gray-600 focus:outline-none resize-none min-h-[56px] max-h-[120px]"
                    rows={1}
                  />
                  <button
                    type="submit"
                    disabled={loading || !prompt.trim()}
                    className="absolute right-3 bottom-3 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-blue-800 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <FiSend size={18} />
                  </button>
                </div>
              </form>

              {messages.length > 0 && (
                <div className="flex justify-center mt-4">
                  <button
                    onClick={clearConversation}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <FiTrash2 size={16} />
                    <span>Clear conversation</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pinned' && (
        <div className="max-w-7xl mx-auto w-full px-4 pb-8 mt-10">
          {/* <h1 className="text-2xl font-semibold text-gray-200 mb-8 mt-6">Your Pinned Charts</h1> */}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-900/40 text-red-400 rounded-xl shadow-sm border border-red-800">
              {error}
            </div>
          ) : pinnedCharts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-center border-2 border-dashed border-gray-800 rounded-2xl bg-gray-900/50">
              <div className="mb-4 p-4 bg-gray-800/50 rounded-full">
                <FiBookmark size={32} color="rgb(107, 114, 128)" />
              </div>
              <h3 className="text-xl font-medium text-gray-300 mb-2">No pinned charts</h3>
              <p className="text-gray-400 max-w-md">
                Generate charts in the "Generate" tab and pin them to see them here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {pinnedCharts.map((chart, index) => (
                <div key={chart.pinnedChartId || index} className="w-full">
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
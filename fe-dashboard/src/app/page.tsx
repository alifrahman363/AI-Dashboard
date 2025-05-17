'use client';

import axios from 'axios';
import { useState, useEffect, useRef } from 'react';
import { FiBarChart2, FiBookmark, FiSend, FiTrash2 } from 'react-icons/fi';
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
  const { activeTab } = useTab();
  const [prompt, setPrompt] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [pinnedCharts, setPinnedCharts] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetchedPinnedCharts, setHasFetchedPinnedCharts] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    if (messages.length > 0 || loading) {
      scrollToBottom();
    }
  }, [messages, loading]);

  // Fetch pinned charts
  useEffect(() => {
    if (activeTab === 'pinned' && !hasFetchedPinnedCharts) {
      fetchPinnedCharts();
      setHasFetchedPinnedCharts(true);
    }
  }, [activeTab, hasFetchedPinnedCharts]);

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

  // Handle prompt submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: prompt,
      timestamp: new Date(),
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
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to generate chart';
      const aiErrorMessage: Message = {
        id: `ai-error-${Date.now()}`,
        type: 'ai',
        content: `Error: ${errorMessage}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiErrorMessage]);
      setError(errorMessage);
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
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {activeTab === 'generate' && (
        <div className="flex flex-col flex-1">
          {/* Conversation Area */}
          <div
            ref={conversationRef}
            className="flex-1 overflow-y-auto pt-4 pb-36" // Increased padding-bottom to pb-36 (9rem) to account for input area height
          >
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <FiBarChart2 size={40} className="mx-auto text-primary mb-4" />
                  <h2 className="text-2xl font-semibold mb-2 font-inter">Chart Generation</h2>
                  <p className="text-text-muted mb-6">
                    Create stunning charts with AI. Enter a prompt to get started.
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => setPrompt('Create a bar chart for 2023 sales')}
                      className="btn-secondary text-left"
                    >
                      Bar chart for 2023 sales
                    </button>
                    <button
                      onClick={() => setPrompt('Line chart for stock prices 2020-2024')}
                      className="btn-secondary text-left"
                    >
                      Line chart for stock prices
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 px-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div
                      className={`rounded-xl max-w-[80%] p-3 ${message.type === 'user' ? 'bg-primary text-white' : 'bg-card-bg text-text'
                        }`}
                    >
                      {message.type === 'user' ? (
                        <p>{message.content as string}</p>
                      ) : typeof message.content === 'string' ? (
                        <p>{message.content}</p>
                      ) : (
                        <ChartCard chartData={message.content as ChartData} onPin={pinChart} onUnpin={unpinChart} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {loading && (
              <div className="flex justify-start px-4 my-4 animate-fade-in">
                <div className="bg-card-bg rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-pulse"
                        style={{ animationDelay: '0s' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-pulse"
                        style={{ animationDelay: '0.2s' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-pulse"
                        style={{ animationDelay: '0.4s' }}
                      ></div>
                    </div>
                    <span className="text-text-muted">Generating...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="fixed bottom-0 left-0 right-0 pb-6 px-4 bg-gradient-to-t from-background to-transparent">
            <div className="max-w-3xl mx-auto flex items-center gap-3"> {/* Adjusted max-w to 3xl and added flex layout */}
              <form onSubmit={handleSubmit} className="relative flex-1">
                <div className="flex items-center rounded-xl bg-card-bg border border-gray-700 shadow-lg focus-within:border-primary">
                  <input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Create a chart..."
                    className="input-modern flex-1 py-3" // Adjusted padding for a taller input
                  />
                  <button
                    type="submit"
                    disabled={loading || !prompt.trim()}
                    className="btn-primary p-2 mx-2 rounded-lg disabled:bg-gray-700 disabled:text-text-muted disabled:cursor-not-allowed"
                  >
                    <FiSend size={18} />
                  </button>
                </div>
              </form>
              {messages.length > 0 && (
                <button
                  onClick={clearConversation}
                  className="btn-secondary flex items-center gap-2 text-sm px-3 py-2" // Reduced padding for a smaller button
                >
                  <FiTrash2 size={16} />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pinned' && (
        <div className="py-8">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-900/20 text-red-400 rounded-xl">
              {error}
            </div>
          ) : pinnedCharts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-muted card">
              <FiBookmark size={40} className="mb-4" />
              <h3 className="text-xl font-medium mb-2 font-inter">No Pinned Charts</h3>
              <p>Pin charts from the Generate tab to view them here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {pinnedCharts.map((chart, index) => (
                <div key={chart.pinnedChartId || index} className="w-full">
                  <ChartCard chartData={chart} onPin={pinChart} onUnpin={unpinChart} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
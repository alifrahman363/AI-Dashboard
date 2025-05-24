'use client';

import axios from 'axios';
import { useState, useEffect, useRef } from 'react';
import { FiBarChart2, FiBookmark, FiSend, FiTrash2, FiUpload } from 'react-icons/fi';
import { FaFileExcel } from 'react-icons/fa';
import ChartCard from '../components/ChartCard';
import { ChartData, ChartDataForExcel, ExcelAnalysisResult } from '../types';
import { useTab } from '../components/TabContext';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'error';
  content: string | ChartData | ExcelAnalysisResult;
  timestamp: Date;
  isExcel?: boolean;
  fileName?: string;
}

// Typing animation component
const TypingText = ({ text, speed = 50, onComplete }: { text: string; speed?: number; onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return (
    <span>
      {displayedText}
      {currentIndex < text.length && (
        <span className="animate-pulse text-primary">|</span>
      )}
    </span>
  );
};

// Function to clean text by removing <think> tags and their content
const cleanText = (text: string): string => {
  // Remove <think>...</think> blocks (including multiline)
  const cleanedText = text.replace(/<think>[\s\S]*?<\/think>/gi, '');

  // Remove any extra whitespace that might be left
  return cleanedText.trim();
};

export default function Home() {
  const { activeTab } = useTab();
  const [prompt, setPrompt] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [pinnedCharts, setPinnedCharts] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetchedPinnedCharts, setHasFetchedPinnedCharts] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [typingStates, setTypingStates] = useState<{ [key: string]: boolean }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleFileChange triggered');
    const file = e.target.files?.[0];
    if (file && ['.xlsx', '.xls'].includes(file.name.slice(file.name.lastIndexOf('.')).toLowerCase())) {
      console.log('Valid Excel file selected:', file.name);
      setSelectedFile(file);
      setError(null);
    } else {
      console.log('Invalid file selected:', file?.name);
      setSelectedFile(null);
      setError('Please upload a valid Excel file (.xlsx or .xls)');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    console.log('triggerFileInput called');
    if (fileInputRef.current) {
      console.log('fileInputRef exists, triggering click');
      fileInputRef.current.click();
    } else {
      console.error('fileInputRef is null');
      setError('File input not found. Please try again.');
    }
  };

  // Handle typing completion
  const handleTypingComplete = (messageId: string) => {
    setTypingStates(prev => ({
      ...prev,
      [messageId]: true
    }));
  };

  // Handle prompt submission (database query or Excel upload)
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    if (selectedFile) {
      console.log('Submitting Excel upload with prompt:', prompt, 'and file:', selectedFile.name);
      // Handle Excel file upload
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        type: 'user',
        content: prompt,
        fileName: selectedFile.name,
        isExcel: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setPrompt('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setLoading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('prompt', prompt);

        const response = await axios.post('http://localhost:3000/deepseek/analyze-excel', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const excelResult: ExcelAnalysisResult = response.data;

        // Clean the summary text
        const cleanedSummary = cleanText(excelResult.summary || '');

        // Normalize ChartDataForExcel to ChartData for ChartCard
        const normalizedChartData: ChartData = {
          ...excelResult.chartData,
          query: excelResult.chartData.query || 'N/A (Excel data)',
        };

        const aiMessageId = `ai-${Date.now()}`;
        const aiMessage: Message = {
          id: aiMessageId,
          type: 'ai',
          content: {
            ...excelResult,
            chartData: normalizedChartData,
            summary: cleanedSummary
          },
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);

        // Initialize typing state for this message
        setTypingStates(prev => ({
          ...prev,
          [aiMessageId]: false
        }));

      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to analyze Excel file';
        const aiErrorMessage: Message = {
          id: `ai-error-${Date.now()}`,
          type: 'error',
          content: `Error: ${errorMessage}`,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiErrorMessage]);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    } else {
      // Handle database query
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        type: 'user',
        content: prompt,
        isExcel: false,
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
          type: 'error',
          content: `Error: ${errorMessage}`,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiErrorMessage]);
        setError(errorMessage);
      } finally {
        setLoading(false);
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
    setSelectedFile(null);
    setTypingStates({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
          <div ref={conversationRef} className="flex-1 overflow-y-auto pt-4 pb-36">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <FiBarChart2 size={40} className="mx-auto text-primary mb-4" />
                  <h2 className="text-2xl font-semibold mb-2 font-inter">AI Dashboard</h2>
                  <p className="text-text-muted mb-6">
                    Create stunning charts with AI. Enter a prompt or upload an Excel file to get started.
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => setPrompt('Show me all products with their prices.')}
                      className="btn-secondary text-left"
                    >
                      Show me all products with their prices.
                    </button>
                    <button
                      onClick={() => setPrompt('How many products do I have?')}
                      className="btn-secondary text-left"
                    >
                      How many products do I have?
                    </button>
                    <button
                      onClick={() => setPrompt('Total sales')}
                      className="btn-secondary text-left"
                    >
                      Total sales from Excel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 px-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`rounded-xl max-w-[80%] p-3 ${message.type === 'user'
                        ? 'bg-primary text-white'
                        : message.type === 'error'
                          ? 'bg-red-900/20 text-red-400'
                          : 'bg-card-bg text-text'
                        }`}
                    >
                      {message.type === 'user' || message.type === 'error' ? (
                        <div className="flex flex-col gap-1 animate-fade-in">
                          <span>{message.content as string}</span>
                          {message.isExcel && message.fileName && (
                            <div className="flex items-center gap-2 text-sm text-text-muted">
                              <FaFileExcel size={16} />
                              <span>{message.fileName}</span>
                            </div>
                          )}
                        </div>
                      ) : typeof message.content === 'string' ? (
                        <p className="animate-fade-in">{message.content}</p>
                      ) : 'chartData' in message.content ? (
                        <>
                          <div className="mb-3 p-3 bg-gray-800/50 rounded-lg border-l-4 border-primary">
                            <div className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                              <div className="text-sm font-medium text-text min-h-[1.25rem]">
                                <TypingText
                                  text={(message.content as ExcelAnalysisResult).summary || 'Analysis complete.'}
                                  speed={30}
                                  onComplete={() => handleTypingComplete(message.id)}
                                />
                              </div>
                            </div>
                          </div>
                          {/* Only show chart after typing is complete */}
                          {typingStates[message.id] && (
                            <div className="mt-3">
                              <ChartCard
                                chartData={(message.content as ExcelAnalysisResult).chartData as ChartData}
                                onPin={pinChart}
                                onUnpin={unpinChart}
                              />
                            </div>
                          )}
                        </>
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
              <div className="flex justify-start px-4 my-4 animate-fade-in">
                <div className="bg-card-bg rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted">
                      {selectedFile ? 'Analyzing Excel file' : 'Generating chart'}
                    </span>
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
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="fixed bottom-0 left-0 right-0 pb-6 px-4 bg-gradient-to-t from-background to-transparent">
            <div className="max-w-3xl mx-auto flex items-center gap-3">
              <form onSubmit={handleSubmit} className="relative flex-1">
                <div className="flex items-center rounded-xl bg-card-bg border border-gray-700 shadow-lg focus-within:border-primary transition-colors">
                  <input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Create a chart or upload an Excel file..."
                    className="input-modern flex-1 py-3 pl-4 pr-20"
                  />
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    className={`p-2 transition-colors ${selectedFile ? 'text-primary' : 'text-text hover:text-primary'}`}
                    title="Upload Excel file"
                  >
                    <FiUpload size={18} />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".xlsx,.xls"
                    className="hidden"
                  />
                  <button
                    type="submit"
                    disabled={loading || (!prompt.trim() && !selectedFile)}
                    className="btn-primary p-2 mx-2 rounded-lg disabled:bg-gray-700 disabled:text-text-muted disabled:cursor-not-allowed transition-colors"
                  >
                    <FiSend size={18} />
                  </button>
                </div>
                {selectedFile && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-primary bg-primary/10 px-3 py-2 rounded-lg">
                    <FaFileExcel size={16} />
                    <span>Selected: {selectedFile.name}</span>
                  </div>
                )}
              </form>
              {messages.length > 0 && (
                <button
                  onClick={clearConversation}
                  className="btn-secondary flex items-center gap-2 text-sm px-3 py-2 hover:bg-red-900/20 hover:text-red-400 transition-colors"
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
            <div className="p-4 bg-red-900/20 text-red-400 rounded-xl border border-red-800/30">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                {error}
              </div>
            </div>
          ) : pinnedCharts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-muted card">
              <FiBookmark size={40} className="mb-4 opacity-50" />
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
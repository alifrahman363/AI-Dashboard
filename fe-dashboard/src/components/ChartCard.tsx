'use client';

import { useState, useRef } from 'react';
import type { ChartData as ChartJsData } from 'chart.js';
import dynamic from 'next/dynamic';
import type { ChartProps } from 'react-chartjs-2';
import { FiBookmark, FiMaximize2, FiMinimize2, FiInfo, FiX, FiDownload } from 'react-icons/fi';
import { ChartData } from '../types';
import { barOptions, doughnutOptions, generateChartData, lineOptions, pieOptions } from '../utils/chartUtils';

// Define types for each chart component
type PieComponent = React.ComponentType<ChartProps<'pie'>>;
type BarComponent = React.ComponentType<ChartProps<'bar'>>;
type LineComponent = React.ComponentType<ChartProps<'line'>>;
type DoughnutComponent = React.ComponentType<ChartProps<'doughnut'>>;

// Dynamically import each chart component with proper types
const Pie = dynamic(() => import('react-chartjs-2').then((mod) => mod.Pie as PieComponent), { ssr: false });
const Bar = dynamic(() => import('react-chartjs-2').then((mod) => mod.Bar as BarComponent), { ssr: false });
const Line = dynamic(() => import('react-chartjs-2').then((mod) => mod.Line as LineComponent), { ssr: false });
const Doughnut = dynamic(() => import('react-chartjs-2').then((mod) => mod.Doughnut as DoughnutComponent), { ssr: false });

interface ChartCardProps {
    chartData: ChartData;
    onPin: (chartData: ChartData) => void;
    onUnpin: (pinnedChartId: number) => void;
}

export default function ChartCard({ chartData, onPin, onUnpin }: ChartCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    const data: ChartJsData<'pie' | 'bar' | 'line' | 'doughnut', number[], string> | null = generateChartData(chartData);
    if (!data) return null;

    const isPinned = !!chartData.pinnedChartId;

    const handlePinToggle = () => {
        if (isPinned) {
            onUnpin(chartData.pinnedChartId!);
        } else {
            onPin(chartData);
        }
    };

    const handleDownload = () => {
        // Implementation for chart download (SVG/PNG)
        alert('Download functionality will be implemented');
    };

    // Close modal when clicking outside
    const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
        if (modalRef.current === e.target) {
            setExpanded(false);
        }
    };

    // Custom options to enforce fixed height and disable dynamic resizing
    const getChartOptions = (chartType: string, isExpanded: boolean) => {
        const baseOptions = {
            responsive: true,
            maintainAspectRatio: false,
            height: isExpanded ? 500 : 250,
            plugins: {
                legend: {
                    position: 'bottom' as const,
                    labels: {
                        color: '#f3f4f6',
                        padding: 20,
                        font: {
                            size: isExpanded ? 14 : 11
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    titleColor: '#f3f4f6',
                    bodyColor: '#e5e7eb',
                    padding: 12,
                    borderColor: 'rgba(75, 85, 99, 0.3)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }
            }
        };

        switch (chartType) {
            case 'pie':
                return { ...pieOptions, ...baseOptions };
            case 'bar':
                return { ...barOptions, ...baseOptions };
            case 'line':
                return { ...lineOptions, ...baseOptions };
            case 'doughnut':
                return { ...doughnutOptions, ...baseOptions };
            default:
                return baseOptions;
        }
    };

    if (expanded) {
        return (
            <div
                ref={modalRef}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={handleClickOutside}
            >
                <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-hidden animate-fade-in">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-700">
                        <h3 className="text-lg font-medium text-white">
                            {chartData.title || 'Generated Chart'}
                        </h3>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePinToggle}
                                className={`p-2 rounded-lg transition-colors ${isPinned ? 'text-blue-400 bg-blue-500/10' : 'text-gray-400 hover:text-blue-400 hover:bg-blue-500/10'
                                    }`}
                                title={isPinned ? 'Unpin chart' : 'Pin chart'}
                            >
                                <FiBookmark size={18} />
                            </button>
                            <button
                                onClick={handleDownload}
                                className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                title="Download chart"
                            >
                                <FiDownload size={18} />
                            </button>
                            <button
                                onClick={() => setExpanded(false)}
                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Close expanded view"
                            >
                                <FiX size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Chart Container */}
                    <div className="p-4 h-[500px]">
                        {chartData.chartType === 'pie' && (
                            <Pie
                                type="pie"
                                data={data as ChartJsData<'pie', number[], string>}
                                options={getChartOptions('pie', true)}
                            />
                        )}
                        {chartData.chartType === 'bar' && (
                            <Bar
                                type="bar"
                                data={data as ChartJsData<'bar', number[], string>}
                                options={getChartOptions('bar', true)}
                            />
                        )}
                        {chartData.chartType === 'line' && (
                            <Line
                                type="line"
                                data={data as ChartJsData<'line', number[], string>}
                                options={getChartOptions('line', true)}
                            />
                        )}
                        {chartData.chartType === 'doughnut' && (
                            <Doughnut
                                type="doughnut"
                                data={data as ChartJsData<'doughnut', number[], string>}
                                options={getChartOptions('doughnut', true)}
                            />
                        )}
                    </div>

                    {/* Footer with details */}
                    <div className="p-4 border-t border-gray-700 bg-gray-900/50">
                        <div className="space-y-3">
                            <div>
                                <h4 className="text-sm font-medium text-gray-400">Prompt</h4>
                                <p className="text-gray-300">{chartData.prompt}</p>
                            </div>
                            {chartData.query && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-400">SQL Query</h4>
                                    <pre className="bg-gray-900 p-3 rounded-lg text-gray-300 text-sm overflow-x-auto">
                                        {chartData.query}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-all duration-300 h-[380px] flex flex-col">
            {/* Header Section */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-700">
                <h3 className="font-medium text-gray-200 truncate">
                    {chartData.title || 'Generated Chart'}
                </h3>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="View details"
                    >
                        <FiInfo size={16} />
                    </button>
                    <button
                        onClick={handlePinToggle}
                        className={`p-1.5 rounded-lg transition-colors ${isPinned ? 'text-blue-400 bg-blue-500/10' : 'text-gray-400 hover:text-blue-400 hover:bg-blue-500/10'
                            }`}
                        title={isPinned ? 'Unpin chart' : 'Pin chart'}
                    >
                        <FiBookmark size={16} />
                    </button>
                    <button
                        onClick={() => setExpanded(true)}
                        className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="Expand chart"
                    >
                        <FiMaximize2 size={16} />
                    </button>
                </div>
            </div>

            {/* Chart Section */}
            <div className="flex-1 p-4 bg-gray-800/50">
                {chartData.chartType === 'pie' && (
                    <Pie
                        type="pie"
                        data={data as ChartJsData<'pie', number[], string>}
                        options={getChartOptions('pie', false)}
                    />
                )}
                {chartData.chartType === 'bar' && (
                    <Bar
                        type="bar"
                        data={data as ChartJsData<'bar', number[], string>}
                        options={getChartOptions('bar', false)}
                    />
                )}
                {chartData.chartType === 'line' && (
                    <Line
                        type="line"
                        data={data as ChartJsData<'line', number[], string>}
                        options={getChartOptions('line', false)}
                    />
                )}
                {chartData.chartType === 'doughnut' && (
                    <Doughnut
                        type="doughnut"
                        data={data as ChartJsData<'doughnut', number[], string>}
                        options={getChartOptions('doughnut', false)}
                    />
                )}
            </div>

            {/* Footer with prompt info */}
            {showDetails ? (
                <div className="p-4 border-t border-gray-700 bg-gray-900/50 max-h-32 overflow-y-auto">
                    <div className="space-y-2">
                        <div>
                            <h4 className="text-xs font-medium text-gray-400">Prompt</h4>
                            <p className="text-sm text-gray-300">{chartData.prompt}</p>
                        </div>
                        {chartData.query && (
                            <div>
                                <h4 className="text-xs font-medium text-gray-400">SQL Query</h4>
                                <pre className="bg-gray-900/70 p-2 rounded text-gray-300 text-xs overflow-x-auto">
                                    {chartData.query}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="px-4 py-3 border-t border-gray-700">
                    <p className="text-xs text-gray-400 truncate">{chartData.prompt}</p>
                </div>
            )}
        </div>
    );
}
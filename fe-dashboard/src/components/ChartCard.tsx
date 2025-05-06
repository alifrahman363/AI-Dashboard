'use client';

import type { ChartData as ChartJsData } from 'chart.js';
import dynamic from 'next/dynamic';
import type { ChartProps } from 'react-chartjs-2';
import { FiBookmark } from 'react-icons/fi';
import { RiUnpinLine } from 'react-icons/ri';
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
    const data: ChartJsData<'pie' | 'bar' | 'line' | 'doughnut', number[], string> | null = generateChartData(chartData);
    if (!data) return null;

    const isPinned = !!chartData.pinnedChartId;

    // Custom options to enforce fixed height and disable dynamic resizing
    const getChartOptions = (chartType: string) => {
        const baseOptions = {
            responsive: true,
            maintainAspectRatio: false,
            height: 250, // Fixed height for the chart content
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

    return (
        <div className="w-full max-w-[400px] p-5 mb-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 bg-white h-[400px]">
            {/* Header Section with Fixed Height */}
            <div className="flex justify-between items-center mb-4 h-12 overflow-hidden">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-800 max-w-[250px] truncate">{chartData.title}</h2>
                </div>
                <div className="relative group flex items-center gap-2">
                    {isPinned && (
                        <span className="text-green-500 text-sm flex items-center gap-1">
                            <FiBookmark size={16} color="#10B981" />
                        </span>
                    )}
                    {isPinned ? (
                        <button
                            onClick={() => onUnpin(chartData.pinnedChartId!)}
                            className="text-red-500 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors duration-200"
                            aria-label="Unpin chart"
                        >
                            <RiUnpinLine size={20} />
                        </button>
                    ) : (
                        <button
                            onClick={() => onPin(chartData)}
                            className="text-red-500 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors duration-200"
                            aria-label="Pin chart"
                        >
                            <FiBookmark size={20} />
                        </button>
                    )}
                    {/* Tooltip */}
                    <span className="absolute top-10 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {isPinned ? 'Unpin' : 'Pin'}
                    </span>
                </div>
            </div>

            {/* Chart Section */}
            <div className="h-[300px] bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
                {chartData.chartType === 'pie' && (
                    <Pie
                        type="pie"
                        data={data as ChartJsData<'pie', number[], string>}
                        options={getChartOptions('pie')}
                    />
                )}
                {chartData.chartType === 'bar' && (
                    <Bar
                        type="bar"
                        data={data as ChartJsData<'bar', number[], string>}
                        options={getChartOptions('bar')}
                    />
                )}
                {chartData.chartType === 'line' && (
                    <Line
                        type="line"
                        data={data as ChartJsData<'line', number[], string>}
                        options={getChartOptions('line')}
                    />
                )}
                {chartData.chartType === 'doughnut' && (
                    <Doughnut
                        type="doughnut"
                        data={data as ChartJsData<'doughnut', number[], string>}
                        options={getChartOptions('doughnut')}
                    />
                )}
            </div>

            {/* Prompt Info */}
            <p className="text-sm text-gray-500 mt-6 truncate">{chartData.prompt}</p>
        </div>
    );
}
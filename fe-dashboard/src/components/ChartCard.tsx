'use client';

import dynamic from 'next/dynamic';
import type { ChartData as ChartJsData } from 'chart.js';
import type { ChartProps } from 'react-chartjs-2';
import { FiBookmark } from 'react-icons/fi';
import { pieOptions, barOptions, lineOptions, doughnutOptions, generateChartData } from '../utils/chartUtils';
import { ChartData } from '../types';

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
    onUnpin: (pinnedChartId: number, chartData: ChartData) => void;
}

export default function ChartCard({ chartData, onPin, onUnpin }: ChartCardProps) {
    const data: ChartJsData<'pie' | 'bar' | 'line' | 'doughnut', number[], string> | null = generateChartData(chartData);
    if (!data) return null;

    const isPinned = !!chartData.pinnedChartId;

    return (
        <div className="flex-shrink-0 w-[400px] sm:w-[450px] md:w-[500px] bg-white p-6 rounded-3xl shadow-lg border border-[#E5E7EB] snap-center">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-[#6b6a69] text-center flex items-center gap-2">
                    {chartData.title}
                    {isPinned && (
                        <span className="text-[#10B981] text-sm flex items-center gap-1">
                            <FiBookmark size={16} color="#10B981" /> Pinned
                        </span>
                    )}
                </h2>
                {isPinned ? (
                    <button
                        onClick={() => onUnpin(chartData.pinnedChartId!, chartData)}
                        className="px-4 py-2 bg-[#E16349] text-white rounded-full font-medium shadow-sm hover:brightness-110 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
                    >
                        Unpin
                    </button>
                ) : (
                    <button
                        onClick={() => onPin(chartData)}
                        className="px-4 py-2 bg-[#e05959] text-white rounded-full font-medium shadow-sm hover:brightness-110 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
                    >
                        Pin
                    </button>
                )}
            </div>
            <div className="h-[350px]">
                {chartData.chartType === 'pie' && (
                    <Pie
                        type="pie"
                        data={data as ChartJsData<'pie', number[], string>}
                        options={pieOptions}
                    />
                )}
                {chartData.chartType === 'bar' && (
                    <Bar
                        type="bar"
                        data={data as ChartJsData<'bar', number[], string>}
                        options={barOptions}
                    />
                )}
                {chartData.chartType === 'line' && (
                    <Line
                        type="line"
                        data={data as ChartJsData<'line', number[], string>}
                        options={lineOptions}
                    />
                )}
                {chartData.chartType === 'doughnut' && (
                    <Doughnut
                        type="doughnut"
                        data={data as ChartJsData<'doughnut', number[], string>}
                        options={doughnutOptions}
                    />
                )}
            </div>
        </div>
    );
}
'use client';

import { PinnedChart } from '../types';

interface PinnedChartCardProps {
    chart: PinnedChart;
    onView: (pinnedChartId: number) => void;
    onUnpin: (pinnedChartId: number, chart: PinnedChart) => void;
}

export default function PinnedChartCard({ chart, onView, onUnpin }: PinnedChartCardProps) {
    return (
        <div
            className="bg-white p-4 rounded-xl shadow-lg border border-[#E5E7EB] flex items-center justify-between hover:bg-[#E0F2FE] cursor-pointer transition-colors duration-300"
            onClick={() => onView(chart.id)}
        >
            <span className="text-[#1E3A8A] font-medium">{chart.prompt}</span>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onUnpin(chart.id, chart);
                }}
                className="px-3 py-1 bg-gradient-to-r from-[#EF4444] to-[#EC4899] text-white rounded-full font-medium shadow-sm hover:brightness-110 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
            >
                Unpin
            </button>
        </div>
    );
}
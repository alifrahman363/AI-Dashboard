import React from 'react';
import { ChartData, ExcelAnalysisResult } from '../types';
import ChartCard from './ChartCard';

interface ExcelMessageProps {
    content: ExcelAnalysisResult;
    onPin: (chartData: ChartData) => void;
    onUnpin: (pinnedChartId: number) => void;
}

const ExcelMessage: React.FC<ExcelMessageProps> = ({ content, onPin, onUnpin }) => {
    return (
        <>
            {/* Summary Section */}
            <div className="mb-3 p-3 bg-gray-800/50 rounded-lg border-l-4 border-primary">
                <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div className="text-sm font-medium text-text">
                        {content.summary || 'Analysis complete.'}
                    </div>
                </div>
            </div>

            {/* Chart Section */}
            <div className="mt-3">
                <ChartCard
                    chartData={content.chartData as ChartData}
                    onPin={onPin}
                    onUnpin={onUnpin}
                />
            </div>
        </>
    );
};

export default ExcelMessage;
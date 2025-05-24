export interface ChartData {
    chartType: 'pie' | 'bar' | 'line' | 'doughnut';
    labels: string[];
    data: number[];
    title: string;
    prompt: string;
    query: string;
    pinnedChartId?: number;
}
export interface PinnedChart {
    id: number;
    prompt: string;
    query: string;
    isPinned: boolean;
}
export interface ChartDataForExcel {
    chartType: 'bar' | 'line' | 'pie' | 'doughnut';
    labels: string[];
    data: number[];
    title: string;
    prompt: string;
    query?: string;
    pinnedChartId?: number;
}

// export interface ChartDataForExcel {
//     query?: string;
//     chartType: string;
//     data?: any;
// }

export interface ExcelAnalysisResult {
    chartData: ChartDataForExcel;
    summary: string;
}

export interface Message {
    id: string;
    type: 'user' | 'ai' | 'error';
    content: string | ChartData | ExcelAnalysisResult;
    timestamp: Date;
    isExcel?: boolean;
    fileName?: string;
}
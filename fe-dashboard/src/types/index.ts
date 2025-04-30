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
    createdAt: string;
    updatedAt: string;
}
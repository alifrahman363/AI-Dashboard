import type { ChartOptions, ChartData as ChartJsData } from 'chart.js';
import { ChartData } from '../types';

export const colorPalette = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#EF4444'];

export const baseOptions: ChartOptions<any> = {
    responsive: true,
    plugins: {
        legend: {
            position: 'top' as const,
            labels: {
                font: { size: 12, family: 'var(--font-inter), sans-serif' },
                color: '#4B5563',
            },
        },
    },
    maintainAspectRatio: false,
};

export const pieOptions: ChartOptions<'pie'> = { ...baseOptions };
export const barOptions: ChartOptions<'bar'> = { ...baseOptions };
export const lineOptions: ChartOptions<'line'> = { ...baseOptions };
export const doughnutOptions: ChartOptions<'doughnut'> = { ...baseOptions };

export const generateChartData = (chartData: ChartData): ChartJsData<'pie' | 'bar' | 'line' | 'doughnut', number[], string> | null => {
    if (!chartData) return null;

    if (chartData.chartType === 'pie') {
        return {
            labels: chartData.labels,
            datasets: [
                {
                    label: chartData.title,
                    data: chartData.data,
                    backgroundColor: chartData.labels.map((_, i) => colorPalette[i % colorPalette.length]),
                    borderWidth: 1,
                },
            ],
        };
    }

    if (chartData.chartType === 'bar') {
        return {
            labels: chartData.labels,
            datasets: [
                {
                    label: chartData.title,
                    data: chartData.data,
                    backgroundColor: chartData.labels.map((_, i) => colorPalette[i % colorPalette.length]),
                    borderRadius: 10,
                },
            ],
        };
    }

    if (chartData.chartType === 'line') {
        return {
            labels: chartData.labels,
            datasets: [
                {
                    label: chartData.title,
                    data: chartData.data,
                    backgroundColor: '#3B82F666',
                    borderColor: '#3B82F6',
                    tension: 0.4,
                    fill: true,
                },
            ],
        };
    }

    if (chartData.chartType === 'doughnut') {
        return {
            labels: chartData.labels,
            datasets: [
                {
                    label: chartData.title,
                    data: chartData.data,
                    backgroundColor: chartData.labels.map((_, i) => colorPalette[i % colorPalette.length]),
                    borderWidth: 1,
                },
            ],
        };
    }

    return null;
};
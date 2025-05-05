import type { ChartData as ChartJsData, ChartOptions } from 'chart.js';
import {
    ArcElement,
    BarController,
    BarElement,
    CategoryScale,
    Chart,
    DoughnutController,
    Legend,
    LinearScale,
    LineController,
    LineElement,
    PieController,
    PointElement,
    Title,
    Tooltip,
} from 'chart.js';
import { ChartData } from '../types';

// Register Chart.js components
Chart.register(
    ArcElement,
    BarElement,
    LineElement,
    PointElement,
    PieController,
    BarController,
    LineController,
    DoughnutController,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend
);

// Define the project's lighter color palette
export const colorPalette = [
    '#E07A6A', // Lighter Muted Red (from #C24A3A)
    '#4ABF95', // Lighter Muted Green (from #0A8F65)
    '#3D4A87', // Lighter Dark Blue (from #1F2A44)
    '#E8A095', // Lighter Muted Red (from #D07A6A)
    '#7ED1B5', // Lighter Muted Green (from #4DB395)
    '#6B7AB5', // Lighter Muted Blue (from #3D4A87)
];

export const baseOptions: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false, // Allow custom height control
    height: 250, // Fixed height for all charts (fits within 300px container with padding)
    plugins: {
        legend: {
            position: 'bottom' as const,
            labels: {
                font: { size: 12, family: 'var(--font-inter), sans-serif' },
                color: '#3D4A87',
            },
        },
        tooltip: {
            backgroundColor: '#3D4A87', // Lighter dark blue
            titleColor: '#FFFFFF',
            bodyColor: '#FFFFFF',
            borderColor: '#E07A6A', // Lighter muted red border
            borderWidth: 1,
        },
    },
};

export const pieOptions: ChartOptions<'pie'> = {
    ...baseOptions,
    elements: {
        arc: {
            borderWidth: 1,
            borderColor: '#3D4A87',
            hoverBorderWidth: 2,
            hoverBorderColor: '#1F2A44', // Slightly darker on hover
            hoverOffset: 8,
        },
    },
};

export const doughnutOptions: ChartOptions<'doughnut'> = {
    ...baseOptions,
    elements: {
        arc: {
            borderWidth: 1,
            borderColor: '#3D4A87', // Lighter dark blue border for doughnut segments
        },
    },
};

export const barOptions: ChartOptions<'bar'> = {
    ...baseOptions,
    plugins: {
        legend: {
            display: false, // No legend for single-dataset bar charts
        },
    },
    scales: {
        x: {
            grid: {
                display: false,
            },
            ticks: {
                color: '#3D4A87', // Lighter dark blue for axis labels
                maxRotation: 45, // Rotate labels if needed to prevent overlap
                autoSkip: true,
            },
        },
        y: {
            grid: {
                color: '#3D4A87', // Lighter dark blue for grid lines
                borderDash: [5, 5], // Dashed grid lines
            },
            ticks: {
                color: '#3D4A87', // Lighter dark blue for axis labels
            },
        },
    },
};

export const lineOptions: ChartOptions<'line'> = {
    ...baseOptions,
    plugins: {
        legend: {
            display: false, // No legend for single-dataset line charts
        },
    },
    scales: {
        x: {
            grid: {
                display: false,
            },
            ticks: {
                color: '#3D4A87', // Lighter dark blue for axis labels
                maxRotation: 45, // Rotate labels if needed to prevent overlap
                autoSkip: true,
            },
        },
        y: {
            grid: {
                color: '#3D4A87', // Lighter dark blue for grid lines
                borderDash: [5, 5], // Dashed grid lines
            },
            ticks: {
                color: '#3D4A87', // Lighter dark blue for axis labels
            },
        },
    },
};

export const generateChartData = (chartData: ChartData): ChartJsData<'pie' | 'bar' | 'line' | 'doughnut', number[], string> | null => {
    if (!chartData || !chartData.labels || !chartData.data) return null;

    if (chartData.chartType === 'pie') {
        return {
            labels: chartData.labels,
            datasets: [
                {
                    label: chartData.title,
                    data: chartData.data,
                    backgroundColor: chartData.labels.map((_, i) => colorPalette[i % colorPalette.length]),
                    borderWidth: 1,
                    borderColor: '#3D4A87', // Lighter dark blue border
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
                    hoverBackgroundColor: chartData.labels.map((_, i) => colorPalette[i % colorPalette.length].replace(/([0-9A-F]{6})/i, '$1CC')), // Slightly darker on hover (80% opacity)
                    borderWidth: 1,
                    borderColor: '#3D4A87',
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
                    backgroundColor: '#4ABF9520', // Lighter muted green fill for the area under the line (25% opacity)
                    borderColor: '#4ABF95', // Lighter muted green line
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#4ABF95', // Lighter muted green points
                    pointBorderColor: '#3D4A87', // Lighter dark blue point borders
                    pointBorderWidth: 2,
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
                    borderColor: '#3D4A87', // Lighter dark blue border
                },
            ],
        };
    }

    return null;
};
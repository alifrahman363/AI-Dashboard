import axios from 'axios';
import { ChartData, ExcelAnalysisResult } from '../../types';

export class ExcelService {
    private baseUrl: string;

    constructor(baseUrl: string = 'http://10.38.62.7:8000') {
        this.baseUrl = baseUrl;
    }

    /**
     * Analyze Excel file with AI
     */
    async analyzeExcelFile(file: File, prompt: string): Promise<ExcelAnalysisResult> {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('prompt', prompt);

            const response = await axios.post(
                `${this.baseUrl}/deepseek/analyze-excel`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                }
            );

            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to analyze Excel file');
        }
    }

    /**
     * Clean text by removing <think> tags and their content
     */
    cleanText(text: string): string {
        // Remove <think>...</think> blocks (including multiline)
        const cleanedText = text.replace(/<think>[\s\S]*?<\/think>/gi, '');

        // Remove any extra whitespace that might be left
        return cleanedText.trim();
    }

    /**
     * Normalize ChartDataForExcel to ChartData for ChartCard
     */
    normalizeChartData(excelResult: ExcelAnalysisResult): ChartData {
        return {
            ...excelResult.chartData,
            query: excelResult.chartData.query || 'N/A (Excel data)',
        };
    }

    /**
     * Process Excel analysis result
     */
    processExcelAnalysis(excelResult: ExcelAnalysisResult): {
        summary: string;
        chartData: ChartData;
    } {
        const cleanedSummary = this.cleanText(excelResult.summary || '');
        const normalizedChartData = this.normalizeChartData(excelResult);

        return {
            summary: cleanedSummary,
            chartData: normalizedChartData,
        };
    }

    /**
     * Validate Excel file
     */
    validateExcelFile(file: File): { isValid: boolean; error?: string } {
        const validExtensions = ['.xlsx', '.xls'];
        const fileExtension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

        if (!validExtensions.includes(fileExtension)) {
            return {
                isValid: false,
                error: 'Please upload a valid Excel file (.xlsx or .xls)'
            };
        }

        return { isValid: true };
    }
}
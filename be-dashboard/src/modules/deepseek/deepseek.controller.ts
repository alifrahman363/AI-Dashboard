import { Controller, Post, Body, HttpException, HttpStatus, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { DeepseekService } from './deepseek.service';

interface ChartData {
    chartType: 'bar' | 'pie' | 'line' | 'doughnut';
    labels: string[];
    data: number[];
    title: string;
    prompt: string;
    query: string;
    pinnedChartId?: number; // Optional, used for pinned charts
}

@Controller('deepseek')
export class DeepseekController {
    constructor(
        private readonly deepseekService: DeepseekService
    ) { }

    @Post('prompt')
    async sendPrompt(@Body('prompt') prompt: string) {
        if (!prompt) {
            throw new HttpException('Prompt is required', HttpStatus.BAD_REQUEST);
        }
        return await this.deepseekService.sendPrompt(prompt);
    }

    @Get('pinned-charts')
    async getPinnedCharts(): Promise<ChartData[]> {
        return this.deepseekService.getPinnedCharts();
    }

    @Post('download-chart')
    async downloadChart(
        @Body() chartData: { chartType: 'bar' | 'pie' | 'line' | 'doughnut'; labels: string[]; data: number[]; title: string; prompt: string; query: string },
        @Body('format') format: 'png' | 'pdf' = 'png',
        @Res() res: Response,
    ) {
        const buffer = await this.deepseekService.downloadChart(chartData as ChartData, format);
        res.set({
            'Content-Disposition': `attachment; filename="chart.${format}"`,
        });
        res.status(HttpStatus.OK).send(buffer);
    }
}
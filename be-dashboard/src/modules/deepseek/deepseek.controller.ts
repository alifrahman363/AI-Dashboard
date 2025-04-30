import { Controller, Post, Body, HttpException, HttpStatus, Get } from '@nestjs/common';
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
}
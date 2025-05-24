import { Body, Controller, Get, HttpException, HttpStatus, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { DeepseekService } from './deepseek.service';

// Define the ExcelAnalysisResult interface or import it from the appropriate file
export interface ExcelAnalysisResult {
    summary: string;
    insights?: string[];
    [key: string]: any;
}

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

    @Post('analyze-excel')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads',
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
                },
            }),
            fileFilter: (req, file, cb) => {
                const allowedTypes = ['.xlsx', '.xls'];
                const ext = extname(file.originalname).toLowerCase();
                if (allowedTypes.includes(ext)) {
                    cb(null, true);
                } else {
                    cb(new HttpException('Only Excel files (.xlsx, .xls) are allowed', HttpStatus.BAD_REQUEST), false);
                }
            },
            limits: { fileSize: 10 * 1024 * 1024 },
        }),
    )
    async analyzeExcel(
        @UploadedFile() file: Express.Multer.File,
        @Body('prompt') prompt: string,
    ): Promise<ExcelAnalysisResult> {
        if (!file) {
            throw new HttpException('Excel file is required', HttpStatus.BAD_REQUEST);
        }
        if (!prompt) {
            throw new HttpException('Prompt is required', HttpStatus.BAD_REQUEST);
        }
        return await this.deepseekService.analyzeExcel(file, prompt);
    }
} 
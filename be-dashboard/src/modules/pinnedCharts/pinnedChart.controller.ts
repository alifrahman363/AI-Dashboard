import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CreatePinnedChartDto } from './createPinnedChart.dto';
import { PinnedChartDto } from './pinnedChart.dto';
import { PinnedChartsService } from './pinnedChart.service';

@Controller('pinned-charts')
export class PinnedChartsController {
    constructor(private readonly pinnedChartsService: PinnedChartsService) { }

    @Post('pin')
    async pinChart(@Body() createPinnedChartDto: CreatePinnedChartDto): Promise<PinnedChartDto> {
        return this.pinnedChartsService.pinChart(createPinnedChartDto);
    }

    @Get()
    async getPinnedCharts(): Promise<PinnedChartDto[]> {
        return this.pinnedChartsService.getPinnedCharts();
    }

    @Post('check')
    async isChartPinned(@Body() body: { prompt: string; query: string }) {
        return this.pinnedChartsService.isChartPinned(body.prompt, body.query);
    }

    @Get(':id/data')
    async getChartData(@Param('id', ParseIntPipe) id: number) {
        return this.pinnedChartsService.getChartData(id);
    }

    @Post(':id/unpin')
    async unpinChart(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.pinnedChartsService.unpinChart(id);
    }
}
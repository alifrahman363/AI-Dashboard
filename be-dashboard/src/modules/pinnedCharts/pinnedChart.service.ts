import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getConnection, Repository } from 'typeorm';
import { CreatePinnedChartDto } from './createPinnedChart.dto';
import { PinnedChartDto } from './pinnedChart.dto';
import { PinnedChart } from './pinnedChart.entity';

@Injectable()
export class PinnedChartsService {
    constructor(
        @InjectRepository(PinnedChart)
        private pinnedChartRepository: Repository<PinnedChart>,
    ) { }

    // Pin a chart
    async pinChart(createPinnedChartDto: CreatePinnedChartDto): Promise<PinnedChartDto> {
        const pinnedChart = this.pinnedChartRepository.create({
            prompt: createPinnedChartDto.prompt,
            query: createPinnedChartDto.query,
            isPinned: createPinnedChartDto.isPinned ?? true,
        });
        const savedChart = await this.pinnedChartRepository.save(pinnedChart);
        return this.mapToDto(savedChart);
    }

    // Get all pinned charts
    async getPinnedCharts(): Promise<PinnedChartDto[]> {
        const pinnedCharts = await this.pinnedChartRepository.find({
            where: { isPinned: true },
            order: { createdAt: 'DESC' },
        });
        return pinnedCharts.map(chart => this.mapToDto(chart));
    }

    // Check if a chart is pinned by prompt and query
    async isChartPinned(prompt: string, query: string): Promise<PinnedChartDto | null> {
        const pinnedChart = await this.pinnedChartRepository.findOne({
            where: { prompt, query, isPinned: true },
        });
        return pinnedChart ? this.mapToDto(pinnedChart) : null;
    }

    // Run the stored query for a pinned chart and return the data
    async getChartData(pinnedChartId: number): Promise<any> {
        const pinnedChart = await this.pinnedChartRepository.findOne({
            where: { id: pinnedChartId, isPinned: true },
        });

        if (!pinnedChart) {
            throw new NotFoundException('Pinned chart not found');
        }

        const connection = getConnection();
        const queryRunner = connection.createQueryRunner();
        await queryRunner.connect();
        const data = await queryRunner.query(pinnedChart.query);
        await queryRunner.release();

        return { prompt: pinnedChart.prompt, data };
    }

    // Unpin a chart
    async unpinChart(pinnedChartId: number): Promise<void> {
        const pinnedChart = await this.pinnedChartRepository.findOne({
            where: { id: pinnedChartId },
        });

        if (!pinnedChart) {
            throw new NotFoundException('Pinned chart not found');
        }

        pinnedChart.isPinned = false;
        await this.pinnedChartRepository.save(pinnedChart);
    }

    // Map entity to DTO
    private mapToDto(pinnedChart: PinnedChart): PinnedChartDto {
        return {
            id: pinnedChart.id,
            prompt: pinnedChart.prompt,
            query: pinnedChart.query,
            isPinned: pinnedChart.isPinned,
            createdAt: pinnedChart.createdAt,
            updatedAt: pinnedChart.updatedAt,
        };
    }
}
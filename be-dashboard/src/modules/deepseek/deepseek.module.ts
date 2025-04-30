import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeepseekService } from './deepseek.service';
import { DeepseekController } from './deepseek.controller';
import { PinnedChart } from '../pinnedCharts/pinnedChart.entity';

@Module({
    imports: [HttpModule, TypeOrmModule.forFeature([PinnedChart])], // No entities needed for raw queries
    providers: [DeepseekService],
    controllers: [DeepseekController],
})
export class DeepseekModule { }
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PinnedChartsController } from './pinnedChart.controller';
import { PinnedChart } from './pinnedChart.entity';
import { PinnedChartsService } from './pinnedChart.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([PinnedChart]), // Register repositories
        // Import ProductModule
    ],
    controllers: [PinnedChartsController],
    providers: [PinnedChartsService],
})
export class PinnedChartsModule { }

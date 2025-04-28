import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeepseekService } from './deepseek.service';
import { DeepseekController } from './deepseek.controller';

@Module({
    imports: [HttpModule, TypeOrmModule.forFeature([])], // No entities needed for raw queries
    providers: [DeepseekService],
    controllers: [DeepseekController],
})
export class DeepseekModule { }
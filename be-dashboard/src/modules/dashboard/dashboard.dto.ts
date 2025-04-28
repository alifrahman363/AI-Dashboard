import { IsNotEmpty, IsString } from "class-validator";

// src/dashboard/dto/generate-chart.dto.ts
export class GenerateChartDto {
    @IsNotEmpty()
    @IsString()
    readonly prompt: string;
}

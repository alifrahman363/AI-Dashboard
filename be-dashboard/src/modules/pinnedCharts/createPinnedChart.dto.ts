import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePinnedChartDto {
    @IsNotEmpty()
    @IsString()
    readonly prompt: string;

    @IsNotEmpty()
    @IsString()
    readonly query: string;

    @IsOptional()
    @IsBoolean()
    readonly isPinned?: boolean;
}
import { IsBoolean, IsDate, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class PinnedChartDto {
    @IsNumber()
    readonly id: number;

    @IsNotEmpty()
    @IsString()
    readonly prompt: string;

    @IsNotEmpty()
    @IsString()
    readonly query: string;

    @IsBoolean()
    readonly isPinned: boolean;

    @IsDate()
    readonly createdAt: Date;

    @IsDate()
    readonly updatedAt: Date;
}
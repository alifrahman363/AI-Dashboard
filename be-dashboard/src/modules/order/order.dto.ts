import { IsNotEmpty, IsNumber, IsArray, ArrayNotEmpty, IsOptional, IsIn, Min } from 'class-validator';

export class OrderDto {
    @IsNotEmpty()
    @IsNumber()
    readonly userId: number;

    @IsArray()
    @ArrayNotEmpty()
    readonly productIds: number[];

    @IsOptional()
    @IsIn(['PERCENT', 'FIXED'])
    readonly discountType?: 'PERCENT' | 'FIXED'; // Discount type: PERCENT or FIXED

    @IsOptional()
    @IsNumber()
    @Min(0)
    readonly discountValue?: number; // Discount value
}

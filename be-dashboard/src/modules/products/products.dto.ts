
import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';

export class ProductDto {
    @IsNotEmpty()
    @IsString()
    readonly name: string;

    @IsNotEmpty()
    @IsString()
    readonly description: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    readonly price: number;
}
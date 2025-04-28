// src/product/product.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ProductService } from './products.service';
import { ProductDto } from './products.dto';

@Controller('products')
export class ProductController {
    constructor(private readonly productService: ProductService) { }

    // Create a new product
    @Post('create')
    async create(@Body() productDto: ProductDto) {
        return await this.productService.create(productDto);
    }

    // Get all products
    @Get()
    async findAll() {
        return await this.productService.findAll();
    }

    // Get a specific product by ID
    @Get(':id')
    async findOne(@Param('id') id: number) {
        return await this.productService.findOne(id);
    }

    // Update a product by ID
    @Put(':id')
    async update(@Param('id') id: number, @Body() productDto: ProductDto) {
        return await this.productService.update(id, productDto);
    }

    // Delete a product by ID
    @Delete(':id')
    async remove(@Param('id') id: number) {
        return await this.productService.remove(id);
    }
}

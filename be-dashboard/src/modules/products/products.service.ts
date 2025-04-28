// src/product/product.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './products.entity';
import { ProductDto } from './products.dto';

@Injectable()
export class ProductService {
    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
    ) { }

    // Create a new product
    async create(productDto: ProductDto): Promise<Product> {
        const product = this.productRepository.create(productDto);
        return await this.productRepository.save(product);
    }

    // Get all products
    async findAll(): Promise<Product[]> {
        return await this.productRepository.find();
    }

    // Get product by ID
    async findOne(id: number): Promise<Product> {
        const product = await this.productRepository.findOne({ where: { id } });
        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found.`);
        }
        return product;
    }

    // Update product
    async update(id: number, productDto: ProductDto): Promise<Product> {
        const product = await this.findOne(id);
        Object.assign(product, productDto);
        return await this.productRepository.save(product);
    }

    // Delete product
    async remove(id: number): Promise<void> {
        const product = await this.findOne(id);
        await this.productRepository.remove(product);
    }
}

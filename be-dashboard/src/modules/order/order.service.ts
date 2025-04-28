// src/order/order.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './order.entity';
import { User } from '../user/user.entity';
import { Product } from '../products/products.entity';
import { OrderDto } from './order.dto';

@Injectable()
export class OrderService {
    constructor(
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
    ) { }

    // Calculate Discount
    private calculateDiscount(subtotal: number, discountType?: string, discountValue?: number): number {
        if (!discountType || !discountValue) return 0;

        if (discountType === 'PERCENT') {
            return (subtotal * discountValue) / 100;
        } else if (discountType === 'FIXED') {
            return Math.min(discountValue, subtotal); // Prevent negative totals
        }
        return 0;
    }

    // Create Order with Discount
    async create(orderDto: OrderDto): Promise<Order> {
        const user = await this.userRepository.findOne({ where: { id: orderDto.userId } });
        if (!user) throw new NotFoundException('User not found.');

        const products = await this.productRepository.findByIds(orderDto.productIds);
        if (products.length !== orderDto.productIds.length) {
            throw new BadRequestException('One or more products are invalid.');
        }

        const subtotal = products.reduce((sum, product) => sum + Number(product.price), 0);
        const discount = this.calculateDiscount(subtotal, orderDto.discountType, orderDto.discountValue);
        const totalPrice = subtotal - discount;

        const order = this.orderRepository.create({
            user,
            products,
            subtotal,
            discount,
            total_price: totalPrice,
        });

        return await this.orderRepository.save(order);
    }

    async findAll(): Promise<Order[]> {
        return await this.orderRepository.find();
    }

    async findOne(id: number): Promise<Order> {
        const order = await this.orderRepository.findOne({ where: { id } });
        if (!order) throw new NotFoundException(`Order with ID ${id} not found.`);
        return order;
    }
}

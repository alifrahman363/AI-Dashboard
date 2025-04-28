// src/order/order.controller.ts
import { Controller, Post, Get, Param, Body, ParseIntPipe } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderDto } from './order.dto';

@Controller('orders')
export class OrderController {
    constructor(private readonly orderService: OrderService) { }

    /**
     * 🛒 Place a New Order
     * 
     * Request Body:
     * - userId: number (required)
     * - productIds: number[] (required)
     * - discountType: 'PERCENT' | 'FIXED' (optional)
     * - discountValue: number (optional)
     */
    @Post()
    async create(@Body() orderDto: OrderDto) {
        return await this.orderService.create(orderDto);
    }

    /**
     * 📋 Get All Orders
     * 
     * Endpoint: GET /orders
     */
    @Get()
    async findAll() {
        return await this.orderService.findAll();
    }

    /**
     * 🔍 Get Order by ID
     * 
     * Endpoint: GET /orders/:id
     */
    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return await this.orderService.findOne(id);
    }
}

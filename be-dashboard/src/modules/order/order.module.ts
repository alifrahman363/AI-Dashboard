// src/order/order.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { User } from '../user/user.entity';
import { Product } from '../products/products.entity';
import { UserModule } from '../user/user.module';
import { ProductModule } from '../products/products.module';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Order, User, Product]), // Register repositories
        UserModule,                                       // Import UserModule
        ProductModule                                    // Import ProductModule
    ],
    controllers: [OrderController],
    providers: [OrderService],
})
export class OrderModule { }

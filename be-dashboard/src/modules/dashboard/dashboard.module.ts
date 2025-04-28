import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { Product } from '../products/products.entity';
import { Order } from '../order/order.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User, Product, Order])],
    controllers: [DashboardController],
    providers: [DashboardService],
})
export class DashboardModule { }

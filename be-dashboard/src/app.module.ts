// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ProductModule } from './modules/products/products.module';
import { UserModule } from './modules/user/user.module';
import { OrderModule } from './modules/order/order.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DeepseekModule } from './modules/deepseek/deepseek.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'SSE',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    // ElasticsearchModule.register({
    //   node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    // }),
    ProductModule,
    UserModule,
    OrderModule,
    DashboardModule,
    DeepseekModule,
    HttpModule
  ],
})
export class AppModule { }

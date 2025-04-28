import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, ManyToMany, JoinTable, Column, CreateDateColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { Product } from '../products/products.entity';

@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, (user) => user.orders, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToMany(() => Product, { eager: true, cascade: true }) // Added cascade
    @JoinTable({
        name: 'order_products',
        joinColumn: { name: 'order_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'product_id', referencedColumnName: 'id' },
    })
    products: Product[];

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    subtotal: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    discount: number; // Discount applied to the order

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    total_price: number; // Final price after discount

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;
}

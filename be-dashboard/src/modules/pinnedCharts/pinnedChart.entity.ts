import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('pinned_charts')
export class PinnedChart {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text' })
    prompt: string;

    @Column({ type: 'text' })
    query: string;

    @Column({ name: 'is_pinned', default: true })
    isPinned: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
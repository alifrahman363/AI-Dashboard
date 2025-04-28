// // src/user/entities/user.entity.ts
// import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

// @Entity('tblUser')
// export class User {
//     @PrimaryGeneratedColumn()
//     id: number;

//     @Column({ type: 'varchar', length: 50, unique: true })
//     username: string;

//     @Column({ type: 'varchar', length: 100, unique: true })
//     email: string;

//     @Column({ type: 'varchar', length: 255 })  // For storing hashed passwords
//     password: string;

//     @CreateDateColumn({ type: 'timestamp' })
//     created_at: Date;
// }

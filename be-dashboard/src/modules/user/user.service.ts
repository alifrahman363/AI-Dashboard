// src/user/user.service.ts
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { UserDto } from './user.dto';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    // Register new user
    async create(userDto: UserDto): Promise<User> {
        const existingUser = await this.userRepository.findOne({ where: { email: userDto.email } });
        if (existingUser) {
            throw new ConflictException('Email is already registered.');
        }

        const hashedPassword = await bcrypt.hash(userDto.password, 10);
        const newUser = this.userRepository.create({
            ...userDto,
            password: hashedPassword,
        });

        return await this.userRepository.save(newUser);
    }

    // Find user by email (for login)
    async findByEmail(email: string): Promise<User> {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            throw new NotFoundException('User not found.');
        }
        return user;
    }
}

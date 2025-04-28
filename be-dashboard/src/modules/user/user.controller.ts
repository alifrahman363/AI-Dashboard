// src/user/user.controller.ts
import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { UserService } from './user.service';
import * as bcrypt from 'bcrypt';
import { UserDto } from './user.dto';

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Post('signup')
    async signup(@Body() userDto: UserDto) {
        return await this.userService.create(userDto);
    }

    @Post('login')
    async login(@Body() { email, password }: { email: string; password: string }) {
        const user = await this.userService.findByEmail(email);
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new BadRequestException('Invalid credentials.');
        }

        return { message: 'Login successful', user };
    }
}

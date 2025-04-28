import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { DeepseekService } from './deepseek.service';

@Controller('deepseek')
export class DeepseekController {
    constructor(
        private readonly deepseekService: DeepseekService
    ) { }

    @Post('prompt')
    async sendPrompt(@Body('prompt') prompt: string) {
        if (!prompt) {
            throw new HttpException('Prompt is required', HttpStatus.BAD_REQUEST);
        }
        return await this.deepseekService.sendPrompt(prompt);
    }
}
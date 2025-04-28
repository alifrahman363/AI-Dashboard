import { Controller, Post, Body } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Post()
    async handleQuery(@Body() body: { query: string }) {
        console.log("got query", body.query);
        return this.dashboardService.processQuery(body.query);
    }
}

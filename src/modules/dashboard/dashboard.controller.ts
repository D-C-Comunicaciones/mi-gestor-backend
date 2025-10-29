import { Controller, Get, UseGuards} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { Permissions } from '@modules/auth/decorators';
import { SwaggerDashboard } from '@common/decorators/swagger';
import { DashboardResponse } from './interfaces';
import { plainToInstance } from 'class-transformer';
import { ResponseDashboardDto } from './dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @Permissions('view.dashboard')
  @SwaggerDashboard()
  async getDashboard(): Promise<DashboardResponse> {
    const rawMetrics = await this.dashboardService.getDashboardForLast30Days();

    const metrics = plainToInstance(
      ResponseDashboardDto,
      rawMetrics,
      { excludeExtraneousValues: true }
    );

    return {
      customMessage: 'Dashboard data recuperada correctamente',
      metrics,
    };
  }
}

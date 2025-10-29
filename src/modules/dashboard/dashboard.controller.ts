import { Controller, Get, UseGuards} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { Permissions } from '@modules/auth/decorators';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @Permissions('view.dashboard')
  async getDashboard() {
    const metrics = await this.dashboardService.getDashboardForLast30Days();

    return {
      customMessage: 'Dashboard data recuperada correctamente',
      metrics,
    };
  }
}

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ChangesService } from './changes.service';
import { ChangesListResponse } from './interfaces';
import { plainToInstance } from 'class-transformer';
import { AuditPaginationDto, ResponseChangeDto } from './dto';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { Permissions } from '@modules/auth/decorators';
import { SwaggerChangesList } from '@common/decorators/swagger';

@Controller('changes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ChangesController {
  constructor(private readonly ChangesService: ChangesService) { }

  @Get()
  @Permissions('read.changes')
  @SwaggerChangesList()
  async findAll(@Query() query: AuditPaginationDto): Promise<ChangesListResponse> {
    const { rawChanges, meta } = await this.ChangesService.findAll(query);

    const changes = plainToInstance(ResponseChangeDto, Array.isArray(rawChanges) ? rawChanges : [rawChanges], {
      excludeExtraneousValues: true,
    });

    return {
      customMessage: 'Lista de cambios realizados en modelos',
      changes,
      meta,
    }
  }

}

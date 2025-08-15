import { Controller, Get, Query } from '@nestjs/common';
import { ChangesService } from './changes.service';
import { ChangesListResponse } from './interfaces';
import { plainToInstance } from 'class-transformer';
import { AuditPaginationDto, ResponseChangeDto } from './dto';

@Controller('Changes')
export class ChangesController {
  constructor(private readonly ChangesService: ChangesService) { }

  @Get()
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

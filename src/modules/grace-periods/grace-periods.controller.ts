import { Controller, Get } from '@nestjs/common';
import { GracePeriodsService } from './grace-periods.service';
import { plainToInstance } from 'class-transformer';
import { ResponseGracePeriodDto } from './dto';
import { GracePeriodListResponse } from './interfaces';

@Controller('grace-periods')
export class GracePeriodsController {
  constructor(private readonly gracePeriodsService: GracePeriodsService) {}

//   @Post()
//   create(@Body() createGracePeriodDto: CreateGracePeriodDto) {
//     return this.gracePeriodsService.create(createGracePeriodDto);
//   }
// 
  @Get()
  async findAll(): Promise <GracePeriodListResponse> {
    const rawgracePeriods = await this.gracePeriodsService.findAll();

    const gracePeriods = plainToInstance(ResponseGracePeriodDto, rawgracePeriods, { excludeExtraneousValues: true });
    return {
      customMessage: 'Lista de periodos de gracia',
      gracePeriods
    };
  }
// 
//   @Get(':id')
//   findOne(@Param('id') id: string) {
//     return this.gracePeriodsService.findOne(+id);
//   }
// 
//   @Patch(':id')
//   update(@Param('id') id: string, @Body() updateGracePeriodDto: UpdateGracePeriodDto) {
//     return this.gracePeriodsService.update(+id, updateGracePeriodDto);
//   }
// 
//   @Delete(':id')
//   remove(@Param('id') id: string) {
//     return this.gracePeriodsService.remove(+id);
//   }
}

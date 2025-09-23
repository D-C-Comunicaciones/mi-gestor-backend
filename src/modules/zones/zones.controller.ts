import { Controller, Get } from '@nestjs/common';
import { ZonesService } from './zones.service';
import { ZoneListResponse } from './interfaces';
import { plainToInstance } from 'class-transformer';
import { ResponseZoneDto } from './dto';

@Controller('zones')
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  // @Post()
  // create(@Body() createZoneDto: CreateZoneDto) {
  //   return this.zonesService.create(createZoneDto);
  // }

  @Get()
  async findAll(): Promise<ZoneListResponse> {
    const rawZones = await this.zonesService.findAll();
    const zones = plainToInstance(ResponseZoneDto, rawZones, { excludeExtraneousValues: true });
    return {
      customMessage: 'Listado de zonas',
      zones,
    };
  }

//   @Get(':id')
//   findOne(@Param('id') id: string) {
//     return this.zonesService.findOne(+id);
//   }
// 
//   @Patch(':id')
//   update(@Param('id') id: string, @Body() updateZoneDto: UpdateZoneDto) {
//     return this.zonesService.update(+id, updateZoneDto);
//   }
// 
//   @Delete(':id')
//   remove(@Param('id') id: string) {
//     return this.zonesService.remove(+id);
//   }
}

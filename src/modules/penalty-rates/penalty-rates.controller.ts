import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PenaltyRatesService } from './penalty-rates.service';
import { CreatePenaltyRateDto } from './dto/create-penalty-rate.dto';
import { UpdatePenaltyRateDto } from './dto/update-penalty-rate.dto';
import { plainToInstance } from 'class-transformer';
import { ResponsePenaltyRateDto } from './dto';
import { PenaltyRateListResponse } from './interfaces';

@Controller('penalty-rates')
export class PenaltyRatesController {
  constructor(private readonly penaltyRatesService: PenaltyRatesService) {}

//   @Post()
//   create(@Body() createPenaltyRateDto: CreatePenaltyRateDto) {
//     return this.penaltyRatesService.create(createPenaltyRateDto);
//   }
// 
  @Get()
  async findAll(): Promise<PenaltyRateListResponse> {
    const rawPenaltyRates = await this.penaltyRatesService.findAll();

    const penaltyRates = plainToInstance(ResponsePenaltyRateDto, rawPenaltyRates, { excludeExtraneousValues: true });

    return {
      customMessage: 'Lista de tasas de penalización',
      penaltyRates,
    };
  }
// 
//   @Get(':id')
//   findOne(@Param('id') id: string) {
//     return this.penaltyRatesService.findOne(+id);
//   }
// 
//   @Patch(':id')
//   update(@Param('id') id: string, @Body() updatePenaltyRateDto: UpdatePenaltyRateDto) {
//     return this.penaltyRatesService.update(+id, updatePenaltyRateDto);
//   }
// 
//   @Delete(':id')
//   remove(@Param('id') id: string) {
//     return this.penaltyRatesService.remove(+id);
//   }
}

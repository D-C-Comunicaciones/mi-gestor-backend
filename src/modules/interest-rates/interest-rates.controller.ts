import { Controller, Get } from '@nestjs/common';
import { InterestRatesService } from './interest-rates.service';
import { plainToInstance } from 'class-transformer';
import { ResponseInterestRateDto } from './dto';
import { InterestRateListResponse } from './interfaces';

@Controller('interest-rates')
export class InterestRatesController {
  constructor(private readonly interestRatesService: InterestRatesService) {}

//   @Post()
//   create(@Body() createInterestRateDto: CreateInterestRateDto) {
//     return this.interestRatesService.create(createInterestRateDto);
//   }
// 
  @Get()
  async findAll(): Promise<InterestRateListResponse> {
    const rawInterestRate = await this.interestRatesService.findAll();

    const interestRates = plainToInstance(ResponseInterestRateDto, rawInterestRate, { excludeExtraneousValues: true });

    return { 
      customMessage: 'Tasas de Interés corriente',
      interestRates 
    };
  }
// 
//   @Get(':id')
//   findOne(@Param('id') id: string) {
//     return this.interestRatesService.findOne(+id);
//   }
// 
//   @Patch(':id')
//   update(@Param('id') id: string, @Body() updateInterestRateDto: UpdateInterestRateDto) {
//     return this.interestRatesService.update(+id, updateInterestRateDto);
//   }
// 
//   @Delete(':id')
//   remove(@Param('id') id: string) {
//     return this.interestRatesService.remove(+id);
//   }
}

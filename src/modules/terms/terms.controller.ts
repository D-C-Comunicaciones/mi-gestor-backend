import { Controller, Get } from '@nestjs/common';
import { TermsService } from './terms.service';
import { plainToInstance } from 'class-transformer';
import { TermListResponse } from './interfaces';
import { ResponseTermDto } from './dto';

@Controller('terms')
export class TermsController {
  constructor(private readonly termsService: TermsService) {}

//   @Post()
//   create(@Body() createTermDto: CreateTermDto) {
//     return this.termsService.create(createTermDto);
//   }
// 
  @Get()
  async findAll(): Promise <TermListResponse> {
    const rawTerms = await this.termsService.findAll();

    const terms = plainToInstance(ResponseTermDto, rawTerms, { excludeExtraneousValues: true });
    return { 
      customMessage: 'Número de Cuotas',
      terms 
    };
  }
// 
//   @Get(':id')
//   findOne(@Param('id') id: string) {
//     return this.termsService.findOne(+id);
//   }
// 
//   @Patch(':id')
//   update(@Param('id') id: string, @Body() updateTermDto: UpdateTermDto) {
//     return this.termsService.update(+id, updateTermDto);
//   }
// 
//   @Delete(':id')
//   remove(@Param('id') id: string) {
//     return this.termsService.remove(+id);
//   }
}

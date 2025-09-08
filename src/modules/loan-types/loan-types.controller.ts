import { Controller, Get } from '@nestjs/common';
import { LoanTypesService } from './loan-types.service';
import { plainToInstance } from 'class-transformer';
import { ResponseLoantypeDto } from './dto';
import { LoanTypeListResponse } from './interfaces';

@Controller('loan-types')
export class LoanTypesController {
  constructor(private readonly loanTypesService: LoanTypesService) {}

  // @Post()
  // create(@Body() createLoanTypeDto: CreateLoanTypeDto) {
  //   return this.loanTypesService.create(createLoanTypeDto);
  // }

  @Get()
  async findAll(): Promise <LoanTypeListResponse> {
    const rawLoanTypes = await this.loanTypesService.findAll();
    const loanTypes = plainToInstance(ResponseLoantypeDto, rawLoanTypes, { excludeExtraneousValues: true });
    return {
      customMessage: 'Listado de tipos de crédito',
      loanTypes
    }
  }

//   @Get(':id')
//   findOne(@Param('id') id: string) {
//     return this.loanTypesService.findOne(+id);
//   }
// 
//   @Patch(':id')
//   update(@Param('id') id: string, @Body() updateLoanTypeDto: UpdateLoanTypeDto) {
//     return this.loanTypesService.update(+id, updateLoanTypeDto);
//   }
// 
//   @Delete(':id')
//   remove(@Param('id') id: string) {
//     return this.loanTypesService.remove(+id);
//   }
}

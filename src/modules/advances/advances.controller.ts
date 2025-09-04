import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AdvancesService } from './advances.service';
import { CreateAdvanceDto } from './dto/create-advance.dto';

@Controller('advances')
export class AdvancesController {
  constructor(private readonly advancesService: AdvancesService) {}

  @Post()
  async create(@Body() createAdvanceDto: CreateAdvanceDto) {
    return await this.advancesService.create(createAdvanceDto);
  }

  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('customerId') customerId?: number,
    @Query('loanId') loanId?: number,
  ) {
    return await this.advancesService.findAll(+page, +limit, { customerId: customerId ? +customerId : undefined, loanId: loanId ? +loanId : undefined });
  }

  @Post('apply/:loanId')
  async applyToInstallments(@Param('loanId') loanId: string) {
    return await this.advancesService.applyAdvanceToNextInstallments(+loanId);
  }
}

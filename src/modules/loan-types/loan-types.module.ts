import { Module } from '@nestjs/common';
import { LoanTypesService } from './loan-types.service';
import { LoanTypesController } from './loan-types.controller';

@Module({
  controllers: [LoanTypesController],
  providers: [LoanTypesService],
})
export class LoanTypesModule {}

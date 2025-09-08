import { Module } from '@nestjs/common';
import { InterestRatesService } from './interest-rates.service';
import { InterestRatesController } from './interest-rates.controller';

@Module({
  controllers: [InterestRatesController],
  providers: [InterestRatesService],
})
export class InterestRatesModule {}

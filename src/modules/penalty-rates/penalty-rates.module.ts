import { Module } from '@nestjs/common';
import { PenaltyRatesService } from './penalty-rates.service';
import { PenaltyRatesController } from './penalty-rates.controller';

@Module({
  controllers: [PenaltyRatesController],
  providers: [PenaltyRatesService],
})
export class PenaltyRatesModule {}

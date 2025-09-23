import { Module } from '@nestjs/common';
import { PaymentFrequenciesService } from './payment-frequencies.service';
import { PaymentFrequenciesController } from './payment-frequencies.controller';

@Module({
  controllers: [PaymentFrequenciesController],
  providers: [PaymentFrequenciesService],
})
export class PaymentFrequenciesModule {}

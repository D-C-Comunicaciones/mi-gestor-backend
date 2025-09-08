import { PartialType } from '@nestjs/swagger';
import { CreatePaymentFrequencyDto } from './create-payment-frequency.dto';

export class UpdatePaymentFrequencyDto extends PartialType(CreatePaymentFrequencyDto) {}

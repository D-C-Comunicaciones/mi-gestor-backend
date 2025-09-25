import { PartialType } from '@nestjs/swagger';
import { CalculateAmortizationDto } from './calculate-amortization.dto';

export class UpdateAmortizationDto extends PartialType(CalculateAmortizationDto) {}

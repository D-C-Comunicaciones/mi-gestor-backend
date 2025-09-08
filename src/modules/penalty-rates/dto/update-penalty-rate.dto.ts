import { PartialType } from '@nestjs/swagger';
import { CreatePenaltyRateDto } from './create-penalty-rate.dto';

export class UpdatePenaltyRateDto extends PartialType(CreatePenaltyRateDto) {}

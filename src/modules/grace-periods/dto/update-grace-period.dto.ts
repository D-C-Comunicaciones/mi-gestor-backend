import { PartialType } from '@nestjs/swagger';
import { CreateGracePeriodDto } from './create-grace-period.dto';

export class UpdateGracePeriodDto extends PartialType(CreateGracePeriodDto) {}

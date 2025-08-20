import { PartialType } from '@nestjs/swagger';
import { CreateInstallmentDto } from './create-installment.dto';

export class UpdateInstallmentDto extends PartialType(CreateInstallmentDto) {}

import { PartialType } from '@nestjs/swagger';
import { CreateTypeDiscountDto } from './create-type-discount.dto';

export class UpdateTypeDiscountDto extends PartialType(CreateTypeDiscountDto) {}

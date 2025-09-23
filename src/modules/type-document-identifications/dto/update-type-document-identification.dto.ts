import { PartialType } from '@nestjs/swagger';
import { CreateTypeDocumentIdentificationDto } from './create-type-document-identification.dto';

export class UpdateTypeDocumentIdentificationDto extends PartialType(CreateTypeDocumentIdentificationDto) {}

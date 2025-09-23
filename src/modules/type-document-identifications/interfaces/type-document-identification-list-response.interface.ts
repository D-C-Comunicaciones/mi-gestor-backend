import { ApiProperty } from '@nestjs/swagger';
import { ResponseTypeDocumentIdentificationDto } from '../dto';

export class TypeDocumentIdentificationListResponse {
  @ApiProperty({
    description: 'Mensaje personalizado de la respuesta',
    example: 'Listado de tipos de documentos de identificación',
    type: 'string'
  })
  customMessage: string;

  @ApiProperty({
    description: 'Array de tipos de documentos de identificación',
    type: [ResponseTypeDocumentIdentificationDto],
    isArray: true
  })
  typeDocumentIdentifications: ResponseTypeDocumentIdentificationDto[];
}

import { ApiProperty } from '@nestjs/swagger';
import { ResponseTermDto } from '../dto';

export class TermListResponse {
  @ApiProperty({
    description: 'Mensaje personalizado de la respuesta',
    example: 'Número de Cuotas',
    type: 'string'
  })
  customMessage: string;

  @ApiProperty({
    description: 'Array de términos disponibles',
    type: [ResponseTermDto],
    isArray: true
  })
  terms: ResponseTermDto[];
}

import { ApiProperty } from '@nestjs/swagger';
import { ResponsePaymentFrequencyDto } from '../dto';

export class PaymenFrequencyListResponse {
  @ApiProperty({
    description: 'Mensaje personalizado de la respuesta',
    example: 'Listado de frecuencias de pago',
    type: 'string'
  })
  customMessage: string;

  @ApiProperty({
    description: 'Array de frecuencias de pago',
    type: [ResponsePaymentFrequencyDto],
    isArray: true
  })
  paymentFrequencies: ResponsePaymentFrequencyDto[];
}

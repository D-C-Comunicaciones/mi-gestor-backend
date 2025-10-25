import { AmortizationResponseDto, CalculateAmortizationDto } from '@modules/amortizations/dto';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiBadRequestResponse, ApiTags, ApiBody } from '@nestjs/swagger';

export const SwaggerAmortizationDoc = () => {
  return applyDecorators(
    ApiTags('Amortization'),
    ApiOperation({
      summary: 'Calcula el cronograma de amortización',
      description:
        'Recibe los parámetros del préstamo (monto, tasa de interés y número de cuotas) y devuelve el cronograma detallado con capital, interés y saldo restante por cuota.',
    }),
    ApiBody({
      description: 'Parámetros necesarios para calcular la tabla de amortización',
      type: CalculateAmortizationDto,
      required: true,
    }),
    ApiOkResponse({
      description: 'Cálculo exitoso de la tabla de amortización',
      type: AmortizationResponseDto,
    }),
    ApiBadRequestResponse({
      description: 'Error en los parámetros enviados o datos inválidos',
      schema: {
        example: {
          statusCode: 400,
          message: 'El monto y el número de cuotas deben ser mayores que cero',
          error: 'Bad Request',
        },
      },
    }),
  );
};

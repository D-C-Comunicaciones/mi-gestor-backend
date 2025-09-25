import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiInternalServerErrorResponse } from '@nestjs/swagger';
import { PaymentFrequenciesService } from './payment-frequencies.service';
import { PaymenFrequencyListResponse } from './interfaces';
import { ResponsePaymentFrequencyDto } from './dto';
import { plainToInstance } from 'class-transformer';

@ApiTags('paymentFrequencies')
@Controller('payment-frequencies')
export class PaymentFrequenciesController {
  constructor(private readonly paymentFrequenciesService: PaymentFrequenciesService) {}

//   @Post()
//   create(@Body() createPaymentFrequencyDto: CreatePaymentFrequencyDto) {
//     return this.paymentFrequenciesService.create(createPaymentFrequencyDto);
//   }
// 
  @Get()
  @ApiOperation({ 
    summary: 'Listado de frecuencias de pago',
    description: 'Retorna una lista con todas las frecuencias de pago para crear créditos'
  })
  @ApiOkResponse({
    description: 'Lista de frecuencias de pago obtenida exitosamente',
    examples: {
      'success': {
        summary: 'Lista obtenida exitosamente',
        value: {
          customMessage: 'Listado de frecuencias de pago',
          paymentFrequencies: [
            {
              id: 1,
              name: 'Mensual',
              description: 'Pago que se realiza cada mes',
              days: 30,
              isActive: true,
              createdAt: '2024-01-15T10:30:00.000Z',
              updatedAt: '2024-01-20T14:45:00.000Z'
            },
            {
              id: 2,
              name: 'Quincenal',
              description: 'Pago que se realiza cada 15 días',
              days: 15,
              isActive: true,
              createdAt: '2024-01-16T11:30:00.000Z',
              updatedAt: '2024-01-21T15:45:00.000Z'
            }
          ]
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Solicitud incorrecta - Parámetros inválidos',
    examples: {
      'invalid-params': {
        summary: 'Parámetros inválidos',
        value: {
          statusCode: 400,
          message: ['El parámetro proporcionado no es válido'],
          error: 'Bad Request'
        }
      }
    }
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado - Token de acceso requerido o inválido',
    examples: {
      'missing-token': {
        summary: 'Token faltante',
        value: {
          statusCode: 401,
          message: 'Token de acceso requerido',
          error: 'Unauthorized'
        }
      },
      'invalid-token': {
        summary: 'Token inválido o expirado',
        value: {
          statusCode: 401,
          message: 'Token de acceso inválido o expirado',
          error: 'Unauthorized'
        }
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'Acceso prohibido - Permisos insuficientes',
    examples: {
      'insufficient-permissions': {
        summary: 'Sin permisos para acceder al recurso',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para acceder a este recurso',
          error: 'Forbidden'
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Recurso no encontrado',
    examples: {
      'no-frequencies': {
        summary: 'No se encontraron frecuencias',
        value: {
          statusCode: 404,
          message: 'No se encontraron frecuencias de pago',
          error: 'Not Found'
        }
      }
    }
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor',
    examples: {
      'server-error': {
        summary: 'Error interno del servidor',
        value: {
          statusCode: 500,
          message: 'Error interno del servidor al procesar la solicitud',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async findAll(): Promise<PaymenFrequencyListResponse> {
    const rawPaymentFrequencies = await this.paymentFrequenciesService.findAll();
    const paymentFrequencies = plainToInstance(ResponsePaymentFrequencyDto, rawPaymentFrequencies, { excludeExtraneousValues: true });
    return {
      customMessage: 'Listado de frecuencias de pago',
      paymentFrequencies
    };
  }
// 
//   @Get(':id')
//   findOne(@Param('id') id: string) {
//     return this.paymentFrequenciesService.findOne(+id);
//   }
// 
//   @Patch(':id')
//   update(@Param('id') id: string, @Body() updatePaymentFrequencyDto: UpdatePaymentFrequencyDto) {
//     return this.paymentFrequenciesService.update(+id, updatePaymentFrequencyDto);
//   }
// 
//   @Delete(':id')
//   remove(@Param('id') id: string) {
//     return this.paymentFrequenciesService.remove(+id);
//   }
}

import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { Permissions } from '@modules/auth/decorators';
import { plainToInstance } from 'class-transformer';
import { ResponseCollectionDto } from './dto';
import { CollectionResponse } from './interfaces';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiCreatedResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiInternalServerErrorResponse, ApiBody, ApiUnprocessableEntityResponse } from '@nestjs/swagger';

@ApiTags('collections')
@ApiBearerAuth()
@Controller('collections')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) { }

  @Post()
  @Permissions('create.collections')
  @ApiOperation({
    summary: 'Registrar cobro',
    description: 'Registra un nuevo cobro en el sistema. Permite registrar pagos de cuotas, intereses o moratorias'
  })
  @ApiBody({
    type: CreateCollectionDto,
    description: 'Datos del cobro a registrar',
    examples: {
      'cobro-cuota': {
        summary: 'Cobro de cuota completa',
        description: 'Ejemplo de cobro de una cuota completa',
        value: {
          installmentId: 3,
          amount: 146763.32
        }
      },
      'cobro-parcial': {
        summary: 'Cobro parcial de cuota',
        description: 'Ejemplo de cobro parcial cuando el cliente no puede pagar el total',
        value: {
          installmentId: 2,
          amount: 50000
        }
      },
      'cobro-exceso': {
        summary: 'Cobro con exceso',
        description: 'Ejemplo de cobro que genera exceso para aplicar a otras cuotas',
        value: {
          installmentId: 1,
          amount: 500000
        }
      }
    }
  })
  @ApiCreatedResponse({
    description: 'Cobro registrado exitosamente',
    examples: {
      'success': {
        summary: 'Cobro registrado exitosamente',
        value: {
          customMessage: 'Cobro registrado exitosamente',
          collection: {
            paymentId: 25,
            loanId: 2,
            paymentDate: '2025-09-23 14:12:43',
            appliedToCapital: '0.00',
            appliedToInterest: '0.00',
            appliedToLateFee: '0.00',
            excessAmount: '440289.96',
            newRemainingBalance: '958.12',
            isFullyPaid: false,
            allocations: []
          }
        }
      },
      'pago-completo': {
        summary: 'Pago que liquida el préstamo',
        value: {
          customMessage: 'Cobro registrado exitosamente',
          collection: {
            paymentId: 26,
            loanId: 2,
            paymentDate: '2025-09-23 15:30:15',
            appliedToCapital: '958.12',
            appliedToInterest: '0.00',
            appliedToLateFee: '0.00',
            excessAmount: '0.00',
            newRemainingBalance: '0.00',
            isFullyPaid: true,
            allocations: [
              {
                installmentId: 3,
                capitalApplied: '958.12',
                interestApplied: '0.00',
                lateFeeApplied: '0.00'
              }
            ]
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o lógica de negocio',
    examples: {
      'amount-invalid': {
        summary: 'Monto inválido',
        value: {
          statusCode: 400,
          message: 'El monto debe ser mayor a 0',
          error: 'Bad Request'
        }
      },
      'installment-paid': {
        summary: 'Cuota ya pagada',
        value: {
          statusCode: 400,
          message: 'La cuota ya está completamente pagada',
          error: 'Bad Request'
        }
      },
      'loan-inactive': {
        summary: 'Préstamo inactivo',
        value: {
          statusCode: 400,
          message: 'No se pueden registrar cobros en un préstamo inactivo',
          error: 'Bad Request'
        }
      }
    }
  })
  @ApiUnprocessableEntityResponse({
    description: 'Errores de validación',
    examples: {
      'validation-error': {
        summary: 'Errores de validación',
        value: {
          statusCode: 422,
          message: [
            'installmentId debe ser un número positivo',
            'amount debe ser un número positivo',
            'installmentId es requerido'
          ],
          error: 'Unprocessable Entity'
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Recurso no encontrado',
    examples: {
      'installment-not-found': {
        summary: 'Cuota no encontrada',
        value: {
          statusCode: 404,
          message: 'Cuota con ID 1 no encontrada',
          error: 'Not Found'
        }
      },
      'moratory-not-found': {
        summary: 'Moratoria no encontrada',
        value: {
          statusCode: 404,
          message: 'Moratoria con ID 1 no encontrada',
          error: 'Not Found'
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
    description: 'Acceso prohibido - Sin permisos para registrar cobros',
    examples: {
      'insufficient-permissions': {
        summary: 'Sin permisos para registrar cobros',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para registrar cobros',
          error: 'Forbidden'
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
          message: 'Error interno del servidor al registrar el cobro',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async create(@Body() dto: CreateCollectionDto, @Req() req): Promise<CollectionResponse> {
    const rawCollection = await this.collectionsService.create(dto, req);
    const collection = plainToInstance(ResponseCollectionDto, rawCollection, { excludeExtraneousValues: true });
    return {
      customMessage: 'Cobro registrado exitosamente',
      collection
    }
  }
}

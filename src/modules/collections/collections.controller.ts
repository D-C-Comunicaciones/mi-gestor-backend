import { Controller, Get, Post, Param, Body, Query, UseGuards, ParseIntPipe, Logger, Req } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto, CollectionPaginationDto, ResponseCollectionDto } from './dto';
import { plainToInstance } from 'class-transformer';
import { Permissions } from '@auth/decorators';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { 
  ApiTags, 
  ApiBearerAuth, 
  ApiOperation, 
  ApiOkResponse, 
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiUnprocessableEntityResponse,
  ApiExtraModels,
  ApiParam,
  ApiQuery,
  ApiBody,
  getSchemaPath
} from '@nestjs/swagger';
import { CollectionListResponse, SwaggerCollectionListResponse, SwaggerCollectionResponse } from './interfaces/collection-responses.interface';
import { CollectionResponse } from './interfaces';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiCreatedResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiInternalServerErrorResponse, ApiBody, ApiUnprocessableEntityResponse } from '@nestjs/swagger';


@ApiTags('collections')
@ApiBearerAuth()
/**
 * Controlador para la gestión de recaudos y cobranza
 * 
 * Este controlador maneja las operaciones HTTP relacionadas con los recaudos realizados
 * por los cobradores en sus rutas asignadas. Es el núcleo del sistema de cobranza,
 * permitiendo el registro y seguimiento de todos los pagos realizados por los clientes.
 * 
 * Funcionalidades principales:
 * - Registro de recaudos por parte de cobradores móviles
 * - Consulta de historial de cobros con filtros avanzados
 * - Reportes de efectividad de cobranza por cobrador y zona
 * - Seguimiento en tiempo real de metas de cobranza
 * - Integración con geolocalización para validar cobros en ruta
 * 
 * Los recaudos son fundamentales para:
 * - Control de cartera y disminución de mora
 * - Evaluación de desempeño de cobradores
 * - Análisis de patrones de pago por zona geográfica
 * - Generación de reportes gerenciales y operativos
 * - Trazabilidad completa de todos los pagos recibidos
 * 
 * @version 1.0.0
 * @author Sistema de Gestión de Préstamos
 */
@ApiTags('Collections')
@ApiBearerAuth()
@ApiExtraModels(ResponseCollectionDto, SwaggerCollectionListResponse, SwaggerCollectionResponse)

@Controller('collections')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CollectionsController {
  private readonly logger = new Logger(CollectionsController.name);

  constructor(private readonly collectionsService: CollectionsService) {}

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
  @ApiOperation({ 
    summary: 'Registrar nuevo recaudo', 
    description: 'Registra un nuevo recaudo realizado por un cobrador. El sistema calcula automáticamente la distribución del pago entre capital, intereses y mora según las reglas de negocio establecidas. Incluye validación del préstamo, cobrador y monto.',
  })
  @ApiBody({ 
    type: CreateCollectionDto,
    description: 'Datos del recaudo a registrar',
    examples: {
      pagoCompleto: {
        summary: 'Pago completo de cuota',
        value: {
          installmentId: 25,
          amount: 125000
        }
      },
      abonoCapital: {
        summary: 'Abono parcial',
        value: {
          installmentId: 30,
          amount: 50000
        }
      }
    }
  })
  @ApiCreatedResponse({ 
    description: 'Recaudo registrado exitosamente',
    type: SwaggerCollectionResponse,
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Cobro registrado exitosamente' },
        code: { type: 'number', example: 201 },
        status: { type: 'string', example: 'success' },
        data: {
          properties: {
            collection: { $ref: getSchemaPath(ResponseCollectionDto) }
          }
        }
      }
    },
  })
  @ApiBadRequestResponse({ 
    description: 'Datos inválidos o cuota en estado no válido',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', example: 400 },
        status: { type: 'string', example: 'error' }
      },
      examples: {
        cuotaNoEncontrada: {
          summary: 'Cuota no encontrada',
          value: {
            message: 'Cuota con ID 999 no encontrada',
            code: 400,
            status: 'error'
          }
        },
        montoInvalido: {
          summary: 'Monto inválido',
          value: {
            message: 'El monto del recaudo debe ser mayor a cero',
            code: 400,
            status: 'error'
          }
        },
        cuotaYaPagada: {
          summary: 'Cuota ya pagada',
          value: {
            message: 'No se puede registrar pago en una cuota ya pagada completamente',
            code: 400,
            status: 'error'
          }
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ 
    description: 'Usuario no autenticado',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Token de acceso inválido o expirado' },
        code: { type: 'number', example: 401 },
        status: { type: 'string', example: 'error' }
      }
    }
  })
  @ApiForbiddenResponse({ 
    description: 'Sin permiso create.collections',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'No tiene permisos para crear recaudos' },
        code: { type: 'number', example: 403 },
        status: { type: 'string', example: 'error' }
      }
    }
  })
  @ApiNotFoundResponse({ 
    description: 'Cuota o recurso relacionado no encontrado',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Cuota con ID 999 no encontrada' },
        code: { type: 'number', example: 404 },
        status: { type: 'string', example: 'error' }
      }
    }
  })
  @ApiUnprocessableEntityResponse({ 
    description: 'Error de validación en los datos enviados',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Los datos enviados no son válidos' },
        errors: { 
          type: 'array', 
          items: { type: 'string' },
          example: ['El ID de la cuota es obligatorio', 'El monto debe ser mayor a cero']
        },
        code: { type: 'number', example: 422 },
        status: { type: 'string', example: 'error' }
      }
    }
  })
  @ApiInternalServerErrorResponse({ 
    description: 'Error interno del servidor',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Error interno del servidor al procesar el recaudo' },
        code: { type: 'number', example: 500 },
        status: { type: 'string', example: 'error' }

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

  // @Get()
  // @Permissions('view.collections')
  // @ApiOperation({ 
  //   summary: 'Listar recaudos', 
  //   description: 'Obtiene una lista paginada de recaudos con filtros avanzados. Permite filtrar por cobrador, zona, rango de fechas, montos y método de pago. Útil para reportes de cobranza y seguimiento de metas.' 
  // })
  // @ApiQuery({ name: 'page', required: false, schema: { type: 'integer', example: 1, minimum: 1 }, description: 'Número de página' })
  // @ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', example: 10, minimum: 1, maximum: 100 }, description: 'Elementos por página' })
  // @ApiQuery({ name: 'collectorId', required: false, schema: { type: 'integer', example: 3 }, description: 'Filtrar por cobrador' })
  // @ApiQuery({ name: 'zone', required: false, schema: { type: 'string', example: 'Norte' }, description: 'Filtrar por zona' })
  // @ApiQuery({ name: 'startDate', required: false, schema: { type: 'string', format: 'date', example: '2025-01-01' }, description: 'Fecha inicio' })
  // @ApiQuery({ name: 'endDate', required: false, schema: { type: 'string', format: 'date', example: '2025-01-31' }, description: 'Fecha fin' })
  // @ApiQuery({ name: 'status', required: false, schema: { type: 'string', enum: ['confirmed', 'pending', 'cancelled'] }, description: 'Estado del recaudo' })
  // @ApiQuery({ name: 'minAmount', required: false, schema: { type: 'number', example: 50000 }, description: 'Monto mínimo' })
  // @ApiQuery({ name: 'maxAmount', required: false, schema: { type: 'number', example: 500000 }, description: 'Monto máximo' })
  // @ApiQuery({ name: 'paymentMethod', required: false, schema: { type: 'string', enum: ['cash', 'transfer', 'check', 'other'] }, description: 'Método de pago' })
  // @ApiQuery({ name: 'customerDocument', required: false, schema: { type: 'string', example: '12345678' }, description: 'Documento del cliente' })
  // @ApiOkResponse({
  //   description: 'Lista de recaudos obtenida correctamente',
  //   type: SwaggerCollectionListResponse
  // })
  // @ApiNotFoundResponse({ 
  //   description: 'No se encontraron recaudos',
  //   schema: {
  //     example: {
  //       message: 'No se encontraron recaudos para los criterios especificados',
  //       code: 404,
  //       status: 'error'
  //     }
  //   }
  // })
  // @ApiUnauthorizedResponse({ description: 'Usuario no autenticado' })
  // @ApiForbiddenResponse({ description: 'Sin permiso view.collections' })
  // @ApiInternalServerErrorResponse({ description: 'Error interno del servidor' })
  // async findAll(@Query() paginationDto: CollectionPaginationDto): Promise<CollectionListResponse> {
  //   const rawCollections = await this.collectionsService.findAll(paginationDto);
  //   const collections = plainToInstance(ResponseCollectionDto, rawCollections.items, { excludeExtraneousValues: true });
  //   return {
  //     customMessage: 'Lista de recaudos obtenida exitosamente',
  //     collections,
  //     total: rawCollections.total,
  //     page: rawCollections.page,
  //     limit: rawCollections.limit
  //   }
  // }

  // @Get(':id')
  // @Permissions('view.collections')
  // @ApiOperation({ 
  //   summary: 'Obtener recaudo por ID', 
  //   description: 'Obtiene los detalles completos de un recaudo específico incluyendo información del cliente, cobrador, distribución del pago y cuotas afectadas.' 
  // })
  // @ApiParam({ 
  //   name: 'id', 
  //   type: Number, 
  //   description: 'Identificador único del recaudo',
  //   example: 1
  // })
  // @ApiOkResponse({
  //   description: 'Recaudo encontrado correctamente',
  //   type: SwaggerCollectionResponse
  // })
  // @ApiNotFoundResponse({ 
  //   description: 'Recaudo no encontrado',
  //   schema: {
  //     example: {
  //       message: 'Recaudo con ID 999 no encontrado',
  //       code: 404,
  //       status: 'error'
  //     }
  //   }
  // })
  // @ApiUnauthorizedResponse({ description: 'Usuario no autenticado' })
  // @ApiForbiddenResponse({ description: 'Sin permiso view.collections' })
  // @ApiInternalServerErrorResponse({ description: 'Error interno del servidor' })
  // async findOne(@Param('id', ParseIntPipe) id: number): Promise<CollectionResponse> {
  //   const rawCollection = await this.collectionsService.findOne(id);
  //   const collection = plainToInstance(ResponseCollectionDto, rawCollection, { excludeExtraneousValues: true });
  //   return {
  //     customMessage: 'Recaudo encontrado exitosamente',
  //     collection
  //   }
  // }
}
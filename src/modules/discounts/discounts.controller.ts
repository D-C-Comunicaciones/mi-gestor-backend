import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiInternalServerErrorResponse, ApiBody, ApiBearerAuth, ApiCookieAuth, ApiQuery, ApiUnprocessableEntityResponse } from '@nestjs/swagger';
import { DiscountsService } from './discounts.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { Response, Request } from 'express';
import { plainToInstance } from 'class-transformer';
import { DiscountListResponse } from './interfaces';
import { DiscountPaginationDto, ResponseDiscountDto } from './dto';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { Permissions } from '@modules/auth/decorators';

@ApiTags('discounts')
@Controller('discounts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiCookieAuth('token')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) { }

  // ---------------- CREATE DISCOUNT ----------------
  @Post()
  @Permissions('create.discounts')
  @ApiOperation({
    summary: 'Crear un nuevo descuento',
    description: 'Crea un nuevo descuento en el sistema con los datos proporcionados. Requiere permisos de creación.'
  })
  @ApiBody({
    type: CreateDiscountDto,
    description: 'Datos del descuento a crear',
    examples: {
      'descuento-buen-pago': {
        summary: 'Descuento por buen comportamiento',
        description: 'Ejemplo de descuento por buen comportamiento de pago aplicado a un crédito',
        value: {
          amount: 88100,
          discountTypeId: 1,
          description: "Descuento por buen comportamiento de pago a cuota, para que pague",
          loanId: 1
        }
      },
      'descuento-promocional': {
        summary: 'Descuento promocional',
        description: 'Ejemplo de descuento promocional estándar sobre un crédito',
        value: {
          amount: 50000,
          discountTypeId: 2,
          description: "Descuento promocional del mes de diciembre",
          loanId: 2
        }
      }
    }
  })
  @ApiCreatedResponse({
    description: 'Descuento creado exitosamente',
    examples: {
      'success': {
        summary: 'Descuento creado exitosamente',
        value: {
          message: 'Descuento creado exitosamente',
          responseDiscount: [
            {
              id: 1,
              amount: "15000",
              discountTypeId: 1,
              description: "Descuento por buen comportamiento de pago a cuota, para que pague. DESCRIPCIÓN APLICADA POR EL SISTEMA: descuento de 15000 aplicado a interés moratorio ID 4 (cuota 1), generado por: 1 - admin@dcmigestor.co",
              moratoryId: 4,
              installmentId: 14,
              loanId: 3,
              isActive: true,
              createdAt: "2025-10-07T00:00:00.000Z"
            }
          ]
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Datos de entrada inválidos o error de lógica de negocio',
    examples: {
      'validation-error': {
        summary: 'Errores de validación',
        value: {
          statusCode: 400,
          message: [
            'El monto del descuento debe ser mayor a cero',
            'La descripción es requerida',
            'El ID del préstamo debe ser un número positivo'
          ],
          error: 'Bad Request'
        }
      },
      'business-error': {
        summary: 'Error de lógica de negocio',
        value: {
          statusCode: 400,
          message: 'El monto del descuento (100000) no puede ser mayor al total de intereses moratorios pendientes (50000) para este préstamo',
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
            'El monto debe ser un número',
            'La descripción es requerida',
            'El ID del tipo de descuento debe ser un número positivo',
            'El ID del préstamo es requerido'
          ],
          error: 'Unprocessable Entity'
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
    description: 'Acceso prohibido - Sin permisos para crear descuentos',
    examples: {
      'insufficient-permissions': {
        summary: 'Permisos insuficientes',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para crear descuentos',
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
          message: 'Error interno del servidor al crear el descuento',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async create(@Body() createDiscountDto: CreateDiscountDto, @Req() req: Request) {
    const discount = await this.discountsService.create(createDiscountDto, req);

    // discount ya convertido y formateado por el servicio
    const responseDiscount = plainToInstance(ResponseDiscountDto, discount, {
      excludeExtraneousValues: true
    });

    return {
      message: "Descuento creado exitosamente",
      responseDiscount
    }
  }

  // ---------------- FIND ALL DISCOUNTS ----------------
  @Get()
  @Permissions('view.discounts')
  @ApiOperation({
    summary: 'Obtener todos los descuentos',
    description: 'Retorna una lista paginada con todos los descuentos del sistema. Requiere permisos de visualización.'
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    description: 'Número de página',
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Cantidad de elementos por página',
    example: 10
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: 'string',
    description: 'Término de búsqueda para filtrar descuentos por descripción',
    example: 'buen comportamiento'
  })
  @ApiQuery({
    name: 'moratoryId',
    required: false,
    type: 'number',
    description: 'Filtrar por ID de moratoria específica',
    example: 1
  })
  @ApiQuery({
    name: 'discountTypeId',
    required: false,
    type: 'number',
    description: 'Filtrar por ID de tipo de descuento',
    example: 1
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: 'boolean',
    description: 'Filtrar por descuentos activos o inactivos',
    example: true
  })
  @ApiOkResponse({
    description: 'Lista de descuentos obtenida exitosamente',
    examples: {
      'success': {
        summary: 'Lista obtenida exitosamente',
        value: {
          customMessage: 'Listado general de descuentos',
          discounts: [
            {
              id: 1,
              amount: 88100,
              discountTypeId: 1,
              description: 'Descuento por buen comportamiento de pago a cuota, para que pague',
              moratoryId: 1,
              createdAt: '2024-01-15T10:30:00.000Z',
              updatedAt: '2024-01-20T14:45:00.000Z'
            },
            {
              id: 2,
              amount: 50000,
              discountTypeId: 2,
              description: 'Descuento promocional del mes de diciembre',
              moratoryId: 2,
              createdAt: '2024-01-16T11:30:00.000Z',
              updatedAt: '2024-01-21T15:45:00.000Z'
            }
          ],
          meta: {
            totalItems: 25,
            page: 1,
            lastPage: 3,
            limit: 10,
            hasNextPage: true,
            hasPreviousPage: false
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'No se encontraron descuentos',
    examples: {
      'no-records': {
        summary: 'No existen registros',
        value: {
          customMessage: 'No existen registros',
          discounts: [],
          meta: {
            totalItems: 0,
            page: 1,
            lastPage: 0,
            limit: 10,
            hasNextPage: false,
            hasPreviousPage: false
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Parámetros de consulta inválidos',
    examples: {
      'pagination-error': {
        summary: 'Parámetros de paginación inválidos',
        value: {
          statusCode: 400,
          message: [
            'page debe ser un número positivo',
            'limit debe estar entre 1 y 100'
          ],
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
    description: 'Acceso prohibido - Sin permisos para ver descuentos',
    examples: {
      'insufficient-permissions': {
        summary: 'Sin permisos para ver descuentos',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para ver los descuentos',
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
          message: 'Error interno del servidor al obtener los descuentos',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async findAll(
    @Res({ passthrough: true }) res: Response,
    @Query() paginationDto: DiscountPaginationDto,
  ): Promise<DiscountListResponse> {
    const { discounts, meta } = await this.discountsService.findAll(paginationDto);

    if (discounts.length === 0) {
      return {
        customMessage: 'No existen registros',
        discounts: [],
        meta,
      };
    }

    const discountsResponse = plainToInstance(ResponseDiscountDto, discounts, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      customMessage: 'Listado general de descuentos',
      discounts: discountsResponse,
      meta,
    };
  }
}
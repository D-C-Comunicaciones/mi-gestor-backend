import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiInternalServerErrorResponse, ApiBody, ApiBearerAuth, ApiCookieAuth, ApiQuery, ApiUnprocessableEntityResponse } from '@nestjs/swagger';
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseIntPipe, Logger, Req } from '@nestjs/common';
import { DiscountsService } from './discounts.service';
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
import { DiscountPaginationDto, ResponseDiscountDto } from './dto';
import { DiscountResponse, SwaggerDiscountApplicationResponse, SwaggerDiscountListResponse, SwaggerDiscountResponse } from './interfaces/discount-responses.interface';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { DiscountListResponse } from './interfaces';
import { UpdateDiscountDto } from './dto/update-discount.dto';

@ApiTags('discounts')
/**
 * Controlador para la gestión de descuentos
 * 
 * Este controlador maneja las operaciones HTTP relacionadas con los descuentos del sistema.
 * Los descuentos son herramientas comerciales fundamentales que permiten incentivar
 * comportamientos deseados en los clientes como pagos anticipados, fidelidad, etc.
 * 
 * Funcionalidades principales:
 * - Creación y gestión de descuentos (porcentuales y montos fijos)
 * - Configuración de condiciones y vigencias
 * - Aplicación automática de descuentos según reglas
 * - Control de límites de uso por cliente
 * - Reportes de efectividad de promociones
 * 
 * Los descuentos son clave para:
 * - Estrategias comerciales y promocionales
 * - Incentivo de pagos puntuales y anticipados
 * - Retención y fidelización de clientes
 * - Diferenciación competitiva
 * - Mejora en indicadores de cobranza
 * 
 * Tipos de descuentos:
 * - PERCENTAGE: Descuento porcentual con límite máximo
 * - FIXED_AMOUNT: Descuento de monto fijo
 * 
 * @version 1.0.0
 * @author Sistema de Gestión de Préstamos
 */
@ApiTags('Discounts')
@ApiBearerAuth()
@ApiExtraModels(ResponseDiscountDto, SwaggerDiscountListResponse, SwaggerDiscountResponse, SwaggerDiscountApplicationResponse)
@Controller('discounts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiCookieAuth('token')
export class DiscountsController {
  private readonly logger = new Logger(DiscountsController.name);

  constructor(private readonly discountsService: DiscountsService) {}

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
        description: 'Ejemplo de descuento por buen comportamiento de pago',
        value: {
          amount: 88100,
          discountTypeId: 1,
          description: "Descuento por buen comportamiento de pago a cuota, para que pague",
          moratoryId: 1
        }
      },
      'descuento-promocional': {
        summary: 'Descuento promocional',
        description: 'Ejemplo de descuento promocional estándar',
        value: {
          amount: 50000,
          discountTypeId: 2,
          description: "Descuento promocional del mes de diciembre",
          moratoryId: 2
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
          customMessage: 'Descuento creado exitosamente',
          responseDiscount: {
            id: 1,
            amount: 88100,
            discountTypeId: 1,
            description: 'Descuento por buen comportamiento de pago a cuota, para que pague. DESCRIPCIÓN APLICADA POR EL SISTEMA: descuento de 88100 aplicado a interés moratorio ID 1, generado por: 5 - admin@migestor.com',
            moratoryId: 1,
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-15T10:30:00.000Z'
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Datos de entrada inválidos',
    examples: {
      'validation-error': {
        summary: 'Errores de validación',
        value: {
          statusCode: 400,
          message: [
            'El monto debe ser un número positivo',
            'La descripción es requerida',
            'El ID de la moratoria debe ser un número positivo'
          ],
          error: 'Bad Request'
        }
      },
      'business-error': {
        summary: 'Error de lógica de negocio',
        value: {
          statusCode: 400,
          message: 'El descuento (100000) no puede ser mayor al interés moratorio existente (50000)',
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
            'El ID de la moratoria es requerido'
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

    // discount ya convertido y formateado por el servicio, 
    // solo falta aplicar el DTO de respuesta
    const responseDiscount = plainToInstance(ResponseDiscountDto, discount, {
      excludeExtraneousValues: true
    });

    return {
      customMessage: "Descuento creado exitosamente",
      responseDiscount
  @ApiOperation({ 
    summary: 'Crear descuento', 
    description: 'Crea un nuevo descuento en el sistema con validación de fechas de vigencia y configuración de condiciones. Permite crear descuentos porcentuales con límite máximo o descuentos de monto fijo.' 
  })
  @ApiBody({ 
    type: CreateDiscountDto,
    description: 'Datos del descuento a crear',
    examples: {
      descuentoPorcentualCuota: {
        summary: 'Descuento porcentual a cuota',
        value: {
          installmentId: 25,
          discountTypeId: 1,
          percentageId: 10,
          description: 'Descuento por pronto pago - 10%'
        }
      },
      descuentoMontoFijoCuota: {
        summary: 'Descuento monto fijo a cuota',
        value: {
          installmentId: 30,
          discountTypeId: 2,
          amount: 15000,
          description: 'Descuento especial cliente VIP'
        }
      },
      descuentoInteresMoratorio: {
        summary: 'Descuento a interés moratorio',
        value: {
          moratoryId: 5,
          discountTypeId: 1,
          percentageId: 50,
          description: 'Condonación parcial de mora'
        }
      }
    }
  })
  @ApiCreatedResponse({ 
    description: 'Descuento creado exitosamente',
    type: SwaggerDiscountResponse,
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Descuento creado correctamente' },
        code: { type: 'number', example: 201 },
        status: { type: 'string', example: 'success' },
        data: {
          properties: {
            discount: { $ref: getSchemaPath(ResponseDiscountDto) }
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({ 
    description: 'Datos inválidos o fechas de vigencia incorrectas',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', example: 400 },
        status: { type: 'string', example: 'error' }
      },
      examples: {
        fechasInvalidas: {
          summary: 'Fechas de vigencia inválidas',
          value: {
            message: 'La fecha de fin debe ser posterior a la fecha de inicio',
            code: 400,
            status: 'error'
          }
        },
        porcentajeInvalido: {
          summary: 'Porcentaje inválido',
          value: {
            message: 'Para descuentos porcentuales, el valor debe estar entre 0 y 100',
            code: 400,
            status: 'error'
          }
        }
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
          example: ['El nombre es obligatorio', 'El tipo de descuento debe ser PERCENTAGE o FIXED_AMOUNT']
        },
        code: { type: 'number', example: 422 },
        status: { type: 'string', example: 'error' }
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
    description: 'Sin permiso create.discounts',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'No tiene permisos para crear descuentos' },
        code: { type: 'number', example: 403 },
        status: { type: 'string', example: 'error' }
      }
    }
  })
  @ApiInternalServerErrorResponse({ 
    description: 'Error interno del servidor',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Error interno del servidor' },
        code: { type: 'number', example: 500 },
        status: { type: 'string', example: 'error' }
      }
    }
  })
  async create(@Body() createDiscountDto: CreateDiscountDto, @Req() req: Request): Promise<DiscountResponse> {
    const raw = await this.discountsService.create(createDiscountDto, req);
    const discount = plainToInstance(ResponseDiscountDto, raw, { 
      excludeExtraneousValues: true 
    });
    
    return { 
      customMessage: 'Descuento creado correctamente',
      discount 
    };
  }

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
      res.status(404);
      return {
        customMessage: 'No existen registros',
        discounts: [],
        meta,
      };
  @ApiOperation({ 
    summary: 'Listar descuentos', 
    description: 'Obtiene una lista paginada de descuentos con filtros avanzados. Permite filtrar por tipo, estado activo, vigencia y rangos de valores. Útil para administración de promociones y reportes comerciales.' 
  })
  @ApiQuery({ name: 'page', required: false, schema: { type: 'integer', example: 1, minimum: 1 }, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', example: 10, minimum: 1, maximum: 100 }, description: 'Elementos por página' })
  @ApiQuery({ name: 'isActive', required: false, schema: { type: 'boolean', example: true }, description: 'Filtrar por estado activo' })
  @ApiOkResponse({
    description: 'Lista de descuentos obtenida correctamente',
    type: SwaggerDiscountListResponse
  })
  @ApiBadRequestResponse({
    description: 'Parámetros de consulta inválidos',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', example: 400 },
        status: { type: 'string', example: 'error' }
      },
      examples: {
        paginaInvalida: {
          summary: 'Página no existe',
          value: {
            message: 'La página #5 no existe',
            code: 400,
            status: 'error'
          }
        },
        fechaInvalida: {
          summary: 'Formato de fecha inválido',
          value: {
            message: 'La fecha debe tener formato YYYY-MM-DD',
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
    description: 'Sin permiso view.discounts',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'No tiene permisos para ver descuentos' },
        code: { type: 'number', example: 403 },
        status: { type: 'string', example: 'error' }
      }
    }
  })
  @ApiInternalServerErrorResponse({ 
    description: 'Error interno del servidor',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Error interno del servidor' },
        code: { type: 'number', example: 500 },
        status: { type: 'string', example: 'error' }
      }
    }
  })
  async findAll(@Query() paginationDto: DiscountPaginationDto): Promise<DiscountListResponse> {
    const { discounts, meta } = await this.discountsService.findAll(paginationDto);

    const formattedDiscounts = plainToInstance(ResponseDiscountDto, discounts, {
      excludeExtraneousValues: true
    });

    return {
      customMessage: discounts.length > 0 
        ? 'Descuentos obtenidos correctamente' 
        : 'No se encontraron descuentos para los criterios especificados',
      discounts: formattedDiscounts,
      meta: meta
    };
  }
}
  
  // @Get(':id')
  // @Permissions('view.discounts')
  // @ApiOperation({ 
  //   summary: 'Obtener descuento por ID', 
  //   description: 'Obtiene los detalles completos de un descuento específico incluyendo todas sus condiciones y configuraciones de aplicación.' 
  // })
  // @ApiParam({ 
  //   name: 'id', 
  //   type: Number, 
  //   description: 'Identificador único del descuento',
  //   example: 1
  // })
  // @ApiOkResponse({
  //   description: 'Descuento encontrado correctamente',
  //   type: SwaggerDiscountResponse
  // })
  // @ApiBadRequestResponse({
  //   description: 'ID inválido',
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       message: { type: 'string', example: 'El ID debe ser un número válido' },
  //       code: { type: 'number', example: 400 },
  //       status: { type: 'string', example: 'error' }
  //     }
  //   }
  // })
  // @ApiUnauthorizedResponse({ 
  //   description: 'Usuario no autenticado',
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       message: { type: 'string', example: 'Token de acceso inválido o expirado' },
  //       code: { type: 'number', example: 401 },
  //       status: { type: 'string', example: 'error' }
  //     }
  //   }
  // })
  // @ApiForbiddenResponse({ 
  //   description: 'Sin permiso view.discounts',
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       message: { type: 'string', example: 'No tiene permisos para ver descuentos' },
  //       code: { type: 'number', example: 403 },
  //       status: { type: 'string', example: 'error' }
  //     }
  //   }
  // })
  // @ApiNotFoundResponse({ 
  //   description: 'Descuento no encontrado',
  //   schema: {
  //     example: {
  //       message: 'Descuento con ID 999 no encontrado',
  //       code: 404,
  //       status: 'error'
  //     }
  //   }
  // })
  // @ApiInternalServerErrorResponse({ 
  //   description: 'Error interno del servidor',
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       message: { type: 'string', example: 'Error interno del servidor' },
  //       code: { type: 'number', example: 500 },
  //       status: { type: 'string', example: 'error' }
  //     }
  //   }
  // })
  // async findOne(@Param('id', ParseIntPipe) id: number): Promise<DiscountResponse> {
  //   const raw = await this.discountsService.findOne(id);
  //   const discount = plainToInstance(ResponseDiscountDto, raw, {
  //     excludeExtraneousValues: true
  //   });

  //   return {
  //     customMessage: 'Descuento obtenido correctamente',
  //     discount
  //   };
  // }

  // @Patch(':id')
  // @Permissions('update.discounts')
  // @ApiOperation({ 
  //   summary: 'Actualizar descuento', 
  //   description: 'Actualiza los datos de un descuento existente. Solo se actualizan los campos proporcionados (actualización parcial). Incluye validación de fechas de vigencia y condiciones.' 
  // })
  // @ApiParam({ 
  //   name: 'id', 
  //   type: Number, 
  //   description: 'Identificador único del descuento a actualizar',
  //   example: 1
  // })
  // @ApiBody({ 
  //   type: UpdateDiscountDto,
  //   description: 'Datos a actualizar del descuento',
  //   examples: {
  //     cambiarValor: {
  //       summary: 'Cambiar valor del descuento',
  //       value: {
  //         value: 7.5,
  //         maxAmount: 75000
  //       }
  //     },
  //     extenderVigencia: {
  //       summary: 'Extender vigencia',
  //       value: {
  //         validTo: '2026-06-30'
  //       }
  //     },
  //     desactivar: {
  //       summary: 'Desactivar descuento',
  //       value: {
  //         isActive: false
  //       }
  //     }
  //   }
  // })
  // @ApiOkResponse({ 
  //   description: 'Descuento actualizado exitosamente',
  //   type: SwaggerDiscountResponse
  // })
  // @ApiBadRequestResponse({ 
  //   description: 'No se detectaron cambios o datos inválidos',
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       message: { type: 'string' },
  //       code: { type: 'number', example: 400 },
  //       status: { type: 'string', example: 'error' }
  //     },
  //     examples: {
  //       sinCambios: {
  //         summary: 'No se detectaron cambios',
  //         value: {
  //           message: 'No se detectaron cambios para actualizar',
  //           code: 400,
  //           status: 'error'
  //         }
  //       },
  //       fechasInvalidas: {
  //         summary: 'Fechas de vigencia inválidas',
  //         value: {
  //           message: 'La fecha de fin debe ser posterior a la fecha de inicio',
  //           code: 400,
  //           status: 'error'
  //         }
  //       }
  //     }
  //   }
  // })
  // @ApiUnauthorizedResponse({ 
  //   description: 'Usuario no autenticado',
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       message: { type: 'string', example: 'Token de acceso inválido o expirado' },
  //       code: { type: 'number', example: 401 },
  //       status: { type: 'string', example: 'error' }
  //     }
  //   }
  // })
  // @ApiForbiddenResponse({ 
  //   description: 'Sin permiso update.discounts',
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       message: { type: 'string', example: 'No tiene permisos para actualizar descuentos' },
  //       code: { type: 'number', example: 403 },
  //       status: { type: 'string', example: 'error' }
  //     }
  //   }
  // })
  // @ApiNotFoundResponse({ 
  //   description: 'Descuento no encontrado',
  //   schema: {
  //     example: {
  //       message: 'Descuento con ID 999 no encontrado',
  //       code: 404,
  //       status: 'error'
  //     }
  //   }
  // })
  // @ApiInternalServerErrorResponse({ 
  //   description: 'Error interno del servidor',
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       message: { type: 'string', example: 'Error interno del servidor' },
  //       code: { type: 'number', example: 500 },
  //       status: { type: 'string', example: 'error' }
  //     }
  //   }
  // })
  // async update(@Param('id', ParseIntPipe) id: number, @Body() updateDiscountDto: UpdateDiscountDto): Promise<DiscountResponse> {
  //   const raw = await this.discountsService.update(id, updateDiscountDto);
  //   const discount = plainToInstance(ResponseDiscountDto, raw, {
  //     excludeExtraneousValues: true
  //   });

  //   return {
  //     customMessage: 'Descuento actualizado correctamente',
  //     discount
  //   };
  // }

  // @Delete(':id')
  // @Permissions('delete.discounts')
  // @ApiOperation({ 
  //   summary: 'Desactivar descuento', 
  //   description: 'Desactiva un descuento sin eliminarlo físicamente de la base de datos (soft delete). Los descuentos desactivados no se pueden aplicar pero se mantienen por trazabilidad.' 
  // })
  // @ApiParam({ 
  //   name: 'id', 
  //   type: Number, 
  //   description: 'Identificador único del descuento a desactivar',
  //   example: 1
  // })
  // @ApiOkResponse({ 
  //   description: 'Descuento desactivado exitosamente',
  //   type: SwaggerDiscountResponse
  // })
  // @ApiBadRequestResponse({
  //   description: 'No se puede desactivar el descuento',
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       message: { type: 'string', example: 'No se puede desactivar un descuento que tiene aplicaciones pendientes' },
  //       code: { type: 'number', example: 400 },
  //       status: { type: 'string', example: 'error' }
  //     }
  //   }
  // })
  // @ApiUnauthorizedResponse({ 
  //   description: 'Usuario no autenticado',
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       message: { type: 'string', example: 'Token de acceso inválido o expirado' },
  //       code: { type: 'number', example: 401 },
  //       status: { type: 'string', example: 'error' }
  //     }
  //   }
  // })
  // @ApiForbiddenResponse({ 
  //   description: 'Sin permiso delete.discounts',
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       message: { type: 'string', example: 'No tiene permisos para desactivar descuentos' },
  //       code: { type: 'number', example: 403 },
  //       status: { type: 'string', example: 'error' }
  //     }
  //   }
  // })
  // @ApiNotFoundResponse({ 
  //   description: 'Descuento no encontrado',
  //   schema: {
  //     example: {
  //       message: 'Descuento con ID 999 no encontrado',
  //       code: 404,
  //       status: 'error'
  //     }
  //   }
  // })
  // @ApiInternalServerErrorResponse({ 
  //   description: 'Error interno del servidor',
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       message: { type: 'string', example: 'Error interno del servidor' },
  //       code: { type: 'number', exaDEV97
  //       status: { type: 'string', example: 'error' }
  //     }
  //   }
  // })
  // async remove(@Param('id', ParseIntPipe) id: number): Promise<DiscountResponse> {
  //   const raw = await this.discountsService.remove(id);
  //   const discount = plainToInstance(ResponseDiscountDto, raw, {
  //     excludeExtraneousValues: true
  //   });

  //   return {
  //     customMessage: 'Descuento desactivado correctamente',
  //     discount
  //   };
  // }

  // Comentarios para futuros endpoints que podrían implementarse

  // @Post(':id/apply')
  // @Permissions('apply.discounts')
  // @ApiOperation({ 
  //   summary: 'Aplicar descuento', 
  //   description: 'Aplica un descuento específico a un monto dado, validando todas las condiciones y límites configurados.' 
  // })
  // @ApiParam({ name: 'id', type: Number, description: 'ID del descuento a aplicar' })
  // @ApiBody({
  //   description: 'Datos para aplicar el descuento',
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       amount: { type: 'number', example: 100000, description: 'Monto al cual aplicar el descuento' },
  //       customerId: { type: 'number', example: 15, description: 'ID del cliente para validar límites' },
  //       loanId: { type: 'number', example: 25, required: false, description: 'ID del préstamo (opcional)' }
  //     },
  //     required: ['amount', 'customerId']
  //   }
  // })
  // @ApiOkResponse({ 
  //   description: 'Descuento aplicado correctamente',
  //   type: SwaggerDiscountApplicationResponse 
  // })
  // async applyDiscount(@Param('id', ParseIntPipe) id: number, @Body() applyDto: any) {
  //   return this.discountsService.applyDiscount(id, applyDto.amount, applyDto.customerId, applyDto.loanId);
  // }

  // @Get('available/:customerId')
  // @Permissions('view.discounts')
  // @ApiOperation({ 
  //   summary: 'Descuentos disponibles para cliente', 
  //   description: 'Obtiene lista de descuentos aplicables a un cliente específico según sus condiciones actuales.' 
  // })
  // @ApiParam({ name: 'customerId', type: Number, description: 'ID del cliente' })
  // @ApiQuery({ name: 'loanAmount', required: false, schema: { type: 'number' }, description: 'Monto del préstamo para filtrar' })
  // @ApiOkResponse({ description: 'Lista de descuentos disponibles' })
  // async getAvailableDiscounts(@Param('customerId', ParseIntPipe) customerId: number, @Query() filters: any) {
  //   return this.discountsService.getAvailableDiscounts(customerId, filters);
  // }
}

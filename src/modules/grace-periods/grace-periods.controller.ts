import { Controller, Get, Param, UseGuards, ParseIntPipe, Logger } from '@nestjs/common';
import { GracePeriodsService } from './grace-periods.service';
import { ResponseGracePeriodDto } from './dto';
import { plainToInstance } from 'class-transformer';
import { Permissions } from '@auth/decorators';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { 
  ApiTags, 
  ApiBearerAuth, 
  ApiOperation, 
  ApiOkResponse, 
  ApiInternalServerErrorResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiExtraModels,
  ApiParam,
  getSchemaPath
} from '@nestjs/swagger';
import { GracePeriodResponse, SwaggerGracePeriodListResponse, SwaggerGracePeriodResponse } from './interfaces/grace-period-responses.interface';
import { GracePeriodListResponse } from './interfaces';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiInternalServerErrorResponse } from '@nestjs/swagger';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { Permissions } from '@modules/auth/decorators';

@ApiTags('gracePeriods')
@ApiBearerAuth()
/**
 * Controlador para la gestión de períodos de gracia
 * 
 * Este controlador maneja las operaciones HTTP relacionadas con los períodos de gracia
 * del sistema. Los períodos de gracia son opciones de configuración para créditos mensuales
 * que permiten diferir el pago de capital durante un tiempo determinado.
 * 
 * Funcionalidades principales:
 * - Consulta de períodos de gracia disponibles para originación
 * - Obtención de información específica de períodos
 * - Soporte para validaciones en procesos de crédito
 * 
 * Los períodos de gracia son fundamentales para:
 * - Créditos mensuales con pago diferido de capital
 * - Productos de crédito flexibles y diferenciados
 * - Adaptación a flujos de caja del cliente
 * - Opciones de financiamiento especializado
 * - Formularios de originación de créditos mensuales
 * 
 * Casos de uso típicos:
 * - Cliente solicita crédito con período de gracia de 3 meses
 * - Durante los primeros 3 meses solo paga intereses
 * - A partir del mes 4 comienza a pagar capital + intereses
 * - Útil para negocios estacionales o proyectos en desarrollo
 * 
 * @version 1.0.0
 * @author Sistema de Gestión de Préstamos
 */
@ApiTags('Grace Periods')
@ApiBearerAuth()
@ApiExtraModels(ResponseGracePeriodDto, SwaggerGracePeriodListResponse, SwaggerGracePeriodResponse)
@Controller('grace-periods')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GracePeriodsController {
  private readonly logger = new Logger(GracePeriodsController.name);

  constructor(private readonly gracePeriodsService: GracePeriodsService) {}

  @Get()
  @Permissions('view.grace-periods')
  @ApiOperation({ 
    summary: 'Obtener periodos de gracia',
    description: 'Retorna una lista con todos los periodos de gracia disponibles en el sistema para aplicar solo a créditos con pagos de intereses mensuales.'
  })
  @ApiOkResponse({
    description: 'Lista de periodos de gracia obtenida exitosamente',
    examples: {
      'success': {
        summary: 'Lista obtenida exitosamente',
        value: {
          customMessage: 'Lista de periodos de gracia',
          gracePeriods: [
            {
              id: 1,
              name: '15 días',
              days: 15
            },
            {
              id: 2,
              name: '1 mes',
              days: 30
            },
            {
              id: 3,
              name: '2 meses',
              days: 60
    summary: 'Listar períodos de gracia', 
    description: 'Obtiene la lista completa de períodos de gracia disponibles en el sistema. Utilizado exclusivamente para poblar formularios de creación de créditos mensuales con pago de intereses mensuales.' 
  })
  @ApiOkResponse({
    description: 'Lista de períodos de gracia obtenida correctamente',
    type: SwaggerGracePeriodListResponse,
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Períodos de gracia obtenidos correctamente' },
        code: { type: 'number', example: 200 },
        status: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            gracePeriods: {
              type: 'array',
              description: 'Lista de períodos de gracia disponibles para créditos mensuales',
              items: { $ref: getSchemaPath(ResponseGracePeriodDto) }
            }
          }
        }
      },
      example: {
        message: 'Períodos de gracia obtenidos correctamente',
        code: 200,
        status: 'success',
        data: {
          gracePeriods: [
            {
              id: 1,
              name: '3 meses de gracia',
              description: 'Durante los primeros 3 meses solo se pagan intereses.',
              months: 3,
              isActive: true
            },
            {
              id: 2,
              name: '6 meses de gracia',
              description: 'Durante los primeros 6 meses solo se pagan intereses.',
              months: 6,
              isActive: true
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
        summary: 'Sin permisos para ver periodos de gracia',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para ver los periodos de gracia',
          error: 'Forbidden'
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Recurso no encontrado',
    examples: {
      'no-grace-periods': {
        summary: 'No se encontraron periodos de gracia',
        value: {
          statusCode: 404,
          message: 'No se encontraron periodos de gracia disponibles',
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
          message: 'Error interno del servidor al obtener los periodos de gracia',
          error: 'Internal Server Error'
        }
    description: 'Parámetros de consulta inválidos',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Los parámetros de consulta no son válidos' },
        code: { type: 'number', example: 400 },
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
    description: 'Sin permiso view.grace-periods',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'No tiene permisos para ver períodos de gracia' },
        code: { type: 'number', example: 403 },
        status: { type: 'string', example: 'error' }
      }
    }
  })
  @ApiNotFoundResponse({ 
    description: 'No se encontraron períodos de gracia',
    schema: {
      example: {
        message: 'No se encontraron períodos de gracia disponibles',
        code: 404,
        status: 'error'
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
  async findAll(): Promise<GracePeriodListResponse> {
    const rawgracePeriods = await this.gracePeriodsService.findAll();

    const gracePeriods = plainToInstance(ResponseGracePeriodDto, rawgracePeriods, { excludeExtraneousValues: true });

    return {
      customMessage: gracePeriods.length > 0 
        ? 'Períodos de gracia obtenidos correctamente' 
        : 'No se encontraron períodos de gracia disponibles',
      gracePeriods
    };
  }

  // @Get(':id')
  // @Permissions('view.grace-periods')
  // @ApiOperation({ 
  //   summary: 'Obtener período de gracia por ID', 
  //   description: 'Obtiene los detalles completos de un período de gracia específico mediante su identificador único. Incluye información sobre duración, condiciones y aplicabilidad.' 
  // })
  // @ApiParam({ 
  //   name: 'id', 
  //   type: Number, 
  //   description: 'Identificador único del período de gracia',
  //   example: 1
  // })
  // @ApiOkResponse({
  //   description: 'Período de gracia encontrado correctamente',
  //   type: SwaggerGracePeriodResponse,
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       message: { type: 'string', example: 'Período de gracia obtenido correctamente' },
  //       code: { type: 'number', example: 200 },
  //       status: { type: 'string', example: 'success' },
  //       data: {
  //         type: 'object',
  //         properties: {
  //           gracePeriod: { $ref: getSchemaPath(ResponseGracePeriodDto) }
  //         }
  //       }
  //     }
  //   }
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
  //   description: 'Sin permiso view.grace-periods',
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       message: { type: 'string', example: 'No tiene permisos para ver períodos de gracia' },
  //       code: { type: 'number', example: 403 },
  //       status: { type: 'string', example: 'error' }
  //     }
  //   }
  // })
  // @ApiNotFoundResponse({ 
  //   description: 'Período de gracia no encontrado',
  //   schema: {
  //     example: {
  //       message: 'Período de gracia con ID 999 no encontrado',
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
  // async findOne(@Param('id', ParseIntPipe) id: number): Promise<GracePeriodResponse> {
  //   this.logger.log(`🔍 Consultando período de gracia con ID: ${id}`);
    
  //   const rawGracePeriod = await this.gracePeriodsService.findOne(id);
  //   const gracePeriod = plainToInstance(ResponseGracePeriodDto, rawGracePeriod, {
  //     excludeExtraneousValues: true
  //   });

  //   return {
  //     customMessage: 'Período de gracia obtenido correctamente',
  //     gracePeriod
  //   };
  // }
}

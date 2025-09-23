import { Controller, Get, Param, UseGuards, ParseIntPipe, Logger } from '@nestjs/common';
import { GendersService } from './genders.service';
import { ResponseGenderDto } from './dto';
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
import { GenderListResponse, SwaggerGenderListResponse, SwaggerGenderResponse } from './interfaces/gender-responses.interface';

/**
 * Controlador para la gestión de géneros
 * 
 * Este controlador maneja las operaciones HTTP relacionadas con los géneros del sistema.
 * Los géneros son elementos de referencia esenciales para la clasificación demográfica
 * de clientes y cobradores en el sistema de gestión de préstamos.
 * 
 * Funcionalidades principales:
 * - Consulta de géneros disponibles para formularios
 * - Obtención de información específica de géneros
 * - Soporte para validaciones de integridad referencial
 * 
 * Los géneros son fundamentales para:
 * - Formularios de registro de clientes y cobradores
 * - Clasificación demográfica para reportes
 * - Análisis estadísticos por género
 * - Cumplimiento de normativas de inclusión
 * - Validación de datos en procesos de creación
 * 
 * @version 1.0.0
 * @author Sistema de Gestión de Préstamos
 */
@ApiTags('Genders')
@ApiBearerAuth()
@ApiExtraModels(ResponseGenderDto, SwaggerGenderListResponse, SwaggerGenderResponse)
@Controller('genders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GendersController {
  private readonly logger = new Logger(GendersController.name);

  constructor(private readonly gendersService: GendersService) {}

  @Get()
  @Permissions('view.genders')
  @ApiOperation({ 
    summary: 'Listar géneros', 
    description: 'Obtiene la lista completa de géneros disponibles en el sistema. Utilizado principalmente para poblar formularios de registro de clientes y cobradores.' 
  })
  @ApiOkResponse({
    description: 'Lista de géneros obtenida correctamente',
    type: SwaggerGenderListResponse,
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Géneros obtenidos correctamente' },
        code: { type: 'number', example: 200 },
        status: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            genders: {
              type: 'array',
              description: 'Lista de géneros disponibles',
              items: { $ref: getSchemaPath(ResponseGenderDto) }
            }
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({
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
    description: 'Sin permiso view.genders',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'No tiene permisos para ver géneros' },
        code: { type: 'number', example: 403 },
        status: { type: 'string', example: 'error' }
      }
    }
  })
  @ApiNotFoundResponse({ 
    description: 'No se encontraron géneros',
    schema: {
      example: {
        message: 'No se encontraron géneros disponibles',
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
  async findAll(): Promise<GenderListResponse> {
    this.logger.log('📋 Consultando géneros disponibles');
    
    const rawGenders = await this.gendersService.findAll();
    const genders = plainToInstance(ResponseGenderDto, rawGenders, { 
      excludeExtraneousValues: true 
    });
    
    return {
      customMessage: genders.length > 0 
        ? 'Géneros obtenidos correctamente' 
        : 'No se encontraron géneros disponibles',
      genders
    };
  }

  // @Get(':id')
  // @Permissions('view.genders')
  // @ApiOperation({ 
  //   summary: 'Obtener género por ID', 
  //   description: 'Obtiene los detalles completos de un género específico mediante su identificador único.' 
  // })
  // @ApiParam({ 
  //   name: 'id', 
  //   type: Number, 
  //   description: 'Identificador único del género',
  //   example: 1
  // })
  // @ApiOkResponse({
  //   description: 'Género encontrado correctamente',
  //   type: SwaggerGenderResponse,
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       message: { type: 'string', example: 'Género obtenido correctamente' },
  //       code: { type: 'number', example: 200 },
  //       status: { type: 'string', example: 'success' },
  //       data: {
  //         type: 'object',
  //         properties: {
  //           gender: { $ref: getSchemaPath(ResponseGenderDto) }
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
  //   description: 'Sin permiso view.genders',
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       message: { type: 'string', example: 'No tiene permisos para ver géneros' },
  //       code: { type: 'number', example: 403 },
  //       status: { type: 'string', example: 'error' }
  //     }
  //   }
  // })
  // @ApiNotFoundResponse({ 
  //   description: 'Género no encontrado',
  //   schema: {
  //     example: {
  //       message: 'Género con ID 999 no encontrado',
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
  // async findOne(@Param('id', ParseIntPipe) id: number): Promise<GenderResponse> {
  //   this.logger.log(`🔍 Consultando género con ID: ${id}`);
    
  //   const rawGender = await this.gendersService.findOne(id);
  //   const gender = plainToInstance(ResponseGenderDto, rawGender, {
  //     excludeExtraneousValues: true
  //   });

  //   return {
  //     customMessage: 'Género obtenido correctamente',
  //     gender
  //   };
  // }
}

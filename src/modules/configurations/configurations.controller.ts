import { Controller, Get, Post, Body, Patch, Param, UseGuards, ParseIntPipe, Logger } from '@nestjs/common';
import { ConfigurationsService } from './configurations.service';
import { CreateConfigurationDto, ResponseConfigurationDto, UpdateConfigurationDto } from './dto';
import { JwtAuthGuard, PermissionsGuard } from '@modules/auth/guards';
import { Permissions } from '@modules/auth/decorators';
import { plainToInstance } from 'class-transformer';
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
  ApiBody,
  getSchemaPath
} from '@nestjs/swagger';
import { ConfigurationResponse, SwaggerConfigurationListResponse, SwaggerConfigurationResponse } from './interfaces/configuration-responses.interface';

/**
 * Controlador para la gestión de configuraciones del sistema
 * 
 * Este controlador maneja las operaciones HTTP relacionadas con la configuración global
 * del sistema. Permite a los administradores personalizar aspectos fundamentales como
 * moneda, zona horaria y elementos visuales de la interfaz.
 * 
 * Funcionalidades principales:
 * - Configuración de moneda predeterminada del sistema
 * - Establecimiento de zona horaria para operaciones
 * - Personalización de paleta de colores
 * - Consulta de configuraciones actuales
 * 
 * Las configuraciones son fundamentales para:
 * - Localización correcta del sistema
 * - Uniformidad en formato de valores monetarios
 * - Consistencia en manejo de fechas y horarios
 * - Personalización de marca empresarial
 * - Adaptación a normativas locales
 * 
 * @version 1.0.0
 * @author Sistema de Gestión de Préstamos
 */
@ApiTags('Configurations')
@ApiBearerAuth()
@ApiExtraModels(ResponseConfigurationDto, SwaggerConfigurationResponse, SwaggerConfigurationListResponse)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('configurations')
export class ConfigurationsController {
  private readonly logger = new Logger(ConfigurationsController.name);

  constructor(private readonly configurationsService: ConfigurationsService) {}

  @Post()
  @Permissions('create.configurations')
  @ApiOperation({ 
    summary: 'Crear configuración', 
    description: 'Crea una nueva configuración del sistema estableciendo parámetros globales como moneda, zona horaria y personalización visual.' 
  })
  @ApiBody({
    type: CreateConfigurationDto,
    description: 'Datos de la configuración a crear',
    examples: {
      configuracionCompleta: {
        summary: 'Configuración completa',
        value: {
          currencyId: 1,
          timezoneId: 1,
          colorPalette: '#FFFFFF,#000000,#007BFF,#28A745'
        }
      },
      configuracionBasica: {
        summary: 'Solo moneda y zona horaria',
        value: {
          currencyId: 1,
          timezoneId: 1
        }
      }
    }
  })
  @ApiCreatedResponse({
    description: 'Configuración creada exitosamente',
    type: SwaggerConfigurationResponse,
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Configuración creada exitosamente' },
        code: { type: 'number', example: 201 },
        status: { type: 'string', example: 'success' },
        data: {
          properties: {
            configurations: { $ref: getSchemaPath(ResponseConfigurationDto) }
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o referencias inexistentes',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'La moneda especificada no existe' },
        code: { type: 'number', example: 400 },
        status: { type: 'string', example: 'error' }
      }
    }
  })
  @ApiUnprocessableEntityResponse({
    description: 'Error de validación en los datos enviados',
    schema: {
      type: 'object',
      properties: {
        message: { 
          type: 'array',
          items: { type: 'string' },
          example: ['El ID de la moneda debe ser un número', 'La paleta de colores debe ser una cadena de texto']
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
    description: 'Sin permiso create.configurations',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'No tiene permisos para crear configuraciones' },
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
  async create(@Body() data: CreateConfigurationDto): Promise<ConfigurationResponse> {
    this.logger.log('🔧 Creando nueva configuración del sistema');
    
    const rawConf = await this.configurationsService.create(data);
    const conf = plainToInstance(ResponseConfigurationDto, rawConf);
    
    return {
      customMessage: 'Configuración creada exitosamente',
      configurations: conf,
    }
  }

  @Get()
  @Permissions('view.configurations')
  @ApiOperation({ 
    summary: 'Listar configuraciones', 
    description: 'Obtiene todas las configuraciones del sistema con detalles completos de moneda, zona horaria y personalización.' 
  })
  @ApiOkResponse({
    description: 'Configuraciones obtenidas correctamente',
    type: SwaggerConfigurationListResponse,
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Configuraciones obtenidas exitosamente' },
        code: { type: 'number', example: 200 },
        status: { type: 'string', example: 'success' },
        data: {
          properties: {
            configurations: {
              type: 'array',
              items: { $ref: getSchemaPath(ResponseConfigurationDto) }
            }
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'No se encontraron configuraciones',
    schema: {
      example: {
        message: 'No se encontraron configuraciones en el sistema',
        code: 404,
        status: 'error'
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
    description: 'Sin permiso view.configurations',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'No tiene permisos para ver configuraciones' },
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
  async findAll(): Promise<ConfigurationResponse> {
    this.logger.log('📋 Consultando todas las configuraciones');
    
    const rawConfs = await this.configurationsService.findAll();
    const confs = plainToInstance(ResponseConfigurationDto, rawConfs);
    
    return {
      customMessage: 'Configuraciones obtenidas exitosamente',
      configurations: confs,
    }
  }

  @Get(':id')
  @Permissions('view.configurations')
  @ApiOperation({ 
    summary: 'Obtener configuración por ID', 
    description: 'Obtiene una configuración específica del sistema con todos sus detalles.' 
  })
  @ApiParam({ 
    name: 'id', 
    type: Number, 
    description: 'Identificador único de la configuración',
    example: 1
  })
  @ApiOkResponse({
    description: 'Configuración encontrada correctamente',
    type: SwaggerConfigurationResponse
  })
  @ApiBadRequestResponse({
    description: 'ID inválido',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'El ID debe ser un número válido' },
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
    description: 'Sin permiso view.configurations',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'No tiene permisos para ver configuraciones' },
        code: { type: 'number', example: 403 },
        status: { type: 'string', example: 'error' }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Configuración no encontrada',
    schema: {
      example: {
        message: 'Configuración con ID 999 no encontrada',
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
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ConfigurationResponse> {
    this.logger.log(`🔍 Consultando configuración con ID: ${id}`);
    
    const rawConf = await this.configurationsService.findOne(id);
    const conf = plainToInstance(ResponseConfigurationDto, rawConf);
    
    return {
      customMessage: 'Configuración obtenida exitosamente',
      configurations: conf,
    }
  }

  @Patch(':id')
  @Permissions('update.configurations')
  @ApiOperation({ 
    summary: 'Actualizar configuración', 
    description: 'Actualiza los datos de una configuración existente. Solo se actualizan los campos proporcionados (actualización parcial).' 
  })
  @ApiParam({ 
    name: 'id', 
    type: Number, 
    description: 'Identificador único de la configuración a actualizar',
    example: 1
  })
  @ApiBody({
    type: UpdateConfigurationDto,
    description: 'Datos a actualizar de la configuración',
    examples: {
      cambiarMoneda: {
        summary: 'Cambiar moneda',
        value: {
          currencyId: 2
        }
      },
      actualizarColores: {
        summary: 'Actualizar paleta de colores',
        value: {
          colorPalette: '#FF0000,#00FF00,#0000FF'
        }
      },
      configuracionCompleta: {
        summary: 'Actualización completa',
        value: {
          currencyId: 1,
          timezoneId: 2,
          colorPalette: '#FFFFFF,#000000,#007BFF'
        }
      }
    }
  })
  @ApiOkResponse({
    description: 'Configuración actualizada exitosamente',
    type: SwaggerConfigurationResponse
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o sin cambios',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'No se detectaron cambios para actualizar' },
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
    description: 'Sin permiso update.configurations',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'No tiene permisos para actualizar configuraciones' },
        code: { type: 'number', example: 403 },
        status: { type: 'string', example: 'error' }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Configuración no encontrada',
    schema: {
      example: {
        message: 'Configuración con ID 999 no encontrada',
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
  async update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateConfigurationDto): Promise<ConfigurationResponse> {
    this.logger.log(`🔧 Actualizando configuración con ID: ${id}`);
    
    const rawConf = await this.configurationsService.update(id, data);
    const conf = plainToInstance(ResponseConfigurationDto, rawConf);
    
    return {
      customMessage: 'Configuración actualizada exitosamente',
      configurations: conf,
    }
  }
}

import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, ParseIntPipe, Logger } from '@nestjs/common';
import { CollectorsService } from './collectors.service';
import { CreateCollectorDto, UpdateCollectorDto, CollectorPaginationDto, ResponseCollectorDto } from './dto';
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
import { SwaggerCollectorListResponse, SwaggerCollectorResponse } from './interfaces/collector-responses.interface';
import { CollectorListResponse, CollectorResponse } from './interfaces';

/**
 * Controlador para la gestión de cobradores
 * 
 * Este controlador maneja las operaciones HTTP relacionadas con el personal de cobranza.
 * Los cobradores son elementos fundamentales del sistema ya que son los responsables
 * de realizar la cobranza en campo y registrar los recaudos en sus rutas asignadas.
 * 
 * Funcionalidades principales:
 * - Registro y gestión de cobradores
 * - Asignación de zonas y rutas de cobranza
 * - Control de activación/desactivación de personal
 * - Consultas con filtros para administración
 * - Integración con sistema de usuarios
 * 
 * Los cobradores son clave para:
 * - Ejecución de la estrategia de cobranza
 * - Control territorial por zonas geográficas
 * - Gestión de recursos humanos especializados
 * - Trazabilidad de recaudos por responsable
 * 
 * @version 1.0.0
 * @author Sistema de Gestión de Préstamos
 */
@ApiTags('Collectors')
@ApiBearerAuth()
@ApiExtraModels(ResponseCollectorDto, SwaggerCollectorListResponse, SwaggerCollectorResponse)
@Controller('collectors')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CollectorsController {
  private readonly logger = new Logger(CollectorsController.name);

  constructor(private readonly collectorsService: CollectorsService) {}

  @Post()
  @Permissions('create.collectors')
  @ApiOperation({ 
    summary: 'Crear cobrador', 
    description: 'Registra un nuevo cobrador en el sistema con validación de unicidad de documento y email. Crea automáticamente un usuario asociado con rol de cobrador para acceso al sistema.' 
  })
  @ApiBody({ 
    type: CreateCollectorDto,
    description: 'Datos del cobrador a registrar',
    examples: {
      cobradorCompleto: {
        summary: 'Cobrador con todos los datos',
        value: {
          firstName: 'María Elena',
          lastName: 'Rodríguez García',
          documentNumber: '87654321',
          birthDate: '1985-03-15',
          phone: '3001234567',
          address: 'Calle 45 #23-15, Barrio Centro',
          email: 'maria.rodriguez@empresa.com',
          typeDocumentIdentificationId: 1,
          genderId: 2,
          zoneId: 2
        }
      },
      cobradorBasico: {
        summary: 'Cobrador con datos mínimos',
        value: {
          firstName: 'Carlos',
          lastName: 'Pérez',
          documentNumber: '12345678',
          birthDate: '1990-05-20',
          phone: '3009876543',
          address: 'Carrera 20 #30-45',
          email: 'carlos.perez@empresa.com',
          typeDocumentIdentificationId: 1,
          genderId: 1
        }
      }
    }
  })
  @ApiCreatedResponse({ 
    description: 'Cobrador creado exitosamente',
    type: SwaggerCollectorResponse,
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Cobrador creado correctamente' },
        code: { type: 'number', example: 201 },
        status: { type: 'string', example: 'success' },
        data: {
          properties: {
            collector: { $ref: getSchemaPath(ResponseCollectorDto) }
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({ 
    description: 'Datos inválidos o conflictos de unicidad',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', example: 400 },
        status: { type: 'string', example: 'error' }
      },
      examples: {
        documentoDuplicado: {
          summary: 'Documento ya existe',
          value: {
            message: 'El número de documento ya está registrado.',
            code: 400,
            status: 'error'
          }
        },
        emailDuplicado: {
          summary: 'Email ya existe',
          value: {
            message: 'El email ya está registrado.',
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
          example: ['Los nombres son obligatorios', 'El email debe ser válido']
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
    description: 'Sin permiso create.collectors',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'No tiene permisos para crear cobradores' },
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
  async create(@Body() createCollectorDto: CreateCollectorDto): Promise<CollectorResponse> {
    const raw = await this.collectorsService.create(createCollectorDto);
    const collector = plainToInstance(ResponseCollectorDto, raw, { 
      excludeExtraneousValues: true 
    });
    
    return { 
      customMessage: 'Cobrador creado correctamente',
      collector 
    };
  }

  @Get()
  @Permissions('view.collectors')
  @ApiOperation({ 
    summary: 'Listar cobradores', 
    description: 'Obtiene una lista paginada de cobradores con filtros. Permite filtrar por estado activo para consultas administrativas y reportes de personal.' 
  })
  @ApiQuery({ name: 'page', required: false, schema: { type: 'integer', example: 1, minimum: 1 }, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', example: 10, minimum: 1, maximum: 100 }, description: 'Elementos por página' })
  @ApiQuery({ name: 'isActive', required: false, schema: { type: 'boolean', example: true }, description: 'Filtrar por estado activo' })
  @ApiOkResponse({
    description: 'Lista de cobradores obtenida correctamente',
    type: SwaggerCollectorListResponse
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
        parametrosInvalidos: {
          summary: 'Parámetros inválidos',
          value: {
            message: 'Los parámetros de consulta no son válidos',
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
    description: 'Sin permiso view.collectors',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'No tiene permisos para ver cobradores' },
        code: { type: 'number', example: 403 },
        status: { type: 'string', example: 'error' }
      }
    }
  })
  @ApiNotFoundResponse({ 
    description: 'No se encontraron cobradores',
    schema: {
      example: {
        message: 'No se encontraron cobradores para los criterios especificados',
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
  async findAll(@Query() paginationDto: CollectorPaginationDto): Promise<CollectorListResponse> {
    const { rawCollectors, meta } = await this.collectorsService.findAll(paginationDto);
    
    const collectors = plainToInstance(ResponseCollectorDto, rawCollectors, {
      excludeExtraneousValues: true
    });

    return {
      customMessage: collectors.length > 0 
        ? 'Cobradores obtenidos correctamente' 
        : 'No se encontraron cobradores para los criterios especificados',
      collectors,
      meta
    };
  }

  @Get(':id')
  @Permissions('view.collectors')
  @ApiOperation({ 
    summary: 'Obtener cobrador por ID', 
    description: 'Obtiene los detalles completos de un cobrador específico incluyendo información de zona asignada y usuario asociado.' 
  })
  @ApiParam({ 
    name: 'id', 
    type: Number, 
    description: 'Identificador único del cobrador',
    example: 1
  })
  @ApiOkResponse({
    description: 'Cobrador encontrado correctamente',
    type: SwaggerCollectorResponse
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
    description: 'Sin permiso view.collectors',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'No tiene permisos para ver cobradores' },
        code: { type: 'number', example: 403 },
        status: { type: 'string', example: 'error' }
      }
    }
  })
  @ApiNotFoundResponse({ 
    description: 'Cobrador no encontrado',
    schema: {
      example: {
        message: 'Cobrador no encontrado',
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
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<CollectorResponse> {
    const raw = await this.collectorsService.findOne(id);
    const collector = plainToInstance(ResponseCollectorDto, raw, {
      excludeExtraneousValues: true
    });

    return {
      customMessage: 'Cobrador obtenido correctamente',
      collector
    };
  }

  @Patch(':id')
  @Permissions('update.collectors')
  @ApiOperation({ 
    summary: 'Actualizar cobrador', 
    description: 'Actualiza los datos de un cobrador existente. Solo se actualizan los campos proporcionados (actualización parcial). Incluye validación de unicidad para documento y email.' 
  })
  @ApiParam({ 
    name: 'id', 
    type: Number, 
    description: 'Identificador único del cobrador a actualizar',
    example: 1
  })
  @ApiBody({ 
    type: UpdateCollectorDto,
    description: 'Datos a actualizar del cobrador',
    examples: {
      cambiarZona: {
        summary: 'Cambiar zona asignada',
        value: {
          zoneId: 3
        }
      },
      actualizarDatos: {
        summary: 'Actualizar información personal',
        value: {
          phone: '3001111111',
          address: 'Nueva dirección #123',
          email: 'nuevo.email@empresa.com'
        }
      },
      desactivar: {
        summary: 'Desactivar cobrador',
        value: {
          isActive: false
        }
      }
    }
  })
  @ApiOkResponse({ 
    description: 'Cobrador actualizado exitosamente',
    type: SwaggerCollectorResponse
  })
  @ApiBadRequestResponse({ 
    description: 'No se detectaron cambios o conflictos de unicidad',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        code: { type: 'number', example: 400 },
        status: { type: 'string', example: 'error' }
      },
      examples: {
        sinCambios: {
          summary: 'No se detectaron cambios',
          value: {
            message: 'No se detectaron cambios.',
            code: 400,
            status: 'error'
          }
        },
        emailDuplicado: {
          summary: 'Email ya existe',
          value: {
            message: 'El email ya está registrado.',
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
    description: 'Sin permiso update.collectors',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'No tiene permisos para actualizar cobradores' },
        code: { type: 'number', example: 403 },
        status: { type: 'string', example: 'error' }
      }
    }
  })
  @ApiNotFoundResponse({ 
    description: 'Cobrador no encontrado',
    schema: {
      example: {
        message: 'Cobrador no encontrado',
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
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateCollectorDto: UpdateCollectorDto): Promise<CollectorResponse> {
    const raw = await this.collectorsService.update(id, updateCollectorDto);
    const collector = plainToInstance(ResponseCollectorDto, raw, {
      excludeExtraneousValues: true
    });

    return {
      customMessage: 'Cobrador actualizado correctamente',
      collector
    };
  }
}

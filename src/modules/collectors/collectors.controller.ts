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

  @Get()
  @Permissions('view.collectors')
  @ApiOperation({ summary: 'Listar cobradores', description: 'Retorna lista paginada de cobradores.' })
  @ApiQuery({ name: 'page', required: false, schema: { type: 'integer', example: 1 } })
  @ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', example: 10 } })
  @ApiQuery({ name: 'isActive', required: false, schema: { type: 'boolean', example: true } })
  @ApiOkResponse({
    description: 'Listado obtenido',
    examples: {
      'success': {
        summary: 'Lista obtenida exitosamente',
        value: {
          customMessage: 'Cobradores obtenidos correctamente',
          collectors: [
            {
              id: 1,
              firstName: 'Juan',
              lastName: 'Pérez',
              documentNumber: '12345678',
              email: 'juan.perez@cobradores.com',
              phone: '+57 300 123 4567',
              birthDate: '1990-05-15',
              isActive: true,
              createdAt: '2024-01-15T10:30:00.000Z',
              updatedAt: '2024-01-20T14:45:00.000Z'
            },
            {
              id: 2,
              firstName: 'María',
              lastName: 'García',
              documentNumber: '87654321',
              email: 'maria.garcia@cobradores.com',
              phone: '+57 300 987 6543',
              birthDate: '1985-08-22',
              isActive: true,
              createdAt: '2024-01-16T11:30:00.000Z',
              updatedAt: '2024-01-21T15:45:00.000Z'
            }
          ],
          meta: {
            total: 25,
            page: 1,
            lastPage: 3,
            limit: 10,
            hasNextPage: true
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({ 
    description: 'No existen registros',
    examples: {
      'no-records': {
        summary: 'No se encontraron registros',
        value: {
          customMessage: 'No existen registros',
          collectors: [],
          meta: {
            total: 0,
            page: 1,
            lastPage: 0,
            limit: 10,
            hasNextPage: false
          }
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ 
    description: 'No autenticado',
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
    description: 'Sin permiso view.collectors',
    examples: {
      'insufficient-permissions': {
        summary: 'Sin permisos para ver cobradores',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para ver los cobradores',
          error: 'Forbidden'
        }
      }
    }
  })
  @ApiInternalServerErrorResponse({ 
    description: 'Error interno',
    examples: {
      'server-error': {
        summary: 'Error interno del servidor',
        value: {
          statusCode: 500,
          message: 'Error interno del servidor al obtener los cobradores',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async findAll(
    @Query() collectorPaginationDto: CollectorPaginationDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CollectorListResponse> {
    const { rawCollectors, meta } = await this.collectorsService.findAll(collectorPaginationDto);
    const collectorsArray = Array.isArray(rawCollectors) ? rawCollectors : [rawCollectors];

    if (collectorsArray.length === 0) {
      res.status(404);
      return {
        customMessage: 'No existen registros',
        collectors: [],
        meta,
      };

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
    description: 'Cobrador encontrado',
    examples: {
      'success': {
        summary: 'Cobrador encontrado exitosamente',
        value: {
          customMessage: 'Cobrador obtenido correctamente',
          collector: {
            id: 1,
            firstName: 'Juan',
            lastName: 'Pérez',
            documentNumber: '12345678',
            email: 'juan.perez@cobradores.com',
            phone: '+57 300 123 4567',
            birthDate: '1990-05-15',
            isActive: true,
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-20T14:45:00.000Z'
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({ 
    description: 'Cobrador no encontrado',
    examples: {
      'collector-not-found': {
        summary: 'Cobrador no encontrado',
        value: {
          statusCode: 404,
          message: 'Cobrador con ID 1 no encontrado',
          error: 'Not Found'
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ 
    description: 'No autenticado',
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
    examples: {
      'insufficient-permissions': {
        summary: 'Sin permisos para ver cobrador',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para ver este cobrador',
          error: 'Forbidden'
        }
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
    description: 'Error interno',
    examples: {
      'server-error': {
        summary: 'Error interno del servidor',
        value: {
          statusCode: 500,
          message: 'Error interno del servidor al obtener el cobrador',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CollectorResponse> {
    const rawcollector = await this.collectorsService.findOne(id);

    const collector = plainToInstance(ResponseCollectorDto, rawcollector, {
      excludeExtraneousValues: true,
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
  @Post()
  @Permissions('create.collectors')
  @ApiOperation({ summary: 'Crear cobrador', description: 'Crea un nuevo cobrador y su usuario asociado.' })
  @ApiBody({
    type: CreateCollectorDto,
    description: 'Datos del cobrador a crear',
    examples: {
      'cobrador-basico': {
        summary: 'Cobrador básico',
        description: 'Ejemplo de cobrador con información completa',
        value: {
          firstName: 'Juan',
          lastName: 'Pérez',
          typeDocumentIdentificationId: 1,
          documentNumber: 1234567890,
          birthDate: '2005-05-15',
          genderId: 1,
          phone: '+573001234567',
          email: 'cobrador111@migestor.com',
          address: 'test etes',
          zoneId: 2
        }
      },
      'cobrador-completo': {
        summary: 'Cobrador completo',
        description: 'Ejemplo de cobrador con otra zona y datos diferentes',
        value: {
          firstName: 'Ana Lucía',
          lastName: 'Martínez López',
          typeDocumentIdentificationId: 1,
          documentNumber: 45678901,
          birthDate: '1992-07-25',
          genderId: 2,
          phone: '+57 300 777 8899',
          email: 'ana.martinez@migestor.com',
          address: 'Calle 123 #45-67',
          zoneId: 1
        }
      }
    }
  })
  @ApiCreatedResponse({
    description: 'Cobrador creado',
    examples: {
      'success': {
        summary: 'Cobrador creado exitosamente',
        value: {
          customMessage: 'Cobrador creado correctamente',
          collector: {
            id: 3,
            firstName: 'Juan',
            lastName: 'Pérez',
            typeDocumentIdentificationId: 1,
            documentNumber: 1234567890,
            birthDate: '2005-05-14',
            genderId: 1,
            phone: '+573001234567',
            address: 'test etes',
            zoneId: 2,
            userId: 5,
            zone: {
              id: 2,
              name: 'Centro',
              code: 'CTR'
            },
            user: {
              id: 5,
              email: 'cobrador111@migestor.com',
              name: 'Juan Pérez'
            },
            createdAt: '2025-09-23 14:30:35',
            updatedAt: '2025-09-23 14:30:35'
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({ 
    description: 'Violación de unicidad o datos inválidos',
    examples: {
      'duplicate-document': {
        summary: 'Documento ya registrado',
        value: {
          statusCode: 400,
          message: 'El número de documento ya está registrado.',
          error: 'Bad Request'
        }
      },
      'duplicate-email': {
        summary: 'Email ya registrado',
        value: {
          statusCode: 400,
          message: 'El email ya está registrado en el sistema.',
          error: 'Bad Request'
        }
      }
    }
  })
  @ApiUnprocessableEntityResponse({ 
    description: 'Error de validación',
    examples: {
      'validation-error': {
        summary: 'Errores de validación',
        value: {
          statusCode: 422,
          message: [
            'firstName no debe estar vacío',
            'email debe ser un email válido',
            'documentNumber debe tener al menos 6 caracteres',
            'birthDate debe ser una fecha válida'
          ],
          error: 'Unprocessable Entity'
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
    description: 'No autenticado',
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
    examples: {
      'insufficient-permissions': {
        summary: 'Sin permisos para crear cobradores',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para crear cobradores',
          error: 'Forbidden'
        }
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
    description: 'Error interno',
    examples: {
      'server-error': {
        summary: 'Error interno del servidor',
        value: {
          statusCode: 500,
          message: 'Error interno del servidor al crear el cobrador',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async create(
    @Body() data: CreateCollectorDto,
  ): Promise<CollectorResponse> {
    const rawcollector = await this.collectorsService.create(data);

    const collector = plainToInstance(ResponseCollectorDto, rawcollector, {
      excludeExtraneousValues: true,
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
  @ApiOperation({ summary: 'Actualizar cobrador', description: 'Actualiza campos del cobrador (solo cambios detectados).' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({
    type: UpdateCollectorDto,
    description: 'Datos del cobrador a actualizar (campos opcionales)',
    examples: {
      'actualizar-email': {
        summary: 'Actualizar solo email',
        description: 'Ejemplo actualizando únicamente el email',
        value: {
          email: 'nuevo.email@cobradores.com'
        }
      },
      'actualizar-completo': {
        summary: 'Actualización completa',
        description: 'Ejemplo actualizando múltiples campos',
        value: {
          firstName: 'Carlos Alberto',
          lastName: 'Rodríguez Actualizado',
          email: 'carlos.actualizado@cobradores.com',
          phone: '+57 300 999 8888',
          address: 'Nueva dirección 456 #78-90'
        }
      },
      'cambiar-estado': {
        summary: 'Cambiar estado',
        description: 'Ejemplo desactivando el cobrador',
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
    description: 'Actualizado',
    examples: {
      'success': {
        summary: 'Cobrador actualizado exitosamente',
        value: {
          customMessage: 'Cobrador actualizado correctamente',
          collector: {
            id: 1,
            firstName: 'Carlos Alberto',
            lastName: 'Rodríguez Actualizado',
            documentNumber: '98765432',
            email: 'carlos.actualizado@cobradores.com',
            phone: '+57 300 999 8888',
            birthDate: '1988-03-10',
            isActive: true,
            updatedAt: '2024-01-20T14:45:00.000Z'
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({ 
    description: 'Sin cambios o unicidad',
    examples: {
      'no-changes': {
        summary: 'No se detectaron cambios',
        value: {
          statusCode: 400,
          message: 'No se detectaron cambios.',
          error: 'Bad Request'
        }
      },
      'duplicate-email': {
        summary: 'Email ya existe',
        value: {
          statusCode: 400,
          message: 'El email ya está registrado por otro cobrador.',
          error: 'Bad Request'
        }
      }
    }
  })
  @ApiNotFoundResponse({ 
    description: 'No existe',
    examples: {
      'collector-not-found': {
        summary: 'Cobrador no encontrado',
        value: {
          statusCode: 404,
          message: 'Cobrador con ID 1 no encontrado',
          error: 'Not Found'
        }
      }
    }
  })
  @ApiUnprocessableEntityResponse({ 
    description: 'Validación fallida',
    examples: {
      'validation-error': {
        summary: 'Errores de validación',
        value: {
          statusCode: 422,
          message: [
            'email debe ser un email válido',
            'phone debe tener un formato válido'
          ],
          error: 'Unprocessable Entity'
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
    description: 'No autenticado',
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
    examples: {
      'insufficient-permissions': {
        summary: 'Sin permisos para actualizar cobradores',
        value: {
          statusCode: 403,
          message: 'No tienes permisos para actualizar cobradores',
          error: 'Forbidden'
        }
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
    description: 'Error interno',
    examples: {
      'server-error': {
        summary: 'Error interno del servidor',
        value: {
          statusCode: 500,
          message: 'Error interno del servidor al actualizar el cobrador',
          error: 'Internal Server Error'
        }
      }
    }
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCollectorDto,
  ): Promise<CollectorResponse> {
    const rawcollector = await this.collectorsService.update(id, dto);

    const collector = plainToInstance(ResponseCollectorDto, rawcollector, {
      excludeExtraneousValues: true,
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
